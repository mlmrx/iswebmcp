/* oxlint-disable typescript/no-require-imports -- VS Code loads this package as CommonJS. */
const vscode = require('vscode');

const DEFAULT_ENDPOINT = 'https://iswebmcp.com/api/integrations/scan';

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('iswebmcp.auditPublicUrl', () =>
      auditWithPrompt(),
    ),
    vscode.commands.registerCommand('iswebmcp.auditSelectedUrl', () =>
      auditSelection(),
    ),
    vscode.commands.registerCommand('iswebmcp.openLab', () =>
      vscode.env.openExternal(vscode.Uri.parse('https://iswebmcp.com/lab')),
    ),
  );
}

async function auditWithPrompt(seed = '') {
  const value = await vscode.window.showInputBox({
    title: 'Audit a public URL with isWebMCP',
    prompt:
      'The service fetches public page source only; it does not execute a browser workflow.',
    placeHolder: 'https://example.com',
    value: seed,
    validateInput: validateUrl,
    ignoreFocusOut: true,
  });
  if (!value) return;
  await runAudit(value);
}

async function auditSelection() {
  const editor = vscode.window.activeTextEditor;
  const selected = editor?.document.getText(editor.selection).trim() || '';
  if (selected && !validateUrl(selected)) {
    await runAudit(selected);
    return;
  }
  await auditWithPrompt(selected);
}

function validateUrl(value) {
  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol))
      return 'Use an http:// or https:// URL.';
    return null;
  } catch {
    return 'Enter a complete public URL, including https://.';
  }
}

async function runAudit(url) {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `isWebMCP is auditing ${new URL(url).hostname}`,
      cancellable: false,
    },
    async () => {
      try {
        const endpoint = vscode.workspace
          .getConfiguration('iswebmcp')
          .get('scanEndpoint', DEFAULT_ENDPOINT);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({ url }),
        });
        const payload = await readPayload(response);
        if (!response.ok)
          throw new Error(
            payload?.error?.message || `Audit failed (${response.status}).`,
          );
        showReport(payload);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'The audit could not be completed.';
        vscode.window.showErrorMessage(`isWebMCP: ${message}`);
      }
    },
  );
}

async function readPayload(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.slice(0, 180) || 'The audit service returned an invalid response.',
    );
  }
}

function showReport(report) {
  let hostname = 'audit';
  try {
    hostname = new URL(report.url).hostname;
  } catch {}
  const panel = vscode.window.createWebviewPanel(
    'iswebmcp.report',
    `isWebMCP · ${hostname}`,
    vscode.ViewColumn.Beside,
    { enableScripts: false, retainContextWhenHidden: false },
  );
  panel.webview.html = renderReport(report);
}

function renderReport(report) {
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const recommendations = Array.isArray(report.recommendations)
    ? report.recommendations
    : [];
  const limitations = Array.isArray(report.limitations)
    ? report.limitations
    : [];
  const actions = Array.isArray(report.actions) ? report.actions : [];
  const actionability = report.actionability || {};
  const collection = report.collection || {};
  const sourceStatus = collection.status || 'unknown';
  const score = Number.isFinite(actionability.value)
    ? actionability.value
    : '—';
  const statusClass = sourceStatus === 'complete' ? 'ok' : 'warn';
  const actionWindow = collection.declaredBytes
    ? Math.min(
        100,
        Math.round((collection.analyzedBytes / collection.declaredBytes) * 100),
      )
    : collection.truncated
      ? 'partial'
      : 'complete';
  const itemLabel = (item) =>
    typeof item === 'string'
      ? item
      : item.title ||
        item.name ||
        item.detail ||
        item.purpose ||
        'Untitled item';
  const list = (items, empty) =>
    items.length
      ? `<ul>${items.map((item) => `<li>${escapeHtml(itemLabel(item))}</li>`).join('')}</ul>`
      : `<p class="muted">${escapeHtml(empty)}</p>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<title>isWebMCP audit</title><style>
:root{color-scheme:light dark}body{font:14px/1.55 var(--vscode-font-family);color:var(--vscode-foreground);padding:24px;max-width:900px;margin:auto}h1{font-size:25px;margin:0 0 6px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--vscode-descriptionForeground)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:20px 0}.card{border:1px solid var(--vscode-panel-border);border-radius:10px;padding:14px;background:var(--vscode-sideBar-background)}.score{font-size:34px;font-weight:700}.label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--vscode-descriptionForeground)}.pill{display:inline-block;padding:3px 8px;border-radius:99px;border:1px solid currentColor}.ok{color:var(--vscode-testing-iconPassed)}.warn{color:var(--vscode-editorWarning-foreground)}section{border-top:1px solid var(--vscode-panel-border);padding-top:14px;margin-top:18px}li{margin:7px 0}.muted{color:var(--vscode-descriptionForeground)}code{font-family:var(--vscode-editor-font-family)}
</style></head><body>
<div class="eyebrow">WACE source audit · evidence, not a verdict</div>
<h1>${escapeHtml(report.url || 'Public URL')}</h1>
<p><span class="pill ${statusClass}">${escapeHtml(sourceStatus)}</span> ${escapeHtml(report.evidenceScope || 'Public source snapshot')}</p>
<div class="grid">
  <div class="card"><div class="label">Before score</div><div class="score">${escapeHtml(score)}</div><div class="muted">Suitability / 100</div></div>
  <div class="card"><div class="label">Model coverage</div><div class="score">${escapeHtml(actionability.coverage ?? '—')}%</div><div class="muted">Observable source inputs</div></div>
  <div class="card"><div class="label">Source window</div><div class="score">${escapeHtml(actionWindow)}${typeof actionWindow === 'number' ? '%' : ''}</div><div class="muted">${escapeHtml(collection.analyzedBytes || 0)}${collection.declaredBytes ? ` / ${escapeHtml(collection.declaredBytes)}` : ''} bytes</div></div>
  <div class="card"><div class="label">After score</div><div class="score">—</div><div class="muted">Runtime evidence required</div></div>
</div>
<section><h2>Candidate actions (${actions.length})</h2>${list(actions, 'No candidate actions were inferred from this snapshot.')}</section>
<section><h2>Findings</h2>${list(findings, 'No findings were returned.')}</section>
<section><h2>Recommended next moves</h2>${list(recommendations, 'No recommendations were returned.')}</section>
<section><h2>Limits you should keep</h2>${list(limitations, 'This remains a source-only audit; browser runtime and authenticated states were not tested.')}</section>
<p class="muted">Confidence: ${escapeHtml(actionability.confidence || 'unknown')} · Contract provenance: ${escapeHtml(report.labels?.contract || 'not-provided')}</p>
</body></html>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function deactivate() {}

module.exports = { activate, deactivate };
