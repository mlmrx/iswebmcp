# isWebMCP Product Hunt launch kit

This folder is the launch control center for isWebMCP. Everything is written to be pasted into Product Hunt or a distribution channel with minimal editing.

## Recommended launch position

Launch isWebMCP as a **live evidence laboratory for agent-ready web applications**. Do not position it as a directory, generic report, definitive website ranking, or standards authority.

The core promise is:

> Prove your web app is ready for AI agents.

The differentiator is not a bigger score. It is an evidence ladder that keeps four kinds of evidence separate:

1. public-source actionability;
2. imported contract lint;
3. observed runtime readiness;
4. measured lift from a matched UI-versus-tool trial.

If evidence is missing, the product says `unknown`. That honesty is the story.

## Upload order

1. Complete the owner-only fields in `launch-data.json`.
2. Upload `public/product-hunt/thumbnail-240.png` as the thumbnail.
3. Upload gallery images `01` through `06` in numerical order.
4. Add the YouTube URL after recording the 60-second cut in `video-plan.md`.
5. Paste the short description and maker comment from this kit.
6. Preview every field, image crop, link, and mobile layout.
7. Schedule for 12:01 AM Pacific on the chosen day if the team can cover the full launch window.

## Owner-only inputs still required

- Product Hunt maker usernames
- Founder or maker display name
- Product Hunt profile URL
- Company social handle, if any
- Public support/contact email
- Final YouTube demo URL
- Optional interactive-demo URL
- Launch date and on-call coverage

No placeholder should be published.

## Files

- `listing-copy.md` — exact listing fields and variants
- `maker-comment.md` — first maker comment
- `launch-posts.md` — social, community, and email copy
- `reply-library.md` — common launch-day answers
- `press-kit.md` — boilerplate, facts, quotes, links
- `video-plan.md` — 60-second video script and capture list
- `launch-day-runbook.md` — preparation, launch day, and follow-up
- `asset-manifest.md` — image order, dimensions, captions, and alt text
- `launch-data.json` — machine-readable listing payload
- `product-hunt-specs.md` — current official field constraints and sharing rules
- `imagegen-prompt.md` — exact built-in image-generation prompt and provenance

## Truth guardrails

- WebMCP is experimental Community Group work, not a W3C Standard.
- isWebMCP is independent and is not an official OpenAI, Google, Microsoft, Chrome, or W3C product.
- The public URL scan reads bounded public source and does not execute a target site's JavaScript.
- Imported tool definitions are sanitized and labeled not independently verified.
- Runtime readiness requires an observed trial.
- Lift requires matched interactive runs of the same task and starting state.
- WRI v1 is a frozen, uncalibrated, audited-partial artifact: 100,000 ranks scheduled and attempted; 65,380 valid collection outcomes; 34,620 scanner-infrastructure errors quarantined; 36,323 scored rows.
- Never compress those counts into “100,000 websites analyzed” or “top 100,000 websites ranked.”
