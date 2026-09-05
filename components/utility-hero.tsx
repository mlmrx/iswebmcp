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
              WebMCP checks and starter code
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">
              Help AI agents
              <br />
              use your website.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Find common gaps in your public page. Get clear recommendations,
              starter code for supported fixes, and checks you can run again.
            </p>
            <Link
              href="/developers/recipes"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
            >
              See starter code{' '}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/developers"
              className="mt-4 block text-sm font-semibold text-signal-ink underline underline-offset-4"
            >
              Automate checks with the SDK + CI toolkit
            </Link>
            <a
              href="#audit"
              className="mt-4 block text-sm font-semibold underline underline-offset-4 lg:hidden"
            >
              Check my website ↓
            </a>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              You review and apply the code. We don’t change or deploy your
              site.
            </p>
          </div>
          <div id="audit" className="scroll-mt-24">
            <QuickScanForm />
          </div>
        </div>
      </section>
      <section
        aria-label="From finding to fix"
        className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-3 lg:px-8"
      >
        {[
          {
            icon: Search,
            title: '1. Find the gaps',
            text: 'See what we found in your page’s source, why it matters, and what to improve.',
            href: '#audit',
            action: 'Start a check',
          },
          {
            icon: Braces,
            title: '2. Get starter code',
            text: 'Start with a search-tool adapter or an accessible search form. Connect it to your app.',
            href: '/developers/recipes',
            action: 'Explore the two recipes',
          },
          {
            icon: GitCompareArrows,
            title: '3. Check your changes',
            text: 'Save a before-and-after report. Compare source findings from your terminal or CI.',
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
      <p className="mx-auto max-w-7xl px-5 pb-8 text-sm leading-6 text-muted-foreground lg:px-8">
        WebMCP is experimental. Source checks find potential issues; they do not
        execute your tools or prove that an AI agent can complete a task.
      </p>
    </>
  );
}
