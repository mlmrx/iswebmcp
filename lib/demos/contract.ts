import { closedObjectSchema, shortText, stableId } from '@/lib/demos/schema';
import type { DemoScenario } from '@/lib/demos/types';

export const contractDemos = [
  {
    slug: 'precise-tool-naming',
    category: 'contract',
    title: 'Make tool selection unambiguous',
    eyebrow: 'Names · descriptions · routing',
    summary:
      'Replace generic verbs with one capability name that declares its object and scope.',
    lesson:
      'A tool name is part of the routing contract, not an internal implementation detail.',
    risk: 'Names such as “run” or “update” collide with unrelated tools and invite selection errors.',
    before: {
      title: 'Ambiguous surface',
      framing: 'The agent chooses among overlapping generic capabilities.',
      steps: [
        {
          label: 'Read generic names',
          detail: 'Interpret tools named run, edit, and update.',
          state: 'Candidate tools overlap',
        },
        {
          label: 'Guess intent',
          detail: 'Use prose to infer which object each tool changes.',
          state: 'Selection depends on interpretation',
        },
        {
          label: 'Invoke candidate',
          detail: 'Discover the mismatch only after execution begins.',
          state: 'Wrong-tool risk remains',
        },
      ],
    },
    after: {
      title: 'Distinct capability',
      framing: 'The name, title, and description agree on a single job.',
      steps: [
        {
          label: 'Discover capability',
          detail: 'Read a stable verb-object name.',
          state: 'Tool scope is explicit',
        },
        {
          label: 'Match intent',
          detail: 'Compare the requested object and allowed effect.',
          state: 'Selection has a deterministic rationale',
        },
        {
          label: 'Verify target',
          detail: 'Return the exact object ID handled by the tool.',
          state: 'Selection and result remain traceable',
        },
      ],
    },
    tool: {
      name: 'rename_workspace_document',
      title: 'Rename workspace document',
      description: 'Rename one synthetic workspace document by stable ID.',
      annotations: { readOnlyHint: false },
      inputSchema: closedObjectSchema(
        {
          document_id: stableId('Stable document ID.'),
          new_name: shortText('New display name.'),
        },
        ['document_id', 'new_name'],
      ),
      exampleInput: {
        document_id: 'doc_release_notes',
        new_name: 'Release notes draft',
      },
      exampleResult: {
        document_id: 'doc_release_notes',
        previous_name: 'Draft',
        new_name: 'Release notes draft',
      },
    },
    verification: {
      question: 'Can the selected tool and affected object be explained?',
      beforeState: 'Selection rests on overlapping prose.',
      afterState: 'Name, object ID, and returned change align.',
      checks: [
        'The name identifies verb and object',
        'The result repeats the stable target ID',
      ],
    },
    confirmation: {
      level: 'review',
      trigger: 'Before applying the rename.',
      behavior: 'Show the target document and old/new names.',
      rationale:
        'The change is reversible but should still target the intended shared object.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'closed-input-schema',
    category: 'contract',
    title: 'Reject undeclared input instead of guessing',
    eyebrow: 'Schema closure · validation · errors',
    summary:
      'Use a closed schema and runtime validation so surprising fields fail visibly.',
    lesson:
      'JSON Schema is a discoverability aid; the implementation must enforce the same boundary.',
    risk: 'Open objects let misspelled, stale, or injected parameters reach business logic.',
    before: {
      title: 'Permissive payload',
      framing: 'Unknown fields are ignored or interpreted inconsistently.',
      steps: [
        {
          label: 'Receive object',
          detail: 'Accept a loosely shaped payload.',
          state: 'Unknown keys are present',
        },
        {
          label: 'Coerce values',
          detail: 'Guess types and defaults inside execution.',
          state: 'Runtime behavior diverges from documentation',
        },
        {
          label: 'Return surprise',
          detail: 'The result cannot explain which values were honored.',
          state: 'Input provenance is unclear',
        },
      ],
    },
    after: {
      title: 'Closed contract',
      framing:
        'Discovery and runtime validation enforce the same object shape.',
      steps: [
        {
          label: 'Validate keys',
          detail: 'Reject undeclared properties.',
          state: 'Object shape is closed',
        },
        {
          label: 'Validate values',
          detail: 'Check types, ranges, and enumerations.',
          state: 'Execution receives trusted structure',
        },
        {
          label: 'Return typed error',
          detail: 'Name the exact invalid field without executing.',
          state: 'Failure is safe and actionable',
        },
      ],
    },
    tool: {
      name: 'filter_issue_queue',
      title: 'Filter issue queue',
      description:
        'Filter synthetic issues using a closed set of supported fields.',
      annotations: { readOnlyHint: true },
      inputSchema: closedObjectSchema({
        status: { type: 'string', enum: ['open', 'closed'] },
        limit: { type: 'integer', minimum: 1, maximum: 50 },
      }),
      exampleInput: { status: 'open', limit: 10 },
      exampleResult: {
        issue_ids: ['issue_12', 'issue_18'],
        applied: { status: 'open', limit: 10 },
      },
    },
    verification: {
      question: 'Did execution use only documented inputs?',
      beforeState: 'Ignored or coerced values are not visible.',
      afterState: 'The result echoes the validated filter set.',
      checks: ['Undeclared keys are rejected', 'Applied values are returned'],
    },
    confirmation: {
      level: 'none',
      trigger: 'The tool only reads a synthetic issue queue.',
      behavior: 'No approval is needed; invalid input fails before execution.',
      rationale:
        'Schema validation, not confirmation, is the appropriate read-only guardrail.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'stable-entity-identifiers',
    category: 'contract',
    title: 'Act on stable IDs, not visible labels',
    eyebrow: 'Identity · localization · rename safety',
    summary:
      'Bind actions to stable identifiers while keeping human-readable names for review.',
    lesson: 'Display text can change; entity identity must not.',
    risk: 'Duplicate or localized labels can route an action to the wrong object.',
    before: {
      title: 'Label-based targeting',
      framing: 'The agent selects a row by visible text.',
      steps: [
        {
          label: 'Read label',
          detail: 'Find a card called “Quarterly review.”',
          state: 'Multiple labels may match',
        },
        {
          label: 'Choose row',
          detail: 'Use DOM position to disambiguate.',
          state: 'Identity depends on layout',
        },
        {
          label: 'Apply action',
          detail: 'Assume the selected row is the intended record.',
          state: 'Target remains inferred',
        },
      ],
    },
    after: {
      title: 'ID-bound targeting',
      framing:
        'Discovery returns labels and stable IDs; mutation requires the ID.',
      steps: [
        {
          label: 'List candidates',
          detail: 'Return ID, name, and owner together.',
          state: 'Candidates are distinguishable',
        },
        {
          label: 'Review identity',
          detail: 'Show the human-readable record before action.',
          state: 'User can verify the target',
        },
        {
          label: 'Act by ID',
          detail: 'Return the same ID with the postcondition.',
          state: 'Target identity is preserved',
        },
      ],
    },
    tool: {
      name: 'archive_project_record',
      title: 'Archive project record',
      description: 'Archive one reviewed synthetic project by stable ID.',
      annotations: { readOnlyHint: false },
      inputSchema: closedObjectSchema(
        {
          project_id: stableId('Stable project identifier.'),
          expected_state: { type: 'string', enum: ['active'] },
        },
        ['project_id', 'expected_state'],
      ),
      exampleInput: { project_id: 'project_qr_2029', expected_state: 'active' },
      exampleResult: {
        project_id: 'project_qr_2029',
        previous_state: 'active',
        new_state: 'archived',
      },
    },
    verification: {
      question: 'Was the reviewed record the one that changed?',
      beforeState: 'The selected label and row position are the evidence.',
      afterState: 'Stable ID and state transition are returned.',
      checks: [
        'Stable ID matches the review surface',
        'Previous and new states are explicit',
      ],
    },
    confirmation: {
      level: 'required',
      trigger: 'Immediately before archival.',
      behavior: 'Show stable ID, name, owner, and reversibility.',
      rationale:
        'Archival changes shared state and must not rely on an ambiguous label.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'structured-postconditions',
    category: 'contract',
    title: 'Return postconditions, not “done”',
    eyebrow: 'Outputs · state proof · UI parity',
    summary:
      'Make the result describe the state transition that the interface should display.',
    lesson:
      'A successful HTTP response is not evidence that the user-visible goal was reached.',
    risk: 'Generic success text can conceal partial writes or stale UI state.',
    before: {
      title: 'Opaque success',
      framing: 'The operation returns a generic acknowledgement.',
      steps: [
        {
          label: 'Submit action',
          detail: 'Send an update through the interface.',
          state: 'Request accepted',
        },
        {
          label: 'Read toast',
          detail: 'Observe a brief “Saved” message.',
          state: 'Specific postcondition unknown',
        },
        {
          label: 'Re-open record',
          detail: 'Manually inspect the changed fields.',
          state: 'Verification requires another journey',
        },
      ],
    },
    after: {
      title: 'Verifiable result',
      framing:
        'The tool returns previous state, new state, and visible revision.',
      steps: [
        {
          label: 'Execute change',
          detail: 'Apply the validated mutation.',
          state: 'Mutation is scoped',
        },
        {
          label: 'Return transition',
          detail: 'Describe old value, new value, and revision.',
          state: 'Postcondition is structured',
        },
        {
          label: 'Reconcile UI',
          detail: 'Update the visible record to the returned revision.',
          state: 'Human and tool views agree',
        },
      ],
    },
    tool: {
      name: 'set_task_priority',
      title: 'Set task priority',
      description:
        'Set the priority of one synthetic task and return its state transition.',
      annotations: { readOnlyHint: false },
      inputSchema: closedObjectSchema(
        {
          task_id: stableId('Stable task ID.'),
          priority: { type: 'string', enum: ['low', 'normal', 'high'] },
          expected_revision: { type: 'integer', minimum: 1 },
        },
        ['task_id', 'priority', 'expected_revision'],
      ),
      exampleInput: {
        task_id: 'task_docs',
        priority: 'high',
        expected_revision: 2,
      },
      exampleResult: {
        task_id: 'task_docs',
        previous_priority: 'normal',
        new_priority: 'high',
        revision: 3,
      },
    },
    verification: {
      question: 'Can success be checked without repeating the task?',
      beforeState: 'A generic toast must be interpreted.',
      afterState: 'The exact state transition and revision are available.',
      checks: [
        'Previous and new values are present',
        'Visible revision matches the result',
      ],
    },
    confirmation: {
      level: 'review',
      trigger: 'Before changing the shared task priority.',
      behavior:
        'Show task name and requested priority; allow a reversible update.',
      rationale:
        'The change is low consequence but still affects collaborators.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'shared-state-parity',
    category: 'contract',
    title: 'Use one service for UI and tool state',
    eyebrow: 'Parity · shared logic · drift prevention',
    summary:
      'Route human controls and tool execution through the same domain operation.',
    lesson:
      'Two action surfaces should not create two versions of application truth.',
    risk: 'Duplicated tool logic can bypass validation or leave the visible interface stale.',
    before: {
      title: 'Parallel implementations',
      framing: 'The UI and tool each update state through separate code paths.',
      steps: [
        {
          label: 'UI validates',
          detail: 'Human controls apply one set of rules.',
          state: 'UI path has current business logic',
        },
        {
          label: 'Tool mutates',
          detail: 'A second implementation applies its own rules.',
          state: 'Behavior may diverge',
        },
        {
          label: 'Refresh view',
          detail: 'The interface discovers the change later.',
          state: 'Visible state can lag',
        },
      ],
    },
    after: {
      title: 'Shared operation',
      framing:
        'Both surfaces call one validated service and subscribe to its result.',
      steps: [
        {
          label: 'Validate once',
          detail: 'Apply the same domain rules for either caller.',
          state: 'One policy boundary',
        },
        {
          label: 'Commit once',
          detail: 'Return a canonical state transition.',
          state: 'One mutation path',
        },
        {
          label: 'Render result',
          detail: 'Update every surface from the canonical event.',
          state: 'UI and tool state converge',
        },
      ],
    },
    tool: {
      name: 'toggle_saved_item',
      title: 'Toggle saved item',
      description:
        'Set the saved state of one synthetic item through the shared domain service.',
      annotations: { readOnlyHint: false },
      inputSchema: closedObjectSchema(
        {
          item_id: stableId('Stable item identifier.'),
          saved: { type: 'boolean' },
        },
        ['item_id', 'saved'],
      ),
      exampleInput: { item_id: 'article_contracts', saved: true },
      exampleResult: {
        item_id: 'article_contracts',
        saved: true,
        visible_collection: 'saved-items',
      },
    },
    verification: {
      question: 'Do human and tool actions produce the same canonical state?',
      beforeState: 'Parity is assumed across separate implementations.',
      afterState:
        'Both paths emit the same result shape and visible collection.',
      checks: [
        'One domain operation owns the mutation',
        'Visible collection reflects the returned state',
      ],
    },
    confirmation: {
      level: 'none',
      trigger:
        'Saving an item is reversible and local to the synthetic fixture.',
      behavior:
        'No approval is required; the visible toggle changes with the tool result.',
      rationale: 'Low-risk reversible state should remain efficient.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'registration-lifecycle',
    category: 'contract',
    title: 'Unregister tools when their page context ends',
    eyebrow: 'AbortSignal · ownership · route changes',
    summary:
      'Tie tool registration to the route or component that owns the underlying state.',
    lesson: 'A truthful contract includes when the tool ceases to exist.',
    risk: 'Stale tools can act on hidden or unmounted application context.',
    before: {
      title: 'Leaked registration',
      framing: 'A page tool remains registered after navigation.',
      steps: [
        {
          label: 'Open editor',
          detail: 'Register an editor-scoped tool.',
          state: 'Editor tool is available',
        },
        {
          label: 'Change route',
          detail: 'Unmount the editor without cleanup.',
          state: 'Tool remains discoverable',
        },
        {
          label: 'Invoke stale tool',
          detail: 'Execution references missing state.',
          state: 'Failure occurs outside valid context',
        },
      ],
    },
    after: {
      title: 'Owned lifecycle',
      framing: 'An AbortSignal scopes registration to the owning route.',
      steps: [
        {
          label: 'Create controller',
          detail: 'Bind registration to the editor owner.',
          state: 'Ownership is explicit',
        },
        {
          label: 'Register with signal',
          detail: 'Expose the tool only while context is live.',
          state: 'Tool availability matches the route',
        },
        {
          label: 'Abort on teardown',
          detail: 'Remove the tool before state disappears.',
          state: 'Stale invocation is impossible',
        },
      ],
    },
    tool: {
      name: 'update_editor_selection',
      title: 'Update editor selection',
      description:
        'Update the active selection while the synthetic editor route is mounted.',
      annotations: { readOnlyHint: false },
      inputSchema: closedObjectSchema(
        {
          editor_id: stableId('Mounted editor identifier.'),
          selection_id: stableId('Stable selection identifier.'),
        },
        ['editor_id', 'selection_id'],
      ),
      exampleInput: { editor_id: 'editor_demo', selection_id: 'block_intro' },
      exampleResult: {
        editor_id: 'editor_demo',
        selection_id: 'block_intro',
        route_active: true,
      },
    },
    verification: {
      question: 'Is the tool available only while its state owner exists?',
      beforeState: 'Availability can outlive the visible route.',
      afterState: 'Registration and teardown share one AbortSignal.',
      checks: [
        'Tool disappears on route teardown',
        'Execution confirms active owner context',
      ],
    },
    confirmation: {
      level: 'none',
      trigger:
        'The selection update is reversible within a mounted synthetic editor.',
      behavior: 'No approval is needed; route teardown removes the capability.',
      rationale:
        'Lifecycle ownership is the relevant boundary for temporary UI state.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
] as const satisfies readonly DemoScenario[];
