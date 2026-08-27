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
  'post-cliente':     { max: 10, windowMs: 3_600_000 },
  'login':            { max: 20, windowMs: 3_600_000 },
  'admin-login':      { max: 10, windowMs: 3_600_000 },
  'post-enc':         { max: 10, windowMs: 3_600_000 },
  'resgatar':         { max: 10, windowMs: 3_600_000 },
  'post-sorteio':     { max: 3,  windowMs: 1_800_000 },
  'buscar-sorteio':   { max: 5,  windowMs: 3_600_000 },
  'picole-status':    { max: 240, windowMs: 3_600_000 }, // polling ~20s = 180/hr + buffer
  'picole-reservar':  { max: 5,  windowMs: 3_600_000 },  // 5 tentativas por hora por IP
  'picole-form':      { max: 5,  windowMs: 3_600_000 },  // 5 envios por hora por IP
};
const MAX_INVALID_CODE_ATTEMPTS = 4; // Block client after this many consecutive invalid code attempts
const SESSION_TTL = 7200;            // Admin session lifetime: 2 hours
const ADMIN_PERMISSION_LIST = Object.freeze([
  'catalog:read',
  'catalog:write',
  'orders:read',
  'orders:manage',
  'campaign:read',
  'campaign:configure',
  'campaign:activate',
  'reports:export',
  'audit:read',
]);
const ADMIN_ALL_PERMISSIONS = Object.freeze(new Set(ADMIN_PERMISSION_LIST));

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DURABLE OBJECT — reserva atômica do Picolé ──────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// Um DO por campanha e dia (idFromName = campanha:data local). Garante que somente UMA
// reserva é criada por dia dentro da campanha, independente de requisições simultâneas.
export class PicoleReservaDO {
  constructor(state, _env) {
    this.state = state;
  }

  async fetch(request) {
    const url    = new URL(request.url);
    const action = url.searchParams.get('action');

    // ── Ação: tentar reservar ────────────────────────────────────────────────
    if (action === 'reservar') {
      // blockConcurrencyWhile impede que qualquer outra requisição entre
      // enquanto este bloco crítico estiver em execução — leitura + escrita são atômicas.
      return this.state.blockConcurrencyWhile(async () => {
        const existente = await this.state.storage.get('reservaId');
        const idempotencyKey = url.searchParams.get('idempotencyKey') || '';
        if (existente) {
          const chaveExistente = await this.state.storage.get('idempotencyKey');
          // Repetição da mesma tentativa: devolve o mesmo vencedor para o Worker
          // poder reparar uma resposta perdida sem criar outro registro.
          if (idempotencyKey && chaveExistente && idempotencyKey === chaveExistente) {
            return new Response(
              JSON.stringify({ ganhou: true, idempotente: true, reservaId: existente }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          }
          // Outro cliente/tentativa: há vencedor e a solicitação é rejeitada.
          return new Response(
            JSON.stringify({ ganhou: false, reservaIdVencedor: existente }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Primeiro pedido: registra reserva e chave de forma atômica.
        const reservaId = url.searchParams.get('reservaId') || '';
        if (!reservaId) {
          return new Response(
            JSON.stringify({ ganhou: false, erro: 'reservaId ausente' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        await this.state.storage.put('reservaId', reservaId);
        if (idempotencyKey) await this.state.storage.put('idempotencyKey', idempotencyKey);
        return new Response(
          JSON.stringify({ ganhou: true, reservaId }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      });
    }

    // ── Ação: preencher formulário (atômico — impede duplo envio) ───────────────
    if (action === 'preencherFormulario') {
      return this.state.blockConcurrencyWhile(async () => {
        const reservaId = url.searchParams.get('reservaId') || '';
        const ganhadorId = await this.state.storage.get('reservaId');
        // Só o vencedor do dia pode preencher
        if (!ganhadorId || ganhadorId !== reservaId) {
          return new Response(
            JSON.stringify({ ok: false, erro: 'reservaId não corresponde ao vencedor do dia' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const jaPreenchido = await this.state.storage.get('formularioPreenchido');
        if (jaPreenchido) {
          const codigo = await this.state.storage.get('codigoRetirada');
          return new Response(
            JSON.stringify({ ok: true, jaPreenchido: true, codigoRetirada: codigo }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        const codigoRetirada = url.searchParams.get('codigoRetirada') || '';
        await this.state.storage.put('formularioPreenchido', true);
        await this.state.storage.put('codigoRetirada', codigoRetirada);
        return new Response(
          JSON.stringify({ ok: true, jaPreenchido: false, codigoRetirada }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      });
    }

    // ── Ação: consultar quem ganhou (uso admin/debug) ────────────────────────
    if (action === 'consultar') {
      const reservaId = await this.state.storage.get('reservaId');
      return new Response(
        JSON.stringify({ reservaId: reservaId || null }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Ação: resetar (uso exclusivo de cancelamento admin) ──────────────────
    if (action === 'resetar') {
      await this.state.storage.delete('reservaId');
      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ erro: 'Ação inválida' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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
function normalizePermissionList(raw) {
  if (!raw) return new Set(ADMIN_ALL_PERMISSIONS);
  const values = String(raw)
    .split(',')
    .map((entry) => sanitizeString(entry, 80))
    .filter(Boolean)
    .filter((entry) => ADMIN_ALL_PERMISSIONS.has(entry));
  return values.length ? new Set(values) : new Set(ADMIN_ALL_PERMISSIONS);
}

function parseStoredSession(stored, env) {
  if (!stored) return null;
  if (stored === '1' || stored === 1) {
    return {
      ok: true,
      permissions: normalizePermissionList(env.ADMIN_DEFAULT_PERMISSIONS),
      authType: 'legacy',
    };
  }
  if (typeof stored !== 'object') return null;
  const expiresAt = Number(stored.expiresAt || 0);
  if (expiresAt && Date.now() > expiresAt) return null;
  return {
    ok: true,
    permissions: new Set(
      Array.isArray(stored.permissions)
        ? stored.permissions.filter((entry) => ADMIN_ALL_PERMISSIONS.has(entry))
        : [...normalizePermissionList(env.ADMIN_DEFAULT_PERMISSIONS)],
    ),
    authType: 'session',
  };
}

async function getAdminSession(request, env) {
  const sessionToken = request.headers.get('X-Itap-Session-Token') || '';
  if (sessionToken) {
    const storedRaw = await env.RATE_KV.get(`session:${sessionToken}`, 'json');
    const parsed = parseStoredSession(storedRaw, env);
    if (parsed?.ok) return { authenticated: true, ...parsed };
    const legacyRaw = await env.RATE_KV.get(`session:${sessionToken}`);
    const legacyParsed = parseStoredSession(legacyRaw, env);
    if (legacyParsed?.ok) return { authenticated: true, ...legacyParsed };
  }
  const secret = request.headers.get('X-Itap-Admin-Secret') || '';
  if (secret && env.ADMIN_SECRET && secret === env.ADMIN_SECRET) {
    return { authenticated: true, permissions: new Set(ADMIN_ALL_PERMISSIONS), authType: 'secret' };
  }
  return { authenticated: false, permissions: new Set() };
}

function requireAdmin(session) {
  if (!session?.authenticated) return jsonResp({ ok: false, error: 'Sessão ausente ou inválida' }, 401);
  return null;
}

function requirePermission(session, permission) {
  if (!session?.authenticated) return jsonResp({ ok: false, error: 'Sessão ausente ou inválida' }, 401);
  if (!permission) return null;
  if (session.permissions.has(permission)) return null;
  return jsonResp({ ok: false, error: 'Permissão insuficiente', requiredPermission: permission }, 403);
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

async function sha256Hex(value) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readGitHubFileMeta(path, env) {
  const headers = { 'User-Agent': 'Itapolitana-Worker' };
  if (env.GITHUB_TOKEN) headers.Authorization = `token ${env.GITHUB_TOKEN}`;
  const ghResp = await fetch(GH_API + path, { headers });
  if (ghResp.ok) {
    const ghJson = await ghResp.json();
    return {
      revision: ghJson.sha || null,
      source: 'github_api',
      updatedAt: new Date().toISOString(),
    };
  }
  const rawResp = await fetch(GH_RAW + path + '?t=' + Date.now(), { cache: 'no-store' });
  if (!rawResp.ok) {
    return {
      revision: null,
      source: 'unavailable',
      updatedAt: null,
      error: `HTTP_${rawResp.status}`,
    };
  }
  const text = await rawResp.text();
  return {
    revision: await sha256Hex(text),
    source: 'github_raw_hash',
    updatedAt: new Date().toISOString(),
  };
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
  let adminSession = null;
  const getSession = async () => {
    if (!adminSession) adminSession = await getAdminSession(request, env);
    return adminSession;
  };

  if (path === '/api/health' && method === 'GET') {
    return jsonResp({ ok: true, ts: Date.now(), version: '1.0.0' });
  }

  if (path === '/api/admin/auth' && method === 'POST') return handleAdminAuth(request, env);
  if (path === '/api/admin/session' && method === 'POST') return handleAdminSession(request, env);
  if (path === '/api/admin/session' && method === 'DELETE') return handleAdminSessionLogout(request, env);

  if (path === '/api/admin/pbkdf2-selftest' && method === 'POST') return handlePbkdf2Selftest(request, env);
  if (path === '/api/admin/generate-hash' && method === 'POST') return handleGenerateHash(request, env);

  if (path === '/api/admin/sync/domains' && method === 'GET') {
    const guard = requirePermission(await getSession(), 'audit:read');
    if (guard) return guard;
    return handleAdminSyncDomains(env);
  }

  if (path === '/api/admin/github-file' && method === 'GET') {
    const guard = requirePermission(await getSession(), 'catalog:read');
    if (guard) return guard;
    return handleAdminGitHubFileGet(url.searchParams.get('path'), env);
  }
  if (path === '/api/admin/github-file' && method === 'PUT') {
    const guard = requirePermission(await getSession(), 'catalog:write');
    if (guard) return guard;
    return handleAdminGitHubFilePut(request, env);
  }

  if (path === '/api/clientes' && method === 'POST') return handlePostCliente(request, env);
  if (path === '/api/clientes/login' && method === 'POST') return handleLoginCliente(request, env);
  if (path === '/api/clientes' && method === 'GET') {
    const guard = requirePermission(await getSession(), 'orders:read');
    if (guard) return guard;
    return handleGetClientes(env);
  }

  if (path === '/api/encomendas' && method === 'POST') return handlePostEncomenda(request, env);
  if (path === '/api/encomendas' && method === 'GET') {
    const session = await getSession();
    const guard = requirePermission(session, 'orders:read');
    if (guard) return guard;
    return handleGetEncomendas(env, url, session);
  }

  if (path === '/api/promocao/cadastro' && method === 'POST') return handlePostSorteioCadastro(request, env);
  if (path === '/api/sorteio/buscar' && method === 'GET') return handleGetSorteioBuscar(request, env, url);

  if (path === '/api/admin/sorteio/inscritos' && method === 'GET') {
    const guard = requirePermission(await getSession(), 'campaign:read');
    if (guard) return guard;
    return handleGetSorteioInscritos(env);
  }

  const mSorteioLoteMes = path.match(/^\/api\/admin\/sorteio\/inscritos\/lote\/(\d{4}-\d{2})$/);
  if (mSorteioLoteMes) {
    const loteMes = mSorteioLoteMes[1];
    const guard = requirePermission(await getSession(), 'campaign:configure');
    if (guard) return guard;
    if (method === 'DELETE') return handleDeleteSorteioInscritosLoteMes(loteMes, env);
  }

  const mSorteio = path.match(/^\/api\/admin\/sorteio\/inscritos\/([^/]+)$/);
  if (mSorteio) {
    const id = decodeURIComponent(mSorteio[1]);
    const guard = requirePermission(await getSession(), 'campaign:configure');
    if (guard) return guard;
    if (method === 'PATCH') return handlePatchSorteioInscrito(id, request, env);
    if (method === 'DELETE') return handleDeleteSorteioInscrito(id, env);
  }

  if (path === '/api/promocao/picole/status' && method === 'GET') return handlePicoleStatus(request, env);
  if (path === '/api/promocao/picole/reservar' && method === 'POST') return handlePicoleReservar(request, env);

  const mPicoleReserva = path.match(/^\/api\/promocao\/picole\/reserva\/([A-Za-z0-9_-]{10,64})$/);
  if (mPicoleReserva) {
    const reservaId = mPicoleReserva[1];
    if (method === 'GET')  return handlePicoleReservaGet(reservaId, request, env);
    if (method === 'POST') return handlePicoleReservaForm(reservaId, request, env);
  }

  if (path === '/api/admin/promocao/picole/iniciar' && method === 'POST') {
    const guard = requirePermission(await getSession(), 'campaign:activate');
    if (guard) return guard;
    return handlePicoleAdminIniciar(request, env);
  }
  if (path === '/api/admin/promocao/picole/campanha' && method === 'GET') {
    const guard = requirePermission(await getSession(), 'campaign:read');
    if (guard) return guard;
    return handlePicoleAdminCampanha(env);
  }
  if (path === '/api/admin/promocao/picole/campanha' && method === 'DELETE') {
    const guard = requirePermission(await getSession(), 'campaign:activate');
    if (guard) return guard;
    return handlePicoleAdminCancelarCampanha(request, env);
  }
  if (path === '/api/admin/promocao/picole/pausar' && method === 'POST') {
    const guard = requirePermission(await getSession(), 'campaign:activate');
    if (guard) return guard;
    return handlePicoleAdminTogglePausa(env, true);
  }
  if (path === '/api/admin/promocao/picole/retomar' && method === 'POST') {
    const guard = requirePermission(await getSession(), 'campaign:activate');
    if (guard) return guard;
    return handlePicoleAdminTogglePausa(env, false);
  }
  if (path === '/api/admin/promocao/picole/ganhadores' && method === 'GET') {
    const guard = requirePermission(await getSession(), 'reports:export');
    if (guard) return guard;
    return handlePicoleAdminGanhadores(env);
  }
  const mPicoleGanhador = path.match(/^\/api\/admin\/promocao\/picole\/ganhadores\/([A-Za-z0-9_-]{10,64})$/);
  if (mPicoleGanhador) {
    const gid = mPicoleGanhador[1];
    const guard = requirePermission(await getSession(), 'campaign:configure');
    if (guard) return guard;
    if (method === 'PATCH') return handlePicoleAdminPatchGanhador(gid, request, env);
  }

  return jsonResp({ ok: false, error: 'Rota não encontrada' }, 404);
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function handleAdminSession(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'admin-login');
  if (!rl.allowed) return jsonResp({ ok: false, error: 'Muitas tentativas de login.' }, 429);
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'Payload inválido' }, 400); }
  const password = sanitizeString(body.password || body.secret, 200);
  if (!(await verifyAdminPassword(password, env))) return jsonResp({ ok: false, error: 'Sessão ausente ou inválida' }, 401);
  const permissions = [...normalizePermissionList(env.ADMIN_DEFAULT_PERMISSIONS)];
  const token = generateIdHash();
  await env.RATE_KV.put(`session:${token}`, JSON.stringify({
    permissions,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + SESSION_TTL * 1000,
  }), { expirationTtl: SESSION_TTL });
  return jsonResp({ ok: true, token, permissions, ttlSeconds: SESSION_TTL });
}

async function handleAdminSessionLogout(request, env) {
  const token = request.headers.get('X-Itap-Session-Token');
  if (token) await env.RATE_KV.delete(`session:${token}`);
  return jsonResp({ ok: true });
}

async function handlePbkdf2Selftest(request, env) {
  if (env.ENVIRONMENT === 'production') {
    return jsonResp({ ok: false, error: 'Endpoint disponível apenas em staging/local' }, 403);
  }
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const setupKey = sanitizeString(body.setup_key || '', 200);
  if (!setupKey || !env.SETUP_KEY || !(await timingSafeEqual(setupKey, String(env.SETUP_KEY)))) {
    return jsonResp({ ok: false, error: 'SETUP_KEY ausente ou incorreta' }, 401);
  }
  const iterations = Number(body.iterations ?? PBKDF2_DEFAULT_ITERATIONS);
  if (!Number.isInteger(iterations) || iterations < PBKDF2_MIN_ITERATIONS || iterations > PBKDF2_MAX_ITERATIONS) {
    return jsonResp({ ok: false, error: `iterations deve ser inteiro entre ${PBKDF2_MIN_ITERATIONS} e ${PBKDF2_MAX_ITERATIONS}` }, 400);
  }
  const samples = Number(body.samples ?? 1);
  if (!Number.isInteger(samples) || samples < 1 || samples > 10) {
    return jsonResp({ ok: false, error: 'samples deve ser um inteiro entre 1 e 10' }, 400);
  }
  const dummySalt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
  const timingsMs = [];
  try {
    for (let i = 0; i < samples; i++) {
      const t0 = performance.now();
      await pbkdf2Derive('selftest-dummy-password', dummySalt, iterations);
      timingsMs.push(Math.round((performance.now() - t0) * 100) / 100);
    }
  } catch (e) {
    return jsonResp({ ok: false, error: e.message }, 500);
  }
  return jsonResp({
    ok: true,
    algorithm: 'PBKDF2-HMAC-SHA-256',
    environment: env.ENVIRONMENT || 'unknown',
    iterations,
    timingsMs,
  });
}

async function handleGenerateHash(request, env) {
  if (env.ENVIRONMENT === 'production') {
    return jsonResp({ ok: false, error: 'Endpoint disponível apenas em staging/local' }, 403);
  }
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const setupKey = sanitizeString(body.setup_key || '', 200);
  if (!setupKey || !env.SETUP_KEY || !(await timingSafeEqual(setupKey, String(env.SETUP_KEY)))) {
    return jsonResp({ ok: false, error: 'SETUP_KEY ausente ou incorreta' }, 401);
  }
  const password = sanitizeString(body.password || '', 200);
  if (password.length < 16) {
    return jsonResp({ ok: false, error: 'Senha deve ter pelo menos 16 caracteres' }, 400);
  }
  const iterations = Number(body.iterations ?? PBKDF2_DEFAULT_ITERATIONS);
  if (!Number.isInteger(iterations) || iterations < PBKDF2_MIN_ITERATIONS || iterations > PBKDF2_MAX_ITERATIONS) {
    return jsonResp({ ok: false, error: `iterations deve ser inteiro entre ${PBKDF2_MIN_ITERATIONS} e ${PBKDF2_MAX_ITERATIONS}` }, 400);
  }
  const saltBytes = crypto.getRandomValues(new Uint8Array(32));
  const saltBase64 = bytesToBase64(saltBytes);
  let hash;
  try {
    hash = await pbkdf2Derive(password, saltBase64, iterations);
  } catch (e) {
    return jsonResp({ ok: false, error: e.message }, 500);
  }
  const record = `${ADMIN_PBKDF2_ALGO}$v=${ADMIN_PBKDF2_VERSION}$iter=${iterations}$salt=${saltBase64}$hash=${hash}`;
  return jsonResp({ ok: true, ADMIN_PASSWORD_RECORD: record, iterations, algorithm: 'PBKDF2-HMAC-SHA-256' });
}

async function handleAdminGitHubFileGet(filePath, env) {
  if (!GH_ADMIN_PATH_SET.has(filePath)) return jsonResp({ ok: false, error: 'Caminho não permitido' }, 403);
  const resp = await fetch(GH_RAW + filePath + '?t=' + Date.now(), { cache: 'no-store' });
  if (!resp.ok) return jsonResp({ ok: false, error: 'Falha ao ler arquivo' }, 500);
  const content = await resp.json();
  return jsonResp({
    ok: true,
    content,
    revision: await sha256Hex(JSON.stringify(content)),
    updatedAt: new Date().toISOString(),
    origin: 'github_raw',
  });
}

async function handleAdminGitHubFilePut(request, env) {
  if (!env.GITHUB_TOKEN) return jsonResp({ ok: false, error: 'GITHUB_TOKEN não configurado' }, 500);
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'Payload inválido' }, 422); }
  const filePath = sanitizeString(body.path, 200);
  const ifMatch = sanitizeString(body.ifMatch || request.headers.get('If-Match') || '', 200);
  if (!GH_ADMIN_PATH_SET.has(filePath)) return jsonResp({ ok: false, error: 'Caminho não permitido' }, 403);
  const getResp = await fetch(GH_API + filePath, { headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'User-Agent': 'Itapolitana-Worker' } });
  if (!getResp.ok) return jsonResp({ ok: false, error: 'Falha ao obter SHA' }, 500);
  const getJson = await getResp.json();
  if (ifMatch && ifMatch !== getJson.sha) {
    return jsonResp({
      ok: false,
      error: 'Conflito de versão',
      code: 'VERSION_CONFLICT',
      currentRevision: getJson.sha,
      providedRevision: ifMatch,
    }, 409);
  }
  const putResp = await fetch(GH_API + filePath, {
    method: 'PUT',
    headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'Itapolitana-Worker' },
    body: JSON.stringify({ message: `Admin: alteração em ${filePath}`, content: encodeBase64(JSON.stringify(body.content, null, 2)), sha: getJson.sha })
  });
  if (putResp.status === 409) return jsonResp({ ok: false, error: 'Conflito de versão', code: 'VERSION_CONFLICT' }, 409);
  if (!putResp.ok) return jsonResp({ ok: false, error: 'Falha ao gravar arquivo' }, 500);
  const putJson = await putResp.json();
  return jsonResp({
    ok: true,
    revision: putJson?.content?.sha || null,
    updatedAt: new Date().toISOString(),
    origin: 'github_api',
  });
}

async function handleAdminSyncDomains(env) {
  const catalogMeta = await readGitHubFileMeta(GH_ADMIN_JSON_PATHS.produtos, env);
  const configMeta = await readGitHubFileMeta(GH_ADMIN_JSON_PATHS.config, env);
  const ordersList = await env.ENCOMENDAS_KV.list({ prefix: 'enc:' });
  const campaign = env.PROMO_KV ? await env.PROMO_KV.get('picole:campanha', 'json') : null;
  return jsonResp({
    ok: true,
    generatedAt: new Date().toISOString(),
    domains: [
      { domain: 'catalog', sourceOfTruth: GH_ADMIN_JSON_PATHS.produtos, writePath: 'admin_authenticated_github', state: catalogMeta.revision ? 'synchronized' : 'not_verified', ...catalogMeta },
      { domain: 'editorial_config', sourceOfTruth: GH_ADMIN_JSON_PATHS.config, writePath: 'admin_authenticated_github', state: configMeta.revision ? 'synchronized' : 'not_verified', ...configMeta },
      {
        domain: 'orders',
        sourceOfTruth: 'worker.ENCOMENDAS_KV',
        writePath: 'public_form_to_worker',
        state: 'synchronized',
        revision: String(ordersList.keys.length),
        updatedAt: new Date().toISOString(),
      },
      {
        domain: 'campaign_picole',
        sourceOfTruth: 'worker.PROMO_KV',
        writePath: 'admin_authenticated_worker',
        state: campaign ? 'synchronized' : 'blocked',
        revision: campaign?.id || null,
        updatedAt: campaign?.atualizadoEm || null,
      },
    ],
  });
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

let catalogCache = { loadedAt: 0, activeSkus: new Set() };
async function getActiveCatalogSkus() {
  const now = Date.now();
  if (catalogCache.loadedAt && now - catalogCache.loadedAt < 5 * 60_000) return catalogCache.activeSkus;
  const resp = await fetch(GH_RAW + GH_ADMIN_JSON_PATHS.produtos + '?t=' + now, { cache: 'no-store' });
  if (!resp.ok) throw new Error('Falha ao carregar catálogo oficial');
  const json = await resp.json();
  const entries = Object.values(json?.cadastro_skus?.por_chave || {});
  const active = new Set(entries.filter((entry) => entry?.ativo !== false && entry?.sku).map((entry) => String(entry.sku)));
  catalogCache = { loadedAt: now, activeSkus: active };
  return active;
}

function normalizeOrderItem(item, index) {
  if (!item || typeof item !== 'object') throw new Error(`item_${index}_invalido`);
  const sku = sanitizeString(item.sku || item.codigo || '', 64);
  const quantity = Number(item.quantidade ?? item.quantity);
  if (!sku) throw new Error(`item_${index}_sku_obrigatorio`);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 200) throw new Error(`item_${index}_quantidade_invalida`);
  return { sku, quantidade: quantity };
}

async function normalizeOrderPayload(body) {
  const nome = sanitizeString(body.nome || body.name, 200);
  const telefone = String(body.telefone || body.phone || body.cel || '').replace(/\D/g, '');
  const itensRaw = Array.isArray(body.itens) ? body.itens : (Array.isArray(body.items) ? body.items : []);
  if (!nome || nome.length < 3) throw new Error('nome_invalido');
  if (!/^169\d{8}$/.test(telefone)) throw new Error('telefone_invalido');
  if (!itensRaw.length || itensRaw.length > 100) throw new Error('itens_invalidos');
  const itens = itensRaw.map(normalizeOrderItem);
  const skusAtivos = await getActiveCatalogSkus();
  for (const item of itens) {
    if (!skusAtivos.has(item.sku)) throw new Error(`sku_inexistente:${item.sku}`);
  }
  return {
    nome,
    telefone,
    itens,
    horario: sanitizeString(body.horario || '', 10),
    dataRetirada: sanitizeString(body.data_retirada || body.dataRetirada || '', 20),
    pagamento: sanitizeString(body.pagamento || '', 120),
    observacoes: sanitizeString(body.observacoes || body.notes || '', 600),
  };
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

async function handlePostEncomenda(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'Payload inválido' }, 422); }
  const idempotencyHeader = request.headers.get('X-Idempotency-Key') || '';
  const idempotencyKey = /^[A-Za-z0-9_-]{16,100}$/.test(idempotencyHeader)
    ? idempotencyHeader
    : sanitizeString(body.idempotencyKey || '', 100);
  if (idempotencyKey) {
    const existingOrderId = await env.ENCOMENDAS_KV.get(`enc:idem:${idempotencyKey}`);
    if (existingOrderId) {
      const existing = await env.ENCOMENDAS_KV.get(existingOrderId, 'json');
      if (existing) {
        return jsonResp({ ok: true, id: existing.id, orderId: existing.id, status: existing.status, idempotente: true }, 200);
      }
    }
  }
  let normalized;
  try {
    normalized = await normalizeOrderPayload(body);
  } catch (error) {
    const message = String(error?.message || 'payload_invalido');
    return jsonResp({ ok: false, error: 'Payload inválido', code: message }, 422);
  }
  const id = `enc:${Date.now()}:${generateIdHash().slice(0, 6)}`;
  const now = new Date().toISOString();
  const eventId = sanitizeString(body.eventId || request.headers.get('X-Event-Id') || '', 100) || null;
  const encomenda = {
    id,
    orderId: id,
    status: 'recebido',
    revision: 1,
    updatedAt: now,
    created_at: now,
    origem: 'site_worker',
    eventId,
    idempotencyKey: idempotencyKey || null,
    cliente: {
      nome: normalized.nome,
      telefone: normalized.telefone,
    },
    itens: normalized.itens,
    horario: normalized.horario,
    dataRetirada: normalized.dataRetirada,
    pagamento: normalized.pagamento,
    observacoes: normalized.observacoes,
  };
  await env.ENCOMENDAS_KV.put(id, JSON.stringify(encomenda));
  if (idempotencyKey) await env.ENCOMENDAS_KV.put(`enc:idem:${idempotencyKey}`, id, { expirationTtl: 7 * 24 * 3600 });
  return jsonResp({ ok: true, id, orderId: id, status: 'recebido' }, 201);
}

async function handleGetEncomendas(env, url, session) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10) || 20));
  const statusFilter = sanitizeString(url.searchParams.get('status') || '', 40);
  const includeSensitive = url.searchParams.get('includeSensitive') === 'true' && session.permissions.has('orders:manage');
  const lista = await env.ENCOMENDAS_KV.list({ prefix: 'enc:' });
  const encomendas = [];
  for (const k of lista.keys) {
    const e = await env.ENCOMENDAS_KV.get(k.name, 'json');
    if (e && (!statusFilter || e.status === statusFilter)) {
      const clone = { ...e };
      if (!includeSensitive && clone.cliente) {
        clone.cliente = {
          nome: clone.cliente.nome ? `${String(clone.cliente.nome).slice(0, 1)}***` : '',
          telefone: maskPhone(clone.cliente.telefone),
        };
      }
      encomendas.push(clone);
    }
  }
  encomendas.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = encomendas.length;
  const start = (page - 1) * pageSize;
  const pageItems = encomendas.slice(start, start + pageSize);
  return jsonResp({
    ok: true,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    includeSensitive,
    encomendas: pageItems,
  });
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

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PROMOÇÃO PICOLÉ 30 DIAS ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Fuso horário de São Paulo
const SP_TIMEZONE = 'America/Sao_Paulo';
const PICOLE_CAMPANHA_DIAS = 30;
const PICOLE_JANELA_INICIO = '11:00';
const PICOLE_JANELA_FIM = '20:00';   // limite para sortear horários
const PICOLE_JANELA_DURACAO_MS = 5_000; // janela válida de clique: exatamente 5s
const PICOLE_AUDITORIA_TTL_S = 7 * 24 * 3600;

// Retorna a data local em SP no formato YYYY-MM-DD
function hojeEmSP() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: SP_TIMEZONE });
}

function mascararIp(ip) {
  const v = String(ip || '').trim();
  if (v.includes(':')) {
    const groups = v.split(':').filter(Boolean);
    if (!groups.length) return 'ipv6:*';
    return groups.slice(0, 3).join(':') + ':*';
  }
  const p = v.split('.');
  if (p.length !== 4) return 'unknown';
  return `${p[0]}.${p[1]}.${p[2]}.*`;
}

async function registrarAuditoriaPicole(env, evento, payload = {}) {
  if (!env.PROMO_KV) return;
  const hoje = hojeEmSP();
  const ts = new Date().toISOString();
  const rnd = Math.random().toString(36).slice(2, 10);
  const key = `picole:audit:${hoje}:${Date.now()}:${rnd}`;
  const body = { evento, ts, ...payload };
  await env.PROMO_KV.put(key, JSON.stringify(body), { expirationTtl: PICOLE_AUDITORIA_TTL_S });
}

// Converte "HH:MM:SS" + data local "YYYY-MM-DD" em timestamp UTC (ms)
function localHorarioParaUtc(dataLocal, horarioLocal) {
  // Monta string ISO sem fuso, interpreta como hora local de SP via Intl
  // Técnica: usamos Date.parse com offset real calculado para SP
  // Cria uma data "naive" em UTC que representa o horário de SP
  // Calculamos: obter offset de SP para uma data específica
  const naive = new Date(`${dataLocal}T${horarioLocal}`);
  // Offset real de SP naquela data/hora (pode ser -3 ou -2 no horário de verão)
  const spDateStr = naive.toLocaleString('en-CA', { timeZone: SP_TIMEZONE, hour12: false });
  // spDateStr: YYYY-MM-DD, HH:MM:SS
  const parts = spDateStr.match(/^(\d{4}-\d{2}-\d{2}),?\s+(\d{2}:\d{2}:\d{2})$/);
  if (!parts) {
    // fallback: assume UTC-3
    return naive.getTime() + 3 * 3_600_000;
  }
  const spDate = new Date(`${parts[1]}T${parts[2]}Z`);
  const offset = naive.getTime() - spDate.getTime();
  return naive.getTime() + offset;
}

// Gera 30 horários aleatórios bem distribuídos entre 11:00 e 20:00
// Usa segmentos de 18 minutos para garantir diversidade
function gerarHorariosDiversificados(n) {
  // Janela: 11:00:00 a 19:59:59 = 32400 segundos
  const INICIO_S = 11 * 3600;
  const FIM_S    = 20 * 3600 - 1;
  const SPAN_S   = FIM_S - INICIO_S + 1; // 32400
  // Divide em n segmentos e pega um valor aleatório em cada
  const segSize  = Math.floor(SPAN_S / n);
  const horarios = [];
  const arr32 = new Uint32Array(n);
  crypto.getRandomValues(arr32);
  for (let i = 0; i < n; i++) {
    const base  = INICIO_S + i * segSize;
    const extra = arr32[i] % segSize;
    const total = base + extra;
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    horarios.push(`${h}:${m}:${s}`);
  }
  // Embaralha para que os dias não sigam ordem previsível de horário.
  const shuffleSeed = new Uint32Array(n);
  crypto.getRandomValues(shuffleSeed);
  for (let i = n - 1; i > 0; i--) {
    const j = shuffleSeed[i] % (i + 1);
    const tmp = horarios[i];
    horarios[i] = horarios[j];
    horarios[j] = tmp;
  }
  return horarios;
}

function montarCampanhaPicole(dataInicio, agoraIso) {
  const dataFim = adicionarDias(dataInicio, PICOLE_CAMPANHA_DIAS - 1);
  return {
    // ID único por ciclo: evita reutilizar o estado do DO se o admin cancelar e
    // iniciar outra campanha no mesmo dia.
    id: `promo-picole-30-dias-${dataInicio}-${gerarReservaId().slice(0, 8)}`,
    nome: 'Picolé de Fruta Grátis',
    dataInicio,
    dataFim,
    fusoHorario: SP_TIMEZONE,
    quantidadeDias: PICOLE_CAMPANHA_DIAS,
    ativo: true,
    pausado: false,
    produtoDescricao: '1 picolé de fruta, conforme disponibilidade da loja',
    regras: {
      umGanhadorPorDia: true,
      duracaoJanelaSegundos: 5,
      inicioSorteio: PICOLE_JANELA_INICIO,
      fimSorteio: PICOLE_JANELA_FIM,
      horarioExatoSemRepeticao: true,
      observacaoHorario: 'um horário exato diferente por dia dentro da faixa; a faixa do mês se repete, não o segundo sorteado',
    },
    criadoEm: agoraIso,
    atualizadoEm: agoraIso,
  };
}

async function persistirCampanhaPicole(env, campanha, agoraIso) {
  const horarios = gerarHorariosDiversificados(PICOLE_CAMPANHA_DIAS);
  await env.PROMO_KV.put('picole:campanha', JSON.stringify(campanha));
  const dias = [];
  for (let i = 0; i < PICOLE_CAMPANHA_DIAS; i++) {
    const dataLocal = adicionarDias(campanha.dataInicio, i);
    const dia = {
      id: `${campanha.id}-${String(i + 1).padStart(3, '0')}`,
      campanhaId: campanha.id,
      dataLocal,
      horarioSorteado: horarios[i],
      status: 'agendado',
      vencedorId: null,
      criadoEm: agoraIso,
      atualizadoEm: agoraIso,
    };
    await env.PROMO_KV.put(`picole:dia:${dataLocal}`, JSON.stringify(dia));
    dias.push({ dataLocal, id: dia.id });
  }
  return dias;
}

async function criarCampanhaPicole(env, { dataInicio, forcar = false, origem = 'manual' } = {}) {
  if (!env.PROMO_KV) return { ok: false, error: 'PROMO_KV não configurado. Crie o namespace e atualize wrangler.toml.' };
  const inicio = sanitizeString(dataInicio || hojeEmSP(), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
    return { ok: false, error: 'dataInicio inválida. Use YYYY-MM-DD.' };
  }
  const campanhaExistente = await env.PROMO_KV.get('picole:campanha', 'json');
  if (campanhaExistente && campanhaExistente.ativo && !forcar) {
    return { ok: false, error: 'Já existe uma campanha ativa. Use forcar:true para sobrescrever.' };
  }
  const agora = new Date().toISOString();
  const campanha = {
    ...montarCampanhaPicole(inicio, agora),
    origem,
    // Somente a rota administrativa autenticada pode criar uma campanha
    // operável. GET público e auditorias nunca recebem esta marca.
    ativacaoAdmin: origem === 'manual',
    ativacaoAdminEm: origem === 'manual' ? agora : null,
  };
  const dias = await persistirCampanhaPicole(env, campanha, agora);
  return { ok: true, campanha, dias };
}

// Leitura pura do ciclo operacional. Não cria, pausa, expira nem altera dias.
// A ativação só é válida quando a campanha foi criada pela rota administrativa
// autenticada e recebeu ativacaoAdmin=true.
async function obterCampanhaPicole(env) {
  if (!env.PROMO_KV) return null;
  return env.PROMO_KV.get('picole:campanha', 'json');
}

function respostaStatusPicole(status, campanha, dia, extra = {}) {
  const configurada = !!campanha;
  const ativacaoExplicita = campanha?.ativacaoAdmin === true;
  const campanhaAtiva = configurada
    && campanha.ativo === true
    && ativacaoExplicita
    && campanha.pausado !== true;
  const horario = dia && typeof dia.horarioSorteado === 'string' ? dia.horarioSorteado : null;
  const resposta = {
    status,
    campaign_configured: configurada,
    campaign_active: campanhaAtiva,
    activation_explicit: ativacaoExplicita,
    paused: campanha?.pausado === true,
    schedule_created: !!horario,
    safeToAnnounce: false,
    ...extra,
  };
  // Recalcula após o spread para que nenhum campo vindo de fora permita
  // anunciar uma promoção sem os quatro requisitos server-side.
  resposta.safeToAnnounce = resposta.status === 'ativo'
    && resposta.campaign_active === true
    && resposta.paused !== true
    && resposta.schedule_created === true;
  return jsonResp(resposta);
}

// Adiciona N dias a uma data YYYY-MM-DD
function adicionarDias(dataStr, n) {
  const d = new Date(`${dataStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Gera um reservaId criptograficamente seguro
function gerarReservaId() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').slice(0, 32);
}

// Gera código de retirada legível
function gerarCodigoRetirada(reservaId, dataLocal) {
  const ano = String(dataLocal || '').slice(0, 4) || String(new Date().getFullYear());
  const dia = String(dataLocal || '').replace(/-/g, '').slice(-8) || '00000000';
  // Código determinístico por reserva: não depende de contador KV global,
  // portanto não há colisão entre formulários de dias diferentes.
  return `ITP-${ano}-${dia}-${String(reservaId || '').slice(0, 8).toUpperCase()}`;
}

// Normaliza celular: somente celular de Cajuru/região, DDD 16, 11 dígitos.
// A mesma regra existe no frontend, mas a validação server-side é obrigatória.
function normalizarCelularPicole(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (/^169\d{8}$/.test(digits)) return digits;
  return null;
}

// Valida nome completo (pelo menos 2 palavras, min 3 chars each)
function validarNomeCompleto(nome) {
  const parts = String(nome || '').trim().split(/\s+/).filter(p => p.length >= 2);
  return parts.length >= 2 && nome.trim().length >= 5;
}

// ─── Handlers públicos ────────────────────────────────────────────────────────

async function handlePicoleStatus(request, env) {
  if (!env.PROMO_KV) return jsonResp({ status: 'inativo', motivo: 'campanha_nao_configurada' });
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'picole-status');
  if (!rl.allowed) return jsonResp({ status: 'inativo', motivo: 'rate_limit' }, 429);

  const campanha = await obterCampanhaPicole(env);
  if (!campanha) {
    return respostaStatusPicole('inativo', null, null, { motivo: 'campanha_nao_configurada' });
  }
  if (campanha.ativacaoAdmin !== true || campanha.ativo !== true) {
    return respostaStatusPicole('inativo', campanha, null, { motivo: campanha.cancelado ? 'campanha_cancelada' : 'campanha_nao_ativada' });
  }
  if (campanha.pausado) {
    return respostaStatusPicole('inativo', campanha, null, { motivo: 'campanha_pausada' });
  }

  const hoje = hojeEmSP();
  // Verifica se a campanha ainda está dentro do período
  if (hoje < campanha.dataInicio || hoje > campanha.dataFim) {
    return respostaStatusPicole('campanha_encerrada', campanha, null, { motivo: 'fora_do_periodo' });
  }

  const dia = await env.PROMO_KV.get(`picole:dia:${hoje}`, 'json');
  if (!dia) return respostaStatusPicole('inativo', campanha, null, { motivo: 'dia_nao_configurado' });

  const agora = Date.now();
  const inicio = localHorarioParaUtc(hoje, dia.horarioSorteado);

  if (dia.status === 'reservado' || dia.status === 'encerrado') {
    return respostaStatusPicole('reservado', campanha, dia, { horarioSorteado: dia.horarioSorteado, servidorAgora: agora });
  }

  // Janela: promoção dura até o fim do dia (ou até ser reservada)
  const fimJanela = inicio + PICOLE_JANELA_DURACAO_MS;

  if (agora < inicio) {
    return respostaStatusPicole('inativo', campanha, dia, { horarioSorteado: dia.horarioSorteado, inicioEm: inicio, servidorAgora: agora });
  }

  if (agora >= inicio && agora < fimJanela && dia.status !== 'reservado' && dia.status !== 'encerrado') {
    // GET é somente leitura. A reserva POST continua sendo a operação que
    // transforma o dia em reservado após a confirmação atômica no DO.
    return respostaStatusPicole('ativo', campanha, dia, { horarioSorteado: dia.horarioSorteado, inicioEm: inicio, fimEm: fimJanela, servidorAgora: agora });
  }

  // Após a janela, informa expiração sem gravar estado em um GET.
  return respostaStatusPicole('inativo', campanha, dia, { motivo: 'janela_expirada', horarioSorteado: dia.horarioSorteado, inicioEm: inicio, fimEm: fimJanela, servidorAgora: agora });
}

async function handlePicoleReservar(request, env) {
  if (!env.PROMO_KV) return jsonResp({ sucesso: false, codigo: 'CAMPANHA_INATIVA', mensagem: 'Campanha não configurada.' }, 503);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'picole-reservar');
  if (!rl.allowed) {
    await registrarAuditoriaPicole(env, 'reserva_rate_limit', { ip: mascararIp(ip), permitido: false });
    return jsonResp({ sucesso: false, codigo: 'RATE_LIMIT', mensagem: 'Muitas tentativas. Aguarde.' }, 429);
  }

  const campanha = await obterCampanhaPicole(env);
  if (!campanha || campanha.ativacaoAdmin !== true || campanha.ativo !== true || campanha.pausado) {
    return jsonResp({ sucesso: false, status: 'campanha_encerrada', codigo: 'CAMPANHA_INATIVA', mensagem: 'A promoção não está disponível no momento.' });
  }

  const hoje = hojeEmSP();
  if (hoje < campanha.dataInicio || hoje > campanha.dataFim) {
    return jsonResp({ sucesso: false, status: 'campanha_encerrada', codigo: 'CAMPANHA_ENCERRADA', mensagem: 'A campanha de 30 dias foi encerrada.' });
  }

  const dia = await env.PROMO_KV.get(`picole:dia:${hoje}`, 'json');
  if (!dia) {
    return jsonResp({ sucesso: false, status: 'inativo', codigo: 'DIA_NAO_ENCONTRADO', mensagem: 'A promoção não está ativa hoje.' });
  }

  const agora = Date.now();
  const inicio = localHorarioParaUtc(hoje, dia.horarioSorteado);
  const fimJanela = inicio + PICOLE_JANELA_DURACAO_MS;

  if (agora < inicio) {
    await registrarAuditoriaPicole(env, 'reserva_antes_inicio', { ip: mascararIp(ip), horarioSorteado: dia.horarioSorteado });
    return jsonResp({ sucesso: false, status: 'inativo', codigo: 'PROMOCAO_NAO_INICIADA', mensagem: 'A promoção ainda não foi ativada hoje.' });
  }
  if (agora >= fimJanela) {
    await registrarAuditoriaPicole(env, 'reserva_fora_janela', { ip: mascararIp(ip), inicioJanela: PICOLE_JANELA_INICIO, fimJanela: PICOLE_JANELA_FIM });
    return jsonResp({ sucesso: false, status: 'encerrado', codigo: 'PROMOCAO_EXPIRADA', mensagem: 'A promoção de hoje já encerrou.' });
  }

  // ── Reserva atômica via Durable Object ────────────────────────────────────
  // O DO é identificado pelo dia local (uma instância por dia).
  // blockConcurrencyWhile dentro do DO garante atomicidade total —
  // impossível duas requisições simultâneas vencerem.
  const reservaId = gerarReservaId();
  const idempotencyHeader = request.headers.get('X-Idempotency-Key') || '';
  const idempotencyKey = /^[A-Za-z0-9_-]{16,80}$/.test(idempotencyHeader)
    ? idempotencyHeader
    : reservaId;
  const agora2    = new Date().toISOString();

  let doResult;
  if (!env.PICOLE_RESERVA_DO) {
    await registrarAuditoriaPicole(env, 'reserva_bloqueada_sem_do', { ip: mascararIp(ip) });
    return jsonResp({ sucesso: false, status: 'inativo', codigo: 'INFRA_INDISPONIVEL', mensagem: 'Promoção temporariamente indisponível. Tente novamente em instantes.' }, 503);
  }
  // Caminho obrigatório: Durable Object (atomicidade garantida)
  const doId   = env.PICOLE_RESERVA_DO.idFromName(`${campanha.id}:${hoje}`);
  const doStub = env.PICOLE_RESERVA_DO.get(doId);
  const doResp = await doStub.fetch(
    new Request(`https://do-internal/picole?action=reservar&reservaId=${encodeURIComponent(reservaId)}&idempotencyKey=${encodeURIComponent(idempotencyKey)}`)
  );
  doResult = await doResp.json();

  if (!doResult.ganhou) {
    await registrarAuditoriaPicole(env, 'reserva_negada_ja_houve_vencedor', { ip: mascararIp(ip) });
    return jsonResp({ sucesso: false, status: 'encerrado', codigo: 'PROMOCAO_ENCERRADA', mensagem: 'A promoção de hoje já foi encerrada. Tente novamente amanhã.' });
  }

  // Se a resposta anterior se perdeu depois do DO confirmar, a mesma chave
  // retorna aqui com idempotente=true. Reentrega o mesmo resultado e, caso a
  // falha tenha ocorrido antes do KV, repara o registro sem gerar novo vencedor.
  const reservaIdConfirmada = doResult.reservaId || reservaId;
  if (doResult.idempotente) {
    const existente = await env.PROMO_KV.get(`picole:reserva:${reservaIdConfirmada}`, 'json');
    if (existente) {
      return jsonResp({ sucesso: true, status: 'reservado', reservaId: reservaIdConfirmada, idempotente: true, mensagem: 'Sua reserva já foi confirmada. Preencha seus dados para retirar seu picolé.' }, 200);
    }
  }

  // Somos o vencedor! Persiste o registro completo no KV.
  const reserva = {
    reservaId: reservaIdConfirmada,
    campanhaId: campanha.id,
    dataLocal: hoje,
    ipCliente: mascararIp(ip),
    criadoEm: agora2,
    atualizadoEm: agora2,
    statusFormulario: 'aguardando',   // 'aguardando' | 'preenchido'
    codigoRetirada: null,
    statusRetirada: 'pendente',        // 'pendente' | 'retirado' | 'nao_retirado' | 'cancelado'
    dadosVencedor: null,
    historico: [],
  };

  // Persiste a reserva no KV (TTL generoso — 25 horas para cobrir plenamente o dia)
  await env.PROMO_KV.put(`picole:reserva:${reservaIdConfirmada}`, JSON.stringify(reserva), { expirationTtl: 90_000 });

  // Índice secundário KV: espelha o winner para o status endpoint e admin
  await env.PROMO_KV.put(`picole:winner:${hoje}`, reservaIdConfirmada, { expirationTtl: 90_000 });

  // Atualiza o registro do dia
  dia.status = 'reservado';
  dia.vencedorId = reservaIdConfirmada;
  dia.atualizadoEm = agora2;
  await env.PROMO_KV.put(`picole:dia:${hoje}`, JSON.stringify(dia));
  await registrarAuditoriaPicole(env, 'reserva_vencedora_confirmada', { ip: mascararIp(ip), reservaId: reservaIdConfirmada, dataLocal: hoje });

  return jsonResp({
    sucesso: true,
    status: 'reservado',
    reservaId: reservaIdConfirmada,
    mensagem: 'Você foi a primeira pessoa! Preencha seus dados para retirar seu picolé.',
  }, 201);
}

async function handlePicoleReservaGet(reservaId, request, env) {
  if (!env.PROMO_KV) return jsonResp({ ok: false, error: 'Serviço indisponível' }, 503);
  const reserva = await env.PROMO_KV.get(`picole:reserva:${reservaId}`, 'json');
  if (!reserva) return jsonResp({ ok: false, error: 'Reserva não encontrada' }, 404);
  // Verifica se a reserva é do dia atual
  const hoje = hojeEmSP();
  if (reserva.dataLocal !== hoje) {
    return jsonResp({ ok: false, error: 'Reserva de outro dia não pode ser retomada' }, 410);
  }
  return jsonResp({
    ok: true,
    statusFormulario: reserva.statusFormulario,
    codigoRetirada: reserva.codigoRetirada,
    dataLocal: reserva.dataLocal,
  });
}

async function handlePicoleReservaForm(reservaId, request, env) {
  if (!env.PROMO_KV) return jsonResp({ sucesso: false, mensagem: 'Serviço indisponível' }, 503);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rl = await checkRateLimit(env, ip, 'picole-form');
  if (!rl.allowed) {
    await registrarAuditoriaPicole(env, 'form_rate_limit', { ip: mascararIp(ip), reservaId: reservaId || null });
    return jsonResp({ sucesso: false, mensagem: 'Muitas tentativas. Aguarde.' }, 429);
  }

  const reserva = await env.PROMO_KV.get(`picole:reserva:${reservaId}`, 'json');
  if (!reserva) {
    await registrarAuditoriaPicole(env, 'form_reserva_inexistente', { ip: mascararIp(ip), reservaId });
    return jsonResp({ sucesso: false, mensagem: 'Reserva não encontrada ou expirada.' }, 404);
  }

  const hoje = hojeEmSP();
  if (reserva.dataLocal !== hoje) {
    await registrarAuditoriaPicole(env, 'form_reserva_outro_dia', { ip: mascararIp(ip), reservaId, dataReserva: reserva.dataLocal, hoje });
    return jsonResp({ sucesso: false, mensagem: 'Esta reserva é de outro dia e não pode ser preenchida.' }, 410);
  }
  if (reserva.statusFormulario === 'preenchido') {
    await registrarAuditoriaPicole(env, 'form_duplicado_rejeitado', { ip: mascararIp(ip), reservaId, codigoRetirada: reserva.codigoRetirada || null });
    // Permite retomada: retorna os dados já salvos
    return jsonResp({
      sucesso: true,
      codigoRetirada: reserva.codigoRetirada,
      mensagem: 'Cadastro já realizado. Apresente este código na loja para retirar seu picolé.',
    });
  }

  let body;
  try { body = await request.json(); } catch { return jsonResp({ sucesso: false, mensagem: 'JSON inválido' }, 400); }

  const nome = sanitizeString(body.nome || body.name, 200);
  const celular = normalizarCelularPicole(body.celular || body.phone);
  const aceiteTermos = !!body.aceiteTermos;
  const aceiteLGPD = !!body.aceiteLGPD;

  if (!validarNomeCompleto(nome)) {
    await registrarAuditoriaPicole(env, 'form_nome_invalido', { ip: mascararIp(ip), reservaId });
    return jsonResp({ sucesso: false, mensagem: 'Informe seu nome completo (nome e sobrenome).' }, 400);
  }
  if (!celular) {
    await registrarAuditoriaPicole(env, 'form_celular_invalido', { ip: mascararIp(ip), reservaId });
    return jsonResp({ sucesso: false, mensagem: 'Informe um número de celular válido com DDD.' }, 400);
  }
  if (!aceiteTermos || !aceiteLGPD) {
    await registrarAuditoriaPicole(env, 'form_termos_nao_aceitos', { ip: mascararIp(ip), reservaId });
    return jsonResp({ sucesso: false, mensagem: 'É necessário aceitar os termos para participar.' }, 400);
  }

  // ── Gera código de retirada e grava via DO (atômico) ──────────────────────
  // O DO garante que dois envios simultâneos não geram dois códigos diferentes.
  const codigoRetirada = gerarCodigoRetirada(reservaId, hoje);

  if (!env.PICOLE_RESERVA_DO) {
    await registrarAuditoriaPicole(env, 'form_bloqueado_sem_do', { ip: mascararIp(ip), reservaId });
    return jsonResp({ sucesso: false, mensagem: 'Validação temporariamente indisponível. Tente novamente em instantes.' }, 503);
  }
  const doId   = env.PICOLE_RESERVA_DO.idFromName(`${reserva.campanhaId}:${hoje}`);
  const doStub = env.PICOLE_RESERVA_DO.get(doId);
  const doUrl  = `https://do/picole?action=preencherFormulario&reservaId=${encodeURIComponent(reservaId)}&codigoRetirada=${encodeURIComponent(codigoRetirada)}`;
  const doRes  = await doStub.fetch(doUrl);
  const doData = await doRes.json();
  if (!doData.ok) {
    await registrarAuditoriaPicole(env, 'form_concorrencia_bloqueada', { ip: mascararIp(ip), reservaId });
    return jsonResp({ sucesso: false, mensagem: 'Não foi possível confirmar o formulário. Tente novamente.' }, 409);
  }
  if (doData.jaPreenchido) {
    await registrarAuditoriaPicole(env, 'form_ja_preenchido', { ip: mascararIp(ip), reservaId, codigoRetirada: doData.codigoRetirada || null });
    return jsonResp({
      sucesso: true,
      codigoRetirada: doData.codigoRetirada,
      mensagem: 'Cadastro já realizado. Apresente este código na loja para retirar seu picolé.',
    });
  }
  const agora = new Date().toISOString();
  if (!reserva.historico) reserva.historico = [];
  reserva.historico.push({ evento: 'formulario_preenchido', em: agora, ip: mascararIp(ip) });
  reserva.statusFormulario = 'preenchido';
  reserva.codigoRetirada = codigoRetirada;
  reserva.atualizadoEm = agora;
  // Armazena dados necessários para atendimento e registro LGPD
  reserva.dadosVencedor = {
    nome,
    celular,
    aceiteTermos,
    aceiteLGPD,
    preenchidoEm: agora,
  };
  await env.PROMO_KV.put(`picole:reserva:${reservaId}`, JSON.stringify(reserva), { expirationTtl: 90_000 });
  await registrarAuditoriaPicole(env, 'form_preenchido_com_sucesso', { ip: mascararIp(ip), reservaId, codigoRetirada });

  return jsonResp({
    sucesso: true,
    codigoRetirada,
    mensagem: 'Cadastro realizado. Apresente este código na loja para retirar seu picolé.',
  }, 201);
}

// ─── Handlers administrativos ─────────────────────────────────────────────────

async function handlePicoleAdminIniciar(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }
  const criada = await criarCampanhaPicole(env, {
    dataInicio: body.dataInicio || hojeEmSP(),
    forcar: !!body.forcar,
    origem: 'manual',
  });
  if (!criada.ok) {
    if (criada.error && criada.error.includes('PROMO_KV não configurado')) return jsonResp({ ok: false, error: criada.error }, 503);
    if (criada.error && criada.error.includes('dataInicio inválida')) return jsonResp({ ok: false, error: criada.error }, 400);
    if (criada.error && criada.error.includes('campanha ativa')) return jsonResp({ ok: false, error: criada.error }, 409);
    return jsonResp({ ok: false, error: criada.error || 'Falha ao iniciar campanha.' }, 500);
  }
  return jsonResp({ ok: true, campanha: { ...criada.campanha }, totalDias: PICOLE_CAMPANHA_DIAS, dias: criada.dias }, 201);
}

async function handlePicoleAdminCampanha(env) {
  if (!env.PROMO_KV) return jsonResp({ ok: false, error: 'PROMO_KV não configurado' }, 503);
  const campanha = await env.PROMO_KV.get('picole:campanha', 'json');
  if (!campanha) return jsonResp({ ok: false, error: 'Nenhuma campanha encontrada' }, 404);
  // Inclui os registros dos dias com horários (apenas para admin)
  const dias = [];
  for (let i = 0; i < 30; i++) {
    const dataLocal = adicionarDias(campanha.dataInicio, i);
    const dia = await env.PROMO_KV.get(`picole:dia:${dataLocal}`, 'json');
    if (dia) {
      const diaAdmin = { ...dia };
      // Enriquece com nome do vencedor se existir
      if (dia.vencedorId) {
        const reserva = await env.PROMO_KV.get(`picole:reserva:${dia.vencedorId}`, 'json');
        if (reserva) {
          diaAdmin.nomeVencedor = (reserva.dadosVencedor || {}).nome || null;
          diaAdmin.celularVencedor = (reserva.dadosVencedor || {}).celular || null;
          diaAdmin.statusFormulario = reserva.statusFormulario || null;
          diaAdmin.codigoRetirada = reserva.codigoRetirada || null;
          try {
            diaAdmin.horarioCliqueSP = new Date(reserva.criadoEm)
              .toLocaleString('pt-BR', { timeZone: SP_TIMEZONE, hour12: false })
              .replace(',', '');
          } catch (_) { diaAdmin.horarioCliqueSP = reserva.criadoEm; }
        }
      }
      dias.push(diaAdmin);
    }
  }
  return jsonResp({ ok: true, campanha, dias });
}

async function handlePicoleAdminTogglePausa(env, pausar) {
  if (!env.PROMO_KV) return jsonResp({ ok: false, error: 'PROMO_KV não configurado' }, 503);
  const campanha = await env.PROMO_KV.get('picole:campanha', 'json');
  if (!campanha) return jsonResp({ ok: false, error: 'Nenhuma campanha encontrada' }, 404);
  campanha.pausado = pausar;
  campanha.atualizadoEm = new Date().toISOString();
  await env.PROMO_KV.put('picole:campanha', JSON.stringify(campanha));
  return jsonResp({ ok: true, pausado: pausar });
}

async function handlePicoleAdminCancelarCampanha(request, env) {
  if (!env.PROMO_KV) return jsonResp({ ok: false, error: 'PROMO_KV não configurado' }, 503);
  const campanha = await env.PROMO_KV.get('picole:campanha', 'json');
  if (!campanha) return jsonResp({ ok: false, error: 'Nenhuma campanha encontrada' }, 404);
  campanha.ativo = false;
  campanha.cancelado = true;
  campanha.atualizadoEm = new Date().toISOString();
  await env.PROMO_KV.put('picole:campanha', JSON.stringify(campanha));
  return jsonResp({ ok: true, mensagem: 'Campanha cancelada.' });
}

async function handlePicoleAdminGanhadores(env) {
  if (!env.PROMO_KV) return jsonResp({ ok: false, error: 'PROMO_KV não configurado' }, 503);
  const ganhadores = [];
  let cursor = undefined;
  // Pagina através de todos os registros (KV list retorna no máximo 1000 por chamada)
  do {
    const lista = await env.PROMO_KV.list({ prefix: 'picole:reserva:', ...(cursor ? { cursor } : {}) });
    for (const k of lista.keys) {
      const r = await env.PROMO_KV.get(k.name, 'json');
      if (r) {
        const { ipCliente: _ip, ...safe } = r;
        // Enriquece com o horário agendado do dia (admin pode ver)
        const dia = await env.PROMO_KV.get(`picole:dia:${safe.dataLocal}`, 'json');
        if (dia) {
          safe.horarioSorteado = dia.horarioSorteado;
          safe.statusDia = dia.status;
        }
        // Converte criadoEm (UTC) para horário legível em SP
        if (safe.criadoEm) {
          try {
            safe.horarioCliqueSP = new Date(safe.criadoEm)
              .toLocaleString('pt-BR', { timeZone: SP_TIMEZONE, hour12: false })
              .replace(',', '');
          } catch (_) { safe.horarioCliqueSP = safe.criadoEm; }
        }
        ganhadores.push(safe);
      }
    }
    cursor = lista.list_complete ? undefined : lista.cursor;
  } while (cursor);
  ganhadores.sort((a, b) => (b.dataLocal || '').localeCompare(a.dataLocal || ''));
  return jsonResp({ ok: true, total: ganhadores.length, ganhadores });
}

async function handlePicoleAdminPatchGanhador(reservaId, request, env) {
  if (!env.PROMO_KV) return jsonResp({ ok: false, error: 'PROMO_KV não configurado' }, 503);
  const reserva = await env.PROMO_KV.get(`picole:reserva:${reservaId}`, 'json');
  if (!reserva) return jsonResp({ ok: false, error: 'Reserva não encontrada' }, 404);
  let body;
  try { body = await request.json(); } catch { return jsonResp({ ok: false, error: 'JSON inválido' }, 400); }

  const statusValidos = ['pendente', 'retirado', 'nao_retirado', 'cancelado'];
  if (body.statusRetirada && statusValidos.includes(body.statusRetirada)) {
    reserva.statusRetirada = body.statusRetirada;
  }
  if (body.notaAdmin) {
    reserva.notaAdmin = sanitizeString(body.notaAdmin, 500);
  }
  reserva.atualizadoEm = new Date().toISOString();
  // Histórico de alterações
  if (!reserva.historico) reserva.historico = [];
  reserva.historico.push({ campo: 'statusRetirada', valor: reserva.statusRetirada, em: reserva.atualizadoEm });

  await env.PROMO_KV.put(`picole:reserva:${reservaId}`, JSON.stringify(reserva), { expirationTtl: 90_000 });
  return jsonResp({ ok: true, reserva: { ...reserva, ipCliente: undefined } });
}
