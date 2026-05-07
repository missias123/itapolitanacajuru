/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RASPADINHA ITAPOLITANA — Cloudflare Worker
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deploy: Cole este arquivo no painel em https://workers.cloudflare.com/
 *         (Workers → Create Service → HTTP Handler → colar código → Deploy)
 *
 * Variáveis de ambiente OBRIGATÓRIAS (Settings → Variables → Add):
 *   GH_TOKEN   — Personal Access Token do GitHub com escopo repo (Contents r/w)
 *                Ex: github_pat_11AAAA...
 *   PREMIADOS  — Array JSON com os códigos premiados do lote atual.
 *                Ex: ["2Q68MW5B?+","TRSHMGQA8%","XT!SE8M2!3","&BN?Y5RU2Q","#YC3*7?YE&"]
 *                ⚠️ Nunca coloque estes códigos no fidelidade.json público!
 *
 * Endpoint:
 *   POST https://SEU-WORKER.workers.dev/raspadinha
 *   Body JSON: { "cel": "16999999999", "codigo": "VH*BCCQFN%" }
 *
 * Retorna:
 *   { ok: true,  premiado: bool, codigoResgate: "PICOLE-xxx"|null, pontos: N, nome: string }
 *   { ok: false, mensagem: "Motivo do erro" }
 *
 * Fluxo de segurança (padrão McDonald's / iFood):
 *   1. Validação completa ocorre no servidor (Worker), não no browser.
 *   2. Lista de premiados fica em variável de ambiente — nunca em JSON público.
 *   3. O código só pode ser usado uma vez (estado salvo no GitHub JSON).
 *   4. Frontend recebe apenas ok/premiado/mensagem — nunca a lista completa.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── CONFIGURAÇÕES ──────────────────────────────────────────────────────────
const GH_OWNER  = 'missias123';
const GH_REPO   = 'itapolitanacajuru';
const GH_BRANCH = 'main';
const GH_API    = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/`;

const FIDELIDADE_PATH = 'dados/fidelidade.json';
const CLIENTES_PATH   = 'dados/clientes.json';

// Origens permitidas para CORS (adicione o domínio de produção aqui)
const ORIGENS_PERMITIDAS = [
  'https://itapolitanacajuru.com.br',
  'https://www.itapolitanacajuru.com.br',
  'http://localhost',        // testes locais
  'http://127.0.0.1',
  'null',                    // file:// local
];

// ── PONTO DE ENTRADA DO WORKER ─────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // Cabeçalhos CORS dinâmicos: só permitir origens do site Itapolitana
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = ORIGENS_PERMITIDAS.includes(origin) ? origin : ORIGENS_PERMITIDAS[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin':  corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age':       '86400',
      'Vary': 'Origin',
    };

    // Responder a preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Aceitar apenas POST em /raspadinha
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/raspadinha') {
      return jsonResp({ ok: false, mensagem: 'Endpoint não encontrado.' }, 404, corsHeaders);
    }

    // Verificar variáveis de ambiente obrigatórias
    if (!env.GH_TOKEN) {
      console.error('[WORKER] GH_TOKEN não configurado!');
      return jsonResp({ ok: false, mensagem: 'Configuração interna ausente.' }, 500, corsHeaders);
    }
    if (!env.PREMIADOS) {
      console.error('[WORKER] PREMIADOS não configurado!');
      return jsonResp({ ok: false, mensagem: 'Configuração interna ausente.' }, 500, corsHeaders);
    }

    // Parse do body
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResp({ ok: false, mensagem: 'Requisição inválida.' }, 400, corsHeaders);
    }

    const cel    = normalizarCel(body.cel    || '');
    const codigo = (body.codigo || '').trim().toUpperCase();

    if (cel.length < 10) {
      return jsonResp({ ok: false, mensagem: 'Celular inválido.' }, 400, corsHeaders);
    }
    if (!codigo || codigo.length < 3) {
      return jsonResp({ ok: false, mensagem: 'Código inválido.' }, 400, corsHeaders);
    }

    // ── PROCESSAR RASPADINHA ───────────────────────────────────────────────
    return await processarRaspadinha(cel, codigo, env, corsHeaders);
  }
};

// ── LÓGICA PRINCIPAL ───────────────────────────────────────────────────────
async function processarRaspadinha(cel, codigo, env, corsHeaders) {
  // 1. Carregar os dois JSONs em paralelo (mais rápido)
  const [fRes, cRes] = await Promise.all([
    ghGet(FIDELIDADE_PATH, env.GH_TOKEN),
    ghGet(CLIENTES_PATH,   env.GH_TOKEN),
  ]);

  if (!fRes.content || !cRes.content) {
    return jsonResp({ ok: false, mensagem: 'Erro ao acessar os dados. Tente novamente.' }, 503, corsHeaders);
  }

  let ghFidelidade, ghFidelidadeSha, ghClientes, ghClientesSha;
  try {
    ghFidelidade    = JSON.parse(fRes.content);
    ghFidelidadeSha = fRes.sha;
    ghClientes      = JSON.parse(cRes.content);
    ghClientesSha   = cRes.sha;
  } catch {
    return jsonResp({ ok: false, mensagem: 'Erro ao processar dados internos.' }, 500, corsHeaders);
  }

  // 2. Verificar se o cliente existe
  const chave = _chaveCliente(cel, ghClientes);
  if (!chave) {
    return jsonResp({
      ok: false,
      mensagem: 'Celular não cadastrado no Clube de Fidelidade. Cadastre-se em fidelidade.html primeiro.'
    }, 400, corsHeaders);
  }

  const cliente = ghClientes.clientes[chave];
  if (!cliente || cliente.bloqueado) {
    return jsonResp({
      ok: false,
      mensagem: 'Conta não encontrada ou bloqueada. Entre em contato pelo WhatsApp.'
    }, 403, corsHeaders);
  }

  // 3. Verificar se o código existe em fidelidade.json
  // Suporta chave 'códigos' (com acento) e 'codigos' (sem acento) para compatibilidade
  const codigosObj = ghFidelidade['c\u00f3digos'] || ghFidelidade.codigos || {};
  const dadosCodigo = codigosObj[codigo];

  if (!dadosCodigo) {
    return jsonResp({ ok: false, mensagem: 'Código inválido. Confira e tente novamente.' }, 400, corsHeaders);
  }

  // 4. Verificar se o código já foi usado (por qualquer pessoa, em qualquer dispositivo)
  if (dadosCodigo.status === 'usado') {
    return jsonResp({ ok: false, mensagem: 'Este código já foi utilizado.' }, 409, corsHeaders);
  }

  // 5. Verificar se ESTE cliente já usou este código (dupla proteção)
  const codigosUsados = cliente.codigosUsados || [];
  if (codigosUsados.some(c => c.codigo === codigo)) {
    return jsonResp({ ok: false, mensagem: 'Você já usou este código.' }, 409, corsHeaders);
  }

  // ── CÓDIGO VÁLIDO — verificar premiação ────────────────────────────────
  // A lista de premiados fica SOMENTE na variável de ambiente PREMIADOS.
  // Nunca é enviada ao browser nem gravada no JSON público.
  let premiadosList;
  try {
    premiadosList = JSON.parse(env.PREMIADOS);
    if (!Array.isArray(premiadosList)) throw new Error('PREMIADOS deve ser array JSON');
  } catch (e) {
    console.error('[WORKER] Erro ao parsear PREMIADOS:', e.message);
    return jsonResp({ ok: false, mensagem: 'Configuração interna inválida.' }, 500, corsHeaders);
  }

  const isPremiado = premiadosList.includes(codigo);

  // Gerar código de resgate único apenas para premiados
  // Formato: PICOLE-XXXXXX (6 caracteres hex aleatórios)
  const codigoResgate = isPremiado
    ? 'PICOLE-' + Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').toUpperCase()
    : null;

  // ── ATUALIZAR DADOS ────────────────────────────────────────────────────
  const agora = new Date().toISOString();

  // Marcar código como usado em fidelidade.json
  codigosObj[codigo].status   = 'usado';
  codigosObj[codigo].usadoPor = cel;
  codigosObj[codigo].usadoEm  = agora;
  // Manter ambas as chaves sincronizadas (com e sem acento)
  ghFidelidade['c\u00f3digos'] = codigosObj;
  ghFidelidade.codigos         = codigosObj;

  // Atualizar cliente em clientes.json
  if (!cliente.codigosUsados) cliente.codigosUsados = [];
  cliente.codigosUsados.push({ codigo, data: agora });
  cliente.saldoPontos  = (cliente.saldoPontos  || 0) + 1;
  cliente.totalCodigos = (cliente.totalCodigos || 0) + 1;

  // Registrar raspadinha no perfil (para consulta no admin)
  if (!cliente.raspadinhas) cliente.raspadinhas = [];
  cliente.raspadinhas.push({
    codigo,
    data:          agora,
    premiado:      isPremiado,
    codigoResgate: codigoResgate,
  });

  // Persiste clienteAtual em ghClientes.clientes
  ghClientes.clientes[chave] = cliente;

  // ── SALVAR NO GITHUB (sequencial com rollback em falha) ────────────────
  // 1º: marcar código como usado
  const okFid = await ghPut(
    FIDELIDADE_PATH,
    JSON.stringify(ghFidelidade, null, 2),
    `Raspadinha: código ${codigo} usado por ${cliente.nome}`,
    ghFidelidadeSha,
    env.GH_TOKEN
  );

  if (!okFid) {
    return jsonResp({
      ok: false,
      mensagem: 'Erro ao registrar o código. Tente novamente em alguns segundos.'
    }, 503, corsHeaders);
  }

  // 2º: adicionar ponto ao cliente
  const [freshCli] = await Promise.all([ghGet(CLIENTES_PATH, env.GH_TOKEN)]);
  if (freshCli && freshCli.sha) ghClientesSha = freshCli.sha;
  if (freshCli && freshCli.content) {
    try {
      const freshData = JSON.parse(freshCli.content);
      ghClientes.clientes       = Object.assign({}, freshData.clientes       || {}, ghClientes.clientes);
      ghClientes.indice_celular = Object.assign({}, freshData.indice_celular || {}, ghClientes.indice_celular || {});
    } catch { /* usar dados em memória mesmo */ }
  }

  const okCli = await ghPut(
    CLIENTES_PATH,
    JSON.stringify(ghClientes, null, 2),
    `Raspadinha: +1 ponto para ${cliente.nome} (${cel}) — saldo: ${cliente.saldoPontos}`,
    ghClientesSha,
    env.GH_TOKEN
  );

  if (!okCli) {
    // Rollback: restaurar código como disponível
    codigosObj[codigo].status = 'dispon\u00edvel';
    delete codigosObj[codigo].usadoPor;
    delete codigosObj[codigo].usadoEm;
    ghFidelidade['c\u00f3digos'] = codigosObj;
    ghFidelidade.codigos         = codigosObj;
    await ghPut(
      FIDELIDADE_PATH,
      JSON.stringify(ghFidelidade, null, 2),
      `ROLLBACK: código ${codigo} restaurado (falha ao salvar cliente)`,
      okFid.sha || ghFidelidadeSha,
      env.GH_TOKEN
    );
    return jsonResp({
      ok: false,
      mensagem: 'Erro ao salvar o ponto. O código foi liberado para nova tentativa.'
    }, 503, corsHeaders);
  }

  // ── RESPOSTA FINAL ─────────────────────────────────────────────────────
  // O browser recebe apenas: ok, premiado, codigoResgate, pontos, nome, mensagem.
  // A lista completa de premiados NUNCA sai do Worker.
  const mensagem = isPremiado
    ? 'Parabéns! Você ganhou 1 picolé de fruta (água) + 1 ponto no Clube de Fidelidade.'
    : 'Desta vez o seu código não deu picolé, mas você já garantiu +1 ponto no Clube de Fidelidade Itapolitana.';

  return jsonResp({
    ok:            true,
    premiado:      isPremiado,
    codigoResgate: codigoResgate,
    pontos:        cliente.saldoPontos,
    nome:          cliente.nome || '',
    mensagem,
  }, 200, corsHeaders);
}

// ── UTILITÁRIOS GITHUB API ─────────────────────────────────────────────────
/**
 * Lê um arquivo do repositório GitHub via API.
 * @returns {{ content: string|null, sha: string|null }}
 */
async function ghGet(path, token) {
  try {
    const r = await fetch(GH_API + path + '?t=' + Date.now(), {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Itapolitana-Raspadinha-Worker/1.0',
      },
    });
    if (r.status === 404) return { content: null, sha: null };
    if (!r.ok) { console.error('[ghGet] HTTP', r.status, path); return { content: null, sha: null }; }
    const d   = await r.json();
    // Decodificar base64 → UTF-8 usando TextDecoder (disponível no runtime do Worker)
    const bin = atob(d.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const content = new TextDecoder('utf-8').decode(bytes);
    return { content, sha: d.sha };
  } catch (e) {
    console.error('[ghGet] erro:', path, e.message);
    return { content: null, sha: null };
  }
}

/**
 * Grava um arquivo no repositório GitHub via PUT.
 * Faz até 3 tentativas com retry em conflito de SHA.
 * @returns {{ ok: boolean, sha?: string }}
 */
async function ghPut(path, content, message, sha, token) {
  const MAX = 3;
  let shaAtual = sha;
  for (let t = 1; t <= MAX; t++) {
    try {
      const bytes = new TextEncoder().encode(content);
      let bin = '';
      bytes.forEach(b => bin += String.fromCharCode(b));
      const b64  = btoa(bin);
      const body = { message, content: b64, branch: GH_BRANCH };
      if (shaAtual) body.sha = shaAtual;

      const r = await fetch(GH_API + path, {
        method: 'PUT',
        headers: {
          'Authorization':  `token ${token}`,
          'Content-Type':   'application/json',
          'User-Agent':     'Itapolitana-Raspadinha-Worker/1.0',
        },
        body: JSON.stringify(body),
      });

      if (r.ok) {
        const d = await r.json();
        return { ok: true, sha: d.content.sha };
      }

      // Conflito de SHA (409/422): buscar SHA atualizado e tentar novamente
      if ((r.status === 409 || r.status === 422) && t < MAX) {
        console.warn(`[ghPut] Conflito SHA (tentativa ${t}/${MAX}), buscando SHA fresco...`);
        const fresh = await ghGet(path, token);
        if (fresh && fresh.sha) shaAtual = fresh.sha;
        await sleep(500 * t);
        continue;
      }

      const err = await r.json().catch(() => ({}));
      console.error('[ghPut] HTTP', r.status, path, err.message || '');
      return { ok: false };
    } catch (e) {
      console.error('[ghPut] erro:', path, e.message);
      if (t === MAX) return { ok: false };
      await sleep(500 * t);
    }
  }
  return { ok: false };
}

// ── AUXILIARES ─────────────────────────────────────────────────────────────
/** Remove tudo que não for dígito do celular. */
function normalizarCel(v) {
  return (v || '').replace(/\D/g, '');
}

/**
 * Resolve celular → chave USR-2026-xxxx.
 * Mesma lógica do fidelidade.html → _chaveCliente().
 */
function _chaveCliente(cel, ghClientes) {
  if (!cel || !ghClientes) return null;
  const idx = (ghClientes.indice_celular || {})[cel];
  if (idx && ghClientes.clientes && ghClientes.clientes[idx]) return idx;
  if (ghClientes.clientes && ghClientes.clientes[cel]) return cel; // legacy
  return null;
}

/** Retorna uma Response JSON. */
function jsonResp(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      ...extraHeaders,
    },
  });
}

/** Promise de sleep (ms). */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
