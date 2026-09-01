import type { Metadata } from 'next';
import { ArrowRight, CircleHelp } from 'lucide-react';
import Link from 'next/link';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { frequentlyAskedQuestions } from '@/lib/content';

export const metadata: Metadata = {
  title: 'WebMCP FAQ',
  description:
    'Direct answers about WebMCP, MCP, browser support, implementation, testing, security, and the WebMCP Challenge.',
  alternates: { canonical: '/faq' },
};

const categories = [
  'Fundamentals',
  'Building',
  'Testing',
  'Security',
  'Challenge',
] as const;

export default function FaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: frequentlyAskedQuestions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
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
          __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
          <span className="status-chip">
            <CircleHelp className="size-3" aria-hidden="true" />{' '}
            {frequentlyAskedQuestions.length} answers
          </span>
          <p className="eyebrow mt-8 text-signal-ink">WebMCP FAQ</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-semibold tracking-[-.055em] sm:text-6xl">
            The questions people ask before they ship.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Concise answers, explicit status dates, and no attempt to turn an
            experimental API into a finished standard.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-5 py-10 lg:px-8">
        {categories.map((category) => {
          const items = frequentlyAskedQuestions.filter(
            (item) => item.category === category,
          );
          return (
            <section
              key={category}
              aria-labelledby={`faq-${category.toLocaleLowerCase()}`}
            >
              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div>
                  <p className="eyebrow">
                    {String(categories.indexOf(category) + 1).padStart(2, '0')}
                  </p>
                  <h2
                    id={`faq-${category.toLocaleLowerCase()}`}
                    className="mt-2 text-2xl font-semibold"
                  >
                    {category}
                  </h2>
                </div>
                <Accordion className="instrument-card px-5" multiple>
                  {items.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="py-4 text-base">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-5 pr-8 text-sm leading-7 text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
          );
        })}

        <section className="rounded-xl bg-ink p-7 text-paper sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <p className="eyebrow text-signal">Need the full argument?</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Move from the answer to the implementation.
            </h2>
          </div>
          <Button
            nativeButton={false}
            className="mt-5 bg-signal text-ink hover:bg-signal/85 sm:mt-0"
            render={<Link href="/learn" />}
          >
            Open the learning center <ArrowRight data-icon="inline-end" />
          </Button>
        </section>
      </div>
    </main>
  );
}
