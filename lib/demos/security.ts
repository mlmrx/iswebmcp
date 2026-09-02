import { closedObjectSchema, stableId } from '@/lib/demos/schema';
import type { DemoScenario } from '@/lib/demos/types';

export const securityDemos = [
  {
    slug: 'truthful-behavior-annotations',
    category: 'security',
    title: 'Make behavior annotations match real effects',
    eyebrow: 'Read-only truth · side effects · review',
    summary:
      'Demonstrate why a mutation must never advertise itself as read-only.',
    lesson:
      'Annotations guide agent policy; they do not excuse the implementation from enforcing safety.',
    risk: 'A false read-only hint can cause a state-changing action to bypass expected review.',
    before: {
      title: 'Misleading annotation',
      framing: 'The tool claims to read but silently updates a preference.',
      steps: [
        {
          label: 'Discover as read-only',
          detail: 'Policy treats the capability as observational.',
          state: 'Mutation risk is hidden',
        },
        {
          label: 'Invoke casually',
          detail: 'Execution changes stored state.',
          state: 'Side effect occurs without review',
        },
        {
          label: 'Notice later',
          detail: 'The UI reflects an unexpected preference.',
          state: 'Annotation and outcome conflict',
        },
      ],
    },
    after: {
      title: 'Truthful behavior',
      framing:
        'The contract declares the write and exposes its state transition.',
      steps: [
        {
          label: 'Declare mutation',
          detail: 'Set readOnlyHint to false.',
          state: 'Policy sees the write boundary',
        },
        {
          label: 'Review effect',
          detail: 'Show the exact preference change.',
          state: 'User can approve the mutation',
        },
        {
          label: 'Return transition',
          detail: 'Report previous and new values.',
          state: 'Effect is verifiable',
        },
      ],
    },
    tool: {
      name: 'set_notification_preference',
      title: 'Set notification preference',
      description:
        'Change one synthetic notification preference and return the transition.',
      annotations: { readOnlyHint: false },
      inputSchema: closedObjectSchema(
        {
          channel: { type: 'string', enum: ['email', 'in_app'] },
          enabled: { type: 'boolean' },
        },
        ['channel', 'enabled'],
      ),
      exampleInput: { channel: 'in_app', enabled: true },
      exampleResult: {
        channel: 'in_app',
        previous_enabled: false,
        enabled: true,
      },
    },
    verification: {
      question: 'Did declared behavior match the actual effect?',
      beforeState: 'The annotation says read while visible state changes.',
      afterState: 'The mutation is declared and its transition returned.',
      checks: ['readOnlyHint is false', 'Previous and new values are explicit'],
    },
    confirmation: {
      level: 'review',
      trigger: 'Before changing the stored preference.',
      behavior: 'Show the channel and requested state.',
      rationale:
        'Even a reversible preference write should not masquerade as observation.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'untrusted-content-isolation',
    category: 'security',
    title: 'Keep retrieved content in the data lane',
    eyebrow: 'Prompt injection · untrusted output · provenance',
    summary:
      'Label external text as untrusted and return it as bounded data rather than instructions.',
    lesson:
      'Content retrieved by a tool may be useful evidence without gaining authority over the agent.',
    risk: 'A page or record can contain text that tries to redirect the agent or exfiltrate data.',
    before: {
      title: 'Content becomes instruction',
      framing: 'Retrieved prose is blended into trusted control context.',
      steps: [
        {
          label: 'Fetch record',
          detail: 'Read synthetic user-authored text.',
          state: 'Content origin is not preserved',
        },
        {
          label: 'Encounter directive',
          detail: 'Text tells the agent to ignore the task.',
          state: 'Data competes with instructions',
        },
        {
          label: 'Follow detour',
          detail: 'The agent may attempt an unrelated action.',
          state: 'Authority boundary is lost',
        },
      ],
    },
    after: {
      title: 'Isolated untrusted data',
      framing:
        'The contract labels content, caps it, and preserves provenance.',
      steps: [
        {
          label: 'Fetch bounded fields',
          detail: 'Return only needed text and identifiers.',
          state: 'Payload is minimized',
        },
        {
          label: 'Label untrusted',
          detail: 'Set the untrusted content annotation.',
          state: 'Policy treats prose as data',
        },
        {
          label: 'Verify provenance',
          detail: 'Return source record ID and observed field.',
          state: 'Evidence remains traceable',
        },
      ],
    },
    tool: {
      name: 'read_public_comment',
      title: 'Read public comment',
      description: 'Read one bounded synthetic public comment with provenance.',
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        { comment_id: stableId('Stable comment ID.') },
        ['comment_id'],
      ),
      exampleInput: { comment_id: 'comment_42' },
      exampleResult: {
        comment_id: 'comment_42',
        author_label: 'Synthetic visitor',
        text: 'Untrusted example content.',
        content_truncated: false,
      },
    },
    verification: {
      question: 'Can content be used without granting it authority?',
      beforeState: 'Origin and trust level are implicit.',
      afterState:
        'Annotation, record ID, and bounded fields preserve the boundary.',
      checks: ['Output is labeled untrusted', 'Source record ID is returned'],
    },
    confirmation: {
      level: 'none',
      trigger: 'Reading a public synthetic comment has no side effect.',
      behavior:
        'No approval is needed; any instruction inside the comment is ignored as untrusted data.',
      rationale: 'Trust labeling, not confirmation, protects this read path.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'parameter-minimization',
    category: 'security',
    title: 'Ask only for data the action needs',
    eyebrow: 'Data minimization · purpose · schema',
    summary:
      'Contrast a fingerprinting-shaped payload with a purpose-limited preference query.',
    lesson:
      'A convenient parameter is not automatically a necessary parameter.',
    risk: 'Excess personal fields expand privacy exposure and create profiling pressure.',
    before: {
      title: 'Personalization sprawl',
      framing:
        'A simple recommendation asks for demographic and history fields.',
      steps: [
        {
          label: 'Collect profile',
          detail: 'Request attributes unrelated to the task.',
          state: 'Sensitive payload expands',
        },
        {
          label: 'Infer preferences',
          detail: 'Use opaque personalization logic.',
          state: 'Purpose is difficult to audit',
        },
        {
          label: 'Return choice',
          detail: 'Provide a result without explaining required inputs.',
          state: 'Data necessity remains unknown',
        },
      ],
    },
    after: {
      title: 'Purpose-limited inputs',
      framing: 'The contract asks for explicit task preferences only.',
      steps: [
        {
          label: 'State purpose',
          detail: 'Define the decision the tool supports.',
          state: 'Purpose is narrow',
        },
        {
          label: 'Collect preferences',
          detail: 'Accept only directly relevant constraints.',
          state: 'No demographic profile required',
        },
        {
          label: 'Explain match',
          detail: 'Return which preferences each option satisfies.',
          state: 'Inputs and output are traceable',
        },
      ],
    },
    tool: {
      name: 'recommend_workspace_layout',
      title: 'Recommend workspace layout',
      description: 'Match synthetic layouts to explicit workspace preferences.',
      annotations: { readOnlyHint: true },
      inputSchema: closedObjectSchema(
        {
          collaboration_style: {
            type: 'string',
            enum: ['focus', 'pairing', 'mixed'],
          },
          accessibility_needs: {
            type: 'array',
            maxItems: 4,
            uniqueItems: true,
            items: {
              type: 'string',
              enum: ['low_motion', 'high_contrast', 'keyboard_first'],
            },
          },
        },
        ['collaboration_style'],
      ),
      exampleInput: {
        collaboration_style: 'mixed',
        accessibility_needs: ['keyboard_first'],
      },
      exampleResult: {
        layout_id: 'split_workspace',
        matched_preferences: ['mixed', 'keyboard_first'],
      },
    },
    verification: {
      question: 'Is every requested field necessary to the stated purpose?',
      beforeState: 'Personal data is accepted without a field-level rationale.',
      afterState: 'Only explicit task preferences are present.',
      checks: [
        'No demographic fields are requested',
        'Returned reasons map to supplied preferences',
      ],
    },
    confirmation: {
      level: 'review',
      trigger: 'Before submitting optional accessibility preferences.',
      behavior:
        'Explain why each optional field affects the synthetic recommendation.',
      rationale:
        'The user should understand even low-risk preference collection.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'authorization-scope',
    category: 'security',
    title: 'Re-check authorization inside execution',
    eyebrow: 'Identity · object scope · deny by default',
    summary:
      'Show that discovering a tool does not authorize access to every object it can name.',
    lesson:
      'Authorization belongs at the business operation, after inputs are known.',
    risk: 'A valid user can otherwise supply an ID belonging to another workspace.',
    before: {
      title: 'Discovery implies access',
      framing: 'The tool accepts any syntactically valid record ID.',
      steps: [
        {
          label: 'Discover tool',
          detail: 'An authenticated user sees the capability.',
          state: 'Capability is available',
        },
        {
          label: 'Supply object ID',
          detail: 'Pass an ID from another synthetic workspace.',
          state: 'Ownership is unchecked',
        },
        {
          label: 'Read record',
          detail: 'Execution returns data based on ID alone.',
          state: 'Object authorization fails',
        },
      ],
    },
    after: {
      title: 'Object-scoped authorization',
      framing: 'Execution resolves the caller and checks workspace membership.',
      steps: [
        {
          label: 'Resolve caller',
          detail: 'Use the current authenticated session.',
          state: 'Caller identity is server-owned',
        },
        {
          label: 'Check membership',
          detail: 'Verify access to the requested object.',
          state: 'Authorization precedes data access',
        },
        {
          label: 'Return or deny',
          detail: 'Return bounded fields or a typed denial.',
          state: 'Cross-workspace access is blocked',
        },
      ],
    },
    tool: {
      name: 'read_workspace_record',
      title: 'Read workspace record',
      description:
        'Read a synthetic record only when the current caller is authorized.',
      annotations: { readOnlyHint: true },
      inputSchema: closedObjectSchema(
        { record_id: stableId('Stable record identifier.') },
        ['record_id'],
      ),
      exampleInput: { record_id: 'record_alpha' },
      exampleResult: {
        record_id: 'record_alpha',
        workspace_id: 'workspace_demo',
        authorization: 'granted',
      },
    },
    verification: {
      question: 'Was authorization evaluated for the named object?',
      beforeState: 'Tool visibility is treated as sufficient authority.',
      afterState: 'The result or denial records object-scoped authorization.',
      checks: [
        'Caller identity does not come from tool input',
        'Object membership is checked before access',
      ],
    },
    confirmation: {
      level: 'none',
      trigger: 'Authorized read access has no mutation.',
      behavior:
        'No approval is required; authorization failure returns no record data.',
      rationale:
        'Access control, not repeated confirmation, protects an ordinary read.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'consequential-action-confirmation',
    category: 'security',
    title: 'Pause at the consequential boundary',
    eyebrow: 'Preview · approval · execution',
    summary:
      'Prepare a destructive action safely and execute only after a specific human approval.',
    lesson:
      'Confirmation is most useful when it names the target and consequence at the last safe moment.',
    risk: 'Early or vague approval can cover a different target than the one eventually selected.',
    before: {
      title: 'Vague early consent',
      framing:
        'The user is asked to “continue” before the final target is known.',
      steps: [
        {
          label: 'Ask generally',
          detail: 'Request approval for an unspecified cleanup.',
          state: 'Consent lacks a target',
        },
        {
          label: 'Resolve target',
          detail: 'Select a record later in the flow.',
          state: 'Approved scope has shifted',
        },
        {
          label: 'Delete',
          detail: 'Execute without a target-specific pause.',
          state: 'Consequence may surprise the user',
        },
      ],
    },
    after: {
      title: 'Last-moment confirmation',
      framing: 'The tool prepares a deletion plan and stops before execution.',
      steps: [
        {
          label: 'Resolve exact target',
          detail: 'Load stable ID, name, and recovery policy.',
          state: 'Target is explicit',
        },
        {
          label: 'Preview consequence',
          detail: 'Show what disappears and whether recovery exists.',
          state: 'Action is blocked',
        },
        {
          label: 'Execute after approval',
          detail: 'Use a short-lived plan identifier.',
          state: 'Deletion is attributable and verifiable',
        },
      ],
    },
    tool: {
      name: 'prepare_record_deletion',
      title: 'Prepare record deletion',
      description:
        'Prepare deletion of one synthetic record without executing it.',
      annotations: { readOnlyHint: true },
      inputSchema: closedObjectSchema(
        { record_id: stableId('Stable record identifier.') },
        ['record_id'],
      ),
      exampleInput: { record_id: 'record_old_draft' },
      exampleResult: {
        plan_id: 'delete_plan_demo',
        record_id: 'record_old_draft',
        recoverable: true,
        executed: false,
      },
    },
    verification: {
      question: 'Did approval name the exact consequence and target?',
      beforeState: 'Consent is detached from the resolved object.',
      afterState:
        'A reviewable plan binds target, recovery, and execution state.',
      checks: [
        'Plan identifies the stable target',
        'Executed remains false before confirmation',
      ],
    },
    confirmation: {
      level: 'required',
      trigger:
        'After the deletion plan is visible and immediately before execution.',
      behavior:
        'Require explicit approval of target ID, display name, and recovery policy.',
      rationale:
        'Deletion is consequential and must use target-specific action-time consent.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'origin-boundary',
    category: 'security',
    title: 'Keep tools bound to their document origin',
    eyebrow: 'Origin · embedded context · exposure',
    summary:
      'Expose a capability only in the trusted document context that owns its state.',
    lesson:
      'A framed or cross-origin surface should not inherit tool authority merely because it can display the UI.',
    risk: 'An untrusted embed can otherwise discover or invoke capabilities belonging to its parent.',
    before: {
      title: 'Ambient exposure',
      framing:
        'Tool availability follows visual embedding rather than origin ownership.',
      steps: [
        {
          label: 'Embed interface',
          detail: 'Render a cross-origin synthetic frame.',
          state: 'Visual access exists',
        },
        {
          label: 'Discover parent tool',
          detail: 'The embed sees a capability it does not own.',
          state: 'Exposure crosses origin boundary',
        },
        {
          label: 'Attempt action',
          detail: 'Invocation reaches parent state.',
          state: 'Origin isolation is lost',
        },
      ],
    },
    after: {
      title: 'Origin-owned exposure',
      framing:
        'Registration stays with the trusted document and validates context.',
      steps: [
        {
          label: 'Bind owner origin',
          detail: 'Register only in the document that owns the state.',
          state: 'Ownership is explicit',
        },
        {
          label: 'Limit embedding',
          detail: 'Do not expose the tool into an untrusted frame.',
          state: 'Discovery is origin-scoped',
        },
        {
          label: 'Verify context',
          detail: 'Reject execution when owner context is absent.',
          state: 'Cross-origin invocation is blocked',
        },
      ],
    },
    tool: {
      name: 'read_origin_owned_panel',
      title: 'Read origin-owned panel',
      description:
        'Read synthetic panel state only from its trusted owner document.',
      annotations: { readOnlyHint: true },
      inputSchema: closedObjectSchema(
        { panel_id: stableId('Stable panel identifier.') },
        ['panel_id'],
      ),
      exampleInput: { panel_id: 'panel_account_summary' },
      exampleResult: {
        panel_id: 'panel_account_summary',
        owner_origin: 'https://demo.invalid',
        context_valid: true,
      },
    },
    verification: {
      question: 'Is capability exposure limited to the state-owning origin?',
      beforeState: 'Visual embedding and authority are conflated.',
      afterState: 'Owner origin and context validity are explicit.',
      checks: [
        'Untrusted frame cannot discover the tool',
        'Execution validates owner context',
      ],
    },
    confirmation: {
      level: 'none',
      trigger:
        'The pattern reads synthetic panel state only after origin validation.',
      behavior:
        'No approval is needed; invalid contexts are denied before data is returned.',
      rationale: 'Origin isolation is the primary boundary for this read.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
] as const satisfies readonly DemoScenario[];
