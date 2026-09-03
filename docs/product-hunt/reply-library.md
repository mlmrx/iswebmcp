# Launch-day reply library

Use these as starting points. Answer the actual person, acknowledge valid criticism, and link to the relevant page only when useful.

## “Is this an official WebMCP validator or certification?”

No. isWebMCP is independent, and WebMCP is experimental Community Group work rather than a W3C Standard. The product is an evidence and teaching tool. It does not issue official certification.

## “Does the URL scanner test runtime WebMCP tools?”

No. Quick Scan reads bounded, unauthenticated public source and does not execute the target site’s JavaScript. It can identify source-level actionability and hints, but runtime readiness remains unknown until an observed trial exists.

## “Did you really analyze the top 100,000 websites?”

We scheduled and emitted an attempt record for 100,000 ranks from a pinned popularity list. An integrity audit found two scanner-wide failure windows, so the public WRI v1 artifact is frozen as audited-partial: 65,380 valid collection outcomes, 34,620 quarantined infrastructure errors, and 36,323 scored rows. We do not describe it as 100,000 successfully observed websites or a definitive ranking.

## “Why should I trust the score?”

You should inspect the evidence before trusting any summary. isWebMCP separates source, imported, runtime, and matched-comparison evidence; shows provenance and raw components; and withholds runtime or lift claims when the prerequisites are absent. WRI v1’s heuristic is explicitly uncalibrated.

## “How is this different from Lighthouse?”

Lighthouse evaluates established web quality categories such as performance, accessibility, SEO, and best practices. isWebMCP asks a different question: whether an agent can discover a narrow action contract, execute it safely, verify state, and demonstrate improvement over the same UI task. The tools are complementary.

## “How is WebMCP different from MCP?”

MCP is a broader protocol for connecting models with tools and context. WebMCP explores how a web application can expose structured tools from its own page context. isWebMCP focuses on evaluating that web-specific action surface and the evidence behind readiness claims.

## “Do you store the sites I scan?”

Reports are ephemeral. The scanner applies URL and network safety controls, bounds redirects, time, and bytes, sanitizes evidence, and never renders source markup. Do not submit private, authenticated, or sensitive URLs.

## “My site failed or was truncated. Is that a low score?”

No. A collection or size limitation is not product-quality evidence. The source scan has a 1 MB analysis cap and labels truncation. Network, policy, and infrastructure failures should remain separate from website findings.

## “Why not execute every target site in a headless browser?”

That would change the security, consent, cost, reproducibility, and interpretation model. Quick Scan is intentionally a bounded source observation. Runtime proof belongs in an explicit controlled trial with known task, state, browser, trace, and verification criteria.

## “What exactly does the Proof Lab prove?”

The lab controls the fixture, task, starting state, and success criteria. Authored replays teach the flow but cannot generate lift. Observed interactive runs can be compared only when both paths qualify and match. The result is evidence for that trial—not a universal claim about all sites or agents.

## “Why include synthetic demos?”

They make contract, state, confirmation, security, and reliability patterns explorable without pretending they are measurements of third-party websites. Every synthetic fixture is labeled as such.

## “Can I export a report?”

Yes. Reports support normalized JSON and a print-friendly view so teams can review the same evidence outside the interface.

## “What browsers or agents are supported?”

The educational and source-analysis parts work as a normal web application. A genuine WebMCP runtime trial requires a browser or agent environment that exposes the experimental capability. We record the environment with the trial instead of implying universal support.

## “What are you building next?”

The priority is calibration: more controlled fixtures, clearer comparable-trial rules, adversarial contract cases, and reproducible evidence bundles. Feedback about the evidence needed for a real adoption decision will drive that roadmap.

## “This is too cautious.”

That is partly the point. Agent actions can cross authentication, money, data, and side-effect boundaries. We would rather expose uncertainty and make a narrower defensible claim than publish a confident number with unclear provenance.

## “This is still too complicated.”

Fair criticism. The simplest path is: scan one public URL to map likely friction, open one of the 24 patterns to see the before-and-after contract, then use the Proof Lab to understand what qualifies as runtime evidence. We’re continuing to simplify the journey without collapsing the evidence layers.
