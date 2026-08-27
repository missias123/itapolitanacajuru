/**
 * production-guard.test.mjs
 *
 * Valida que os endpoints de setup (/api/admin/pbkdf2-selftest e
 * /api/admin/generate-hash) são protegidos em produção e funcionam
 * corretamente em staging/local, conforme auditoria de segurança.
 *
 * Cobre também /api/admin/session e /api/admin/github-file conforme
 * relatório de auditoria (seções 4–6).
 *
 * Execução: node --test tests/production-guard.test.mjs
 * (a partir de cloudflare-worker/ ou da raiz do repositório)
 *
 * Nenhum secret real é usado neste arquivo.
 * Nenhum dado de cliente, pedido, produto ou preço é alterado.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, '..', 'src', 'index.js');

const worker = await import(workerPath);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers de ambiente
// ──────────────────────────────────────────────────────────────────────────────

const TEST_SETUP_KEY = 'setup-key-teste-nao-real-1234567890';

/**
 * Cria um mock de RATE_KV que simula comportamento stateful mínimo.
 * Nenhum dado real é persistido.
 */
function makeRateKv(sessionValid = false, sessionToken = 'tok-valido-teste') {
  const store = {};
  if (sessionValid) store[`session:${sessionToken}`] = '1';
  return {
    get: async (key) => {
      if (key in store) return store[key];
      return null;
    },
    put: async (key, val) => { store[key] = val; },
    delete: async (key) => { delete store[key]; },
  };
}

function makeEnv(envName, extras = {}) {
  return {
    CLIENTES_KV:   {},
    ENCOMENDAS_KV: {},
    RATE_KV:       makeRateKv(),
    ENVIRONMENT:   envName,
    ...extras,
  };
}

function makeStagingEnv(extras = {}) {
  return makeEnv('staging', { SETUP_KEY: TEST_SETUP_KEY, ...extras });
}

function makeLocalEnv(extras = {}) {
  return makeEnv('local', { SETUP_KEY: TEST_SETUP_KEY, ...extras });
}

function makeProductionEnv(extras = {}) {
  return makeEnv('production', extras);
}

function makeReq(path, method = 'POST', body = null, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '127.0.0.1', ...headers },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  return new Request(`https://worker.test${path}`, opts);
}

async function fetchWorker(path, method, body, env, headers = {}) {
  const req = makeReq(path, method, body, headers);
  return worker.default.fetch(req, env);
}

// Verifica que nenhum campo sensível está presente no corpo da resposta
async function assertNoSecrets(resp) {
  const clone = resp.clone();
  const text = await clone.text();
  const lower = text.toLowerCase();
  const forbidden = ['admin_hash', 'admin_salt', 'admin_secret', 'setup_key', 'github_token'];
  for (const f of forbidden) {
    // allow keys that describe the format but not actual values — just assert raw secrets aren't exposed
    // (field names themselves appear in format descriptions; check for actual values isn't feasible here
    //  but we confirm no production-credential-revealing field appears unexpectedly)
    assert.ok(!lower.includes(`"${f}"`), `Resposta não deve expor campo sensível: ${f}`);
  }
  return text;
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. GUARDS DE PRODUÇÃO — pbkdf2-selftest
// ──────────────────────────────────────────────────────────────────────────────

describe('/api/admin/pbkdf2-selftest', () => {

  test('POST retorna 403 em production', async () => {
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY }, makeProductionEnv({ SETUP_KEY: TEST_SETUP_KEY }));
    assert.equal(resp.status, 403);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  for (const envName of [undefined, 'unknown', 'preview']) {
    test(`POST retorna 403 com ENVIRONMENT=${String(envName)}`, async () => {
      const env = makeEnv(envName, { SETUP_KEY: TEST_SETUP_KEY });
      const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
        { setup_key: TEST_SETUP_KEY, iterations: 100000, samples: 1 }, env);
      assert.equal(resp.status, 403);
      const body = await resp.json();
      assert.equal(body.ok, false);
    });
  }

  test('GET retorna 404 (método não mapeado) em production', async () => {
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'GET', null, makeProductionEnv());
    assert.equal(resp.status, 404);
  });

  test('POST sem SETUP_KEY retorna 401 em staging', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: '' }, env);
    assert.equal(resp.status, 401);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  test('POST com SETUP_KEY incorreta retorna 401 em staging', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: 'chave-errada' }, env);
    assert.equal(resp.status, 401);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  test('POST com corpo inválido retorna 400 em staging', async () => {
    const env = makeStagingEnv();
    const req = new Request('https://worker.test/api/admin/pbkdf2-selftest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '127.0.0.1' },
      body: 'INVALID_JSON{{{',
    });
    const resp = await worker.default.fetch(req, env);
    assert.equal(resp.status, 400);
  });

  test('POST com samples inválido retorna 400 em staging', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, samples: 99 }, env);
    assert.equal(resp.status, 400);
  });

  test('POST retorna 200 em staging com SETUP_KEY correta', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, iterations: 100000, samples: 1 }, env);
    assert.equal(resp.status, 200);
    // Lê o texto uma única vez para reutilização
    const text = await resp.text();
    const body = JSON.parse(text);
    assert.equal(body.ok, true);
    assert.equal(body.algorithm, 'PBKDF2-HMAC-SHA-256');
    assert.equal(body.environment, 'staging');
    assert.equal(body.iterations, 100000);
    assert.ok(Array.isArray(body.timingsMs));
    // Resposta não deve conter campos sensíveis
    const lower = text.toLowerCase();
    for (const f of ['admin_hash', 'admin_salt', 'admin_secret', 'setup_key', 'github_token']) {
      assert.ok(!lower.includes(`"${f}"`), `Resposta não deve expor campo sensível: ${f}`);
    }
  });

  test('POST retorna 200 em local com SETUP_KEY correta', async () => {
    const env = makeLocalEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, iterations: 100000, samples: 1 }, env);
    assert.equal(resp.status, 200);
    const body = await resp.json();
    assert.equal(body.ok, true);
    assert.equal(body.environment, 'local');
  });

  test('Resposta de sucesso não expõe secrets', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, iterations: 100000, samples: 1 }, env);
    await assertNoSecrets(resp);
  });

});

// ──────────────────────────────────────────────────────────────────────────────
// 2. GUARDS DE PRODUÇÃO — generate-hash
// ──────────────────────────────────────────────────────────────────────────────

describe('/api/admin/generate-hash', () => {

  test('POST retorna 403 em production', async () => {
    const resp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'SenhaSegura1234567890' },
      makeProductionEnv({ SETUP_KEY: TEST_SETUP_KEY }));
    assert.equal(resp.status, 403);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  for (const envName of [undefined, 'unknown', 'preview']) {
    test(`POST retorna 403 com ENVIRONMENT=${String(envName)}`, async () => {
      const env = makeEnv(envName, { SETUP_KEY: TEST_SETUP_KEY });
      const resp = await fetchWorker('/api/admin/generate-hash', 'POST',
        { setup_key: TEST_SETUP_KEY, password: 'SenhaSegura1234567890' }, env);
      assert.equal(resp.status, 403);
      const body = await resp.json();
      assert.equal(body.ok, false);
    });
  }

  test('GET retorna 404 (método não mapeado) em production', async () => {
    const resp = await fetchWorker('/api/admin/generate-hash', 'GET', null, makeProductionEnv());
    assert.equal(resp.status, 404);
  });

  test('POST sem SETUP_KEY retorna 401 em staging', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: '', password: 'SenhaSegura1234567890' }, env);
    assert.equal(resp.status, 401);
  });

  test('POST com SETUP_KEY incorreta retorna 401 em staging', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: 'errada', password: 'SenhaSegura1234567890' }, env);
    assert.equal(resp.status, 401);
  });

  test('POST com senha curta (< 16 chars) retorna 400 em staging', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'curta' }, env);
    assert.equal(resp.status, 400);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  test('POST com corpo inválido retorna 400 em staging', async () => {
    const env = makeStagingEnv();
    const req = new Request('https://worker.test/api/admin/generate-hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '127.0.0.1' },
      body: '{nao-e-json',
    });
    const resp = await worker.default.fetch(req, env);
    assert.equal(resp.status, 400);
  });

  test('POST retorna 200 em staging e inclui ADMIN_PASSWORD_RECORD', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'SenhaDeTesteSegura1234567890' }, env);
    assert.equal(resp.status, 200);
    const body = await resp.json();
    assert.equal(body.ok, true);
    assert.ok(typeof body.ADMIN_PASSWORD_RECORD === 'string', 'ADMIN_PASSWORD_RECORD deve estar presente');
    // Valida o formato do record
    const record = body.ADMIN_PASSWORD_RECORD;
    assert.ok(record.startsWith('pbkdf2-sha256$v=1$iter='), `Formato inválido: ${record.slice(0, 60)}`);
    assert.ok(record.includes('$salt='), 'Record deve conter salt');
    assert.ok(record.includes('$hash='), 'Record deve conter hash');
  });

  test('Formato do ADMIN_PASSWORD_RECORD é pbkdf2-sha256$v=1$iter=...$salt=...$hash=...', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'SenhaDeTesteSegura1234567890' }, env);
    const body = await resp.json();
    const parts = body.ADMIN_PASSWORD_RECORD.split('$');
    assert.equal(parts.length, 5, 'Record deve ter exatamente 5 partes separadas por $');
    assert.equal(parts[0], 'pbkdf2-sha256');
    assert.equal(parts[1], 'v=1');
    assert.ok(parts[2].startsWith('iter='), 'Parte 3 deve ser iter=...');
    assert.ok(parts[3].startsWith('salt='), 'Parte 4 deve ser salt=...');
    assert.ok(parts[4].startsWith('hash='), 'Parte 5 deve ser hash=...');
    const iter = parseInt(parts[2].slice(5), 10);
    assert.ok(iter >= 100000, `Iterações devem ser >= 100000, recebeu ${iter}`);
  });

  test('Resposta de generate-hash não expõe campos sensíveis inesperados', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'SenhaDeTesteSegura1234567890' }, env);
    // O campo ADMIN_PASSWORD_RECORD pode aparecer (é o propósito do endpoint),
    // mas tokens de sessão e GITHUB_TOKEN nunca devem aparecer.
    const text = await resp.text();
    const lower = text.toLowerCase();
    assert.ok(!lower.includes('"github_token"'), 'github_token não deve aparecer na resposta');
    assert.ok(!lower.includes('"admin_secret"'), 'admin_secret não deve aparecer na resposta');
  });

});

// ──────────────────────────────────────────────────────────────────────────────
// 3. ADMIN SESSION — /api/admin/session e /api/admin/auth
// ──────────────────────────────────────────────────────────────────────────────

describe('/api/admin/session', () => {

  test('POST sem senha retorna 401', async () => {
    const env = makeProductionEnv({ ADMIN_SECRET: 'senha-de-teste-nao-real' });
    env.RATE_KV = makeRateKv();
    const resp = await fetchWorker('/api/admin/session', 'POST', { password: '' }, env);
    assert.equal(resp.status, 401);
  });

  test('POST com senha incorreta retorna 401', async () => {
    const env = makeProductionEnv({ ADMIN_SECRET: 'senha-correta-nao-real' });
    env.RATE_KV = makeRateKv();
    const resp = await fetchWorker('/api/admin/session', 'POST', { password: 'senha-errada' }, env);
    assert.equal(resp.status, 401);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  test('POST com senha correta (ADMIN_SECRET) retorna 200 e token', async () => {
    const env = makeProductionEnv({ ADMIN_SECRET: 'senhaCorretaTestesNaoReal' });
    env.RATE_KV = makeRateKv();
    const resp = await fetchWorker('/api/admin/session', 'POST',
      { password: 'senhaCorretaTestesNaoReal' }, env);
    assert.equal(resp.status, 200);
    const body = await resp.json();
    assert.equal(body.ok, true);
    assert.ok(typeof body.token === 'string' && body.token.length > 0, 'Deve retornar token');
    // Token não deve ser a própria senha
    assert.notEqual(body.token, 'senhaCorretaTestesNaoReal');
  });

  test('POST com corpo inválido retorna 400', async () => {
    const env = makeProductionEnv();
    env.RATE_KV = makeRateKv();
    const req = new Request('https://worker.test/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '127.0.0.1' },
      body: 'NAO_JSON',
    });
    const resp = await worker.default.fetch(req, env);
    assert.equal(resp.status, 400);
  });

  test('DELETE (logout) retorna 200 mesmo sem token', async () => {
    const env = makeProductionEnv();
    env.RATE_KV = makeRateKv();
    const req = new Request('https://worker.test/api/admin/session', {
      method: 'DELETE',
      headers: { 'CF-Connecting-IP': '127.0.0.1' },
    });
    const resp = await worker.default.fetch(req, env);
    assert.equal(resp.status, 200);
  });

  test('Resposta de login não expõe senha nem hash', async () => {
    const env = makeProductionEnv({ ADMIN_SECRET: 'senhaCorretaTestesNaoReal' });
    env.RATE_KV = makeRateKv();
    const resp = await fetchWorker('/api/admin/session', 'POST',
      { password: 'senhaCorretaTestesNaoReal' }, env);
    const text = await resp.text();
    const lower = text.toLowerCase();
    assert.ok(!lower.includes('senhacorreta'), 'Senha não deve aparecer na resposta');
  });

  test('Session com ADMIN_PASSWORD_RECORD válido retorna 200', async () => {
    // Gera um record válido em staging e usa no login em production
    const stagingEnv = makeStagingEnv();
    const genResp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'SenhaTestePBKDF2Valida1234' }, stagingEnv);
    const genBody = await genResp.json();
    const record = genBody.ADMIN_PASSWORD_RECORD;

    const loginEnv = makeProductionEnv({ ADMIN_PASSWORD_RECORD: record });
    loginEnv.RATE_KV = makeRateKv();
    const loginResp = await fetchWorker('/api/admin/session', 'POST',
      { password: 'SenhaTestePBKDF2Valida1234' }, loginEnv);
    assert.equal(loginResp.status, 200);
    const loginBody = await loginResp.json();
    assert.equal(loginBody.ok, true);
    assert.ok(typeof loginBody.token === 'string');
  });

  test('Session com ADMIN_PASSWORD_RECORD válido mas senha errada retorna 401', async () => {
    const stagingEnv = makeStagingEnv();
    const genResp = await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'SenhaCorretaPBKDF21234567' }, stagingEnv);
    const genBody = await genResp.json();
    const record = genBody.ADMIN_PASSWORD_RECORD;

    const loginEnv = makeProductionEnv({ ADMIN_PASSWORD_RECORD: record });
    loginEnv.RATE_KV = makeRateKv();
    const loginResp = await fetchWorker('/api/admin/session', 'POST',
      { password: 'SenhaErrada1234567890' }, loginEnv);
    assert.equal(loginResp.status, 401);
  });

  test('ADMIN_PASSWORD_RECORD malformado causa erro controlado (500)', async () => {
    const loginEnv = makeProductionEnv({
      ADMIN_PASSWORD_RECORD: 'malformado-sem-estrutura',
    });
    loginEnv.RATE_KV = makeRateKv();
    const loginResp = await fetchWorker('/api/admin/session', 'POST',
      { password: 'qualquer' }, loginEnv);
    // Deve retornar 500 (falha criptográfica tratada) sem expor detalhes internos
    assert.equal(loginResp.status, 500);
    const body = await loginResp.json();
    assert.equal(body.ok, false);
    // Mensagem de erro não deve expor o record em si
    const errText = JSON.stringify(body).toLowerCase();
    assert.ok(!errText.includes('malformado-sem-estrutura'), 'Erro não deve expor o record');
  });

});

// ──────────────────────────────────────────────────────────────────────────────
// 4. ADMIN GITHUB-FILE — /api/admin/github-file
// ──────────────────────────────────────────────────────────────────────────────

describe('/api/admin/github-file', () => {

  test('GET sem token de sessão retorna 401', async () => {
    const env = makeProductionEnv();
    env.RATE_KV = makeRateKv(false);
    const resp = await fetchWorker('/api/admin/github-file?path=dados/config.json', 'GET', null, env);
    assert.equal(resp.status, 401);
  });

  test('GET com token inválido retorna 401', async () => {
    const env = makeProductionEnv();
    env.RATE_KV = makeRateKv(false);
    const resp = await fetchWorker('/api/admin/github-file?path=dados/config.json', 'GET', null, env,
      { 'X-Itap-Session-Token': 'token-invalido-nao-real' });
    assert.equal(resp.status, 401);
  });

  test('PUT sem autenticação retorna 401', async () => {
    const env = makeProductionEnv();
    env.RATE_KV = makeRateKv(false);
    const resp = await fetchWorker('/api/admin/github-file', 'PUT', { path: 'dados/config.json', content: '{}' }, env);
    assert.equal(resp.status, 401);
  });

  test('GET com método POST retorna 404 (não mapeado)', async () => {
    const env = makeProductionEnv();
    env.RATE_KV = makeRateKv(false);
    const resp = await fetchWorker('/api/admin/github-file', 'POST', null, env);
    assert.equal(resp.status, 404);
  });

});

// ──────────────────────────────────────────────────────────────────────────────
// 5. PBKDF2 — VALIDAÇÃO DO ALGORITMO
// ──────────────────────────────────────────────────────────────────────────────

describe('PBKDF2 — validação do algoritmo via generate-hash + session', () => {

  test('Rejeita iterações inválidas (abaixo do mínimo)', async () => {
    // O guard de iterações é interno ao pbkdf2Derive; testamos via selftest
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, iterations: 99999, samples: 1 }, env);
    // Deve retornar 500 (pbkdf2Derive lança exceção) ou 400
    assert.ok([400, 500].includes(resp.status),
      `Status esperado 400 ou 500 para iterações inválidas, recebeu ${resp.status}`);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  test('Rejeita iterações acima do máximo', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, iterations: 2000000, samples: 1 }, env);
    assert.ok([400, 500].includes(resp.status));
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  test('Senha correta autentica com record gerado', async () => {
    const stagingEnv = makeStagingEnv();
    const { ADMIN_PASSWORD_RECORD } = await (await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'SenhaAlongadaParaTeste12345' }, stagingEnv)).json();

    const env = makeProductionEnv({ ADMIN_PASSWORD_RECORD });
    env.RATE_KV = makeRateKv();
    const resp = await fetchWorker('/api/admin/session', 'POST',
      { password: 'SenhaAlongadaParaTeste12345' }, env);
    assert.equal(resp.status, 200);
  });

  test('Senha incorreta é rejeitada com record válido', async () => {
    const stagingEnv = makeStagingEnv();
    const { ADMIN_PASSWORD_RECORD } = await (await fetchWorker('/api/admin/generate-hash', 'POST',
      { setup_key: TEST_SETUP_KEY, password: 'SenhaAlongadaParaTeste12345' }, stagingEnv)).json();

    const env = makeProductionEnv({ ADMIN_PASSWORD_RECORD });
    env.RATE_KV = makeRateKv();
    const resp = await fetchWorker('/api/admin/session', 'POST',
      { password: 'SenhaErradaCompletamente999' }, env);
    assert.equal(resp.status, 401);
  });

  test('Salt é diferente a cada chamada de generate-hash', async () => {
    const env = makeStagingEnv();
    const pw = 'SenhaParaTestarSalt12345678';
    const [b1, b2] = await Promise.all([
      fetchWorker('/api/admin/generate-hash', 'POST', { setup_key: TEST_SETUP_KEY, password: pw }, env)
        .then(r => r.json()),
      fetchWorker('/api/admin/generate-hash', 'POST', { setup_key: TEST_SETUP_KEY, password: pw }, env)
        .then(r => r.json()),
    ]);
    const salt1 = b1.ADMIN_PASSWORD_RECORD.split('$')[3];
    const salt2 = b2.ADMIN_PASSWORD_RECORD.split('$')[3];
    assert.notEqual(salt1, salt2, 'Cada geração deve usar um salt único');
  });

  test('Algoritmo reportado é PBKDF2-HMAC-SHA-256', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, iterations: 100000, samples: 1 }, env);
    const body = await resp.json();
    assert.equal(body.algorithm, 'PBKDF2-HMAC-SHA-256');
  });

  test('Número de iterações retornado corresponde ao solicitado', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, iterations: 100000, samples: 1 }, env);
    const body = await resp.json();
    assert.equal(body.iterations, 100000);
  });

  test('Selftest retorna tempo de execução (timingsMs)', async () => {
    const env = makeStagingEnv();
    const resp = await fetchWorker('/api/admin/pbkdf2-selftest', 'POST',
      { setup_key: TEST_SETUP_KEY, iterations: 100000, samples: 2 }, env);
    const body = await resp.json();
    assert.ok(Array.isArray(body.timingsMs));
    assert.equal(body.timingsMs.length, 2);
    assert.ok(body.timingsMs.every(t => typeof t === 'number' && t >= 0));
  });

});

// ──────────────────────────────────────────────────────────────────────────────
// 6. ROTAS PÚBLICAS E HEALTH CHECK
// ──────────────────────────────────────────────────────────────────────────────

describe('Rotas públicas e health check', () => {

  test('GET /api/health retorna 200 em production', async () => {
    const env = makeProductionEnv();
    env.RATE_KV = makeRateKv();
    const resp = await fetchWorker('/api/health', 'GET', null, env);
    assert.equal(resp.status, 200);
    const body = await resp.json();
    assert.equal(body.ok, true);
  });

  test('Rota inexistente retorna 404', async () => {
    const env = makeProductionEnv();
    env.RATE_KV = makeRateKv();
    const resp = await fetchWorker('/api/nao-existe-123', 'GET', null, env);
    assert.equal(resp.status, 404);
  });

  test('Startup guard: KV ausente retorna 500', async () => {
    const env = { ENVIRONMENT: 'production' }; // sem KVs
    const req = makeReq('/api/health', 'GET', null);
    const resp = await worker.default.fetch(req, env);
    assert.equal(resp.status, 500);
  });

});
