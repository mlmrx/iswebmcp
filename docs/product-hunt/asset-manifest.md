# Product Hunt asset manifest

All launch images are deterministic branded compositions. Product screenshots are captured from the local production build; the hero background is AI-generated and contains no product claims or text.

## Upload order

|     Order | File                                                       | Dimensions | Purpose                          |
| --------: | ---------------------------------------------------------- | ---------: | -------------------------------- |
| Thumbnail | `public/product-hunt/thumbnail-240.png`                    |    240×240 | Product Hunt avatar/thumbnail    |
|         1 | `public/product-hunt/gallery/01-map-contract-prove.png`    |   1270×760 | Immediate value proposition      |
|         2 | `public/product-hunt/gallery/02-source-is-not-runtime.png` |   1270×760 | Quick Scan and evidence boundary |
|         3 | `public/product-hunt/gallery/03-one-task-two-paths.png`    |   1270×760 | Proof Lab concept                |
|         4 | `public/product-hunt/gallery/04-four-level-evidence.png`   |   1270×760 | Scoring/evidence model           |
|         5 | `public/product-hunt/gallery/05-24-patterns.png`           |   1270×760 | Interactive pattern gallery      |
|         6 | `public/product-hunt/gallery/06-audited-partial-index.png` |   1270×760 | Dataset integrity story          |
|    Social | `public/product-hunt/social-1200x630.png`                  |   1200×630 | LinkedIn, X, email, press        |

## Captions and alt text

### 01 — Map it. Contract it. Prove it.

**Caption:** Turn UI guesswork into actions you can prove.

**Alt:** isWebMCP launch graphic showing a tangled interface becoming a structured, verified action path.

### 02 — Source is not runtime

**Caption:** One public URL becomes a ledger of what is known—and what is not.

**Alt:** isWebMCP Quick Scan interface beside labels distinguishing source observations from runtime evidence.

### 03 — One task, two paths

**Caption:** Compare visible UI and WebMCP only when the task, state, and evidence qualify.

**Alt:** isWebMCP Proof Lab with two matched paths for the same synthetic task.

### 04 — Four levels of evidence

**Caption:** Source actionability → contract lint → runtime readiness → measured lift.

**Alt:** Four-step isWebMCP evidence ladder with unknown states preserved until proof exists.

### 05 — 24 interactive patterns

**Caption:** Explore value, contracts, security, and reliability without invented benchmark claims.

**Alt:** isWebMCP gallery showing synthetic WebMCP patterns and evidence labels.

### 06 — Publish the failure, too

**Caption:** WRI v1 is frozen, uncalibrated, and audited-partial after scanner failures were quarantined.

**Alt:** isWebMCP readiness index showing 100,000 attempted ranks, 65,380 valid outcomes, 34,620 quarantined infrastructure errors, and 36,323 scored rows.

## Image-generation provenance

The source illustration at `public/product-hunt/source/evidence-map-background.png` was created with the built-in image generation model in a restrained editorial-tech style. Exact copy, numbers, layout, and product screenshots are added by the deterministic renderer in `scripts/product-hunt/render-assets.ts`.

## Quality checks

- Thumbnail is square and under 3 MB.
- Gallery images are 1270×760 and at least two are uploaded.
- Text remains legible in Product Hunt's gallery crop and on mobile.
- Real UI screenshots show no personal data or private URLs.
- “Synthetic,” “source-only,” “audited partial,” and “uncalibrated” labels remain legible.
- No image claims that 100,000 websites were successfully observed or definitively ranked.
