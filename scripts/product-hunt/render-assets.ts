import { chromium, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const baseUrl = process.env.PRODUCT_HUNT_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = path.join(root, 'public', 'product-hunt');
const galleryDir = path.join(outputDir, 'gallery');
const rawDir = path.join(outputDir, 'source', 'screens');
const backgroundPath = path.join(
  outputDir,
  'source',
  'evidence-map-background.png',
);

await mkdir(galleryDir, { recursive: true });
await mkdir(rawDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function captureProductPage(page: Page, route: string, filename: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}${route}`, {
    waitUntil: 'networkidle',
    timeout: 45_000,
  });
  await page.screenshot({
    path: path.join(rawDir, filename),
    type: 'png',
  });
}

function asDataUrl(bytes: Buffer) {
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

const capture = await browser.newPage();
await captureProductPage(capture, '/', 'home.png');
await captureProductPage(capture, '/lab', 'lab.png');
await captureProductPage(capture, '/demos', 'demos.png');
await captureProductPage(capture, '/readiness-index', 'index.png');
await capture.close();

const [background, home, lab, demos, index] = await Promise.all([
  readFile(backgroundPath),
  readFile(path.join(rawDir, 'home.png')),
  readFile(path.join(rawDir, 'lab.png')),
  readFile(path.join(rawDir, 'demos.png')),
  readFile(path.join(rawDir, 'index.png')),
]);

const images = {
  background: asDataUrl(background),
  home: asDataUrl(home),
  lab: asDataUrl(lab),
  demos: asDataUrl(demos),
  index: asDataUrl(index),
};

const baseStyles = `
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
  body {
    background: #f6f2e8;
    color: #151816;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .canvas {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    border: 2px solid #151816;
    background-color: #f6f2e8;
    background-image:
      linear-gradient(rgba(21,24,22,.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(21,24,22,.035) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .topbar {
    height: 68px;
    padding: 0 42px;
    border-bottom: 1px solid rgba(21,24,22,.24);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(246,242,232,.92);
  }
  .brand { font-size: 27px; font-weight: 850; letter-spacing: -1.7px; }
  .eyebrow {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: #466000;
    font-weight: 750;
  }
  h1 { margin: 0; font-size: 66px; line-height: .96; letter-spacing: -.058em; font-weight: 780; }
  h2 { margin: 0; font-size: 52px; line-height: .98; letter-spacing: -.05em; font-weight: 780; }
  p { margin: 0; }
  .sub { font-size: 21px; line-height: 1.45; color: #4f5651; }
  .signal { color: #5d7e00; }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(21,24,22,.3);
    border-radius: 999px;
    padding: 8px 12px;
    background: rgba(246,242,232,.92);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #a7e000; box-shadow: 0 0 0 2px #151816; }
  .frame {
    border: 1px solid #151816;
    background: #fff;
    box-shadow: 12px 12px 0 rgba(21,24,22,.13);
    overflow: hidden;
  }
  .frame img { width: 100%; height: 100%; object-fit: cover; object-position: top left; display: block; }
  .footer {
    position: absolute;
    left: 42px;
    right: 42px;
    bottom: 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    letter-spacing: .04em;
  }
  .rule { height: 4px; width: 96px; background: #a7e000; border: 1px solid #151816; }
`;

function documentFor(body: string, styles = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles}${styles}</style></head><body>${body}</body></html>`;
}

async function render(
  filename: string,
  width: number,
  height: number,
  body: string,
  styles = '',
) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(documentFor(body, styles), { waitUntil: 'load' });
  await page.screenshot({ path: path.join(outputDir, filename), type: 'png' });
  await page.close();
}

await render(
  'thumbnail-240.png',
  240,
  240,
  `<div class="canvas thumb">
    <div class="corner c1"></div><div class="corner c2"></div><div class="corner c3"></div><div class="corner c4"></div>
    <div class="mark"><span>is</span><strong>Web<br>MCP</strong></div>
    <div class="path"><i></i><i></i><i></i></div>
  </div>`,
  `
    .thumb { border-width: 3px; }
    .mark { position: absolute; left: 24px; top: 26px; }
    .mark span { display:block; font: 750 18px/1 ui-monospace, monospace; color:#5d7e00; }
    .mark strong { display:block; margin-top:8px; font-size:54px; line-height:.78; letter-spacing:-5px; }
    .path { position:absolute; left:25px; right:25px; bottom:32px; height:7px; background:#a7e000; border:1px solid #151816; }
    .path i { position:absolute; width:15px; height:15px; border-radius:50%; top:-5px; background:#a7e000; border:2px solid #151816; }
    .path i:nth-child(1){left:0}.path i:nth-child(2){left:46%}.path i:nth-child(3){right:0}
    .corner { position:absolute; width:18px; height:18px; border-color:#151816; }
    .c1{left:9px;top:9px;border-left:2px solid;border-top:2px solid}.c2{right:9px;top:9px;border-right:2px solid;border-top:2px solid}
    .c3{left:9px;bottom:9px;border-left:2px solid;border-bottom:2px solid}.c4{right:9px;bottom:9px;border-right:2px solid;border-bottom:2px solid}
  `,
);

await render(
  path.join('gallery', '01-map-contract-prove.png'),
  1270,
  760,
  `<div class="canvas hero">
    <img class="hero-bg" src="${images.background}" />
    <div class="hero-copy">
      <div class="eyebrow">Evidence lab for the agent-native web</div>
      <h1>Prove your web app<br>is ready for AI agents.</h1>
      <p class="sub">Map the friction. Audit the contract. Verify the result.</p>
      <div class="pathline"><span>MAP IT</span><b>→</b><span>CONTRACT IT</span><b>→</b><span>PROVE IT</span></div>
    </div>
    <div class="brandtag">isWebMCP</div>
  </div>`,
  `
    .hero-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.72; }
    .hero:after { content:""; position:absolute; inset:0; background:linear-gradient(90deg, rgba(246,242,232,.98) 0%, rgba(246,242,232,.92) 46%, rgba(246,242,232,.10) 76%); }
    .hero-copy { position:absolute; z-index:2; left:54px; top:82px; width:780px; }
    .hero-copy h1 { margin-top:24px; font-size:72px; }
    .hero-copy .sub { margin-top:24px; width:610px; }
    .pathline { margin-top:44px; display:flex; align-items:center; gap:19px; font:800 13px/1 ui-monospace,monospace; letter-spacing:.08em; }
    .pathline span { border:1px solid #151816; background:#f6f2e8; padding:11px 13px; }
    .pathline span:last-child { background:#a7e000; }
    .brandtag { position:absolute; z-index:2; right:34px; top:30px; font-size:27px; font-weight:850; letter-spacing:-1.7px; }
  `,
);

await render(
  path.join('gallery', '02-source-is-not-runtime.png'),
  1270,
  760,
  `<div class="canvas"><div class="topbar"><div class="brand">isWebMCP</div><div class="pill"><i class="dot"></i> Evidence stays in scope</div></div>
    <div class="split">
      <div class="copy"><div class="eyebrow">Quick Scan</div><h2>Source is not<br>runtime.</h2><p class="sub">One public URL becomes a ledger of what is known, how it was observed, and what remains unknown.</p>
        <div class="labels"><span>BOUNDED FETCH</span><span>1 MB CAP</span><span>NO TARGET JS</span><span>RUNTIME: UNKNOWN</span></div>
      </div>
      <div class="frame shot"><img src="${images.home}" /></div>
    </div><div class="footer"><span>Map candidate actions without pretending to execute them.</span><div class="rule"></div></div>
  </div>`,
  `
    .split{display:grid;grid-template-columns:.78fr 1.22fr;gap:42px;padding:56px 42px 0;align-items:center}.copy h2{margin-top:18px}.copy .sub{margin-top:24px;max-width:450px}.labels{display:flex;flex-wrap:wrap;gap:9px;margin-top:30px}.labels span{font:750 10px/1 ui-monospace,monospace;border:1px solid rgba(21,24,22,.35);padding:8px;background:#fff}.shot{height:510px}.shot img{object-position:top center}
  `,
);

await render(
  path.join('gallery', '03-one-task-two-paths.png'),
  1270,
  760,
  `<div class="canvas dark"><div class="topbar darkbar"><div class="brand">isWebMCP</div><div class="pill darkpill"><i class="dot"></i> Matched evidence only</div></div>
    <div class="darkcopy"><div class="eyebrow">Proof Lab</div><h2>Same task. Same app.<br><span>Two paths.</span></h2><p>Lift appears only when both interactive trials use the same fixture, starting state, task, and success criteria.</p></div>
    <div class="frame labshot"><img src="${images.lab}" /></div>
    <div class="twopath"><div><b>UI path</b><small>visible controls + state</small></div><strong>VS</strong><div><b>WebMCP path</b><small>typed tools + verification</small></div></div>
    <div class="footer"><span>Authored replay ≠ observed runtime trial</span><div class="rule"></div></div>
  </div>`,
  `
    .dark{background:#151816;color:#f6f2e8;background-image:linear-gradient(rgba(246,242,232,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(246,242,232,.045) 1px,transparent 1px)}.darkbar{background:#151816;border-color:rgba(246,242,232,.24)}.darkpill{background:#151816;border-color:rgba(246,242,232,.3)}.darkcopy{position:absolute;left:44px;top:118px;width:480px}.darkcopy .eyebrow{color:#a7e000}.darkcopy h2{margin-top:19px;font-size:55px}.darkcopy h2 span{color:#a7e000}.darkcopy p{margin-top:25px;color:rgba(246,242,232,.66);font-size:18px;line-height:1.48;width:430px}.labshot{position:absolute;left:548px;top:106px;width:676px;height:480px;box-shadow:12px 12px 0 rgba(167,224,0,.2)}.twopath{position:absolute;left:44px;top:440px;width:456px;display:grid;grid-template-columns:1fr 44px 1fr;gap:10px;align-items:center}.twopath div{border:1px solid rgba(246,242,232,.28);padding:14px}.twopath b,.twopath small{display:block}.twopath b{font-size:14px}.twopath small{margin-top:6px;color:rgba(246,242,232,.55);font-size:11px}.twopath strong{text-align:center;color:#a7e000}.dark .footer{color:rgba(246,242,232,.65)}
  `,
);

await render(
  path.join('gallery', '04-four-level-evidence.png'),
  1270,
  760,
  `<div class="canvas"><div class="topbar"><div class="brand">isWebMCP</div><div class="pill"><i class="dot"></i> Unknown stays unknown</div></div>
    <div class="ladder-head"><div class="eyebrow">The evidence ladder</div><h2>One score cannot tell four truths.</h2><p class="sub">Each level has its own inputs, provenance, and claim boundary.</p></div>
    <div class="ladder">
      <article><em>01</em><b>Source actionability</b><span>Public HTML evidence</span><small>Observed from bounded source</small></article>
      <i>→</i><article><em>02</em><b>Contract lint</b><span>Sanitized tool inventory</span><small>Imported · not independently verified</small></article>
      <i>→</i><article><em>03</em><b>Runtime readiness</b><span>Observed task trial</span><small>Success + safety + postconditions</small></article>
      <i>→</i><article class="active"><em>04</em><b>Measured lift</b><span>Matched UI / tool pair</span><small>Withheld until both runs qualify</small></article>
    </div><div class="footer"><span>Provenance before confidence.</span><div class="rule"></div></div>
  </div>`,
  `
    .ladder-head{padding:48px 42px 0}.ladder-head h2{margin-top:16px}.ladder-head .sub{margin-top:16px}.ladder{position:absolute;left:42px;right:42px;top:390px;display:grid;grid-template-columns:1fr 34px 1fr 34px 1fr 34px 1fr;align-items:stretch}.ladder>i{font-style:normal;font-size:28px;display:grid;place-items:center}.ladder article{border:1px solid #151816;background:#fff;padding:18px;min-height:186px;box-shadow:7px 7px 0 rgba(21,24,22,.1)}.ladder article.active{background:#a7e000}.ladder em{font:750 11px/1 ui-monospace,monospace;color:#5d7e00;font-style:normal}.ladder .active em{color:#151816}.ladder b,.ladder span,.ladder small{display:block}.ladder b{margin-top:29px;font-size:19px;line-height:1.1}.ladder span{margin-top:12px;font-size:13px}.ladder small{margin-top:18px;padding-top:12px;border-top:1px solid rgba(21,24,22,.2);font:650 10px/1.35 ui-monospace,monospace;color:#5a615c}
  `,
);

await render(
  path.join('gallery', '05-24-patterns.png'),
  1270,
  760,
  `<div class="canvas"><div class="topbar"><div class="brand">isWebMCP</div><div class="pill"><i class="dot"></i> 24 synthetic fixtures</div></div>
    <div class="patterncopy"><div class="eyebrow">Interactive gallery</div><h2>See the action,<br>state, and safety boundary.</h2><p class="sub">Explore value, contract, security, and reliability patterns without invented benchmark claims.</p></div>
    <div class="frame demoshot"><img src="${images.demos}" /></div>
    <div class="categories"><span>VALUE</span><span>CONTRACT</span><span>SECURITY</span><span>RELIABILITY</span></div>
    <div class="footer"><span>Synthetic fixtures · no performance claims</span><div class="rule"></div></div>
  </div>`,
  `
    .patterncopy{position:absolute;left:42px;top:122px;width:520px}.patterncopy h2{margin-top:18px;font-size:53px}.patterncopy .sub{margin-top:22px;max-width:500px}.demoshot{position:absolute;left:590px;top:110px;width:635px;height:484px}.categories{position:absolute;left:42px;top:500px;width:500px;display:grid;grid-template-columns:1fr 1fr;gap:9px}.categories span{border:1px solid #151816;background:#fff;padding:13px;font:750 11px/1 ui-monospace,monospace}.categories span:nth-child(3){background:#a7e000}
  `,
);

await render(
  path.join('gallery', '06-audited-partial-index.png'),
  1270,
  760,
  `<div class="canvas"><div class="topbar"><div class="brand">isWebMCP</div><div class="pill"><i class="dot"></i> Frozen WRI v1 artifact</div></div>
    <div class="indexcopy"><div class="eyebrow">Publish the failure, too</div><h2>100,000 attempts.<br>Not 100,000 claims.</h2><p class="sub">Two scanner-wide failure windows were quarantined instead of attributed to websites.</p>
      <div class="counts"><div><b>65,380</b><span>valid outcomes</span></div><div><b>34,620</b><span>infra errors</span></div><div><b>36,323</b><span>scored rows</span></div></div>
    </div>
    <div class="frame indexshot"><img src="${images.index}" /></div>
    <div class="footer"><span>Audited partial · uncalibrated · not a definitive league table</span><div class="rule"></div></div>
  </div>`,
  `
    .indexcopy{position:absolute;left:42px;top:116px;width:500px}.indexcopy h2{margin-top:18px;font-size:52px}.indexcopy .sub{margin-top:22px;max-width:470px}.indexshot{position:absolute;left:574px;top:109px;width:651px;height:492px}.counts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:30px}.counts div{border:1px solid #151816;background:#fff;padding:13px 10px}.counts b,.counts span{display:block}.counts b{font-size:22px;letter-spacing:-1px}.counts span{margin-top:4px;font:650 9px/1.15 ui-monospace,monospace;text-transform:uppercase;color:#5a615c}
  `,
);

await render(
  'social-1200x630.png',
  1200,
  630,
  `<div class="canvas social"><img class="socialbg" src="${images.background}"/><div class="socialveil"></div>
    <div class="socialbrand">isWebMCP</div>
    <div class="socialcopy"><div class="eyebrow">Evidence for the agent-ready web</div><h1>Prove your web app<br>is ready for AI agents.</h1><p>Map it. Contract it. Prove it.</p></div>
    <div class="socialurl">iswebmcp.com</div>
  </div>`,
  `
    .socialbg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.7}.socialveil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(246,242,232,.98),rgba(246,242,232,.88) 55%,rgba(246,242,232,.08))}.socialbrand{position:absolute;z-index:2;right:34px;top:28px;font-size:27px;font-weight:850;letter-spacing:-1.7px}.socialcopy{position:absolute;z-index:2;left:50px;top:86px}.socialcopy h1{font-size:64px;margin-top:20px}.socialcopy p{margin-top:28px;font:800 14px/1 ui-monospace,monospace;letter-spacing:.08em}.socialurl{position:absolute;z-index:2;left:50px;bottom:34px;border:1px solid #151816;background:#a7e000;padding:10px 13px;font:800 13px/1 ui-monospace,monospace}
  `,
);

await browser.close();

console.log(`Product Hunt assets written to ${outputDir}`);
