import type { ScanReport } from '@/lib/types';

interface StoreState {
  reports: Map<string, { report: ScanReport; expiresAt: number }>;
  rateLimits: Map<string, number[]>;
  activeScans: number;
}

const shared = globalThis as typeof globalThis & {
  __iswebmcpStore?: StoreState;
};

const store: StoreState =
  shared.__iswebmcpStore ??
  (shared.__iswebmcpStore = {
    reports: new Map(),
    rateLimits: new Map(),
    activeScans: 0,
  });

const REPORT_TTL_MS = 15 * 60 * 1000;
const RATE_WINDOW_MAX_MS = 60 * 60 * 1000;
const MAX_REPORTS = 250;
const MAX_RATE_LIMIT_KEYS = 1_000;

function prune(now = Date.now()) {
  for (const [id, record] of store.reports) {
    if (record.expiresAt <= now) store.reports.delete(id);
  }
  for (const [key, timestamps] of store.rateLimits) {
    const active = timestamps.filter(
      (timestamp) => timestamp > now - RATE_WINDOW_MAX_MS,
    );
    if (active.length) store.rateLimits.set(key, active);
    else store.rateLimits.delete(key);
  }
  while (store.reports.size >= MAX_REPORTS) {
    const oldest = store.reports.keys().next().value as string | undefined;
    if (!oldest) break;
    store.reports.delete(oldest);
  }
  while (store.rateLimits.size >= MAX_RATE_LIMIT_KEYS) {
    const oldest = store.rateLimits.keys().next().value as string | undefined;
    if (!oldest) break;
    store.rateLimits.delete(oldest);
  }
}

export function putReport(report: ScanReport) {
  prune();
  store.reports.set(report.id, {
    report,
    expiresAt: Date.now() + REPORT_TTL_MS,
  });
}

export function getReport(id: string): ScanReport | null {
  const record = store.reports.get(id);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    store.reports.delete(id);
    return null;
  }
  return record.report;
}

export function allowRequest(
  key: string,
  limit = 8,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  prune(now);
  const active = (store.rateLimits.get(key) ?? []).filter(
    (timestamp) => timestamp > now - windowMs,
  );
  if (active.length >= limit) {
    store.rateLimits.set(key, active);
    return false;
  }
  active.push(now);
  store.rateLimits.set(key, active);
  return true;
}

export function acquireScanSlot(limit = 6): (() => void) | null {
  if (store.activeScans >= limit) return null;
  store.activeScans += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    store.activeScans = Math.max(0, store.activeScans - 1);
  };
}
