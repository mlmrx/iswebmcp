import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/70 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="font-semibold">isWebMCP</p>
          <p className="mt-2 max-w-2xl leading-6 text-muted-foreground">
            WebMCP is an experimental browser API proposal. isWebMCP is an
            independent testing project and is not an official OpenAI, Google,
            Microsoft, Chrome, or W3C product.
          </p>
        </div>
        <div className="flex max-w-xl flex-wrap items-start gap-x-5 gap-y-2 text-muted-foreground lg:justify-end">
          <Link className="hover:text-foreground" href="/readiness-index">
            Readiness index
          </Link>
          <Link className="hover:text-foreground" href="/learn">
            Learning center
          </Link>
          <Link className="hover:text-foreground" href="/faq">
            FAQ
          </Link>
          <Link className="hover:text-foreground" href="/pulse">
            WebMCP pulse
          </Link>
          <Link className="hover:text-foreground" href="/feed.xml">
            RSS feed
          </Link>
          <a
            className="hover:text-foreground"
            href="https://webmachinelearning.github.io/webmcp/"
          >
            Draft spec
          </a>
          <a
            className="hover:text-foreground"
            href="https://learn.chatgpt.com/docs/webmcp"
          >
            Site tools docs
          </a>
          <a
            className="hover:text-foreground"
            href="https://developer.chrome.com/docs/ai/webmcp"
          >
            Chrome guide
          </a>
        </div>
      </div>
    </footer>
  );
}
