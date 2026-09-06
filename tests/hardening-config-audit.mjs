import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function read(rel) {
  return readFile(join(root, rel), 'utf8');
}

const [headersFile, htaccessFile, workerSource, pkg] = await Promise.all([
  read('_headers'),
  read('.htaccess'),
  read('cloudflare-worker/src/index.js'),
  read('package.json'),
]);

assert.match(headersFile, /Strict-Transport-Security:\s*max-age=31536000; includeSubDomains; preload/i, '_headers deve aplicar HSTS forte');
assert.match(headersFile, /X-Permitted-Cross-Domain-Policies:\s*none/i, '_headers deve bloquear cross-domain policies legadas');
assert.match(headersFile, /Content-Security-Policy:.*frame-ancestors 'none';.*object-src 'none';.*base-uri 'self';.*form-action 'self' https:\/\/wa\.me;.*upgrade-insecure-requests/is, '_headers deve endurecer CSP pública');
assert.match(headersFile, /\/admin[\s\S]*?X-Robots-Tag:\s*noindex, nofollow, noarchive, nosnippet/is, '_headers deve marcar a rota curta do admin como noindex');
assert.match(headersFile, /\/admin-painel\.html[\s\S]*?Cache-Control:\s*no-store, no-cache, must-revalidate[\s\S]*?X-Robots-Tag:\s*noindex, nofollow, noarchive, nosnippet/is, '_headers deve impedir cache/indexação do admin-painel');
assert.match(headersFile, /\/admin-catalogo\.html[\s\S]*?connect-src 'self' https:\/\/api\.github\.com https:\/\/raw\.githubusercontent\.com https:\/\/api\.itapolitanacajuru\.com\.br/is, '_headers deve restringir connect-src administrativo');

assert.match(htaccessFile, /SetEnvIfNoCase Request_URI "\^\/admin\/\?\$" ITAP_ADMIN_SURFACE=1/i, '.htaccess deve identificar a rota curta do admin');
assert.match(htaccessFile, /SetEnvIfNoCase Request_URI "\^\/admin-\(painel\|catalogo\|picole\)\\\.html\$" ITAP_ADMIN_SURFACE=1/i, '.htaccess deve identificar páginas admin diretas');
assert.match(htaccessFile, /Header always set X-Robots-Tag "noindex, nofollow, noarchive, nosnippet" env=ITAP_ADMIN_SURFACE/i, '.htaccess deve bloquear indexação do admin');
assert.match(htaccessFile, /Header always set Content-Security-Policy "default-src 'self';[\s\S]*form-action 'self' https:\/\/wa\.me; upgrade-insecure-requests" env=!ITAP_ADMIN_SURFACE/i, '.htaccess deve ter CSP pública endurecida');
assert.match(htaccessFile, /Header always set Content-Security-Policy "default-src 'self';[\s\S]*connect-src 'self' https:\/\/api\.github\.com https:\/\/raw\.githubusercontent\.com https:\/\/api\.itapolitanacajuru\.com\.br[\s\S]*form-action 'self'; upgrade-insecure-requests" env=ITAP_ADMIN_SURFACE/i, '.htaccess deve ter CSP administrativa endurecida');

assert.match(workerSource, /'admin-read':\s*\{\s*max:\s*120,\s*windowMs:\s*3_600_000\s*\}/, 'worker deve limitar leitura administrativa');
assert.match(workerSource, /'admin-write':\s*\{\s*max:\s*30,\s*windowMs:\s*3_600_000\s*\}/, 'worker deve limitar escrita administrativa');
assert.match(workerSource, /checkRateLimit\(env, getClientIp\(request\), 'post-cliente'\)/, 'worker deve limitar cadastro de clientes');
assert.match(workerSource, /checkRateLimit\(env, getClientIp\(request\), 'login'\)/, 'worker deve limitar login de clientes');
assert.match(workerSource, /checkRateLimit\(env, getClientIp\(request\), 'post-enc'\)/, 'worker deve limitar envio de encomendas');
assert.match(workerSource, /checkRateLimit\(env, getClientIp\(request\), 'buscar-sorteio'\)/, 'worker deve limitar busca pública do sorteio');
assert.match(workerSource, /X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet'/, 'worker deve marcar a API como noindex');
assert.match(workerSource, /Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'/, 'worker deve aplicar HSTS forte');

assert.equal(pkg.includes('"audit:hardening-config": "node tests/hardening-config-audit.mjs"'), true, 'package.json deve expor a auditoria de endurecimento');

console.log('✅ Hardening config audit passed.');
