'use client';

import { ChevronDown, Menu, Radar } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

const resources = [
  { href: '/enterprise', label: 'Enterprise pilots' },
  { href: '/learn', label: 'Guides' },
  { href: '/demos', label: 'Demos' },
  { href: '/lab', label: 'Experimental lab' },
  { href: '/workbench', label: 'Tool-contract audit' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/readiness-index', label: 'Historical research index' },
  { href: '/pulse', label: 'News and updates' },
];
const primary = [
  { href: '/developers', label: 'Developers' },
  { href: '/integrations', label: 'Integrations' },
];

export function SiteHeader() {
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent | KeyboardEvent) => {
      const navigation = navigationRef.current;
      if (!navigation) return;
      const escape = event instanceof KeyboardEvent && event.key === 'Escape';
      const clickedAwayOrLink =
        event instanceof MouseEvent &&
        event.target instanceof Element &&
        (!navigation.contains(event.target) ||
          Boolean(event.target.closest('a')));
      if (!escape && !clickedAwayOrLink) return;
      navigation
        .querySelectorAll<HTMLDetailsElement>('details[open]')
        .forEach((item) => {
          item.open = false;
          if (escape && item.contains(document.activeElement))
            item.querySelector('summary')?.focus();
        });
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, []);
  return (
    <header className="site-header border-b border-border/80 bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 lg:px-8">
        <Link
          className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight"
          href="/"
        >
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Radar className="size-4" aria-hidden="true" />
          </span>
          isWebMCP
        </Link>
        <nav
          ref={navigationRef}
          aria-label="Primary"
          className="relative flex items-center gap-1 text-sm"
        >
          {primary.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden rounded-lg px-3 py-2 hover:bg-muted md:inline-flex"
            >
              {link.label}
            </Link>
          ))}
          <details className="group hidden md:block">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 hover:bg-muted">
              Resources <ChevronDown className="size-3.5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-12 z-50 grid min-w-64 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl">
              {resources.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
          <Link
            href="/#audit"
            className="hidden rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground sm:inline-flex"
          >
            Check website
          </Link>
          <details className="group md:hidden">
            <summary
              className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-card"
              aria-label="Open primary navigation"
            >
              <Menu className="size-4" aria-hidden="true" />
            </summary>
            <div
              className="absolute right-0 top-12 z-50 grid max-h-[75vh] min-w-64 gap-1 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl"
              data-testid="mobile-menu"
            >
              {[
                ...primary,
                { href: '/#audit', label: 'Check website' },
                ...resources,
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}
