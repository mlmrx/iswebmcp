'use client';

import { ArrowRight, Clock3, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import type { ContentKind } from '@/lib/content';

export interface ContentExplorerItem {
  slug: string;
  title: string;
  dek: string;
  kind: ContentKind;
  minutes: number;
  tags: string[];
}

const kindLabels: Record<ContentKind, string> = {
  explainer: 'Explainer',
  'how-to': 'How-to',
  architecture: 'Architecture',
  testing: 'Testing',
  security: 'Security',
  'field-guide': 'Field guide',
};

export function ContentExplorer({ items }: { items: ContentExplorerItem[] }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | ContentKind>('all');
  const results = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      if (kind !== 'all' && item.kind !== kind) return false;
      if (!terms.length) return true;
      const haystack = [item.title, item.dek, item.kind, ...item.tags]
        .join(' ')
        .toLocaleLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [items, kind, query]);

  return (
    <section aria-labelledby="library-heading">
      <div className="grid gap-6 lg:grid-cols-[.62fr_1.38fr] lg:items-end">
        <div>
          <p className="eyebrow text-signal-ink">Evergreen library</p>
          <h2
            id="library-heading"
            className="mt-3 text-4xl font-semibold tracking-[-.05em]"
          >
            Learn the system, then build it.
          </h2>
        </div>
        <div className="instrument-card grid gap-3 p-4 sm:grid-cols-[1fr_190px]">
          <label
            className="grid gap-2 text-xs font-semibold"
            htmlFor="content-search"
          >
            Search the library
            <span className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="content-search"
                className="h-10 pl-9"
                type="search"
                placeholder="Schemas, security, testing…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </span>
          </label>
          <label
            className="grid gap-2 text-xs font-semibold"
            htmlFor="content-kind"
          >
            Format
            <NativeSelect
              id="content-kind"
              className="w-full [&_[data-slot=native-select]]:h-10"
              size="default"
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as 'all' | ContentKind)
              }
            >
              <NativeSelectOption value="all">All formats</NativeSelectOption>
              {Object.entries(kindLabels).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>
      </div>

      <p
        className="mt-6 font-mono text-xs text-muted-foreground"
        aria-live="polite"
      >
        {results.length} of {items.length} resources
      </p>
      {results.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <article
              key={item.slug}
              className="instrument-card group relative flex min-h-64 flex-col p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="source-badge">{kindLabels[item.kind]}</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                  <Clock3 className="size-3" aria-hidden="true" />{' '}
                  {item.minutes} min
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-[-.025em]">
                <Link
                  className="outline-none after:absolute after:inset-0 focus-visible:underline"
                  href={`/learn/${item.slug}`}
                >
                  {item.title}
                </Link>
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                {item.dek}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-signal-ink">
                Read resource
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="instrument-card mt-4 p-8 text-center">
          <p className="font-semibold">No exact match yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a broader phrase or switch back to all formats.
          </p>
        </div>
      )}
    </section>
  );
}
