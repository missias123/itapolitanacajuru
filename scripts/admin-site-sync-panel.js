/*
 * Centro de Sincronização Admin ↔ Site.
 *
 * Este módulo é deliberadamente somente leitura. Ele consulta o Worker com a
 * sessão administrativa já criada pelo Admin, lê apenas páginas públicas e
 * nunca faz POST, PUT, PATCH ou DELETE. Não lê nem envia token GitHub.
 */
(function () {
  'use strict';

  const WORKER_API = 'https://api.itapolitanacajuru.com.br';
  const PUBLIC_PAGES = [
    ['index.html', 'Página Inicial'],
    ['sobre.html', 'Sobre'],
    ['encomendas.html', 'Encomendas'],
    ['retirada.html', 'Retirada'],
    ['dicas.html', 'Dicas'],
    ['promocao.html', 'Promoção'],
    ['carrossel.html', 'Carrossel'],
    ['politica-privacidade.html', 'Privacidade']
  ];
  const DOMAIN_LABELS = {
    catalog: 'Catálogo',
    editorial_config: 'Configuração editorial',
    orders: 'Encomendas',
    campaign_picole: 'Campanha Picolé'
  };
  const state = { running: false, result: null };

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function workerHeaders() {
    const headers = { Accept: 'application/json' };
    if (typeof window.getWorkerAuthHeaders === 'function') {
      return { ...window.getWorkerAuthHeaders(headers), Accept: 'application/json' };
    }
    try {
      const token = sessionStorage.getItem('itap_worker_session_token') || '';
      if (token) headers['X-Itap-Session-Token'] = token;
    } catch (error) {
      // Sessão indisponível: o Worker responderá 401 e a UI mostrará instrução clara.
    }
    return headers;
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch (error) {
      return {};
    }
  }

  async function fetchWorkerSync() {
    const response = await fetch(`${WORKER_API}/api/admin/sync/domains?sync=${Date.now()}`, {
      headers: workerHeaders(),
      cache: 'no-store'
    });
    const payload = await readJson(response);
    if (response.status === 401) {
      throw new Error('Sessão do Worker ausente ou expirada. Saia e entre novamente no Admin.');
    }
    if (response.status === 403) {
      throw new Error('A sessão não tem a permissão audit:read para consultar o sincronismo.');
    }
    if (!response.ok || payload.ok !== true) {
      throw new Error(payload.error || `Worker HTTP ${response.status}`);
    }
    return payload;
  }

  async function publicText(path) {
    const response = await fetch(`/${path}?sync=${Date.now()}`, { cache: 'no-store' });
    return {
      path,
      status: response.status,
      text: response.ok ? await response.text() : ''
    };
  }

  async function checkPublicPages() {
    const results = await Promise.all(PUBLIC_PAGES.map(async ([path, label]) => {
      try {
        const result = await publicText(path);
        return { path, label, status: result.status, ok: result.status === 200 };
      } catch (error) {
        return { path, label, status: 'erro', ok: false, error: error.message };
      }
    }));
    return results;
  }

  function hasAdminId(html, id) {
    if (!html || !id) return false;
    const escaped = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\bid\\s*=\\s*["']${escaped}["']`, 'i').test(html)
      || new RegExp(`\\bid\\s*=\\s*${escaped}(?=[\\s>])`, 'i').test(html);
  }

  async function checkMatrix(matrix) {
    const rows = Array.isArray(matrix?.campos) ? matrix.campos : [];
    const adminHtml = document.documentElement?.outerHTML || '';
    const targetPaths = [...new Set([
      ...rows.map((row) => row?.targetFile).filter(Boolean),
      ...PUBLIC_PAGES.map(([path]) => path)
    ])];
    const loaded = await Promise.all(targetPaths.map(async (path) => {
      try {
        return [path, await publicText(path)];
      } catch (error) {
        return [path, { path, status: 'erro', text: '', error: error.message }];
      }
    }));
    const targetCache = new Map(loaded);
    let ok = 0;
    let weak = 0;
    const failures = [];

    rows.forEach((row) => {
      const target = targetCache.get(row.targetFile);
      const adminOk = hasAdminId(adminHtml, row.adminId);
      const exactNeedle = typeof row.siteNeedle === 'string' && row.siteNeedle.trim() && row.siteNeedle.trim() !== '<';
      const targetOk = Boolean(target?.status === 200 && exactNeedle && target.text.includes(row.siteNeedle));
      if (adminOk && targetOk) {
        ok += 1;
        return;
      }
      if (adminOk && row.siteNeedle === '<') weak += 1;
      const reason = !adminOk
        ? 'adminId ausente'
        : target?.status !== 200
          ? `alvo HTTP ${target?.status ?? 'não lido'}`
          : row.siteNeedle === '<'
            ? 'marcador genérico; não comprova reflexo'
            : !exactNeedle
              ? 'marcador vazio'
              : 'marcador não encontrado';
      failures.push(`${row.id || 'sem-id'}: ${reason} (${row.targetFile || 'alvo ausente'})`);
    });

    const pages = PUBLIC_PAGES.map(([path, label]) => {
      const target = targetCache.get(path);
      return {
        path,
        label,
        status: target?.status ?? 'não verificado',
        ok: target?.status === 200
      };
    });
    return {
      state: matrix?.state || 'not_verified',
      revision: matrix?.revision || null,
      total: rows.length,
      ok,
      weak,
      failures,
      pages
    };
  }

  function domainStatus(stateValue) {
    if (stateValue === 'synchronized') return { text: 'RECONCILIADO', className: 'sync-ok' };
    if (stateValue === 'source_available') return { text: 'FONTE DISPONÍVEL / NÃO RECONCILIADO', className: 'sync-warn' };
    if (stateValue === 'blocked') return { text: 'BLOQUEADO / INATIVO', className: 'sync-warn' };
    if (stateValue === 'not_verified') return { text: 'NÃO VERIFICADO', className: 'sync-muted' };
    return { text: String(stateValue || 'NÃO INFORMADO').toUpperCase(), className: 'sync-muted' };
  }

  function render(result) {
    const summary = $('sync-summary');
    const sources = $('sync-sources');
    const matrix = $('sync-matrix');
    const report = $('sync-report');
    if (!summary || !sources || !matrix || !report) return;

    const domains = Array.isArray(result.domains) ? result.domains : [];
    const countSync = domains.filter((item) => item.state === 'synchronized').length;
    const countAvailable = domains.filter((item) => item.state === 'source_available').length;
    const countBlocked = domains.filter((item) => item.state === 'blocked').length;
    const pagesOk = result.pages.filter((item) => item.ok).length;
    const statusText = `${domains.length} domínios consultados · ${countSync} reconciliados · ${countAvailable} fontes disponíveis sem reconciliação · ${countBlocked} bloqueados/inativos · páginas ${pagesOk}/${result.pages.length} HTTP 200 · matriz ${result.matrix.ok}/${result.matrix.total}`;
    summary.className = 'sync-summary sync-summary-ok';
    summary.innerHTML = `<strong>Verificação concluída.</strong> ${escapeHtml(statusText)}<br><span>Gerado em ${escapeHtml(result.generatedAt)}</span>`;

    sources.innerHTML = domains.map((item) => {
      const status = domainStatus(item.state);
      return `<div class="sync-row"><div><strong>${escapeHtml(DOMAIN_LABELS[item.domain] || item.domain || 'Domínio')}</strong><div class="sync-path">Fonte: ${escapeHtml(item.sourceOfTruth || 'não informada')} · Escrita: ${escapeHtml(item.writePath || 'não informada')}</div></div><span class="sync-pill ${status.className}">${escapeHtml(status.text)}</span><div class="sync-detail">${escapeHtml(item.error || (item.state === 'synchronized' ? 'Reconciliação exacta consultada no Worker autenticado.' : item.state === 'source_available' ? 'Fonte disponível; a igualdade com a superfície pública ainda precisa de prova.' : item.state === 'blocked' ? 'Estado bloqueado ou inativo; não anunciar nem activar sem confirmação.' : 'Estado requer revisão.'))}</div></div>`;
    }).join('');

    const pageStatus = result.pages.map((item) => `${item.label}: HTTP ${item.status}`).join(' · ');
    const matrixState = result.matrix.state === 'available' ? 'disponível' : 'não verificada';
    matrix.innerHTML = `<div class="sync-matrix-summary"><strong>Matriz Admin ↔ Site:</strong> ${result.matrix.ok} de ${result.matrix.total} relações com marcador exacto encontrado; ${result.matrix.weak} relação(ões) usam marcador genérico e não contam como prova. Estado da matriz: ${escapeHtml(matrixState)}.<br><span>${escapeHtml(pageStatus)}</span></div>${result.matrix.failures.length ? `<pre class="sync-failures">${escapeHtml(result.matrix.failures.join('\n'))}</pre>` : ''}`;

    report.textContent = buildReport(result);
    report.style.display = 'block';
  }

  function renderError(message) {
    const summary = $('sync-summary');
    const sources = $('sync-sources');
    const matrix = $('sync-matrix');
    const report = $('sync-report');
    if (summary) {
      summary.className = 'sync-summary sync-summary-error';
      summary.innerHTML = `<strong>Verificação não executada.</strong> ${escapeHtml(message)}<br><span>O painel não fez fallback para GitHub e não tentou nenhuma escrita.</span>`;
    }
    if (sources) sources.innerHTML = '';
    if (matrix) matrix.innerHTML = '';
    if (report) {
      report.textContent = '';
      report.style.display = 'none';
    }
  }

  function buildReport(result) {
    const lines = [
      'RELATÓRIO DE SINCRONIZAÇÃO ADMIN ↔ SITE',
      `Gerado em: ${result.generatedAt}`,
      'Autorização: leitura autenticada pelo Worker com audit:read.',
      'Modo: somente leitura; nenhum POST, PUT, PATCH ou DELETE foi executado.',
      'Dados pessoais: não lidos nem incluídos.',
      '',
      'DOMÍNIOS'
    ];
    (result.domains || []).forEach((item) => {
      lines.push(`${item.state || 'não informado'} | ${item.domain || 'sem domínio'} | fonte=${item.sourceOfTruth || 'não informada'} | escrita=${item.writePath || 'não informada'}`);
    });
    lines.push('', 'MATRIZ ADMIN ↔ SITE', `${result.matrix.ok}/${result.matrix.total} relações com marcador exacto; ${result.matrix.weak} com marcador genérico não considerado prova.`);
    result.matrix.failures.forEach((failure) => lines.push(`PENDENTE | ${failure}`));
    lines.push('', 'PÁGINAS PÚBLICAS');
    result.pages.forEach((page) => lines.push(`${page.ok ? 'OK' : 'REVISAR'} | ${page.label} | ${page.path} | HTTP ${page.status}`));
    lines.push('', 'LIMITES', 'Este relatório comprova apenas a leitura e a comparação no momento da verificação. “Fonte disponível” não significa conteúdo reconciliado. Não autoriza publicação, não grava alterações e não significa sincronização bidireccional automática. Pedidos e campanhas continuam sujeitos às fontes de verdade e permissões documentadas.');
    return lines.join('\n');
  }

  async function run() {
    if (state.running) return;
    state.running = true;
    const button = $('sync-run');
    if (button) {
      button.disabled = true;
      button.textContent = 'A verificar…';
    }
    const summary = $('sync-summary');
    if (summary) {
      summary.className = 'sync-summary';
      summary.textContent = 'A consultar o Worker autenticado, as páginas públicas e a matriz…';
    }
    try {
      const payload = await fetchWorkerSync();
      const pages = await checkPublicPages();
      const matrix = await checkMatrix(payload.matrix || {});
      const result = { ...payload, pages, matrix };
      state.result = result;
      render(result);
    } catch (error) {
      state.result = null;
      renderError(error?.message || 'Falha controlada na verificação.');
    } finally {
      state.running = false;
      if (button) {
        button.disabled = false;
        button.textContent = 'Verificar sincronização';
      }
    }
  }

  async function copyReport() {
    const report = $('sync-report');
    if (!report || !report.textContent.trim()) {
      if (typeof window.toast === 'function') window.toast('Execute a verificação antes de copiar.', 'aviso');
      return;
    }
    let copied = false;
    try {
      copied = typeof window.copiarTextoSeguro === 'function'
        ? await window.copiarTextoSeguro(report.textContent)
        : false;
    } catch (error) {
      copied = false;
    }
    if (typeof window.toast === 'function') window.toast(copied ? 'Relatório de sincronização copiado.' : 'Selecione o relatório e copie manualmente.', copied ? 'sucesso' : 'aviso');
  }

  function init() {
    const runButton = $('sync-run');
    const copyButton = $('sync-copy');
    if (!runButton || runButton.dataset.syncReady === '1') return;
    runButton.dataset.syncReady = '1';
    runButton.addEventListener('click', run);
    if (copyButton) copyButton.addEventListener('click', copyReport);
    window.executarSincronizacaoAdminSite = run;
    window.copiarRelatorioSincronizacao = copyReport;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
