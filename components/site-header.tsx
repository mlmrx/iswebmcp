import { Code2, Menu, Radar } from 'lucide-react';
import Link from 'next/link';

const links = [
  { href: '/learn', label: 'Learn' },
  { href: '/pulse', label: 'Pulse' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/lab', label: 'Proof lab' },
  { href: '/workbench', label: 'Workbench' },
];

export function SiteHeader() {
  return (
    <header className="site-header border-b border-border/80 bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5 lg:px-8">
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
          aria-label="Primary"
          className="relative flex items-center gap-1 text-sm"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
          <a
            className="ml-1 inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            href="https://github.com/mlmrx/iswebmcp"
            aria-label="GitHub repository"
          >
            <Code2 className="size-4" aria-hidden="true" />
          </a>
          <details className="group lg:hidden">
            <summary
              className="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Open primary navigation"
            >
              <Menu className="size-4" aria-hidden="true" />
            </summary>
            <div
              className="absolute right-0 top-11 z-50 hidden min-w-44 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl group-open:grid"
              data-testid="mobile-menu"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  className="rounded-lg px-3 py-2.5 text-foreground hover:bg-muted"
                  href={link.href}
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
