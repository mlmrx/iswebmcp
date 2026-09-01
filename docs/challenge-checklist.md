# Challenge release checklist

This file is intentionally truthful. A checked engineering item does not imply submission eligibility.

## Product

- [x] Landing page and safe public Quick Scan
- [x] Evidence report separates source, inferred, imported, runtime, and measured evidence
- [x] Baseline Actionability does not masquerade as WebMCP quality
- [x] WebMCP Implementation Quality appears only with imported/runtime evidence
- [x] WebMCP Lift appears only for comparable completed runs
- [x] Proof Lab uses the same visible UI and services in both modes
- [x] Tool Contract Workbench gives deterministic feedback
- [x] JSON and print exports are visible and account-free
- [x] Mobile navigation, report overflow, metadata, favicon, and social card implemented

## WebMCP

- [x] Twelve top-level imperative tools implemented
- [x] Runtime inputs validated; unknown fields rejected
- [x] Structured expected errors
- [x] Read-only annotations are truthful
- [x] UI and tool handlers share application services/state
- [x] Route- and mode-scoped `AbortSignal` cleanup
- [x] Human interface remains usable without WebMCP
- [ ] Complete the supported-browser/model manual checklist on the final deployed commit
- [ ] Archive the manual tool trace and screenshots

## Security and privacy

- [x] Source-only scanner limitation is visible
- [x] URL, port, IP range, DNS, redirect, MIME, body-size, deadline, caller/host rate, and concurrency guards
- [x] No target cookies, authorization, or credentials
- [x] Target HTML is not retained in reports or rendered as executable content
- [x] Imported evidence is bounded, sanitized, and visibly unverified
- [x] CSP, origin isolation, frame denial, referrer policy, and `tools=(self)` policy
- [x] DNS/fetch address-pinning limitation and isolate-local limits documented
- [ ] Review production deployment headers from the public origin

## Automated release gates

- [ ] `npm ci` from a clean checkout
- [ ] `npm run format:check`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e` in Chromium desktop and mobile projects
- [ ] `npm audit` reports zero unresolved production vulnerabilities
- [ ] GitHub Actions passes on the pushed commit

Update this checklist only with retained release evidence; local passing commands are not automatically a future deployment guarantee.

## Publishing

- [ ] OpenAI Sites deployment is healthy and linked here: `TBD`
- [ ] Social image and metadata resolve on the live origin
- [ ] Custom domain is configured and healthy, or all launch copy uses the actual generated origin
- [ ] Private GitHub repository created and pushed per owner request
- [ ] **Repository made public before challenge submission**
- [x] MIT license exists at repository root
- [ ] Repository URL inserted in site header, README, and Devpost draft
- [ ] Frozen challenge tag created and pushed after final verification

> Blocker: the owner requested a private repository for this build, while the challenge requirements call for a public repository. Keep it private now, but do not submit or claim eligibility until the owner explicitly changes visibility.

## Submission assets

- [x] Devpost copy draft prepared
- [x] 160-second narrated demo script prepared
- [x] Manual WebMCP verification script prepared
- [x] Architecture and threat-model documentation prepared
- [ ] Record final demo with real supported-browser tool calls and audio
- [ ] Add captions and verify final duration is under three minutes
- [ ] Upload video and insert its public link
- [ ] Replace every `TBD` placeholder
- [ ] Re-read current official challenge and Devpost rules immediately before submission
- [ ] Submit Devpost entry

## Freeze record

- Commit: `TBD`
- Tag: `TBD`
- Deployment URL: `TBD`
- Deployment timestamp (UTC): `TBD`
- Manual test environment/date: `TBD`
- Video URL: `TBD`
- Devpost URL: `TBD`
