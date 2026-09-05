# Contributing to isWebMCP

isWebMCP helps developers inspect and improve agent-ready web applications. Useful contributions include reproducible bug reports, clearer evidence and limitations, accessible workflows, reliable integrations, and tests that catch actual regressions.

The source repository is currently private. The source checkout and pull-request instructions below apply to collaborators with existing access. The public website and integration downloads can be used without GitHub repository access; the MIT license does not imply that the repository is publicly accessible.

## Local setup

Use Node.js 22.13 or newer and npm. From the repository root:

```bash
npm ci
npm run dev
```

Open the development URL printed by Next.js. The standard local workflow needs no account, model API key, or target-site credentials. See `.env.example` for optional deployment settings. URL-attempt persistence is disabled unless a trusted Postgres `DATABASE_URL` is configured; never use a production database for casual local testing.

## Before changing code

- Read [the architecture](docs/architecture.md) and [threat model](docs/threat-model.md) for changes to scanning, evidence, or tool execution.
- Read [content operations](docs/content-operations.md) for editorial work. isWebMCP is an independent product, not a challenge submission.
- Keep changes focused. Preserve unrelated local work and do not change repository or deployment access controls.
- Report security vulnerabilities through [SECURITY.md](SECURITY.md), not a public issue containing an exploit or private data.

## Evidence requirements

Source observations, imported contracts, runtime observations, and measured comparisons establish different things. Preserve provenance and collection dates, state what was not observed, and never present a synthetic replay as an agent trial. WebMCP is experimental; do not imply universal browser support or certification.

WRI v1 is immutable historical evidence. Do not run `index:download`, `index:crawl`, `index:build`, or `index:full`, change its raw attempts, or reinterpret its audited exclusions. Its public integrity state is `audited_partial`: 100,000 scheduled and attempted ranks, 65,380 valid collection outcomes, 34,620 quarantined infrastructure errors, and 36,323 scored rows. It remains frozen, partial, and uncalibrated.

Never access or automate requests to Devpost pages as part of this repository's workflows. Retained challenge documents are superseded history.

## Validate a change

Format the files you changed and run the applicable checks. The production release gates are:

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm audit
npm run build
npx playwright install chromium
npx playwright test
```

`npm run test:e2e` performs the build and browser test steps together. Integration changes also need `npm run integrations:validate`. Browser or tool behavior that cannot be established by automated tests should follow [manual verification](docs/manual-webmcp-test.md), recording the browser, date, and observed result. A passing command from an older commit is not evidence for the current change.

## Propose and release

Open a focused pull request explaining the concrete problem, resulting behavior, validation, and remaining limitations. Link the canonical primary source for technical or editorial claims; do not paste third-party article bodies. Avoid including environment files, credentials, local reports, or unrelated generated output.

Production releases use the existing GitHub integration with native Next.js on Vercel. After an authorized merge or push, verify GitHub Actions and the matching Vercel deployment and inspect the production result. No OpenAI Sites or Cloudflare adapter deployment is supported.

The MIT license applies to this repository. Public integration download packages are intentional release assets; regenerate them only when the underlying integration changes and review the resulting diff.
