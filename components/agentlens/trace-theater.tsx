'use client';

import {
  Activity,
  Bot,
  BrainCircuit,
  Check,
  Clock3,
  Code2,
  FileJson2,
  Globe2,
  MousePointer2,
  Network,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';

import {
  parseOpenTelemetryTrace,
  type AgentTraceStep,
  type AgentTraceStepKind,
  type ImportedAgentTrace,
} from '@/lib/agentlens-trace';

type AgentGroup = {
  name: string;
  members: string[];
};

const agentGroups: AgentGroup[] = [
  {
    name: 'Work & frontier agents',
    members: [
      'Claude Cowork',
      'ChatGPT',
      'eve',
      'OpenClaw',
      'Gemini',
      'Grok',
      'Hermes',
    ],
  },
  { name: 'Personal agents', members: ['Muse', 'Instinct', 'Miso'] },
];

const sampleSteps: AgentTraceStep[] = [
  {
    id: 'intent',
    kind: 'agent',
    label: 'Frame the intent',
    detail: 'Turn the request into a read-only research goal.',
  },
  {
    id: 'search',
    kind: 'search',
    label: 'Search official docs',
    detail: 'web.search · look for the product’s setup guide.',
    target: 'docs.product.example',
  },
  {
    id: 'fetch',
    kind: 'fetch',
    label: 'Fetch the quickstart',
    detail: 'GET docs.product.example/quickstart · HTTP 200',
    target: 'docs.product.example/quickstart',
    statusCode: 200,
    durationMs: 410,
  },
  {
    id: 'crawl',
    kind: 'crawl',
    label: 'Follow a docs link',
    detail: 'Open the linked configuration reference.',
    target: 'docs.product.example/reference',
    statusCode: 200,
    durationMs: 365,
  },
  {
    id: 'browse',
    kind: 'browse',
    label: 'Inspect the page',
    detail: 'browser.navigate · inspect visible setup steps.',
    target: 'docs.product.example/quickstart',
  },
  {
    id: 'answer',
    kind: 'model',
    label: 'Summarize the evidence',
    detail: 'A concise, source-backed response is prepared.',
  },
];

const kindPresentation: Record<
  AgentTraceStepKind,
  { icon: LucideIcon; color: string; short: string }
> = {
  agent: { icon: Bot, color: 'text-cyan-300', short: 'AGENT' },
  model: { icon: BrainCircuit, color: 'text-violet-300', short: 'MODEL' },
  search: { icon: Search, color: 'text-amber-300', short: 'SEARCH' },
  fetch: { icon: Globe2, color: 'text-emerald-300', short: 'FETCH' },
  crawl: { icon: Network, color: 'text-teal-300', short: 'CRAWL' },
  browse: { icon: MousePointer2, color: 'text-signal', short: 'BROWSER' },
  tool: { icon: Code2, color: 'text-paper/70', short: 'TOOL' },
};

const disclosedSignals: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Search', icon: Search },
  { label: 'Fetch', icon: Globe2 },
  { label: 'Browse', icon: MousePointer2 },
  { label: 'Model turn', icon: BrainCircuit },
];

function formatDuration(durationMs: number | null) {
  if (durationMs === null) return 'Not reported';
  if (durationMs < 1_000) return `${durationMs} ms`;
  return `${(durationMs / 1_000).toFixed(1)} s`;
}

function AgentSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[.15em] text-paper/50">
        Sample agent profile
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="min-h-12 w-full rounded-xl border border-paper/12 bg-[#111815] px-3.5 text-sm font-semibold text-paper outline-none transition focus-visible:border-signal/60 focus-visible:ring-2 focus-visible:ring-signal/30"
      >
        {agentGroups.map((group) => (
          <optgroup key={group.name} label={group.name}>
            {group.members.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className="mt-1.5 block text-[10px] leading-4 text-paper/40">
        Profile label for the sample replay. No agent is connected or launched.
      </span>
    </label>
  );
}

function TraceMap({
  steps,
  activeIndex,
}: {
  steps: AgentTraceStep[];
  activeIndex: number;
}) {
  const firstVisible = Math.min(
    Math.max(0, activeIndex - 3),
    Math.max(0, steps.length - 7),
  );
  const visibleSteps = steps.slice(firstVisible, firstVisible + 7);
  const visibleActiveIndex = activeIndex - firstVisible;
  const plotted = visibleSteps.map((step, index, list) => ({
    step,
    x: 40 + (index * 820) / Math.max(list.length - 1, 1),
    y: index % 2 === 0 ? 76 : 158,
  }));
  const path = plotted
    .map(({ x, y }, index) => {
      if (index === 0) return `M ${x} ${y}`;
      const previous = plotted[index - 1]!;
      const middleX = (previous.x + x) / 2;
      return `Q ${middleX} ${previous.y} ${middleX} ${(previous.y + y) / 2} T ${x} ${y}`;
    })
    .join(' ');
  const completed = Math.max(
    0,
    Math.min(visibleActiveIndex, plotted.length - 1),
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-paper/10 bg-[#101613] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[.16em] text-paper/40">
            Activity map
          </p>
          <p className="mt-1 text-xs text-paper/65">
            Recorded tools, network calls, and model spans
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/10 bg-paper/[.04] px-2.5 py-1 font-mono text-[9px] text-paper/55">
          <Activity className="size-3 text-signal" aria-hidden="true" />
          {steps.length} operations
        </span>
      </div>

      <p className="sr-only">
        Trace map with {steps.length} recorded operations. The ordered event
        summary below identifies each step.
      </p>
      <svg
        viewBox="0 0 900 230"
        aria-hidden="true"
        className="mt-2 hidden h-48 w-full overflow-visible sm:block"
      >
        <defs>
          <linearGradient id="agentlens-trace-line" x1="0" x2="1">
            <stop offset="0%" stopColor="#bff34a" stopOpacity=".18" />
            <stop offset="100%" stopColor="#bff34a" stopOpacity=".95" />
          </linearGradient>
          <filter
            id="agentlens-trace-glow"
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
          >
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="white"
          strokeOpacity=".08"
          strokeWidth="2"
        />
        <path
          d={path}
          fill="none"
          stroke="url(#agentlens-trace-line)"
          strokeWidth="2.5"
          strokeDasharray="7 9"
          strokeDashoffset={Math.max(0, plotted.length - completed - 1) * 20}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
        {plotted.map(({ step, x, y }, index) => {
          const reached = index <= visibleActiveIndex;
          const Icon = kindPresentation[step.kind].icon;
          return (
            <g key={step.id}>
              {index === visibleActiveIndex && (
                <circle
                  cx={x}
                  cy={y}
                  r="24"
                  fill="#bff34a"
                  fillOpacity=".12"
                  filter="url(#agentlens-trace-glow)"
                  className="motion-safe:animate-pulse"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r="17"
                fill={reached ? '#bff34a' : '#1b2420'}
                stroke={reached ? '#bff34a' : '#53605a'}
                strokeOpacity={reached ? 1 : 0.55}
              />
              <foreignObject x={x - 9} y={y - 9} width="18" height="18">
                <Icon
                  className={`size-[18px] ${reached ? 'text-[#172017]' : 'text-paper/45'}`}
                  aria-hidden="true"
                />
              </foreignObject>
              <text
                x={x}
                y={y + 42}
                textAnchor="middle"
                className={`fill-current font-mono text-[9px] ${reached ? 'text-paper/75' : 'text-paper/35'}`}
              >
                {kindPresentation[step.kind].short}
              </text>
            </g>
          );
        })}
      </svg>

      <ol className="mt-4 space-y-2 sm:hidden">
        {visibleSteps.map((step, index) => {
          const active = index === visibleActiveIndex;
          const KindIcon = kindPresentation[step.kind].icon;
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${active ? 'border-signal/35 bg-signal/[.08]' : 'border-paper/8 bg-paper/[.025]'}`}
            >
              <span
                className={`grid size-8 place-items-center rounded-lg bg-paper/[.06] ${kindPresentation[step.kind].color}`}
              >
                <KindIcon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-paper/80">
                {step.label}
              </span>
              <span className="font-mono text-[9px] text-paper/35">
                {String(firstVisible + index + 1).padStart(2, '0')}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="h-1 overflow-hidden rounded-full bg-white/[.07]">
        <div
          className="h-full rounded-full bg-signal transition-[width] duration-700 motion-reduce:transition-none"
          style={{
            width: `${steps.length ? ((activeIndex + 1) / steps.length) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}

export function AgentRunTheater() {
  const [profile, setProfile] = useState('Claude Cowork');
  const [trace, setTrace] = useState<ImportedAgentTrace | null>(null);
  const [intent, setIntent] = useState(
    'Find the official setup guide and explain the required steps.',
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [importName, setImportName] = useState('');
  const isImported = trace !== null;
  const steps = trace?.steps ?? sampleSteps;
  const activeStep = steps[Math.min(activeIndex, steps.length - 1)];
  const tokenTotal =
    trace && trace.inputTokens !== null && trace.outputTokens !== null
      ? trace.inputTokens + trace.outputTokens
      : null;

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    let current = activeIndex;
    const timer = window.setInterval(() => {
      current = Math.min(current + 1, steps.length - 1);
      setActiveIndex(current);
      if (current >= steps.length - 1) {
        window.clearInterval(timer);
        setPlaying(false);
      }
    }, 1_150);
    return () => window.clearInterval(timer);
  }, [activeIndex, playing, steps.length]);

  const importTrace = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setError('');
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Trace files must be 5 MB or smaller.');
      }
      const imported = parseOpenTelemetryTrace(await file.text());
      setTrace(imported);
      setImportName(file.name);
      setProfile(imported.agent ?? imported.model ?? 'Imported agent');
      setIntent('');
      setActiveIndex(0);
      setPlaying(false);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'The trace could not be imported.',
      );
    }
  };

  const resetToSample = () => {
    setTrace(null);
    setImportName('');
    setError('');
    setIntent('Find the official setup guide and explain the required steps.');
    setActiveIndex(0);
    setPlaying(true);
  };

  const replay = () => {
    setActiveIndex(0);
    setPlaying(true);
  };

  const activePresentation = activeStep
    ? kindPresentation[activeStep.kind]
    : kindPresentation.agent;
  const ActiveIcon = activePresentation.icon;
  const durationMs = trace?.durationMs ?? null;
  const measuredTokenSummary =
    trace && (trace.inputTokens !== null || trace.outputTokens !== null)
      ? `${trace.inputTokens === null ? '—' : `${trace.inputTokens.toLocaleString()} in`} · ${trace.outputTokens === null ? '—' : `${trace.outputTokens.toLocaleString()} out`}`
      : 'Not reported';

  return (
    <section
      aria-labelledby="agent-run-theater-heading"
      className="mx-auto max-w-7xl px-5 pb-16 lg:px-8"
    >
      <div className="overflow-hidden rounded-[28px] border border-paper/12 bg-[#151b18] shadow-[0_32px_100px_rgb(0_0_0/.3)]">
        <div className="relative border-b border-paper/10 px-5 py-7 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-14 -top-24 size-72 rounded-full bg-signal/10 blur-[90px]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/[.07] px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[.16em] text-signal">
                <Workflow className="size-3.5" aria-hidden="true" />
                Agent run theater · 02
              </div>
              <h2
                id="agent-run-theater-heading"
                className="mt-4 text-balance text-3xl font-semibold tracking-[-.05em] sm:text-4xl"
              >
                Watch the work take shape.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/55 sm:text-base sm:leading-7">
                Follow intent, browser moves, searches, fetches, and model
                turns. Import a real trace to see what your agent actually
                recorded.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={playing ? () => setPlaying(false) : replay}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-xs font-bold text-ink transition hover:-translate-y-0.5 hover:bg-[#e5ff67] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transform-none"
              >
                {playing ? (
                  <Pause className="size-4" aria-hidden="true" />
                ) : (
                  <Play className="size-4" aria-hidden="true" />
                )}
                {playing ? 'Pause replay' : 'Replay trace'}
              </button>
              {isImported && (
                <button
                  type="button"
                  onClick={resetToSample}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-paper/15 px-3.5 py-2.5 text-xs font-semibold text-paper/65 transition hover:border-paper/30 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Sample
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,.7fr)] lg:gap-6 lg:p-7">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[.1em] ${isImported ? 'border-emerald-300/25 bg-emerald-300/[.08] text-emerald-200' : 'border-amber-300/25 bg-amber-300/[.08] text-amber-200'}`}
                >
                  {isImported ? (
                    <ShieldCheck className="size-3" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-3" aria-hidden="true" />
                  )}
                  {isImported ? 'Imported trace' : 'Sample replay · synthetic'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/10 px-2.5 py-1.5 font-mono text-[9px] text-paper/45">
                  <Activity className="size-3 text-signal" aria-hidden="true" />
                  {isImported
                    ? importName
                    : 'No external agent or target contacted'}
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[.12em] text-paper/35">
                {isImported ? 'Local trace data' : 'Illustrative scenario'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  label: 'Recorded steps',
                  value: isImported
                    ? String(steps.length)
                    : `${steps.length} demo`,
                  detail: isImported
                    ? 'spans with agent activity'
                    : 'synthetic events',
                  icon: Workflow,
                },
                {
                  label: 'Run duration',
                  value: isImported ? formatDuration(durationMs) : 'Playback',
                  detail: isImported
                    ? 'reported span interval'
                    : 'not a run measurement',
                  icon: Clock3,
                },
                {
                  label: 'Token usage',
                  value:
                    tokenTotal === null ? '—' : tokenTotal.toLocaleString(),
                  detail: isImported ? measuredTokenSummary : 'not measured',
                  icon: Zap,
                },
                {
                  label: 'Run cost',
                  value: '—',
                  detail: 'not in trace data',
                  icon: ShieldCheck,
                },
              ].map(({ label, value, detail, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-paper/10 bg-[#101613] p-3 sm:p-3.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[8px] font-semibold uppercase tracking-[.11em] text-paper/40 sm:text-[9px]">
                      {label}
                    </span>
                    <Icon
                      className="size-3.5 text-signal/70"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-2 truncate text-lg font-semibold tabular-nums text-paper sm:text-xl">
                    {value}
                  </p>
                  <p className="mt-1 min-h-4 truncate text-[8px] text-paper/35 sm:text-[9px]">
                    {detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-paper/10 bg-[#101613] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="agentlens-trace-intent"
                    className="font-mono text-[9px] font-semibold uppercase tracking-[.15em] text-amber-200/80"
                  >
                    Intent annotation
                  </label>
                  <textarea
                    id="agentlens-trace-intent"
                    value={intent}
                    onChange={(event) =>
                      setIntent(event.currentTarget.value.slice(0, 280))
                    }
                    maxLength={280}
                    rows={2}
                    placeholder={
                      isImported
                        ? 'Add a short intent note (optional)'
                        : undefined
                    }
                    className="mt-2 min-h-14 w-full resize-y bg-transparent text-base leading-6 text-paper outline-none placeholder:text-paper/30 focus-visible:ring-1 focus-visible:ring-signal/50 sm:text-lg"
                  />
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-paper/10 px-2.5 py-1.5 font-mono text-[8px] text-paper/40">
                  <Check className="size-3 text-signal" aria-hidden="true" />
                  {isImported ? 'Local note' : 'Sample goal'}
                </span>
              </div>
            </div>

            <TraceMap steps={steps} activeIndex={activeIndex} />

            {activeStep && (
              <div className="flex items-start gap-3 rounded-2xl border border-signal/20 bg-signal/[.055] p-4 sm:p-5">
                <div
                  className={`grid size-10 shrink-0 place-items-center rounded-xl border border-paper/10 bg-paper/[.045] ${activePresentation.color}`}
                >
                  <ActiveIcon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-paper">
                      {activeStep.label}
                    </p>
                    <span
                      className={`font-mono text-[8px] font-bold uppercase tracking-[.12em] ${activePresentation.color}`}
                    >
                      {activePresentation.short}
                    </span>
                  </div>
                  <p className="mt-1.5 break-words text-xs leading-5 text-paper/55">
                    {activeStep.detail}
                  </p>
                  {activeStep.durationMs !== undefined && (
                    <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[9px] text-paper/35">
                      <Clock3 className="size-3" aria-hidden="true" />
                      Span duration {formatDuration(activeStep.durationMs)}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[9px] tabular-nums text-paper/35">
                  {String(activeIndex + 1).padStart(2, '0')} /{' '}
                  {String(steps.length).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-paper/10 bg-[#101613] p-4 sm:p-5">
              {isImported ? (
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/[.08] text-emerald-200">
                    <FileJson2 className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-paper">
                      {trace.agent ?? 'Imported agent trace'}
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-paper/45">
                      {trace.model
                        ? `Model · ${trace.model}`
                        : 'Model not reported'}
                    </p>
                    <p className="mt-2 text-[10px] leading-5 text-paper/35">
                      Imported from this tab’s local file. Run metadata is shown
                      only when the trace reports it.
                    </p>
                  </div>
                </div>
              ) : (
                <AgentSelect value={profile} onChange={setProfile} />
              )}
              <div className="mt-4 flex items-center gap-2 border-t border-paper/8 pt-3 text-[10px] text-paper/40">
                <span
                  className={`size-1.5 rounded-full ${isImported ? 'bg-emerald-300' : 'bg-amber-300'}`}
                />
                {isImported
                  ? 'Real exported trace'
                  : `Demo profile · ${profile} · not connected`}
              </div>
            </div>

            <label className="group flex min-h-[8.5rem] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-signal/30 bg-signal/[.035] p-5 text-center transition hover:border-signal/60 hover:bg-signal/[.07] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-signal">
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) => void importTrace(event)}
                className="sr-only"
                aria-label="Import an OpenTelemetry trace JSON file"
              />
              <span className="grid size-10 place-items-center rounded-xl border border-signal/20 bg-signal/[.08] text-signal transition group-hover:scale-105 motion-reduce:transform-none">
                <Upload className="size-4" aria-hidden="true" />
              </span>
              <span className="mt-3 text-xs font-semibold text-paper">
                Import a real trace
              </span>
              <span className="mt-1 text-[10px] leading-4 text-paper/40">
                OpenTelemetry JSON · processed in this tab
              </span>
            </label>
            <p className="-mt-2 px-1 text-[9px] leading-4 text-paper/35">
              Real imports need an agent/runtime that exports GenAI, tool, or
              HTTP spans. Some closed agents do not expose a compatible trace
              file.{' '}
              <a
                href="https://opentelemetry.io/docs/specs/semconv/gen-ai/"
                className="underline decoration-paper/25 underline-offset-2 hover:text-paper/70"
              >
                Trace fields
              </a>
            </p>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-100/80"
              >
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-rose-300" />
                {error}
              </p>
            )}

            <div className="rounded-2xl border border-paper/10 bg-paper/[.035] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="size-4 text-signal"
                  aria-hidden="true"
                />
                <h3 className="text-xs font-semibold text-paper">
                  Signals, not hidden thoughts
                </h3>
              </div>
              <p className="mt-2 text-[10px] leading-5 text-paper/45">
                AgentLens shows operation names, tool categories, redacted URL
                paths, status, timing, and reported token counts. It does not
                display prompts, completions, private reasoning, tool arguments,
                or tool results.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {disclosedSignals.map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-paper/8 bg-black/10 px-2 py-1.5 text-[9px] text-paper/45"
                  >
                    <Icon className="size-3 text-paper/55" aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/10 bg-amber-100/[.035] p-4 text-[10px] leading-5 text-paper/40">
              Sample profiles are labels for this demonstration only. Use a
              trace export to inspect a real run; browser or agent connections
              are not implied.
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
