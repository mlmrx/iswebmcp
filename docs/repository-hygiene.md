# Repository hygiene audit

Reviewed September 5, 2026. This is a bounded repository inspection, not a full secret-history audit or a claim that external marketplace submissions are approved.

## Corrections

- The README describes the independent developer utility and current private repository visibility, verified through GitHub on September 5, 2026. Earlier public-repository assumptions were corrected; no access controls were changed. Challenge-submission instructions are superseded.
- Content operations now follows the owner's long-term product direction and removes the challenge deployment freeze while explicitly preserving the WRI v1 data freeze.
- Contribution instructions cover local setup, verification, evidence provenance, safe handling of configuration, and the native Next.js/Vercel release path.
- Historical challenge preparation documents have conspicuous superseded notices. Their content is retained for history and is not current release guidance or proof of participation.

## Tracked-file findings

No tracked files were found in `.openai`, `.vercel`, `.wrangler`, `.output`, `outputs`, `work`, or `artifacts`. No tracked `node_modules`, `.next`, log, or temporary-file artifacts were found in the inspected path patterns. Existing ignore rules already cover local environments, dependency directories, build outputs, browser reports, and working artifacts; no broader ignore rules were needed.

The five archives in `public/downloads` are intentional distribution assets for the ChatGPT, Chrome, Claude, Cursor, and VS Code integrations. They were retained. Packaging does not establish marketplace publication or approval.

No raw WRI v1 data, integration archives, Git history, remote configuration, or access controls were deleted or changed in this cleanup. The old index collection scripts remain for provenance, with explicit instructions against running them on the frozen artifact.

## Continuing practice

Keep generated local output ignored, configuration examples free of credentials, and release claims tied to verified evidence. Update user-facing documentation when product behavior changes. Treat historical labels and test counts as historical, and preserve source attribution when correcting factual claims.
