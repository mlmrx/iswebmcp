'use client';

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clipboard,
  Code2,
  Info,
  Play,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { ScoreRing } from '@/components/score-ring';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { auditToolCode, SAMPLE_BOILERPLATE } from '@/lib/workbench';

const iconFor = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
  info: Info,
};

const classFor = {
  pass: 'text-positive',
  warn: 'text-warning',
  fail: 'text-destructive',
  info: 'text-muted-foreground',
};

export function WorkbenchView() {
  const [source, setSource] = useState(SAMPLE_BOILERPLATE);
  const [submitted, setSubmitted] = useState(SAMPLE_BOILERPLATE);
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => auditToolCode(submitted), [submitted]);

  const copyBoilerplate = async () => {
    await navigator.clipboard.writeText(result.boilerplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  };

  return (
    <main className="min-h-screen bg-background pb-16">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-chip">
              <Code2 className="size-3" /> Deterministic static audit
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Draft revision · 26 Aug 2026
            </span>
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <div>
              <p className="eyebrow text-signal-ink">Tool Contract Workbench</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-.05em] sm:text-5xl">
                Find weak contracts before an agent does.
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Paste imperative WebMCP code or declarative markup. The audit
              checks current draft syntax, Chrome guidance, privacy risks,
              runtime validation seams, and lifecycle cleanup—without sending
              code to a model.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 xl:grid-cols-[.9fr_1.1fr] lg:px-8">
        <section
          className="instrument-card self-start p-5 sm:p-6"
          aria-labelledby="paste-heading"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Input</p>
              <h2 id="paste-heading" className="mt-2 text-xl font-semibold">
                Paste HTML or JavaScript
              </h2>
            </div>
            <span className="status-chip">Local analysis</span>
          </div>
          <Textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            aria-label="WebMCP code to audit"
            className="mt-5 min-h-[520px] resize-y bg-ink p-4 font-mono text-xs leading-6 text-paper"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Remove secrets and customer data. Tool contracts should never
              contain credentials.
            </p>
            <Button onClick={() => setSubmitted(source)}>
              <Play data-icon="inline-start" /> Run audit
            </Button>
          </div>
        </section>

        <section className="space-y-5" aria-labelledby="audit-heading">
          <div className="grid gap-4 md:grid-cols-3">
            <ScoreRing
              value={result.conformance}
              label="Draft conformance"
              detail="Current global, names, schema closure, and runtime validation seams."
            />
            <ScoreRing
              value={result.security}
              label="Security signals"
              detail="Annotations, metadata budgets, data minimization, and verifiability."
              tone="neutral"
            />
            <ScoreRing
              value={result.lifecycle}
              label="Lifecycle hygiene"
              detail="AbortSignal-based cleanup for route and component ownership."
              tone="muted"
            />
          </div>

          <div className="instrument-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Audit ledger</p>
                <h2 id="audit-heading" className="mt-2 text-xl font-semibold">
                  {result.detectedNames.length
                    ? `${result.detectedNames.length} tool contract${result.detectedNames.length === 1 ? '' : 's'} detected`
                    : 'No tool contract detected'}
                </h2>
              </div>
              {result.detectedNames.length > 0 && (
                <span className="status-chip">
                  {result.detectedNames.join(', ')}
                </span>
              )}
            </div>
            <div className="mt-6 grid gap-3">
              {result.checks.map((item) => {
                const Icon = iconFor[item.status];
                return (
                  <article
                    key={item.id}
                    className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <Icon
                      className={`mt-0.5 size-4 ${classFor[item.status]}`}
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                      {item.standard.replace('_', ' ')}
                    </span>
                  </article>
                );
              })}
            </div>
          </div>

          <Tabs
            defaultValue="imperative"
            className="instrument-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Quick fix</p>
                <h2 className="mt-2 text-xl font-semibold">
                  Reference implementation
                </h2>
              </div>
              <TabsList>
                <TabsTrigger value="imperative">Imperative</TabsTrigger>
                <TabsTrigger value="declarative">Declarative note</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="imperative" className="mt-5">
              <div className="relative">
                <pre className="max-h-[420px] overflow-auto rounded-xl bg-ink p-4 pr-12 font-mono text-xs leading-6 text-paper">
                  <code>{result.boilerplate}</code>
                </pre>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-3 top-3 border-paper/20 bg-paper/10 text-paper hover:bg-paper/15 hover:text-paper"
                  onClick={copyBoilerplate}
                  aria-label="Copy reference implementation"
                >
                  {copied ? <Check /> : <Clipboard />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="declarative" className="mt-5">
              <div className="rounded-xl border border-warning/25 bg-warning/8 p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="size-4 text-warning" /> Portability
                  warning
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The current Community Group draft marks normative declarative
                  WebMCP as TODO. Chrome preview attributes such as{' '}
                  <code>toolname</code> and <code>tooldescription</code> are
                  useful experiments, but ChatGPT’s built-in browser currently
                  does not discover declarative form tools. Prefer top-level
                  imperative registration for this product.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <aside className="flex gap-3 rounded-xl border border-positive/20 bg-positive/7 p-5 text-sm">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-positive"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">Static evidence is provisional.</p>
              <p className="mt-1.5 leading-6 text-muted-foreground">
                This workbench can inspect contract text. It cannot prove
                browser registration, authorization behavior, side effects, UI
                synchronization, or agent selection reliability.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
