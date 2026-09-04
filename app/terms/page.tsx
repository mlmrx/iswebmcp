import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing use of isWebMCP and its integrations.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background"
    >
      <article className="prose prose-neutral mx-auto max-w-3xl px-5 py-14 text-foreground lg:px-8">
        <p className="eyebrow">Effective 3 September 2026</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-.05em]">
          Terms of Use
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          These terms govern your use of isWebMCP, including its website, public
          API, MCP server, reports, and integrations. By using the service, you
          agree to these terms.
        </p>

        <div className="mt-10 space-y-8 leading-7 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              What the service provides
            </h2>
            <p className="mt-3">
              isWebMCP provides evidence-scoped analysis of public web pages,
              sanitized WebMCP contracts, synthetic examples, and educational
              material. Source observations do not prove browser support,
              runtime conformance, security, accessibility, or business
              outcomes. Scores are diagnostic estimates under the published
              methodology, not certifications or guarantees.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Acceptable use
            </h2>
            <p className="mt-3">
              Submit only public HTTP or HTTPS URLs that you are permitted to
              request. Do not submit credentials, authentication links, private
              or local-network addresses, personal data, secrets, malicious
              payloads, or URLs intended to evade access controls. Do not use
              the service to disrupt systems, violate law or third-party terms,
              misrepresent a report as a certification, or exceed published
              technical limits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Your responsibility
            </h2>
            <p className="mt-3">
              You are responsible for the URLs and contract metadata you submit,
              how you interpret reports, and any implementation or deployment
              decision based on them. Independently test security,
              accessibility, reliability, and production behavior before relying
              on a WebMCP integration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Data and third-party services
            </h2>
            <p className="mt-3">
              The service processes and retains data as described in the{' '}
              <Link className="text-signal-ink hover:underline" href="/privacy">
                Privacy notice
              </Link>
              . Audited pages, hosting providers, databases, browsers, editor
              marketplaces, and AI platforms are third-party services governed
              by their own terms. isWebMCP does not control their availability
              or content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Availability and changes
            </h2>
            <p className="mt-3">
              The service is provided on an “as available” basis. Features,
              limits, scoring methods, integrations, and these terms may change
              as the experimental WebMCP proposal evolves. Material changes will
              be reflected by an updated effective date. Access may be limited
              or suspended to protect users, infrastructure, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">
              Disclaimers and liability
            </h2>
            <p className="mt-3">
              To the maximum extent permitted by law, isWebMCP makes no
              warranties about accuracy, completeness, fitness for a particular
              purpose, non-infringement, or uninterrupted operation. To the
              maximum extent permitted by law, isWebMCP and its contributors are
              not liable for indirect, incidental, special, consequential, or
              exemplary damages arising from use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Contact</h2>
            <p className="mt-3">
              Questions about these terms may be sent to{' '}
              <a
                className="text-signal-ink hover:underline"
                href="mailto:research@iswebmcp.com"
              >
                research@iswebmcp.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
