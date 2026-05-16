/**
 * Itapolitana Cajuru — API Worker (Cloudflare Workers)
 *
 * Substitui a gravação direta no GitHub para dados PII:
 *   • clientes.json  → CLIENTES_KV
 *   • encomendas.json → ENCOMENDAS_KV
 *
 * fidelidade.json continua no GitHub para leitura pública (códigos não são PII),
 * mas as gravações (marcar código como usado) são feitas por este Worker usando
 * GITHUB_TOKEN armazenado como segredo no Cloudflare.
 *
 * Variáveis de ambiente obrigatórias (wrangler secret put):
 *   ADMIN_SECRET   — segredo compartilhado para rotas protegidas do admin
 *   GITHUB_TOKEN   — PAT do GitHub com escopo "repo" (para gravar fidelidade.json)
 *
 * KV Namespaces:
 *   CLIENTES_KV    — dados de clientes
 *   ENCOMENDAS_KV  — pedidos de encomenda
 *   RATE_KV        — contadores de rate-limit
 */

// ─── Origens permitidas para CORS ────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://itapolitanacajuru.com.br',
  'https://www.itapolitanacajuru.com.br',
  'https://missias123.github.io',
];

const GH_RAW  = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/';
const GH_API  = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/';
const GH_FIDELIDADE_PATH = 'dados/fidelidade.json';

const RATE_LIMITS = {
  'post-cliente':  { max: 10, windowMs: 3_600_000 },
  'login':         { max: 20, windowMs: 3_600_000 },
  'post-enc':      { max: 10, windowMs: 3_600_000 },
  'resgatar':      { max: 10, windowMs: 3_600_000 },
};
const MAX_FRAUD_ATTEMPTS = 4; // Block client after this many invalid code attempts

// ─── Entry point ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // CORS pre-flight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: buildCorsHeaders(origin) });
    }

    try {
      const resp = await router(request, env);
      return withCors(resp, origin);
    } catch (e) {
      return withCors(jsonResp({ ok: false, error: e.message }, 500), origin);
    }
  },
};

// ─── CORS helpers ─────────────────────────────────────────────────────────────
function buildCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Itap-Admin-Secret',
    'Access-Control-Max-Age':       '86400',
    'Vary':                         'Origin',
  };
}

function withCors(response, origin) {
  const r = new Response(response.body, response);
  const headers = buildCorsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}

// ─── Response helpers ─────────────────────────────────────────────────────────
function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function isAdmin(request, env) {
  const secret = request.headers.get('X-Itap-Admin-Secret') || '';
  return Boolean(secret && env.ADMIN_SECRET && secret === env.ADMIN_SECRET);
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
async function checkRateLimit(env, ip, key) {
  const cfg = RATE_LIMITS[key];
  if (!cfg) return { allowed: true };

  const rlKey   = `rl:${ip}:${key}`;
  const now     = Date.now();
  const raw     = await env.RATE_KV.get(rlKey, 'json');

  if (!raw || now - raw.window > cfg.windowMs) {
    await env.RATE_KV.put(rlKey, JSON.stringify({ count: 1, window: now }),
      { expirationTtl: Math.ceil(cfg.windowMs / 1000) * 2 });
    return { allowed: true, remaining: cfg.max - 1 };
  }
  if (raw.count >= cfg.max) {
    return { allowed: false, remaining: 0 };
  }
  raw.count += 1;
  await env.RATE_KV.put(rlKey, JSON.stringify(raw),
    { expirationTtl: Math.ceil(cfg.windowMs / 1000) * 2 });
  return { allowed: true, remaining: cfg.max - raw.count };
}

// ─── Input sanitization ───────────────────────────────────────────────────────
function sanitizeString(v, maxLen = 200) {
  return String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

function sanitizeItem(item) {
  return {
    nome:     sanitizeString(item.nome,     100),
    nomeTipo: sanitizeString(item.nomeTipo,  50),
    qtd:      Math.max(1, Math.min(1000, Number(item.qtd) || 1)),
    sabores:  Array.isArray(item.sabores)
      ? item.sabores.slice(0, 20).map(s => sanitizeString(s, 80))
      : [],
    preço:    Math.max(0, Number(item.preço ?? item.preco) || 0),
    tipo:     sanitizeString(item.tipo, 20),
  };
}

// ─── Base64 encode for GitHub API ─────────────────────────────────────────────
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary  = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ─── GitHub helper — write fidelidade.json ────────────────────────────────────
async function ghPutFidelidade(dadosFidelidade, mensagem, token) {
  // 1. Get current SHA
  const r1 = await fetch(GH_API + GH_FIDELIDADE_PATH, {
    headers: {
      Authorization: `token ${token}`,
      Accept:        'application/vnd.github.v3+json',
    },
  });
  if (!r1.ok) throw new Error(`GET fidelidade.json: HTTP ${r1.status}`);
  const meta    = await r1.json();
  const content = encodeBase64(JSON.stringify(dadosFidelidade, null, 2));

  // 2. Put updated content
  const r2 = await fetch(GH_API + GH_FIDELIDADE_PATH, {
    method:  'PUT',
    headers: {
      Authorization:  `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: mensagem, content, sha: meta.sha }),
  });
  if (!r2.ok) {
    const e = await r2.json().catch(() => ({}));
    throw new Error(e.message || `PUT fidelidade.json: HTTP ${r2.status}`);
  }
  return true;
}

// ─── KV helpers — client list index ─────────────────────────────────────────
async function getListaIds(env) {
  const raw = await env.CLIENTES_KV.get('meta:lista_ids');
  return raw ? JSON.parse(raw) : [];
}

async function setListaIds(env, lista) {
  await env.CLIENTES_KV.put('meta:lista_ids', JSON.stringify(lista));
}

async function getContador(env) {
  const raw = await env.CLIENTES_KV.get('meta:contador');
  return raw ? parseInt(raw, 10) : 0;
}

// ─── Identity matching ────────────────────────────────────────────────────────
function normNome(n) {
  return String(n ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function matchIdentidade(cliente, nome, dataNasc) {
  return normNome(cliente.nome) === normNome(nome) &&
    String(cliente.dataNasc ?? '').trim() === String(dataNasc ?? '').trim();
}

// Minimal public view of a client (no full history)
function sanitizarClientePublico(c) {
  return {
    id_permanente:  c.id_permanente,
    id_hash:        c.id_hash,
    nome:           c.nome,
    cel:            c.cel,
    saldoPontos:    c.saldoPontos    || 0,
    codigosUsados:  c.codigosUsados  || [],
    resgates:       c.resgates       || [],
    totalPremios:   c.totalPremios   || 0,
    totalCodigos:   c.totalCodigos   || 0,
    bloqueado:      c.bloqueado      || false,
  };
}

// ─── Audit log ────────────────────────────────────────────────────────────────
async function registrarAudit(env, operacao, recursoId, detalhes) {
  try {
    const key  = `audit:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
    const entry = { ts: new Date().toISOString(), op: operacao, id: recursoId, ...detalhes };
    await env.RATE_KV.put(key, JSON.stringify(entry), { expirationTtl: 86400 * 90 }); // 90 days
  } catch {
    // Audit failures are non-fatal
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
async function router(request, env) {
  const url    = new URL(request.url);
  const path   = url.pathname;
  const method = request.method;

  // Health check
  if (path === '/api/health' && method === 'GET') {
    return jsonResp({ ok: true, ts: Date.now(), version: '1.0.0' });
  }

  // ── Clientes ──────────────────────────────────────────────────────────────
  if (path === '/api/clientes' && method === 'POST')
    return handlePostCliente(request, env);

  if (path === '/api/clientes/login' && method === 'POST')
    return handleLoginCliente(request, env);

  if (path === '/api/clientes/bulk' && method === 'PUT') {
    if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleBulkPutClientes(request, env);
  }

  if (path === '/api/clientes' && method === 'GET') {
    if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleGetClientes(env);
  }

  const mCliente = path.match(/^\/api\/clientes\/([^/]+)$/);
  if (mCliente) {
    const id = decodeURIComponent(mCliente[1]);
    if (method === 'GET') {
      if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handleGetCliente(id, env);
    }
    if (method === 'PATCH') {
      if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handlePatchCliente(id, request, env);
    }
    if (method === 'DELETE') {
      if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handleDeleteCliente(id, env);
    }
  }

  // ── Encomendas ────────────────────────────────────────────────────────────
  if (path === '/api/encomendas' && method === 'POST')
    return handlePostEncomenda(request, env);

  if (path === '/api/encomendas/bulk' && method === 'PUT') {
    if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleBulkPutEncomendas(request, env);
  }

  if (path === '/api/encomendas' && method === 'GET') {
    if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleGetEncomendas(env);
  }

  const mEnc = path.match(/^\/api\/encomendas\/([^/]+)$/);
  if (mEnc) {
    const id = decodeURIComponent(mEnc[1]);
    if (method === 'PATCH') {
      if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handlePatchEncomenda(id, request, env);
    }
    if (method === 'DELETE') {
      if (!isAdmin(request, env)) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handleDeleteEncomenda(id, env);
    }
  }

  // ── Fidelidade ────────────────────────────────────────────────────────────
  if (path === '/api/fidelidade/resgatar' && method === 'POST')
    return handleResgatarCodigo(request, env);

  return jsonResp({ ok: false, error: 'Rota não encontrada' }, 404);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS — CLIENTES
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/clientes — registro público de novo cliente */
async function handlePostCliente(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'post-cliente');
  if (!rl.allowed) return jsonResp({ ok: false, error: 'Muitas tentativas. Aguarde uma hora.' }, 429);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const nome     = sanitizeString(body.nome, 200);
  const dataNasc = sanitizeString(body.dataNasc, 20);
  const cel      = String(body.cel ?? '').replace(/\D/g, '');

  if (!nome || nome.length < 3)
    return jsonResp({ ok: false, error: 'Nome inválido (mínimo 3 caracteres)' }, 400);
  if (!dataNasc || !/^\d{4}-\d{2}-\d{2}$/.test(dataNasc))
    return jsonResp({ ok: false, error: 'Data de nascimento inválida (formato esperado: AAAA-MM-DD)' }, 400);
  if (!cel || !/^(1[1-9]|[2-9]\d)9\d{8}$/.test(cel))
    return jsonResp({ ok: false, error: 'Celular inválido (11 dígitos no formato DD9XXXX-XXXX)' }, 400);

  // Fast-path: check by cel index
  const idByCel = await env.CLIENTES_KV.get(`idx:cel:${cel}`);
  if (idByCel) {
    const existente = await env.CLIENTES_KV.get(`cliente:${idByCel}`, 'json');
    if (existente && matchIdentidade(existente, nome, dataNasc)) {
      return jsonResp({ ok: true, id: idByCel, isNew: false, message: 'Cadastro já existente — dados confirmados.' });
    }
  }

  // Generate new ID
  let contador = await getContador(env);
  contador += 1;
  const novoId = `USR-2026-${String(contador).padStart(4, '0')}`;

  // Generate id_hash deterministically from novoId + cel
  const hashBuf = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(novoId + cel)
  );
  const idHash = Array.from(new Uint8Array(hashBuf))
    .slice(0, 4)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const agora = new Date().toISOString();
  const novoCliente = {
    id_permanente: novoId,
    id_hash:       idHash,
    nome,
    dataNasc,
    cel,
    cel_anterior:          [],
    cadastro:              agora,
    saldoPontos:           0,
    codigosUsados:         [],
    resgates:              [],
    totalPremios:          0,
    totalCodigos:          0,
    bloqueado:             false,
    motivo_bloqueio:       null,
    tentativas_fraude:     0,
    ultimo_acesso:         agora,
    historico_alteracoes:  [{ data: agora, tipo: 'cadastro', descricao: 'Cadastro pelo site', por: 'cliente' }],
  };

  await env.CLIENTES_KV.put(`cliente:${novoId}`, JSON.stringify(novoCliente));
  await env.CLIENTES_KV.put(`idx:cel:${cel}`, novoId);
  await env.CLIENTES_KV.put('meta:contador', String(contador));

  const listaIds = await getListaIds(env);
  listaIds.push(novoId);
  await setListaIds(env, listaIds);

  await registrarAudit(env, 'cliente_criado', novoId, { cel: cel.slice(0, 4) + '*****' + cel.slice(-2) });
  return jsonResp({ ok: true, id: novoId, isNew: true, message: 'Cadastro realizado com sucesso!' }, 201);
}

/** POST /api/clientes/login — login público por identidade (nome + dataNasc + cel) */
async function handleLoginCliente(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'login');
  if (!rl.allowed) return jsonResp({ ok: false, error: 'Muitas tentativas. Aguarde uma hora.' }, 429);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const nome     = sanitizeString(body.nome, 200);
  const dataNasc = sanitizeString(body.dataNasc, 20);
  const cel      = String(body.cel ?? '').replace(/\D/g, '');

  if (!nome || !dataNasc || !cel)
    return jsonResp({ found: false, error: 'Dados incompletos' }, 400);

  // Fast-path: cel index
  const idByCel = await env.CLIENTES_KV.get(`idx:cel:${cel}`);
  if (idByCel) {
    const c = await env.CLIENTES_KV.get(`cliente:${idByCel}`, 'json');
    if (c && matchIdentidade(c, nome, dataNasc)) {
      c.ultimo_acesso = new Date().toISOString();
      await env.CLIENTES_KV.put(`cliente:${idByCel}`, JSON.stringify(c));
      return jsonResp({ found: true, clienteId: idByCel, cliente: sanitizarClientePublico(c) });
    }
  }

  // Slow-path: scan all (handles cel change scenario)
  const listaIds = await getListaIds(env);
  for (const id of listaIds) {
    if (id === idByCel) continue;
    const c = await env.CLIENTES_KV.get(`cliente:${id}`, 'json');
    if (!c || !matchIdentidade(c, nome, dataNasc)) continue;

    // Found by name+dob — update cel index if it changed
    const celAntigo = String(c.cel ?? '').replace(/\D/g, '');
    if (celAntigo && celAntigo !== cel) {
      await env.CLIENTES_KV.delete(`idx:cel:${celAntigo}`);
      if (!Array.isArray(c.cel_anterior)) c.cel_anterior = [];
      c.cel_anterior.push(celAntigo);
      c.cel = cel;
      await env.CLIENTES_KV.put(`idx:cel:${cel}`, id);
      if (!Array.isArray(c.historico_alteracoes)) c.historico_alteracoes = [];
      c.historico_alteracoes.push({
        data: new Date().toISOString(), tipo: 'celular_atualizado',
        descricao: `Celular atualizado para ${cel}`, por: 'site_login',
      });
    }
    c.ultimo_acesso = new Date().toISOString();
    await env.CLIENTES_KV.put(`cliente:${id}`, JSON.stringify(c));
    return jsonResp({ found: true, clienteId: id, cliente: sanitizarClientePublico(c) });
  }

  return jsonResp({ found: false });
}

/** GET /api/clientes — admin: lista todos os clientes */
async function handleGetClientes(env) {
  const listaIds = await getListaIds(env);
  const clientes = {};
  const indiceCelular = {};

  // Fetch in batches to avoid timeouts on large datasets
  const BATCH = 25;
  for (let i = 0; i < listaIds.length; i += BATCH) {
    const lote = listaIds.slice(i, i + BATCH);
    await Promise.all(lote.map(async id => {
      const c = await env.CLIENTES_KV.get(`cliente:${id}`, 'json');
      if (c) {
        clientes[id] = c;
        if (c.cel) indiceCelular[String(c.cel).replace(/\D/g, '')] = id;
      }
    }));
  }

  return jsonResp({
    clientes,
    indice_celular: indiceCelular,
    metadata: { versao: '3.0', tipo: 'cloudflare_kv', total_clientes: listaIds.length },
  });
}

/** GET /api/clientes/:id — admin: busca cliente por ID */
async function handleGetCliente(id, env) {
  const c = await env.CLIENTES_KV.get(`cliente:${id}`, 'json');
  if (!c) return jsonResp({ ok: false, error: 'Cliente não encontrado' }, 404);
  return jsonResp(c);
}

/** PATCH /api/clientes/:id — admin: atualiza campos do cliente */
async function handlePatchCliente(id, request, env) {
  const c = await env.CLIENTES_KV.get(`cliente:${id}`, 'json');
  if (!c) return jsonResp({ ok: false, error: 'Cliente não encontrado' }, 404);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const camposPermitidos = [
    'nome', 'cel', 'dataNasc', 'saldoPontos', 'codigosUsados', 'bloqueado',
    'motivo_bloqueio', 'tentativas_fraude', 'historico_alteracoes', 'resgates',
    'totalPremios', 'totalCodigos', 'cel_anterior',
  ];
  // Capture the current cel before applying the patch (used for index cleanup below)
  const celAntes = String(c.cel ?? '').replace(/\D/g, '');
  camposPermitidos.forEach(k => {
    if (Object.prototype.hasOwnProperty.call(body, k)) c[k] = body[k];
  });

  // Keep cel index in sync if cel changed
  if (body.cel !== undefined) {
    const celNovo = String(body.cel).replace(/\D/g, '');
    if (celNovo !== celAntes && celAntes) {
      await env.CLIENTES_KV.delete(`idx:cel:${celAntes}`);
      await env.CLIENTES_KV.put(`idx:cel:${celNovo}`, id);
    }
  }

  c.ultimo_acesso = new Date().toISOString();
  await env.CLIENTES_KV.put(`cliente:${id}`, JSON.stringify(c));
  return jsonResp({ ok: true });
}

/** DELETE /api/clientes/:id — admin: remove cliente */
async function handleDeleteCliente(id, env) {
  const c = await env.CLIENTES_KV.get(`cliente:${id}`, 'json');
  if (!c) return jsonResp({ ok: false, error: 'Cliente não encontrado' }, 404);

  await env.CLIENTES_KV.delete(`cliente:${id}`);
  const cel = String(c.cel ?? '').replace(/\D/g, '');
  if (cel) await env.CLIENTES_KV.delete(`idx:cel:${cel}`);

  const listaIds = (await getListaIds(env)).filter(i => i !== id);
  await setListaIds(env, listaIds);

  await registrarAudit(env, 'cliente_deletado', id, {});
  return jsonResp({ ok: true });
}

/** PUT /api/clientes/bulk — admin: substitui toda a coleção de clientes */
async function handleBulkPutClientes(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const clientes = body.clientes ?? {};
  const ids      = Object.keys(clientes);

  // Remove clients that are no longer present
  const existingIds  = await getListaIds(env);
  const existingSet  = new Set(existingIds);
  const newSet       = new Set(ids);

  for (const id of existingSet) {
    if (!newSet.has(id)) {
      const old = await env.CLIENTES_KV.get(`cliente:${id}`, 'json');
      if (old?.cel) await env.CLIENTES_KV.delete(`idx:cel:${String(old.cel).replace(/\D/g, '')}`);
      await env.CLIENTES_KV.delete(`cliente:${id}`);
    }
  }

  // Upsert all provided clients
  const BATCH = 25;
  for (let i = 0; i < ids.length; i += BATCH) {
    const lote = ids.slice(i, i + BATCH);
    await Promise.all(lote.map(async id => {
      const c = clientes[id];
      if (!c || typeof c !== 'object') return;
      await env.CLIENTES_KV.put(`cliente:${id}`, JSON.stringify(c));
      const cel = String(c.cel ?? '').replace(/\D/g, '');
      if (cel) await env.CLIENTES_KV.put(`idx:cel:${cel}`, id);
    }));
  }

  await setListaIds(env, ids);
  // Update counter to max existing ID number
  const maxNum = ids.reduce((acc, id) => {
    const m = id.match(/USR-\d+-(\d+)$/);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);
  await env.CLIENTES_KV.put('meta:contador', String(maxNum));

  return jsonResp({ ok: true, total: ids.length });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS — ENCOMENDAS
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/encomendas — envio público de pedido */
async function handlePostEncomenda(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'post-enc');
  if (!rl.allowed) return jsonResp({ ok: false, error: 'Muitas tentativas.' }, 429);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const nome = sanitizeString(body.nome, 200);
  const tel  = String(body.telefone ?? body.tel ?? '').replace(/\D/g, '');
  const num  = sanitizeString(body.num, 30);

  if (!nome || nome.length < 3)
    return jsonResp({ ok: false, error: 'Nome inválido' }, 400);
  if (!tel || tel.length < 10)
    return jsonResp({ ok: false, error: 'Telefone inválido' }, 400);
  if (!num || !num.startsWith('ITA-'))
    return jsonResp({ ok: false, error: 'Número de pedido inválido' }, 400);

  const pedido = {
    num,
    data:         sanitizeString(body.data, 30) || new Date().toISOString(),
    dataFormatada: sanitizeString(body.dataFormatada, 30),
    nome,
    telefone:     tel,
    endereço:     sanitizeString(body.endereço ?? body.endereco, 300),
    itens:        Array.isArray(body.itens)
      ? body.itens.slice(0, 50).map(sanitizeItem)
      : [],
    total:        Math.max(0, Number(body.total) || 0),
    status:       'novo',
    tipo:         sanitizeString(body.tipo, 20) || 'caixa',
  };

  await env.ENCOMENDAS_KV.put(`enc:${num}`, JSON.stringify(pedido));

  // Update summary index
  const listaStr = await env.ENCOMENDAS_KV.get('idx:lista');
  const lista    = listaStr ? JSON.parse(listaStr) : [];
  lista.unshift({ num, data: pedido.data, status: 'novo', nome: pedido.nome, tipo: pedido.tipo });
  if (lista.length > 500) lista.length = 500;
  await env.ENCOMENDAS_KV.put('idx:lista', JSON.stringify(lista));

  await registrarAudit(env, 'encomenda_criada', num, { total: pedido.total });
  return jsonResp({ ok: true, num }, 201);
}

/** GET /api/encomendas — admin: lista todos os pedidos */
async function handleGetEncomendas(env) {
  const listaStr = await env.ENCOMENDAS_KV.get('idx:lista');
  if (!listaStr) return jsonResp({ registros: [] });

  const lista    = JSON.parse(listaStr);
  const BATCH    = 25;
  const registros = [];

  for (let i = 0; i < Math.min(lista.length, 300); i += BATCH) {
    const lote = lista.slice(i, i + BATCH);
    const full = await Promise.all(lote.map(item =>
      env.ENCOMENDAS_KV.get(`enc:${item.num}`, 'json').then(d => d ?? item)
    ));
    registros.push(...full);
  }

  return jsonResp({ registros: registros.filter(Boolean) });
}

/** PATCH /api/encomendas/:id — admin: atualiza status ou observação de pedido */
async function handlePatchEncomenda(id, request, env) {
  const pedido = await env.ENCOMENDAS_KV.get(`enc:${id}`, 'json');
  if (!pedido) return jsonResp({ ok: false, error: 'Pedido não encontrado' }, 404);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  if (body.status !== undefined) {
    const statusAnterior = pedido.status;
    pedido.status = sanitizeString(body.status, 20);
    if (pedido.status !== statusAnterior) {
      if (!pedido.historicoStatus) pedido.historicoStatus = [];
      pedido.historicoStatus.push({
        status: pedido.status,
        data:   new Date().toISOString(),
        origem: 'admin',
      });
    }
  }
  if (body.observacaoAdmin !== undefined) {
    pedido.observacaoAdmin = sanitizeString(body.observacaoAdmin, 500);
  }

  await env.ENCOMENDAS_KV.put(`enc:${id}`, JSON.stringify(pedido));

  // Update summary index
  const listaStr = await env.ENCOMENDAS_KV.get('idx:lista');
  if (listaStr) {
    const lista = JSON.parse(listaStr);
    const idx   = lista.findIndex(i => i.num === id);
    if (idx > -1) {
      lista[idx].status = pedido.status;
      await env.ENCOMENDAS_KV.put('idx:lista', JSON.stringify(lista));
    }
  }

  return jsonResp({ ok: true });
}

/** DELETE /api/encomendas/:id — admin: remove pedido */
async function handleDeleteEncomenda(id, env) {
  await env.ENCOMENDAS_KV.delete(`enc:${id}`);

  const listaStr = await env.ENCOMENDAS_KV.get('idx:lista');
  if (listaStr) {
    const lista = JSON.parse(listaStr).filter(i => i.num !== id);
    await env.ENCOMENDAS_KV.put('idx:lista', JSON.stringify(lista));
  }

  return jsonResp({ ok: true });
}

/** PUT /api/encomendas/bulk — admin: substitui toda a coleção de pedidos */
async function handleBulkPutEncomendas(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const registros = Array.isArray(body.registros) ? body.registros : [];

  // Clear existing index to avoid stale entries
  const listaStr = await env.ENCOMENDAS_KV.get('idx:lista');
  if (listaStr) {
    const old = JSON.parse(listaStr);
    const newNums = new Set(registros.map(r => r.num));
    for (const item of old) {
      if (!newNums.has(item.num)) await env.ENCOMENDAS_KV.delete(`enc:${item.num}`);
    }
  }

  const BATCH = 25;
  const novaLista = [];
  for (let i = 0; i < registros.length; i += BATCH) {
    const lote = registros.slice(i, i + BATCH);
    await Promise.all(lote.map(async r => {
      if (!r || !r.num) return;
      await env.ENCOMENDAS_KV.put(`enc:${r.num}`, JSON.stringify(r));
      novaLista.push({ num: r.num, data: r.data, status: r.status, nome: r.nome, tipo: r.tipo });
    }));
  }

  await env.ENCOMENDAS_KV.put('idx:lista', JSON.stringify(novaLista));
  return jsonResp({ ok: true, total: registros.length });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS — FIDELIDADE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/fidelidade/resgatar — resgate de código de fidelidade
 *
 * Body: { clienteId, idHash, codigo }
 * O Worker:
 *   1. Valida o cliente no KV (autenticação via id_hash)
 *   2. Busca fidelidade.json no GitHub (sem PII)
 *   3. Valida e marca o código como usado via GitHub API (GITHUB_TOKEN)
 *   4. Atualiza pontos do cliente no KV
 */
async function handleResgatarCodigo(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'resgatar');
  if (!rl.allowed) return jsonResp({ ok: false, error: 'Muitas tentativas.' }, 429);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const clienteId = sanitizeString(body.clienteId, 30);
  const idHash    = sanitizeString(body.idHash,    10).toUpperCase();
  const codigo    = sanitizeString(body.codigo,    30).toUpperCase();

  if (!clienteId || !idHash || !codigo)
    return jsonResp({ ok: false, error: 'Dados incompletos' }, 400);

  // 1. Validate client
  const cliente = await env.CLIENTES_KV.get(`cliente:${clienteId}`, 'json');
  if (!cliente) return jsonResp({ ok: false, tipo: 'nao_encontrado', error: 'Cliente não encontrado' }, 404);
  if (cliente.id_hash !== idHash) return jsonResp({ ok: false, tipo: 'auth', error: 'Autenticação inválida' }, 401);
  if (cliente.bloqueado) return jsonResp({ ok: false, tipo: 'bloqueado', error: 'Conta bloqueada' });

  if (Array.isArray(cliente.codigosUsados) && cliente.codigosUsados.includes(codigo))
    return jsonResp({ ok: false, tipo: 'ja_usado', error: 'Código já utilizado por este cliente' });

  // 2. Fetch fidelidade.json from GitHub (codes are not PII — public repo)
  let fidelidade;
  try {
    const r = await fetch(`${GH_RAW}${GH_FIDELIDADE_PATH}?t=${Date.now()}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    fidelidade = await r.json();
  } catch (e) {
    return jsonResp({ ok: false, tipo: 'erro_servidor', error: 'Não foi possível verificar códigos agora. Tente em instantes.' }, 503);
  }

  const chave   = Object.prototype.hasOwnProperty.call(fidelidade, 'códigos') ? 'códigos' : 'codigos';
  const codigos = fidelidade[chave] ?? {};
  const entrada = codigos[codigo];

  const STATUS_DISPONIVEL = ['disponível', 'disponivel'];

  // Helper to increment fraud attempts and persist
  const incrementarTentativas = async () => {
    cliente.tentativas_fraude = (cliente.tentativas_fraude || 0) + 1;
    if (cliente.tentativas_fraude >= MAX_FRAUD_ATTEMPTS) cliente.bloqueado = true;
    await env.CLIENTES_KV.put(`cliente:${clienteId}`, JSON.stringify(cliente));
    return cliente.tentativas_fraude;
  };

  if (!entrada) {
    const t = await incrementarTentativas();
    return jsonResp({
      ok:         false,
      tipo:       'invalido',
      bloqueado:  cliente.bloqueado,
      tentativas: t,
      error:      'Código inválido',
    });
  }

  if (!STATUS_DISPONIVEL.includes(entrada.status)) {
    const t = await incrementarTentativas();
    return jsonResp({ ok: false, tipo: 'ja_usado_global', bloqueado: cliente.bloqueado, tentativas: t, error: 'Código já utilizado' });
  }

  // 3. Mark code as used in fidelidade.json via GitHub API
  const agora = new Date().toISOString();
  fidelidade[chave][codigo] = { ...entrada, status: 'usado', usadoPor: cliente.cel || clienteId, usadoEm: agora };
  fidelidade.usados = (fidelidade.usados || 0) + 1;
  if (Object.prototype.hasOwnProperty.call(fidelidade, 'última_atualização')) {
    fidelidade['última_atualização'] = agora;
  } else {
    fidelidade.ultima_atualizacao = agora;
  }

  if (env.GITHUB_TOKEN) {
    try {
      await ghPutFidelidade(fidelidade, `Site: código ${codigo} usado — ${clienteId}`, env.GITHUB_TOKEN);
    } catch (e) {
      // Non-fatal: code may get double-claimed in an edge case, admin can fix
      console.error('[Worker] Falha ao gravar fidelidade.json no GitHub:', e.message);
    }
  }

  // 4. Update client points in KV
  const pontosAntes = cliente.saldoPontos || 0;
  if (!Array.isArray(cliente.codigosUsados))  cliente.codigosUsados  = [];
  if (!Array.isArray(cliente.historico_alteracoes)) cliente.historico_alteracoes = [];

  cliente.codigosUsados.push(codigo);
  cliente.saldoPontos       = pontosAntes + 1;
  cliente.totalCodigos      = (cliente.totalCodigos || 0) + 1;
  cliente.tentativas_fraude = 0;
  cliente.ultimo_acesso     = agora;
  cliente.historico_alteracoes.push({
    data:      agora,
    tipo:      'codigo_validado_site',
    descricao: `Código ${codigo} validado via Worker`,
    por:       'cliente',
  });

  await env.CLIENTES_KV.put(`cliente:${clienteId}`, JSON.stringify(cliente));

  return jsonResp({
    ok:      true,
    pontos:  cliente.saldoPontos,
    message: `Código registrado! Você agora tem ${cliente.saldoPontos} ponto(s).`,
  });
}
