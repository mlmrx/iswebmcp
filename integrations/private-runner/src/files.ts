import { constants, type BigIntStats } from 'node:fs';
import * as fs from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { MAX_INPUT_BYTES, PrivateRunnerError } from './core';

export interface FileOperations {
  lstat: (filePath: string, options: { bigint: true }) => Promise<BigIntStats>;
  open: (filePath: string, flags: number, mode?: number) => Promise<FileHandle>;
}

function fileError(error: unknown): PrivateRunnerError {
  if (error instanceof PrivateRunnerError) return error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : undefined;
  if (code === 'EEXIST')
    return new PrivateRunnerError(
      'OUTPUT_EXISTS',
      'Output already exists. Choose a new file; existing files are never overwritten.',
    );
  if (code === 'ENOENT')
    return new PrivateRunnerError(
      'FILE_NOT_FOUND',
      'An input file or output directory does not exist.',
    );
  if (code === 'EACCES' || code === 'EPERM')
    return new PrivateRunnerError(
      'FILE_ACCESS_DENIED',
      'File access was denied. Check permissions without sharing sensitive paths.',
    );
  return new PrivateRunnerError(
    'FILE_IO_ERROR',
    'A local file operation failed. No filesystem path is included in this error.',
  );
}

function sameIdentity(left: BigIntStats, right: BigIntStats): boolean {
  // On Windows Node's path lstat may return dev=0 while fstat returns the volume
  // serial. Compare the file ID on the already checked same path in that case;
  // links/junctions are refused separately. This is not a malicious-FS sandbox.
  const sameDevice =
    left.dev === right.dev ||
    (process.platform === 'win32' &&
      (left.dev === BigInt(0) || right.dev === BigInt(0)));
  return (
    sameDevice && left.ino === right.ino && left.isFile() && right.isFile()
  );
}

function unchanged(left: BigIntStats, right: BigIntStats): boolean {
  return (
    sameIdentity(left, right) &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

function resolvedLocalPath(filePath: string): string {
  if (
    !filePath ||
    filePath.includes('\0') ||
    /^[a-z][a-z\d+.-]*:\/\//i.test(filePath)
  )
    throw new PrivateRunnerError(
      'INVALID_PATH',
      'Provide a local filesystem path, not a URL.',
    );
  if (/^(?:\\\\|\/\/|\\\?\?\\)/.test(filePath))
    throw new PrivateRunnerError(
      'INVALID_PATH',
      'UNC, network-share, and device paths are not supported. Use a trusted local disk.',
    );
  const resolved = path.resolve(filePath);
  if (/^(?:\\\\|\/\/)/.test(resolved))
    throw new PrivateRunnerError(
      'INVALID_PATH',
      'The working directory must be on a trusted local disk.',
    );
  // Reject alternate data-stream syntax as well as ambiguous cross-platform paths.
  if (resolved.slice(path.parse(resolved).root.length).includes(':'))
    throw new PrivateRunnerError(
      'INVALID_PATH',
      'Alternate data streams are not supported.',
    );
  return resolved;
}

async function noSymlinkComponents(
  target: string,
  operations: FileOperations,
  includeLeaf = true,
): Promise<void> {
  let cursor = includeLeaf ? target : path.dirname(target);
  for (;;) {
    const info = await operations.lstat(cursor, { bigint: true });
    if (info.isSymbolicLink())
      throw new PrivateRunnerError(
        'SYMLINK_REFUSED',
        'Symlink or junction paths are not supported. Use a regular file in a trusted directory.',
      );
    if (cursor !== target && !info.isDirectory())
      throw new PrivateRunnerError(
        'INVALID_PATH',
        'A parent path is not a directory.',
      );
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
}

/** Read only the opened bounded regular file; never follow content links or execute HTML. */
export async function readBoundedFile(
  filePath: string,
  operations: FileOperations = fs,
): Promise<Buffer> {
  let handle: FileHandle | undefined;
  let result: Buffer | undefined;
  let failure: PrivateRunnerError | undefined;
  try {
    const target = resolvedLocalPath(filePath);
    await noSymlinkComponents(target, operations);
    const before = await operations.lstat(target, { bigint: true });
    if (!before.isFile() || before.isSymbolicLink())
      throw new PrivateRunnerError(
        'NOT_REGULAR_FILE',
        'Input must be a regular file, not a directory, device, pipe, or link.',
      );
    if (before.size < BigInt(1) || before.size > BigInt(MAX_INPUT_BYTES))
      throw new PrivateRunnerError(
        'INVALID_SIZE',
        'Provide a nonempty regular file no larger than 2 MiB.',
      );
    handle = await operations.open(
      target,
      constants.O_RDONLY |
        (constants.O_NOFOLLOW ?? 0) |
        (constants.O_NONBLOCK ?? 0),
    );
    const opened = await handle.stat({ bigint: true });
    if (!unchanged(before, opened))
      throw new PrivateRunnerError(
        'FILE_CHANGED',
        'Input changed while opening. Export a stable copy and retry.',
      );
    // One extra byte detects growth, while allocation and reading remain bounded.
    const buffer = Buffer.alloc(Number(opened.size) + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        offset,
        buffer.length - offset,
        offset,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    const after = await handle.stat({ bigint: true });
    await noSymlinkComponents(target, operations);
    const named = await operations.lstat(target, { bigint: true });
    if (
      offset !== Number(opened.size) ||
      !unchanged(opened, after) ||
      !unchanged(opened, named)
    )
      throw new PrivateRunnerError(
        'FILE_CHANGED',
        'Input changed during reading. Export a stable copy and retry.',
      );
    result = buffer.subarray(0, offset);
  } catch (error) {
    failure = fileError(error);
  } finally {
    try {
      await handle?.close();
    } catch (error) {
      failure ??= fileError(error);
    }
  }
  if (failure) throw failure;
  if (!result)
    throw new PrivateRunnerError(
      'FILE_IO_ERROR',
      'The local read did not return complete bytes.',
    );
  return result;
}

export async function writeExclusiveJson(
  filePath: string,
  value: unknown,
  operations: FileOperations = fs,
): Promise<void> {
  let handle: FileHandle | undefined;
  let failure: PrivateRunnerError | undefined;
  try {
    const text = `${JSON.stringify(value, null, 2)}\n`;
    if (Buffer.byteLength(text) > MAX_INPUT_BYTES)
      throw new PrivateRunnerError(
        'OUTPUT_TOO_LARGE',
        'Output exceeds the private artifact limit.',
      );
    const target = resolvedLocalPath(filePath);
    await noSymlinkComponents(target, operations, false);
    handle = await operations.open(
      target,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    );
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile())
      throw new PrivateRunnerError(
        'NOT_REGULAR_FILE',
        'Output must be a new regular file.',
      );
    await noSymlinkComponents(target, operations);
    if (!sameIdentity(opened, await operations.lstat(target, { bigint: true })))
      throw new PrivateRunnerError(
        'FILE_CHANGED',
        'Output identity changed. Do not trust the incomplete output.',
      );
    await handle.writeFile(text, { encoding: 'utf8' });
    await handle.sync();
    await noSymlinkComponents(target, operations);
    if (!sameIdentity(opened, await operations.lstat(target, { bigint: true })))
      throw new PrivateRunnerError(
        'FILE_CHANGED',
        'Output identity changed. Do not trust the incomplete output.',
      );
  } catch (error) {
    failure = fileError(error);
  } finally {
    try {
      await handle?.close();
    } catch (error) {
      failure ??= fileError(error);
    }
  }
  if (failure) throw failure;
}
