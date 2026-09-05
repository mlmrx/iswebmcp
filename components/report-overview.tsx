'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clipboard, Download } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { summarizeReport } from '@/lib/integrations/report-summary';
import {
  baselineExportBlocker,
  buildReportOverview,
} from '@/lib/report-overview';
import type { ScanReport } from '@/lib/types';

export function ReportOverview({ report }: { report: ScanReport }) {
  const overview = buildReportOverview(report);
  const blocker = baselineExportBlocker(report);
  const [message, setMessage] = useState('');
  const { setScanDraft } = useApp();
  const router = useRouter();
  const exportBaseline = () => {
    if (blocker) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(summarizeReport(report), null, 2)], {
        type: 'application/json',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `iswebmcp-baseline-${report.id}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setMessage(
      'CI baseline downloaded. Review its existing findings before adopting it; a baseline is not a clean bill of health.',
    );
  };
  const copyBrief = async () => {
    const lines = [
      report.finalUrl,
      overview.headline,
      'Scope: public source only; runtime and agent success are not verified.',
      ...overview.issues
        .slice(0, 3)
        .flatMap((finding) => [
          finding.title,
          finding.whyItMatters,
          finding.recommendation,
          ...report.evidence
            .filter((item) => finding.evidenceIds.includes(item.id))
            .map((item) => `${item.source}: ${item.summary} — ${item.detail}`),
        ]),
      `Next step: ${overview.nextStep}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n\n'));
      setMessage(
        'Implementation brief copied. Review the evidence before making changes.',
      );
    } catch {
      setMessage(
        'Clipboard access is unavailable. You can select the findings below or download the full report JSON.',
      );
    }
  };
  return (
    <section
      aria-labelledby="takeaway-heading"
      className="rounded-2xl border border-border bg-card p-5 sm:p-8"
    >
      <p className="eyebrow text-signal-ink">Your next step</p>
      <h2
        id="takeaway-heading"
        className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {overview.headline}
      </h2>
      <p className="mt-4 max-w-4xl text-lg leading-8">{overview.nextStep}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {report.reportKind === 'synthetic_fixture'
          ? 'Illustrative sample, not a website observation. '
          : 'Public-source evidence only. '}
        {report.response.truncated
          ? 'Findings describe the captured portion, not the complete page. '
          : ''}
        Runtime behavior and agent task success are not verified.{' '}
        {report.importedProof
          ? 'Imported contract findings are separate and not independently verified.'
          : ''}
      </p>
      {overview.actions.length > 0 && (
        <div
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Source-inferred candidate actions"
        >
          {overview.actions.map((action) => (
            <span
              key={action.id}
              className="rounded-full border border-border px-3 py-1.5 text-sm"
            >
              {action.name}{' '}
              <span className="text-muted-foreground">· candidate</span>
            </span>
          ))}
        </div>
      )}
      {overview.issues.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {overview.issues.slice(0, 3).map((finding) => (
            <article
              key={finding.id}
              className="rounded-xl border border-border p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Observed source issue · {finding.priority}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{finding.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {finding.whyItMatters}
              </p>
              <p className="mt-3 text-sm font-medium leading-6">
                {finding.recommendation}
              </p>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-signal-ink">
                  Inspect supporting evidence
                </summary>
                {report.evidence
                  .filter((item) => finding.evidenceIds.includes(item.id))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="mt-3 rounded-lg bg-muted/50 p-3 text-sm leading-6"
                    >
                      <p className="font-medium">{item.summary}</p>
                      <p className="break-words text-muted-foreground">
                        {item.detail}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.source} · {item.confidence} confidence
                      </p>
                    </div>
                  ))}
              </details>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm leading-6">
          No failing or partial source-UI or transport finding was reported.
          This does not mean the page is defect-free. Missing runtime evidence
          is a verification gap, not a failed test.
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setScanDraft({
              url:
                report.reportKind === 'synthetic_fixture'
                  ? ''
                  : report.normalizedUrl,
              goal:
                report.reportKind === 'synthetic_fixture'
                  ? ''
                  : (report.goal ?? ''),
            });
            router.push('/#audit');
          }}
        >
          {report.reportKind === 'synthetic_fixture'
            ? 'Check your own website'
            : 'Review URL and check again'}{' '}
          <ArrowRight data-icon="inline-end" />
        </Button>
        <Button variant="outline" onClick={() => void copyBrief()}>
          <Clipboard data-icon="inline-start" />
          Copy implementation brief
        </Button>
        <Button
          variant="outline"
          onClick={exportBaseline}
          disabled={Boolean(blocker)}
          aria-describedby="baseline-guidance"
        >
          <Download data-icon="inline-start" />
          Export CI baseline
        </Button>
      </div>
      <p
        id="baseline-guidance"
        className="mt-4 text-xs leading-6 text-muted-foreground"
      >
        {blocker ??
          'Export format: summary/v2 for toolkit 0.2+. Keep the same requested URL, query settings, goal and scoring model for comparisons. Queries are omitted from displayed URLs; restore the original settings before rescanning. Reports are temporary, so save your evidence locally.'}
      </p>
      <Link
        href="/developers"
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-signal-ink"
      >
        Add this check to your development workflow{' '}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <output className="mt-3 block text-sm leading-6" aria-live="polite">
        {message}
      </output>
    </section>
  );
}
