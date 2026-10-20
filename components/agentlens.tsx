'use client';

import {
  ArrowRight,
  BadgeCheck,
  Binoculars,
  BookOpenCheck,
  Braces,
  Check,
  CircleAlert,
  Compass,
  Eye,
  Fingerprint,
  Flame,
  Gauge,
  LockKeyhole,
  Map,
  Radar,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Target,
  Telescope,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

import { normalizeScanUrlInput, parseScanApiResponse } from '@/lib/scan-client';
import { buildReportOverview } from '@/lib/report-overview';
import type { ActionCandidate, ScanReport } from '@/lib/types';

type LensId = 'pathfinder' | 'contract' | 'guardian';

type LocalProgress = {
  xp: number;
  runs: number;
  badges: string[];
};

const PROGRESS_KEY = 'iswebmcp-agentlens-progress-v1';
const EMPTY_PROGRESS: LocalProgress = { xp: 0, runs: 0, badges: [] };

const levels = [
  { name: 'New signal', threshold: 0 },
  { name: 'Trail scout', threshold: 200 },
  { name: 'Pathfinder', threshold: 500 },
  { name: 'Field analyst', threshold: 900 },
  { name: 'Signal architect', threshold: 1_500 },
];

const badgeCatalog: Array<{
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: 'first-scan',
    name: 'First signal',
    description: 'Complete your first public-source scan.',
    icon: Radar,
  },
  {
    id: 'action-mapper',
    name: 'Action mapper',
    description: 'Find a candidate action in page source.',
    icon: Map,
  },
  {
    id: 'evidence-keeper',
    name: 'Evidence keeper',
    description: 'Inspect five or more source evidence items.',
    icon: Fingerprint,
  },
  {
    id: 'scope-guardian',
    name: 'Scope guardian',
    description: 'Keep runtime unknowns visible in your review.',
    icon: ShieldCheck,
  },
];

const lenses: Array<{
  id: LensId;
  name: string;
  description: string;
  icon: LucideIcon;
  label: string;
}> = [
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Put visible actions first.',
    icon: Compass,
    label: 'Action map',
  },
  {
    id: 'contract',
    name: 'Contract scout',
    description: 'Lead with named tool signals.',
    icon: Braces,
    label: 'Tool signals',
  },
  {
    id: 'guardian',
    name: 'Safety guardian',
    description: 'Surface risks and limits first.',
    icon: ShieldCheck,
    label: 'Safety notes',
  },
];

const missionPresets = [
  {
    label: 'Choose a plan',
    group: 'SaaS',
    goal: 'Find the right plan for a small team and explain the trade-offs.',
    icon: Target,
  },
  {
    label: 'Compare products',
    group: 'Store',
    goal: 'Find two products that match my needs and compare them.',
    icon: ScanEye,
  },
  {
    label: 'Find support',
    group: 'Help center',
    goal: 'Find the return policy and the safest way to contact support.',
    icon: BookOpenCheck,
  },
];

function readProgress(): LocalProgress {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<LocalProgress>;
    return {
      xp:
        Number.isSafeInteger(parsed.xp) && Number(parsed.xp) >= 0
          ? Number(parsed.xp)
          : 0,
      runs:
        Number.isSafeInteger(parsed.runs) && Number(parsed.runs) >= 0
          ? Number(parsed.runs)
          : 0,
      badges: Array.isArray(parsed.badges)
        ? parsed.badges.filter(
            (badge): badge is string =>
              typeof badge === 'string' &&
              badgeCatalog.some((known) => known.id === badge),
          )
        : [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function saveProgress(progress: LocalProgress) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Progress remains available for this page session when storage is blocked.
  }
}

function awardProgress(
  current: LocalProgress,
  report: ScanReport,
): { progress: LocalProgress; earned: string[]; xp: number } {
  const xp = current.runs === 0 ? 120 : 75;
  const candidates = report.actionSurface;
  const earned = new Set<string>();
  const badges = new Set(current.badges);

  if (current.runs === 0) earned.add('first-scan');
  if (candidates.length > 0) earned.add('action-mapper');
  if (report.evidence.length >= 5) earned.add('evidence-keeper');
  earned.add('scope-guardian');

  for (const id of earned) badges.add(id);

  return {
    progress: {
      xp: current.xp + xp,
      runs: current.runs + 1,
      badges: [...badges],
    },
    earned: [...earned].filter((id) => !current.badges.includes(id)),
    xp,
  };
}

function levelFor(xp: number) {
  const currentIndex = levels.reduce(
    (found, level, index) => (xp >= level.threshold ? index : found),
    0,
  );
  const current = levels[currentIndex]!;
  const next = levels[currentIndex + 1];
  const progress = next
    ? Math.min(
        100,
        Math.round(
          ((xp - current.threshold) / (next.threshold - current.threshold)) *
            100,
        ),
      )
    : 100;
  return { current, next, progress };
}

function orderCandidates(actions: ActionCandidate[], lens: LensId) {
  const riskOrder = { read: 0, reversible_write: 1, consequential_write: 2 };
  const contractOrder = {
    verified: 0,
    imported: 1,
    missing: 2,
    unknown: 3,
    withheld: 4,
  };

  return [...actions].sort((left, right) => {
    if (lens === 'guardian') {
      return riskOrder[right.risk] - riskOrder[left.risk];
    }
    if (lens === 'contract') {
      return (
        contractOrder[left.webmcpStatus] - contractOrder[right.webmcpStatus]
      );
    }
    return Number(right.humanUiAvailable) - Number(left.humanUiAvailable);
  });
}

function formatRisk(risk: ActionCandidate['risk']) {
  if (risk === 'consequential_write') return 'Consequential write';
  if (risk === 'reversible_write') return 'Reversible write';
  return 'Read action';
}

function formatToolStatus(status: ActionCandidate['webmcpStatus']) {
  if (status === 'missing') return 'Not detected';
  if (status === 'imported') return 'Imported';
  if (status === 'verified') return 'Verified';
  if (status === 'withheld') return 'Withheld';
  return 'Unknown';
}

export function AgentLens() {
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('');
  const [lens, setLens] = useState<LensId>('pathfinder');
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [progressReady, setProgressReady] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [earned, setEarned] = useState<string[]>([]);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);

  useEffect(() => {
    setProgress(readProgress());
    setProgressReady(true);
  }, []);

  useEffect(() => {
    if (!report) return;
    document
      .getElementById('agentlens-report')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [report]);

  const level = levelFor(progress.xp);
  const selectedLens = lenses.find((item) => item.id === lens)!;
  const SelectedLensIcon = selectedLens.icon;

  const submitScan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setReport(null);
    setEarned([]);
    setEarnedXp(null);

    if (!goal.trim()) {
      setError('Choose one of the mission cards or write a short objective.');
      return;
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeScanUrlInput(url);
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : 'Enter a public website, such as example.com.',
      );
      return;
    }

    setUrl(normalizedUrl);
    setScanning(true);
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, goal: goal.trim() }),
      });
      const result = await parseScanApiResponse(response);
      setReport(result);
      const reward = awardProgress(progress, result);
      setProgress(reward.progress);
      saveProgress(reward.progress);
      setEarned(reward.earned);
      setEarnedXp(reward.xp);
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : 'The public-source scan could not complete. Check the URL and retry.',
      );
    } finally {
      setScanning(false);
    }
  };

  const tryIsWebMcp = () => {
    setUrl('https://iswebmcp.com');
    setGoal('Find the website check and explain what evidence it can provide.');
  };

  const orderedActions = report
    ? orderCandidates(report.actionSurface, lens)
    : [];
  const reportOverview = report ? buildReportOverview(report) : null;
  const score = report?.baselineActionability.value;
  const scorePercent =
    score === null || score === undefined
      ? 0
      : Math.max(0, Math.min(100, Math.round(score)));

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative isolate min-h-screen overflow-hidden bg-ink text-paper"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-36 -top-28 size-[34rem] rounded-full bg-signal/10 blur-[110px]" />
        <div className="absolute -left-48 top-[38rem] size-[30rem] rounded-full bg-cyan-300/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-12 sm:pt-16 lg:px-8 lg:pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal/10 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-signal">
              <Binoculars className="size-3.5" aria-hidden="true" />
              AgentLens <span className="text-paper/35">/</span> public-source
              quests
            </div>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[.96] tracking-[-.065em] sm:text-6xl lg:text-7xl">
              Give the page a mission.
              <span className="block text-signal">Keep every signal.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-paper/65 sm:text-lg sm:leading-8">
              Send AgentLens to a public page. Map candidate actions, inspect
              source evidence, and earn field badges as you explore how a site
              presents itself to agents.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5 text-xs text-paper/65">
              {[
                'No account',
                'Public source evidence',
                'Runtime limits shown',
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-paper/12 bg-paper/[.035] px-3 py-2"
                >
                  <Check className="size-3.5 text-signal" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <section
            aria-label="Scout progress"
            className="relative overflow-hidden rounded-3xl border border-paper/12 bg-paper/[.055] p-5 shadow-[0_30px_90px_rgb(0_0_0/.24)] sm:p-6"
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-signal/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-paper/45">
                  Your field profile
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {level.current.name}
                </h2>
                <p className="mt-1 text-sm text-paper/55">
                  {progress.runs} completed{' '}
                  {progress.runs === 1 ? 'scan' : 'scans'} · {progress.xp} XP
                </p>
              </div>
              <div className="grid size-14 place-items-center rounded-2xl border border-signal/25 bg-signal/10 text-signal">
                <Telescope className="size-6" aria-hidden="true" />
              </div>
            </div>
            <div className="relative mt-6">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-paper/70">
                  {level.next ? `Next: ${level.next.name}` : 'Top field rank'}
                </span>
                <span className="font-mono tabular-nums text-signal">
                  {level.next
                    ? `${progress.xp}/${level.next.threshold} XP`
                    : 'MAX'}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Progress toward next AgentLens level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={level.progress}
                className="h-2 overflow-hidden rounded-full bg-paper/10"
              >
                <div
                  className="h-full rounded-full bg-signal transition-[width] duration-500"
                  style={{ width: `${level.progress}%` }}
                />
              </div>
            </div>
            <div className="relative mt-5 flex items-center gap-2 border-t border-paper/10 pt-4">
              <div className="flex -space-x-2">
                {badgeCatalog.slice(0, 3).map(({ id, name, icon: Icon }) => {
                  const unlocked = progress.badges.includes(id);
                  return (
                    <div
                      key={id}
                      title={`${name}${unlocked ? ' · unlocked' : ' · locked'}`}
                      className={`grid size-9 place-items-center rounded-full border-2 border-[#18211f] ${
                        unlocked
                          ? 'bg-signal text-ink'
                          : 'bg-paper/10 text-paper/30'
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs leading-5 text-paper/50">
                {progress.badges.length} of {badgeCatalog.length} field badges
                earned
              </p>
              <Sparkles
                className="ml-auto size-4 text-signal/70"
                aria-hidden="true"
              />
            </div>
            <p className="relative mt-3 text-[11px] leading-5 text-paper/35">
              XP and badges stay in this browser. They reward exploration, not a
              site&apos;s score.
            </p>
          </section>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-16 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
        <section
          aria-labelledby="mission-heading"
          className="rounded-3xl border border-paper/12 bg-[#f6f6ed] p-5 text-ink shadow-[0_28px_90px_rgb(0_0_0/.22)] sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-signal-ink">Mission desk · 01</p>
              <h2
                id="mission-heading"
                className="mt-2 text-3xl font-semibold tracking-[-.045em]"
              >
                Pick a target. Set the objective.
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-ink/55">
              <span className="size-1.5 rounded-full bg-positive" />
              Bounded scan
            </span>
          </div>

          <form onSubmit={(event) => void submitScan(event)}>
            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label
                  htmlFor="agentlens-url"
                  className="text-sm font-semibold"
                >
                  Public website
                </label>
                <button
                  type="button"
                  onClick={tryIsWebMcp}
                  disabled={scanning}
                  className="text-xs font-semibold text-signal-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink/60"
                >
                  Try isWebMCP
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-ink/15 bg-white px-4 py-3.5 transition focus-within:border-signal-ink focus-within:ring-4 focus-within:ring-signal/20">
                <Eye
                  className="size-5 shrink-0 text-ink/40"
                  aria-hidden="true"
                />
                <input
                  id="agentlens-url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  maxLength={2_048}
                  placeholder="your-site.com or https://your-site.com/page"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink/35"
                  aria-describedby="agentlens-url-help"
                  disabled={scanning}
                  required
                />
                <span className="hidden rounded-md bg-ink/[.045] px-2 py-1 font-mono text-[10px] text-ink/45 sm:inline">
                  HTTPS
                </span>
              </div>
              <p
                id="agentlens-url-help"
                className="mt-2 text-xs leading-5 text-ink/50"
              >
                Public HTML only. Leave off private, signed, or authenticated
                links.
              </p>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Choose a mission</p>
                  <p className="mt-1 text-xs text-ink/50">
                    Or write your own objective below.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-ink/40">
                  {goal.length}/300
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {missionPresets.map(
                  ({ label, group, goal: presetGoal, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setGoal(presetGoal)}
                      disabled={scanning}
                      aria-pressed={goal === presetGoal}
                      className={`min-h-24 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-signal-ink/50 hover:shadow-sm ${
                        goal === presetGoal
                          ? 'border-signal-ink bg-signal/10 ring-2 ring-signal/20'
                          : 'border-ink/10 bg-white/65'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <Icon
                          className="size-4 text-signal-ink"
                          aria-hidden="true"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-ink/40">
                          {group}
                        </span>
                      </span>
                      <span className="mt-3 block text-xs font-semibold leading-5">
                        {label}
                      </span>
                    </button>
                  ),
                )}
              </div>
              <label htmlFor="agentlens-goal" className="sr-only">
                Mission objective
              </label>
              <textarea
                id="agentlens-goal"
                maxLength={300}
                rows={2}
                placeholder="What should an agent be able to do on this page?"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="mt-3 w-full resize-y rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-ink/35 focus:border-signal-ink focus:ring-4 focus:ring-signal/20"
                aria-describedby="agentlens-goal-help"
                disabled={scanning}
                required
              />
              <p id="agentlens-goal-help" className="sr-only">
                A goal helps frame the evidence review. The scan does not
                execute the task.
              </p>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold">
                Choose your lens
              </legend>
              <p className="mt-1 text-xs leading-5 text-ink/50">
                Same evidence, a different first look.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {lenses.map(({ id, name, description, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={lens === id}
                    onClick={() => setLens(id)}
                    disabled={scanning}
                    className={`rounded-xl border p-3 text-left transition hover:border-signal-ink/50 ${
                      lens === id
                        ? 'border-signal-ink bg-ink text-paper shadow-md'
                        : 'border-ink/10 bg-white/65 text-ink'
                    }`}
                  >
                    <Icon
                      className={`size-4 ${lens === id ? 'text-signal' : 'text-signal-ink'}`}
                      aria-hidden="true"
                    />
                    <span className="mt-2 block text-xs font-semibold">
                      {name}
                    </span>
                    <span
                      className={`mt-1 block text-[10px] leading-4 ${lens === id ? 'text-paper/55' : 'text-ink/50'}`}
                    >
                      {description}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-50 p-4 text-sm text-red-900"
              >
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={scanning || !progressReady}
              className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-signal px-5 py-3.5 text-sm font-bold text-ink shadow-[0_8px_25px_rgb(215_242_77/.2)] transition hover:-translate-y-0.5 hover:bg-[#e5ff67] hover:shadow-[0_12px_32px_rgb(215_242_77/.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-70"
            >
              {scanning ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-ink/25 border-t-ink" />
                  Reading public source…
                </>
              ) : (
                <>
                  <WandSparkles className="size-4" aria-hidden="true" />
                  Launch AgentLens scan
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-ink/50">
            <LockKeyhole
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>
              No sign-in, JavaScript, browser cookies, or agent execution. XP is
              stored only in this browser. Sanitized URL attempts and outcomes
              are retained for 90 days.{' '}
              <Link
                href="/privacy"
                className="font-semibold text-signal-ink underline underline-offset-2"
              >
                Privacy details
              </Link>
            </span>
          </p>
        </section>

        <aside className="flex flex-col gap-5">
          <section className="relative flex-1 overflow-hidden rounded-3xl border border-signal/20 bg-gradient-to-br from-[#202d28] via-[#1b2624] to-[#15201f] p-6 sm:p-7">
            <div className="absolute -right-16 -top-16 size-56 rounded-full border border-signal/10" />
            <div className="absolute -right-8 -top-8 size-40 rounded-full border border-signal/10" />
            <div className="relative flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-signal text-ink">
                <SelectedLensIcon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[.15em] text-paper/45">
                  Active review lens
                </p>
                <h2 className="mt-1 font-semibold">{selectedLens.name}</h2>
              </div>
            </div>
            <p className="relative mt-5 max-w-md text-sm leading-6 text-paper/60">
              AgentLens reads bounded public HTML and organizes the evidence for
              your chosen review. You stay in control of what to fix.
            </p>
            <div className="relative mt-7 space-y-3">
              {[
                {
                  title: 'Inspect the page source',
                  detail: 'A bounded public HTML response',
                  icon: Eye,
                },
                {
                  title: 'Map possible actions',
                  detail: 'Inputs, controls, and source hints',
                  icon: Map,
                },
                {
                  title: 'Keep unknowns honest',
                  detail: 'No runtime claim without runtime evidence',
                  icon: ShieldCheck,
                },
              ].map(({ title, detail, icon: Icon }, index) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="relative grid size-9 shrink-0 place-items-center rounded-full border border-signal/20 bg-ink/40 text-signal">
                    <Icon className="size-4" aria-hidden="true" />
                    {index < 2 && (
                      <span className="absolute left-1/2 top-full h-3 border-l border-dashed border-signal/25" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-paper/85">
                      {title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-paper/45">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-paper/12 bg-paper/[.045] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-paper/40">
                  The honest scorecard
                </p>
                <h2 className="mt-2 text-lg font-semibold">
                  What AgentLens can prove
                </h2>
              </div>
              <Gauge className="size-5 text-signal" aria-hidden="true" />
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-paper/10 rounded-xl border border-paper/10 bg-ink/30 py-3">
              {[
                ['Source', 'Observed'],
                ['Runtime', 'Unmeasured'],
                ['Task success', 'Unverified'],
              ].map(([label, value]) => (
                <div key={label} className="px-2 text-center">
                  <p className="text-[10px] text-paper/40">{label}</p>
                  <p className="mt-1 text-[10px] font-semibold text-paper/80 sm:text-xs">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-paper/40">
              A source scan is a starting point. Use the{' '}
              <Link
                href="/lab"
                className="font-semibold text-signal underline underline-offset-2"
              >
                interactive proof lab
              </Link>{' '}
              to inspect a controlled task run.
            </p>
          </section>
        </aside>
      </section>

      {scanning && (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto -mt-8 mb-12 max-w-7xl px-5 lg:px-8"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-signal/20 bg-paper/[.06] p-4 text-sm text-paper/75">
            <span className="size-2 animate-pulse rounded-full bg-signal" />
            Fetching the public page and mapping source evidence. AgentLens does
            not open the page or perform the mission.
          </div>
        </div>
      )}

      {report && (
        <section
          id="agentlens-report"
          aria-labelledby="report-heading"
          className="mx-auto max-w-7xl scroll-mt-8 px-5 pb-20 lg:px-8"
        >
          <div className="overflow-hidden rounded-3xl border border-paper/15 bg-[#f6f6ed] text-ink shadow-[0_32px_100px_rgb(0_0_0/.32)]">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-ink/10 bg-white/45 p-5 sm:p-7">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-signal px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-ink">
                    <BadgeCheck className="size-3" aria-hidden="true" />
                    Source run complete
                  </span>
                  {earnedXp !== null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-ink/70">
                      <Sparkles
                        className="size-3 text-signal-ink"
                        aria-hidden="true"
                      />
                      +{earnedXp} XP
                    </span>
                  )}
                </div>
                <h2
                  id="report-heading"
                  className="mt-4 text-3xl font-semibold tracking-[-.05em] sm:text-4xl"
                >
                  Signal report
                </h2>
                <p className="mt-2 max-w-3xl break-all font-mono text-xs text-ink/50">
                  {report.finalUrl}
                </p>
                {report.goal && (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/75">
                    <span className="font-semibold">Mission brief: </span>
                    {report.goal}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-ink/10 bg-white/70 p-3 pr-4">
                <div
                  className="grid size-14 place-items-center rounded-full p-[3px]"
                  style={{
                    background: `conic-gradient(oklch(0.91 0.23 126) ${scorePercent}%, rgb(25 34 30 / 12%) ${scorePercent}%)`,
                  }}
                >
                  <div className="grid size-full place-items-center rounded-full bg-[#f6f6ed] text-sm font-bold tabular-nums">
                    {score === null || score === undefined
                      ? '—'
                      : Math.round(score)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold">Source actionability</p>
                  <p className="mt-1 text-[10px] text-ink/45">
                    {report.baselineActionability.coverage}% evidence coverage
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-px bg-ink/10 sm:grid-cols-4">
              {[
                [String(report.evidence.length), 'Evidence items'],
                [String(report.actionSurface.length), 'Candidate actions'],
                [String(report.findings.length), 'Source findings'],
                ['Not measured', 'Runtime trials'],
              ].map(([value, label]) => (
                <div key={label} className="bg-[#f6f6ed] p-4 sm:p-5">
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.1fr_.9fr]">
              <div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow text-signal-ink">
                      {selectedLens.label} · {orderedActions.length} candidates
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">
                      Possible action surface
                    </h3>
                  </div>
                  <p className="text-[10px] text-ink/45">
                    Ordered for {selectedLens.name}
                  </p>
                </div>

                {lens === 'guardian' && (
                  <aside className="mt-4 rounded-xl border border-amber-900/15 bg-amber-100/45 p-4">
                    <h3 className="flex items-center gap-2 text-xs font-semibold">
                      <ShieldCheck
                        className="size-4 text-amber-800"
                        aria-hidden="true"
                      />
                      Boundary check
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-ink/60">
                      This run inspected public HTML. It did not execute a live
                      agent task, page JavaScript, or authenticated actions.
                    </p>
                    {report.limitations.length > 0 && (
                      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-ink/55">
                        {report.limitations.slice(0, 3).map((limitation) => (
                          <li key={limitation} className="flex gap-2">
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-800/60" />
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </aside>
                )}

                {orderedActions.length ? (
                  <div className="mt-4 space-y-2">
                    {orderedActions.slice(0, 6).map((action, index) => (
                      <article
                        key={action.id}
                        className="rounded-xl border border-ink/10 bg-white/75 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink text-[10px] font-mono font-semibold text-signal">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div>
                              <h4 className="text-sm font-semibold">
                                {action.name}
                              </h4>
                              <p className="mt-1 text-xs leading-5 text-ink/55">
                                {action.purpose}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full border border-ink/10 px-2 py-1 text-[9px] font-medium text-ink/55">
                            Source candidate
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 pl-10">
                          <span className="rounded-md bg-ink/[.045] px-2 py-1 text-[10px] text-ink/55">
                            {formatRisk(action.risk)}
                          </span>
                          <span className="rounded-md bg-ink/[.045] px-2 py-1 text-[10px] text-ink/55">
                            WebMCP: {formatToolStatus(action.webmcpStatus)}
                          </span>
                          <span className="rounded-md bg-ink/[.045] px-2 py-1 text-[10px] text-ink/55">
                            {action.agentUiConfidence} confidence
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-ink/20 bg-white/50 p-5 text-sm leading-6 text-ink/55">
                    No candidate actions were identified in the captured source.
                    Client-rendered or authenticated controls may not appear in
                    public HTML.
                  </div>
                )}

                {report.evidence.length > 0 && (
                  <details className="mt-4 rounded-xl border border-ink/10 bg-white/55 p-4">
                    <summary className="cursor-pointer text-sm font-semibold marker:text-signal-ink">
                      Open source evidence ({report.evidence.length})
                    </summary>
                    <div className="mt-3 space-y-2">
                      {report.evidence.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg bg-white/80 p-3 text-xs leading-5"
                        >
                          <div className="flex flex-wrap justify-between gap-2">
                            <p className="font-semibold">{item.summary}</p>
                            <span className="font-mono text-[9px] uppercase text-ink/40">
                              {item.source} · {item.confidence}
                            </span>
                          </div>
                          <p className="mt-1 break-words text-ink/55">
                            {item.detail}
                          </p>
                          {item.location && (
                            <p className="mt-1 break-all font-mono text-[10px] text-ink/40">
                              {item.location}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              <div className="space-y-5">
                <section className="rounded-2xl border border-ink/10 bg-white/65 p-5">
                  <div className="flex items-center gap-2">
                    <Flame
                      className="size-4 text-signal-ink"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold">New field badges</h3>
                  </div>
                  {earned.length ? (
                    <div className="mt-4 grid gap-2">
                      {earned.map((id) => {
                        const badge = badgeCatalog.find(
                          (item) => item.id === id,
                        )!;
                        const Icon = badge.icon;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-3 rounded-xl border border-signal-ink/15 bg-signal/10 p-3"
                          >
                            <div className="grid size-9 place-items-center rounded-lg bg-ink text-signal">
                              <Icon className="size-4" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold">
                                {badge.name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-ink/55">
                                {badge.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs leading-5 text-ink/50">
                      You already collected every badge unlocked by this scan. A
                      fresh page may reveal a new signal.
                    </p>
                  )}
                </section>

                {reportOverview && (
                  <section className="rounded-2xl border border-signal-ink/15 bg-signal/10 p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className="size-4 text-signal-ink"
                        aria-hidden="true"
                      />
                      <h3 className="text-sm font-semibold">Mission debrief</h3>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6">
                      {reportOverview.headline}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-ink/60">
                      {reportOverview.nextStep}
                    </p>
                    {reportOverview.issues.slice(0, 2).map((finding) => (
                      <div
                        key={finding.id}
                        className="mt-3 rounded-xl border border-ink/10 bg-white/70 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold">
                            {finding.title}
                          </p>
                          <span className="shrink-0 rounded-full bg-ink/[.05] px-2 py-1 font-mono text-[9px] text-ink/50">
                            {finding.priority}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] leading-5 text-ink/55">
                          {finding.recommendation}
                        </p>
                      </div>
                    ))}
                  </section>
                )}

                <section className="rounded-2xl border border-ink/10 bg-white/65 p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="size-4 text-signal-ink"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold">
                      Recommended next moves
                    </h3>
                  </div>
                  {report.recommendations.length ? (
                    <ol className="mt-3 space-y-3">
                      {report.recommendations.slice(0, 3).map((item, index) => (
                        <li
                          key={`${item.priority}-${item.title}`}
                          className="flex gap-3"
                        >
                          <span className="mt-0.5 font-mono text-[10px] font-semibold text-signal-ink">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="text-xs font-semibold">
                              {item.title}
                            </p>
                            <p className="mt-1 text-[11px] leading-5 text-ink/55">
                              {item.detail}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-3 text-xs leading-5 text-ink/50">
                      No source-level recommendation was generated for this
                      page. Runtime behavior is still unmeasured.
                    </p>
                  )}
                </section>

                {report.limitations.length > 0 && (
                  <details className="rounded-2xl border border-amber-900/10 bg-amber-100/45 p-5">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
                      <ShieldCheck
                        className="size-4 text-amber-800"
                        aria-hidden="true"
                      />
                      Read the scan boundaries
                    </summary>
                    <ul className="mt-3 space-y-2 text-xs leading-5 text-ink/60">
                      {report.limitations.map((limitation) => (
                        <li key={limitation} className="flex gap-2">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-800/60" />
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-white/45 px-5 py-4 sm:px-7">
              <p className="max-w-2xl text-[11px] leading-5 text-ink/50">
                Public-source evidence only. This scan did not run an AI agent,
                execute page JavaScript, or verify that the mission succeeds.
                Score and findings describe the captured source.
              </p>
              <button
                type="button"
                onClick={() => {
                  setReport(null);
                  setEarned([]);
                  setEarnedXp(null);
                  document
                    .getElementById('mission-heading')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
              >
                Plan another scan{' '}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="grid gap-4 border-t border-paper/10 pt-7 sm:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Observe',
              text: 'Read one bounded public HTML response.',
              icon: Eye,
            },
            {
              step: '02',
              title: 'Map',
              text: 'Inspect source hints and candidate actions.',
              icon: Map,
            },
            {
              step: '03',
              title: 'Improve',
              text: 'Take evidence into your own build workflow.',
              icon: Sparkles,
            },
          ].map(({ step, title, text, icon: Icon }) => (
            <article
              key={step}
              className="rounded-2xl border border-paper/10 bg-paper/[.035] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-signal">
                  {step}
                </span>
                <Icon className="size-4 text-paper/50" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-sm font-semibold">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-paper/50">{text}</p>
            </article>
          ))}
        </div>
        <p className="mt-5 text-center text-[10px] leading-5 text-paper/35">
          WebMCP is experimental. Source hints are not runtime proof, agent
          execution, or certification.
        </p>
      </section>
    </main>
  );
}
