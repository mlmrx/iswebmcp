# Manual WebMCP verification

Run this checklist on the deployed HTTPS origin with a current environment that explicitly supports top-level imperative WebMCP tools. Record the date, deployment URL/commit, browser or ChatGPT model/version, enabled flag or origin trial, screenshots, visible state, and tool trace.

The API is experimental. Recheck the [current draft](https://webmachinelearning.github.io/webmcp/) and [Chrome documentation](https://developer.chrome.com/docs/ai/webmcp/) before each release.

## Setup

- [ ] Open the deployed root page as the top-level page, not in an iframe.
- [ ] Confirm HTTPS, the isWebMCP heading, Quick Scan form, and primary navigation.
- [ ] Confirm the environment reports WebMCP as available.
- [ ] Confirm no target-site credentials or private URLs will be entered.
- [ ] Keep the browser console and tool-call trace visible if the environment supports them.

## Root and report tools

### 1. Safe scan and evidence boundary

Prompt:

> Scan `https://example.com/` for the goal “find the primary contact action.” Tell me exactly what you observed and what remains unverified.

Expected trace:

1. `scan_public_url` with `url` and `goal`
2. `get_scan_summary` for the resulting visible report, if more detail is needed

Expected visible behavior:

- [ ] A report route opens.
- [ ] The report says Quick Scan is source-only and runtime remains unverified.
- [ ] No WebMCP Implementation Quality or Lift value is fabricated.
- [ ] Returned evidence matches visible report evidence.

### 2. Evidence versus inference

Prompt:

> Show me the actions inferred from the current report and distinguish evidence from inference.

Expected trace: `list_action_surface` with the current `scan_id` or no ID.

- [ ] The result labels its evidence source as source and inference.
- [ ] Each action references evidence and a coverage/risk class.
- [ ] The agent does not describe source hints as runtime-registered tools.

### 3. Finding detail

Prompt:

> Open the highest-priority unresolved finding in the visible report. Explain its evidence, impact, and exact remediation.

Expected trace: `get_scan_summary`, followed by `get_finding_details` with a finding ID returned by the report.

- [ ] The finding belongs to the currently visible report.
- [ ] Evidence IDs resolve to visible evidence.
- [ ] Unknown evidence is described as not observed, not failed.

### 4. Export preparation

Prompt:

> Prepare the current report as JSON, but do not hide a download or navigate away.

Expected trace: `export_current_report` with `{ "format": "json" }`.

- [ ] Visible export controls are prepared/focused.
- [ ] The agent reports that the user can review the export.
- [ ] No opaque download begins without visible state.

## Proof Lab journey

Navigate to `/lab`.

### 5. Select mode and start

Prompt:

> Switch the demo to WebMCP mode and start the headset-selection task.

Expected trace:

1. `select_demo_mode` with `{ "mode": "webmcp" }`
2. `start_demo_run` with `{ "task_id": "headset_research" }`

- [ ] The visible mode changes to WebMCP.
- [ ] The tool-availability indicator becomes available.
- [ ] The task and seven deterministic success criteria are visible.
- [ ] A new active run is shown.

### 6. Complete the structured task

Prompt:

> Find synthetic headphones priced at most $300, rated at least 4.5, with at least 30 hours of battery life and noise canceling. Compare Aurora Q45 and Sonic Arc, add one Aurora Q45 to the demo cart, then finish and verify. Do not perform checkout.

Expected trace, in order:

1. `search_demo_products` with `category: "headphones"`, `max_price: 300`, `minimum_rating: 4.5`, `minimum_battery_hours: 30`, and `features: ["noise_canceling"]`
2. `compare_demo_products` with `product_ids: ["aurora-q45", "sonic-arc"]`
3. `add_demo_product_to_cart` with `product_id: "aurora-q45"` and `quantity: 1`
4. `finish_demo_run`

- [ ] Search results visibly update and contain only eligible products.
- [ ] The comparison panel visibly contains both requested products.
- [ ] The visible cart contains one Aurora Q45.
- [ ] Every finish assertion passes and `checkout_performed` is false.
- [ ] Tool returns and visible state agree after each call.

### 7. Compare paired runs

First complete the same task through the UI-only baseline, or use the controlled paired replay and clearly record that evidence mode.

Prompt:

> Compare the latest completed baseline and WebMCP runs. Give me the raw actions, elapsed time, invalid attempts, interventions, verification results, and the published WebMCP Lift components. State the limitations.

Expected trace: `compare_demo_runs`.

- [ ] The fixture, task, and evidence modes are comparable.
- [ ] Raw values and normalized components are returned.
- [ ] The UI shows the same Lift value.
- [ ] The response calls a controlled replay deterministic and does not present it as a model eval.

## Negative and lifecycle tests

- [ ] Call `search_demo_products` with an unknown property. Expect structured `INVALID_INPUT`; visible state must not change.
- [ ] Call it with `max_price: -1` and `minimum_rating: 8`. Expect structured validation errors.
- [ ] Try `compare_demo_products` before search, and cart before comparison. Expect deterministic state errors.
- [ ] Try an unknown product ID and quantity 0. Expect rejection and no cart mutation.
- [ ] Ask for checkout or a real purchase. The agent must explain that the lab is synthetic and never performs checkout.
- [ ] Switch to baseline mode. Confirm the three catalog tools are no longer discoverable/callable while the human UI still works.
- [ ] Navigate away from `/lab`. Confirm route-scoped catalog tools are removed.
- [ ] Navigate from one report ID to another and try the old ID. Confirm report readers do not leak a non-visible report.
- [ ] Open a private URL such as `http://127.0.0.1/`. Expect the scanner to fail closed before outbound target fetch.

## Release evidence

- [ ] All expected calls occurred with no extra consequential calls.
- [ ] Negative cases returned structured errors.
- [ ] UI and tool state stayed synchronized.
- [ ] Cleanup tests passed.
- [ ] Screenshots and traces contain no secrets or personal data.
- [ ] Commit/tag and deployment URL are recorded in the challenge checklist.
