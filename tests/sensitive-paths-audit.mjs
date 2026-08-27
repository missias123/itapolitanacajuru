import assert from 'node:assert/strict';

const baseUrl = (process.env.AUDIT_BASE_URL || 'https://itapolitanacajuru.com.br').replace(/\/$/, '');
const cachebuster = process.env.AUDIT_CACHEBUSTER || `exposure-audit-${Date.now()}`;
const sensitivePaths = [
  '/dados/auth.json',
  '/dados/clientes.json',
  '/dados/pedidos.json',
  '/dados/encomendas.json',
  '/dados/submissoes_encomendas.json',
  '/dados/fidelidade.json',
  '/dados/carrinhos_abandonados.json',
];
const publicPaths = ['/dados/produtos.json', '/'];

async function headPath(path) {
  const url = `${baseUrl}${path}?${cachebuster}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    });
    return {
      path,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      location: response.headers.get('location') || '',
    };
  } finally {
    clearTimeout(timeout);
  }
}

const results = [];
for (const path of sensitivePaths) {
  const result = await headPath(path);
  results.push({ category: 'sensitive', ...result });
  assert.ok(
    [403, 404, 410].includes(result.status),
    `${path} expected 403/404/410, got ${result.status} (${result.contentType})`,
  );
  assert.equal(
    result.contentType.toLowerCase().includes('application/json'),
    false,
    `${path} must not advertise application/json when blocked`,
  );
}

for (const path of publicPaths) {
  const result = await headPath(path);
  results.push({ category: 'public', ...result });
  assert.equal(result.status, 200, `${path} expected HTTP 200, got ${result.status}`);
}

console.log(JSON.stringify({
  baseUrl,
  cachebuster,
  bodyRead: false,
  results,
}, null, 2));
