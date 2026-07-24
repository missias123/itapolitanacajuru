/**
 * production-guard.test.mjs
 *
 * Testa que /api/admin/pbkdf2-selftest e /api/admin/generate-hash retornam
 * 403 quando ENVIRONMENT=production, conforme exigido pelo relatório de auditoria.
 *
 * Execução: node --test cloudflare-worker/tests/production-guard.test.mjs
 * (a partir da raiz do repositório)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, '..', 'src', 'index.js');

// Importa o worker como ES module
const worker = await import(workerPath);

/**
 * Ambiente mínimo com ENVIRONMENT=production.
 * Os KV namespaces são objetos truthy para passar o guard de startup.
 * Nenhum método KV é chamado para esses endpoints em produção
 * (a verificação de ambiente ocorre antes de qualquer acesso ao KV).
 */
function makeProductionEnv() {
  return {
    CLIENTES_KV:   {},
    ENCOMENDAS_KV: {},
    RATE_KV:       {},
    ENVIRONMENT:   'production',
  };
}

/**
 * Cria um Request simulando uma chamada POST ao worker.
 */
function makePostRequest(path) {
  return new Request(`https://api.itapolitanacajuru.com.br${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setup_key: 'qualquer-valor' }),
  });
}

// ──────────────────────────────────────────────────────────────────────────────

test('POST /api/admin/pbkdf2-selftest retorna 403 em produção', async () => {
  const req = makePostRequest('/api/admin/pbkdf2-selftest');
  const env = makeProductionEnv();

  const resp = await worker.default.fetch(req, env);

  assert.equal(
    resp.status,
    403,
    `Esperado 403, recebido ${resp.status}. ` +
    'O endpoint pbkdf2-selftest deve ser bloqueado em produção.'
  );

  const body = await resp.json();
  assert.equal(body.ok, false, 'Campo ok deve ser false em produção');
  assert.ok(
    typeof body.error === 'string' && body.error.length > 0,
    'Campo error deve conter mensagem explicativa'
  );
});

test('POST /api/admin/generate-hash retorna 403 em produção', async () => {
  const req = makePostRequest('/api/admin/generate-hash');
  const env = makeProductionEnv();

  const resp = await worker.default.fetch(req, env);

  assert.equal(
    resp.status,
    403,
    `Esperado 403, recebido ${resp.status}. ` +
    'O endpoint generate-hash deve ser bloqueado em produção.'
  );

  const body = await resp.json();
  assert.equal(body.ok, false, 'Campo ok deve ser false em produção');
  assert.ok(
    typeof body.error === 'string' && body.error.length > 0,
    'Campo error deve conter mensagem explicativa'
  );
});

test('GET /api/admin/pbkdf2-selftest retorna 404 (método não mapeado)', async () => {
  const req = new Request('https://api.itapolitanacajuru.com.br/api/admin/pbkdf2-selftest', {
    method: 'GET',
  });
  const env = makeProductionEnv();

  const resp = await worker.default.fetch(req, env);

  // Método GET não é mapeado para esse endpoint — deve cair no fallback 404
  assert.equal(
    resp.status,
    404,
    `Esperado 404 para GET, recebido ${resp.status}.`
  );
});

test('GET /api/admin/generate-hash retorna 404 (método não mapeado)', async () => {
  const req = new Request('https://api.itapolitanacajuru.com.br/api/admin/generate-hash', {
    method: 'GET',
  });
  const env = makeProductionEnv();

  const resp = await worker.default.fetch(req, env);

  assert.equal(
    resp.status,
    404,
    `Esperado 404 para GET, recebido ${resp.status}.`
  );
});

test('POST /api/admin/pbkdf2-selftest retorna 200 em staging (smoke test)', async () => {
  const env = {
    CLIENTES_KV:   {},
    ENCOMENDAS_KV: {},
    RATE_KV: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    ENVIRONMENT: 'staging',
    SETUP_KEY:   'chave-de-teste-staging',
  };

  const req = new Request('https://staging.itapolitanacajuru.com.br/api/admin/pbkdf2-selftest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '127.0.0.1',
    },
    body: JSON.stringify({ setup_key: 'chave-de-teste-staging', iterations: 100000, samples: 1 }),
  });

  const resp = await worker.default.fetch(req, env);

  assert.equal(
    resp.status,
    200,
    `Esperado 200 em staging, recebido ${resp.status}. ` +
    'O endpoint deve funcionar normalmente em staging.'
  );

  const body = await resp.json();
  assert.equal(body.ok, true, 'Campo ok deve ser true em staging');
  assert.equal(body.algorithm, 'PBKDF2-HMAC-SHA-256', 'Algoritmo deve ser PBKDF2-HMAC-SHA-256');
  assert.equal(body.environment, 'staging', 'Ambiente reportado deve ser staging');
});
