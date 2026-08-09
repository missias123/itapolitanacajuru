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
async function isAdmin(request, env) {
  const sessionToken = request.headers.get('X-Itap-Session-Token') || '';
  if (sessionToken) {
    const valid = await env.RATE_KV.get(`session:${sessionToken}`);
    if (valid === '1') return true;
  }
  const secret = request.headers.get('X-Itap-Admin-Secret') || '';
  if (secret && env.ADMIN_SECRET && secret === env.ADMIN_SECRET) return true;
  return false;
}

// ─── PBKDF2 password hashing ──────────────────────────────────────────────────
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
  if (chunks.length !== 5) throw new Error('ADMIN_PASSWORD_RECORD inválido: formato incompleto');
  const [algo, vChunk, iterChunk, saltChunk, hashChunk] = chunks;
  if (algo !== ADMIN_PBKDF2_ALGO) throw new Error('ADMIN_PASSWORD_RECORD inválido: algoritmo não suportado');
  if (vChunk !== `v=${ADMIN_PBKDF2_VERSION}`) throw new Error('ADMIN_PASSWORD_RECORD inválido: versão não suportada');
  const iterations = Number(iterChunk.slice(5));
  const salt = saltChunk.slice(5);
  const hash = hashChunk.slice(5);
  return { iterations, salt, hash };
}

async function verifyAdminPassword(password, env) {
  if (!password) return false;
  if (env.ADMIN_PASSWORD_RECORD) {
    const record = parseAdminPasswordRecord(env.ADMIN_PASSWORD_RECORD);
    const derived = await pbkdf2Derive(password, record.salt, record.iterations);
    return timingSafeEqual(derived, record.hash);
  }
  if (env.ADMIN_HASH && env.ADMIN_SALT) {
    const derived = await pbkdf2Derive(password, env.ADMIN_SALT, PBKDF2_DEFAULT_ITERATIONS);
    return timingSafeEqual(derived, env.ADMIN_HASH);
  }
  if (env.ADMIN_SECRET) return timingSafeEqual(password, env.ADMIN_SECRET);
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
  const rlKey = `rl:${ip}:${key}`;
  const now = Date.now();
  const raw = await env.RATE_KV.get(rlKey, 'json');
  if (!raw || now - raw.window > cfg.windowMs) {
    await env.RATE_KV.put(rlKey, JSON.stringify({ count: 1, window: now }), { expirationTtl: Math.ceil(cfg.windowMs / 1000) * 2 });
    return { allowed: true, remaining: cfg.max - 1 };
  }
  if (raw.count >= cfg.max) return { allowed: false, remaining: 0 };
  raw.count += 1;
  await env.RATE_KV.put(rlKey, JSON.stringify(raw), { expirationTtl: Math.ceil(cfg.windowMs / 1000) * 2 });
  return { allowed: true, remaining: cfg.max - raw.count };
}

// ─── Input sanitization ───────────────────────────────────────────────────────
function sanitizeString(v, maxLen = 200) {
  return String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

// ─── Base64 encode for GitHub API ─────────────────────────────────────────────
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary  = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function generateIdHash() {
  const array = new Uint32Array(2);
  crypto.getRandomValues(array);
  return array[0].toString(36) + array[1].toString(36);
}

// ─── GitHub API helpers ───────────────────────────────────────────────────────
async function ghPutFidelidade(data, message, token) {
  const content = JSON.stringify(data, null, 2);
  const getResp = await fetch(GH_API + GH_ADMIN_JSON_PATHS.fidelidade, {
    headers: { 'Authorization': `token ${token}`, 'User-Agent': 'Itapolitana-Worker' }
  });
  if (!getResp.ok) throw new Error('Falha ao obter SHA do fidelidade.json');
  const getJson = await getResp.json();
  const putResp = await fetch(GH_API + GH_ADMIN_JSON_PATHS.fidelidade, {
    method: 'PUT',
    headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'Itapolitana-Worker' },
    body: JSON.stringify({ message, content: encodeBase64(content), sha: getJson.sha })
  });
  if (!putResp.ok) throw new Error('Falha ao gravar fidelidade.json no GitHub');
}

// ─── Router ───────────────────────────────────────────────────────────────────
async function router(request, env) {
  const url    = new URL(request.url);
  const path   = url.pathname;
  const method = request.method;

  if (path === '/api/health' && method === 'GET') {
    return jsonResp({ ok: true, ts: Date.now(), version: '1.0.0' });
  }

  if (path === '/api/admin/auth' && method === 'POST') return handleAdminAuth(request, env);
  if (path === '/api/admin/session' && method === 'POST') return handleAdminSession(request, env);
  if (path === '/api/admin/session' && method === 'DELETE') return handleAdminSessionLogout(request, env);

  if (path === '/api/admin/github-file' && method === 'GET') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleAdminGitHubFileGet(url.searchParams.get('path'), env);
  }
  if (path === '/api/admin/github-file' && method === 'PUT') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleAdminGitHubFilePut(request, env);
  }

  if (path === '/api/clientes' && method === 'POST') return handlePostCliente(request, env);
  if (path === '/api/clientes/login' && method === 'POST') return handleLoginCliente(request, env);
  if (path === '/api/clientes' && method === 'GET') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleGetClientes(env);
  }

  if (path === '/api/encomendas' && method === 'POST') return handlePostEncomenda(request, env);
  if (path === '/api/encomendas' && method === 'GET') {
    if (!(await isAdmin(request, env))) return jsonResp({ ok: false, error: 'Não autorizado' }, 401);
    return handleGetEncomendas(env);
  }

  if (path === '/api/promocao/cadastro' && method === 'POST') return handlePostSorteioCadastro(request, env);
  if (path === '/api/sorteio/buscar' && method === 'GET') return handleGetSorteioBuscar(request, env, url);

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

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function handleAdminSession(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'admin-login');
  if (!rl.allowed) return jsonResp({ ok: false, error: 'Muitas tentativas de login.' }, 429);
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const password = sanitizeString(body.password || body.secret, 200);
  if (!(await verifyAdminPassword(password, env))) return jsonResp({ ok: false, error: 'Senha incorreta' }, 401);
  const token = generateIdHash();
  await env.RATE_KV.put(`session:${token}`, '1', { expirationTtl: SESSION_TTL });
  return jsonResp({ ok: true, token });
}

async function handleAdminSessionLogout(request, env) {
  const token = request.headers.get('X-Itap-Session-Token');
  if (token) await env.RATE_KV.delete(`session:${token}`);
  return jsonResp({ ok: true });
}

async function handleAdminGitHubFileGet(filePath, env) {
  if (!GH_ADMIN_PATH_SET.has(filePath)) return jsonResp({ ok: false, error: 'Caminho não permitido' }, 403);
  const resp = await fetch(GH_RAW + filePath + '?t=' + Date.now(), { cache: 'no-store' });
  if (!resp.ok) return jsonResp({ ok: false, error: 'Falha ao ler arquivo' }, 500);
  return jsonResp({ ok: true, content: await resp.json() });
}

async function handleAdminGitHubFilePut(request, env) {
  if (!env.GITHUB_TOKEN) return jsonResp({ ok: false, error: 'GITHUB_TOKEN não configurado' }, 500);
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const filePath = sanitizeString(body.path, 200);
  if (!GH_ADMIN_PATH_SET.has(filePath)) return jsonResp({ ok: false, error: 'Caminho não permitido' }, 403);
  const getResp = await fetch(GH_API + filePath, { headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'User-Agent': 'Itapolitana-Worker' } });
  if (!getResp.ok) return jsonResp({ ok: false, error: 'Falha ao obter SHA' }, 500);
  const getJson = await getResp.json();
  const putResp = await fetch(GH_API + filePath, {
    method: 'PUT',
    headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'Itapolitana-Worker' },
    body: JSON.stringify({ message: `Admin: alteração em ${filePath}`, content: encodeBase64(JSON.stringify(body.content, null, 2)), sha: getJson.sha })
  });
  if (!putResp.ok) return jsonResp({ ok: false, error: 'Falha ao gravar arquivo' }, 500);
  return jsonResp({ ok: true });
}

async function handlePostCliente(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const cel = String(body.cel || '').replace(/\D/g, '');
  if (!/^169\d{8}$/.test(cel)) return jsonResp({ ok: false, error: 'Celular inválido (DDD 16 + 9 dígitos)' }, 400);
  const id = `cli:${cel}`;
  const existing = await env.CLIENTES_KV.get(id);
  if (existing) return jsonResp({ ok: false, error: 'Cliente já cadastrado' }, 409);
  const cliente = { cel, created_at: new Date().toISOString(), saldoPontos: 0, codigosUsados: [], resgates: [] };
  await env.CLIENTES_KV.put(id, JSON.stringify(cliente));
  return jsonResp({ ok: true, id });
}

async function handleLoginCliente(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const cel = String(body.cel || '').replace(/\D/g, '');
  const cliente = await env.CLIENTES_KV.get(`cli:${cel}`, 'json');
  if (!cliente) return jsonResp({ ok: false, error: 'Cliente não encontrado' }, 404);
  return jsonResp({ ok: true, cliente });
}

async function handleGetClientes(env) {
  const lista = await env.CLIENTES_KV.list({ prefix: 'cli:' });
  const clientes = [];
  for (const k of lista.keys) {
    const c = await env.CLIENTES_KV.get(k.name, 'json');
    if (c) clientes.push(c);
  }
  return jsonResp({ ok: true, total: clientes.length, clientes });
}

async function handlePostEncomenda(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const id = `enc:${Date.now()}:${generateIdHash().slice(0, 6)}`;
  const encomenda = { ...body, id, created_at: new Date().toISOString(), status: 'pendente' };
  await env.ENCOMENDAS_KV.put(id, JSON.stringify(encomenda));
  return jsonResp({ ok: true, id });
}

async function handleGetEncomendas(env) {
  const lista = await env.ENCOMENDAS_KV.list({ prefix: 'enc:' });
  const encomendas = [];
  for (const k of lista.keys) {
    const e = await env.ENCOMENDAS_KV.get(k.name, 'json');
    if (e) encomendas.push(e);
  }
  encomendas.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return jsonResp({ ok: true, total: encomendas.length, encomendas });
}

// ─── Sorteio Helpers ──────────────────────────────────────────────────────────
function normalizarNomeSorteio(nome) {
  return String(nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}
function sorteioNascKey(nome, birthdate, loteMes) {
  return `sorteio:idx:nasc:${loteMes}:${normalizarNomeSorteio(nome)}__${birthdate}`;
}
function sorteioCelKey(phone, loteMes) {
  return `sorteio:idx:cel:${loteMes}:${phone}`;
}
async function obterLoteMensalSorteio(isoDatePrefix, env) {
  const loteMes = String(isoDatePrefix || '').slice(0, 7);
  const contadorKey = `meta:sorteio_lote_mes_contador:${loteMes}`;
  const atual = parseInt(await env.CLIENTES_KV.get(contadorKey) || '0', 10) || 0;
  const proximo = atual + 1;
  await env.CLIENTES_KV.put(contadorKey, String(proximo));
  return { loteMes, loteNumero: proximo };
}

async function handlePostSorteioCadastro(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'post-sorteio');
  if (!rl.allowed) return jsonResp({ success: false, error: 'Muitas tentativas. Aguarde.' }, 429);
  let body;
  try { body = await request.json(); } catch { return jsonResp({ success: false, error: 'JSON inválido' }, 400); }
  const nome = sanitizeString(body.name || body.nome, 200);
  const birthdate = sanitizeString(body.birthdate || body.dataNasc, 20);
  const phone = String(body.phone || body.cel || '').replace(/\D/g, '');
  if (!body.regulation_accept) return jsonResp({ success: false, error: 'Aceite o regulamento' }, 400);
  if (!nome || nome.length < 3) return jsonResp({ success: false, error: 'Nome inválido' }, 400);
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return jsonResp({ success: false, error: 'Data inválida' }, 400);
  if (!phone || !/^169\d{8}$/.test(phone)) return jsonResp({ success: false, error: 'Apenas DDD 16 é permitido (formato 169XXXXXXXX).' }, 400);

  const agora = new Date().toISOString();
  const lote = await obterLoteMensalSorteio(agora, env);
  const loteMes = lote.loteMes;
  const nascKey = sorteioNascKey(nome, birthdate, loteMes);
  const celKey = sorteioCelKey(phone, loteMes);

  const existingId = await env.CLIENTES_KV.get(nascKey) || await env.CLIENTES_KV.get(celKey);
  if (existingId) return jsonResp({ success: false, error: 'Você já está cadastrado na promoção deste mês.', registrationId: existingId }, 409);

  const contadorStr = await env.CLIENTES_KV.get('meta:sorteio_contador');
  let contador = parseInt(contadorStr || '0', 10) + 1;
  const registrationId = `SRT-2026-${String(contador).padStart(4, '0')}-${generateIdHash().slice(0, 4)}`;
  const inscricao = { id: registrationId, nome, birthdate, phone, lote_mes: loteMes, lote_numero: lote.loteNumero, created_at: agora };

  await env.CLIENTES_KV.put(`sorteio:inscrito:${registrationId}`, JSON.stringify(inscricao));
  await env.CLIENTES_KV.put(nascKey, registrationId);
  await env.CLIENTES_KV.put(celKey, registrationId);
  await env.CLIENTES_KV.put('meta:sorteio_contador', String(contador));

  return jsonResp({ success: true, registrationId }, 201);
}

async function handleGetSorteioBuscar(request, env, url) {
  const nome = sanitizeString(url.searchParams.get('nome'), 200);
  const dataNasc = sanitizeString(url.searchParams.get('dataNasc'), 20);
  const loteMes = new Date().toISOString().slice(0, 7);
  const id = await env.CLIENTES_KV.get(sorteioNascKey(nome, dataNasc, loteMes));
  if (!id) return jsonResp({ found: false });
  const insc = await env.CLIENTES_KV.get(`sorteio:inscrito:${id}`, 'json');
  return jsonResp({ found: true, registration: { id, phone: insc.phone, created_at: insc.created_at } });
}

async function handleGetSorteioInscritos(env) {
  const lista = await env.CLIENTES_KV.list({ prefix: 'sorteio:inscrito:' });
  const inscritos = [];
  for (const k of lista.keys) {
    const val = await env.CLIENTES_KV.get(k.name, 'json');
    if (val) inscritos.push(val);
  }
  inscritos.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return jsonResp({ ok: true, total: inscritos.length, inscritos });
}

async function handlePatchSorteioInscrito(id, request, env) {
  const insc = await env.CLIENTES_KV.get(`sorteio:inscrito:${id}`, 'json');
  if (!insc) return jsonResp({ ok: false, error: 'Não encontrado' }, 404);
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const loteMes = insc.lote_mes;
  await env.CLIENTES_KV.delete(sorteioNascKey(insc.nome, insc.birthdate, loteMes));
  await env.CLIENTES_KV.delete(sorteioCelKey(insc.phone, loteMes));
  if (body.nome) insc.nome = sanitizeString(body.nome, 200);
  if (body.birthdate) insc.birthdate = sanitizeString(body.birthdate, 20);
  if (body.phone) insc.phone = String(body.phone).replace(/\D/g, '');
  await env.CLIENTES_KV.put(`sorteio:inscrito:${id}`, JSON.stringify(insc));
  await env.CLIENTES_KV.put(sorteioNascKey(insc.nome, insc.birthdate, loteMes), id);
  await env.CLIENTES_KV.put(sorteioCelKey(insc.phone, loteMes), id);
  return jsonResp({ ok: true, inscrito: insc });
}

async function handleDeleteSorteioInscrito(id, env) {
  const insc = await env.CLIENTES_KV.get(`sorteio:inscrito:${id}`, 'json');
  if (!insc) return jsonResp({ ok: false, error: 'Não encontrado' }, 404);
  const loteMes = insc.lote_mes;
  await env.CLIENTES_KV.delete(`sorteio:inscrito:${id}`);
  await env.CLIENTES_KV.delete(sorteioNascKey(insc.nome, insc.birthdate, loteMes));
  await env.CLIENTES_KV.delete(sorteioCelKey(insc.phone, loteMes));
  return jsonResp({ ok: true });
}

async function handleDeleteSorteioInscritosLoteMes(loteMes, env) {
  const lista = await env.CLIENTES_KV.list({ prefix: 'sorteio:inscrito:' });
  let removidos = 0;
  for (const k of lista.keys) {
    const insc = await env.CLIENTES_KV.get(k.name, 'json');
    if (insc && (insc.lote_mes === loteMes || insc.created_at.startsWith(loteMes))) {
      await handleDeleteSorteioInscrito(insc.id, env);
      removidos++;
    }
  }
  return jsonResp({ ok: true, loteMes, removidos });
}

function handleAdminAuth(request, env) {
  return handleAdminSession(request, env);
}
