'use client';

import {
  ArrowRight,
  CircleAlert,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';

import { useApp } from '@/components/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeScanUrlInput, parseScanApiResponse } from '@/lib/scan-client';

export function QuickScanForm() {
  const router = useRouter();
  const {
    scanDraft,
    setScanDraft,
    scanLoading,
    scanStage,
    scanError,
    scanErrorStage,
    scanErrorRetryable,
    runScan,
    setCurrentReport,
    webmcpAvailable,
  } = useApp();
  const [localError, setLocalError] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  const attemptScan = async () => {
    setLocalError(null);
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeScanUrlInput(scanDraft.url);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Enter a public website, such as example.com.',
      );
      return;
    }
    setScanDraft({ ...scanDraft, url: normalizedUrl });
    try {
      await runScan(normalizedUrl, scanDraft.goal);
    } catch {
      // The shared state presents the safe server error.
    }
  };

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    await attemptScan();
  };

  const loadingLabel =
    scanStage === 'processing'
      ? 'Building evidence report…'
      : scanStage === 'connecting'
        ? 'Preparing secure request…'
        : 'Fetching bounded source…';
  const errorStageLabel = localError
    ? 'Address check'
    : scanErrorStage === 'fetch'
      ? 'Public-source fetch'
      : scanErrorStage === 'response'
        ? 'Report processing'
        : 'Scanner request';

  const openSample = async () => {
    setSampleLoading(true);
    setLocalError(null);
    try {
      const response = await fetch('/api/scans/demo', { method: 'POST' });
      const payload = await parseScanApiResponse(response);
      setCurrentReport(payload);
      router.push(`/reports/${payload.id}`);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'The sample report could not be created.',
      );
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <div className="instrument-card relative overflow-hidden p-5 sm:p-7">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-signal"
        aria-hidden="true"
      />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Source Opportunity Scan</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Map a public page’s action surface
          </h2>
        </div>
        <span className="status-chip">
          <span className="size-1.5 rounded-full bg-signal" />
          Source only
        </span>
      </div>
      <form className="space-y-5" onSubmit={submit} noValidate>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="url">
            Public URL
          </label>
          <Input
            id="url"
            name="url"
            type="url"
            required
            autoComplete="url"
            inputMode="url"
            maxLength={2_048}
            value={scanDraft.url}
            onChange={(event) => {
              setLocalError(null);
              setScanDraft({ ...scanDraft, url: event.target.value });
            }}
            placeholder="your-app.com or https://your-app.com"
            aria-describedby="url-help scan-trust scan-error"
            aria-invalid={Boolean(localError || scanError)}
            className="h-12 rounded-lg border-border bg-card px-4 text-base shadow-none"
          />
          <p id="url-help" className="mt-1.5 text-xs text-muted-foreground">
            A missing scheme is safely normalized to HTTPS.
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="goal">
            What should an agent accomplish?{' '}
            <span className="font-normal text-muted-foreground">Optional</span>
          </label>
          <Input
            id="goal"
            name="goal"
            maxLength={300}
            value={scanDraft.goal}
            onChange={(event) =>
              setScanDraft({ ...scanDraft, goal: event.target.value })
            }
            placeholder="e.g. Find and compare the best plan"
            className="h-12 rounded-lg border-border bg-card px-4 text-base shadow-none"
          />
          <p className="mt-1.5 text-right font-mono text-[10px] text-muted-foreground">
            {scanDraft.goal.length}/300
          </p>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={scanLoading}
          className="h-12 w-full rounded-lg bg-foreground text-background hover:bg-foreground/85"
        >
          {scanLoading ? (
            <>
              <LoaderCircle className="animate-spin" data-icon="inline-start" />{' '}
              {loadingLabel}
            </>
          ) : (
            <>
              Map this page <ArrowRight data-icon="inline-end" />
            </>
          )}
        </Button>
      </form>

      <div id="scan-error" aria-live="polite" aria-atomic="true">
        {(localError || scanError) && (
          <div
            className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
            role="alert"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-wider">
                {errorStageLabel} failed
              </p>
              <p>{localError || scanError}</p>
              {scanError && scanErrorRetryable && (
                <button
                  type="button"
                  className="mt-2 font-semibold underline underline-offset-4"
                  onClick={() => void attemptScan()}
                  disabled={scanLoading}
                >
                  Retry scan
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div id="scan-trust" className="mt-5 border-t border-border pt-5">
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <LockKeyhole
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          The scan fetches only the public page you provide. It does not sign
          in, execute the target&apos;s JavaScript, or use your browser cookies.
          Do not paste signed or secret-bearing URLs; query values are not
          retained in reports.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
            onClick={() => void openSample()}
            disabled={sampleLoading}
          >
            <FlaskConical className="size-3.5" aria-hidden="true" />
            {sampleLoading
              ? 'Creating sample report…'
              : 'Open sample evidence report'}
          </button>
          <span className="text-[11px] text-muted-foreground">
            Site tools:{' '}
            {webmcpAvailable
              ? 'available in this browser'
              : 'graceful fallback active'}
          </span>
        </div>
      </div>
    </div>
  );
}
