import test from 'node:test';
import assert from 'node:assert/strict';
import workerModule from '../src/index.js';

class MemoryKV {
  constructor() { this.map = new Map(); }
  async get(key, type) {
    if (!this.map.has(key)) return null;
    const value = this.map.get(key);
    if (type === 'json') {
      try { return JSON.parse(value); } catch { return null; }
    }
    return value;
  }
  async put(key, value) {
    this.map.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  async delete(key) { this.map.delete(key); }
  async list({ prefix = '' } = {}) {
    const keys = [...this.map.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name }));
    return { keys, list_complete: true };
  }
}

function createEnv(overrides = {}) {
  return {
    CLIENTES_KV: new MemoryKV(),
    ENCOMENDAS_KV: new MemoryKV(),
    RATE_KV: new MemoryKV(),
    PROMO_KV: new MemoryKV(),
    ADMIN_PASSWORD_RECORD: 'pbkdf2-sha256$v=1$iter=600000$salt=c2FsdC1zeW50ZXRpY28=$hash=0I0euSY8IT0fNf4s8kQWF3QoiAfQ7Z0xKikp9BfxPcg=',
    ADMIN_DEFAULT_PERMISSIONS: 'catalog:read,catalog:write,orders:read,orders:manage,campaign:read,campaign:configure,campaign:activate,reports:export,audit:read',
    GITHUB_TOKEN: 'token-sintetico',
    ...overrides,
  };
}

async function request(env, path, { method = 'GET', headers = {}, body } = {}) {
  const req = new Request(`https://api.itapolitanacajuru.com.br${path}`, {
    method,
    headers: {
      Origin: 'https://itapolitanacajuru.com.br',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const res = await workerModule.fetch(req, env);
  const json = await res.json();
  return { status: res.status, json };
}

test('bloqueia leitura de sync domains sem audit:read', async () => {
  const env = createEnv();
  await env.RATE_KV.put('session:t1', JSON.stringify({ permissions: ['catalog:read'], expiresAt: Date.now() + 60000 }));
  const { status, json } = await request(env, '/api/admin/sync/domains', {
    headers: { 'X-Itap-Session-Token': 't1' },
  });
  assert.equal(status, 403);
  assert.equal(json.requiredPermission, 'audit:read');
});

test('retorna 409 no PUT admin com ifMatch divergente', async () => {
  const env = createEnv();
  await env.RATE_KV.put('session:t2', JSON.stringify({ permissions: ['catalog:write'], expiresAt: Date.now() + 60000 }));

  const originalFetch = globalThis.fetch;
  let putCalled = false;
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    if (target.includes('/contents/dados/config.json') && (!options.method || options.method === 'GET')) {
      return new Response(JSON.stringify({ sha: 'sha-atual' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (target.includes('/contents/dados/config.json') && options.method === 'PUT') {
      putCalled = true;
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`URL inesperada: ${target}`);
  };

  try {
    const { status, json } = await request(env, '/api/admin/github-file', {
      method: 'PUT',
      headers: { 'X-Itap-Session-Token': 't2' },
      body: { path: 'dados/config.json', content: { ok: true }, ifMatch: 'sha-antigo' },
    });
    assert.equal(status, 409);
    assert.equal(json.code, 'VERSION_CONFLICT');
    assert.equal(putCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deduplica encomenda por idempotency key', async () => {
  const env = createEnv();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/dados/produtos.json')) {
      return new Response(JSON.stringify({
        cadastro_skus: { por_chave: { a: { sku: 'SKU-1', ativo: true } } },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`URL inesperada: ${String(url)}`);
  };

  try {
    const payload = {
      nome: 'Cliente Sintetico',
      telefone: '16912345678',
      itens: [{ sku: 'SKU-1', quantidade: 2 }],
      horario: '12:30',
      pagamento: 'presencial',
    };
    const headers = { 'X-Idempotency-Key': 'IDEMPOTENCY_TEST_KEY_2026' };
    const first = await request(env, '/api/encomendas', { method: 'POST', headers, body: payload });
    assert.equal(first.status, 201);
    const second = await request(env, '/api/encomendas', { method: 'POST', headers, body: payload });
    assert.equal(second.status, 200);
    assert.equal(second.json.idempotente, true);
    assert.equal(second.json.orderId, first.json.orderId);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('lista encomendas mascaradas por padrão e libera sensível só com manage', async () => {
  const env = createEnv();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/dados/produtos.json')) {
      return new Response(JSON.stringify({
        cadastro_skus: { por_chave: { a: { sku: 'SKU-1', ativo: true } } },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`URL inesperada: ${String(url)}`);
  };

  try {
    await request(env, '/api/encomendas', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': 'MASK_TEST_KEY_2026_ABCDE' },
      body: {
        nome: 'Maria Teste',
        telefone: '16912345678',
        itens: [{ sku: 'SKU-1', quantidade: 1 }],
      },
    });

    await env.RATE_KV.put('session:r1', JSON.stringify({ permissions: ['orders:read'], expiresAt: Date.now() + 60000 }));
    const readOnly = await request(env, '/api/encomendas?includeSensitive=true', {
      headers: { 'X-Itap-Session-Token': 'r1' },
    });
    assert.equal(readOnly.status, 200);
    assert.equal(readOnly.json.includeSensitive, false);
    assert.match(readOnly.json.encomendas[0].cliente.nome, /^M\*\*\*/);

    await env.RATE_KV.put('session:r2', JSON.stringify({ permissions: ['orders:read', 'orders:manage'], expiresAt: Date.now() + 60000 }));
    const manager = await request(env, '/api/encomendas?includeSensitive=true', {
      headers: { 'X-Itap-Session-Token': 'r2' },
    });
    assert.equal(manager.status, 200);
    assert.equal(manager.json.includeSensitive, true);
    assert.equal(manager.json.encomendas[0].cliente.nome, 'Maria Teste');
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('bloqueia login de cliente sem verificação adicional e não retorna PII', async () => {
  const env = createEnv();
  await env.CLIENTES_KV.put('cli:16912345678', JSON.stringify({
    cel: '16912345678',
    saldoPontos: 12,
    codigosUsados: ['ABC'],
  }));

  const { status, json } = await request(env, '/api/clientes/login', {
    method: 'POST',
    body: { cel: '16912345678' },
  });

  assert.equal(status, 403);
  assert.equal(json.code, 'ADDITIONAL_VERIFICATION_REQUIRED');
  assert.equal('cliente' in json, false);
});

test('busca pública do sorteio não expõe telefone nem metadata da inscrição', async () => {
  const env = createEnv();
  const loteMes = new Date().toISOString().slice(0, 7);
  const id = 'sorteio-test-001';
  await env.CLIENTES_KV.put(`sorteio:idx:nasc:${loteMes}:maria_teste__2000-01-02`, id);
  await env.CLIENTES_KV.put(`sorteio:inscrito:${id}`, JSON.stringify({
    phone: '16912345678',
    created_at: '2026-09-01T12:00:00.000Z',
  }));

  const response = await request(env, `/api/sorteio/buscar?nome=${encodeURIComponent('Maria Teste')}&dataNasc=2000-01-02`);

  assert.equal(response.status, 200);
  assert.equal(response.json.found, true);
  assert.equal('registration' in response.json, false);
  assert.equal(JSON.stringify(response.json).includes('16912345678'), false);
});


test('worker preserva formatação JSON com quebra de linha final ao salvar arquivo admin', async () => {
  const env = createEnv();
  await env.RATE_KV.put('session:t3', JSON.stringify({ permissions: ['catalog:write'], expiresAt: Date.now() + 60000 }));

  const originalFetch = globalThis.fetch;
  let savedBody = null;
  globalThis.fetch = async (url, options = {}) => {
    const target = String(url);
    if (target.includes('/contents/dados/produtos.json') && (!options.method || options.method === 'GET')) {
      return new Response(JSON.stringify({ sha: 'sha-produtos' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (target.includes('/contents/dados/produtos.json') && options.method === 'PUT') {
      savedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ content: { sha: 'sha-novo' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`URL inesperada: ${target}`);
  };

  try {
    const { status, json } = await request(env, '/api/admin/github-file', {
      method: 'PUT',
      headers: { 'X-Itap-Session-Token': 't3' },
      body: { path: 'dados/produtos.json', content: { ok: true } },
    });
    assert.equal(status, 200);
    assert.equal(json.ok, true);
    assert.ok(savedBody, 'PUT no GitHub deve ter sido executado');
    const decoded = Buffer.from(savedBody.content, 'base64').toString('utf8');
    assert.equal(decoded, `{
  "ok": true
}
`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
