# Product Hunt launch runbook

## Launch owner roles

Assign one person to each role. One person may hold multiple roles on a small team.

- **Maker:** owns listing, first comment, and substantive replies.
- **Product on-call:** watches production, scan errors, rate limits, and Vercel health.
- **Community:** shares approved posts and routes questions to the maker.
- **Recorder:** logs recurring objections, useful quotes, and follow-up commitments.

## T–7 to T–3 days

- Fill every `OWNER_INPUT_REQUIRED` field in `launch-data.json`.
- Confirm personal Product Hunt maker accounts are complete.
- Upload a draft listing and inspect mobile and desktop previews.
- Record the 60-second demo and test the YouTube link while signed out.
- Run formatting, type checking, lint, unit tests, dependency audit, production build, and browser tests.
- Test all primary URLs and report-export paths in production.
- Test URL input failure states: malformed URL, non-HTTP scheme, credentials, private/reserved host, redirect loop, timeout, oversized response, unsupported media, and rate limit.
- Confirm errors distinguish target-site evidence from scanner/infrastructure failure.
- Review every numeric claim against `launch-data.json`.

## T–48 to T–24 hours

- Freeze launch copy and visual assets.
- Schedule the Product Hunt post. A 12:01 AM Pacific launch gives the listing a full daily cycle, but only use it if coverage exists.
- Prepare social drafts without “upvote,” vote incentives, giveaways, or coordinated voting language.
- Brief close collaborators to test the product and provide specific feedback—not to manufacture engagement.
- Create a simple incident channel and rollback owner.
- Capture a production baseline: health endpoint, homepage, demos, lab, workbench, methodology, and readiness-index pages.

## Launch hour

- Confirm production is healthy before sharing the listing.
- Verify thumbnail, gallery order, tagline, links, topics, video, maker accounts, and first comment.
- Publish the first maker comment immediately.
- Share the launch with the approved LinkedIn, X, email, and relevant-community copy.
- Ask people to try a concrete path and discuss the evidence model.

## During launch day

- Reply to substantive comments promptly and personally.
- Lead with limitations when a claim is challenged.
- Log bugs separately from feature requests and scoring disagreements.
- Do not silently change methodology, evidence labels, or WRI v1 counts during launch.
- If production has a material failure, acknowledge it in the thread, post the workaround or status, and update when verified fixed.
- Avoid refreshing rank obsessively; prioritize conversations, trial completions, and error quality.

## Metrics that matter

Record by hour and again at 24 hours:

- Product Hunt visitors and unique referrers
- Quick Scan starts, completions, and categorized failures
- Bundled sample-report opens
- Workbench example loads and completed audits
- Proof Lab starts and completed paths by evidence mode
- Demo-gallery scenario opens
- Methodology and FAQ visits
- JSON/print exports
- Qualified feedback items
- Production errors, rate limits, and p95 response time

Do not convert these into performance claims until definitions and instrumentation are documented.

## 24–72 hours after launch

- Thank people who gave specific feedback.
- Publish a short “what we learned” update, including weaknesses.
- Fix confirmed launch blockers first; do not rush scoring changes without tests and documentation.
- Group feedback into value clarity, scanner reliability, contract model, runtime proof, and index integrity.
- Update the roadmap with named evidence gaps rather than popularity requests alone.

## Stop-the-line conditions

Pause promotion and investigate if any of these occur:

- scanner can reach private/reserved networks or follow unsafe redirects;
- credentials or sensitive source appear in reports or logs;
- oversized input crashes the route rather than returning a bounded error;
- source-only evidence is labeled as runtime proof;
- a synthetic replay produces numeric lift;
- WRI v1 is described as 100,000 successfully observed sites;
- production returns repeated 5xx errors on a primary journey.
