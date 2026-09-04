import type { CSSProperties } from 'react';
import {
  ArrowRight,
  Bot,
  CircleCheck,
  FileSearch,
  MessageSquareText,
  ScanSearch,
  Wrench,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Ask where you already work',
    detail:
      'Paste a public URL or a tool contract into ChatGPT, Claude, Cursor, VS Code, or Chrome.',
    icon: MessageSquareText,
  },
  {
    number: '02',
    title: 'Call one audit engine',
    detail:
      'The integration sends the target to the same bounded scanner and versioned evidence model.',
    icon: ScanSearch,
  },
  {
    number: '03',
    title: 'Inspect observable evidence',
    detail:
      'isWebMCP checks discovery, schemas, annotations, safety signals, byte coverage, and evidence gaps.',
    icon: FileSearch,
  },
  {
    number: '04',
    title: 'Fix what matters',
    detail:
      'Get a category breakdown, prioritized remediation, and a canonical report your team can share.',
    icon: Wrench,
  },
];

export function IntegrationWorkflow() {
  return (
    <section className="integration-workflow overflow-hidden rounded-3xl border border-border bg-card">
      <div className="grid lg:grid-cols-[.84fr_1.16fr]">
        <div className="border-b border-border p-6 sm:p-8 lg:border-r lg:border-b-0">
          <p className="eyebrow text-signal-ink">
            See the value in one request
          </p>
          <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
            Ask naturally. Get an audit you can act on.
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
            The integration handles the mechanics. You stay in your current
            tool, ask for the outcome, and receive evidence—not a black-box
            grade.
          </p>

          <div className="mt-7 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Bot className="size-4 text-signal-ink" aria-hidden="true" />
              In ChatGPT
            </div>
            <p className="mt-3 text-base font-medium leading-7">
              “Audit my site for WebMCP readiness and show me the three fixes
              with the highest impact.”
            </p>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm font-semibold text-signal-ink">
              <CircleCheck className="size-4" aria-hidden="true" />
              Evidence, risks, score breakdown, and fixes
            </div>
          </div>
        </div>

        <div className="relative p-6 sm:p-8">
          <div
            className="integration-signal-line absolute top-[4.15rem] right-10 left-10 hidden h-px bg-border md:block"
            aria-hidden="true"
          >
            <span className="integration-signal-dot" />
          </div>
          <div className="relative grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="integration-step relative rounded-2xl border border-border bg-background p-4"
                  style={{ '--step-delay': `${index * 0.7}s` } as CSSProperties}
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl border border-border bg-card text-signal-ink">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold leading-6">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.detail}
                  </p>
                  {index < steps.length - 1 ? (
                    <ArrowRight
                      className="absolute top-1/2 -right-3 z-10 hidden size-5 -translate-y-1/2 rounded-full border border-border bg-card p-1 text-muted-foreground md:block"
                      aria-hidden="true"
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
