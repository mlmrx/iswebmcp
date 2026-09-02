import { closedObjectSchema, shortText, stableId } from '@/lib/demos/schema';
import type { DemoScenario } from '@/lib/demos/types';

export const reliabilityDemos = [
  {
    slug: 'graceful-fallback',
    category: 'reliability',
    title: 'Keep the human interface complete without WebMCP',
    eyebrow: 'Feature detection · parity · fallback',
    summary:
      'Demonstrate progressive enhancement: tools add an action surface but never replace the UI.',
    lesson:
      'WebMCP readiness includes a graceful path when registration is unavailable.',
    risk: 'A tool-dependent interface can strand users and unsupported browsers.',
    before: {
      title: 'Tool-dependent feature',
      framing:
        'The human control is removed when a structured action is introduced.',
      steps: [
        {
          label: 'Open unsupported browser',
          detail: 'The WebMCP global is absent.',
          state: 'Registration is unavailable',
        },
        {
          label: 'Look for control',
          detail: 'No equivalent human action exists.',
          state: 'Core task is blocked',
        },
        {
          label: 'Reach dead end',
          detail: 'The page offers no recovery path.',
          state: 'Graceful degradation fails',
        },
      ],
    },
    after: {
      title: 'Progressive enhancement',
      framing:
        'The UI remains primary; registration is an optional parallel surface.',
      steps: [
        {
          label: 'Render full UI',
          detail: 'Load the complete form and controls first.',
          state: 'Human task is available',
        },
        {
          label: 'Detect support',
          detail: 'Register the tool only when the API exists.',
          state: 'Enhancement is conditional',
        },
        {
          label: 'Share operation',
          detail: 'Both surfaces call the same domain service.',
          state: 'Outcomes remain equivalent',
        },
      ],
    },
    tool: {
      name: 'add_item_to_reading_list',
      title: 'Add item to reading list',
      description:
        'Add one synthetic item through the same operation as the visible button.',
      annotations: { readOnlyHint: false },
      inputSchema: closedObjectSchema(
        { item_id: stableId('Stable content item ID.') },
        ['item_id'],
      ),
      exampleInput: { item_id: 'guide_fallbacks' },
      exampleResult: {
        item_id: 'guide_fallbacks',
        saved: true,
        visible_control_state: 'pressed',
      },
    },
    verification: {
      question: 'Can the task succeed with and without registration?',
      beforeState: 'Unsupported environments have no complete path.',
      afterState: 'The visible button and optional tool share one result.',
      checks: [
        'Human control works independently',
        'Tool absence does not hide content or state',
      ],
    },
    confirmation: {
      level: 'none',
      trigger: 'The synthetic reading-list update is reversible.',
      behavior:
        'No approval is required; both surfaces expose the resulting saved state.',
      rationale:
        'Fallback parity, not extra confirmation, is the reliability requirement.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'idempotent-retry',
    category: 'reliability',
    title: 'Make retries safe with idempotency keys',
    eyebrow: 'Retry · deduplication · mutation result',
    summary:
      'Show how a repeated call can return the original result instead of duplicating a mutation.',
    lesson:
      'Networks fail ambiguously; mutation contracts should make replay behavior explicit.',
    risk: 'A timeout followed by retry can create duplicate records or repeated side effects.',
    before: {
      title: 'Blind retry',
      framing: 'The caller cannot tell whether the first request committed.',
      steps: [
        {
          label: 'Send create',
          detail: 'Submit a synthetic note.',
          state: 'Outcome is pending',
        },
        {
          label: 'Lose response',
          detail: 'The connection ends after the server may have committed.',
          state: 'Commit status is ambiguous',
        },
        {
          label: 'Retry create',
          detail: 'Submit the same mutation again.',
          state: 'Duplicate creation is possible',
        },
      ],
    },
    after: {
      title: 'Idempotent replay',
      framing: 'A client-provided key binds retries to one logical operation.',
      steps: [
        {
          label: 'Bind key',
          detail: 'Validate a unique operation key with the payload.',
          state: 'Logical operation is identifiable',
        },
        {
          label: 'Commit once',
          detail: 'Store the key with the created record.',
          state: 'Mutation has one canonical result',
        },
        {
          label: 'Replay result',
          detail: 'Return the original record when the key repeats.',
          state: 'Retry is safely deduplicated',
        },
      ],
    },
    tool: {
      name: 'create_project_note',
      title: 'Create project note',
      description: 'Create one synthetic note with an idempotency key.',
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        {
          project_id: stableId('Stable project ID.'),
          body: shortText('Synthetic note body.'),
          idempotency_key: stableId('Unique logical operation key.'),
        },
        ['project_id', 'body', 'idempotency_key'],
      ),
      exampleInput: {
        project_id: 'project_demo',
        body: 'Review contract boundary.',
        idempotency_key: 'note_review_contract',
      },
      exampleResult: { note_id: 'note_71', created: true, replayed: false },
    },
    verification: {
      question: 'Can the same logical mutation be retried without duplication?',
      beforeState: 'The caller must inspect the record list manually.',
      afterState: 'The key returns one stable note ID and replay status.',
      checks: [
        'One key maps to one result',
        'Retry returns the original record ID',
      ],
    },
    confirmation: {
      level: 'review',
      trigger:
        'Before the first note creation; retries reuse that approved payload.',
      behavior:
        'Show project and note body once, then deduplicate identical retries.',
      rationale:
        'The write communicates to a shared synthetic project but should not ask repeatedly after an ambiguous response.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'partial-failure',
    category: 'reliability',
    title: 'Expose partial failure instead of claiming success',
    eyebrow: 'Multi-step write · compensation · status',
    summary:
      'Represent each sub-operation and the recovery state when a compound action only partly completes.',
    lesson:
      'A structured failure can be more useful than a generic success because it preserves the recovery plan.',
    risk: 'A single success boolean can hide incomplete downstream work.',
    before: {
      title: 'All-or-nothing message',
      framing:
        'The UI starts several operations but reports one generic outcome.',
      steps: [
        {
          label: 'Apply local change',
          detail: 'Update the synthetic workspace.',
          state: 'Primary write succeeds',
        },
        {
          label: 'Notify service',
          detail: 'A downstream notification fails.',
          state: 'Secondary effect is incomplete',
        },
        {
          label: 'Show saved',
          detail: 'A generic banner masks the partial failure.',
          state: 'Recovery work is invisible',
        },
      ],
    },
    after: {
      title: 'Explicit recovery state',
      framing:
        'The result records every sub-operation and whether compensation is needed.',
      steps: [
        {
          label: 'Track operations',
          detail: 'Assign a status to each effect.',
          state: 'Progress is inspectable',
        },
        {
          label: 'Stop on failure',
          detail: 'Avoid pretending the compound goal completed.',
          state: 'Partial state is declared',
        },
        {
          label: 'Return recovery',
          detail: 'Provide a safe retry or compensation token.',
          state: 'Next action is bounded',
        },
      ],
    },
    tool: {
      name: 'apply_workspace_change',
      title: 'Apply workspace change',
      description:
        'Apply a synthetic workspace change and report each downstream effect.',
      annotations: { readOnlyHint: false },
      inputSchema: closedObjectSchema(
        {
          workspace_id: stableId('Stable workspace ID.'),
          change_id: stableId('Prepared change ID.'),
        },
        ['workspace_id', 'change_id'],
      ),
      exampleInput: {
        workspace_id: 'workspace_demo',
        change_id: 'change_theme',
      },
      exampleResult: {
        primary: 'applied',
        notification: 'failed',
        overall: 'partial',
        recovery_token: 'retry_notification_demo',
      },
    },
    verification: {
      question: 'Does the result distinguish completed and incomplete effects?',
      beforeState: 'A generic banner hides sub-operation status.',
      afterState: 'Each effect and the recovery token are explicit.',
      checks: [
        'Overall state becomes partial',
        'Recovery targets only the failed effect',
      ],
    },
    confirmation: {
      level: 'required',
      trigger: 'Before applying the compound workspace change.',
      behavior:
        'Show primary and downstream effects; a recovery retry cannot expand the approved scope.',
      rationale:
        'The user should approve the complete intended change, while partial recovery stays narrowly bound.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'optimistic-concurrency',
    category: 'reliability',
    title: 'Reject writes against stale state',
    eyebrow: 'Version check · conflict · refresh',
    summary:
      'Use an expected revision so an agent cannot overwrite a newer human edit.',
    lesson:
      'State-aware tools should fail with a conflict that preserves both authors’ work.',
    risk: 'Last-write-wins behavior can silently erase changes made after discovery.',
    before: {
      title: 'Stale overwrite',
      framing:
        'The agent reads a record, a person edits it, then the agent writes old state.',
      steps: [
        {
          label: 'Read revision',
          detail: 'Load a synthetic record.',
          state: 'Agent holds revision four',
        },
        {
          label: 'Human edits',
          detail: 'The visible UI saves a newer revision.',
          state: 'Canonical state advances',
        },
        {
          label: 'Agent writes',
          detail: 'Mutation ignores the expected version.',
          state: 'Newer human work may be lost',
        },
      ],
    },
    after: {
      title: 'Conflict-aware write',
      framing: 'The contract requires the revision used to prepare the change.',
      steps: [
        {
          label: 'Include revision',
          detail: 'Send expected_revision with the patch.',
          state: 'Read basis is explicit',
        },
        {
          label: 'Compare atomically',
          detail: 'Reject when canonical revision differs.',
          state: 'Stale write is blocked',
        },
        {
          label: 'Return conflict',
          detail: 'Provide current revision and a refresh instruction.',
          state: 'No work is overwritten',
        },
      ],
    },
    tool: {
      name: 'update_shared_outline',
      title: 'Update shared outline',
      description:
        'Update a synthetic outline only when its expected revision is current.',
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        {
          outline_id: stableId('Stable outline ID.'),
          expected_revision: { type: 'integer', minimum: 1 },
          heading: shortText('Updated heading text.'),
        },
        ['outline_id', 'expected_revision', 'heading'],
      ),
      exampleInput: {
        outline_id: 'outline_launch',
        expected_revision: 4,
        heading: 'Verification plan',
      },
      exampleResult: {
        outline_id: 'outline_launch',
        applied: false,
        conflict: true,
        current_revision: 5,
      },
    },
    verification: {
      question:
        'Could the write overwrite state newer than the agent observed?',
      beforeState: 'Last-write-wins hides the stale basis.',
      afterState:
        'Conflict state and current revision are returned without mutation.',
      checks: [
        'Expected revision is required',
        'Conflict does not apply the patch',
      ],
    },
    confirmation: {
      level: 'review',
      trigger: 'Before applying a patch to the shared outline.',
      behavior:
        'Review the target and patch; a conflict returns to review after refresh.',
      rationale:
        'Approval based on stale content should not carry over to a materially changed record.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'selection-regression',
    category: 'reliability',
    title: 'Test tool selection with negative cases',
    eyebrow: 'Routing eval · near misses · abstention',
    summary:
      'Use positive and negative prompts to verify that a tool is selected only for its intended job.',
    lesson: 'Reliable discovery includes knowing when not to call a tool.',
    risk: 'A broadly described tool can absorb neighboring intents and perform the wrong class of action.',
    before: {
      title: 'Happy-path check',
      framing:
        'The team tests only one obvious prompt that should select the tool.',
      steps: [
        {
          label: 'Write broad description',
          detail: 'Describe several neighboring capabilities.',
          state: 'Routing boundary is fuzzy',
        },
        {
          label: 'Test positive case',
          detail: 'Confirm one matching request selects it.',
          state: 'Only recall is observed',
        },
        {
          label: 'Ship contract',
          detail: 'Near-miss prompts remain untested.',
          state: 'False selections are unknown',
        },
      ],
    },
    after: {
      title: 'Selection boundary eval',
      framing: 'A fixture includes matches, near misses, and abstention cases.',
      steps: [
        {
          label: 'Define intent',
          detail: 'State the precise job and exclusions.',
          state: 'Routing boundary is reviewable',
        },
        {
          label: 'Run cases',
          detail: 'Evaluate positive and negative synthetic prompts.',
          state: 'Selection decisions are recorded',
        },
        {
          label: 'Inspect misses',
          detail: 'Revise metadata when neighboring intents collide.',
          state: 'Contract evolves from evidence',
        },
      ],
    },
    tool: {
      name: 'search_public_knowledge_base',
      title: 'Search public knowledge base',
      description:
        'Search published help articles; do not read tickets or change account state.',
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        { query: shortText('Help topic to search.') },
        ['query'],
      ),
      exampleInput: { query: 'export a workspace' },
      exampleResult: {
        article_ids: ['help_export_workspace'],
        scope: 'published_help_only',
      },
    },
    verification: {
      question:
        'Does the capability abstain from neighboring private or mutating tasks?',
      beforeState: 'Only an obvious positive prompt is tested.',
      afterState:
        'Positive, near-miss, and abstention cases define the boundary.',
      checks: [
        'Private-ticket prompts do not select the tool',
        'Account-change prompts do not select the tool',
      ],
    },
    confirmation: {
      level: 'none',
      trigger: 'The tested capability searches public synthetic help content.',
      behavior:
        'No approval is required; neighboring mutations are excluded and should select no tool.',
      rationale: 'Abstention and narrow scope protect this read-only surface.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'cancellation-timeout',
    category: 'reliability',
    title: 'Propagate cancellation through the whole operation',
    eyebrow: 'AbortSignal · timeout · cleanup',
    summary:
      'Stop downstream work when the user cancels or the owning context times out.',
    lesson:
      'Cancellation is a lifecycle event, not merely a client-side spinner change.',
    risk: 'Hidden work can continue after navigation and later mutate stale state.',
    before: {
      title: 'Cosmetic cancellation',
      framing: 'The interface hides progress but backend work continues.',
      steps: [
        {
          label: 'Start long task',
          detail: 'Begin a synthetic report build.',
          state: 'Work is active',
        },
        {
          label: 'Cancel UI',
          detail: 'Dismiss the progress panel.',
          state: 'Only presentation stops',
        },
        {
          label: 'Receive late result',
          detail: 'Background work updates an abandoned view.',
          state: 'Stale side effect appears',
        },
      ],
    },
    after: {
      title: 'End-to-end abort',
      framing:
        'One signal reaches registration, service, and downstream operations.',
      steps: [
        {
          label: 'Create signal',
          detail: 'Bind the operation to user and route lifetime.',
          state: 'Cancellation owner is explicit',
        },
        {
          label: 'Propagate abort',
          detail: 'Pass the signal through every async boundary.',
          state: 'Downstream work can stop',
        },
        {
          label: 'Return cancelled',
          detail: 'Clean up and expose a typed terminal state.',
          state: 'No late mutation occurs',
        },
      ],
    },
    tool: {
      name: 'build_synthetic_report',
      title: 'Build synthetic report',
      description:
        'Build a synthetic report with cancellation propagated through every stage.',
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        {
          dataset_id: stableId('Synthetic dataset identifier.'),
          section: { type: 'string', enum: ['summary', 'details'] },
        },
        ['dataset_id', 'section'],
      ),
      exampleInput: { dataset_id: 'dataset_demo', section: 'summary' },
      exampleResult: {
        status: 'cancelled',
        output_created: false,
        cleanup_complete: true,
      },
    },
    verification: {
      question: 'Did cancellation stop work rather than only hide progress?',
      beforeState: 'The UI disappears while downstream work remains unknown.',
      afterState: 'A typed cancelled state confirms cleanup and no output.',
      checks: [
        'Abort reaches downstream operations',
        'No late output is created',
      ],
    },
    confirmation: {
      level: 'none',
      trigger: 'The report build is read-only and cancellation is always safe.',
      behavior:
        'Cancellation takes effect immediately and does not require approval.',
      rationale:
        'Stopping reversible read work should be low friction and deterministic.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
] as const satisfies readonly DemoScenario[];
