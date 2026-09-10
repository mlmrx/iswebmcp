# isWebMCP developer kit

A zero-dependency Node SDK and CLI for one public source scan, a saved local report, and a repeatable comparison of source-summary findings. Requires Node 22.13 or later. WebMCP is experimental.

## Install

```sh
npm install --save-dev @iswebmcp/developer-kit
```

The same source is also available in the versioned developer-tools download and in the public repository. Review the privacy and evidence boundaries below before scanning a production URL.

## First scan

With the npm package installed:

```sh
npx iswebmcp scan https://example.com --output .reports/baseline.json
```

From the extracted developer-tools folder or repository root, the equivalent command is:

```sh
node integrations/developer-kit/bin/iswebmcp.mjs scan https://example.com --output .reports/baseline.json
```

Replace the example with a public app you own or are authorized to inspect. No dependency install, API key, or build is required for this command. The client makes one request to `https://iswebmcp.com/api/integrations/scan`. It does not deploy your application or add WebMCP tools to it.

The hosted scanner inspects a bounded public HTTP response. It does not execute JavaScript, sign in, connect to your local development server, invoke tools, or prove an agent completed a task. Apps rendered entirely in the browser may have little useful source evidence. Devpost targets, credentials in URLs, localhost, and IP literals are rejected by this client; the service enforces additional DNS and redirect protections. The API is for native/server clients, not arbitrary browser origins.

## Save and compare after a release

```sh
node integrations/developer-kit/bin/iswebmcp.mjs scan https://example.com --output .reports/current.json --json
node integrations/developer-kit/bin/iswebmcp.mjs compare .reports/baseline.json .reports/current.json --output .reports/diff.json --json
```

Choose fresh output paths on each run. The CLI refuses to overwrite an existing file. Review a new report before explicitly adopting it as the next baseline. Keep your baseline in your own artifact store; a service report ID is not a durable copy.

Scan output is the API summary itself. Comparison output identifies changes by stable `ruleId`, provides regression reasons (`new-problem`, `status-worsened`, `severity-increased`), and lists rule IDs no longer reported. Comparisons require two `iswebmcp-summary/v2` reports, complete source collection and finding inventories, the same final URL, the same nonempty scoring model version, and matching input fingerprints. Imported contract audits are excluded from this source-only gate. Older summaries remain readable but cannot pass the comparison gate: rescan and review a new baseline.

The v2 API returns every finding with `findingsCoverage` declaring total and returned counts. Display titles can change without creating a false new finding. Missing findings are never counted as verified fixes. Actions and recommendations remain bounded display summaries; this gate compares findings only. A same-model comparison can still vary with page content, CDN behavior, geography, and deployment state. Do not use comparisons across preview hostnames as if they were like-for-like measurements.

`comparisonContext` fingerprints the normalized requested URL, actual final URL (including any query), trimmed goal, and source analysis byte limit before report URL redaction. Different effective queries, redirect destinations, goals, or limits refuse comparison even if the displayed URL is identical. Reports created before input provenance was captured have a null context and must be rescanned. The fingerprint does not cover authenticated sessions, browser state, or actual page content, and it is not a signature authenticating saved reports.

| Exit | Meaning                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| `0`  | A complete scan was returned, or no new/worsened partial or failing finding appeared in a comparable summary. |
| `1`  | A comparable summary has at least one new/worsened partial or failing finding.                                |
| `2`  | Invalid arguments/files, unavailable service, partial collection, or reports that cannot be compared.         |

A scan returning `0` can still contain failing findings; the scan command reports collection success. Use `compare` for a regression policy. A comparison returning `0` is not a safety certification, runtime success claim, proof of WebMCP support, or measured improvement. Actionability scores do not gate this CLI.

## SDK

From an application with the npm package installed:

```js
import { scan, compare, IsWebMCPError } from '@iswebmcp/developer-kit';
import { readFile, writeFile } from 'node:fs/promises';

try {
  const current = await scan('https://example.com', { timeoutMs: 20_000 });
  await writeFile('current.json', JSON.stringify(current, null, 2), {
    flag: 'wx',
  });
  const baseline = JSON.parse(await readFile('baseline.json', 'utf8'));
  const result = compare(baseline, current);
  console.log(result.regressionCount, result.limitations);
} catch (error) {
  if (error instanceof IsWebMCPError) console.error(error.code, error.message);
  else throw error;
}
```

`scan` accepts an optional `goal` (300 characters maximum), `includeQuery`, timeout, cancellation signal, HTTPS endpoint override, and fetch implementation for tests. `scan` returns partial summaries as data; callers must inspect `collection` before treating them as complete. `compare` rejects partial summaries. The default timeout is 20 seconds; the maximum is 120 seconds. The client makes no automatic retries, including on rate limits. API errors expose `code`, HTTP `status`, and `retryAfter` when supplied.

## Privacy

The target URL and optional goal are sent to iswebmcp.com. The service records URL attempts and can store the source report; consult the [privacy policy](https://iswebmcp.com/privacy) before sending data. Query strings and fragments are removed **before transmission** by default. `--include-query` explicitly includes the query when it is necessary to select the page; returned service summaries still redact the query. Paths and goal text can contain sensitive information—do not send secrets. No browser cookies or authorization headers are forwarded by this client. Output files can contain app URLs and findings, so choose their retention and visibility deliberately.

Stripping a query can select a different page. If queries determine application behavior, choose that option deliberately and keep it consistent with your baseline.

The comparison context contains a SHA-256 digest, not raw query values or goal text. A deterministic digest is equality metadata, not encryption or anonymization: predictable inputs can be guessed, and saved reports still require appropriate access and retention. Never send secret-bearing inputs.

## Local package and verification

```sh
cd integrations/developer-kit
npm test
npm pack
```

`npm pack` creates `iswebmcp-developer-kit-0.2.0.tgz` locally; it does not publish to a registry. A consumer can install that local tarball and use `import { scan } from '@iswebmcp/developer-kit'` or the installed `iswebmcp` command. The package includes TypeScript declarations and no runtime dependencies.

The test suite uses fake API responses; it makes no external scans. Runtime browser adapters and task-success evaluation are separate work beyond this source-only package.
