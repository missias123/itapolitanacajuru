/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const fidelidadePath = path.join(repoRoot, 'dados', 'fidelidade.json');
  const outPath =
    process.argv[2] ||
    path.join(repoRoot, 'docs', 'relatorios', 'etiquetas-fidelidade-exemplo.pdf');

  const fidelidade = JSON.parse(fs.readFileSync(fidelidadePath, 'utf8'));
  const codigosObj = fidelidade.códigos || fidelidade.codigos || {};
  const codigos = Object.keys(codigosObj).slice(0, 10);

  if (!codigos.length) {
    throw new Error('Nenhum código encontrado em dados/fidelidade.json');
  }

  const ETQ_W = 99.0;
  const ETQ_H = 55.8;
  const COLS = 2;
  const ROWS = 5;
  const GAP_COL = 2.0;
  const GAP_ROW = 2.0;
  const A4_W = 210;
  const A4_H = 297;
  const totalW = (COLS * ETQ_W) + ((COLS - 1) * GAP_COL);
  const totalH = (ROWS * ETQ_H) + ((ROWS - 1) * GAP_ROW);
  const marginX = (A4_W - totalW) / 2;
  const marginY = (A4_H - totalH) / 2;

  const items = Array.from({ length: COLS * ROWS }, (_, i) => codigos[i] || '');
  const etiquetas = items
    .map((c) => `<div class="etq"><div class="cod">${htmlEscape(c)}</div></div>`)
    .join('');

  const html = `<!doctype html>
<html lang="pt-BR"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Etiquetas Fidelidade — Exemplo</title>
  <style>
    @page{ size:A4; margin:0 }
    html,body{ margin:0; padding:0; }
    body{ width:${A4_W}mm; height:${A4_H}mm; }
    .folha{
      width:${A4_W}mm;
      height:${A4_H}mm;
      padding:${marginY}mm ${marginX}mm;
      box-sizing:border-box;
      background:#fff;
    }
    .grid{
      display:grid;
      grid-template-columns:repeat(${COLS}, ${ETQ_W}mm);
      grid-template-rows:repeat(${ROWS}, ${ETQ_H}mm);
      gap:${GAP_ROW}mm ${GAP_COL}mm;
    }
    .etq{
      border:0.25mm solid #d0d0d0;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:6mm;
      box-sizing:border-box;
      color:#141414;
    }
    .cod{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-weight:900;
      font-size:22pt;
      letter-spacing:.4pt;
      text-align:center;
      width:100%;
      overflow:hidden;
      white-space:nowrap;
      text-overflow:ellipsis;
    }
  </style>
</head><body>
  <div class="folha">
    <div class="grid">${etiquetas}</div>
  </div>
</body></html>`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  });
  await browser.close();

  console.log(`OK: PDF gerado em ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

