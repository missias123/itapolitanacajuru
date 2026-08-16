const fs = require('fs');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const PORT = 4176;
const VIEWPORTS = [
  { name: 'Android 360', width: 360, height: 800 },
  { name: 'iPhone/App 390', width: 390, height: 844 },
  { name: 'Tablet 768', width: 768, height: 1024 },
  { name: 'PC 1280', width: 1280, height: 900 },
];
const EXCLUDE = new Set(['404.html', 'carrossel.html']);
const pages = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.html') && !EXCLUDE.has(f) && !f.startsWith('admin-'))
  .sort();
if (fs.existsSync(path.join(ROOT, 'admin-painel.html'))) pages.push('admin-painel.html');

function parseRgb(value) {
  const m = String(value).match(/rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)(?:[, /]+\s*([\d.]+))?/i);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] };
}
function lum(c) {
  const v = [c.r, c.g, c.b].map(x => x / 255).map(x => x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4));
  return .2126 * v[0] + .7152 * v[1] + .0722 * v[2];
}
function contrast(a, b) {
  if (!a || !b || a.a === 0 || b.a === 0) return null;
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + .05) / (Math.min(la, lb) + .05);
}
function isTransparent(c) { return !c || c.a === 0; }

(async () => {
  const server = http.createServer((req, res) => handler(req, res, { public: ROOT }));
  await new Promise(resolve => server.listen(PORT, resolve));
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const report = { generatedAt: new Date().toISOString(), pages, viewports: VIEWPORTS, findings: [], summary: { checked: 0, lowContrast: 0, tinyTargets: 0, horizontalOverflow: 0, missingText: 0 } };
  for (const file of pages) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
      try {
        await page.goto(`http://127.0.0.1:${PORT}/${file}?contrastAudit=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 30000 });
        const result = await page.evaluate(() => {
          const candidates = [...document.querySelectorAll('button, a, [role="button"], input[type="submit"], input[type="button"], .btn, .nav-btn, .vc-btn, .menu-categorias-cardapio a')];
          const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
          const bgFor = el => {
            let node = el;
            while (node && node !== document.documentElement) {
              const c = getComputedStyle(node).backgroundColor;
              if (c && !/rgba?\(\s*0\s*,\s*0\s*,\s*0\s*(?:,\s*0)?\s*\)/i.test(c) && !c.endsWith(', 0)')) return c;
              node = node.parentElement;
            }
            return getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)';
          };
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            controls: candidates.filter(visible).map(el => {
              const r = el.getBoundingClientRect(), s = getComputedStyle(el);
              const text = (el.innerText || el.getAttribute('aria-label') || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
              return { tag: el.tagName.toLowerCase(), cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 120) : '', id: el.id, text, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10, color: s.color, bg: bgFor(el), fontSize: s.fontSize, fontWeight: s.fontWeight };
            })
          };
        });
        report.summary.checked += result.controls.length;
        if (result.scrollWidth > result.clientWidth + 1) report.summary.horizontalOverflow++;
        const findings = [];
        for (const c of result.controls) {
          const fg = parseRgb(c.color), bg = parseRgb(c.bg), ratio = contrast(fg, bg);
          if (!c.text) { report.summary.missingText++; findings.push({ type: 'missing-text', file, viewport: vp.name, element: c }); continue; }
          if (c.width < 44 || c.height < 36) { report.summary.tinyTargets++; findings.push({ type: 'small-target', file, viewport: vp.name, element: c }); }
          if (ratio !== null && ratio < 4.5 && !(parseFloat(c.fontSize) >= 18 || (parseFloat(c.fontSize) >= 14 && /^(bold|[7-9]00)$/.test(c.fontWeight)))) {
            report.summary.lowContrast++; findings.push({ type: 'low-contrast', ratio: Math.round(ratio * 100) / 100, file, viewport: vp.name, element: c });
          }
        }
        if (result.scrollWidth > result.clientWidth + 1) findings.push({ type: 'horizontal-overflow', file, viewport: vp.name, scrollWidth: result.scrollWidth, clientWidth: result.clientWidth });
        report.findings.push(...findings);
      } catch (err) {
        report.findings.push({ type: 'page-error', file, viewport: vp.name, error: String(err.message || err) });
      } finally { await page.close(); }
    }
  }
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  const out = path.join(ROOT, 'relatorios', 'auditoria-contraste-resultado.json');
  const md = path.join(ROOT, 'relatorios', 'auditoria-contraste-resultado.md');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  const grouped = {};
  for (const f of report.findings) { const k = `${f.type}|${f.file}|${f.element?.cls || f.element?.id || f.element?.tag || ''}|${f.element?.text || ''}`; grouped[k] = f; }
  const lines = [
    '# Auditoria de contraste e controles', '',
    `Data: ${report.generatedAt}`, '',
    '| Métrica | Resultado |', '|---|---:|',
    `| Controles visíveis analisados | ${report.summary.checked} |`,
    `| Contrastes abaixo do alvo | ${report.summary.lowContrast} |`,
    `| Alvos de toque reduzidos | ${report.summary.tinyTargets} |`,
    `| Controles sem texto acessível | ${report.summary.missingText} |`,
    `| Viewports com overflow horizontal | ${report.summary.horizontalOverflow} |`, '',
    '## Ocorrências priorizadas', ''
  ];
  for (const f of Object.values(grouped).slice(0, 250)) {
    if (f.type === 'low-contrast') lines.push(`- **Baixo contraste ${f.ratio}:1** — ${f.file} — ${f.viewport} — \\`${f.element.tag}.${f.element.cls || ''}#${f.element.id || ''}\\` — “${f.element.text}” — foreground ${f.element.color}, fundo ${f.element.bg}`);
    else if (f.type === 'small-target') lines.push(`- **Alvo pequeno ${f.element.width}×${f.element.height}px** — ${f.file} — ${f.viewport} — “${f.element.text}”`);
    else if (f.type === 'missing-text') lines.push(`- **Sem texto acessível** — ${f.file} — ${f.viewport} — \\`${f.element.tag}.${f.element.cls || ''}#${f.element.id || ''}\\``);
    else if (f.type === 'horizontal-overflow') lines.push(`- **Overflow horizontal** — ${f.file} — ${f.viewport} — scrollWidth ${f.scrollWidth}px / viewport ${f.clientWidth}px`);
  }
  fs.writeFileSync(md, lines.join('\n') + '\n');
  console.log(`Auditoria concluída: ${md}`);
  console.log(JSON.stringify(report.summary));
})();
