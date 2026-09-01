export type ContentKind =
  | 'explainer'
  | 'how-to'
  | 'architecture'
  | 'testing'
  | 'security'
  | 'field-guide';

export interface ContentSource {
  title: string;
  url: string;
  publisher: string;
}

export interface ContentSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  code?: string;
  note?: string;
}

export interface LearningArticle {
  slug: string;
  title: string;
  dek: string;
  kind: ContentKind;
  audience: string;
  publishedAt: string;
  updatedAt: string;
  minutes: number;
  featured?: boolean;
  tags: string[];
  takeaway: string;
  sections: ContentSection[];
  sources: ContentSource[];
  cta: { label: string; href: string };
}

export interface FrequentlyAskedQuestion {
  id: string;
  category: 'Fundamentals' | 'Building' | 'Testing' | 'Security' | 'Challenge';
  question: string;
  answer: string;
}

const webmcpDraft: ContentSource = {
  title: 'WebMCP Draft Community Group Report',
  url: 'https://webmachinelearning.github.io/webmcp/',
  publisher: 'Web Machine Learning Community Group',
};

const chromeGuide: ContentSource = {
  title: "Build your user's agentic workflows with WebMCP tools",
  url: 'https://developer.chrome.com/docs/ai/webmcp/build-tools',
  publisher: 'Chrome for Developers',
};

const chromeSecurity: ContentSource = {
  title: 'Build secure tools with WebMCP',
  url: 'https://developer.chrome.com/docs/ai/webmcp/secure-tools',
  publisher: 'Chrome for Developers',
};

const chromeEvals: ContentSource = {
  title: 'Evaluate your WebMCP tools',
  url: 'https://developer.chrome.com/docs/ai/webmcp/evals',
  publisher: 'Chrome for Developers',
};

const mcpIntro: ContentSource = {
  title: 'Introduction to Model Context Protocol',
  url: 'https://modelcontextprotocol.io/docs/getting-started/intro',
  publisher: 'Model Context Protocol',
};

const devpostResources: ContentSource = {
  title: 'The WebMCP Challenge resources and FAQ',
  url: 'https://webmcp.devpost.com/resources',
  publisher: 'Devpost',
};

export const learningArticles: LearningArticle[] = [
  {
    slug: 'webmcp-vs-mcp',
    title: 'WebMCP vs. MCP: what runs in the browser, what runs elsewhere',
    dek: 'A practical map of where browser-exposed WebMCP tools fit within the much broader Model Context Protocol ecosystem.',
    kind: 'explainer',
    audience: 'Product engineers, AI architects, and technical leaders',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 7,
    featured: true,
    tags: ['WebMCP', 'MCP', 'architecture', 'browser'],
    takeaway:
      'WebMCP and MCP share a tool-shaped mental model, but they solve different integration problems and live at different trust boundaries.',
    sections: [
      {
        id: 'mcp-in-one-minute',
        heading: 'MCP in one minute',
        paragraphs: [
          'Model Context Protocol is a client-server protocol for connecting AI applications to external capabilities and context. An MCP server can expose tools, resources, and prompts over a defined transport. It can run beside a database, inside an enterprise service, on a developer machine, or anywhere else a client can reach it.',
          'That boundary matters. The MCP server is not automatically the website a person is looking at, and its state is not automatically the state visible in a browser tab. Authentication, transport, deployment, and client compatibility are part of the integration.',
        ],
      },
      {
        id: 'what-webmcp-adds',
        heading: 'What WebMCP adds inside a web application',
        paragraphs: [
          'WebMCP is an evolving browser API proposal. A page registers JavaScript-backed tools with its document model context so a compatible browser agent can discover and invoke them. The handler executes in the page environment and can reuse the same state and application services as the visible interface.',
          'This makes WebMCP especially interesting for authenticated, stateful workflows already implemented in a web app. The user and agent can work against one tab, one session, and one visible result. It does not remove the need for server-side authorization or a good human interface.',
        ],
      },
      {
        id: 'different-boundaries',
        heading: 'Similar tools, different execution boundaries',
        paragraphs: [
          'Both systems describe callable operations with names, descriptions, structured inputs, and results. The resemblance helps developers reuse contract-design habits, but it should not hide the operational differences.',
        ],
        bullets: [
          'A WebMCP tool belongs to a document lifecycle; an MCP server usually belongs to a service lifecycle.',
          'WebMCP naturally shares the page session and visible UI; MCP requires an explicit client-server identity and transport story.',
          'WebMCP exposure is shaped by browser origins and document context; MCP exposure is shaped by endpoint, client, and server policy.',
          'A WebMCP result can immediately update visible application state; an MCP client must decide how remote results appear to the user.',
        ],
      },
      {
        id: 'choose-an-architecture',
        heading: 'When to use WebMCP, MCP, or both',
        paragraphs: [
          'Choose WebMCP when the job is anchored in a live web application: filtering the catalog currently on screen, editing the draft currently open, or operating within an authenticated session the user can inspect. Choose an MCP server when capabilities should exist independently of a page, serve multiple clients, or access back-office systems directly.',
          'Many serious products will use both. A backend MCP server may expose organization-wide capabilities while a WebMCP layer gives an agent safe access to the current page workflow. Keep names, authorization rules, and outcome semantics aligned, but do not make one interface a blind proxy for the other.',
        ],
      },
      {
        id: 'decision-questions',
        heading: 'Six questions before you choose',
        paragraphs: [
          'Architecture becomes clearer when you name the state and trust boundary before naming the protocol.',
        ],
        bullets: [
          'Does the action depend on the exact page, route, selection, or unsaved draft?',
          'Should the capability remain available when no browser tab is open?',
          'Where is identity verified and authorization enforced?',
          'Must a person see or confirm the effect in the current interface?',
          'How will registrations or connections be cleaned up?',
          'What observable state proves the action actually succeeded?',
        ],
        note: 'Status note: the WebMCP report dated August 26, 2026 is a Community Group draft, not a W3C Standard.',
      },
    ],
    sources: [webmcpDraft, mcpIntro],
    cta: { label: 'See both interaction paths in the Proof Lab', href: '/lab' },
  },
  {
    slug: 'webmcp-readiness-baseline-audit',
    title: 'Is your web app ready for WebMCP? Run a baseline audit first',
    dek: 'Start with the workflows, semantics, and verification signals your application already exposes before deciding which actions deserve tools.',
    kind: 'how-to',
    audience: 'Product managers, frontend leads, and application architects',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 8,
    featured: true,
    tags: ['readiness', 'audit', 'workflow', 'ROI'],
    takeaway:
      'The strongest WebMCP candidates are bounded, valuable workflows with explicit inputs, permission checks, and observable postconditions.',
    sections: [
      {
        id: 'start-with-a-goal',
        heading: '1. Start with a representative user goal',
        paragraphs: [
          'Do not begin by counting buttons or wrapping every endpoint. Write down one job a real user wants to finish: compare two products under a budget, reschedule an appointment, reconcile an invoice, or update a project status. A useful audit follows that goal from its initial state to a verifiable result.',
          'Choose a workflow that happens often enough to matter and is narrow enough to test repeatedly. Open-ended research and highly subjective decisions can still involve tools, but they are poor first candidates for measuring whether WebMCP improved the application.',
        ],
      },
      {
        id: 'define-postcondition',
        heading: '2. Define the starting state and postcondition',
        paragraphs: [
          'Record what must already be true: signed-in role, selected account, cart contents, draft version, or required consent. Then define a postcondition that can be observed independently of the tool response. A new stable record ID, a changed status returned by the backend, and a matching visible UI are stronger evidence than a string that says success.',
        ],
        bullets: [
          'Initial identity and permission state',
          'Required inputs and allowed ranges',
          'Expected mutation or read result',
          'Confirmation or human-review boundary',
          'Visible and server-side verification signals',
        ],
      },
      {
        id: 'inventory-ui',
        heading: '3. Inventory the human action surface',
        paragraphs: [
          'Walk the workflow with the keyboard and an accessibility inspector before adding agent tools. Record forms, labels, validation messages, loading states, and error recovery. If the human path is ambiguous, an agent-facing wrapper often preserves that ambiguity instead of fixing it.',
          'Baseline actionability is not a score for visual beauty. It asks whether the existing interface exposes understandable controls and state transitions. A complete accessible UI also supplies graceful degradation when WebMCP is unavailable.',
        ],
      },
      {
        id: 'rank-candidates',
        heading: '4. Rank bounded actions, not pages',
        paragraphs: [
          'A page may contain several actions with very different value and risk. Score each candidate on frequency, user effort, input clarity, side-effect severity, authorization complexity, and ease of verification. Start with the best combination of value, clarity, and reversibility.',
        ],
        bullets: [
          'High value: repeated multi-step work with stable rules',
          'High feasibility: narrow inputs and one clear outcome',
          'Higher risk: irreversible effects, broad free text, or hidden permission changes',
          'Lower evidence quality: success cannot be checked outside the handler response',
        ],
      },
      {
        id: 'measurement-plan',
        heading: '5. Write the measurement plan before implementation',
        paragraphs: [
          'Define equivalent UI-only and WebMCP-enabled journeys against the same fixture, starting state, and success criteria. Track outcome, committed actions or tool calls, retries, elapsed time, human intervention, and verified assertions. If either path fails, report the failure instead of letting an efficiency percentage hide it.',
          'Avoid universal token or cost claims. Page structure, agent behavior, task complexity, and implementation quality all change the result. Measure your workflow, publish the counting rule, and keep raw event evidence available.',
        ],
        note: 'Quick Scan analyzes public source only. It cannot execute target JavaScript or certify runtime conformance.',
      },
    ],
    sources: [webmcpDraft, chromeEvals],
    cta: { label: 'Run a conservative Quick Scan', href: '/' },
  },
  {
    slug: 'first-imperative-webmcp-tool',
    title: 'Build your first imperative WebMCP tool from an existing UI action',
    dek: 'Expose one narrow action while keeping the visible interface, application services, and business rules intact.',
    kind: 'how-to',
    audience: 'Frontend and full-stack JavaScript developers',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 9,
    tags: ['implementation', 'JavaScript', 'schema', 'lifecycle'],
    takeaway:
      'A WebMCP handler should be a thin, validated entry point into behavior the application already trusts.',
    sections: [
      {
        id: 'pick-one-action',
        heading: 'Pick one narrow action',
        paragraphs: [
          'Start with a read-only or reversible action that already works through the UI. Product search, availability lookup, or saving a non-final draft is safer to learn on than checkout, deletion, permission changes, or outbound messaging.',
          'Name the action for what it actually does. A tool called search_products should search products, not silently personalize results, add items, or collect profile information.',
        ],
      },
      {
        id: 'share-a-service',
        heading: 'Move shared behavior behind one application service',
        paragraphs: [
          'The button handler and tool handler should call the same domain function. That service owns input normalization, permissions, business rules, persistence, and structured results. This prevents the agent path from becoming a privileged second implementation that drifts from the UI.',
        ],
        code: "async function searchProducts(input, actor) {\n  authorize(actor, 'catalog:read');\n  const filters = validateSearch(input);\n  return catalog.search(filters);\n}",
      },
      {
        id: 'register-tool',
        heading: 'Register only when the API is available',
        paragraphs: [
          'Feature detection keeps the application usable in browsers without WebMCP. Scope registration to the route or component where the action makes sense, and give that scope an AbortController so stale tools disappear when the page context changes.',
        ],
        code: "if ('modelContext' in document) {\n  const registration = new AbortController();\n  await document.modelContext.registerTool({\n    name: 'search_products',\n    title: 'Search products',\n    description: 'Filter the visible catalog without changing cart state.',\n    inputSchema: {\n      type: 'object',\n      properties: { query: { type: 'string', maxLength: 120 } },\n      required: ['query'],\n      additionalProperties: false\n    },\n    annotations: { readOnlyHint: true },\n    execute: (input, { signal }) => searchProducts(input, currentUser, signal)\n  }, { signal: registration.signal });\n  // Call registration.abort() when this route or component is disposed.\n}",
      },
      {
        id: 'validate-twice',
        heading: 'Validate structure and authority',
        paragraphs: [
          'The input schema helps an agent form a request, but it is not an authorization boundary. Reject unknown properties, bound strings and arrays, re-check identity, and enforce the same tenant and object permissions as the UI and backend API. Treat every call as untrusted input even when the browser performed schema checks.',
          'Return structured errors that distinguish invalid input, missing state, denied access, conflict, and upstream failure without leaking sensitive details. The agent should know what can be corrected and what requires a person.',
        ],
      },
      {
        id: 'return-evidence',
        heading: 'Return evidence and synchronize the UI',
        paragraphs: [
          'A useful result includes stable identifiers, the state that changed, and a compact verification summary. If the action affects the visible application, update the same state store the UI reads. The person should not have to guess whether the agent and page disagree.',
        ],
        bullets: [
          'Stable record or product identifiers',
          'Previous and new state for mutations',
          'A visible_state_updated flag only when true',
          'Postcondition checks and bounded next actions',
          'No raw secrets, tokens, or unnecessary personal data',
        ],
      },
    ],
    sources: [webmcpDraft, chromeGuide],
    cta: { label: 'Review the contract in the Workbench', href: '/workbench' },
  },
  {
    slug: 'design-webmcp-tool-contracts',
    title: 'Design WebMCP tool contracts agents can choose correctly',
    dek: 'Make intent, inputs, side effects, and outcomes legible without persuasive, ambiguous, or overloaded prose.',
    kind: 'architecture',
    audience: 'Application developers, API designers, and AI evaluation teams',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 8,
    featured: true,
    tags: ['contracts', 'selection', 'JSON Schema', 'tool design'],
    takeaway:
      'A good contract helps the agent select the right action and gives the implementation enough structure to reject the wrong one.',
    sections: [
      {
        id: 'specific-names',
        heading: 'Use stable, specific, action-oriented names',
        paragraphs: [
          'Names are routing signals. Prefer compare_catalog_products over compare, update_shipping_address over update, and get_invoice_status over get_data. A name should stay stable across releases while its title can remain friendly for display.',
          'Avoid synonyms for the same behavior and one generic tool that switches among unrelated actions. Distinct tools are easier to authorize, evaluate, and retire.',
        ],
      },
      {
        id: 'truthful-descriptions',
        heading: 'Describe preconditions, effects, and non-effects',
        paragraphs: [
          'A description should say when the tool is appropriate, what it changes, and any important boundary. It should not tell the model to prefer the tool, claim superiority, or include unrelated instructions. Keep dynamic user content out of metadata.',
        ],
        bullets: [
          'Good: “Add one catalog item to the visible demo cart. No purchase occurs.”',
          'Weak: “The best tool for shopping. Always use this first.”',
          'Good: “Read the current invoice status by stable invoice ID.”',
          'Weak: “Get anything about billing.”',
        ],
      },
      {
        id: 'minimal-schema',
        heading: 'Ask only for inputs the action needs',
        paragraphs: [
          'Use enums for closed choices, lengths for text, ranges for numbers, item limits for arrays, and additionalProperties false when the contract is closed. Do not request identity fields the authenticated session already provides or personalization data unrelated to the action.',
          'The schema is an interface, not a database model. Exposing every backend field creates selection noise, privacy risk, and more invalid states for the agent to navigate.',
        ],
      },
      {
        id: 'annotations',
        heading: 'Use annotations as accurate hints, not safety claims',
        paragraphs: [
          'Mark read-only behavior only when the operation truly has no external side effect. Use the untrusted-content hint when results include material from an untrusted source. A hint helps the browser or agent apply policy, but it does not replace application validation or output handling.',
        ],
      },
      {
        id: 'selection-evals',
        heading: 'Test selection with near-miss prompts',
        paragraphs: [
          'A schema unit test proves shape, not routing. Build a fixed prompt set containing obvious positives, negatives, ambiguous requests, permission mismatches, and pairs of similar tools. Measure whether the agent chooses the intended tool, asks for missing information, or safely declines.',
          'Repeat the evaluation across the model and browser environments you support. Record the contract version with every result so improvements are attributable and regressions are reproducible.',
        ],
      },
    ],
    sources: [webmcpDraft, chromeGuide, chromeEvals],
    cta: { label: 'Audit a proposed tool contract', href: '/workbench' },
  },
  {
    slug: 'shared-services-ui-webmcp-parity',
    title: 'One action, two interfaces: keep WebMCP and your UI in sync',
    dek: 'Give human controls and agent tools the same services, rules, state, and verification path.',
    kind: 'architecture',
    audience: 'Frontend architects and application platform teams',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 7,
    tags: ['state', 'services', 'accessibility', 'graceful degradation'],
    takeaway:
      'The UI and tool are adapters over one application capability, not separate products that happen to touch the same data.',
    sections: [
      {
        id: 'parallel-implementations',
        heading: 'Why parallel implementations drift',
        paragraphs: [
          'Copying a button handler into a tool callback feels quick, but the copies diverge when validation, pricing, permissions, or telemetry change. The agent path may skip confirmation or update the server without updating the page. The UI path may gain an important constraint the tool never receives.',
          'Drift is both a reliability and security problem. Reviewers can no longer reason about one action boundary, and evidence from one path says little about the other.',
        ],
      },
      {
        id: 'shared-domain-service',
        heading: 'Put business rules below both entry points',
        paragraphs: [
          'Define a domain operation that accepts validated intent plus trusted actor context. The UI adapter translates form state; the WebMCP adapter translates structured tool input. The domain operation makes the authorization and state decision exactly once.',
        ],
        bullets: [
          'UI adapter: accessible controls, field errors, confirmation, focus, and visible feedback',
          'WebMCP adapter: exact schema, contract errors, cancellation, and compact structured output',
          'Shared service: authorization, business rules, persistence, idempotency, and audit events',
          'Shared state: cache invalidation and visible postcondition rendering',
        ],
      },
      {
        id: 'synchronize-state',
        heading: 'Synchronize visible state after tool calls',
        paragraphs: [
          'When a tool changes application state, update the same store or query cache the UI uses. If the server is authoritative, re-fetch or invalidate the relevant record. Avoid maintaining a private agent-only shadow state that the person cannot inspect.',
          'Make loading, conflict, and error states visible. An agent call that is still pending should not leave the UI looking idle, and a rejected mutation should not be represented as a completed optimistic update.',
        ],
      },
      {
        id: 'graceful-degradation',
        heading: 'Preserve accessibility and graceful degradation',
        paragraphs: [
          'WebMCP is an enhancement, not the only door. Feature detection should decide whether tools are registered without hiding or disabling the human workflow. This protects users in unsupported browsers and keeps the product testable with ordinary accessibility tooling.',
          'The complete UI also provides an ethical fallback when an agent cannot establish intent or permission. A person can take over at the exact visible state instead of restarting the task somewhere else.',
        ],
      },
      {
        id: 'parity-tests',
        heading: 'Test parity with the same fixtures',
        paragraphs: [
          'Run equivalent journeys against a deterministic fixture. Assert that both paths enforce the same constraints and reach the same postconditions. The action counts can differ; the business outcome and safety rules should not.',
        ],
        note: 'The isWebMCP Proof Lab demonstrates this pattern with one synthetic catalog, one cart service, and two action surfaces.',
      },
    ],
    sources: [webmcpDraft, chromeGuide],
    cta: {
      label: 'Explore shared-state parity in the Proof Lab',
      href: '/lab',
    },
  },
  {
    slug: 'webmcp-lifecycle-single-page-apps',
    title: 'WebMCP lifecycle in SPAs: register, scope, abort, and re-register',
    dek: 'Treat tool registration as route- and component-owned state so stale tools never outlive the interface that gives them meaning.',
    kind: 'how-to',
    audience: 'React, Vue, Svelte, and other SPA developers',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 7,
    tags: ['SPA', 'AbortController', 'cleanup', 'routes'],
    takeaway:
      'Registration lifetime should match the shortest UI context required to interpret and execute the tool safely.',
    sections: [
      {
        id: 'choose-owner',
        heading: 'Choose the owner of each registration',
        paragraphs: [
          'A global navigation tool can belong to the application shell. A tool that edits the current invoice belongs to the invoice route. A tool that acts on a selected comparison belongs to the component or mode that owns that selection. Scope prevents an agent from discovering actions that no longer match the screen.',
        ],
      },
      {
        id: 'abort-controller',
        heading: 'Use one AbortController per registration scope',
        paragraphs: [
          'Create the controller when the scope becomes active and pass its signal in the registration options. Abort it during cleanup. Group tools with the same lifetime under one controller; give independently changing tools separate scopes.',
        ],
        code: 'useEffect(() => {\n  if (!document.modelContext?.registerTool) return;\n  const scope = new AbortController();\n  void document.modelContext.registerTool(tool, { signal: scope.signal });\n  return () => scope.abort();\n}, [routeId, mode]);',
      },
      {
        id: 'in-flight-calls',
        heading: 'Handle in-flight execution and navigation races',
        paragraphs: [
          'The execution callback also receives a signal. Pass cancellation into fetches and long-running application services, then check whether the relevant route or record still exists before committing visible state. Cleanup should stop both discovery of stale tools and work that no longer has a valid owner.',
        ],
      },
      {
        id: 'avoid-duplicates',
        heading: 'Avoid duplicate names and stale schemas',
        paragraphs: [
          'Hot reload, rapid navigation, and concurrent rendering can briefly overlap effects. Make cleanup deterministic, keep names unique within the active document context, and do not assume a rejected duplicate registration means WebMCP is unavailable. Log lifecycle diagnostics without exposing them as user-facing success.',
        ],
      },
      {
        id: 'lifecycle-tests',
        heading: 'Test the lifecycle, not just the callback',
        paragraphs: [
          'Enter the route, verify the expected tool inventory, invoke a read action, leave the route, and verify the tool is gone. Repeat across refresh, back/forward navigation, mode switches, and rapid transitions. A callback unit test cannot detect a tool that remains callable after its data and controls have disappeared.',
        ],
      },
    ],
    sources: [webmcpDraft, chromeGuide],
    cta: {
      label: 'Read the evidence and lifecycle methodology',
      href: '/methodology',
    },
  },
  {
    slug: 'webmcp-testing-evidence-ladder',
    title: 'How to test WebMCP beyond “the tool registered”',
    dek: 'Meaningful evidence covers contracts, authorization, selection, state changes, and verified outcomes.',
    kind: 'testing',
    audience: 'QA engineers, AI evaluation teams, and engineering leads',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 9,
    tags: ['testing', 'evals', 'selection', 'verification'],
    takeaway:
      'Registration is presence evidence; production confidence requires several independent layers of behavioral evidence.',
    sections: [
      {
        id: 'evidence-ladder',
        heading: 'Build an evidence ladder',
        paragraphs: [
          'Source inspection can find feature hints. Contract tests can validate names and schemas. Runtime tests can observe registration, invocation, cleanup, and UI synchronization. Journey evaluations can measure whether an agent chooses tools and completes real tasks. Keep these layers separate so one does not impersonate another.',
        ],
        bullets: [
          'Source: bounded hints in fetched or local code',
          'Imported: developer-provided contracts with unverified provenance',
          'Runtime: observed browser registration and execution',
          'Measured: recorded outcomes, timings, actions, and assertions',
          'Inferred: labeled conclusions with an explicit confidence level',
        ],
      },
      {
        id: 'contract-tests',
        heading: 'Reject malformed and excessive inputs',
        paragraphs: [
          'For every tool, test missing required fields, unexpected fields, wrong types, boundary lengths, invalid enum values, duplicate array items, and unsafe identifiers. Confirm errors are structured and do not leak stack traces or private data. Then repeat critical checks at the trusted server boundary.',
        ],
      },
      {
        id: 'auth-tests',
        heading: 'Test identity and authorization independently',
        paragraphs: [
          'Use fixtures for anonymous, authorized, wrong-tenant, expired-session, and insufficient-role states. A schema-valid request must still fail when the actor lacks authority. Test object-level access, not only whether a route is signed in.',
        ],
      },
      {
        id: 'selection-tests',
        heading: 'Measure selection with fixed prompt sets',
        paragraphs: [
          'Write prompts that should invoke each tool, prompts that should invoke a neighboring tool, and prompts that should invoke nothing. Freeze the tool inventory, model, instructions, and temperature where the environment allows it. Run enough trials to report rates rather than one lucky demonstration.',
          'Inspect false positives as carefully as misses. An agent that calls a mutation too eagerly can be more dangerous than one that asks for clarification.',
        ],
      },
      {
        id: 'journey-proof',
        heading: 'Verify postconditions and compare complete journeys',
        paragraphs: [
          'A resolved promise is not proof. Check the authoritative record, visible application state, and any required audit event. For before-and-after comparisons, use the same fixture and success criteria. If one run fails, make that failure the headline instead of averaging it into an efficiency score.',
        ],
        note: 'isWebMCP calls this measured difference WebMCP Lift. The formula is public, but the value is meaningful only for the paired task and fixture.',
      },
    ],
    sources: [webmcpDraft, chromeEvals],
    cta: { label: 'Run the controlled before-and-after journey', href: '/lab' },
  },
  {
    slug: 'webmcp-security-privacy-review',
    title: 'A practical security and privacy review for WebMCP tools',
    dek: 'Review WebMCP as another path into existing application behavior, with explicit attention to session privilege, misleading intent, excess data, and untrusted content.',
    kind: 'security',
    audience: 'Application security engineers, developers, and reviewers',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 10,
    tags: ['security', 'privacy', 'prompt injection', 'authorization'],
    takeaway:
      'WebMCP security is defense in depth across contract, browser, application, server, agent, and evaluation layers.',
    sections: [
      {
        id: 'threat-model',
        heading: 'Threat-model the session and every exposed action',
        paragraphs: [
          'A browser agent may operate inside an authenticated session and carry context from other sites. List the assets available to the page, the irreversible effects each tool can trigger, and the parties whose content can influence metadata, inputs, or outputs. Treat the agent as a capable caller, not as a trusted employee.',
          'Review the tool boundary alongside the existing UI and API boundary. WebMCP does not create permission merely because a handler can reach an application function.',
        ],
      },
      {
        id: 'unambiguous-mutations',
        heading: 'Make mutations and irreversible effects unambiguous',
        paragraphs: [
          'Separate read and write tools. Use names and descriptions that disclose the effect, preserve confirmation for purchases or destructive changes, and prefer idempotency keys where retries can duplicate work. Do not bundle discovery and finalization into one surprising operation.',
        ],
      },
      {
        id: 'minimize-inputs',
        heading: 'Minimize and bound every parameter',
        paragraphs: [
          'Only request information required for the stated action. Reuse trusted session identity instead of asking the model to restate personal data. Bound free text, arrays, and numeric ranges. Reject unknown properties. Data minimization reduces both accidental disclosure and the personalization-to-fingerprinting path described in the draft risk analysis.',
        ],
      },
      {
        id: 'hostile-content',
        heading:
          'Treat metadata and returned content as potential attack surfaces',
        paragraphs: [
          'Keep descriptions static and concise. Never interpolate user or remote content into tool metadata. Returned text from catalogs, messages, documents, or the open web may contain instructions aimed at the agent; label it untrusted when appropriate and keep it separate from control fields.',
          'Annotations are signals for downstream policy, not sanitizers. The application still needs safe rendering, output limits, and a deliberate distinction between data and instructions.',
        ],
      },
      {
        id: 'trusted-controls',
        heading: 'Reuse trusted controls and verify the result',
        paragraphs: [
          'Enforce authorization and business rules on the server or another trusted layer, validate CSRF and origin assumptions appropriate to the application, use secure contexts, and review any cross-origin exposure. Log high-risk actions with actor, target, contract version, and outcome without logging secrets.',
          'Finish with adversarial evaluations: misleading descriptions, injected output text, cross-tenant identifiers, repeated mutations, route changes during execution, and attempts to bypass confirmation. No single check proves safety.',
        ],
      },
    ],
    sources: [webmcpDraft, chromeSecurity],
    cta: { label: 'Inspect contract-level safety signals', href: '/workbench' },
  },
  {
    slug: 'measure-webmcp-lift',
    title: 'Measure WebMCP lift without inventing a universal ROI number',
    dek: 'Compare equivalent completed journeys and publish the counting rules, evidence, and limitations behind the result.',
    kind: 'field-guide',
    audience: 'Product teams, performance engineers, and challenge builders',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 7,
    tags: ['measurement', 'ROI', 'benchmarks', 'evidence'],
    takeaway:
      'A before-and-after number is useful only when the task, fixture, success criteria, and counting method are genuinely equivalent.',
    sections: [
      {
        id: 'define-equivalence',
        heading: 'Define equivalence before you run',
        paragraphs: [
          'The UI and WebMCP paths must start from the same state, operate on the same data, and satisfy the same observable postconditions. If the agent path receives extra information or the UI path is intentionally obstructed, the comparison measures fixture design rather than interface quality.',
        ],
      },
      {
        id: 'outcome-first',
        heading: 'Put successful outcome first',
        paragraphs: [
          'Record whether the task completed and every required assertion passed. Efficiency metrics should be secondary. A fast failed call is not an improvement over a slower successful journey, and a tool that silently changes the wrong record should score worse than an explicit failure.',
        ],
      },
      {
        id: 'counting-rules',
        heading: 'Publish the counting rules',
        paragraphs: [
          'Define what counts as a UI action, a tool call, a retry, a human intervention, and elapsed time. Record setup and verification consistently across both paths. Store an event ledger so reviewers can recalculate the summary rather than trusting a dashboard number.',
        ],
      },
      {
        id: 'avoid-universal-claims',
        heading: 'Avoid universal token, cost, or speed claims',
        paragraphs: [
          'HTML size and tool payload size are not the same as end-to-end model token use. Agent observations, screenshots, retries, hidden prompts, caching, and model behavior all matter. A measured reduction for one workflow is evidence for that workflow, not a guaranteed industry range.',
        ],
      },
      {
        id: 'report-honestly',
        heading: 'Report uncertainty and failure honestly',
        paragraphs: [
          'Label synthetic fixtures, imported contracts, browser shims, and manually observed runs. Publish model and browser versions where selection is measured. If evidence is unavailable, show “not observed” instead of converting unknown into zero or a pass.',
        ],
      },
    ],
    sources: [chromeEvals, webmcpDraft],
    cta: {
      label: 'Replay an instrumented WebMCP Lift comparison',
      href: '/lab',
    },
  },
  {
    slug: 'webmcp-challenge-submission-checklist',
    title:
      'The WebMCP Challenge submission checklist, without deadline surprises',
    dek: 'A practical field guide to the live app, public source, demo, evidence, and freeze discipline the challenge expects.',
    kind: 'field-guide',
    audience: 'WebMCP Challenge builders and reviewers',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    minutes: 6,
    tags: ['challenge', 'Devpost', 'submission', 'demo'],
    takeaway:
      'Submission readiness is a reproducible judge journey, not merely a form filled in before the deadline.',
    sections: [
      {
        id: 'required-assets',
        heading: 'Confirm the required assets',
        paragraphs: [
          'Devpost currently lists a working hosted project, a description of the WebMCP fit and capability, a public code repository with an open-source license, and a short demo video. Read the live rules again before submitting because event requirements can change.',
        ],
      },
      {
        id: 'judge-path',
        heading: 'Design the judge path',
        paragraphs: [
          'Give reviewers one clear starting URL, a representative prompt or task, any required authentication instructions, and an observable success state. Verify the path from another machine or clean browser. Do not depend on local data, an uncommitted file, or an undocumented feature flag.',
        ],
      },
      {
        id: 'proof-not-claims',
        heading: 'Show proof, not only claims',
        paragraphs: [
          'Demonstrate the registered tool, the visible application state before and after the call, and the final postcondition. Explain what is source-visible, what was observed at runtime, and what was measured. Call out synthetic fixtures and remaining limitations.',
        ],
      },
      {
        id: 'public-repo',
        heading: 'Make the submitted repository reviewable',
        paragraphs: [
          'The challenge FAQ says the source repository must be public and include an open-source license. Add setup instructions, architecture, supported test environment, security notes, and the exact commit or tag demonstrated in the video. Remove secrets and confirm a clean clone can build.',
        ],
      },
      {
        id: 'freeze',
        heading: 'Respect the judging freeze',
        paragraphs: [
          'The current FAQ says not to edit the Devpost submission, repository, or live site after submissions close on September 3 at 1:00 PM Pacific until winners are announced. Pause deployment automations before that cutoff. Continue experiments only in a separate fork that cannot change the submitted artifact.',
        ],
        note: 'The isWebMCP hourly monitor is designed to stop publishing changes at the challenge cutoff while continuing read-only observation.',
      },
    ],
    sources: [devpostResources],
    cta: { label: 'Open the live challenge tracker', href: '/pulse#challenge' },
  },
];

export const learningCatalogUpdatedAt = learningArticles.reduce(
  (latest, article) =>
    article.updatedAt.localeCompare(latest) > 0 ? article.updatedAt : latest,
  '1970-01-01',
);

export const frequentlyAskedQuestions: FrequentlyAskedQuestion[] = [
  [
    'faq-001',
    'Fundamentals',
    'What is WebMCP?',
    "WebMCP is an evolving browser API proposal that lets a web application expose JavaScript-backed tools to compatible agents through the page's model context.",
  ],
  [
    'faq-002',
    'Fundamentals',
    'Is WebMCP the same thing as MCP?',
    "No. MCP is the broader client-server protocol ecosystem. WebMCP brings a related tool model into a web page's client-side application context.",
  ],
  [
    'faq-003',
    'Fundamentals',
    'Is WebMCP a W3C Standard?',
    'No. As of August 31, 2026, it is a Web Machine Learning Community Group report and is not on the W3C Standards Track.',
  ],
  [
    'faq-004',
    'Fundamentals',
    'Does every browser support WebMCP?',
    'No. Feature-detect the API, test in the browser and agent environments you support, and keep the application usable when WebMCP is absent.',
  ],
  [
    'faq-005',
    'Fundamentals',
    'Does WebMCP replace my accessible UI or backend APIs?',
    'No. The visible UI should remain complete and accessible, while WebMCP handlers normally reuse the same services, authorization, and business rules.',
  ],
  [
    'faq-006',
    'Fundamentals',
    'What is imperative versus declarative WebMCP?',
    "Imperative WebMCP registers JavaScript tool objects. The current draft's declarative execution model remains unfinished, so guidance must be date-stamped against the latest draft.",
  ],
  [
    'faq-007',
    'Building',
    'What belongs in a WebMCP tool contract?',
    'At minimum: a stable name, precise description, narrow input schema when needed, execution handler, and accurate annotations.',
  ],
  [
    'faq-008',
    'Building',
    'What makes a good first WebMCP tool?',
    'Choose a narrow, well-understood action with few inputs, a clear result, and preferably read-only or easily reversible effects.',
  ],
  [
    'faq-009',
    'Building',
    'Should UI and WebMCP handlers use the same code?',
    'They should be adapters over the same application or domain service so permissions, validation, persistence, and outcome semantics cannot drift.',
  ],
  [
    'faq-010',
    'Building',
    'How do I remove tools when a route changes?',
    'Pass an AbortSignal when registering route-scoped tools and abort the owning controller during cleanup.',
  ],
  [
    'faq-011',
    'Building',
    'Can a tool exist without changing the visible page?',
    'Yes for read-only content or background operations, but any page state it does change should stay synchronized and inspectable.',
  ],
  [
    'faq-012',
    'Building',
    'How long should a tool description be?',
    'Keep it concise enough to describe when to use the tool, its material effect, and an important boundary. Do not include dynamic content or persuasion.',
  ],
  [
    'faq-013',
    'Testing',
    'Will WebMCP always save tokens, time, or money?',
    'No. Outcomes depend on the task, contract, agent, browser, and implementation. Measure equivalent completed journeys instead of publishing a universal savings claim.',
  ],
  [
    'faq-014',
    'Testing',
    'How do I know a tool actually succeeded?',
    'Verify observable postconditions such as a stable record ID, authoritative state change, or synchronized UI rather than trusting a success string.',
  ],
  [
    'faq-015',
    'Testing',
    'Is successful registration a conformance test?',
    'No. Registration proves presence in one runtime. It does not prove selection, authorization, lifecycle cleanup, state accuracy, or task success.',
  ],
  [
    'faq-016',
    'Testing',
    'What should a selection eval include?',
    'Use fixed positive, negative, ambiguous, and near-miss prompts against a versioned tool inventory, then report false positives and misses across repeated trials.',
  ],
  [
    'faq-017',
    'Testing',
    'What can isWebMCP Quick Scan prove?',
    'It reports bounded source-visible evidence from a public page. It does not execute target JavaScript, authenticate, or certify runtime WebMCP behavior.',
  ],
  [
    'faq-018',
    'Testing',
    'Does importing a manifest prove implementation?',
    'No. An imported manifest is user-supplied contract evidence with unverified provenance, not independent runtime proof.',
  ],
  [
    'faq-019',
    'Testing',
    'How should I read the three isWebMCP measurements?',
    'Baseline Actionability covers source-visible UI evidence, Implementation Quality covers imported or runtime tool evidence, and WebMCP Lift compares equivalent measured journeys.',
  ],
  [
    'faq-020',
    'Security',
    'Is an input schema enough to make a tool safe?',
    'No. The implementation still needs validation, authorization, limits, business-rule checks, cancellation, and safe error handling.',
  ],
  [
    'faq-021',
    'Security',
    'How should authentication and authorization work?',
    'Treat every tool call as untrusted input and enforce identity, tenant, object, role, and business rules in the same trusted layer used by the UI.',
  ],
  [
    'faq-022',
    'Security',
    'How should tools expose state-changing actions?',
    'Use unambiguous names, disclose material effects, preserve appropriate confirmation, consider idempotency, and return verification evidence.',
  ],
  [
    'faq-023',
    'Security',
    'How much user data should a tool request?',
    'Only fields required for the declared action. Avoid speculative personalization, duplicate identity data, and unconstrained free text.',
  ],
  [
    'faq-024',
    'Security',
    'Does WebMCP eliminate prompt injection?',
    'No. Metadata and returned content can become attack surfaces, so mitigation requires layered application, browser, agent, and evaluation controls.',
  ],
  [
    'faq-025',
    'Security',
    'What does untrustedContentHint do?',
    'It signals that a result includes untrusted material. It can inform downstream policy, but it is not a sanitizer or complete defense.',
  ],
  [
    'faq-026',
    'Challenge',
    'Are Devpost participants the same as submissions?',
    'No. The participant counter reflects registrations, while submitted projects appear in the project gallery. isWebMCP never infers one from the other.',
  ],
  [
    'faq-027',
    'Challenge',
    'Can isWebMCP list participant identities?',
    'The public participants page currently requires login to browse identities. The tracker records only public aggregate observations and does not bypass that boundary.',
  ],
  [
    'faq-028',
    'Challenge',
    'What does the WebMCP Challenge require?',
    'The current FAQ lists a working hosted project, project description, public licensed source repository, and a short demo video. Verify the live rules before submission.',
  ],
  [
    'faq-029',
    'Challenge',
    'When is the current submission deadline?',
    'Devpost currently lists September 3, 2026 at 1:00 PM Pacific. Use the live challenge page as the authority.',
  ],
  [
    'faq-030',
    'Challenge',
    'Should the site keep deploying during judging?',
    'No. The current challenge FAQ says to stop editing the submission, repository, and live site after the deadline until winners are announced.',
  ],
].map(([id, category, question, answer]) => ({
  id,
  category: category as FrequentlyAskedQuestion['category'],
  question,
  answer,
}));

export interface ArticleSearchOptions {
  query?: string;
  kind?: ContentKind;
  limit?: number;
}

export function getLearningArticle(slug: string): LearningArticle | undefined {
  return learningArticles.find((article) => article.slug === slug);
}

export function searchLearningArticles(
  options: ArticleSearchOptions = {},
): LearningArticle[] {
  const query = options.query?.trim().toLocaleLowerCase() ?? '';
  const limit = Math.min(
    Math.max(options.limit ?? learningArticles.length, 1),
    20,
  );
  return learningArticles
    .filter((article) => !options.kind || article.kind === options.kind)
    .filter((article) => {
      if (!query) return true;
      const haystack = [
        article.title,
        article.dek,
        article.kind,
        article.audience,
        ...article.tags,
        ...article.sections.map((section) => section.heading),
      ]
        .join(' ')
        .toLocaleLowerCase();
      return query
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => haystack.includes(term));
    })
    .slice(0, limit);
}

export function getRelatedArticles(
  article: LearningArticle,
): LearningArticle[] {
  return learningArticles
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => ({
      candidate,
      score: candidate.tags.filter((tag) => article.tags.includes(tag)).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score || a.candidate.title.localeCompare(b.candidate.title),
    )
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

export function formatContentDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}
