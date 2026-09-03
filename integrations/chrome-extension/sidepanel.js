const endpoint = 'https://iswebmcp.com/api/integrations/scan';
let currentUrl = '';

const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
  $('audit').addEventListener('click', auditCurrentPage);
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    currentUrl = tab?.url || '';
    $('page-title').textContent = tab?.title || 'Untitled page';
    $('page-url').textContent = currentUrl;
    if (!isPublicHttpUrl(currentUrl)) {
      $('audit').disabled = true;
      setStatus(
        'Open a public http:// or https:// page to run an audit.',
        true,
      );
    }
  } catch {
    setStatus(
      'Chrome did not expose the active tab. Re-open the side panel on the page you want to audit.',
      true,
    );
  }
});

async function auditCurrentPage() {
  if (!isPublicHttpUrl(currentUrl)) return;
  $('audit').disabled = true;
  $('report').hidden = true;
  setStatus('Fetching a bounded public-source snapshot…');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        url: currentUrl,
        goal: $('goal').value.trim() || undefined,
      }),
    });
    const payload = await readPayload(response);
    if (!response.ok)
      throw new Error(
        payload?.error?.message || `Audit failed (${response.status}).`,
      );
    renderReport(payload);
    setStatus('Audit complete. Keep the evidence limits with the score.');
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : 'The audit could not be completed.',
      true,
    );
  } finally {
    $('audit').disabled = false;
  }
}

async function readPayload(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.slice(0, 180) || 'The service returned an invalid response.',
    );
  }
}

function renderReport(report) {
  const actionability = report.actionability || {};
  const collection = report.collection || {};
  $('source-status').textContent = collection.status || 'unknown';
  $('evidence-scope').textContent =
    report.evidenceScope || 'Public source snapshot';
  $('before-score').textContent = finiteOrDash(actionability.value);
  $('actionability').textContent = `${finiteOrDash(actionability.coverage)}%`;
  const sourceWindow = collection.declaredBytes
    ? `${Math.min(100, Math.round((collection.analyzedBytes / collection.declaredBytes) * 100))}%`
    : collection.truncated
      ? 'partial'
      : 'complete';
  $('coverage').textContent = sourceWindow;
  $('bytes').textContent =
    `${collection.analyzedBytes || 0}${collection.declaredBytes ? ` / ${collection.declaredBytes}` : ''} bytes`;
  fillList(
    'actions',
    report.actions,
    'No candidate actions were inferred from this snapshot.',
  );
  $('action-count').textContent =
    `(${Array.isArray(report.actions) ? report.actions.length : 0})`;
  fillList('findings', report.findings, 'No findings were returned.');
  fillList(
    'recommendations',
    report.recommendations,
    'No recommendations were returned.',
  );
  fillList(
    'limitations',
    report.limitations,
    'Browser runtime and authenticated states were not tested.',
  );
  $('report').hidden = false;
}

function fillList(id, items, empty) {
  const list = $(id);
  list.replaceChildren();
  const normalized = Array.isArray(items) && items.length ? items : [empty];
  for (const item of normalized) {
    const li = document.createElement('li');
    li.textContent =
      typeof item === 'string'
        ? item
        : item.title || item.detail || 'Untitled finding';
    list.appendChild(li);
  }
}

function setStatus(message, isError = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', isError);
}

function finiteOrDash(value) {
  return Number.isFinite(value) ? String(value) : '—';
}

function isPublicHttpUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
