'use client';

import { Braces, CheckCircle2, FileInput, FileOutput } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';

import type { DemoToolContract } from '@/lib/demos';
import { cn } from '@/lib/utils';

type PreviewMode = 'contract' | 'input' | 'result';

const previewLabels: Array<{
  id: PreviewMode;
  label: string;
  icon: typeof Braces;
}> = [
  { id: 'contract', label: 'Contract', icon: Braces },
  { id: 'input', label: 'Example input', icon: FileInput },
  { id: 'result', label: 'Example result', icon: FileOutput },
];

export function ContractPreview({ contract }: { contract: DemoToolContract }) {
  const [mode, setMode] = useState<PreviewMode>('contract');
  const tabSetId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const previewFor = (previewMode: PreviewMode) => {
    if (previewMode === 'input') return contract.exampleInput;
    if (previewMode === 'result') return contract.exampleResult;
    return {
      name: contract.name,
      title: contract.title,
      description: contract.description,
      inputSchema: contract.inputSchema,
      annotations: contract.annotations,
    };
  };

  const selectAndFocus = (index: number) => {
    const next = previewLabels[index];
    if (!next) return;
    setMode(next.id);
    tabRefs.current[index]?.focus();
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % previewLabels.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + previewLabels.length) % previewLabels.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = previewLabels.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    selectAndFocus(nextIndex);
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-ink text-paper"
      aria-labelledby="contract-preview-heading"
    >
      <div className="flex flex-col gap-4 border-b border-paper/15 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-signal">
            Illustrative contract shape
          </p>
          <h3
            id="contract-preview-heading"
            className="mt-2 text-xl font-semibold"
          >
            {contract.name}
          </h3>
        </div>
        <div
          className="flex w-fit flex-wrap gap-1 rounded-lg border border-paper/15 bg-paper/5 p-1"
          role="tablist"
          aria-label="Contract preview"
          aria-orientation="horizontal"
        >
          {previewLabels.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`${tabSetId}-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={mode === id}
              aria-controls={`${tabSetId}-panel-${id}`}
              tabIndex={mode === id ? 0 : -1}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-signal/35',
                mode === id
                  ? 'bg-paper text-ink'
                  : 'text-paper/60 hover:text-paper',
              )}
              onClick={() => setMode(id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <Icon className="size-3.5" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_230px]">
        <div>
          {previewLabels.map(({ id, label }) => (
            <pre
              key={id}
              id={`${tabSetId}-panel-${id}`}
              className="max-h-[30rem] overflow-auto p-5 font-mono text-xs leading-6 text-paper/80 sm:p-6"
              role="tabpanel"
              aria-label={label}
              aria-labelledby={`${tabSetId}-tab-${id}`}
              tabIndex={0}
              hidden={mode !== id}
            >
              <code>{JSON.stringify(previewFor(id), null, 2)}</code>
            </pre>
          ))}
        </div>
        <aside className="border-t border-paper/15 bg-paper/5 p-5 lg:border-l lg:border-t-0">
          <CheckCircle2 className="size-5 text-signal" aria-hidden="true" />
          <p className="mt-4 font-semibold">What this proves</p>
          <p className="mt-2 text-sm leading-6 text-paper/60">
            The example makes discovery, input shape, annotations, and expected
            postconditions inspectable.
          </p>
          <p className="mt-5 border-t border-paper/15 pt-4 text-xs leading-5 text-paper/45">
            It is not runtime evidence. No agent, browser implementation, or
            external service was measured here.
          </p>
        </aside>
      </div>
    </section>
  );
}
