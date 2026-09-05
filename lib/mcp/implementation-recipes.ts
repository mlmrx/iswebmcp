// These copyable examples are exercised directly by implementation-recipes.test.ts.
export const searchAdapterCode = `export async function registerSearchTool(context, { search, signal } = {}) {
  if (!context || typeof context.registerTool !== 'function') {
    return { supported: false, dispose() {} }; // Keep the ordinary UI working.
  }
  if (typeof search !== 'function') throw new TypeError('Provide your existing authorized search function.');
  const lifetime = new AbortController();
  const registrationSignal = signal
    ? AbortSignal.any([signal, lifetime.signal]) : lifetime.signal;
  registrationSignal.throwIfAborted();
  await context.registerTool({
    name: 'search_catalog',
    description: 'Search the catalog visible to the current user. Returns up to 20 IDs and titles; does not select or purchase anything.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: { query: { type: 'string', minLength: 1, maxLength: 200 } },
      required: ['query']
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
    execute: async (input, options = {}) => {
      if (!input || typeof input.query !== 'string' || Object.keys(input).some(key => key !== 'query')) {
        throw new TypeError('Expected only a query string.');
      }
      const query = input.query.trim();
      if (!query || input.query.length > 200) throw new RangeError('Query must be 1–200 characters.');
      const signals = [registrationSignal, AbortSignal.timeout(10000)];
      if (options.signal) signals.push(options.signal);
      const executionSignal = AbortSignal.any(signals);
      executionSignal.throwIfAborted();
      const rows = await search(query, { signal: executionSignal, limit: 20 });
      executionSignal.throwIfAborted();
      if (!Array.isArray(rows)) throw new TypeError('Search must return an array.');
      const results = rows.slice(0, 20).map(row => {
        if (!row || typeof row.id !== 'string' || !row.id || row.id.length > 128 || typeof row.title !== 'string') {
          throw new TypeError('Each result needs a nonempty id up to 128 characters and a string title.');
        }
        return { id: row.id, title: row.title.slice(0, 300) };
      });
      return { query, results, returned: results.length };
    }
  }, { signal: registrationSignal });
  return { supported: true, dispose: () => lifetime.abort() };
}`;

export const recipeIds = ['search-tool', 'accessible-controls'] as const;

export const implementationRecipes = {
  'search-tool': {
    id: 'search-tool',
    title: 'Expose an existing read-only catalog search',
    evidenceScope: 'implementation-guidance',
    status: 'review-required',
    version: '1.0.0',
    summary:
      'A small browser-side adapter, not a remote MCP server. Wire it to the same authorized search service as your UI; it does not build a search backend or grant an agent access to a browser.',
    prerequisites: [
      'A secure browser context implementing the experimental document.modelContext September 4, 2026 draft. Earlier browser previews may expose a different API; do not silently substitute a polyfill.',
      'An existing read-only search(query, { signal, limit }) function returning an array of { id, title }; enforce current-user authorization and cancellation in that service.',
      'Review result fields for sensitive data and tool descriptions for accuracy. Retain the existing accessible search form.',
    ],
    files: [
      {
        path: 'webmcp-search.mjs',
        language: 'javascript',
        code: searchAdapterCode,
      },
    ],
    setup: [
      "Vanilla JS: import { registerSearchTool } from './webmcp-search.mjs'; then await registerSearchTool(document.modelContext, { search: yourExistingSearch }); retain its dispose function for page teardown.",
      'React: register in an effect using a fresh AbortController; pass its signal and return () => controller.abort() from the effect. Keep the search callback stable, handle registration rejection, and do not register during server rendering.',
      'Registration can reject on duplicate names. Fix the ownership/lifecycle issue rather than replacing another component’s tool.',
    ],
    verification: [
      'On an unsupported browser, confirm the ordinary form still works and supported is false.',
      'In a compatible test browser, discover search_catalog and invoke it with a known query. Compare returned IDs with the ordinary UI under the same identity and data snapshot.',
      'Verify invalid arguments, cancellation, route teardown, authorization failures, and sensitive-field exclusion. Render any returned text as text, never trusted HTML.',
      'Record browser version, task, starting state, trace, and independently checked outcome before claiming runtime readiness. Compare matched UI/tool runs before claiming lift.',
    ],
    limitations: [
      'The example is unit-tested with an injected model context, not certified against shipping browsers or tested on your application.',
      'Abort and timeout are cooperative: the search service must honor the signal. No purchase, write, navigation, deployment, or UI mutation is included.',
      'A source scan may not detect code loaded dynamically. Missing source evidence does not establish that runtime registration failed.',
    ],
    sources: ['https://webmachinelearning.github.io/webmcp/'],
  },
  'accessible-controls': {
    id: 'accessible-controls',
    title: 'Give a search form explicit names and visible results',
    evidenceScope: 'implementation-guidance',
    status: 'review-required',
    version: '1.0.0',
    summary:
      'A semantic HTML starting point for an existing search endpoint. This improves explicit UI structure; it does not add WebMCP or prove agent task success.',
    prerequisites: [
      'Replace /search with your real search route and preserve its authorization and input validation.',
      'Use IDs unique within the page; keep names meaningful to the actual task.',
    ],
    files: [
      {
        path: 'search-form.html',
        language: 'html',
        code: '<form action="/search" method="get" role="search">\n  <label for="catalog-query">Search catalog</label>\n  <input id="catalog-query" name="q" type="search" maxlength="200" required>\n  <button type="submit">Search catalog</button>\n</form>\n<!-- On the results page, provide a heading and visible result count. -->',
      },
    ],
    setup: [
      'Integrate into your existing page, rather than nesting a second form.',
      'For client-rendered results, announce the updated count with a concise status region and preserve keyboard focus.',
    ],
    verification: [
      'Test label activation, keyboard submission, empty input, visible results, and the accessible names in a browser.',
      'Capture baseline and current source summaries for the same URL and scan settings; compare stable finding IDs. A passing comparison is not an accessibility conformance audit.',
    ],
    limitations: [
      'Template only: it does not implement your search endpoint.',
      'Better source structure alone does not prove runtime success, safety, or performance gains.',
    ],
    sources: [
      'https://html.spec.whatwg.org/multipage/forms.html#the-label-element',
    ],
  },
} as const;
