import type { Metadata } from 'next';
import Link from 'next/link';
import { implementationRecipes } from '@/lib/mcp/implementation-recipes';

export const metadata: Metadata = {
  title: 'Implementation recipes',
  description:
    'Reviewable search-tool and accessible-form examples, with explicit verification steps and evidence limits.',
  alternates: { canonical: '/developers/recipes' },
};

export default function RecipesPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-5 py-14 lg:px-8"
    >
      <Link
        href="/developers"
        className="font-semibold text-signal-ink hover:underline"
      >
        ← Developer toolkit
      </Link>
      <p className="eyebrow mt-8 text-signal-ink">
        Reviewable code · Not automatic fixes
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        Turn a finding into a first fix.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
        Start with a matching recipe, connect your existing application logic,
        and verify the outcome. These same examples are available through the
        get_implementation_recipe MCP tool. WebMCP remains experimental.
      </p>
      <p className="mt-3 leading-7 text-muted-foreground">
        The remote MCP server delivers this guidance to your agent. The
        browser-side WebMCP adapter runs in your own page. Neither creates an
        agent or connects a remote assistant to a user’s browser automatically.
      </p>
      <div className="mt-10 space-y-8">
        {Object.values(implementationRecipes).map((recipe) => (
          <article
            key={recipe.id}
            id={recipe.id}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <p className="font-mono text-xs text-muted-foreground">
              {recipe.id} · v{recipe.version} · review required
            </p>
            <h2 className="mt-3 text-2xl font-semibold">{recipe.title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {recipe.summary}
            </p>
            <h3 className="mt-6 font-semibold">Before you start</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
              {recipe.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {recipe.files.map((file) => (
              <details
                key={file.path}
                className="mt-6 rounded-xl border border-border p-4"
              >
                <summary className="cursor-pointer font-semibold">
                  View code: {file.path}
                </summary>
                <pre className="mt-4 max-w-full overflow-x-auto rounded-lg bg-background p-4 text-xs leading-6">
                  <code>{file.code}</code>
                </pre>
              </details>
            ))}
            <h3 className="mt-6 font-semibold">
              Connect it to your application
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
              {recipe.setup.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <h3 className="mt-6 font-semibold">
              Verify before claiming success
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
              {recipe.verification.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-6 font-semibold">Limits</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              {recipe.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-4">
              {recipe.sources.map((source) => (
                <a
                  key={source}
                  href={source}
                  className="text-sm font-semibold text-signal-ink hover:underline"
                >
                  Official specification ↗
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-8 leading-7 text-muted-foreground">
        Save baseline and current summary/v2 JSON from the toolkit or evidence
        report. Compare only matching URLs, scan settings, and model versions
        with complete collections and no imported contracts. Supplied JSON is
        not authenticated evidence. A missing finding is not proof of a fix.
      </p>
      <Link
        href="/developers#quickstart"
        className="mt-4 inline-block font-semibold text-signal-ink hover:underline"
      >
        Run a before-and-after source comparison →
      </Link>
    </main>
  );
}
