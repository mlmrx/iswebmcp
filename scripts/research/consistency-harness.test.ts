import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assess,
  collect,
  evaluate,
  project,
  resolveOutput,
  sha256,
} from './run-consistency-pilot';
import { cases } from './consistency-cases';
import { recoverRecordedBytes } from './provenance';

void test('provenance reconstructs LF and CRLF checkouts only when exact recorded hash matches', () => {
  const lf = Buffer.from('first\nsecond\n');
  const crlf = Buffer.from('first\r\nsecond\r\n');
  assert.deepEqual(recoverRecordedBytes(crlf, sha256(lf)), lf);
  assert.deepEqual(recoverRecordedBytes(lf, sha256(crlf)), crlf);
  assert.equal(
    recoverRecordedBytes(Buffer.from('changed\nsecond\n'), sha256(lf)),
    undefined,
  );
});

void test('catalog has unique IDs, explicit assumptions, and both invariant and sensitive relations', () => {
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  assert.ok(cases.every((c) => c.assumption.length > 30));
  assert.ok(cases.some((c) => c.relation === 'same-assessment'));
  assert.ok(cases.some((c) => c.relation === 'field-name-decrease'));
});

void test('normalization excludes randomized report IDs but retains action confidence', () => {
  const first = assess('<button>Search</button>');
  const second = assess('<button>Search</button>');
  assert.notEqual(first.id, second.id);
  assert.deepEqual(project(first), project(second));
  second.actionSurface[0].agentUiConfidence = 'low';
  assert.notDeepEqual(project(first), project(second));
});

void test('directional oracle rejects unchanged metrics and accepts actual label removal', () => {
  const definition = cases.find((c) => c.id === 'remove-label')!;
  const before = assess(definition.before);
  assert.equal(evaluate(definition, before, before).passed, false);
  assert.equal(
    evaluate(definition, before, assess(definition.after)).passed,
    true,
  );
});

void test('invariance oracle exposes a changed implementation state', () => {
  const definition = cases.find((c) => c.id === 'comment-controls')!;
  const before = assess(definition.before);
  const after = structuredClone(before);
  after.implementationState = 'source_hint_detected';
  assert.equal(evaluate(definition, before, after).passed, false);
});

void test('collection is deterministic and fixture hashes bind exact inputs', () => {
  const first = collect();
  assert.deepEqual(first, collect());
  assert.equal(first.rows.length, cases.length);
  assert.ok(
    first.rows.every(
      (r) => r.beforeFixture.sha256 === sha256(r.beforeFixture.html),
    ),
  );
  assert.equal(first.passed + first.failed, first.fixturePairCount);
});

void test('output cannot escape owned research results directory', () => {
  assert.throws(() => resolveOutput('lib/scanner.json'));
  assert.throws(() =>
    resolveOutput(
      'docs/research/automated-consistency/results/../protocol.json',
    ),
  );
  assert.ok(
    resolveOutput(
      'docs/research/automated-consistency/results/test.json',
    ).endsWith('test.json'),
  );
});
