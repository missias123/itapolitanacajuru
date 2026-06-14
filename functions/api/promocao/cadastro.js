/**
 * Cloudflare Pages Function — POST /api/promocao/cadastro
 *
 * Registra uma inscrição no sorteio mensal gravando em dados/fidelidade.json
 * via GitHub Contents API.
 *
 * Variáveis de ambiente (configurar no painel Cloudflare Pages → Settings → Variables):
 *   GITHUB_TOKEN  — fine-grained PAT: Contents Read & Write no repositório
 *   GH_OWNER      — dono do repositório (padrão: missias123)
 *   GH_REPO       — nome do repositório (padrão: itapolitanacajuru)
 *   GH_BRANCH     — branch alvo (padrão: main)
 */

const FIDELIDADE_PATH = 'dados/fidelidade.json';
const GH_API_BASE     = 'https://api.github.com';

/* ── Helpers ──────────────────────────────────────────────── */

function corsHeaders(origin) {
  const allowed = 'https://itapolitanacajuru.com.br';
  const ao = (origin && origin.startsWith(allowed)) ? origin : allowed;
  return {
    'Access-Control-Allow-Origin': ao,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

/* ── Preflight ────────────────────────────────────────────── */
export async function onRequestOptions({ request }) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

/* ── POST /api/promocao/cadastro ──────────────────────────── */
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';

  /* ── Config ─────────────────────────────────────────────── */
  const token  = env.GITHUB_TOKEN || '';
  const owner  = env.GH_OWNER  || 'missias123';
  const repo   = env.GH_REPO   || 'itapolitanacajuru';
  const branch = env.GH_BRANCH || 'main';

  if (!token) {
    console.error('[cadastro] GITHUB_TOKEN não configurado');
    return json({ success: false, error: 'Serviço temporariamente indisponível. Tente em alguns minutos.' }, 503, origin);
  }

  /* ── Parse body ─────────────────────────────────────────── */
  let body;
  try { body = await request.json(); }
  catch { return json({ success: false, error: 'Dados inválidos.' }, 400, origin); }

  const { name, birthdate, phone, regulation_accept } = body;

  /* ── Validações ─────────────────────────────────────────── */
  if (!regulation_accept) {
    return json({ success: false, error: 'Aceite o regulamento para participar.' }, 400, origin);
  }
  const nomeLimpo = String(name || '').trim();
  if (nomeLimpo.length < 3) {
    return json({ success: false, error: 'Informe seu nome completo (mínimo 3 caracteres).' }, 400, origin);
  }
  const celLimpo = String(phone || '').replace(/\D/g, '');
  if (celLimpo.length !== 11) {
    return json({ success: false, error: 'Celular inválido. Informe DDD + 9 dígitos (ex: 16991234567).' }, 400, origin);
  }
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    return json({ success: false, error: 'Data de nascimento inválida.' }, 400, origin);
  }
  const nasc  = new Date(birthdate + 'T00:00:00');
  const hoje  = new Date();
  let   idade = hoje.getFullYear() - nasc.getFullYear();
  const dm    = hoje.getMonth() - nasc.getMonth();
  if (dm < 0 || (dm === 0 && hoje.getDate() < nasc.getDate())) idade--;
  if (idade < 14) {
    return json({ success: false, error: 'É necessário ter no mínimo 14 anos para participar.' }, 400, origin);
  }

  /* ── Ler fidelidade.json do GitHub ──────────────────────── */
  const ghHeaders = {
    'Authorization': `token ${token}`,
    'Accept':        'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'itapolitana-pages-fn/1.0',
  };
  const fileUrl = `${GH_API_BASE}/repos/${owner}/${repo}/contents/${FIDELIDADE_PATH}?ref=${branch}`;

  let fidelidade, sha;
  try {
    const r = await fetch(fileUrl, { headers: ghHeaders });
    if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
    const gd = await r.json();
    sha        = gd.sha;
    fidelidade = JSON.parse(atob(gd.content.replace(/\n/g, '')));
  } catch (e) {
    console.error('[cadastro] Erro ao ler fidelidade.json:', e.message);
    return json({ success: false, error: 'Serviço temporariamente indisponível. Tente novamente.' }, 503, origin);
  }

  if (!Array.isArray(fidelidade.sorteioInscritos)) fidelidade.sorteioInscritos = [];

  /* ── Deduplicação por celular ────────────────────────────── */
  const jaExiste = fidelidade.sorteioInscritos.find(
    i => String(i.cel || '').replace(/\D/g, '') === celLimpo
  );
  if (jaExiste) {
    return json({
      success: true,
      alreadyRegistered: true,
      id: jaExiste.id || 'EXIST',
      message: 'Você já está cadastrado no sorteio!',
    }, 200, origin);
  }

  /* ── Gerar ID único ─────────────────────────────────────── */
  const seq    = String(fidelidade.sorteioInscritos.length + 1).padStart(4, '0');
  const sufixo = Math.random().toString(36).slice(2, 6).toUpperCase();
  const id     = `SRT-${hoje.getFullYear()}-${seq}-${sufixo}`;

  /* ── Adicionar inscrição ─────────────────────────────────── */
  fidelidade.sorteioInscritos.push({
    id,
    nome:     nomeLimpo,
    cel:      celLimpo,
    dataNasc: birthdate,
    cadastro: hoje.toISOString(),
    data:     hoje.toLocaleDateString('pt-BR'),
    hora:     hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  });
  if (!fidelidade.metadata) fidelidade.metadata = {};
  fidelidade.metadata.atualizado_em = hoje.toISOString().slice(0, 10);

  /* ── Salvar no GitHub ────────────────────────────────────── */
  const conteudo = JSON.stringify(fidelidade, null, 2);
  // btoa com suporte a UTF-8
  const b64 = btoa(unescape(encodeURIComponent(conteudo)));

  try {
    const r = await fetch(`${GH_API_BASE}/repos/${owner}/${repo}/contents/${FIDELIDADE_PATH}`, {
      method:  'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Sorteio: nova inscrição ${id} — ${nomeLimpo}`,
        content: b64,
        sha,
        branch,
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(`GitHub PUT ${r.status}: ${err.message || JSON.stringify(err)}`);
    }
  } catch (e) {
    console.error('[cadastro] Erro ao salvar fidelidade.json:', e.message);
    return json({ success: false, error: 'Erro ao salvar cadastro. Tente novamente em alguns segundos.' }, 503, origin);
  }

  return json({ success: true, id, message: 'Cadastro realizado com sucesso!' }, 200, origin);
}
