import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Security and responsible disclosure guidance for isWebMCP.',
  alternates: { canonical: '/security' },
};

export default function SecurityPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background"
    >
      <article className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
        <p className="eyebrow text-signal-ink">Responsible disclosure</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-.05em]">
          Security
        </h1>
        <div className="mt-8 space-y-7 text-lg leading-8 text-muted-foreground">
          <p>
            Do not test production in a way that disrupts service, accesses data
            you do not own, or submits secrets. Never use the audit input for
            private addresses, authenticated pages, session URLs, cloud
            metadata, or credentials.
          </p>
          <p>
            A useful report includes the affected isWebMCP URL or integration,
            version, impact, minimal reproduction, and remediation idea. Remove
            tokens, cookies, personal data, and target-site content that is not
            necessary to understand the issue.
          </p>
          <p>
            Send the report through the private disclosure channel attached to
            the distribution account where you obtained isWebMCP. Please allow a
            reasonable investigation window before public disclosure.
          </p>
        </div>
      </article>
    </main>
  );
}
