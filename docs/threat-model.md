# Threat model

## Assets and trust boundaries

Protected assets are service availability, report integrity, visitor privacy, the public hosting environment, and clear evidence provenance. The application does not request target credentials or maintain user accounts.

Untrusted inputs include:

- Quick Scan URLs and goals;
- DNS and HTTP responses from target sites;
- redirect locations, headers, MIME declarations, and response bodies;
- imported JSON tool manifests;
- every WebMCP tool call;
- report IDs and finding IDs in routes or tool inputs.

The primary boundaries are the browser/API origin, public outbound fetch path, manifest normalization boundary, ephemeral store, and browser WebMCP registration surface.

## Abuse cases and controls

| Threat                                            | Current controls                                                                                                                                                                                                                               | Residual risk                                                                                                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSRF to local or metadata services                | HTTP(S) only; no credentials; standard ports; local/private/reserved/special-use host and address blocks; A/AAAA verification on every hop; manual redirect validation; Cloudflare outbound fetch proxy restricted to public Internet services | Worker fetch cannot pin the socket to the preflight address. DNS rebinding or split-horizon resolution remains an application-level TOCTOU gap. Use address-pinned controlled egress where that guarantee is required. |
| Redirect laundering                               | At most three manual redirects; normalize, host-charge, and re-resolve before each fetch                                                                                                                                                       | A public redirect chain can still consume bounded outbound work.                                                                                                                                                       |
| Slow or huge requests/responses                   | Caller admission before request parsing; request-body, DNS, hop, total, redirect, declared-size, streamed-size, and exact MIME limits                                                                                                          | Isolate-local admission is not a distributed denial-of-service control.                                                                                                                                                |
| Target authentication leakage                     | No cookies, authorization headers, browser session, or embedded URL credentials                                                                                                                                                                | Public pages can still intentionally vary content by scanner IP or user agent.                                                                                                                                         |
| Stored/reflected script injection                 | Fetched HTML is never mounted; scripts/styles/templates/examples are excluded from displayed evidence; report fields are normalized text; security headers deny framing and objects                                                            | Framework or dependency defects remain possible; keep dependencies patched.                                                                                                                                            |
| Prompt injection through fetched text             | Target text is labeled untrusted evidence, not inserted into an LLM prompt by this application; `untrustedContentHint` is used for applicable readers                                                                                          | A downstream agent decides how it interprets returned text; callers must continue treating it as untrusted.                                                                                                            |
| Manifest data exfiltration or prototype pollution | 128 KB/50-tool cap; bounded iterative traversal; depth/node limits; forbidden prototype keys; credential-pattern rejection; schema summary allowlist                                                                                           | Pattern checks cannot identify every secret. Users must sanitize before import.                                                                                                                                        |
| Inflated conformance claims                       | Imported evidence is visibly unverified; unknown output/state/recovery dimensions stay null; immutable derived reports retain provenance                                                                                                       | A user can still provide false metadata; only supported-browser runtime evidence can resolve it.                                                                                                                       |
| Tool misuse or state divergence                   | Exact runtime input checks, stable enums/IDs, ordered demo state constraints, shared UI/tool services, structured errors, visible updates, deterministic finish assertions                                                                     | Current lab tools are synthetic. Real consequential tools need authentication, authorization, idempotency, confirmation, audit, and domain-specific controls.                                                          |
| Stale route capabilities                          | Route/mode-scoped `AbortSignal` cleanup; report handlers require visible route/report match                                                                                                                                                    | Browser implementations are experimental; manual lifecycle tests remain required.                                                                                                                                      |
| Cross-site API use                                | JSON content type and Origin/Sec-Fetch-Site checks; no permissive CORS; CSP, frame denial, referrer policy, origin isolation, and `tools=(self)`                                                                                               | Non-browser clients can omit browser metadata; rate/target guards remain the server-side security controls.                                                                                                            |

## Deliberate non-claims

- Quick Scan is not a runtime browser, authenticated crawler, vulnerability scanner, or WebMCP conformance certification.
- Source hints do not prove tool registration or successful execution.
- Imported tools do not prove authorization, output truth, side effects, or UI synchronization.
- The controlled replay does not measure arbitrary model routing accuracy.
- The hosted MVP does not provide durable reports or globally coordinated rate limits.
- No token, cost, or ROI savings are claimed without measured model-specific evidence.

## Production hardening path

Before using the scanner as a high-volume service:

1. Put outbound requests behind address-pinned egress with explicit destination policy.
2. Use durable reports with tenant-aware authorization and retention controls.
3. Move limits and concurrency coordination to global edge primitives.
4. Add abuse monitoring, target-owner opt-out, and operational alerting.
5. Run independent security testing against harmless owned targets.
6. Maintain supported-browser runtime and adversarial model eval suites.
