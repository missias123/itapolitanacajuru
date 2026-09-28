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
  "function invalidarTokenGitHub(msg='⚠️ Token GitHub expirado. Informe um novo token para continuar editando.'){"
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
  const sessionStorage = new Map();
  const context = {
    ITAP_WORKER_API: workerOverride,
    window: { ITAP_WORKER_API: workerOverride, location: { origin } },
    console,
    fetchWithTimeout: fetchImpl,
    ssGet: (key) => sessionStorage.get(key) || '',
    ssSet: (key, value) => { sessionStorage.set(key, String(value)); return true; },
    ssRemove: (key) => { sessionStorage.delete(key); return true; },
  };
  vm.createContext(context);
  vm.runInContext(`
${workerBaseSource}
this.getWorkerApiBases = getWorkerApiBases;
this.getCurrentWorkerApiBase = getCurrentWorkerApiBase;
this.iniciarSessaoWorkerComSenha = iniciarSessaoWorkerComSenha;
this.atualizarTokenGitHubDaSessaoWorker = atualizarTokenGitHubDaSessaoWorker;
`, context);
  return { context, sessionStorage };
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
  const { context, sessionStorage } = loadAdminAuthContext({
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
  assert.equal(sessionStorage.get('itap_worker_session_token'), 'sessao-ok');
  assert.equal(sessionStorage.get('itap_worker_api_base'), 'https://api.itapolitanacajuru.com.br');
  assert.equal(context.getCurrentWorkerApiBase(), 'https://api.itapolitanacajuru.com.br');
  assert.deepEqual(calls, [
    'https://worker-quebrado.example/api/admin/session',
    'https://worker-quebrado.example/api/admin/auth',
    'https://api.itapolitanacajuru.com.br/api/admin/session',
  ]);
}

{
  const calls = [];
  const { context } = loadAdminAuthContext({
    workerOverride: 'https://worker-quebrado.example',
    origin: 'https://painel.example',
    fetchImpl: async (url, init) => {
      calls.push({ url, headers: init?.headers || {}, body: init?.body || '' });
      if (url === 'https://worker-quebrado.example/api/admin/session') return jsonResponse(404, { ok: false, error: 'Rota ausente' });
      if (url === 'https://worker-quebrado.example/api/admin/auth') return jsonResponse(404, { ok: false, error: 'Rota ausente' });
      if (url === 'https://api.itapolitanacajuru.com.br/api/admin/session') return jsonResponse(200, { ok: true, token: 'sessao-ok', githubTokenConfigured: false });
      if (url === 'https://api.itapolitanacajuru.com.br/api/admin/session/github-token') return jsonResponse(200, { ok: true, githubTokenConfigured: true });
      throw new Error(`URL inesperada no teste: ${url}`);
    },
  });

  const login = await context.iniciarSessaoWorkerComSenha('senha-teste', '', 'missiasdoval');
  assert.equal(login.ok, true);
  const sync = await context.atualizarTokenGitHubDaSessaoWorker('ghp_valido_teste');
  assert.equal(sync.ok, true);
  assert.deepEqual(calls.map((entry) => entry.url), [
    'https://worker-quebrado.example/api/admin/session',
    'https://worker-quebrado.example/api/admin/auth',
    'https://api.itapolitanacajuru.com.br/api/admin/session',
    'https://api.itapolitanacajuru.com.br/api/admin/session/github-token',
  ]);
  assert.equal(calls.at(-1)?.headers?.['X-Itap-Session-Token'], 'sessao-ok');
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
