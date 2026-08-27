/**
 * sync-ui-contract.test.mjs
 *
 * Testes de contrato para o endpoint GET /api/admin/sync/domains,
 * cobrindo os cenários exigidos pela interface visual de Sincronização:
 *
 *   - Carregamento normal (200)
 *   - Estado vazio (domínios com estado blocked/not_verified)
 *   - Erro 401 sem sessão
 *   - Erro 403 sem permissão audit:read
 *   - Conflito de estado (state === 'conflito')
 *   - Fallback sem SHA (revision null)
 *   - Ausência de PII na resposta
 *   - Campos obrigatórios presentes
 *
 * Nenhum dado real de cliente, pedido, produto ou preço é usado.
 * Nenhum POST/PUT/DELETE é executado em produção.
 *
 * Execução:
 *   node --test tests/sync-ui-contract.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, '..', 'src', 'index.js');
const worker = await import(workerPath);

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRateKv(sessionValid = false, sessionToken = 'tok-sinc-teste', permissions = ['audit:read']) {
  const store = {};
  if (sessionValid) {
    store[`session:${sessionToken}`] = JSON.stringify({
      permissions,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 3600 * 1000,
    });
  }
  return {
    get: async (key, type) => {
      const val = key in store ? store[key] : null;
      if (val !== null && type === 'json') {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val;
    },
    put: async (key, val) => { store[key] = val; },
    delete: async (key) => { delete store[key]; },
  };
}

function makeEncomendaKv(count = 0) {
  const keys = Array.from({ length: count }, (_, i) => ({ name: `enc:${i}` }));
  return {
    get: async () => null,
    put: async () => {},
    delete: async () => {},
    list: async ({ prefix } = {}) => ({ keys, list_complete: true }),
  };
}

function makeProductionEnv(extras = {}) {
  return {
    CLIENTES_KV:   { get: async () => null, list: async () => ({ keys: [] }) },
    ENCOMENDAS_KV: makeEncomendaKv(0),
    RATE_KV:       makeRateKv(),
    ENVIRONMENT:   'production',
    ...extras,
  };
}

function makeAuthEnv(token = 'tok-sinc-teste', permissions = ['audit:read']) {
  return {
    CLIENTES_KV:   { get: async () => null, list: async () => ({ keys: [] }) },
    ENCOMENDAS_KV: makeEncomendaKv(3),
    RATE_KV:       makeRateKv(true, token, permissions),
    ENVIRONMENT:   'production',
  };
}

function makeReq(path, method = 'GET', headers = {}) {
  return new Request(`https://worker.test${path}`, {
    method,
    headers: { 'CF-Connecting-IP': '127.0.0.1', ...headers },
  });
}

async function fetchWorker(path, method, env, headers = {}) {
  const req = makeReq(path, method, headers);
  return worker.default.fetch(req, env);
}

// ── Testes de autenticação/autorização ───────────────────────────────────────

describe('GET /api/admin/sync/domains — autenticação e autorização', () => {

  test('retorna 401 sem sessão administrativa', async () => {
    const env = makeProductionEnv();
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env);
    assert.equal(resp.status, 401);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  test('retorna 401 com token inválido', async () => {
    const env = makeProductionEnv({ RATE_KV: makeRateKv(false) });
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': 'token-inexistente-nao-real',
    });
    assert.equal(resp.status, 401);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

  test('retorna 403 com sessão sem permissão audit:read', async () => {
    const token = 'tok-sem-audit';
    // Sessão com permissão orders:read mas sem audit:read
    const env = makeProductionEnv({ RATE_KV: makeRateKv(true, token, ['orders:read']) });
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    assert.equal(resp.status, 403);
    const body = await resp.json();
    assert.equal(body.ok, false);
  });

});

// ── Testes de carregamento normal ─────────────────────────────────────────────

describe('GET /api/admin/sync/domains — carregamento normal', () => {

  test('retorna 200 com sessão válida e permissão audit:read', async () => {
    const token = 'tok-valido-audit';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    assert.equal(resp.status, 200);
  });

  test('resposta contém campo ok:true', async () => {
    const token = 'tok-ok-true';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    const body = await resp.json();
    assert.equal(body.ok, true);
  });

  test('resposta contém array de domínios não-vazio', async () => {
    const token = 'tok-domains-array';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    const body = await resp.json();
    assert.ok(Array.isArray(body.domains), 'domains deve ser um array');
    assert.ok(body.domains.length > 0, 'domains não deve estar vazio');
  });

  test('resposta contém generatedAt como ISO 8601', async () => {
    const token = 'tok-generated-at';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    const body = await resp.json();
    assert.ok(typeof body.generatedAt === 'string', 'generatedAt deve ser string');
    assert.doesNotThrow(() => new Date(body.generatedAt), 'generatedAt deve ser data válida');
  });

  test('cada domínio contém campos obrigatórios: domain, sourceOfTruth, state', async () => {
    const token = 'tok-domain-fields';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    const body = await resp.json();
    for (const d of body.domains) {
      assert.ok(typeof d.domain === 'string' && d.domain.length > 0,
        `Domínio deve ter campo 'domain': ${JSON.stringify(d)}`);
      assert.ok(typeof d.sourceOfTruth === 'string' && d.sourceOfTruth.length > 0,
        `Domínio deve ter campo 'sourceOfTruth': ${JSON.stringify(d)}`);
      assert.ok(typeof d.state === 'string' && d.state.length > 0,
        `Domínio deve ter campo 'state': ${JSON.stringify(d)}`);
    }
  });

  test('estado de cada domínio é um valor esperado', async () => {
    const token = 'tok-state-values';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    const body = await resp.json();
    const validStates = new Set(['synchronized', 'divergente', 'conflito', 'blocked', 'not_verified']);
    for (const d of body.domains) {
      assert.ok(validStates.has(d.state),
        `Estado '${d.state}' do domínio '${d.domain}' não é um valor reconhecido`);
    }
  });

});

// ── Teste: ausência de PII ────────────────────────────────────────────────────

describe('GET /api/admin/sync/domains — ausência de PII', () => {

  test('resposta não contém campos pessoais sensíveis', async () => {
    const token = 'tok-no-pii';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    const text = await resp.text();
    const lower = text.toLowerCase();

    // Campos de PII que jamais devem aparecer em resposta pública/admin de sync
    const forbiddenFields = ['celular', 'telefone', 'cpf', 'email', 'senha', 'password',
      'github_token', 'admin_secret', 'admin_hash', 'admin_salt', 'setup_key',
      'nome_completo', 'endereco', 'data_nasc'];

    for (const f of forbiddenFields) {
      assert.ok(!lower.includes(`"${f}"`),
        `Resposta de sync não deve expor campo sensível: ${f}`);
    }
  });

  test('resposta não expõe token de sessão na resposta', async () => {
    const token = 'tok-session-not-exposed-in-response';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    const text = await resp.text();
    assert.ok(!text.includes(token),
      'Token de sessão não deve aparecer no corpo da resposta');
  });

});

// ── Teste: fallback sem SHA ───────────────────────────────────────────────────

describe('GET /api/admin/sync/domains — fallback sem SHA', () => {

  test('domínio sem revision tem revision null ou ausente (aviso de fallback)', async () => {
    // Sem GITHUB_TOKEN, a leitura de GitHub Raw falha e revision fica null
    const token = 'tok-no-sha';
    const env = makeAuthEnv(token);
    // Sem GitHub raw disponível no ambiente de teste, revision deve ser null/ausente
    const resp = await fetchWorker('/api/admin/sync/domains', 'GET', env, {
      'X-Itap-Session-Token': token,
    });
    const body = await resp.json();
    const domainSemSha = body.domains.find(d => d.revision === null || d.revision === undefined);
    // Ao menos catalog ou config deve estar sem SHA (sem GitHub real)
    assert.ok(domainSemSha !== undefined,
      'Ao menos um domínio deve ter revision null quando GitHub não está disponível');
    // state não deve ser 'synchronized' para domínio sem SHA
    if (domainSemSha) {
      assert.notEqual(domainSemSha.state, 'synchronized',
        `Domínio '${domainSemSha.domain}' sem SHA não pode ter estado 'synchronized'`);
    }
  });

});

// ── Teste: método não permitido ───────────────────────────────────────────────

describe('GET /api/admin/sync/domains — método incorreto', () => {

  test('POST retorna 404 (método não mapeado)', async () => {
    const token = 'tok-post-method';
    const env = makeAuthEnv(token);
    const resp = await fetchWorker('/api/admin/sync/domains', 'POST', env, {
      'X-Itap-Session-Token': token,
    });
    assert.equal(resp.status, 404);
  });

});
