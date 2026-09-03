export const AUDIT_WIDGET_URI = 'ui://iswebmcp/audit-v1.html';

export const auditWidgetHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f6f2e8; color: #151816; }
      main { min-height: 300px; padding: 20px; border: 1px solid rgba(21,24,22,.22); }
      header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .brand { font-size: 20px; font-weight: 850; letter-spacing: -1px; }
      .badge { border: 1px solid #151816; border-radius: 999px; padding: 6px 9px; font: 700 10px/1 ui-monospace, monospace; text-transform: uppercase; }
      .badge::before { content: ''; display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; background: #a7e000; border: 1px solid #151816; }
      .eyebrow { margin-top: 24px; color: #5d7e00; font: 750 11px/1 ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; }
      h1 { margin: 10px 0 0; font-size: clamp(27px, 5vw, 42px); line-height: 1; letter-spacing: -.045em; overflow-wrap: anywhere; }
      .scope { margin-top: 12px; color: #555d57; font-size: 13px; line-height: 1.45; }
      .score { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: center; margin-top: 22px; padding: 16px; border: 1px solid #151816; background: #fff; }
      .value { font-size: 46px; font-weight: 800; letter-spacing: -.06em; }
      .value small { font-size: 15px; color: #69706b; }
      .meter { height: 9px; overflow: hidden; background: #e4e2da; border: 1px solid #151816; }
      .meter i { display: block; height: 100%; background: #a7e000; }
      .meta { margin-top: 7px; font: 650 10px/1.35 ui-monospace, monospace; text-transform: uppercase; color: #5d645f; }
      .labels { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 15px; }
      .labels span { border: 1px solid rgba(21,24,22,.3); padding: 6px 8px; background: rgba(255,255,255,.7); font: 700 9px/1 ui-monospace, monospace; text-transform: uppercase; }
      section { margin-top: 22px; }
      h2 { margin: 0 0 9px; font-size: 14px; }
      ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
      li { padding: 10px 11px; border-left: 3px solid #a7e000; background: rgba(255,255,255,.66); font-size: 12px; line-height: 1.4; }
      li b { display: block; margin-bottom: 3px; }
      footer { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 22px; padding-top: 14px; border-top: 1px solid rgba(21,24,22,.2); font-size: 11px; color: #5d645f; }
      button { border: 1px solid #151816; border-radius: 7px; background: #151816; color: #fff; padding: 8px 10px; cursor: pointer; font-weight: 700; }
      .empty { padding: 44px 10px; text-align: center; color: #69706b; }
      @media (prefers-color-scheme: dark) {
        body, main { background: #151816; color: #f6f2e8; }
        .score, li, .labels span { background: #202421; }
        .score, .badge, .meter { border-color: #f6f2e8; }
        .scope, .meta, footer { color: #b7bdb8; }
        button { background: #a7e000; color: #151816; border-color: #a7e000; }
      }
    </style>
  </head>
  <body>
    <main id="app"><div class="empty">Waiting for an isWebMCP audit…</div></main>
    <script>
      const app = document.getElementById('app');
      let current;

      const element = (name, className, text) => {
        const node = document.createElement(name);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = String(text);
        return node;
      };

      function addList(parent, title, items, detail) {
        if (!items?.length) return;
        const section = element('section');
        section.append(element('h2', '', title));
        const list = element('ul');
        items.slice(0, 5).forEach((item) => {
          const row = element('li');
          row.append(element('b', '', item.title || item.name));
          row.append(document.createTextNode(detail(item)));
          list.append(row);
        });
        section.append(list);
        parent.append(section);
      }

      function render(value) {
        const data = value?.structuredContent || value?.result?.structuredContent || value;
        if (!data?.reportId) return;
        current = data;
        app.replaceChildren();

        const header = element('header');
        header.append(element('div', 'brand', 'isWebMCP'));
        header.append(element('span', 'badge', data.evidenceScope));
        app.append(header);
        app.append(element('div', 'eyebrow', 'Public action-surface audit'));
        app.append(element('h1', '', data.url));
        const collection = data.collection || {};
        const collectionSummary = collection.truncated
          ? ' Collection is partial: ' + (collection.analyzedBytes || 0).toLocaleString() +
            (collection.declaredBytes ? ' of ' + collection.declaredBytes.toLocaleString() : '') +
            ' bytes were analyzed.'
          : ' Collection completed within the bounded source window.';
        app.append(element('p', 'scope', 'This result describes bounded public source. Runtime readiness remains unknown until an observed task trial exists.' + collectionSummary));

        const score = element('div', 'score');
        const scoreValue = data.actionability?.value;
        const valueNode = element('div', 'value');
        valueNode.append(document.createTextNode(scoreValue == null ? '—' : String(scoreValue)));
        valueNode.append(element('small', '', ' / 100'));
        score.append(valueNode);
        const scoreDetail = element('div');
        const meter = element('div', 'meter');
        const fill = element('i');
        fill.style.width = Math.max(0, Math.min(100, scoreValue || 0)) + '%';
        meter.append(fill);
        scoreDetail.append(meter);
        scoreDetail.append(element('div', 'meta', 'Model coverage ' + Math.round(data.actionability?.coverage || 0) + '% · ' + (data.actionability?.confidence || 'low') + ' confidence'));
        score.append(scoreDetail);
        app.append(score);

        const labels = element('div', 'labels');
        ['collection: ' + (collection.status || 'unknown'), 'runtime: ' + data.labels.runtime, 'lift: ' + data.labels.lift, 'contract: ' + data.labels.contract].forEach((label) => labels.append(element('span', '', label)));
        app.append(labels);

        addList(app, 'Candidate actions', data.actions, (item) => item.purpose + ' · ' + item.risk);
        addList(app, 'Priority findings', data.findings, (item) => item.recommendation);
        addList(app, 'Next steps', data.recommendations, (item) => item.detail);

        const footer = element('footer');
        footer.append(element('span', '', 'Map it. Contract it. Prove it.'));
        const button = element('button', '', 'Read methodology');
        button.addEventListener('click', () => {
          const href = 'https://iswebmcp.com/methodology';
          if (window.openai?.openExternal) window.openai.openExternal({ href });
          else window.open(href, '_blank', 'noopener,noreferrer');
        });
        footer.append(button);
        app.append(footer);
      }

      window.addEventListener('message', (event) => {
        if (event.data?.method === 'ui/notifications/tool-result') render(event.data.params);
      });
      if (window.openai?.toolOutput) render(window.openai.toolOutput);
    </script>
  </body>
</html>`;
