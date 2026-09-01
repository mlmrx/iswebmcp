import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock3, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  formatContentDate,
  getLearningArticle,
  getRelatedArticles,
  learningArticles,
} from '@/lib/content';
import { siteOrigin } from '@/lib/site-origin';

export const dynamicParams = false;

export function generateStaticParams() {
  return learningArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) return { title: 'Resource not found' };
  return {
    title: article.title,
    description: article.dek,
    alternates: { canonical: `/learn/${article.slug}` },
    openGraph: {
      title: `${article.title} · isWebMCP`,
      description: article.dek,
      type: 'article',
      url: `/learn/${article.slug}`,
      publishedTime: `${article.publishedAt}T12:00:00Z`,
      modifiedTime: `${article.updatedAt}T12:00:00Z`,
      images: [],
    },
    twitter: {
      card: 'summary',
      title: `${article.title} · isWebMCP`,
      description: article.dek,
      images: [],
    },
  };
}

export default async function LearningArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) notFound();
  const related = getRelatedArticles(article);
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': article.kind === 'how-to' ? 'HowTo' : 'Article',
    headline: article.title,
    description: article.dek,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Organization', name: 'isWebMCP' },
    publisher: { '@type': 'Organization', name: 'isWebMCP' },
    mainEntityOfPage: `${siteOrigin}/learn/${article.slug}`,
    citation: article.sources.map((source) => source.url),
    ...(article.kind === 'how-to'
      ? {
          step: article.sections.map((section) => ({
            '@type': 'HowToStep',
            name: section.heading,
            text: section.paragraphs.join(' '),
            url: `${siteOrigin}/learn/${article.slug}#${section.id}`,
          })),
        }
      : {}),
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background pb-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <article>
        <header className="border-b border-border">
          <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              href="/learn"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Learning
              center
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="source-badge">
                {article.kind.replace('-', ' ')}
              </span>
              <span className="status-chip">
                <Clock3 className="size-3" aria-hidden="true" />{' '}
                {article.minutes} min read
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                Reviewed {formatContentDate(article.updatedAt)}
              </span>
            </div>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">
              {article.title}
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-muted-foreground">
              {article.dek}
            </p>
            <p className="mt-7 max-w-3xl rounded-xl border border-signal/35 bg-signal/8 p-5 leading-7">
              <span className="font-semibold">The short version:</span>{' '}
              {article.takeaway}
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
          <aside
            className="lg:sticky lg:top-24 lg:self-start"
            aria-label="Article contents"
          >
            <p className="eyebrow">In this guide</p>
            <ol className="mt-4 space-y-3 border-l border-border pl-4 text-sm text-muted-foreground">
              {article.sections.map((section) => (
                <li key={section.id}>
                  <a className="hover:text-foreground" href={`#${section.id}`}>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-7 text-xs leading-5 text-muted-foreground">
              For {article.audience.toLocaleLowerCase()}.
            </p>
          </aside>

          <div className="min-w-0 space-y-12">
            {article.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24"
              >
                <h2 className="text-3xl font-semibold tracking-[-.04em]">
                  {section.heading}
                </h2>
                <div className="mt-5 space-y-4 text-[1.03rem] leading-8 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-5 space-y-3 rounded-xl border border-border bg-card p-5 text-sm leading-6">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span
                          className="font-mono text-signal-ink"
                          aria-hidden="true"
                        >
                          →
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.code ? (
                  <pre className="mt-5 overflow-x-auto rounded-xl bg-ink p-5 text-sm leading-6 text-paper shadow-xl">
                    <code>{section.code}</code>
                  </pre>
                ) : null}
                {section.note ? (
                  <p className="mt-5 border-l-2 border-signal-ink pl-4 text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Evidence note.
                    </span>{' '}
                    {section.note}
                  </p>
                ) : null}
              </section>
            ))}

            <section
              className="border-t border-border pt-8"
              aria-labelledby="sources-heading"
            >
              <p className="eyebrow">Primary references</p>
              <h2 id="sources-heading" className="mt-2 text-2xl font-semibold">
                Read the sources
              </h2>
              <ul className="mt-5 space-y-3">
                {article.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:border-foreground/30"
                      href={source.url}
                    >
                      <span>
                        <span className="font-semibold">{source.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {source.publisher}
                        </span>
                      </span>
                      <ExternalLink
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <div className="rounded-xl bg-ink p-6 text-paper sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="eyebrow text-signal">Put it to work</p>
                <p className="mt-2 font-semibold">
                  Use the guide on a real product surface.
                </p>
              </div>
              <Button
                nativeButton={false}
                className="mt-5 bg-signal text-ink hover:bg-signal/85 sm:mt-0"
                render={<Link href={article.cta.href} />}
              >
                {article.cta.label} <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </article>

      <section
        className="mx-auto max-w-5xl border-t border-border px-5 pt-10 lg:px-8"
        aria-labelledby="related-heading"
      >
        <h2 id="related-heading" className="text-2xl font-semibold">
          Continue learning
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.slug}
              className="instrument-card group p-5"
              href={`/learn/${item.slug}`}
            >
              <span className="source-badge">
                {item.kind.replace('-', ' ')}
              </span>
              <span className="mt-5 block font-semibold">{item.title}</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                Read next <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
