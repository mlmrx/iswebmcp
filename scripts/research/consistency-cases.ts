/** Authored before the first pilot execution. Do not weaken failed relations. */
export const protocolVersion = 'synthetic-consistency-v1';

export type Relation =
  | 'same-assessment'
  | 'same-score-and-actions'
  | 'field-name-decrease'
  | 'field-name-increase'
  | 'feedback-increase'
  | 'hint-only'
  | 'truncated-uncertainty'
  | 'goal-not-source'
  | 'transport-decrease';

export interface PilotCase {
  id: string;
  family: string;
  relation: Relation;
  assumption: string;
  before: string;
  after: string;
  afterOptions?: { truncated?: boolean; goal?: string; normalizedUrl?: string };
}

const document = (body: string) =>
  `<!doctype html><html><head><title>Owned test fixture</title></head><body><main><h1>Catalog</h1>${body}</main></body></html>`;
const button = '<button type="button">Search</button>';
const field = '<label for="q">Query</label><input id="q" type="search">';
const form = `<form action="/search" method="get">${field}<button type="submit">Search</button></form>`;
const base = document(form);
const plain = document(button);
const script =
  '<script>document.modelContext.registerTool({name:"search"});</script>';
const jsonLd =
  '<script type="application/ld+json">{"@type":"Product"}</script>';

export const cases: PilotCase[] = [
  {
    id: 'comment-controls',
    family: 'inert-markup',
    relation: 'same-assessment',
    assumption: 'HTML comments cannot add rendered form controls.',
    before: base,
    after: base.replace(
      '</main>',
      '<!-- <form><input><button>Delete</button></form> --></main>',
    ),
  },
  {
    id: 'comment-script-hint',
    family: 'inert-markup',
    relation: 'same-assessment',
    assumption:
      'A script inside an HTML comment is not a script element and cannot register tools.',
    before: base,
    after: base.replace('</main>', `<!-- ${script} --></main>`),
  },
  {
    id: 'template-script-hint',
    family: 'inert-markup',
    relation: 'same-assessment',
    assumption:
      'Template contents are not active absent instantiation; this fixture has no instantiation code.',
    before: base,
    after: base.replace(
      '</main>',
      `<template>${script}<button>Delete</button></template></main>`,
    ),
  },
  {
    id: 'escaped-code-example',
    family: 'inert-markup',
    relation: 'same-assessment',
    assumption:
      'Escaped documentation inside pre/code adds no controls or executable scripts.',
    before: base,
    after: base.replace(
      '</main>',
      '<pre><code>&lt;button&gt;Delete&lt;/button&gt; document.modelContext.registerTool({})</code></pre></main>',
    ),
  },
  {
    id: 'comment-structured-data',
    family: 'inert-markup',
    relation: 'same-assessment',
    assumption:
      'A commented JSON-LD example cannot establish a structured-data block.',
    before: base,
    after: base.replace('</main>', `<!-- ${jsonLd} --></main>`),
  },
  {
    id: 'comment-page-title',
    family: 'inert-markup',
    relation: 'same-assessment',
    assumption: 'A commented title cannot establish document identity.',
    before: base.replace('<title>Owned test fixture</title>', ''),
    after: base.replace(
      '<title>Owned test fixture</title>',
      '<!-- <title>Owned test fixture</title> -->',
    ),
  },
  {
    id: 'duplicate-action-control',
    family: 'duplication',
    relation: 'same-score-and-actions',
    assumption:
      'Duplicating the same named button changes raw count, not action diversity or naming ratio.',
    before: plain,
    after: document(button + button),
  },
  {
    id: 'duplicate-status-region',
    family: 'duplication',
    relation: 'same-score-and-actions',
    assumption:
      'Repeating one live-region type adds no new feedback signal type.',
    before: document(button + '<p role="status">Ready</p>'),
    after: document(
      button + '<p role="status">Ready</p><p role="status">Ready</p>',
    ),
  },
  {
    id: 'duplicate-structured-data',
    family: 'duplication',
    relation: 'same-score-and-actions',
    assumption:
      'Repeating identical JSON-LD changes raw count but adds no distinct semantic evidence.',
    before: document(button + jsonLd),
    after: document(button + jsonLd + jsonLd),
  },
  {
    id: 'attribute-order',
    family: 'representation',
    relation: 'same-assessment',
    assumption: 'Ordering distinct attributes does not change HTML meaning.',
    before: base,
    after: base
      .replace('id="q" type="search"', 'type="search" id="q"')
      .replace(
        'action="/search" method="get"',
        'method="get" action="/search"',
      ),
  },
  {
    id: 'html-tag-case',
    family: 'representation',
    relation: 'same-assessment',
    assumption:
      'HTML tag names are case-insensitive; action confidence should also be invariant.',
    before: plain,
    after: plain
      .replace('<button', '<BUTTON')
      .replace('</button>', '</BUTTON>'),
  },
  {
    id: 'independent-control-order',
    family: 'representation',
    relation: 'same-assessment',
    assumption:
      'Swapping independent uniquely named actions should preserve the action set and score; sequence is intentionally normalized.',
    before: document(button + '<button>Save</button>'),
    after: document('<button>Save</button>' + button),
  },
  {
    id: 'numeric-label-entity',
    family: 'representation',
    relation: 'same-assessment',
    assumption:
      'Encoding a label character with a numeric entity preserves text.',
    before: plain,
    after: plain.replace('>Search<', '>S&#101;arch<'),
  },
  {
    id: 'remove-label',
    family: 'naming',
    relation: 'field-name-decrease',
    assumption:
      'The field has exactly one explicit nonempty label; removing it removes name evidence.',
    before: base,
    after: base.replace('<label for="q">Query</label>', ''),
  },
  {
    id: 'restore-label',
    family: 'naming',
    relation: 'field-name-increase',
    assumption:
      'Restoring the only explicit nonempty label increases the field-names metric.',
    before: base.replace('<label for="q">Query</label>', ''),
    after: base,
  },
  {
    id: 'empty-label',
    family: 'naming',
    relation: 'field-name-decrease',
    assumption: 'An empty associated label supplies no accessible name.',
    before: base,
    after: base.replace('>Query</label>', '></label>'),
  },
  {
    id: 'dangling-labelledby',
    family: 'naming',
    relation: 'field-name-decrease',
    assumption:
      'A reference to a missing ID supplies no name; no fallback name exists.',
    before: document(
      '<span id="label">Query</span><input aria-labelledby="label">',
    ),
    after: document(
      '<span id="label">Query</span><input aria-labelledby="missing">',
    ),
  },
  {
    id: 'add-live-region',
    family: 'intended-sensitivity',
    relation: 'feedback-increase',
    assumption:
      'Adding a status region adds source evidence but does not prove runtime feedback.',
    before: base,
    after: base.replace('</main>', '<p role="status">Ready</p></main>'),
  },
  {
    id: 'add-inline-registration-hint',
    family: 'evidence-boundary',
    relation: 'hint-only',
    assumption:
      'Inline registration syntax is a source hint only; quality and lift remain unknown and UI score is unchanged.',
    before: base,
    after: base.replace('</main>', `${script}</main>`),
  },
  {
    id: 'bounded-source-window',
    family: 'evidence-boundary',
    relation: 'truncated-uncertainty',
    assumption:
      'The same captured bytes cannot describe unseen suffixes; retain prefix estimate and publish complete-page interval 0–100 with low confidence.',
    before: base,
    after: base,
    afterOptions: { truncated: true },
  },
  {
    id: 'requested-goal-not-source',
    family: 'evidence-boundary',
    relation: 'goal-not-source',
    assumption:
      'A user-requested action without a matching control is inferred only and cannot increase the source score.',
    before: base,
    after: base,
    afterOptions: { goal: 'Delete the item' },
  },
  {
    id: 'http-entry-hop',
    family: 'intended-sensitivity',
    relation: 'transport-decrease',
    assumption:
      'An initial unencrypted hop loses secure-transport evidence even if final URL is HTTPS.',
    before: base,
    after: base,
    afterOptions: { normalizedUrl: 'http://fixture.invalid/' },
  },
];
