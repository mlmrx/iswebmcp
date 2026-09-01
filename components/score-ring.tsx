import type { CSSProperties } from 'react';

export function ScoreRing({
  value,
  label,
  detail,
  tone = 'signal',
}: {
  value: number | null;
  label: string;
  detail: string;
  tone?: 'signal' | 'neutral' | 'muted';
}) {
  const score = value ?? 0;
  const color =
    tone === 'signal'
      ? 'oklch(0.82 0.22 126)'
      : tone === 'neutral'
        ? 'oklch(0.62 0.11 238)'
        : 'oklch(0.76 0.015 108)';
  const style = {
    background: `conic-gradient(${color} ${score * 3.6}deg, color-mix(in oklch, var(--border) 72%, transparent) 0deg)`,
  } satisfies CSSProperties;

  return (
    <article
      className="metric-card"
      aria-label={`${label}: ${value === null ? 'not available' : `${value} out of 100`}`}
    >
      <div
        className="grid size-24 shrink-0 place-items-center rounded-full p-[7px]"
        style={style}
        aria-hidden="true"
      >
        <div className="grid size-full place-items-center rounded-full bg-card">
          <div className="text-center">
            <span className="block text-2xl font-semibold tabular-nums">
              {value ?? '—'}
            </span>
            {value !== null && (
              <span className="block font-mono text-[9px] uppercase text-muted-foreground">
                / 100
              </span>
            )}
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold">{label}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {detail}
        </p>
      </div>
    </article>
  );
}
