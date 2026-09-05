import Link from 'next/link';
import { ArrowRight, Braces, GitCompareArrows, Search } from 'lucide-react';
import { QuickScanForm } from '@/components/quick-scan-form';

export function UtilityHero() {
  return (
    <>
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="eyebrow text-signal-ink">
              Developer tools for agent-facing websites
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">
              Check your site.
              <br />
              Fix the gaps.
              <br />
              Catch regressions.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Find source-level issues in your public page, understand the
              evidence, and repeat checks from your terminal or CI.
            </p>
            <Link
              href="/developers"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
            >
              Get SDK + CI toolkit{' '}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#audit"
              className="mt-4 block text-sm font-semibold underline underline-offset-4 lg:hidden"
            >
              Or check a public page now
            </a>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              No account needed for a public-source check. WebMCP is
              experimental; a scan does not execute your tools or prove agent
              task success.
            </p>
          </div>
          <div id="audit" className="scroll-mt-24">
            <QuickScanForm />
          </div>
        </div>
      </section>
      <section
        aria-label="Ways to use isWebMCP"
        className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-3 lg:px-8"
      >
        {[
          {
            icon: Search,
            title: 'Check a website',
            text: 'Inspect public source. Get the finding, evidence and next step together.',
            href: '#audit',
            action: 'Start a check',
          },
          {
            icon: Braces,
            title: 'Audit tool contracts',
            text: 'Inspect supplied tool definitions for structural issues before runtime testing.',
            href: '/workbench',
            action: 'Open contract audit',
          },
          {
            icon: GitCompareArrows,
            title: 'Add release checks',
            text: 'Save a reviewed baseline. Compare compatible source findings after changes.',
            href: '/developers',
            action: 'Use the developer toolkit',
          },
        ].map(({ icon: Icon, title, text, href, action }) => (
          <article
            key={title}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <Icon className="size-5 text-signal-ink" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {text}
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-signal-ink"
              href={href}
            >
              {action}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
