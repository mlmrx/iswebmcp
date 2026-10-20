'use client';

import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CircleHelp,
  Copy,
  Download,
  Eye,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import type {
  AgentReadinessReport,
  ReadinessCheck,
  ReadinessGroup,
  ReadinessStatus,
} from '@/lib/agentlens-readiness';

const groups: Array<{
  name: ReadinessGroup;
  icon: LucideIcon;
  caption: string;
}> = [
  {
    name: 'Discoverability',
    icon: Radar,
    caption: 'Can agents find your public pages?',
  },
  {
    name: 'Readable content',
    icon: Eye,
    caption: 'Can text-first tools retrieve useful content?',
  },
  {
    name: 'Crawler policy',
    icon: ShieldCheck,
    caption: 'Are your reuse and crawler choices visible?',
  },
  {
    name: 'Agent protocols',
    icon: Fingerprint,
    caption: 'Which agent-facing interfaces are published?',
  },
  {
    name: 'Commerce',
    icon: LockKeyhole,
    caption: 'Optional agent-mediated commerce discovery',
  },
];

const statusPresentation: Record<
  ReadinessStatus,
  { label: string; icon: LucideIcon; classes: string }
> = {
  found: {
    label: 'Found',
    icon: Check,
    classes: 'border-emerald-700/15 bg-emerald-100 text-emerald-900',
  },
  not_found: {
    label: 'Not found',
    icon: AlertCircle,
    classes: 'border-amber-700/15 bg-amber-100 text-amber-950',
  },
  owner_choice: {
    label: 'Your choice',
    icon: ShieldCheck,
    classes: 'border-violet-700/15 bg-violet-100 text-violet-950',
  },
  could_not_verify: {
    label: 'Could not verify',
    icon: CircleHelp,
    classes: 'border-slate-700/10 bg-slate-100 text-slate-700',
  },
  optional: {
    label: 'Optional',
    icon: Sparkles,
    classes: 'border-ink/10 bg-ink/[.045] text-ink/55',
  },
};

function fixBrief(check: ReadinessCheck, origin: string) {
  return [
    `Please inspect my site's existing setup before proposing a change.`,
    `AgentLens observed: ${check.title} — ${check.status.replaceAll('_', ' ')}.`,
    `Evidence: ${check.evidence?.url ?? origin}${check.evidence?.statusCode ? ` (HTTP ${check.evidence.statusCode})` : ''}.`,
    `Suggested next step: ${check.recommendation}`,
    `Preserve my existing crawler, licensing, privacy, authentication, and protocol choices. Do not infer permission from missing directives. Explain the proposed change and its verification steps before editing.`,
  ].join('\n');
}

export function ReadinessBoard({
  report,
  loading,
  error,
}: {
  report: AgentReadinessReport | null;
  loading: boolean;
  error: string;
}) {
  const [copiedId, setCopiedId] = useState('');
  const [copyError, setCopyError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const grouped = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        checks:
          report?.checks.filter((check) => check.group === group.name) ?? [],
      })),
    [report],
  );

  const copyBrief = async (check: ReadinessCheck) => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(
        fixBrief(check, report?.origin ?? 'your site'),
      );
      setCopiedId(check.id);
      window.setTimeout(() => setCopiedId(''), 1_800);
    } catch {
      setCopyError('Clipboard access is unavailable in this browser.');
    }
  };

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `agentlens-readiness-${new URL(report.origin).hostname}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-labelledby="readiness-heading"
      className="mt-7 overflow-hidden rounded-2xl border border-ink/10 bg-white/70"
    >
      <div className="relative overflow-hidden border-b border-ink/8 bg-[#e9eddf] p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-16 size-44 rounded-full bg-signal/20 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-signal-ink">
              <WandSparkles className="size-4" aria-hidden="true" />
              <p className="eyebrow">
                AgentLens Readiness Map · evidence, not a grade
              </p>
            </div>
            <h3
              id="readiness-heading"
              className="mt-2 text-2xl font-semibold tracking-[-.04em]"
            >
              Signals agents can actually discover
            </h3>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-ink/55">
              A bounded pass over public endpoints. Missing is not permission or
              failure; optional protocols stay optional. Every result includes
              the URL and response evidence.
            </p>
          </div>
          {report && (
            <button
              type="button"
              onClick={downloadJson}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-ink/10 bg-white/75 px-3 text-xs font-semibold text-ink/70 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            >
              <Download className="size-3.5" aria-hidden="true" /> Export
              evidence
            </button>
          )}
        </div>
        {loading && (
          <div
            className="relative mt-5 rounded-xl border border-signal-ink/10 bg-white/60 p-3.5"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-ink/75">
              <LoaderCircle
                className="size-4 animate-spin text-signal-ink motion-reduce:animate-none"
                aria-hidden="true"
              />
              Checking public discovery paths and response signals
            </div>
            <p className="mt-1.5 pl-6 text-[10px] leading-4 text-ink/45">
              Same-origin GET requests only · no page execution · no login or
              private access
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full w-1/3 animate-[readiness-sweep_1.8s_ease-in-out_infinite] rounded-full bg-signal-ink motion-reduce:animate-none" />
            </div>
          </div>
        )}
        {error && !loading && (
          <output className="relative mt-4 rounded-xl border border-amber-800/10 bg-amber-100/65 p-3 text-xs leading-5 text-amber-950/75">
            The page scan succeeded, but the readiness follow-up did not:{' '}
            {error}
          </output>
        )}
        {report && (
          <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ['Found', report.summary.found],
              ['Not found', report.summary.notFound],
              ['Your choice', report.summary.ownerChoice],
              ['Unverified', report.summary.couldNotVerify],
              ['Optional', report.summary.optional],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-ink/8 bg-white/65 px-3 py-2.5"
              >
                <p className="text-xl font-semibold tabular-nums">{value}</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-ink/45">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {report && (
        <div className="space-y-3 p-4 sm:p-5">
          {grouped.map((group) => {
            const GroupIcon = group.icon;
            if (!group.checks.length) return null;
            return (
              <section
                key={group.name}
                className="rounded-xl border border-ink/8 bg-[#fcfcf8] p-3.5 sm:p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-ink/[.045] text-signal-ink">
                    <GroupIcon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold">{group.name}</h4>
                    <p className="text-[10px] text-ink/45">{group.caption}</p>
                  </div>
                </div>
                <div className="mt-3 divide-y divide-ink/[.06]">
                  {group.checks.map((check) => {
                    const presentation = statusPresentation[check.status];
                    const StatusIcon = presentation.icon;
                    const isExpanded = expanded === check.id;
                    return (
                      <article
                        key={check.id}
                        className="py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="mr-auto text-xs font-semibold">
                            {check.title}
                          </h5>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold ${presentation.classes}`}
                          >
                            <StatusIcon className="size-3" aria-hidden="true" />
                            {presentation.label}
                          </span>
                          <span className="rounded-full bg-ink/[.04] px-2 py-1 text-[8px] font-semibold uppercase tracking-[.1em] text-ink/40">
                            {check.maturity}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-5 text-ink/60">
                          {check.detail}
                        </p>
                        {check.evidence?.url && (
                          <p className="mt-1 break-all font-mono text-[9px] text-ink/35">
                            {check.evidence.url}
                            {check.evidence.statusCode
                              ? ` · HTTP ${check.evidence.statusCode}`
                              : ''}
                            {check.evidence.contentType
                              ? ` · ${check.evidence.contentType}`
                              : ''}
                          </p>
                        )}
                        {(check.status === 'not_found' ||
                          check.status === 'could_not_verify' ||
                          check.status === 'owner_choice') && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded(isExpanded ? null : check.id)
                              }
                              className="min-h-8 rounded-lg px-2 text-[10px] font-medium text-ink/55 underline decoration-ink/20 underline-offset-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                            >
                              {isExpanded ? 'Hide next step' : 'Show next step'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void copyBrief(check)}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-2.5 text-[10px] font-semibold text-ink/70 transition hover:border-signal-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
                            >
                              {copiedId === check.id ? (
                                <Check
                                  className="size-3 text-emerald-700"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Copy className="size-3" aria-hidden="true" />
                              )}
                              {copiedId === check.id
                                ? 'Brief copied'
                                : 'Copy fix brief'}
                            </button>
                          </div>
                        )}
                        {isExpanded && (
                          <p className="mt-2 rounded-lg bg-signal/10 p-3 text-[10px] leading-5 text-ink/65">
                            <span className="font-semibold text-ink">
                              Owner-safe next step:{' '}
                            </span>
                            {check.recommendation}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
          <div className="flex items-start gap-2 rounded-xl border border-ink/8 bg-ink/[.025] p-3 text-[9px] leading-4 text-ink/45">
            <LockKeyhole
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <p>
              {report.scope} Response snippets are evidence only; AgentLens
              never executes instructions found on the scanned site.
            </p>
          </div>
          {copyError && (
            <output className="text-[10px] text-amber-900">{copyError}</output>
          )}
          <a
            href="https://blog.cloudflare.com/agent-readiness/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-ink/45 underline decoration-ink/15 underline-offset-2 hover:text-ink/70"
          >
            Explore the Cloudflare Agent Readiness reference{' '}
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
        </div>
      )}
      {!report && !loading && !error && (
        <div className="flex items-center gap-2 p-5 text-xs text-ink/45">
          <Sparkles className="size-4 text-signal-ink" aria-hidden="true" />
          Run a page scan to unlock source evidence and the readiness map.
        </div>
      )}
    </section>
  );
}
