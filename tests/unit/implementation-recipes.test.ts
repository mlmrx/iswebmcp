import { describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import {
  searchAdapterCode,
  implementationRecipes,
} from '@/lib/mcp/implementation-recipes';
import { analyzeSource } from '@/lib/scanner';

type Search = (
  query: string,
  options: { signal: AbortSignal; limit: number },
) => Promise<unknown>;
type Tool = {
  name: string;
  annotations: Record<string, boolean>;
  execute: (
    input: unknown,
    options?: { signal: AbortSignal },
  ) => Promise<{
    results: Array<{ id: string; title: string }>;
    returned: number;
  }>;
};
type Context = {
  registerTool: (tool: Tool, options: { signal: AbortSignal }) => Promise<void>;
};
type Register = (
  context: Context | undefined,
  options: { search?: Search; signal?: AbortSignal },
) => Promise<{ supported: boolean; dispose: () => void }>;
// Execute the exact copyable JavaScript, not a separately maintained implementation.
const register = runInNewContext(
  `${searchAdapterCode.replace('export ', '')}; registerSearchTool;`,
  { AbortController, AbortSignal },
) as Register;

async function fixture(
  search: Search = async () => [
    { id: 'one', title: 'Book', secret: 'exclude' },
  ],
  signal?: AbortSignal,
) {
  let tool!: Tool;
  let registrationSignal!: AbortSignal;
  const handle = await register(
    {
      registerTool: async (value, options) => {
        tool = value;
        registrationSignal = options.signal;
      },
    },
    { search, signal },
  );
  return { tool, handle, registrationSignal };
}

describe('copyable implementation recipes', () => {
  it('leaves the UI alone when native support is absent', async () => {
    const search = vi.fn();
    const handle = await register(undefined, { search });
    expect(handle.supported).toBe(false);
    handle.dispose();
    expect(search).not.toHaveBeenCalled();
  });
  it('returns bounded projections from the supplied search service', async () => {
    const search = vi.fn(async () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: String(i),
        title: 'x'.repeat(400),
        secret: 'never return',
      })),
    );
    const { tool, handle } = await fixture(search);
    const result = await tool.execute({ query: '  books  ' });
    expect(search).toHaveBeenCalledWith(
      'books',
      expect.objectContaining({ limit: 20 }),
    );
    expect(result.returned).toBe(20);
    expect(result.results[0]).toEqual({ id: '0', title: 'x'.repeat(300) });
    expect(tool.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: true,
      consequentialHint: false,
    });
    handle.dispose();
  });
  it.each([
    null,
    {},
    { query: '' },
    { query: '   ' },
    { query: 42 },
    { query: 'x'.repeat(201) },
    { query: 'x', extra: true },
  ])(
    'rejects invalid input %# before calling the application',
    async (input) => {
      const search = vi.fn();
      const { tool, handle } = await fixture(search);
      await expect(tool.execute(input)).rejects.toThrow();
      expect(search).not.toHaveBeenCalled();
      handle.dispose();
    },
  );
  it('unregisters on disposal and prevents subsequent execution', async () => {
    const search = vi.fn();
    const { tool, handle, registrationSignal } = await fixture(search);
    handle.dispose();
    expect(registrationSignal.aborted).toBe(true);
    await expect(tool.execute({ query: 'book' })).rejects.toThrow();
    expect(search).not.toHaveBeenCalled();
  });
  it('propagates caller cancellation and refuses late results', async () => {
    const abort = new AbortController();
    let finish!: (rows: unknown) => void;
    let receivedSignal!: AbortSignal;
    const { tool, handle } = await fixture((_query, { signal }) => {
      receivedSignal = signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const pending = tool.execute({ query: 'book' }, { signal: abort.signal });
    abort.abort();
    expect(receivedSignal.aborted).toBe(true);
    finish([{ id: 'one', title: 'Book' }]);
    await expect(pending).rejects.toThrow();
    handle.dispose();
  });
  it('supports effect cleanup while registration is pending', async () => {
    const abort = new AbortController();
    let receivedSignal!: AbortSignal;
    let finish!: () => void;
    const pending = register(
      {
        registerTool: async (_tool, { signal }) => {
          receivedSignal = signal;
          await new Promise<void>((resolve) => {
            finish = resolve;
          });
        },
      },
      { search: async () => [], signal: abort.signal },
    );
    abort.abort();
    expect(receivedSignal.aborted).toBe(true);
    finish();
    (await pending).dispose();
  });
  it('does not replace duplicate registrations or swallow authorization errors', async () => {
    await expect(
      register(
        {
          registerTool: async () => {
            throw new Error('Duplicate');
          },
        },
        { search: async () => [] },
      ),
    ).rejects.toThrow('Duplicate');
    const { tool, handle } = await fixture(async () => {
      throw new Error('Unauthorized');
    });
    await expect(tool.execute({ query: 'book' })).rejects.toThrow(
      'Unauthorized',
    );
    handle.dispose();
  });
  it.each([
    null,
    [{ id: 1, title: 'bad' }],
    [{ id: '', title: 'bad' }],
    [{ id: 'x'.repeat(129), title: 'bad' }],
  ])('rejects an invalid search result %#', async (rows) => {
    const { tool, handle } = await fixture(async () => rows);
    await expect(tool.execute({ query: 'book' })).rejects.toThrow();
    handle.dispose();
  });
  it('provides a form whose label is detected by the actual scanner', () => {
    const html = implementationRecipes['accessible-controls'].files[0].code;
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html,
      status: 200,
      contentType: 'text/html',
      bytesRead: html.length,
      redirects: 0,
    });
    expect(report.counts.forms).toBe(1);
    expect(report.counts.labels).toBe(1);
    expect(html).toContain('for="catalog-query"');
    expect(html).toContain('id="catalog-query"');
  });
});
