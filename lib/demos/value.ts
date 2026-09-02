import { closedObjectSchema, shortText, stableId } from '@/lib/demos/schema';
import type { DemoScenario } from '@/lib/demos/types';

export const valueDemos = [
  {
    slug: 'catalog-research',
    category: 'value',
    title: 'Catalog research without selector archaeology',
    eyebrow: 'Search · compare · shortlist',
    summary:
      'Turn a filter-heavy catalog journey into one explicit search contract and a verifiable shortlist.',
    lesson:
      'The value is not fewer pixels. It is a stable action with constrained inputs and a result the interface can also show.',
    risk: 'The agent can otherwise miss a constraint or mistake visual order for ranking.',
    before: {
      title: 'Inference-heavy interface',
      framing:
        'The agent reconstructs the task from fields, labels, cards, and changing selectors.',
      steps: [
        {
          label: 'Interpret filters',
          detail: 'Map the goal to price, feature, and rating controls.',
          state: 'Intent reconstructed from UI labels',
        },
        {
          label: 'Inspect cards',
          detail: 'Read each visible result and preserve the active filters.',
          state: 'Candidate set inferred from rendered cards',
        },
        {
          label: 'Build shortlist',
          detail: 'Select items and infer that the comparison panel updated.',
          state: 'Completion inferred from visible state',
        },
      ],
    },
    after: {
      title: 'Contract-driven action',
      framing:
        'A named tool accepts the constraints and returns stable item identifiers.',
      steps: [
        {
          label: 'Validate intent',
          detail: 'Reject unsupported filters before the catalog is queried.',
          state: 'Typed constraints accepted',
        },
        {
          label: 'Return candidates',
          detail: 'Return stable IDs and the fields needed for the decision.',
          state: 'Structured candidate set available',
        },
        {
          label: 'Verify shortlist',
          detail: 'Render the same IDs in the human comparison panel.',
          state: 'Visible and structured state agree',
        },
      ],
    },
    tool: {
      name: 'compare_catalog_items',
      title: 'Compare catalog items',
      description:
        'Find and compare public catalog items using explicit constraints.',
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        {
          query: shortText('Words to match in the public catalog.'),
          max_price: {
            type: 'number',
            minimum: 0,
            description: 'Maximum synthetic price.',
          },
          required_features: {
            type: 'array',
            maxItems: 6,
            uniqueItems: true,
            items: { type: 'string', maxLength: 40 },
          },
        },
        ['query'],
      ),
      exampleInput: {
        query: 'noise canceling headset',
        max_price: 300,
        required_features: ['multipoint'],
      },
      exampleResult: {
        item_ids: ['aurora-q45', 'sonic-arc'],
        visible_panel: 'comparison',
      },
    },
    verification: {
      question: 'Did the shortlist preserve every requested constraint?',
      beforeState: 'A person must re-read filters and cards.',
      afterState:
        'Returned IDs, constraints, and the visible comparison panel can be checked together.',
      checks: [
        'Every returned item satisfies the filters',
        'Visible comparison uses the returned stable IDs',
      ],
    },
    confirmation: {
      level: 'none',
      trigger:
        'The pattern only reads a synthetic catalog and updates a reversible shortlist.',
      behavior:
        'No approval is requested; any purchase or submission request is outside this tool.',
      rationale:
        'Read-only discovery should stay frictionless while consequential actions remain separate.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'appointment-shortlist',
    category: 'value',
    title: 'Find appointment options without booking',
    eyebrow: 'Availability · timezone · handoff',
    summary:
      'Separate slot discovery from the consequential act of reserving an appointment.',
    lesson:
      'A well-bounded read tool can narrow choices without silently crossing into a booking action.',
    risk: 'A combined search-and-book tool can turn a harmless query into an accidental commitment.',
    before: {
      title: 'Calendar navigation',
      framing:
        'Availability is spread across date controls, timezones, and provider cards.',
      steps: [
        {
          label: 'Choose dates',
          detail: 'Navigate the calendar and interpret disabled days.',
          state: 'Date window held in UI state',
        },
        {
          label: 'Resolve timezone',
          detail: 'Translate displayed times into the requested timezone.',
          state: 'Timezone interpretation remains implicit',
        },
        {
          label: 'Record options',
          detail:
            'Copy viable slots without selecting the final booking control.',
          state: 'Shortlist exists outside the application',
        },
      ],
    },
    after: {
      title: 'Availability contract',
      framing:
        'The tool returns bookable slot IDs while explicitly stopping before reservation.',
      steps: [
        {
          label: 'Validate window',
          detail: 'Check date range, service, and timezone.',
          state: 'Search window validated',
        },
        {
          label: 'List slot IDs',
          detail: 'Return normalized times with provider and duration.',
          state: 'Stable availability records returned',
        },
        {
          label: 'Hand off choice',
          detail:
            'Show options in the UI and require a separate booking action.',
          state: 'No reservation has occurred',
        },
      ],
    },
    tool: {
      name: 'find_appointment_slots',
      title: 'Find appointment slots',
      description: 'List available appointment slots without reserving one.',
      annotations: { readOnlyHint: true },
      inputSchema: closedObjectSchema(
        {
          service_id: stableId('Public service identifier.'),
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          timezone: { type: 'string', maxLength: 64 },
        },
        ['service_id', 'start_date', 'end_date', 'timezone'],
      ),
      exampleInput: {
        service_id: 'intro-consult',
        start_date: '2030-04-08',
        end_date: '2030-04-12',
        timezone: 'America/Los_Angeles',
      },
      exampleResult: {
        slots: [
          { slot_id: 'slot_wed_1030', local_time: '2030-04-10T10:30:00-07:00' },
        ],
        reservation_created: false,
      },
    },
    verification: {
      question: 'Were real options returned without creating a reservation?',
      beforeState:
        'The person must inspect selection and confirmation screens.',
      afterState:
        'The result declares slot IDs and reservation_created: false.',
      checks: [
        'Times are normalized to the requested timezone',
        'No booking identifier exists',
      ],
    },
    confirmation: {
      level: 'none',
      trigger: 'Discovery has no external side effect.',
      behavior:
        'The pattern stops at a shortlist and exposes a separate booking boundary.',
      rationale:
        'Confirmation belongs immediately before reservation, not before browsing availability.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'support-ticket-update',
    category: 'value',
    title: 'Update a support ticket with a reviewable patch',
    eyebrow: 'Read · draft · confirm',
    summary:
      'Represent a ticket change as an explicit patch so the user can review exactly what will be sent.',
    lesson:
      'Structured patches make mutations legible before they happen and verifiable afterward.',
    risk: 'Free-form UI automation can edit the wrong ticket or submit text the user did not review.',
    before: {
      title: 'Form-driven update',
      framing:
        'The agent must find the ticket, edit several fields, and detect the save boundary.',
      steps: [
        {
          label: 'Locate ticket',
          detail: 'Search and match a visual ticket row.',
          state: 'Ticket identity inferred from page text',
        },
        {
          label: 'Edit fields',
          detail: 'Change status and add a note in separate controls.',
          state: 'Unsaved form state is visible',
        },
        {
          label: 'Submit update',
          detail: 'Cross the save boundary and look for a toast.',
          state: 'Success inferred from a transient message',
        },
      ],
    },
    after: {
      title: 'Reviewable mutation',
      framing:
        'The tool prepares a typed patch, pauses for review, then returns the new version.',
      steps: [
        {
          label: 'Load stable ID',
          detail: 'Resolve the exact synthetic ticket and current version.',
          state: 'Target and version are explicit',
        },
        {
          label: 'Preview patch',
          detail: 'Show changed fields and the note before execution.',
          state: 'Mutation is awaiting approval',
        },
        {
          label: 'Apply and verify',
          detail: 'Return the new version and render it in the ticket view.',
          state: 'Structured and visible versions agree',
        },
      ],
    },
    tool: {
      name: 'update_support_ticket',
      title: 'Update support ticket',
      description: 'Apply a reviewed patch to one synthetic support ticket.',
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        {
          ticket_id: stableId('Stable ticket identifier.'),
          expected_version: { type: 'integer', minimum: 1 },
          status: { type: 'string', enum: ['open', 'waiting', 'resolved'] },
          note: { type: 'string', maxLength: 500 },
        },
        ['ticket_id', 'expected_version', 'note'],
      ),
      exampleInput: {
        ticket_id: 'ticket_1042',
        expected_version: 3,
        status: 'waiting',
        note: 'Asked for the missing receipt.',
      },
      exampleResult: {
        ticket_id: 'ticket_1042',
        previous_version: 3,
        new_version: 4,
        status: 'waiting',
      },
    },
    verification: {
      question: 'Did the intended ticket receive only the reviewed patch?',
      beforeState: 'A toast and the edited form are the primary evidence.',
      afterState:
        'Ticket ID, prior version, new version, and applied fields are returned.',
      checks: [
        'Target ID matches the reviewed ticket',
        'New version is visible after the mutation',
      ],
    },
    confirmation: {
      level: 'required',
      trigger: 'Immediately before the patch is applied to the ticket.',
      behavior:
        'Show the ticket ID and exact field diff; execution stays blocked until approved.',
      rationale:
        'The update communicates externally and changes shared workflow state.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'travel-shortlist',
    category: 'value',
    title:
      'Build a travel shortlist without pretending to price live inventory',
    eyebrow: 'Constraints · provenance · no booking',
    summary:
      'Return a clearly timestamped synthetic itinerary shortlist while keeping booking and live-price claims out of scope.',
    lesson:
      'Truthful scope is part of the contract: discovery results must say what they are and are not.',
    risk: 'An agent can present stale or illustrative options as live, purchasable inventory.',
    before: {
      title: 'Multi-panel search',
      framing:
        'Filters, fare details, and transfer rules are distributed across the interface.',
      steps: [
        {
          label: 'Enter route',
          detail: 'Populate origin, destination, and date controls.',
          state: 'Route lives in form state',
        },
        {
          label: 'Inspect conditions',
          detail: 'Open cards to compare transfers and baggage notes.',
          state: 'Conditions gathered from prose',
        },
        {
          label: 'Save options',
          detail: 'Bookmark candidate cards without booking.',
          state: 'Shortlist has ambiguous freshness',
        },
      ],
    },
    after: {
      title: 'Provenance-first shortlist',
      framing:
        'The tool returns synthetic options, observed time, and explicit booking availability.',
      steps: [
        {
          label: 'Validate route',
          detail: 'Check station IDs, dates, and passenger count.',
          state: 'Search contract accepted',
        },
        {
          label: 'Return provenance',
          detail:
            'Include source label and observation timestamp with each option.',
          state: 'Freshness is explicit',
        },
        {
          label: 'Display shortlist',
          detail:
            'Render options while declaring booking unavailable in this pattern.',
          state: 'No transaction boundary crossed',
        },
      ],
    },
    tool: {
      name: 'build_travel_shortlist',
      title: 'Build travel shortlist',
      description:
        'Compare synthetic itinerary options without booking or claiming live fares.',
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        {
          origin_id: stableId('Synthetic origin station ID.'),
          destination_id: stableId('Synthetic destination station ID.'),
          departure_date: { type: 'string', format: 'date' },
        },
        ['origin_id', 'destination_id', 'departure_date'],
      ),
      exampleInput: {
        origin_id: 'north-terminal',
        destination_id: 'harbor-central',
        departure_date: '2030-05-18',
      },
      exampleResult: {
        options: [{ itinerary_id: 'route_7a', source: 'synthetic-fixture' }],
        booking_available: false,
      },
    },
    verification: {
      question:
        'Can a user distinguish an illustrative option from live inventory?',
      beforeState:
        'Freshness and booking scope may be buried in surrounding copy.',
      afterState:
        'Every result carries provenance and an explicit booking_available field.',
      checks: [
        'Provenance is attached to each result',
        'No live-price or booking claim is made',
      ],
    },
    confirmation: {
      level: 'none',
      trigger:
        'The pattern is read-only and does not reserve or purchase travel.',
      behavior:
        'Any request to book exits this tool and requires a separate confirmed workflow.',
      rationale:
        'Browsing should not be conflated with committing funds or personal details.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'service-plan-comparison',
    category: 'value',
    title: 'Compare plans with explicit assumptions',
    eyebrow: 'Needs · exclusions · decision aid',
    summary:
      'Map stated needs to plan features without silently enrolling the user.',
    lesson:
      'A comparison tool should expose assumptions and exclusions, not manufacture a recommendation.',
    risk: 'A vague “best plan” result can hide unsupported assumptions or cross into enrollment.',
    before: {
      title: 'Marketing-page comparison',
      framing:
        'Feature tables, footnotes, and promotional language must be reconciled manually.',
      steps: [
        {
          label: 'Read feature tables',
          detail: 'Collect limits and exclusions across plan cards.',
          state: 'Plan facts reconstructed from layout',
        },
        {
          label: 'Map needs',
          detail: 'Decide which requirements are mandatory or optional.',
          state: 'Assumptions remain unstated',
        },
        {
          label: 'Choose a candidate',
          detail: 'Select a card while avoiding the enrollment control.',
          state: 'Recommendation lacks an audit trail',
        },
      ],
    },
    after: {
      title: 'Assumption-aware comparison',
      framing:
        'The contract separates requirements from preferences and returns fit reasons.',
      steps: [
        {
          label: 'Classify needs',
          detail: 'Validate required and preferred capabilities.',
          state: 'Decision criteria are explicit',
        },
        {
          label: 'Explain fit',
          detail: 'Return matched requirements and material exclusions.',
          state: 'Reasons are structured',
        },
        {
          label: 'Present candidates',
          detail: 'Show the comparison without enrollment.',
          state: 'Decision aid complete; no subscription created',
        },
      ],
    },
    tool: {
      name: 'compare_service_plans',
      title: 'Compare service plans',
      description:
        'Compare synthetic plans against explicit requirements and preferences.',
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        {
          required_features: {
            type: 'array',
            minItems: 1,
            maxItems: 8,
            uniqueItems: true,
            items: { type: 'string', maxLength: 50 },
          },
          preferred_features: {
            type: 'array',
            maxItems: 8,
            uniqueItems: true,
            items: { type: 'string', maxLength: 50 },
          },
        },
        ['required_features'],
      ),
      exampleInput: {
        required_features: ['team access', 'export'],
        preferred_features: ['audit log'],
      },
      exampleResult: {
        candidates: [
          {
            plan_id: 'team-standard',
            matched: ['team access', 'export'],
            exclusions: ['advanced audit log'],
          },
        ],
        enrolled: false,
      },
    },
    verification: {
      question: 'Is the recommendation traceable to stated needs?',
      beforeState: 'The rationale is implicit in the selected card.',
      afterState:
        'Matches, exclusions, and enrollment state are returned explicitly.',
      checks: [
        'All required features are evaluated',
        'Enrollment remains false',
      ],
    },
    confirmation: {
      level: 'review',
      trigger: 'Before the comparison is treated as a final recommendation.',
      behavior:
        'Ask the user to review assumptions; enrollment remains a separate required-confirmation action.',
      rationale:
        'Decision support benefits from human review even when no account change occurs.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
  {
    slug: 'cms-publish-boundary',
    category: 'value',
    title: 'Keep drafting separate from publishing',
    eyebrow: 'Draft · preview · publish gate',
    summary:
      'Expose draft preparation as reversible work and publishing as a separate confirmed action.',
    lesson:
      'Tool boundaries should follow consequence boundaries, not mirror one oversized form.',
    risk: 'A combined edit-and-publish action can make unreviewed content public.',
    before: {
      title: 'Editor workflow',
      framing: 'Draft, preview, and publish controls coexist in one interface.',
      steps: [
        {
          label: 'Edit content',
          detail: 'Change title and body in the editor.',
          state: 'Local draft is unsaved',
        },
        {
          label: 'Preview page',
          detail: 'Open a preview and inspect formatting.',
          state: 'Preview is visually reviewable',
        },
        {
          label: 'Publish',
          detail: 'Use the nearby public-release control.',
          state: 'External visibility inferred from banner',
        },
      ],
    },
    after: {
      title: 'Separated consequence boundary',
      framing:
        'One tool saves a draft; a distinct tool would publish only after approval.',
      steps: [
        {
          label: 'Save draft',
          detail: 'Write content to a non-public revision.',
          state: 'Draft revision returned',
        },
        {
          label: 'Generate preview',
          detail: 'Return a safe preview reference and diff.',
          state: 'Review artifact available',
        },
        {
          label: 'Request approval',
          detail: 'Stop before the publication action.',
          state: 'Publishing is blocked at the human boundary',
        },
      ],
    },
    tool: {
      name: 'prepare_cms_draft',
      title: 'Prepare CMS draft',
      description: 'Save and preview a synthetic draft without publishing it.',
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      inputSchema: closedObjectSchema(
        {
          document_id: stableId('Stable document identifier.'),
          expected_revision: { type: 'integer', minimum: 1 },
          title: { type: 'string', minLength: 1, maxLength: 120 },
          body: { type: 'string', maxLength: 5000 },
        },
        ['document_id', 'expected_revision', 'title', 'body'],
      ),
      exampleInput: {
        document_id: 'guide_webmcp',
        expected_revision: 7,
        title: 'A safer tool contract',
        body: 'Synthetic draft content.',
      },
      exampleResult: {
        draft_revision: 8,
        preview_id: 'preview_8',
        published: false,
      },
    },
    verification: {
      question: 'Was a reviewable draft created without becoming public?',
      beforeState: 'The user checks editor badges and the public page.',
      afterState:
        'The result returns a draft revision, preview ID, and published: false.',
      checks: ['Draft revision advanced', 'Published state remains false'],
    },
    confirmation: {
      level: 'required',
      trigger:
        'A separate publish tool would pause immediately before public release.',
      behavior:
        'Show the reviewed revision and destination; this illustrative tool never publishes.',
      rationale:
        'Public communication is consequential and must remain a distinct confirmed action.',
    },
    evidenceLabel: 'Illustrative synthetic pattern',
  },
] as const satisfies readonly DemoScenario[];
