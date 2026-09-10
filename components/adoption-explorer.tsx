'use client';

import { ArrowUpRight, Search, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';

import type {
  AdoptionEvidenceLevel,
  AdoptionFinding,
  AdoptionSurfaceStatus,
} from '@/lib/adoption';

const evidenceLabels: Record<AdoptionEvidenceLevel, string> = {
  'runtime-verified': 'Runtime verified',
  'source-confirmed': 'Source confirmed',
  'third-party-observed': 'Third-party observed',
  announced: 'Announced',
};

const surfaceLabels: Record<AdoptionSurfaceStatus, string> = {
  current: 'Current API',
  legacy: 'Legacy API',
  mixed: 'Mixed API',
  unknown: 'Unknown API',
};

export function AdoptionExplorer({
  findings,
}: {
  findings: AdoptionFinding[];
}) {
  const [query, setQuery] = useState('');
  const [evidence, setEvidence] = useState<'all' | AdoptionEvidenceLevel>(
    'all',
  );
  const [surface, setSurface] = useState<'all' | AdoptionSurfaceStatus>('all');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return findings.filter((finding) => {
      if (evidence !== 'all' && finding.evidenceLevel !== evidence)
        return false;
      if (surface !== 'all' && finding.surfaceStatus !== surface) return false;
      if (!normalized) return true;
      const haystack = [
        finding.organization,
        finding.category,
        finding.implementation,
        finding.summary,
        ...finding.tools.flatMap((tool) => [tool.name, tool.purpose]),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [evidence, findings, query, surface]);

  return (
    <section aria-labelledby="inventory-heading">
      <div className="grid gap-6 lg:grid-cols-[.5fr_1.5fr]">
        <div>
          <p className="eyebrow">Implementation inventory</p>
          <h2
            id="inventory-heading"
            className="mt-2 text-3xl font-semibold tracking-[-.04em]"
          >
            Who implemented what
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Filter the evidence ledger by organization, tool, verification
            level, or API generation. Unknown means unverified—not absent.
          </p>
        </div>
        <div>
          <div className="instrument-card grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search organizations and tools</span>
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search organization or tool"
                type="search"
                value={query}
              />
            </label>
            <label>
              <span className="sr-only">Filter by evidence</span>
              <select
                className="h-11 min-w-44 rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) =>
                  setEvidence(event.target.value as typeof evidence)
                }
                value={evidence}
              >
                <option value="all">All evidence</option>
                <option value="runtime-verified">Runtime verified</option>
                <option value="source-confirmed">Source confirmed</option>
                <option value="third-party-observed">
                  Third-party observed
                </option>
                <option value="announced">Announced</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by API surface</span>
              <select
                className="h-11 min-w-40 rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(event) =>
                  setSurface(event.target.value as typeof surface)
                }
                value={surface}
              >
                <option value="all">All API states</option>
                <option value="current">Current API</option>
                <option value="legacy">Legacy API</option>
                <option value="mixed">Mixed API</option>
                <option value="unknown">Unknown API</option>
              </select>
            </label>
          </div>

          <p
            className="my-4 font-mono text-xs text-muted-foreground"
            aria-live="polite"
          >
            {filtered.length} of {findings.length} organizations shown
          </p>

          <div className="space-y-4">
            {filtered.map((finding) => (
              <article
                id={finding.slug}
                key={finding.slug}
                className="instrument-card scroll-mt-24 overflow-hidden"
              >
                <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="source-badge">
                        {evidenceLabels[finding.evidenceLevel]}
                      </span>
                      <span className="source-badge">
                        {surfaceLabels[finding.surfaceStatus]}
                      </span>
                      <span className="source-badge">
                        {finding.attribution.replace('-', ' ')}
                      </span>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold tracking-[-.035em]">
                      {finding.organization}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-signal-ink">
                      {finding.implementation}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {finding.summary}
                    </p>
                  </div>
                  <div className="min-w-28 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <p className="text-4xl font-semibold tracking-[-.06em]">
                      {finding.tools.length || '—'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      named tools
                    </p>
                    <p className="mt-5 text-lg font-semibold">
                      {finding.deploymentCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      reported{' '}
                      {finding.deploymentCount === 1
                        ? 'property'
                        : 'properties'}
                    </p>
                  </div>
                </div>

                <details className="border-t border-border bg-muted/25 px-5 py-4 sm:px-6">
                  <summary className="cursor-pointer font-semibold">
                    Tools, sources, and limits
                  </summary>
                  <div className="mt-5 grid gap-7 lg:grid-cols-2">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-semibold">
                        <Wrench className="size-4" aria-hidden="true" /> Tool
                        inventory
                      </h4>
                      {finding.tools.length ? (
                        <ul className="mt-3 space-y-3">
                          {finding.tools.map((tool) => (
                            <li key={tool.name} className="text-sm">
                              <code className="font-mono text-xs font-semibold text-foreground">
                                {tool.name}
                              </code>
                              <p className="mt-1 leading-6 text-muted-foreground">
                                {tool.purpose}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          Exact tool names remain unverified.
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Evidence trail</h4>
                      <ul className="mt-3 space-y-3">
                        {finding.sources.map((source) => (
                          <li key={`${finding.slug}-${source.url}`}>
                            <a
                              className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-border underline-offset-4"
                              href={source.url}
                            >
                              {source.name}{' '}
                              <ArrowUpRight
                                className="size-3"
                                aria-hidden="true"
                              />
                            </a>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {source.supports}
                            </p>
                          </li>
                        ))}
                      </ul>
                      <h4 className="mt-6 text-sm font-semibold">Limits</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
                        {finding.limitations.map((limitation) => (
                          <li key={limitation}>{limitation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </article>
            ))}
            {!filtered.length && (
              <div className="instrument-card p-8 text-center text-sm text-muted-foreground">
                No evidence records match these filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
