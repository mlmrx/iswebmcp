# Automated consistency research

This is an executed, local, owned-synthetic pilot of the isWebMCP source analyzer. No models, URL collection, participant recruitment, or WRI v1 records are involved.

- [Protocol](protocol.md): declared relations, assumptions, evidence boundaries, and reproduction commands.
- [First-run report](results/baseline.md): 22 paired cases, 15 passing and seven failing relations.
- [Complete first-run artifact](results/baseline.json): every input, source/fixture hash, projection, and outcome.
- [Execution manifest](results/baseline.run.json): environment and actual run provenance.
- [Intervention replay](results/post-fix.md): the corrected scanner satisfies the same 22 relations; this is same-suite validation, not a held-out study.
- [Paper draft](paper-draft.md): results, source-grounded interpretation, and limitations for further research review.

The baseline remains a historical observation after fixes. Read `sourceHashes` to identify the tested source; do not assume the current checkout is the baseline. The harness rejects a different result at an existing output path. To assess changed code, choose a distinct output such as `results/post-fix.json`.

To replay the baseline after scanner fixes without changing the checkout:

```sh
npx --no-install tsx --tsconfig tsconfig.json scripts/research/verify-recorded-pilot.ts docs/research/automated-consistency/results/baseline.json
npx --no-install tsx --tsconfig tsconfig.json scripts/research/verify-recorded-pilot.ts docs/research/automated-consistency/results/post-fix.json
```

The verifier checks every recorded source hash, every fixture hash, normalized before/after outputs, and individual checks. If the scanner changed, it reads the scanner blob at the recorded Git base and validates its hash before loading a temporary copy. It changes no repository files and removes the temporary copy afterwards. The original working-tree `lib/types.ts` was newer than the Git base, so checking out the Git base alone does not recreate the full provenance. The verifier requires the matching recorded type file and other dependencies, as present in the release containing these artifacts. If they change later, use that release or recover exact matching bytes; the verifier fails rather than silently replaying different code.

For Git checkouts that convert line endings, the verifier considers the original buffer, LF reconstruction, and CRLF reconstruction, accepting a candidate only when it matches the recorded SHA-256 exactly. This changes no artifact hashes or repository files. The baseline scanner is loaded from the recovered exact bytes; other matching dependencies are executed from the checkout, and all recorded outputs are compared. A harness test verifies both conversion directions and rejection of substantive edits. Cross-platform newline portability is tested through these reconstructed buffers; an independent Linux execution has not yet been performed.

JSON whitespace may be mechanically formatted. The manifest's `artifactSha256` identifies the runner's deterministic serialization (`JSON.stringify(parsedArtifact, null, 2) + '\n'`), so it can be checked after formatting without changing the recorded observations. The source and fixture hashes identify exact content bytes.

Results are exploratory consistency observations, not novelty, certification, real-world failure prevalence, or evidence that agents perform better. The paper needs independent validation and a sharper external contribution before submission.
