import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Code2, GitCompareArrows, Terminal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Developer toolkit',
  description:
    'Audit a public URL or check an HTML export locally, then save findings and compare changes from your terminal or CI workflow.',
  alternates: { canonical: '/developers' },
};

const download = '/developer-tools/iswebmcp-developer-tools-0.2.0.zip';
const npmPackage = 'https://www.npmjs.com/package/@iswebmcp/developer-kit';
const quickstart = `npm install --save-dev @iswebmcp/developer-kit

# Save a baseline from your public deployment.
npx iswebmcp scan https://example.com --output baseline.json
# After changing your public page, save a second result:
npx iswebmcp scan https://example.com --output current.json
npx iswebmcp compare baseline.json current.json`;

export default function DevelopersPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background"
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <p className="eyebrow text-signal-ink">
            For developers and platform builders
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-.055em] sm:text-6xl">
            Find a problem. Fix it. Check again.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            Check a public URL through our hosted scanner, or analyze an HTML
            export locally. Save the findings, make a change in your app, and
            compare the next result.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={npmPackage}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
            >
              Install from npm
            </a>
            <a
              href={download}
              className="rounded-xl border border-border px-5 py-3 font-semibold"
            >
              Download developer tools
            </a>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Node.js 22.13+ · No SDK dependencies · Source-level evidence ·
            Experimental WebMCP
          </p>
          <div
            aria-label="Choose your source-check workflow"
            className="mt-8 grid gap-4 sm:grid-cols-2"
          >
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">Have a public URL?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use the hosted-source toolkit below to scan a public page
                through the isWebMCP service and save its findings.
              </p>
              <a
                href="#quickstart"
                className="mt-3 inline-flex items-center gap-2 font-semibold text-signal-ink hover:underline"
              >
                Public URL quickstart
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">
                Have an exported HTML file?
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Run the Offline Checker on your own machine. Try its bundled
                label-fix demo, then compare your own exports. No npm install or
                login required.
              </p>
              <Link
                href="/developers/offline"
                className="mt-3 inline-flex items-center gap-2 font-semibold text-signal-ink hover:underline"
              >
                Offline Checker quickstart
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-10 px-5 py-12 lg:px-8">
        <section
          id="quickstart"
          className="rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <Terminal className="size-6 text-signal-ink" aria-hidden="true" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            A repeatable check from your terminal
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Install the zero-runtime-dependency package, then replace the
            example URL with your public page. No repository access or
            application deployment is needed. Use a new output filename for each
            scan.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-5 text-sm leading-7">
            <code>{quickstart}</code>
          </pre>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Queries are removed before transmission by default. The hosted
            scanner cannot reach localhost, private networks, or signed-in
            pages. Saved JSON stays on your machine; the service may retain a
            sanitized URL attempt for 90 days as described in our privacy
            policy.
          </p>
          <Link
            href="/privacy"
            className="mt-3 inline-block text-sm font-semibold text-signal-ink hover:underline"
          >
            Read the data policy
          </Link>
        </section>
        <section
          id="mcp"
          className="rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <p className="eyebrow text-signal-ink">Inside your coding agent</p>
          <h2 className="mt-3 text-3xl font-semibold">
            Check → implement → compare
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Connect a Streamable HTTP MCP client to https://iswebmcp.com/mcp.
            Ask for a source audit, request a matching implementation recipe,
            review the code locally, then compare your saved before-and-after
            summaries.
          </p>
          <blockquote className="mt-5 border-l-2 border-signal-ink pl-4 leading-7">
            “Audit my public search page. Show me the accessible-controls
            recipe. Explain the proposed changes before editing. After I deploy,
            compare my baseline and current source summaries. Keep runtime
            claims separate.”
          </blockquote>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Six tools on one endpoint, including get_implementation_recipe and
            compare_source_reports. Your agent needs separate local editing
            permission; this server cannot change your repository, deploy, or
            control your browser. Only send summaries you are comfortable
            sharing with the service and your agent host. Use the local CLI for
            sensitive evidence.
          </p>
          <Link
            href="/developers/recipes"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-signal-ink hover:underline"
          >
            Explore implementation recipes{' '}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <Code2 className="size-6 text-signal-ink" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold">
              Embed evidence in your platform
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Use the Node SDK from your backend or connect an MCP client. Keep
              findings, recommendations, collection coverage, and missing
              evidence together in your own interface.
            </p>
            <a
              href={npmPackage}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 font-semibold text-signal-ink hover:underline"
            >
              View the SDK on npm{' '}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <GitCompareArrows
              className="size-6 text-signal-ink"
              aria-hidden="true"
            />
            <h2 className="mt-4 text-2xl font-semibold">
              Check changes in GitHub Actions
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Run a scan against your public deployment and compare a reviewed
              baseline. Incomplete or incompatible evidence produces an
              inconclusive check, so missing data cannot silently pass.
            </p>
            <a
              href={download}
              className="mt-5 inline-flex items-center gap-2 font-semibold text-signal-ink hover:underline"
            >
              Download CI adapter and setup guide{' '}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </section>
        </div>
        <section className="rounded-2xl border border-border p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">What this check tells you</h2>
          <p className="mt-3 max-w-4xl leading-7 text-muted-foreground">
            Version 0.2 compares the complete finding inventory returned for
            each bounded source scan, using stable rule identifiers and matching
            scan-input fingerprints. A passing comparison means it found no new
            or worsened failing findings in comparable summaries. Existing
            issues may remain. It does not execute your tools, verify an
            authenticated journey, or measure agent success.
          </p>
          <p className="mt-3 max-w-4xl leading-7 text-muted-foreground">
            Upgrading from 0.1? Capture a fresh baseline with the new toolkit.
            Older summaries lack the provenance required for release
            comparisons. Model changes also require a new, reviewed baseline; do
            not treat scores from different model versions as improvements or
            regressions.
          </p>
          <p className="mt-3 max-w-4xl leading-7 text-muted-foreground">
            Runtime verification needs a connected browser, a defined task, and
            an observed outcome. A general browser adapter and durable hosted
            monitoring are planned; the current toolkit saves evidence locally
            and uses the shared, rate-limited public scanner.
          </p>
          <Link
            href="/methodology"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-signal-ink hover:underline"
          >
            Understand the evidence{' '}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="eyebrow text-signal-ink">Design partner pilots</p>
          <h2 className="mt-3 text-3xl font-semibold">
            Bring one workflow you want to improve.
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            We are looking for developers building agent interactions and
            platforms that want to embed useful audit evidence. Start with a
            public test page, one recurring problem, and a concrete way to
            verify the fix.
          </p>
          <Link
            href="/support"
            className="mt-5 inline-flex items-center gap-2 font-semibold text-signal-ink hover:underline"
          >
            Discuss a pilot <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
