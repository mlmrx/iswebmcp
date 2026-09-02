'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  Eye,
  MousePointer2,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { DemoFlow, DemoScenario } from '@/lib/demos';
import { cn } from '@/lib/utils';

type FlowMode = 'before' | 'after';

function FlowSummary({
  flow,
  mode,
  selected,
  onSelect,
}: {
  flow: DemoFlow;
  mode: FlowMode;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = mode === 'before' ? MousePointer2 : Wrench;
  return (
    <button
      type="button"
      className={cn(
        'rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        selected
          ? mode === 'after'
            ? 'border-signal-ink/35 bg-signal/10'
            : 'border-foreground/25 bg-muted/70'
          : 'border-border bg-card hover:bg-muted/40',
      )}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
          <Icon className="size-4" aria-hidden="true" />
          {mode}
        </span>
        {selected && (
          <Check className="size-4 text-signal-ink" aria-hidden="true" />
        )}
      </span>
      <span className="mt-4 block font-semibold">{flow.title}</span>
      <span className="mt-2 block text-sm leading-6 text-muted-foreground">
        {flow.framing}
      </span>
    </button>
  );
}

export function FlowComparison({ scenario }: { scenario: DemoScenario }) {
  const [mode, setMode] = useState<FlowMode>('before');
  const [stepIndex, setStepIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const flow = scenario[mode];
  const currentStep = flow.steps[stepIndex];
  const atEnd = stepIndex === flow.steps.length - 1;
  const boundaryNeedsAction = scenario.confirmation.level !== 'none';
  const canReviewBoundary = mode === 'after' && atEnd;
  const verificationDisplay = !atEnd
    ? {
        label:
          mode === 'before' ? 'Not evaluated' : 'Illustrative · not evaluated',
        detail:
          'Step progression only reveals the teaching flow. No verification check has run.',
        tone: 'text-muted-foreground',
        icon: CircleDashed,
      }
    : mode === 'before'
      ? {
          label: 'Not evaluated',
          detail: `Baseline limitation: ${scenario.verification.beforeState}`,
          tone: 'text-muted-foreground',
          icon: CircleDashed,
        }
      : boundaryNeedsAction && !confirmed
        ? {
            label: 'Review pending',
            detail:
              'The illustrative after-state is paused at its human boundary. No consequential action or verification check has run.',
            tone: 'text-warning',
            icon: ShieldCheck,
          }
        : boundaryNeedsAction
          ? {
              label: 'Reviewed illustration',
              detail: `Illustrative target: ${scenario.verification.afterState} Human review was simulated; no runtime assertion was executed.`,
              tone: 'text-signal-ink',
              icon: Eye,
            }
          : {
              label: 'Illustrative target',
              detail: `Illustrative target: ${scenario.verification.afterState} No runtime assertion was executed.`,
              tone: 'text-signal-ink',
              icon: Eye,
            };
  const VerificationIcon = verificationDisplay.icon;

  const selectMode = (next: FlowMode) => {
    setMode(next);
    setStepIndex(0);
    setConfirmed(false);
  };

  const restart = () => {
    setStepIndex(0);
    setConfirmed(false);
  };

  return (
    <section className="space-y-5" aria-labelledby="flow-heading">
      <div className="grid gap-3 sm:grid-cols-2">
        <FlowSummary
          flow={scenario.before}
          mode="before"
          selected={mode === 'before'}
          onSelect={() => selectMode('before')}
        />
        <FlowSummary
          flow={scenario.after}
          mode="after"
          selected={mode === 'after'}
          onSelect={() => selectMode('after')}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-muted/35 p-5">
          <div>
            <p className="eyebrow">Interactive {mode} flow</p>
            <h3 id="flow-heading" className="mt-2 text-xl font-semibold">
              {flow.title}
            </h3>
          </div>
          <span className="status-chip bg-card">
            Step {stepIndex + 1} of {flow.steps.length}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <ol
            className="grid gap-2 sm:grid-cols-3"
            aria-label={`${mode} flow steps`}
          >
            {flow.steps.map((step, index) => {
              const complete = index < stepIndex;
              const active = index === stepIndex;
              return (
                <li key={step.label}>
                  <button
                    type="button"
                    className={cn(
                      'flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      active
                        ? 'border-signal-ink/35 bg-signal/10'
                        : 'border-border bg-background hover:bg-muted/45',
                    )}
                    aria-current={active ? 'step' : undefined}
                    onClick={() => setStepIndex(index)}
                  >
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs',
                        complete || active
                          ? 'border-signal-ink/30 bg-signal text-ink'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      {complete ? (
                        <Check className="size-3.5" aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="font-medium">{step.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <div
              className="rounded-xl bg-ink p-5 text-paper"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-wider text-signal">
                  {currentStep.label}
                </p>
                {atEnd ? (
                  <CheckCircle2
                    className="size-5 text-signal"
                    aria-hidden="true"
                  />
                ) : (
                  <CircleDashed
                    className="size-5 text-paper/45"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="mt-4 text-lg font-medium">{currentStep.detail}</p>
              <div className="mt-5 rounded-lg border border-paper/15 bg-paper/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-paper/45">
                  Visible state
                </p>
                <p className="mt-2 text-sm leading-6 text-paper/75">
                  {currentStep.state}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/35 p-5">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-signal-ink" aria-hidden="true" />
                <h4 className="font-semibold">Verification state</h4>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {verificationDisplay.detail}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {scenario.verification.checks.map((check) => (
                  <li key={check} className="flex items-start gap-2">
                    <VerificationIcon
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        verificationDisplay.tone,
                      )}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block">{check}</span>
                      <span
                        className={cn(
                          'mt-0.5 block text-xs font-medium',
                          verificationDisplay.tone,
                        )}
                      >
                        {verificationDisplay.label}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={restart}
              disabled={stepIndex === 0 && !confirmed}
            >
              <RotateCcw data-icon="inline-start" /> Restart
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setStepIndex((current) => Math.max(0, current - 1))
                }
                disabled={stepIndex === 0}
              >
                <ArrowLeft data-icon="inline-start" /> Previous
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setStepIndex((current) =>
                    Math.min(flow.steps.length - 1, current + 1),
                  )
                }
                disabled={atEnd}
              >
                Next step <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <aside
        className={cn(
          'rounded-2xl border p-5 sm:p-6',
          scenario.confirmation.level === 'required'
            ? 'border-warning/35 bg-warning/7'
            : 'border-border bg-card',
        )}
        aria-labelledby="confirmation-heading"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="size-5 text-signal-ink"
                aria-hidden="true"
              />
              <p className="eyebrow">Human confirmation boundary</p>
            </div>
            <h3
              id="confirmation-heading"
              className="mt-3 text-lg font-semibold"
            >
              {scenario.confirmation.level === 'none'
                ? 'No action-time confirmation needed'
                : scenario.confirmation.level === 'review'
                  ? 'Human review before the change'
                  : 'Explicit approval required before execution'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Trigger:</strong>{' '}
              {scenario.confirmation.trigger}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {scenario.confirmation.behavior}
            </p>
          </div>
          {boundaryNeedsAction ? (
            <Button
              type="button"
              variant={confirmed ? 'outline' : 'default'}
              onClick={() => setConfirmed((current) => !current)}
              aria-pressed={confirmed}
              disabled={!canReviewBoundary}
            >
              {!canReviewBoundary ? (
                <>
                  <ShieldCheck data-icon="inline-start" /> Reach the after-state
                  first
                </>
              ) : confirmed ? (
                <>
                  <CheckCircle2 data-icon="inline-start" /> Review acknowledged
                </>
              ) : (
                <>
                  <ShieldCheck data-icon="inline-start" /> Simulate human review
                </>
              )}
            </Button>
          ) : (
            <span className="status-chip bg-background">
              Read-only or reversible pattern
            </span>
          )}
        </div>
        <p className="mt-4 border-t border-current/10 pt-4 text-xs leading-5 text-muted-foreground">
          {scenario.confirmation.rationale} This control changes only this
          synthetic demonstration.
        </p>
      </aside>
    </section>
  );
}
