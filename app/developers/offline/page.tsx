import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download, Terminal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offline Checker — developer preview',
  description:
    'Check an exported HTML file on your own machine, save source findings, and compare a fix. No npm install, repository access, or account required.',
  alternates: { canonical: '/developers/offline' },
};

const download = '/developer-tools/iswebmcp-offline-checker-0.2.0.zip';
const checksums =
  '/developer-tools/iswebmcp-offline-checker-0.2.0.checksums.json';
const demo = 'node examples/run-demo.mjs';
const demoOutput = `Before: UI_ACCESSIBLE_NAMES = fail
After adding a label: UI_ACCESSIBLE_NAMES = pass
Fix comparison: exit 0; 0 new or worsened findings
Removing the label again: exit 1; 1 new problem
Runtime remains unknown.`;
const audit = `# In the extracted checker folder, use your own exported HTML file.
node iswebmcp-offline.mjs audit ./export.html --app catalog-search --output ./baseline.json

# Make the fix in your app, then export its HTML again as current.html.
node iswebmcp-offline.mjs audit ./current.html --app catalog-search --output ./current.json
node iswebmcp-offline.mjs compare ./baseline.json ./current.json --output ./comparison.json`;

const checks = [
  {
    title: 'Explicit field names',
    description:
      'Look for labels and equivalent source-visible names on form controls.',
  },
  {
    title: 'State feedback',
    description:
      'Look for source-visible status and live-region patterns that can describe a change.',
  },
  {
    title: 'WebMCP source hints',
    description:
      'Flag source references that still need contract and runtime verification.',
  },
  {
    title: 'Missing runtime evidence',
    description:
      'Keep runtime explicitly unknown. A file cannot prove that a tool registers or completes a task.',
  },
];

export default function OfflineCheckerPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background"
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16 lg:px-8">
          <Link
            href="/developers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-signal-ink hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Developer tools
          </Link>
          <p className="eyebrow mt-8 text-signal-ink">
            Developer preview · v0.2.0
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.045em] sm:text-6xl">
            Check an HTML file. See what changed.
          </h1>
          <p className="mt-5 text-lg font-semibold">isWebMCP Offline Checker</p>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-muted-foreground">
            Analyze an exported HTML file on your own machine. Get source
            findings, make a fix in your app, and compare the next export. Start
            with the included missing-label example to see the whole workflow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={download}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
            >
              <Download className="size-4" aria-hidden="true" />
              Download Offline Checker ZIP
            </a>
            <a
              href="#quickstart"
              className="rounded-xl border border-border px-5 py-3 font-semibold"
            >
              Run the included example
            </a>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Node.js 22.13+ required · No npm install · No repository access · No
            login
          </p>
          <a
            href={checksums}
            className="mt-2 inline-block text-sm font-semibold text-signal-ink hover:underline"
          >
            Download SHA-256 checksums
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 lg:px-8">
        <section
          id="quickstart"
          aria-labelledby="quickstart-heading"
          className="rounded-2xl border border-border bg-card p-5 sm:p-8"
        >
          <Terminal className="size-6 text-signal-ink" aria-hidden="true" />
          <h2 id="quickstart-heading" className="mt-4 text-3xl font-semibold">
            Try a real fix in three steps
          </h2>
          <ol className="mt-6 list-decimal space-y-6 pl-5 marker:font-semibold">
            <li className="pl-2">
              <h3 className="font-semibold">Download the ZIP and checksums.</h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                The ZIP includes the standalone checker, source, README, and
                examples. The checksum file lists SHA-256 hashes for the ZIP and
                its files. Matching hashes verify those bytes; they are not a
                publisher signature or a security certification.
              </p>
            </li>
            <li className="pl-2">
              <h3 className="font-semibold">
                Extract it and open a terminal there.
              </h3>
              <p className="mt-2 leading-7 text-muted-foreground">
                Use a trusted local disk and Node.js 22.13 or newer. You do not
                need to install dependencies or deploy an application.
              </p>
            </li>
            <li className="min-w-0 pl-2">
              <h3 className="font-semibold">Run the bundled example.</h3>
              {/* oxlint-disable no-noninteractive-tabindex -- Keyboard users need access to this horizontal scroll region. */}
              <section
                tabIndex={0}
                aria-label="Run the included Offline Checker example"
                className="mt-3 max-w-full overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <pre>
                  <code>{demo}</code>
                </pre>
              </section>
              {/* oxlint-enable no-noninteractive-tabindex */}
              <p className="mt-3 leading-7 text-muted-foreground">
                The demo audits <code>examples/before.html</code>, where a
                search field has no label, and <code>examples/after.html</code>,
                where the label is fixed. It compares the improvement, then
                reintroduces the missing label to check regression detection.
              </p>
              <p className="mt-2 leading-7 text-muted-foreground">
                These are actual local checks, not a prerecorded result. Each
                run creates a new output folder named{' '}
                <code>demo-results-&lt;unique-id&gt;</code> and prints its
                location, so you can run it again without overwriting earlier
                reports. The demo exits 0 only when its checks pass, including
                the intentionally regressed comparison returning 1.
              </p>
              <p className="mt-3 text-sm font-semibold">
                A successful demo prints these results:
              </p>
              <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-xs leading-6 sm:text-sm">
                <code>{demoOutput}</code>
              </pre>
            </li>
          </ol>
        </section>

        <section
          aria-labelledby="your-file-heading"
          className="rounded-2xl border border-border bg-card p-5 sm:p-8"
        >
          <h2 id="your-file-heading" className="text-3xl font-semibold">
            Check your own export
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Supply an HTML file you are authorized to inspect. Choose a
            non-sensitive app/page ID and keep that ID the same for subsequent
            exports of the same page.
          </p>
          {/* oxlint-disable no-noninteractive-tabindex -- Keyboard users need access to this horizontal scroll region. */}
          <section
            tabIndex={0}
            aria-label="Audit and compare your own exported HTML"
            className="mt-5 max-w-full overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <pre>
              <code>{audit}</code>
            </pre>
          </section>
          {/* oxlint-enable no-noninteractive-tabindex */}
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Reports are local JSON files. Existing output files are never
            overwritten: choose new filenames for later runs. Comparisons
            require the same app/page ID, evidence schema, model, and analysis
            limit, with a current report that does not predate the baseline.
            Hosted-scanner reports are a different format and cannot be used as
            an Offline Checker baseline.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The checker reports findings and recommendations; it does not
            automatically edit your app or apply fixes. Review and make changes
            in your own development workflow.
          </p>
        </section>

        <section
          id="local-ci"
          aria-labelledby="ci-heading"
          className="rounded-2xl border border-border p-5 sm:p-8"
        >
          <h2 id="ci-heading" className="text-3xl font-semibold">
            Use the same commands in local CI
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Keep a reviewed baseline and supply an HTML export from your build
            or test process. Run the audit, then compare only if that audit
            succeeded. Preserve both reports with the comparison so a reviewer
            can inspect the evidence. Exporting or signing in to your app is a
            separate step that this checker does not perform.
          </p>
          <dl className="mt-5 space-y-4">
            <div className="rounded-xl border border-border p-4">
              <dt className="font-semibold">Exit 0 — the command completed</dt>
              <dd className="mt-2 leading-7 text-muted-foreground">
                For audit, a report was written; findings may still fail. For
                compare, no new or worsened partial/failing findings were
                detected. Existing problems may remain. Neither means a release
                is safe or a task succeeds.
              </dd>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="font-semibold">
                Exit 1 — comparison found a regression
              </dt>
              <dd className="mt-2 leading-7 text-muted-foreground">
                The comparison report was written. Inspect the newly problematic
                finding, worsened status, or increased severity.
              </dd>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="font-semibold">
                Exit 2 — no conclusive comparison or audit
              </dt>
              <dd className="mt-2 leading-7 text-muted-foreground">
                Invalid arguments, incompatible reports, an existing output
                file, or a size/time limit need attention. Do not treat the
                missing result as a pass or promote it to a baseline.
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            The comparison displays all status and severity changes, but only
            gates new or worsened partial/failing findings. A change from pass
            to not observed is shown; it does not fail the gate. Review that
            loss of evidence separately.
          </p>
        </section>

        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="text-3xl font-semibold">
            Four source checks. No runtime claim.
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {checks.map((check) => (
              <div
                key={check.title}
                className="rounded-xl border border-border p-5"
              >
                <h3 className="font-semibold">{check.title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">
                  {check.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            These are source heuristics, not accessibility conformance, security
            approval, certification, or proof of agent success. WebMCP remains
            experimental. Runtime is always unknown in this checker.
          </p>
        </section>

        <section
          id="limits"
          aria-labelledby="limits-heading"
          className="rounded-2xl border border-border bg-card p-5 sm:p-8"
        >
          <h2 id="limits-heading" className="text-3xl font-semibold">
            Know the boundary before using sensitive HTML
          </h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 leading-7 text-muted-foreground">
            <li>
              Exported HTML only: nonempty UTF-8 files up to 2 MiB. Analysis
              runs in a worker with a 5-second time limit, a 128 MiB
              old-generation heap limit, and a 16 MiB young-generation limit.
              These are not a total process-memory cap or a filesystem-I/O
              deadline. If analysis exceeds a limit, it exits with an error
              rather than writing an incomplete report.
            </li>
            <li>
              No HTTP requests to public or private hosts, linked-asset
              fetching, page JavaScript execution, browser authentication, or
              SSO. URLs and UNC/device paths are refused as input paths.
            </li>
            <li>
              An export may omit runtime content, shadow DOM, or signed-in
              state. Complete coverage means these four checks ran on the
              supplied bytes, not that the file captures your whole app.
            </li>
            <li>
              The checker makes no application network calls or analytics
              requests. That is not an OS-level network-isolation guarantee:
              mapped, mounted, or synced filesystems and other software can move
              data. Use trusted local disks and OS-level egress controls when
              required.
            </li>
            <li>
              Reports omit raw HTML and input paths, but keep the app/page ID, a
              source hash, timestamp, and findings. Protect the exports and
              reports. A hash binds bytes; it does not anonymize them or verify
              their origin.
            </li>
          </ul>
          <Link
            href="/methodology"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-signal-ink hover:underline"
          >
            Read the evidence methodology
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
        <p className="text-sm leading-6 text-muted-foreground">
          Want to inspect a public URL instead? The{' '}
          <Link
            href="/developers#quickstart"
            className="font-semibold text-signal-ink hover:underline"
          >
            hosted-source developer toolkit
          </Link>{' '}
          uses the isWebMCP service. It is a separate tool and evidence format.
        </p>
      </div>
    </main>
  );
}
