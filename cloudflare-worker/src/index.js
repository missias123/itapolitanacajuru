/**
 * Itapolitana Cajuru — API Worker (Cloudflare Workers)
 *
 * Substitui a gravação direta no GitHub para dados PII:
 *   • clientes.json  → CLIENTES_KV
 *   • encomendas.json → ENCOMENDAS_KV
 *
 * Os demais JSONs editáveis do admin continuam no GitHub, mas as leituras/gravações
 * administrativas também passam por este Worker usando GITHUB_TOKEN armazenado
 * como segredo no Cloudflare.
 *
 * Variáveis de ambiente obrigatórias (wrangler secret put):
 *   GITHUB_TOKEN   — PAT do GitHub com escopo "repo" (para o admin inteiro)
 *
 * Autenticação administrativa (preferência em ordem):
 *   ADMIN_PASSWORD_RECORD   — formato versionado (pbkdf2-sha256$v=1$iter=...$salt=...$hash=...)
 *   ADMIN_HASH + ADMIN_SALT — formato legado PBKDF2-SHA-256
 *   ADMIN_SECRET            — senha em texto plano (legado, removido após migração)
 *
 * KV Namespaces:
 *   CLIENTES_KV    — dados de clientes
 *   ENCOMENDAS_KV  — pedidos de encomenda
 *   RATE_KV        — contadores de rate-limit
 *
 * Para gerar hash/salt/record (staging only):
 *   POST /api/admin/generate-hash  { "setup_key": "<valor de SETUP_KEY>", "password": "..." }
 *   Retorna { ADMIN_PASSWORD_RECORD, ADMIN_HASH, ADMIN_SALT }.
 */

// ─── Origens permitidas para CORS ────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://itapolitanacajuru.com.br',
  'https://www.itapolitanacajuru.com.br',
  'https://missias123.github.io',
  // staging: adicione a URL do Pages preview e do subdomínio de staging
  // 'https://staging.itapolitanacajuru.com.br',
  // 'https://missias123-itapolitanacajuru-staging.pages.dev',
];

const GH_RAW  = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/';
const GH_API  = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/';
const GH_ADMIN_JSON_PATHS = Object.freeze({
  config:      'dados/config.json',
  produtos:    'dados/produtos.json',
  promo:       'dados/promo.json',
  fidelidade:  'dados/fidelidade.json',
  promocoes:   'dados/promocoes.json',
  clientes:    'dados/clientes.json',
  pedidos:     'dados/pedidos.json',
  encomendas:  'dados/encomendas.json',
  submissoes:  'dados/submissoes_encomendas.json',
  carrinhos:   'dados/carrinhos_abandonados.json',
});
const GH_ADMIN_PATH_SET = new Set(Object.values(GH_ADMIN_JSON_PATHS));

// Allowed binary/image paths for admin upload (prefix match against allowed dirs)
const GH_ADMIN_IMAGE_PREFIXES = ['images/carrossel/', 'images/depoimentos/', 'dados/promo_banner'];
const GH__PATH = GH_ADMIN_JSON_PATHS.fidelidade;
const LEGACY_SECRET_FIELD_DEPRECATION = '2026-12-31';

// PBKDF2 parameters (NIST SP 800-132 recommended minimum for SHA-256)
const PBKDF2_DEFAULT_ITERATIONS = 600_000;
const PBKDF2_MIN_ITERATIONS     = 100_000;
const PBKDF2_MAX_ITERATIONS     = 1_500_000;
const PBKDF2_HASH               = 'SHA-256';
const PBKDF2_KEY_BITS           = 256;
const ADMIN_PBKDF2_ALGO         = 'pbkdf2-sha256';
const ADMIN_PBKDF2_VERSION      = '1';

const RATE_LIMITS = {
  'post-cliente':  { max: 10, windowMs: 3_600_000 },
  'login':         { max: 20, windowMs: 3_600_000 },
  'admin-login':   { max: 10, windowMs: 3_600_000 },
  'post-enc':      { max: 10, windowMs: 3_600_000 },
  'resgatar':      { max: 10, windowMs: 3_600_000 },
  'post-sorteio':  { max: 3,  windowMs: 1_800_000 }, // 3 tentativas por 30 min (sorteio)
  'buscar-sorteio': { max: 5, windowMs: 3_600_000 }, // 5 buscas por hora
};
const MAX_INVALID_CODE_ATTEMPTS = 4; // Block client after this many consecutive invalid code attempts
const SESSION_TTL = 7200;            // Admin session lifetime: 2 hours

// ─── Entry point ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // Startup guard: fail loudly if wrangler.toml was deployed with placeholder KV IDs.
    // The binding objects themselves are always present in the env; we detect placeholders
    // by attempting a no-op get on a known-missing key — a misconfigured namespace will
    // throw, and an un-replaced ID in wrangler.toml causes Wrangler to refuse to deploy.
    // This check is a belt-and-suspenders for any edge-case misconfiguration.
    if (!env.CLIENTES_KV || !env.ENCOMENDAS_KV || !env.RATE_KV) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Worker mal-configurado: KV namespaces ausentes. Verifique wrangler.toml.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

// ─── CORS headers — also expose session token header ──────────────────────────
function buildCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Itap-Admin-Secret, X-Itap-Session-Token, X-Idempotency-Key',
    'Access-Control-Max-Age':       '86400',
    'Vary':                         'Origin',
  };
}

function applySecurityHeaders(resp) {
  resp.headers.set('X-Content-Type-Options', 'nosniff');
  resp.headers.set('X-Frame-Options', 'DENY');
  resp.headers.set('Referrer-Policy', 'no-referrer');
  resp.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none';");
  resp.headers.set('Cache-Control', 'no-store');
  resp.headers.set('Pragma', 'no-cache');
  resp.headers.set('Expires', '0');
}

function withCors(response, origin) {
  const r = new Response(response.body, response);
  const headers = buildCorsHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => r.headers.set(k, v));
  applySecurityHeaders(r);
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
/**
 * isAdmin — checks for a valid admin session token (preferred) or direct secret (fallback).
 *
 * Session flow (recommended):
 *   1. Client calls POST /api/admin/session with the raw password
 *   2. Worker verifies the password (PBKDF2 when ADMIN_HASH+ADMIN_SALT are set, otherwise ADMIN_SECRET)
 *   3. Worker returns a short-lived random session token
 *   4. Client stores the session token and uses X-Itap-Session-Token on all requests
 *   5. Session token is stored in RATE_KV with SESSION_TTL expiry
 *
 * Direct secret (fallback — for non-browser callers such as migration scripts):
 *   X-Itap-Admin-Secret: <raw ADMIN_SECRET>
 */
async function isAdmin(request, env) {
  // Preferred: session token (random, ephemeral — never the raw secret)
  const sessionToken = request.headers.get('X-Itap-Session-Token') || '';
  if (sessionToken) {
    const valid = await env.RATE_KV.get(`session:${sessionToken}`);
    if (valid === '1') return true;
  }
  // Fallback: direct ADMIN_SECRET (for migration scripts and CLI tools only)
  const secret = request.headers.get('X-Itap-Admin-Secret') || '';
  if (secret && env.ADMIN_SECRET && secret === env.ADMIN_SECRET) return true;
  return false;
}

// ─── PBKDF2 password hashing (Web Crypto API — available in all Workers) ─────
/**
 * Derives a PBKDF2-SHA-256 hash from a password and salt.
 * Returns base64-encoded 256-bit key.
 */
async function pbkdf2Derive(password, saltBase64, iterations = PBKDF2_DEFAULT_ITERATIONS) {
  if (!Number.isInteger(iterations) || iterations < PBKDF2_MIN_ITERATIONS || iterations > PBKDF2_MAX_ITERATIONS) {
    throw new Error(`Iterações PBKDF2 inválidas: ${iterations}`);
  }
  const enc       = new TextEncoder();
  const saltBytes = base64ToBytes(saltBase64);
  const keyMat    = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: PBKDF2_HASH, salt: saltBytes, iterations },
    keyMat,
    PBKDF2_KEY_BITS
  );
  return bytesToBase64(new Uint8Array(bits));
}

/**
 * Timing-safe comparison of two strings using HMAC-SHA-256.
 * This prevents timing attacks by comparing HMAC signatures, not raw strings.
 */
async function timingSafeEqual(a, b) {
  const enc  = new TextEncoder();
  const key  = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const [sa, sb] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(a)),
    crypto.subtle.sign('HMAC', key, enc.encode(b)),
  ]);
  const ba = new Uint8Array(sa);
  const bb = new Uint8Array(sb);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

function parseAdminPasswordRecord(recordRaw) {
  const record = sanitizeString(recordRaw || '', 1024);
  if (!record) return null;
  const chunks = record.split('$');
  if (chunks.length !== 5) {
    throw new Error('ADMIN_PASSWORD_RECORD inválido: formato incompleto');
  }
  const [algo, vChunk, iterChunk, saltChunk, hashChunk] = chunks;
  if (algo !== ADMIN_PBKDF2_ALGO) {
    throw new Error('ADMIN_PASSWORD_RECORD inválido: algoritmo não suportado');
  }
  if (vChunk !== `v=${ADMIN_PBKDF2_VERSION}`) {
    throw new Error('ADMIN_PASSWORD_RECORD inválido: versão não suportada');
  }
  if (!iterChunk.startsWith('iter=')) {
    throw new Error('ADMIN_PASSWORD_RECORD inválido: iter ausente');
  }
  if (!saltChunk.startsWith('salt=')) {
    throw new Error('ADMIN_PASSWORD_RECORD inválido: salt ausente');
  }
  if (!hashChunk.startsWith('hash=')) {
    throw new Error('ADMIN_PASSWORD_RECORD inválido: hash ausente');
  }
  const iterations = Number(iterChunk.slice(5));
  if (!Number.isInteger(iterations) || iterations < PBKDF2_MIN_ITERATIONS || iterations > PBKDF2_MAX_ITERATIONS) {
    throw new Error(`ADMIN_PASSWORD_RECORD inválido: iter fora da faixa (${PBKDF2_MIN_ITERATIONS}-${PBKDF2_MAX_ITERATIONS})`);
  }
  const salt = saltChunk.slice(5);
  const hash = hashChunk.slice(5);
  if (!salt || !hash) {
    throw new Error('ADMIN_PASSWORD_RECORD inválido: salt/hash vazios');
  }
  // Validação base64 (falha cedo para evitar erros silenciosos durante login).
  base64ToBytes(salt);
  base64ToBytes(hash);
  return { iterations, salt, hash };
}

function buildAdminPasswordRecord(iterations, saltBase64, hashBase64) {
  return `${ADMIN_PBKDF2_ALGO}$v=${ADMIN_PBKDF2_VERSION}$iter=${iterations}$salt=${saltBase64}$hash=${hashBase64}`;
}

/**
 * Verifies the provided password against stored PBKDF2 hash or plain ADMIN_SECRET.
 * Prefers PBKDF2 (ADMIN_HASH + ADMIN_SALT) over plain text (ADMIN_SECRET).
 */
async function verifyAdminPassword(password, env) {
  if (!password) return false;
  if (env.ADMIN_PASSWORD_RECORD) {
    const record = parseAdminPasswordRecord(env.ADMIN_PASSWORD_RECORD);
    const derived = await pbkdf2Derive(password, record.salt, record.iterations);
    return timingSafeEqual(derived, record.hash);
  }
  if (env.ADMIN_HASH && env.ADMIN_SALT) {
    // Secure path: PBKDF2 verification
    const derived = await pbkdf2Derive(password, env.ADMIN_SALT, PBKDF2_DEFAULT_ITERATIONS);
    return timingSafeEqual(derived, env.ADMIN_HASH);
  }
  // Legacy path: plain text comparison (to be removed after migration)
  if (env.ADMIN_SECRET) {
    return timingSafeEqual(password, env.ADMIN_SECRET);
  }
  return false;
}

function base64ToBytes(b64) {
  const bin   = atob(String(b64 || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
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

function decodeBase64Utf8(base64) {
  const binary = atob(String(base64 || '').replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function isAllowedAdminRepoPath(path) {
  return GH_ADMIN_PATH_SET.has(path);
}

function isAllowedAdminImagePath(path) {
  return GH_ADMIN_IMAGE_PREFIXES.some(prefix => path.startsWith(prefix));
}

function isAllowedAdminFilePath(path) {
  return isAllowedAdminRepoPath(path) || isAllowedAdminImagePath(path);
}

async function ghGetJsonFile(path, token) {
  const r = await fetch(GH_API + path, {
    headers: {
      Authorization: `token ${token}`,
      Accept:        'application/vnd.github.v3+json',
    },
  });
  if (!r.ok) throw new Error(`GET ${path}: HTTP ${r.status}`);
  const meta = await r.json();
  return {
    sha: meta.sha || '',
    content: JSON.parse(decodeBase64Utf8(meta.content || '')),
  };
}

async function ghPutJsonFile(path, data, mensagem, token, sha = '') {
  const body = {
    message: sanitizeString(mensagem || `Admin: atualizar ${path}`, 180),
    content: encodeBase64(JSON.stringify(data, null, 2)),
  };
  if (sha) {
    body.sha = sha;
  } else {
    try {
      const atual = await ghGetJsonFile(path, token);
      if (atual.sha) body.sha = atual.sha;
    } catch (e) {
      if (!String(e.message || '').includes('HTTP 404')) throw e;
    }
  }
  const r = await fetch(GH_API + path, {
    method:  'PUT',
    headers: {
      Authorization:  `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || `PUT ${path}: HTTP ${r.status}`);
  }
  const resp = await r.json().catch(() => ({}));
  return { ok: true, sha: resp?.content?.sha || body.sha || '' };
}

/**
 * ghPutRawFile — uploads a binary file (already base64-encoded) to GitHub.
 * Used for image uploads where the browser sends pre-encoded content.
 */
async function ghPutRawFile(path, base64Content, mensagem, token, sha = '') {
  const cleanContent = String(base64Content || '').replace(/\s/g, '');
  const body = {
    message: sanitizeString(mensagem || `Admin: atualizar ${path}`, 180),
    content: cleanContent,
  };
  if (sha) {
    body.sha = sha;
  } else {
    try {
      const r = await fetch(GH_API + path, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (r.ok) { const meta = await r.json(); if (meta.sha) body.sha = meta.sha; }
    } catch { /* file may not exist yet */ }
  }
  const r = await fetch(GH_API + path, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || `PUT ${path}: HTTP ${r.status}`);
  }
  const resp = await r.json().catch(() => ({}));
  return { ok: true, sha: resp?.content?.sha || body.sha || '', url: resp?.content?.download_url || '' };
}

// ─── GitHub helper — write fidelidade.json ────────────────────────────────────
async function ghPutFidelidade(dadosFidelidade, mensagem, token) {
  await ghPutJsonFile(GH__PATH, dadosFidelidade, mensagem, token);
  return true;
}

// ─── KV helpers — client list index ─────────────────────────────────────────
// Nota de escalabilidade: meta:lista_ids armazena um array JSON com todos os IDs
// de clientes. Para volumes esperados de uma sorveteria (< 5.000 clientes) isso
// é eficiente. Se o volume crescer para dezenas de milhares, considere migrar
// para paginação via env.CLIENTES_KV.list({ prefix: 'cliente:', limit: 100 }).
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

/**
 * generateIdHash — random 4-byte hex identifier stored on each client record.
 * Used by the public resgate endpoint to verify the caller owns the account
 * without transmitting PII.  Not a cryptographic secret — just a lightweight
 * anti-guessing measure.
 */
function generateIdHash() {
  const b = new Uint8Array(4);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
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

  // ── Admin session exchange ─────────────────────────────────────────────────
  if (path === '/api/admin/auth' && method === 'POST')
    return handleAdminAuth(request, env);

  if (path === '/api/admin/session' && method === 'POST')
    return handleAdminSession(request, env);

  if (path === '/api/admin/session' && method === 'DELETE')
    return handleAdminSessionLogout(request, env);

  // ── Admin hash generation (staging only — generates PBKDF2 hash for setup) ──
  if (path === '/api/admin/generate-hash' && method === 'POST')
    return handleGenerateHash(request, env);

  // ── PBKDF2 runtime self-test (staging/local only) ────────────────────────────
  if (path === '/api/admin/pbkdf2-selftest' && method === 'POST')
    return handlePbkdf2Selftest(request, env);

  if (path === '/api/admin/github-file' && method === 'GET') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleAdminGitHubFileGet(url.searchParams.get('path'), env);
  }

  if (path === '/api/admin/github-file' && method === 'PUT') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleAdminGitHubFilePut(request, env);
  }

  // ── Clientes ──────────────────────────────────────────────────────────────
  if (path === '/api/clientes' && method === 'POST')
    return handlePostCliente(request, env);

  if (path === '/api/clientes/login' && method === 'POST')
    return handleLoginCliente(request, env);

  if (path === '/api/clientes/bulk' && method === 'PUT') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleBulkPutClientes(request, env);
  }

  if (path === '/api/clientes' && method === 'GET') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleGetClientes(env);
  }

  const mCliente = path.match(/^\/api\/clientes\/([^/]+)$/);
  if (mCliente) {
    const id = decodeURIComponent(mCliente[1]);
    if (method === 'GET') {
      if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handleGetCliente(id, env);
    }
    if (method === 'PATCH') {
      if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handlePatchCliente(id, request, env);
    }
    if (method === 'DELETE') {
      if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handleDeleteCliente(id, env);
    }
  }

  // ── Encomendas ────────────────────────────────────────────────────────────
  if (path === '/api/encomendas' && method === 'POST')
    return handlePostEncomenda(request, env);

  if (path === '/api/encomendas/bulk' && method === 'PUT') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleBulkPutEncomendas(request, env);
  }

  if (path === '/api/encomendas' && method === 'GET') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleGetEncomendas(env);
  }

  const mEnc = path.match(/^\/api\/encomendas\/([^/]+)$/);
  if (mEnc) {
    const id = decodeURIComponent(mEnc[1]);
    if (method === 'PATCH') {
      if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handlePatchEncomenda(id, request, env);
    }
    if (method === 'DELETE') {
      if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
      return handleDeleteEncomenda(id, env);
    }
  }

  // ── Fidelidade (descontinuado) ────────────────────────────────────────────
  if (path === '/api/fidelidade/resgatar' && method === 'POST') {
    return jsonResp({
      ok: false,
      error: 'Programa de fidelidade descontinuado. Use apenas os sorteios mensais.'
    }, 410);
  }

  // ── Promoção / Sorteio Mensal ──────────────────────────────────────────────
  // Endpoint público — salva inscrição do sorteio no CLIENTES_KV (sem WhatsApp).
  if (path === '/api/promocao/cadastro' && method === 'POST')
    return handlePostSorteioCadastro(request, env);

  if (path === '/api/sorteio/buscar' && method === 'GET')
    return handleGetSorteioBuscar(request, env, url);

  // ── Admin — Sorteio Inscritos ──────────────────────────────────────────────
  if (path === '/api/admin/sorteio/inscritos' && method === 'GET') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleGetSorteioInscritos(env);
  }

  const mSorteioLoteMes = path.match(/^\/api\/admin\/sorteio\/inscritos\/lote\/(\d{4}-\d{2})$/);
  if (mSorteioLoteMes) {
    const loteMes = mSorteioLoteMes[1];
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    if (method === 'DELETE') return handleDeleteSorteioInscritosLoteMes(loteMes, env);
  }

  const mSorteio = path.match(/^\/api\/admin\/sorteio\/inscritos\/([^/]+)$/);
  if (mSorteio) {
    const id = decodeURIComponent(mSorteio[1]);
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    if (method === 'PATCH') return handlePatchSorteioInscrito(id, request, env);
    if (method === 'DELETE') return handleDeleteSorteioInscrito(id, env);
  }

  return jsonResp({ ok: false, error: 'Rota não encontrada' }, 404);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS — AUTENTICAÇÃO ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/session — troca o ADMIN_SECRET por um token de sessão temporário.
 *
 * O token de sessão é um valor aleatório armazenado no RATE_KV com TTL de SESSION_TTL segundos.
 * O frontend armazena APENAS o token de sessão (nunca a senha em si).
 */
async function handleAdminSession(request, env) {
  const envName = sanitizeString(env?.ENVIRONMENT || '', 32).toLowerCase();
  const allowInsecure = envName === 'local' || envName === 'dev' || envName === 'development';
  if (!allowInsecure && !request.url.startsWith('https://')) {
    return jsonResp({ ok: false, error: 'HTTPS obrigatório' }, 400);
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'admin-login');
  if (!rl.allowed) return jsonResp({ ok: false, error: 'Muitas tentativas de login. Aguarde uma hora.' }, 429);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const password = sanitizeString(body.password || '', 200);
  // Compatibilidade temporária: `secret` é legado e será removido até 2026-12-31.
  // Padrão oficial: enviar apenas `password`.
  if (!password && body.secret) {
    await registrarAudit(env, 'admin_login_legacy_field', 'admin', { deprecatesOn: LEGACY_SECRET_FIELD_DEPRECATION });
  }
  const candidate = password || sanitizeString(body.secret || '', 200);

  let ok = false;
  try {
    ok = await verifyAdminPassword(candidate, env);
  } catch (e) {
    await registrarAudit(env, 'admin_login_crypto_error', 'admin', {
      message: sanitizeString(e?.message || 'crypto-error', 120),
    });
    return jsonResp({
      ok: false,
      error: 'Falha criptográfica no ambiente. Verifique ADMIN_PASSWORD_RECORD/iterações e rode /api/admin/pbkdf2-selftest.',
    }, 500);
  }
  if (!ok) {
    await registrarAudit(env, 'admin_login_fail', 'admin', { ip: (ip + '').slice(0, 8) + '…' });
    return jsonResp({ ok: false, error: 'Falha de autenticação' }, 401);
  }

  const token = await issueAdminSessionToken(env);
  await registrarAudit(env, 'admin_login_ok', 'admin', { ip: (ip + '').slice(0, 8) + '…' });
  return jsonResp({
    ok: true,
    token,
    expiresIn: SESSION_TTL,
    hasGithubToken: !!env.GITHUB_TOKEN
  });
}

async function issueAdminSessionToken(env) {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  await env.RATE_KV.put(`session:${token}`, '1', { expirationTtl: SESSION_TTL });
  return token;
}

async function handleAdminAuth(request, env) {
  return handleAdminSession(request, env);
}

async function handleAdminSessionLogout(request, env) {
  const token = sanitizeString(request.headers.get('X-Itap-Session-Token') || '', 128);
  if (!token) {
    return jsonResp({ ok: true });
  }
  await env.RATE_KV.delete(`session:${token}`);
  await registrarAudit(env, 'admin_logout', 'admin', { status: 'ok' });
  return jsonResp({ ok: true });
}

/**
 * POST /api/admin/generate-hash — gera PBKDF2-SHA-256 hash + salt para configuração segura.
 *
 * Disponível apenas em ambientes staging/local. Protegido por SETUP_KEY (Cloudflare Secret).
 * Uso: configure SETUP_KEY como secret, chame este endpoint uma vez para obter ADMIN_HASH e ADMIN_SALT,
 * então configure esses dois valores como secrets e remova SETUP_KEY.
 *
 * Body: { "setup_key": "<valor de SETUP_KEY>", "password": "<nova senha do admin>" }
 * Retorno: { "ADMIN_PASSWORD_RECORD": "...", "ADMIN_HASH": "...", "ADMIN_SALT": "..." }
 */
async function handleGenerateHash(request, env) {
  const envName = sanitizeString(env?.ENVIRONMENT || '', 32).toLowerCase();
  const isAllowedEnv = envName === 'staging' || envName === 'local' || envName === 'dev';
  if (!isAllowedEnv) {
    return jsonResp({ ok: false, error: 'Endpoint disponível apenas em staging/local' }, 403);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const setupKey = sanitizeString(body.setup_key || '', 200);
  if (!setupKey || !env.SETUP_KEY || setupKey !== env.SETUP_KEY) {
    return jsonResp({ ok: false, error: 'Chave de setup inválida' }, 401);
  }

  const password = sanitizeString(body.password || '', 200);
  if (!password || password.length < 16) {
    return jsonResp({ ok: false, error: 'Senha deve ter ao menos 16 caracteres' }, 400);
  }

  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const saltB64 = bytesToBase64(saltBytes);
  const hashB64 = await pbkdf2Derive(password, saltB64, PBKDF2_DEFAULT_ITERATIONS);
  const record  = buildAdminPasswordRecord(PBKDF2_DEFAULT_ITERATIONS, saltB64, hashB64);

  return jsonResp({
    ok: true,
    message: 'Configure os secrets abaixo e remova SETUP_KEY após a configuração',
    ADMIN_PASSWORD_RECORD: record,
    ADMIN_PASSWORD_RECORD_FORMAT: `${ADMIN_PBKDF2_ALGO}$v=${ADMIN_PBKDF2_VERSION}$iter=<iter>$salt=<base64>$hash=<base64>`,
    PBKDF2_ITERATIONS: PBKDF2_DEFAULT_ITERATIONS,
    ADMIN_HASH: hashB64,
    ADMIN_SALT: saltB64,
    instructions: [
      'wrangler secret put ADMIN_PASSWORD_RECORD  (preferido: cole o valor de ADMIN_PASSWORD_RECORD)',
      'wrangler secret put ADMIN_HASH  (legado: cole o valor de ADMIN_HASH)',
      'wrangler secret put ADMIN_SALT  (legado: cole o valor de ADMIN_SALT)',
      'wrangler secret delete ADMIN_SECRET  (após confirmar que PBKDF2 funciona)',
      'wrangler secret delete SETUP_KEY',
    ],
  });
}

/**
 * POST /api/admin/pbkdf2-selftest — executa benchmark real de PBKDF2 no runtime atual.
 * Disponível apenas em staging/local/dev e protegido por SETUP_KEY.
 *
 * Body:
 * {
 *   "setup_key": "<SETUP_KEY>",
 *   "iterations": 600000, // opcional
 *   "samples": 3           // opcional (1-5)
 * }
 */
async function handlePbkdf2Selftest(request, env) {
  const envName = sanitizeString(env?.ENVIRONMENT || '', 32).toLowerCase();
  const isAllowedEnv = envName === 'staging' || envName === 'local' || envName === 'dev' || envName === 'development';
  if (!isAllowedEnv) {
    return jsonResp({ ok: false, error: 'Endpoint disponível apenas em staging/local' }, 403);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'admin-login');
  if (!rl.allowed) return jsonResp({ ok: false, error: 'Muitas tentativas. Aguarde uma hora.' }, 429);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const setupKey = sanitizeString(body.setup_key || '', 200);
  if (!setupKey || !env.SETUP_KEY || setupKey !== env.SETUP_KEY) {
    return jsonResp({ ok: false, error: 'Chave de setup inválida' }, 401);
  }

  const iterations = Number(body.iterations ?? PBKDF2_DEFAULT_ITERATIONS);
  const samples = Number(body.samples ?? 3);
  if (!Number.isInteger(samples) || samples < 1 || samples > 5) {
    return jsonResp({ ok: false, error: 'samples deve ser inteiro entre 1 e 5' }, 400);
  }

  try {
    const ms = [];
    for (let i = 0; i < samples; i++) {
      const saltBytes = new Uint8Array(16);
      crypto.getRandomValues(saltBytes);
      const salt = bytesToBase64(saltBytes);
      const start = performance.now();
      await pbkdf2Derive('pbkdf2-selftest-password', salt, iterations);
      ms.push(Number((performance.now() - start).toFixed(2)));
    }
    const total = ms.reduce((a, b) => a + b, 0);
    const avgMs = Number((total / ms.length).toFixed(2));
    const minMs = Math.min(...ms);
    const maxMs = Math.max(...ms);
    const highCostWarning = avgMs > 1500
      ? 'Custo alto detectado: avalie rate limiting reforçado, MFA e proteção adicional.'
      : '';

    return jsonResp({
      ok: true,
      environment: envName,
      algorithm: 'PBKDF2-HMAC-SHA-256',
      iterations,
      samples,
      timingsMs: ms,
      minMs,
      avgMs,
      maxMs,
      warning: highCostWarning,
      note: 'Teste executado no runtime atual do Worker (workerd via Web Crypto).',
    });
  } catch (e) {
    await registrarAudit(env, 'pbkdf2_selftest_fail', 'admin', {
      iterations,
      message: sanitizeString(e?.message || 'pbkdf2-fail', 120),
    });
    return jsonResp({
      ok: false,
      environment: envName,
      iterations,
      error: 'PBKDF2 falhou no runtime atual',
      detail: sanitizeString(e?.message || 'erro-desconhecido', 160),
    }, 500);
  }
}

async function handleAdminGitHubFileGet(pathRaw, env) {
  const path = sanitizeString(pathRaw || '', 120).replace(/^\/+/, '');
  if (!isAllowedAdminRepoPath(path)) {
    return jsonResp({ ok: false, error: 'Arquivo não permitido' }, 400);
  }
  if (!env.GITHUB_TOKEN) {
    return jsonResp({ ok: false, error: 'GITHUB_TOKEN não configurado no Worker' }, 500);
  }
  const file = await ghGetJsonFile(path, env.GITHUB_TOKEN);
  return jsonResp({ ok: true, path, sha: file.sha, content: file.content });
}

async function handleAdminGitHubFilePut(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const path = sanitizeString(body.path || '', 120).replace(/^\/+/, '');
  if (!isAllowedAdminFilePath(path)) {
    return jsonResp({ ok: false, error: 'Arquivo não permitido' }, 400);
  }
  if (!env.GITHUB_TOKEN) {
    return jsonResp({ ok: false, error: 'GITHUB_TOKEN não configurado no Worker' }, 500);
  }

  const sha     = sanitizeString(body.sha || '', 120);
  const message = sanitizeString(body.message || `Admin: atualizar ${path}`, 180);

  // Binary file upload: browser sends pre-encoded base64 content
  if (typeof body.content_base64 === 'string') {
    if (!isAllowedAdminImagePath(path) && !isAllowedAdminRepoPath(path)) {
      return jsonResp({ ok: false, error: 'Arquivo não permitido para upload binário' }, 400);
    }
    const saved = await ghPutRawFile(path, body.content_base64, message, env.GITHUB_TOKEN, sha);
    await registrarAudit(env, 'admin_repo_put_binary', path, { via: 'worker' });
    return jsonResp({ ok: true, path, sha: saved.sha, url: saved.url || '' });
  }

  // JSON file update
  if (!Object.prototype.hasOwnProperty.call(body, 'data')) {
    return jsonResp({ ok: false, error: 'Campo data ou content_base64 é obrigatório' }, 400);
  }
  if (!isAllowedAdminRepoPath(path)) {
    return jsonResp({ ok: false, error: 'Arquivo não permitido para escrita JSON' }, 400);
  }
  const saved = await ghPutJsonFile(path, body.data, message, env.GITHUB_TOKEN, sha);
  await registrarAudit(env, 'admin_repo_put', path, { via: 'worker' });
  return jsonResp({ ok: true, path, sha: saved.sha });
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
  // Brazilian cell phone: 2-digit area code (DDD 11-99) + digit 9 + 8 digits = 11 total
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

  // Generate id_hash — lightweight random token used by the public resgate endpoint
  const idHash = generateIdHash();

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

  // Upsert all provided clients — auto-generate id_hash for imported clients that lack one
  const BATCH = 25;
  for (let i = 0; i < ids.length; i += BATCH) {
    const lote = ids.slice(i, i + BATCH);
    await Promise.all(lote.map(async id => {
      const c = clientes[id];
      if (!c || typeof c !== 'object') return;
      // Auto-generate id_hash if missing (clients migrated from backup)
      if (!c.id_hash) c.id_hash = generateIdHash();
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
// HANDLERS — 
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
    const r = await fetch(`${GH_RAW}${GH__PATH}?t=${Date.now()}`);
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
    if (cliente.tentativas_fraude >= MAX_INVALID_CODE_ATTEMPTS) cliente.bloqueado = true;
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

  let githubOk = true;
  if (env.GITHUB_TOKEN) {
    try {
      await ghPutFidelidade(fidelidade, `Site: código ${codigo} usado — ${clienteId}`, env.GITHUB_TOKEN);
    } catch (e) {
      // Non-fatal: code may get double-claimed in an edge case, admin can fix via panel
      console.error('[Worker] Falha ao gravar fidelidade.json no GitHub:', e.message);
      githubOk = false;
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
    ok:             true,
    pontos:         cliente.saldoPontos,
    partialSuccess: !githubOk, // true = points credited but fidelidade.json not updated in GitHub yet
    message:        `Código registrado! Você agora tem ${cliente.saldoPontos} ponto(s).`,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER — PROMOÇÃO / SORTEIO MENSAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/promocao/cadastro — inscrição pública no sorteio mensal.
 *
 * Payload esperado (JSON):
 *   { name, birthdate (AAAA-MM-DD), phone (11 dígitos), regulation_accept (true) }
 *
 * Resposta em caso de sucesso:
 *   { success: true, id: "SRT-2026-NNNN" }
 * Resposta em caso de já inscrito:
 *   { success: true, id: "SRT-2026-NNNN", alreadyRegistered: true }
 * Resposta em caso de erro de validação:
 *   { success: false, error: "mensagem explicando o problema" }
 * Resposta em caso de erro interno:
 *   { success: false, error: "erro_interno" }
 *
 * Armazenamento (CLIENTES_KV):
 *   sorteio:inscrito:<id>   — dados da inscrição (JSON)
 *   sorteio:idx:cel:<phone> — ID da inscrição indexado pelo celular
 *   sorteio:idx:nasc:<normNome>__<birthdate> — ID indexado por nome normalizado + data nasc
 *   meta:sorteio_contador   — contador incremental de inscrições
 *
 * NÃO abre WhatsApp. NÃO usa fidelidade.json. Cadastro 100% interno.
 */
const SORTEIO_IDEMPOTENCY_TTL = 86400 * 30;
const SORTEIO_IDEMPOTENCY_PROCESSING_TTL_SECONDS = 120;

function buildPromoRequestId() {
  if (typeof crypto.randomUUID === 'function') {
    return `req-${crypto.randomUUID()}`;
  }
  const rand = generateIdHash() + generateIdHash();
  return `req-${rand}`;
}

function getPromoIdempotencyKey(request, body) {
  const headerKey = sanitizeString(request.headers.get('X-Idempotency-Key') || '', 160);
  const bodyKey = sanitizeString(body?.idempotencyKey || '', 160);
  if (headerKey && bodyKey && headerKey !== bodyKey) {
    return { key: '', error: 'mismatch' };
  }
  const raw = headerKey || bodyKey;
  if (!raw) return { key: '', error: '' };
  if (!/^[A-Za-z0-9._:-]{8,160}$/.test(raw)) {
    return { key: '', error: 'invalid' };
  }
  return { key: raw, error: '' };
}

function promoPayloadHash(payload) {
  return [
    sanitizeString(payload.name || '', 200).toLowerCase(),
    sanitizeString(payload.birthdate || '', 20),
    String(payload.phone || '').replace(/\D/g, ''),
    payload.regulation_accept ? '1' : '0',
  ].join('|');
}

function promoResponse(data, status) {
  return { data, status };
}

async function obterLoteMensalSorteio(isoDatePrefix, env) {
  const loteMes = String(isoDatePrefix || '').slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(loteMes)) {
    return { loteMes: '', loteNumero: 0 };
  }
  const contadorKey = `meta:sorteio_lote_mes_contador:${loteMes}`;
  const atual = parseInt(await env.CLIENTES_KV.get(contadorKey) || '0', 10) || 0;
  const proximo = atual + 1;
  await env.CLIENTES_KV.put(contadorKey, String(proximo));
  return { loteMes, loteNumero: proximo };
}

async function handlePostSorteioCadastro(request, env) {
  const requestId = buildPromoRequestId();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'post-sorteio');
  if (!rl.allowed) {
    return jsonResp({
      success: false,
      code: 'PROMO_RATE_LIMIT',
      requestId,
      error: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
    }, 429);
  }

  let body;
  try { body = await request.json(); } catch {
    return jsonResp({
      success: false,
      code: 'PROMO_INVALID_JSON',
      requestId,
      error: 'Requisição inválida.',
    }, 400);
  }

  // Aceitar tanto "name" (front-end novo) quanto "nome" (retrocompatibilidade)
    const nome        = sanitizeString(body.name || body.nome, 200);
  const birthdate   = sanitizeString(body.birthdate || body.dataNasc, 20);
  const phone       = String(body.phone || body.cel || '').replace(/\D/g, '');
  const regAccept   = !!body.regulation_accept;
  const normalizedPayload = { name: nome, birthdate, phone, regulation_accept: regAccept };

  // Validação de campos obrigatórios e formato
  if (!regAccept) {
    return jsonResp({
      success: false,
      code: 'PROMO_REGULATION_REQUIRED',
      requestId,
      error: 'Você precisa aceitar o regulamento para participar.',
    }, 400);
  }
  if (!nome || nome.length < 3) {
    return jsonResp({
      success: false,
      code: 'PROMO_INVALID_NAME',
      requestId,
      error: 'Nome inválido. Use seu nome completo (mínimo 3 caracteres).',
    }, 400);
  }
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    return jsonResp({
      success: false,
      code: 'PROMO_INVALID_BIRTHDATE',
      requestId,
      error: 'Data de nascimento inválida. Use o formato AAAA-MM-DD.',
    }, 400);
  }
  if (!phone || !/^169\d{8}$/.test(phone)) {
    return jsonResp({
      success: false,
      code: 'PROMO_INVALID_PHONE',
      requestId,
      error: 'Celular inválido. Apenas DDD 16 é permitido (formato 169XXXXXXXX).',
    }, 400);
  }

  // Idade mínima: 14 anos
  const [ano, mes, dia] = birthdate.split('-').map(Number);
  const nasc  = new Date(ano, mes - 1, dia);
  const hoje  = new Date();
  let   idade = hoje.getFullYear() - nasc.getFullYear();
  if (hoje.getMonth() < nasc.getMonth() ||
      (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  if (idade < 14) {
   return jsonResp({
     success: false,
     code: 'PROMO_UNDERAGE',
     requestId,
     error: 'É necessário ter no mínimo 14 anos para participar.',
   }, 400);
   }
  const idempotency = getPromoIdempotencyKey(request, body);
  if (idempotency.error === 'mismatch') {
    return jsonResp({
      success: false,
      code: 'PROMO_IDEMPOTENCY_MISMATCH',
      requestId,
      error: 'Chave de idempotência inconsistente entre header e payload.',
    }, 400);
  }
  if (idempotency.error === 'invalid') {
    return jsonResp({
      success: false,
      code: 'PROMO_IDEMPOTENCY_INVALID',
      requestId,
      error: 'Chave de idempotência inválida.',
    }, 400);
  }
  const idempotencyKey = idempotency.key;
  const payloadHash = promoPayloadHash(normalizedPayload);
  const idempotencyKvKey = idempotencyKey ? `sorteio:idempotency:${idempotencyKey}` : '';

  if (idempotencyKvKey) {
    const existingOperation = await env.CLIENTES_KV.get(idempotencyKvKey, 'json');
    if (existingOperation) {
      if (!existingOperation.payloadHash) {
        return jsonResp({
          success: false,
          code: 'PROMO_IDEMPOTENCY_CONFLICT',
          requestId,
          error: 'Chave de idempotência já utilizada em uma operação inválida.',
        }, 409);
      }
      if (existingOperation.payloadHash && existingOperation.payloadHash !== payloadHash) {
        return jsonResp({
          success: false,
          code: 'PROMO_IDEMPOTENCY_CONFLICT',
          requestId,
          error: 'A mesma chave de idempotência foi reutilizada com dados diferentes.',
        }, 409);
      }
      if (existingOperation.response && existingOperation.statusCode) {
        return jsonResp(existingOperation.response, existingOperation.statusCode);
      }
      if (existingOperation.status === 'processing') {
        const startedAt = Date.parse(existingOperation.createdAt || '');
        const stale = !Number.isFinite(startedAt) || (Date.now() - startedAt > (SORTEIO_IDEMPOTENCY_PROCESSING_TTL_SECONDS * 1000));
        if (!stale) {
          return jsonResp({
            success: false,
            code: 'PROMO_REQUEST_IN_PROGRESS',
            requestId,
            error: 'Sua solicitação ainda está sendo processada. Tente novamente em instantes.',
          }, 409);
        }
      }
    }
  }

  if (idempotencyKvKey) {
   await env.CLIENTES_KV.put(idempotencyKvKey, JSON.stringify({
     payloadHash,
     status: 'processing',
     requestId,
     createdAt: new Date().toISOString(),
   }), { expirationTtl: SORTEIO_IDEMPOTENCY_PROCESSING_TTL_SECONDS });
  }

  let finalResult = null;

  // ── Verificar duplicidade por nome + data de nascimento (Regra 2.4) ──────────
  const nascKey = sorteioNascKey(nome, birthdate);
  let existingParticipantId = await env.CLIENTES_KV.get(nascKey);
  const mesAtual = new Date().toISOString().slice(0, 7); // AAAA-MM

  if (existingParticipantId) {
    // Verifica se o cadastro existente é do mês corrente
    const existingInscricao = await env.CLIENTES_KV.get(`sorteio:inscrito:${existingParticipantId}`, 'json');
    const mesExistente = existingInscricao
      ? String(existingInscricao.lote_mes || (existingInscricao.created_at || '').slice(0, 7))
      : '';
    if (mesExistente === mesAtual) {
      // Inscrição do mesmo mês — bloquear duplicidade
      finalResult = promoResponse({
        success: false,
        code: 'PROMO_REGISTRATION_EXISTS',
        requestId,
        registrationId: existingParticipantId,
        error: 'Você já está inscrito para a promoção deste mês.',
      }, 409);
    }
    // Se é de mês diferente, continua para criar nova inscrição (sobrescreve o índice)
    if (finalResult) existingParticipantId = existingParticipantId; // já bloqueado
    else existingParticipantId = null; // permite nova inscrição
  }

  if (!finalResult) {
    // Se não encontrou por nome+dataNasc, verifica por celular
    const existingIdCel = await env.CLIENTES_KV.get(`sorteio:idx:cel:${phone}`);
    if (existingIdCel) {
      const existingInscricaoCel = await env.CLIENTES_KV.get(`sorteio:inscrito:${existingIdCel}`, 'json');
      const mesExistenteCel = existingInscricaoCel
        ? String(existingInscricaoCel.lote_mes || (existingInscricaoCel.created_at || '').slice(0, 7))
        : '';
      if (mesExistenteCel === mesAtual) {
        existingParticipantId = existingIdCel;
        finalResult = promoResponse({
          success: false,
          code: 'PROMO_REGISTRATION_EXISTS_BY_PHONE',
          requestId,
          registrationId: existingParticipantId,
          error: 'Este celular já está inscrito na promoção deste mês.',
        }, 409);
      }
      // Se é de mês diferente, permite nova inscrição
    }
  }

  // ── Gerar novo ID de inscrição ou usar existente ────────────────────────────────
  let registrationId = existingParticipantId;
  if (!finalResult) {
    // Usa contador sequencial para garantir unicidade.
    // Formato do ID: ITAP-AAAA-MM-XXXX
    const contadorStr = await env.CLIENTES_KV.get('meta:sorteio_contador');
    let contador = parseInt(contadorStr || '0', 10);
    contador += 1;
    const agoraIso  = new Date().toISOString();
    const anoAtual  = agoraIso.slice(0, 4);
    const mesNum    = agoraIso.slice(5, 7);
    registrationId = `ITAP-${anoAtual}-${mesNum}-${String(contador).padStart(4, '0')}`;

    const lote = await obterLoteMensalSorteio(agoraIso, env);
    const inscricao = {
      id:                registrationId,
      nome,
      birthdate,
      phone,
      lote_mes:          lote.loteMes,
      lote_numero:       lote.loteNumero,
      regulation_accept: true,
      created_at:        agoraIso,
      requestId,
      idempotencyKey: idempotencyKey || null,
      historico_alteracoes: [],
    };

    // ── Persistir no KV ──────────────────────────────────────────────────────────
    await env.CLIENTES_KV.put(`sorteio:inscrito:${registrationId}`, JSON.stringify(inscricao));
    await env.CLIENTES_KV.put(`sorteio:idx:cel:${phone}`, registrationId);
    await env.CLIENTES_KV.put(nascKey, registrationId);
    await env.CLIENTES_KV.put('meta:sorteio_contador', String(contador));

    await registrarAudit(env, 'sorteio_cadastro', registrationId, {
      cel: `${phone.slice(0, 4)}*****${phone.slice(-2)}`,
      requestId,
      idempotencyKey: idempotencyKey || null,
    });

    finalResult = promoResponse({
      success: true,
      code: 'PROMO_REGISTRATION_CREATED',
      requestId,
      registrationId: registrationId,
    }, 201);
  }

  if (idempotencyKvKey) {
   await env.CLIENTES_KV.put(idempotencyKvKey, JSON.stringify({
     payloadHash,
     status: 'completed',
     requestId,
     response: finalResult.data,
     statusCode: finalResult.status,
     completedAt: new Date().toISOString(),
   }), { expirationTtl: SORTEIO_IDEMPOTENCY_TTL });
  }

  return jsonResp(finalResult.data, finalResult.status);
}

/**
 * GET /api/sorteio/buscar — localiza inscrição pública por nome + data de nascimento.
 *
 * Query params:
 *   nome     — nome completo do participante
 *   dataNasc — data de nascimento no formato AAAA-MM-DD
 *
 * Resposta em caso de encontrado:
 *   { found: true, registration: { id, phone, created_at } }
 * Resposta em caso de não encontrado:
 *   { found: false }
 */
async function handleGetSorteioBuscar(request, env, url) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'buscar-sorteio');
  if (!rl.allowed) {
    return jsonResp({ found: false, error: 'Muitas tentativas. Aguarde uma hora.' }, 429);
  }

  const nome     = sanitizeString(url.searchParams.get('nome') || '', 200);
  const dataNasc = sanitizeString(url.searchParams.get('dataNasc') || '', 20);

  if (!nome || nome.length < 3) {
    return jsonResp({ found: false, error: 'Nome inválido.' }, 400);
  }
  if (!dataNasc || !/^\d{4}-\d{2}-\d{2}$/.test(dataNasc)) {
    return jsonResp({ found: false, error: 'Data de nascimento inválida. Use o formato AAAA-MM-DD.' }, 400);
  }

  const nascKey = sorteioNascKey(nome, dataNasc);
  const id = await env.CLIENTES_KV.get(nascKey);
  if (!id) return jsonResp({ found: false }, 200);

  const inscricao = await env.CLIENTES_KV.get(`sorteio:inscrito:${id}`, 'json');
  if (!inscricao) return jsonResp({ found: false }, 200);

  return jsonResp({
    found: true,
    registration: {
      id:         inscricao.id,
      phone:      inscricao.phone,
      created_at: inscricao.created_at,
    },
  }, 200);
}

// ─── Sorteio KV key helpers ───────────────────────────────────────────────────
function normalizarNomeSorteio(nome) {
  return String(nome)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Chave KV para índice nome+dataNasc. */
function sorteioNascKey(nome, birthdate) {
  return `sorteio:idx:nasc:${normalizarNomeSorteio(nome)}__${birthdate}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS — ADMIN SORTEIO INSCRITOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/sorteio/inscritos — lista todos os inscritos no sorteio.
 * Requer autenticação admin.
 * Resposta: { ok: true, total: N, inscritos: [ { id, nome, birthdate, phone, created_at } ] }
 */
async function handleGetSorteioInscritos(env) {
  const lista = await env.CLIENTES_KV.list({ prefix: 'sorteio:inscrito:' });
  const inscritos = [];
  const BATCH = 25;
  const keys = lista.keys.map(k => k.name);
  for (let i = 0; i < keys.length; i += BATCH) {
    const lote = keys.slice(i, i + BATCH);
    await Promise.all(lote.map(async key => {
      const val = await env.CLIENTES_KV.get(key, 'json');
      if (val) inscritos.push(val);
    }));
  }
  inscritos.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return jsonResp({ ok: true, total: inscritos.length, inscritos });
}

/**
 * PATCH /api/admin/sorteio/inscritos/:id — atualiza nome, birthdate ou phone.
 * Campos aceitos: nome, birthdate, phone.
 * Mantém índices KV em sincronismo.
 */
async function handlePatchSorteioInscrito(id, request, env) {
  const inscricao = await env.CLIENTES_KV.get(`sorteio:inscrito:${id}`, 'json');
  if (!inscricao) return jsonResp({ ok: false, error: 'Inscrito não encontrado.' }, 404);

  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido.' }, 400); }

  // Remove índices antigos antes de atualizar
    const celAntigo = String(inscricao.phone || '').replace(/\D/g, '');
  const nascKeyAntigo = sorteioNascKey(inscricao.nome || '', inscricao.birthdate || '');

  // Captura os valores antigos para o histórico
  const oldNome = inscricao.nome;
  const oldBirthdate = inscricao.birthdate;
  const oldPhone = inscricao.phone;

  if (body.nome !== undefined)      inscricao.nome      = sanitizeString(body.nome, 200);
  if (body.birthdate !== undefined) inscricao.birthdate = sanitizeString(body.birthdate, 20);
  if (body.phone !== undefined)     inscricao.phone     = String(body.phone).replace(/\D/g, '');

  // Adiciona ao histórico de alterações
  if (!inscricao.historico_alteracoes) inscricao.historico_alteracoes = [];
  const agora = new Date().toISOString();

  if (oldNome !== inscricao.nome) {
    inscricao.historico_alteracoes.push({
      data: agora, campo: 'nome', valor_antigo: oldNome, valor_novo: inscricao.nome
    });
  }
  if (oldBirthdate !== inscricao.birthdate) {
    inscricao.historico_alteracoes.push({
      data: agora, campo: 'birthdate', valor_antigo: oldBirthdate, valor_novo: inscricao.birthdate
    });
  }
  if (oldPhone !== inscricao.phone) {
    inscricao.historico_alteracoes.push({
      data: agora, campo: 'phone', valor_antigo: oldPhone, valor_novo: inscricao.phone
    });
  }

  const celNovo  = String(inscricao.phone || '').replace(/\D/g, '');
  const nascKeyNovo = sorteioNascKey(inscricao.nome || '', inscricao.birthdate || '');

  // Verificar conflito: novo telefone já pertence a outro inscrito
  if (celNovo !== celAntigo && celNovo) {
    const conflito = await env.CLIENTES_KV.get(`sorteio:idx:cel:${celNovo}`);
    if (conflito && conflito !== id) return jsonResp({ ok: false, error: 'Este telefone já pertence a outro inscrito.' }, 409);
  }
  // Verificar conflito: novo nome+dataNasc já pertence a outro inscrito
  if (nascKeyNovo !== nascKeyAntigo) {
    const conflito = await env.CLIENTES_KV.get(nascKeyNovo);
    if (conflito && conflito !== id) return jsonResp({ ok: false, error: 'Já existe um inscrito com este nome e data de nascimento.' }, 409);
  }

  // Remover índices antigos se mudaram
  if (celNovo !== celAntigo && celAntigo) await env.CLIENTES_KV.delete(`sorteio:idx:cel:${celAntigo}`);
  if (nascKeyNovo !== nascKeyAntigo)      await env.CLIENTES_KV.delete(nascKeyAntigo);

  // Gravar índices novos
  if (celNovo)  await env.CLIENTES_KV.put(`sorteio:idx:cel:${celNovo}`, id);
  await env.CLIENTES_KV.put(nascKeyNovo, id);

  inscricao.updated_at = new Date().toISOString();
  await env.CLIENTES_KV.put(`sorteio:inscrito:${id}`, JSON.stringify(inscricao));

  await registrarAudit(env, 'sorteio_inscrito_editado', id, {});
  return jsonResp({ ok: true, inscrito: inscricao });
}

/**
 * DELETE /api/admin/sorteio/inscritos/:id — remove inscrito e seus índices.
 */
async function handleDeleteSorteioInscrito(id, env) {
  const inscricao = await env.CLIENTES_KV.get(`sorteio:inscrito:${id}`, 'json');
  if (!inscricao) return jsonResp({ ok: false, error: 'Inscrito não encontrado.' }, 404);

  const cel = String(inscricao.phone || '').replace(/\D/g, '');
  const nascKey = sorteioNascKey(inscricao.nome || '', inscricao.birthdate || '');

  await env.CLIENTES_KV.delete(`sorteio:inscrito:${id}`);
  if (cel)     await env.CLIENTES_KV.delete(`sorteio:idx:cel:${cel}`);
  await env.CLIENTES_KV.delete(nascKey);

  await registrarAudit(env, 'sorteio_inscrito_removido', id, {});
  return jsonResp({ ok: true });
}

/**
 * DELETE /api/admin/sorteio/inscritos/lote/:mes (AAAA-MM)
 * Remove todos os cadastros do mês informado.
 */
async function handleDeleteSorteioInscritosLoteMes(loteMes, env) {
  if (!/^\d{4}-\d{2}$/.test(loteMes)) {
    return jsonResp({ ok: false, error: 'Lote mensal inválido. Use AAAA-MM.' }, 400);
  }

  const lista = await env.CLIENTES_KV.list({ prefix: 'sorteio:inscrito:' });
  const keys = lista.keys.map(k => k.name);
  if (!keys.length) {
    return jsonResp({ ok: true, loteMes, removidos: 0 });
  }

  let removidos = 0;
  const BATCH = 25;
  for (let i = 0; i < keys.length; i += BATCH) {
    const lote = keys.slice(i, i + BATCH);
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(lote.map(async key => {
      const inscricao = await env.CLIENTES_KV.get(key, 'json');
      if (!inscricao) return;
      const mesInscricao = String(inscricao.lote_mes || (inscricao.created_at || '').slice(0, 7));
      if (mesInscricao !== loteMes) return;

      const id = String(inscricao.id || '').trim();
      if (!id) return;
      const cel = String(inscricao.phone || '').replace(/\D/g, '');
      const nascKey = sorteioNascKey(inscricao.nome || '', inscricao.birthdate || '');
      await env.CLIENTES_KV.delete(`sorteio:inscrito:${id}`);
      if (cel) await env.CLIENTES_KV.delete(`sorteio:idx:cel:${cel}`);
      await env.CLIENTES_KV.delete(nascKey);
      removidos += 1;
      await registrarAudit(env, 'sorteio_lote_mensal_removido', id, { loteMes });
    }));
  }

  return jsonResp({ ok: true, loteMes, removidos });
}
