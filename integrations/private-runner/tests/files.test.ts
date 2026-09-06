import assert from 'node:assert/strict';
import test from 'node:test';
import * as fs from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MAX_INPUT_BYTES, PrivateRunnerError } from '../src/core';
import {
  readBoundedFile,
  writeExclusiveJson,
  type FileOperations,
} from '../src/files';

async function temporary(run: (directory: string) => Promise<void>) {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'iswebmcp-private-files-'),
  );
  try {
    await run(directory);
  } finally {
    const tempRoot = await fs.realpath(os.tmpdir());
    const target = await fs.realpath(directory);
    assert.equal(path.dirname(target).toLowerCase(), tempRoot.toLowerCase());
    assert.ok(path.basename(target).startsWith('iswebmcp-private-files-'));
    assert.notEqual(target.toLowerCase(), tempRoot.toLowerCase());
    await fs.rm(target, { recursive: true, force: true });
  }
}

void test('bounded regular files preserve bytes exactly, including the 2 MiB boundary', async () => {
  await temporary(async (directory) => {
    const target = path.join(directory, 'input.html');
    for (const bytes of [
      Buffer.from('<p>owned fixture</p>'),
      Buffer.alloc(MAX_INPUT_BYTES, 32),
    ]) {
      await fs.writeFile(target, bytes);
      assert.deepEqual(await readBoundedFile(target), bytes);
    }
    for (const bytes of [Buffer.alloc(0), Buffer.alloc(MAX_INPUT_BYTES + 1)]) {
      await fs.writeFile(target, bytes);
      await assert.rejects(readBoundedFile(target), { code: 'INVALID_SIZE' });
    }
    await assert.rejects(readBoundedFile(directory), {
      code: 'NOT_REGULAR_FILE',
    });
  });
});

void test('explicit remote, URL, device, extended and alternate-stream paths are refused before IO', async () => {
  let calls = 0;
  const operations: FileOperations = {
    lstat: async () => {
      calls += 1;
      throw new Error('unexpected IO');
    },
    open: async () => {
      calls += 1;
      throw new Error('unexpected IO');
    },
  };
  for (const target of [
    'https://private.invalid/a',
    'file:///private/a',
    '\\\\server\\share\\a',
    '//server/share/a',
    '\\\\?\\C:\\a',
    '\\\\.\\pipe\\a',
    '\\??\\C:\\a',
    'a.html:secret',
    'bad\0name',
  ]) {
    await assert.rejects(
      readBoundedFile(target, operations),
      { code: 'INVALID_PATH' },
      target,
    );
    await assert.rejects(
      writeExclusiveJson(target, {}, operations),
      { code: 'INVALID_PATH' },
      target,
    );
  }
  assert.equal(calls, 0);
});

void test('pre-open mutation and mutation during bounded reading fail closed', async () => {
  await temporary(async (directory) => {
    const target = path.join(directory, 'input.html');
    for (const mode of [
      'before-open-stat',
      'growth-during-read',
      'truncate-during-read',
    ]) {
      await fs.writeFile(target, '<p>owned stable fixture</p>');
      const operations: FileOperations = {
        lstat: fs.lstat,
        open: async (filename, flags, permissions) => {
          const handle = await fs.open(filename, flags, permissions);
          if (mode === 'before-open-stat')
            await fs.appendFile(filename, 'changed');
          else {
            const originalRead = handle.read.bind(handle);
            let changed = false;
            handle.read = (async (...args: Parameters<FileHandle['read']>) => {
              const result = await originalRead(...args);
              if (!changed) {
                changed = true;
                if (mode === 'growth-during-read')
                  await fs.appendFile(filename, 'changed');
                else await fs.truncate(filename, 1);
              }
              return result;
            }) as FileHandle['read'];
          }
          return handle;
        },
      };
      await assert.rejects(
        readBoundedFile(target, operations),
        { code: 'FILE_CHANGED' },
        mode,
      );
    }
  });
});

void test('path identity replacement after opening is rejected even with equal-sized data', async () => {
  await temporary(async (directory) => {
    const target = path.join(directory, 'input.html');
    await fs.writeFile(target, 'owned fixture 1');
    const operations: FileOperations = {
      lstat: fs.lstat,
      open: async (filename, flags, permissions) => {
        const handle = await fs.open(filename, flags, permissions);
        await fs.rename(filename, path.join(directory, 'original.html'));
        await fs.writeFile(filename, 'owned fixture 2');
        return handle;
      },
    };
    await assert.rejects(readBoundedFile(target, operations), {
      code: 'FILE_CHANGED',
    });
  });
});

void test('exclusive output preserves existing bytes and creates restrictive files where supported', async () => {
  await temporary(async (directory) => {
    const target = path.join(directory, 'report.json');
    await writeExclusiveJson(target, { owned: true });
    assert.deepEqual(JSON.parse(await fs.readFile(target, 'utf8')), {
      owned: true,
    });
    if (process.platform !== 'win32')
      assert.equal((await fs.stat(target)).mode & 0o777, 0o600);
    const original = await fs.readFile(target);
    await assert.rejects(writeExclusiveJson(target, { replacement: true }), {
      code: 'OUTPUT_EXISTS',
    });
    assert.deepEqual(await fs.readFile(target), original);
    const large = path.join(directory, 'too-large.json');
    await assert.rejects(
      writeExclusiveJson(large, 'x'.repeat(MAX_INPUT_BYTES)),
      { code: 'OUTPUT_TOO_LARGE' },
    );
    await assert.rejects(fs.stat(large), { code: 'ENOENT' });
  });
});

void test('symlink input and output are refused without changing the target', async (context) => {
  await temporary(async (directory) => {
    const target = path.join(directory, 'original.html');
    const link = path.join(directory, 'link.html');
    await fs.writeFile(target, '<p>unchanged owned fixture</p>');
    try {
      await fs.symlink(target, link, 'file');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        context.skip(
          'Host does not permit file symlinks. Junction paths are separately tested.',
        );
        return;
      }
      throw error;
    }
    const original = await fs.readFile(target);
    await assert.rejects(readBoundedFile(link), { code: 'SYMLINK_REFUSED' });
    await assert.rejects(writeExclusiveJson(link, { replacement: true }));
    assert.deepEqual(await fs.readFile(target), original);
  });
});

void test('symlink or Windows junction parents cannot redirect either input or output', async (context) => {
  await temporary(async (directory) => {
    const real = path.join(directory, 'real');
    const link = path.join(directory, 'linked');
    await fs.mkdir(real);
    await fs.writeFile(path.join(real, 'input.html'), '<p>owned fixture</p>');
    try {
      await fs.symlink(
        real,
        link,
        process.platform === 'win32' ? 'junction' : 'dir',
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        context.skip('Host does not permit link creation.');
        return;
      }
      throw error;
    }
    await assert.rejects(readBoundedFile(path.join(link, 'input.html')), {
      code: 'SYMLINK_REFUSED',
    });
    await assert.rejects(
      writeExclusiveJson(path.join(link, 'report.json'), {}),
      { code: 'SYMLINK_REFUSED' },
    );
    await assert.rejects(fs.stat(path.join(real, 'report.json')), {
      code: 'ENOENT',
    });
  });
});

void test('filesystem errors never expose the submitted path or underlying system message', async () => {
  const operations: FileOperations = {
    lstat: async () => {
      throw Object.assign(new Error('PRIVATE_FILE_PATH'), { code: 'EACCES' });
    },
    open: fs.open,
  };
  await assert.rejects(
    readBoundedFile('PRIVATE_FILE_PATH.html', operations),
    (error) => {
      assert.ok(error instanceof PrivateRunnerError);
      assert.equal(error.code, 'FILE_ACCESS_DENIED');
      assert.ok(!error.message.includes('PRIVATE_FILE_PATH'));
      return true;
    },
  );
});
