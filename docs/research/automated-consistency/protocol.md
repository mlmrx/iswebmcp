# Synthetic scanner consistency pilot — protocol v1

This internal pilot tests the current `analyzeSource` implementation and its weighted scoring dependency. It measures conformance to declared relations, not agent effectiveness, WebMCP adoption, accessibility certification, or product quality. It uses only owned synthetic HTML strings; it never fetches those strings' `.invalid` URL, runs a model, recruits participants, or accesses WRI v1 data.

## Design declared before execution

The executable case catalog is `scripts/research/consistency-cases.ts`. It declares 22 distinct paired cases, each with a transformation, relation, and assumption. Cases were designed after source inspection, so this is a white-box exploratory pilot, not blinded evaluation or external preregistration. All cases and failures are retained. The catalog and source hashes bind each result to the exact tested bytes. This protocol is written before the first pilot run; there is no externally timestamped preregistration claim.

- Inert markup: controls in comments, script-like examples in comments/templates, escaped code examples, commented JSON-LD, and commented titles should not add active semantic evidence.
- Duplication: duplicate named buttons, status regions, and JSON-LD may change counts but should not increase diversity scores or action sets.
- Representation: attribute ordering, HTML tag case, independent control ordering, and numeric entities should preserve normalized assessments. Action confidence and risk are compared; report identifiers, timestamps, sequence, and prose are not.
- Naming: removing/restoring a unique label should decrease/increase field-name points; empty labels and dangling references should decrease points relative to a valid explicit name. These are hand-authored source expectations, not a complete accessible-name algorithm.
- Intended sensitivity: adding a live region increases feedback points; adding an HTTP entry hop decreases transport points. These are not invariance checks.
- Evidence boundaries: registration syntax must remain a hint, truncated data retains an uncertain full-page interval, and a user goal cannot improve source-derived scoring.

All pairs use the same synthetic HTTPS URL, HTTP status, and fixed analyzer timestamp, except the explicitly declared transport pair. Byte counts use UTF-8. Truncated input declares an unseen suffix without fabricating its content. No expectation of a lower point score or lower model-input coverage is imposed solely by truncation. The point estimate refers to the captured prefix, and coverage is the observed fraction of model inputs, not whole-page coverage.

## Reproducibility

Run `npx --no-install tsx scripts/research/run-consistency-pilot.ts --output docs/research/automated-consistency/results/baseline.json` from the site directory. The runner refuses to overwrite different results, strips random scan identifiers by projecting only specified evidence, and records source, fixture, protocol, and harness SHA-256 hashes. Stable outcome rows have no real-time timestamps. An accompanying run manifest records actual execution time, Node version, and Git base separately. Use a new output filename for changed source; never overwrite baseline evidence after a fix.

Run `npx --no-install tsx --test scripts/research/consistency-harness.test.ts` to validate the harness. `--check` regenerates in memory and compares the deterministic artifact without writing. `--strict` returns nonzero if any declared relation fails; default mode records research failures without treating them as collection errors.

The final report must present both passed and failed relations, denominators per family, and the small purposive sample limitation. Correlated cases are not independent samples. No confidence intervals, p-values, general failure probabilities, or universal reliability claims are justified by these case counts.

## Methodological references

Metamorphic testing derives follow-up inputs and checks expected relationships among outputs; the relation design remains a source of assumptions. See Chen, Cheung, and Yiu, _Metamorphic Testing: A New Approach for Generating Next Test Cases_, technical report HKUST-CS98-01 (1998), [author-deposited copy](https://arxiv.org/abs/2002.12543), uploaded in 2020. Liu, Kuo, Towey, and Chen, _How Effectively Does Metamorphic Testing Alleviate the Oracle Problem?_, IEEE TSE 40(1), 4–22 (2014), [institutional record](https://vuir.vu.edu.au/33046/) and [DOI](https://doi.org/10.1109/TSE.2013.46), supplies prior empirical context; its findings are not measurements of isWebMCP. Sources checked September 5, 2026.
