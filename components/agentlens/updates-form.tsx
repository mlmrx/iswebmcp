'use client';

import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, type SubmitEvent } from 'react';

type SignupResponse = { ok?: boolean; error?: { message?: string } };

export function AgentLensUpdatesForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/agentlens/interest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, consent, website: '' }),
      });
      const payload = (await response.json()) as SignupResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error?.message ??
            'Signup could not be saved. Please try again.',
        );
      }

      setEmail('');
      setConsent(false);
      setFeedback({
        kind: 'success',
        message: 'You’re on the AgentLens update list. Thanks for opting in.',
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Signup could not be saved. Please try again later.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="agentlens-updates-title"
      className="mx-auto mb-16 grid max-w-7xl gap-7 rounded-3xl border border-signal/20 bg-gradient-to-br from-[#1e2926] via-[#19211f] to-[#151a19] p-6 shadow-[0_24px_80px_rgb(0_0_0/.18)] sm:p-8 lg:grid-cols-[1fr_.88fr] lg:items-center lg:px-10"
    >
      <div>
        <p className="eyebrow text-signal">A small signal · AgentLens</p>
        <h2
          id="agentlens-updates-title"
          className="mt-3 max-w-xl text-2xl font-semibold tracking-[-.04em] sm:text-3xl"
        >
          Stay close to what agents learn next.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-paper/60">
          Get occasional AgentLens product notes as trace replay and readiness
          evidence evolve. Your scan stays on this page; we won’t email its URL,
          goal, or results.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label
            htmlFor="agentlens-updates-email"
            className="mb-2 block text-xs font-semibold text-paper/80"
          >
            Work email
          </label>
          <div className="flex min-h-12 items-center gap-3 rounded-xl border border-paper/15 bg-black/20 px-4 transition focus-within:border-signal/60 focus-within:ring-2 focus-within:ring-signal/20">
            <Mail
              className="size-4 shrink-0 text-paper/40"
              aria-hidden="true"
            />
            <input
              id="agentlens-updates-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-paper outline-none placeholder:text-paper/30"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-paper/55">
          <input
            type="checkbox"
            name="consent"
            required
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-[#82e6b0]"
          />
          <span>
            Send me occasional AgentLens product updates. I can ask to be
            removed at any time. See the{' '}
            <Link
              href="/privacy"
              className="font-semibold text-paper/80 underline decoration-paper/30 underline-offset-2 hover:text-signal"
            >
              privacy details
            </Link>
            .
          </span>
        </label>

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[10000px] size-px overflow-hidden"
        />

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-ink transition hover:bg-[#a7f2c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {pending ? 'Saving…' : 'Get AgentLens updates'}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>

        <p className="flex items-start gap-2 text-[11px] leading-5 text-paper/40">
          <ShieldCheck
            className="mt-0.5 size-3.5 shrink-0 text-signal/70"
            aria-hidden="true"
          />
          Optional. Email only; entries older than 12 months are cleared during
          later signups. To opt out or request deletion, use the{' '}
          <Link className="underline underline-offset-2" href="/support">
            support contact
          </Link>
          .
        </p>
        <p
          aria-live="polite"
          role={feedback?.kind === 'error' ? 'alert' : 'status'}
          className={`min-h-5 text-xs ${feedback?.kind === 'error' ? 'text-rose-300' : 'text-signal'}`}
        >
          {feedback?.message ?? ''}
        </p>
      </form>
    </section>
  );
}
