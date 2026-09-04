import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Bug, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Support and responsible disclosure guidance for isWebMCP.',
  alternates: { canonical: '/support' },
};

const routes = [
  {
    title: 'Understand a result',
    body: 'Start with the FAQ and methodology. They explain evidence scope, incomplete collection, scoring, and what is deliberately withheld.',
    href: '/faq',
    action: 'Open the FAQ',
    icon: BookOpen,
  },
  {
    title: 'Report a product problem',
    body: 'Report the integration name, version, timestamp, public URL if safe to share, and the exact visible error through the support channel where you obtained the integration.',
    href: '/integrations',
    action: 'Check integration notes',
    icon: Bug,
  },
  {
    title: 'Security disclosure',
    body: 'Do not include secrets or exploit production. Follow the repository security policy and use the private contact channel published with the distribution account.',
    href: '/security',
    action: 'Read security guidance',
    icon: ShieldAlert,
  },
];

export default function SupportPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background"
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
          <p className="eyebrow text-signal-ink">Support</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-.05em]">
            Bring the evidence with the issue.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            Good reports distinguish target-site behavior from collection,
            integration, or scoring problems. Never send credentials, session
            URLs, tokens, private addresses, or sensitive page content.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-5 py-12 md:grid-cols-3 lg:px-8">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <article
              key={route.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6"
            >
              <Icon className="size-5 text-signal-ink" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold">{route.title}</h2>
              <p className="mt-3 flex-1 leading-7 text-muted-foreground">
                {route.body}
              </p>
              <Link
                className="mt-5 text-sm font-semibold text-signal-ink hover:underline"
                href={route.href}
              >
                {route.action} →
              </Link>
            </article>
          );
        })}
      </section>
      <section className="mx-auto max-w-5xl px-5 pb-14 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Email{' '}
            <a
              className="text-signal-ink hover:underline"
              href="mailto:research@iswebmcp.com"
            >
              research@iswebmcp.com
            </a>{' '}
            for product support, privacy questions, and responsible disclosure.
            Do not include credentials, private URLs, or secret page content.
          </p>
        </div>
      </section>
    </main>
  );
}
