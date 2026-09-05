import type { ScanReport } from '@/lib/types';

/** Presentation only: no new scoring, inferred defects, or runtime claims. */
export function buildReportOverview(report: ScanReport) {
  const actions = report.actionSurface.filter(
    (action) => action.humanUiAvailable,
  );
  const issues = report.findings
    .filter(
      (finding) =>
        ['partial', 'fail'].includes(finding.status) &&
        !['EVIDENCE_RUNTIME_BOUNDARY', 'WEBMCP_CONTRACT_PROOF'].includes(
          finding.ruleId,
        ) &&
        finding.evidenceIds.some((id) =>
          report.evidence.some(
            (evidence) => evidence.id === id && evidence.source === 'source',
          ),
        ),
    )
    .sort(
      (a, b) =>
        a.priority.localeCompare(b.priority) ||
        ['blocker', 'high', 'medium', 'low', 'info'].indexOf(a.severity) -
          ['blocker', 'high', 'medium', 'low', 'info'].indexOf(b.severity),
    );
  const headline = report.response.truncated
    ? 'Only part of this page could be assessed.'
    : issues.length
      ? `${issues.length} source-level ${issues.length === 1 ? 'issue' : 'issues'} to review.`
      : actions.length
        ? `${actions.length} candidate ${actions.length === 1 ? 'action found' : 'actions found'} in the page source.`
        : 'No task-oriented controls were identified in this source.';
  const nextStep =
    issues[0]?.recommendation ??
    (actions.length
      ? 'Choose one candidate action and verify its outcome in the running page. Source evidence alone cannot establish task success.'
      : 'Check that this is the page containing your workflow. Client-rendered or signed-in controls may be absent from a public-source scan.');
  return { headline, nextStep, issues, actions };
}

export function baselineExportBlocker(report: ScanReport): string | null {
  if (report.reportKind !== 'observed_source')
    return 'Sample reports are illustrative. Scan your own public page to create a CI baseline.';
  if (report.importedProof)
    return 'This derived report includes imported contracts. Use a fresh source-only scan for a CI baseline.';
  if (report.response.truncated)
    return 'Partial source collection cannot be used as a CI baseline.';
  if (!report.comparisonContext || !report.baselineActionability.modelVersion)
    return 'This older report lacks comparison metadata. Run a fresh source scan.';
  return null;
}
