import { describe, expect, it } from 'vitest';

import { analyzeSource, makeDemoReport } from '@/lib/scanner';

describe('source analyzer', () => {
  it('separates source hints from runtime proof', () => {
    const report = makeDemoReport();
    expect(report.reportKind).toBe('synthetic_fixture');
    expect(report.limitations[0]).toMatch(/authored synthetic fixture/i);
    expect(report.implementationState).toBe('source_hint_detected');
    expect(report.webmcpQuality).toBeNull();
    expect(report.webmcpLift).toBeNull();
    expect(
      report.evidence.find((item) => item.id === 'ev-webmcp-hint')?.source,
    ).toBe('source');
    expect(report.limitations.join(' ')).toMatch(/does not execute/i);
  });

  it('scores accessible names and infers task actions', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<h1>Store</h1><form action="/search" method="get"><label for="q">Search</label><input id="q"><button type="submit">Search</button></form><button aria-label="Add item to cart">+</button><p role="status">Ready</p>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 220,
      redirects: 0,
    });
    expect(report.baselineActionability.value).toBeGreaterThan(60);
    expect(report.baselineActionability.coverage).toBe(100);
    expect(report.baselineActionability.modelVersion).toBe(
      'source-actionability-v2.1',
    );
    expect(
      report.baselineActionability.categories.every(
        (category) => (category.metrics?.length ?? 0) > 0,
      ),
    ).toBe(true);
    expect(report.actionSurface.map((action) => action.name)).toEqual(
      expect.arrayContaining(['Search', 'Add']),
    );
  });

  it('sanitizes script content from displayed evidence', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<html><script>alert("owned")</script><button>Save</button></html>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 70,
      redirects: 0,
    });
    expect(JSON.stringify(report.evidence)).not.toContain('alert("owned")');
  });

  it('ignores controls and WebMCP words inside comments, templates, and code examples', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<!-- <button>Delete</button> document.modelContext --><template><form><input></form></template><pre><code>document.modelContext.registerTool({name:"search"})</code></pre><h1>Article about WebMCP</h1>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 220,
      redirects: 0,
    });
    expect(report.counts.buttons).toBe(0);
    expect(report.counts.forms).toBe(0);
    expect(report.actionSurface).toHaveLength(0);
    expect(report.implementationState).toBe('not_detected');
  });

  it('recognizes wrapping labels and excludes non-field input controls', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<form><label>Email <input type="email" name="email"></label><input type="hidden"><input type="submit" value="Send"></form>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 140,
      redirects: 0,
    });
    const names = report.baselineActionability.categories.find(
      (item) => item.id === 'accessible_names',
    );
    expect(names?.score).toBe(100);
    expect(
      report.evidence.find((item) => item.id === 'ev-names')?.summary,
    ).toContain('1 of 1');
  });

  it('records an initial HTTP hop even when the final page is HTTPS', () => {
    const report = analyzeSource({
      normalizedUrl: 'http://example.com/',
      finalUrl: 'https://example.com/',
      html: '<h1>Secure destination</h1>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 40,
      redirects: 1,
    });
    const transport = report.baselineActionability.categories.find(
      (item) => item.id === 'transport',
    );
    expect(transport?.score).toBe(65);
    expect(
      report.findings.find((item) => item.id === 'finding-transport')?.status,
    ).toBe('partial');
  });

  it('discounts confidence and publishes an uncertainty range for a bounded partial source', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<main><h1>Catalog</h1><button>Search</button></main>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 1_000_000,
      declaredBytes: 2_000_000,
      analysisLimitBytes: 1_000_000,
      truncated: true,
      redirects: 0,
    });
    expect(report.reportKind).toBe('observed_source');
    expect(report.response.truncated).toBe(true);
    expect(report.baselineActionability.confidence).toBe('low');
    expect(report.baselineActionability.coverage).toBeLessThan(100);
    expect(report.baselineActionability.interval).toEqual({
      lower: 0,
      upper: 100,
    });
    expect(report.limitations.join(' ')).toMatch(/partial report/i);
  });

  it('does not grant full model coverage from one observed accessibility metric', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<main><h1>Catalog</h1><button>Search</button></main>',
      status: 200,
      contentType: 'text/html',
      bytesRead: 55,
      redirects: 0,
    });
    const accessibility = report.baselineActionability.categories.find(
      (category) => category.id === 'accessible_names',
    );

    expect(accessibility?.score).toBe(100);
    expect(
      accessibility?.metrics?.filter((metric) => metric.observed),
    ).toHaveLength(1);
    expect(report.baselineActionability.coverage).toBeLessThan(100);
  });

  it('does not reward repeated feedback, state, landmark, or entity markup', () => {
    const analyze = (html: string) =>
      analyzeSource({
        normalizedUrl: 'https://example.com/',
        finalUrl: 'https://example.com/',
        html,
        status: 200,
        contentType: 'text/html',
        bytesRead: html.length,
        redirects: 0,
      }).baselineActionability;
    const jsonLd =
      '<script type="application/ld+json">{"@type":"Product"}</script>';
    const base = analyze(
      `<main><h1>Catalog</h1><button aria-expanded="false">Search</button><p role="status">Ready</p>${jsonLd}</main>`,
    );
    const repeated = analyze(
      `<main><main><main><h1>Catalog</h1><button aria-expanded="false" aria-expanded="true" aria-expanded="false">Search</button><p role="status">Ready</p><p role="status">Still ready</p><p role="status">Ready again</p>${jsonLd}${jsonLd}${jsonLd}</main></main></main>`,
    );

    expect(repeated.value).toBe(base.value);
    expect(
      repeated.categories.find((category) => category.id === 'feedback')?.score,
    ).toBe(
      base.categories.find((category) => category.id === 'feedback')?.score,
    );
    expect(
      repeated.categories.find((category) => category.id === 'entities')?.score,
    ).toBe(
      base.categories.find((category) => category.id === 'entities')?.score,
    );
  });

  it('matches action words as complete tokens rather than substrings', () => {
    const report = analyzeSource({
      normalizedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      html: '<main><a href="/address">Office address</a><button>Display research findings</button></main>',
      goal: 'Review the display address',
      status: 200,
      contentType: 'text/html',
      bytesRead: 88,
      redirects: 0,
    });
    expect(report.actionSurface).toHaveLength(0);
    expect(report.evidence.find((item) => item.id === 'ev-goal')?.summary).toBe(
      'Requested task supplied',
    );
  });
});
