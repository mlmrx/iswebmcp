# Security policy

## Supported version

Security fixes are applied to the current `main` branch and the latest tagged release.

## Reporting a vulnerability

Do not disclose an exploitable issue in a public issue. Use the repository's private security-advisory workflow when available. If that channel is unavailable, contact the repository owner privately and include:

- the affected route, tool, or component;
- a minimal reproduction using a harmless target;
- expected and observed behavior;
- impact and any known mitigations.

Do not test against systems you do not own or have permission to assess. Do not include credentials, private target HTML, access tokens, or personal data in a report.

## Scanner scope

Quick Scan is an unauthenticated, source-only utility. It is not a penetration-testing service, a browser sandbox, or proof of runtime WebMCP conformance. Targets must be public Internet pages and remain subject to the protections and limitations documented in [docs/threat-model.md](docs/threat-model.md).

## Response expectations

Receipt should be acknowledged within five business days. Fix timing depends on severity and reproducibility. Coordinated disclosure is requested until a mitigation is available.
