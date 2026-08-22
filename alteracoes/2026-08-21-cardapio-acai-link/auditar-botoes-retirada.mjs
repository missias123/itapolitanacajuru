import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/index.html?auditoria-botoes=automatica';
const reportPath = process.argv[3] || '/home/ubuntu/itapolitanacajuru-source/alteracoes/2026-08-21-cardapio-acai-link/resultado-auditoria-botoes.json';

function render(url) {
  return execFileSync('chromium', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--ignore-certificate-errors', '--virtual-time-budget=8000', '--dump-dom', url
  ], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

function attribute(source, name) {
  const match = source.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return match ? match[1] : '';
}

function text(source) {
  return source.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const indexHtml = render(baseUrl);
const visibleHtml = indexHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const anchors = [...visibleHtml.matchAll(/<a\b([\s\S]*?)>([\s\S]*?)<\/a>/gi)].map((match) => ({
  raw: match[1], text: text(match[2]), href: attribute(match[1], 'href'), className: attribute(match[1], 'class'), sku: attribute(match[1], 'data-sku')
}));

const productButtons = anchors.filter((anchor) => anchor.className.split(/\s+/).includes('product-pickup-btn'));
const directLinks = anchors.filter((anchor) => /retirada\.html/i.test(anchor.href) && !anchor.className.split(/\s+/).includes('product-pickup-btn'));
const audited = productButtons.map((button) => {
  const skuInHref = new URL(button.href, baseUrl).searchParams.get('sku') || '';
  const expectedFragment = /#catalogo(?:&demo-retirada=aberta)?$/;
  const issues = [];
  if (!button.sku) issues.push('SKU ausente no botão');
  if (!skuInHref) issues.push('SKU ausente no destino');
  if (button.sku && skuInHref && button.sku !== skuInHref) issues.push('SKU do botão difere do destino');
  if (!/retirada\.html|\/retirada(?:[?#]|$)/i.test(button.href)) issues.push('Destino não é a página de retirada');
  if (!expectedFragment.test(button.href)) issues.push('Fragmento #catalogo ausente');
  if (!/Peça e retire na loja/i.test(button.text)) issues.push('Rótulo fora do padrão');
  return { sku: button.sku, href: button.href, texto: button.text, aprovado: issues.length === 0, issues };
});

const invalid = audited.filter((item) => !item.aprovado);
const destinationStatus = [];
for (const item of audited) {
  try {
    const page = render(new URL(item.href, baseUrl).href);
    destinationStatus.push({ sku: item.sku, abrePagina: /Escolha seus produtos para retirar na loja/i.test(page) });
  } catch {
    destinationStatus.push({ sku: item.sku, abrePagina: false });
  }
}

const failedDestinations = destinationStatus.filter((item) => !item.abrePagina);
const report = {
  origem: baseUrl,
  totalBotoesInternos: audited.length,
  botoesAprovados: audited.length - invalid.length,
  botoesComFalha: invalid.length,
  linksDiretosForaDoCardapio: directLinks.map((item) => ({ href: item.href, texto: item.text, classe: item.className })),
  destinosTestados: destinationStatus.length,
  destinosComFalha: failedDestinations.length,
  falhasDeVinculo: invalid,
  falhasDeDestino: failedDestinations,
  botoes: audited
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  totalBotoesInternos: report.totalBotoesInternos,
  botoesComFalha: report.botoesComFalha,
  linksDiretosForaDoCardapio: report.linksDiretosForaDoCardapio.length,
  destinosTestados: report.destinosTestados,
  destinosComFalha: report.destinosComFalha,
  relatorio: reportPath
}, null, 2));
