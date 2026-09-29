import type { Metadata } from 'next';
import Link from 'next/link';

const paperSource =
  'https://github.com/mlmrx/iswebmcp/blob/main/docs/research/automated-consistency';

export const metadata: Metadata = {
  title:
    'Metamorphic Consistency and Failure Modes of Source-Level Web Readiness Assessment',
  description:
    'An internal synthetic pilot testing whether a source analyzer preserves assessments under equivalent markup changes, responds to evidence removal, and retains uncertainty without runtime observations.',
  alternates: { canonical: '/research/metamorphic-consistency' },
  openGraph: {
    title:
      'Metamorphic Consistency and Failure Modes of Source-Level Web Readiness Assessment',
    description:
      'A 22-pair internal synthetic pilot of source-level assessment consistency, failure modes, and evidence boundaries.',
    type: 'article',
    url: 'https://iswebmcp.com/research/metamorphic-consistency',
  },
};

const families = [
  {
    name: 'Inert markup',
    pairs: 6,
    passed: 2,
    failed: 4,
    expectation:
      'Comments, uninstantiated template content, and escaped code examples do not create active semantic evidence.',
  },
  {
    name: 'Duplication',
    pairs: 3,
    passed: 3,
    failed: 0,
    expectation:
      'Repeating existing signals can change raw counts without increasing semantic-diversity points.',
  },
  {
    name: 'Representation',
    pairs: 4,
    passed: 3,
    failed: 1,
    expectation:
      'Equivalent attribute order, tag case, action order, and entity encoding preserve normalized assessment.',
  },
  {
    name: 'Naming',
    pairs: 4,
    passed: 2,
    failed: 2,
    expectation:
      'Removing valid names lowers field-name points; empty labels and unresolved references receive no credit.',
  },
  {
    name: 'Intended sensitivity',
    pairs: 2,
    passed: 2,
    failed: 0,
    expectation:
      'A status region adds feedback evidence; an unencrypted entry hop lowers transport evidence.',
  },
  {
    name: 'Evidence boundaries',
    pairs: 3,
    passed: 3,
    failed: 0,
    expectation:
      'Registration stays a hint, truncated input retains uncertainty, and a requested goal cannot raise source-derived points.',
  },
];

const failures = [
  'A registration-like script in an HTML comment changed implementation classification from no detected hint to a source hint; the aggregate score stayed 67.',
  'The same script in an uninstantiated template caused the same classification change, again with no score change.',
  'A commented JSON-LD block raised the score from 67 to 71 and counted as structured data.',
  'A commented title raised the score from 65 to 67 by contributing page-identity evidence.',
  'Changing the spelling of `button` to uppercase preserved the score of 46 but lowered action UI confidence from high to medium.',
  'Replacing a field’s only nonempty label with an empty associated label retained 55/55 field-name points and an aggregate score of 67.',
  'Replacing a valid `aria-labelledby` target with an unresolved reference retained 55/55 field-name points and an aggregate score of 49.',
];

function EvidenceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="font-medium text-foreground underline decoration-primary/50 underline-offset-4 hover:decoration-primary"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

export default function MetamorphicConsistencyPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-20"
    >
      <header className="border-b border-border bg-gradient-to-b from-primary/8 to-background">
        <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
          <Link
            href="/pulse"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Research
          </Link>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="rounded-full border border-border bg-card px-3 py-1.5">
              Working research draft
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1.5">
              Internal synthetic pilot
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1.5">
              September 5, 2026
            </span>
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Metamorphic Consistency and Failure Modes of Source-Level Web
            Readiness Assessment
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-8 text-muted-foreground">
            Does a source analyzer preserve its assessment under inert or
            equivalent markup changes, respond to targeted evidence removal, and
            retain uncertainty when runtime observations are absent?
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              href={`${paperSource}/paper-draft.md`}
            >
              Read the full manuscript (Markdown)
            </a>
            <a
              className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              href={`${paperSource}/results/baseline.md`}
            >
              Baseline case inventory
            </a>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground">
            This is an internal engineering pilot. It is not submitted or peer
            reviewed, and makes no claim of research novelty. It evaluates the
            isWebMCP source analyzer, not WebMCP agents or real-world task
            success. Human author names and affiliations remain to be supplied
            and reviewed.
          </p>
        </div>
      </header>

      <article className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:px-8 lg:py-14">
        <section
          aria-labelledby="abstract"
          className="instrument-card p-6 sm:p-8"
        >
          <p className="eyebrow">Abstract</p>
          <h2 id="abstract" className="sr-only">
            Abstract
          </h2>
          <p className="mt-3 text-base leading-8 text-muted-foreground">
            Source-based assessments can mislead when non-executing markup is
            mistaken for an active interface or equivalent HTML changes alter
            output metadata. We constructed 22 paired synthetic cases across
            inert markup, duplication, representation, accessible naming,
            intended sensitivity, and evidence boundaries. Each case declared an
            expected relation and its assumptions before execution. A
            deterministic local harness ran the analyzer without network
            collection, model calls, or human participants. Fifteen relations
            held and seven failed. Observed failures included hints inferred
            from commented or inert template scripts, score increases from
            commented metadata, case-sensitive confidence assignment, and full
            field-name credit for empty labels or unresolved references. The
            small white-box, purposively selected suite does not estimate
            real-world failure prevalence, predict agent task completion, or
            establish accessibility conformance.
          </p>
        </section>

        <section
          className="grid gap-4 sm:grid-cols-3"
          aria-label="Study at a glance"
        >
          {[
            ['22', 'paired synthetic cases'],
            ['15 / 7', 'baseline relations passed / failed'],
            ['22 / 22', 'same-suite post-fix relations passed'],
          ].map(([value, label]) => (
            <div key={label} className="instrument-card p-5">
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </section>

        <section className="instrument-card p-6 sm:p-8">
          <p className="eyebrow">1 · Question and scope</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Consistency of reported source evidence
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            isWebMCP extracts action candidates, source hints, category scores,
            and limitations from HTML. It does not execute the input
            application. This study therefore evaluates consistency of reported
            source evidence, not successful registration, authorization, task
            execution, end-user benefit, or WebMCP deployment readiness. The
            contribution is a reproducible set of counterexamples and preserved
            observations for one implementation; novelty and generality have not
            been established.
          </p>
        </section>

        <section className="instrument-card p-6 sm:p-8">
          <p className="eyebrow">2 · Method</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Twenty-two paired relations, six families
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Metamorphic testing checks expected relationships between outputs
            for related inputs when a complete expected output is difficult to
            specify. The case catalog and protocol were written before the first
            execution, but after reviewing the scanner implementation and
            existing tests. This is white-box exploratory work, not
            preregistered confirmatory research.
          </p>
          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-muted/70 text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Family</th>
                  <th className="px-4 py-3 font-semibold">Pairs</th>
                  <th className="px-4 py-3 font-semibold">Pass / fail</th>
                  <th className="px-4 py-3 font-semibold">
                    Declared expectation
                  </th>
                </tr>
              </thead>
              <tbody>
                {families.map((family) => (
                  <tr
                    key={family.name}
                    className="border-t border-border align-top"
                  >
                    <th scope="row" className="px-4 py-3 font-medium">
                      {family.name}
                    </th>
                    <td className="px-4 py-3 tabular-nums">{family.pairs}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {family.passed} / {family.failed}
                    </td>
                    <td className="px-4 py-3 leading-6 text-muted-foreground">
                      {family.expectation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 leading-7 text-muted-foreground">
            Inputs were owned HTML strings associated with a reserved
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-sm">
              .invalid
            </code>
            URL. The analyzer was called directly; no URL was fetched. The
            harness fixed the analyzer date, computed UTF-8 byte lengths, and
            compared meaningful outputs while excluding random report IDs. It
            retained action confidence and risk, metric points, coverage,
            implementation classification, findings, and uncertainty. Every pair
            produced an analyzable result; there were no collection exceptions.
            The denominator is paired relations, not independently sampled
            applications, and many before-inputs are shared.
          </p>
        </section>

        <section className="instrument-card p-6 sm:p-8">
          <p className="eyebrow">3 · Baseline findings</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Seven declared relations failed
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            These are violations of the declared relations, not seven
            statistically independent root causes. Source inspection suggests
            three implementation-level explanations: raw-HTML metadata and
            script extraction bypassed inert-content filtering; action
            confidence used a case-sensitive tag-prefix check; and name
            detection credited attribute or relationship presence without
            establishing nonempty referenced text. Those explanations are
            grounded hypotheses, not a separate causal experiment across
            parsers.
          </p>
          <ol className="mt-6 grid gap-3">
            {failures.map((failure, index) => (
              <li
                key={failure}
                className="flex gap-4 rounded-xl border border-border bg-background p-4 leading-7 text-muted-foreground"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-warning/12 text-sm font-semibold text-warning">
                  {index + 1}
                </span>
                <span>{failure}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-xl border border-success/25 bg-success/5 p-5">
            <h3 className="font-semibold">Preserved evidence boundaries</h3>
            <p className="mt-2 leading-7 text-muted-foreground">
              Duplicate buttons, status regions, and JSON-LD did not inflate
              tested score components. Ordinary label removal and restoration
              were detected. The tested inline-registration case gained no
              runtime quality or lift. Truncated input retained a prefix
              estimate, lowered confidence, and exposed a 0–100 full-page
              interval. A user-supplied goal did not raise the source score.
              These observations apply only to the tested cases.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <p className="eyebrow text-primary">
            4 · Separate intervention replay
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            The corrected version passed the same disclosed suite
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            After the baseline was recorded, the platform implementation was
            corrected without changing the case catalog, relation predicates, or
            protocol. A separately recorded run of
            <code className="mx-1 rounded bg-background px-1.5 py-0.5 text-sm">
              source-actionability-v2.2
            </code>
            satisfied all 22 relations; the seven formerly failing pairs passed
            and the 15 passing pairs remained passing. The source-hash
            comparison reports only
            <code className="mx-1 rounded bg-background px-1.5 py-0.5 text-sm">
              lib/scanner.ts
            </code>
            changed among the eight tracked files.
          </p>
          <p className="mt-4 leading-7 text-muted-foreground">
            This is targeted intervention evidence on the same disclosed cases,
            not held-out validation. It shows that these counterexamples were
            resolved under the recorded assumptions; it does not show
            generalization, calibrate scores against agent success, or support a
            quality certification.
          </p>
        </section>

        <section className="instrument-card p-6 sm:p-8">
          <p className="eyebrow">5 · Limitations and next work</p>
          <h2 className="mt-2 text-2xl font-semibold">
            What these results do not establish
          </h2>
          <ul className="mt-5 grid gap-3 text-muted-foreground sm:grid-cols-2">
            {[
              [
                'Selection and author bias',
                'One product’s developers chose cases after reviewing its implementation; there was no random sample, blinded evaluation, or external relation review.',
              ],
              [
                'Construct validity',
                'Score consistency is not accessible-name conformance, calibrated readiness, or agent task success.',
              ],
              [
                'Oracle assumptions',
                'Relations cover simple fixtures; template activation, JavaScript strings, CSS visibility, malformed HTML, and alternative accessible names need more nuanced treatment.',
              ],
              [
                'Dependence',
                'Cases share inputs, extraction logic, and relation families. Fractions describe this suite only; no population intervals or significance tests are justified.',
              ],
              [
                'Coverage',
                'One analyzer version and local runtime; no browser execution, multilingual corpus, shadow DOM, authenticated state, network acquisition, or models.',
              ],
              [
                'Reproducibility',
                'Hashes and local files identify artifacts, while the public page links to the protocol and results. The available evidence still needs independent review.',
              ],
            ].map(([title, detail]) => (
              <li
                key={title}
                className="rounded-xl border border-border bg-background p-4"
              >
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6">{detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 leading-7 text-muted-foreground">
            Next steps are independent review of the relations, validation of
            the simple DOM and naming assumptions against an isolated browser or
            standards-based oracle, held-out fixtures added before further
            implementation tuning, and comparison across multiple assessors with
            explicit decision rules. The one-time WRI v1 log was not accessed or
            modified; this synthetic dataset does not revise its interpretation.
          </p>
        </section>

        <section className="instrument-card p-6 sm:p-8">
          <p className="eyebrow">Research artifacts</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Inspect the protocol, data, and run records
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            The repository preserves the case catalog, protocol, runner,
            baseline and post-fix outputs, reports, and run manifests. The
            baseline remains unchanged after the fix. Results are local
            synthetic measurements, not field observations.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <EvidenceLink href={`${paperSource}/protocol.md`}>
              Protocol v1
            </EvidenceLink>
            <EvidenceLink href={`${paperSource}/results/baseline.json`}>
              Baseline JSON
            </EvidenceLink>
            <EvidenceLink href={`${paperSource}/results/baseline.run.json`}>
              Baseline run manifest
            </EvidenceLink>
            <EvidenceLink href={`${paperSource}/results/post-fix.json`}>
              Post-fix JSON
            </EvidenceLink>
            <EvidenceLink href={`${paperSource}/results/post-fix.run.json`}>
              Post-fix run manifest
            </EvidenceLink>
            <EvidenceLink href="https://github.com/mlmrx/iswebmcp/tree/main/scripts/research">
              Harness and case catalog
            </EvidenceLink>
          </div>
        </section>

        <section className="instrument-card p-6 sm:p-8">
          <p className="eyebrow">
            Generative-AI assistance and author responsibility
          </p>
          <p className="mt-3 leading-7 text-muted-foreground">
            Generative AI was used substantially to inspect the implementation,
            propose and encode relations, implement the harness and provenance
            tools, interpret failures, suggest scanner corrections, and draft
            this manuscript. Measurements come from executed local software, not
            generated results. AI assistance is not independent review. Human
            authors must review the assumptions, code, sources, artifacts, and
            conclusions and take responsibility for any submitted version. No
            human-author sign-off or scholarly submission is claimed here.
          </p>
        </section>

        <section className="instrument-card p-6 sm:p-8">
          <p className="eyebrow">Selected references</p>
          <ol className="mt-4 grid gap-4 text-sm leading-6 text-muted-foreground">
            <li>
              T. Y. Chen, S. C. Cheung, and S. M. Yiu.{' '}
              <i>
                Metamorphic Testing: A New Approach for Generating Next Test
                Cases.
              </i>{' '}
              HKUST-CS98-01, 1998.{' '}
              <EvidenceLink href="https://arxiv.org/abs/2002.12543">
                Author-deposited copy
              </EvidenceLink>
              .
            </li>
            <li>
              H. Liu, F.-C. Kuo, D. Towey, and T. Y. Chen.{' '}
              <i>
                How Effectively Does Metamorphic Testing Alleviate the Oracle
                Problem?
              </i>{' '}
              IEEE Transactions on Software Engineering 40(1), 4–22, 2014.{' '}
              <EvidenceLink href="https://doi.org/10.1109/TSE.2013.46">
                DOI
              </EvidenceLink>
              .
            </li>
            <li>
              WHATWG. <i>HTML Living Standard: The template element.</i>{' '}
              <EvidenceLink href="https://html.spec.whatwg.org/multipage/scripting.html#the-template-element">
                Specification
              </EvidenceLink>
              .
            </li>
            <li>
              W3C. <i>Accessible Name and Description Computation 1.2.</i>{' '}
              <EvidenceLink href="https://www.w3.org/TR/accname-1.2/#computation-steps">
                Specification
              </EvidenceLink>
              .
            </li>
          </ol>
          <p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
            This is an initial positioning check, not a systematic literature
            review. A final novelty matrix and independent scholarly review
            would be needed before making broader research claims.
          </p>
        </section>

        <nav aria-label="Related research" className="flex flex-wrap gap-3">
          <Link
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            href="/adoption"
          >
            WebMCP adoption research
          </Link>
          <Link
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            href="/readiness-index-methodology"
          >
            Readiness index methodology
          </Link>
        </nav>
      </article>
    </main>
  );
}
