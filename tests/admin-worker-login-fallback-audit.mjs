import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const adminPanel = await readFile(join(root, 'admin-painel.html'), 'utf8');

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start);
  assert.ok(start >= 0 && end > start, `Trecho não encontrado: ${startNeedle} .. ${endNeedle}`);
  return source.slice(start, end).trim();
}

const workerBaseSource = sliceBetween(
  adminPanel,
  "const ITAP_WORKER_API_DEFAULT='https://api.itapolitanacajuru.com.br';",
  'const WORKER_SESSION_TOKEN_KEY='
);
const loginSource = sliceBetween(
  adminPanel,
  "async function iniciarSessaoWorkerComSenha(senha,githubToken='',username=''){",
  'function setLoginButtonStateLocked('
);

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => name.toLowerCase() === 'content-type' ? 'application/json' : '' },
    json: async () => body,
  };
}

function loadAdminAuthContext({ workerOverride = '', origin = 'https://site.example', fetchImpl }) {
  const savedTokens = [];
  const context = {
    ITAP_WORKER_API: workerOverride,
    window: { ITAP_WORKER_API: workerOverride, location: { origin } },
    console,
    fetchWithTimeout: fetchImpl,
    setWorkerSessionToken: (token) => savedTokens.push(token),
  };
  vm.createContext(context);
  vm.runInContext(`
${workerBaseSource}
${loginSource}
this.getWorkerApiBases = getWorkerApiBases;
this.iniciarSessaoWorkerComSenha = iniciarSessaoWorkerComSenha;
`, context);
  return { context, savedTokens };
}

{
  const { context } = loadAdminAuthContext({
    workerOverride: 'https://worker-custom.example///',
    origin: 'https://painel.example',
    fetchImpl: async () => { throw new Error('fetch não esperado neste cenário'); },
  });
  assert.deepEqual(
    Array.from(context.getWorkerApiBases()),
    ['https://worker-custom.example', 'https://api.itapolitanacajuru.com.br', 'https://painel.example']
  );
}

{
  const calls = [];
  const { context, savedTokens } = loadAdminAuthContext({
    workerOverride: 'https://worker-quebrado.example',
    origin: 'https://painel.example',
    fetchImpl: async (url) => {
      calls.push(url);
      if (url === 'https://worker-quebrado.example/api/admin/session') return jsonResponse(404, { ok: false, error: 'Rota ausente' });
      if (url === 'https://worker-quebrado.example/api/admin/auth') return jsonResponse(404, { ok: false, error: 'Rota ausente' });
      if (url === 'https://api.itapolitanacajuru.com.br/api/admin/session') return jsonResponse(200, { ok: true, token: 'sessao-ok', githubTokenConfigured: true });
      throw new Error(`URL inesperada no teste: ${url}`);
    },
  });

  const result = await context.iniciarSessaoWorkerComSenha('senha-teste', '', 'missiasdoval');
  assert.equal(result.ok, true);
  assert.equal(result.githubTokenConfigured, true);
  assert.deepEqual(savedTokens, ['sessao-ok']);
  assert.deepEqual(calls, [
    'https://worker-quebrado.example/api/admin/session',
    'https://worker-quebrado.example/api/admin/auth',
    'https://api.itapolitanacajuru.com.br/api/admin/session',
  ]);
}

{
  const { context } = loadAdminAuthContext({
    workerOverride: 'https://worker-quebrado.example',
    origin: 'https://painel.example',
    fetchImpl: async () => jsonResponse(404, { ok: false, error: 'Rota ausente' }),
  });

  const result = await context.iniciarSessaoWorkerComSenha('senha-teste', '', 'missiasdoval');
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'server');
  assert.equal(result.error, 'Endpoint administrativo indisponível no Worker.');
}

console.log('✅ Admin worker login fallback audit passed.');
