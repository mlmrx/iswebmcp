import type { Metadata } from 'next';
import {
  Bot,
  Boxes,
  Code2,
  Download,
  ExternalLink,
  MessageSquare,
  PanelRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { IntegrationWorkflow } from '@/components/integration-workflow';

export const metadata: Metadata = {
  title: 'Integrations',
  description:
    'Bring evidence-backed WebMCP audits to ChatGPT, Claude, Cursor, VS Code, and Chrome.',
  alternates: { canonical: '/integrations' },
};

const integrations = [
  {
    name: 'VS Code extension',
    description:
      'Audit a typed or selected public URL and inspect the source evidence in a locked-down editor panel.',
    icon: Code2,
    action: 'Download VSIX',
    href: '/downloads/iswebmcp-vscode-1.0.0.vsix',
    format: 'VSIX · VS Code 1.96+',
  },
  {
    name: 'ChatGPT plugin',
    description:
      'A remote MCP server plus interactive audit component, explicit tool annotations, and review-ready test artifacts.',
    icon: MessageSquare,
    action: 'Download review kit',
    href: '/downloads/iswebmcp-chatgpt-plugin-1.0.0.zip',
    format: 'MCP endpoint · review kit',
  },
  {
    name: 'Claude plugin',
    description:
      'Claude Code plugin with remote MCP configuration and a skill that preserves evidence provenance.',
    icon: Bot,
    action: 'Download plugin',
    href: '/downloads/iswebmcp-claude-plugin-1.0.0.zip',
    format: 'Claude plugin bundle',
  },
  {
    name: 'Cursor plugin',
    description:
      'Portable Agent Plugin with the isWebMCP MCP server and an audit skill for implementation work.',
    icon: Boxes,
    action: 'Download plugin',
    href: '/downloads/iswebmcp-cursor-plugin-1.0.0.zip',
    format: 'Agent Plugin bundle',
  },
  {
    name: 'Chrome extension',
    description:
      'Audit the active page in a native side panel without injecting scripts or requesting access to every site.',
    icon: PanelRight,
    action: 'Download extension',
    href: '/downloads/iswebmcp-chrome-extension-1.0.0.zip',
    format: 'Manifest V3 · load unpacked',
  },
];

export default function IntegrationsPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background"
    >
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="status-chip w-fit">
            <ShieldCheck className="size-3" aria-hidden="true" /> One engine,
            five surfaces
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="eyebrow text-signal-ink">
                The audit goes where you work
              </p>
              <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-[-.055em] sm:text-6xl">
                One evidence model. Every agent surface.
              </h1>
            </div>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              All five integrations call the same bounded scanner and preserve
              the same collection status, byte coverage, score version,
              provenance, and missing-evidence states.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <IntegrationWorkflow />

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <article
                key={integration.name}
                className="flex min-h-72 flex-col rounded-2xl border border-border bg-card p-6"
              >
                <div className="grid size-11 place-items-center rounded-xl border border-border bg-background text-signal-ink">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-.035em]">
                  {integration.name}
                </h2>
                <p className="mt-3 flex-1 leading-7 text-muted-foreground">
                  {integration.description}
                </p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {integration.format}
                </p>
                <a
                  className="mt-3 inline-flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  href={integration.href}
                >
                  {integration.action}
                  <Download className="size-4" aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <p className="eyebrow">Shared remote MCP</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Connect without a bundle
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              MCP clients that support Streamable HTTP can connect directly to
              the production endpoint. It offers public-source audits, a
              synthetic walkthrough, imported contract review, and
              evidence-level guidance.
            </p>
            <code className="mt-5 block overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm">
              https://iswebmcp.com/mcp
            </code>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <p className="eyebrow">Honest by construction</p>
            <h2 className="mt-2 text-2xl font-semibold">
              The unknowns stay visible
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              A public-source result cannot prove a tool succeeds at runtime. A
              contract review cannot prove measured lift. Every integration
              keeps those boundaries in the interface and distinguishes scanner
              trouble from website quality.
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-signal-ink hover:underline"
              href="/methodology"
            >
              Inspect the scoring model <ExternalLink className="size-4" />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
