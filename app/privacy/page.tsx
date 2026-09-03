import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Privacy and data-handling details for isWebMCP and its integrations.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background"
    >
      <article className="prose prose-neutral mx-auto max-w-3xl px-5 py-14 text-foreground lg:px-8">
        <p className="eyebrow">Effective 2 September 2026</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-.05em]">
          Privacy
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          isWebMCP is a public-web analysis project. You choose what URL to
          audit. Do not provide private, authenticated, local-network, or
          secret-bearing URLs.
        </p>
        <div className="mt-10 space-y-8 leading-7 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              What is processed
            </h2>
            <p className="mt-3">
              When you request an audit, the service processes the submitted
              public URL, optional goal text, fetched public response, and the
              resulting report. Integrations may also process supplied
              tool-contract text.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Retention
            </h2>
            <p className="mt-3">
              Interactive reports are held ephemerally for product operation and
              are not published to the readiness index. Hosting,
              abuse-prevention, and security providers may retain ordinary
              request metadata—such as IP address, timestamp, user agent,
              response status, and route—under their operational policies.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Browser and editor integrations
            </h2>
            <p className="mt-3">
              The Chrome extension reads the active tab URL and title only after
              you invoke it. It does not inject a content script or request
              browsing history. Editor and agent integrations send only the
              audit inputs you choose to the published isWebMCP endpoints.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Public index data
            </h2>
            <p className="mt-3">
              WRI v1 is a frozen, audited-partial research artifact built from
              public domains. It is uncalibrated and is not a complete
              100,000-site observation or a product-quality ranking.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Questions
            </h2>
            <p className="mt-3">
              Use the{' '}
              <Link className="text-signal-ink hover:underline" href="/support">
                support page
              </Link>{' '}
              for current support and disclosure channels.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
