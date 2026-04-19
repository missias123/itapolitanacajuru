/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  AUTO-FIXER v2 — Sorveteria Itapolitana Cajuru               ║
 * ║  Ferramenta de diagnóstico e autocorreção automática         ║
 * ║  Inspirado nas práticas do Google, iFood, Nubank e Amazon    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Como usar no console do navegador (F12):
 *   ITAP_FIXER.diagnostico()   → relatório completo
 *   ITAP_FIXER.corrigir()      → aplica todas as correções automaticamente
 *   ITAP_FIXER.limpar()        → limpa caches locais corrompidos
 *   ITAP_FIXER.sincronizar()   → força resincronização com GitHub
 */
(function () {
  'use strict';

  const VERSION = '2.0.0';
  const LOG_KEY = 'itap_autofixer_log';
  const MAX_LOG = 100;

  // ─────────────────────────────────────────────────────────────
  // UTILITÁRIOS INTERNOS
  // ─────────────────────────────────────────────────────────────
  function log(nivel, msg, dados) {
    const entrada = { ts: new Date().toISOString(), nivel, msg, dados: dados || null };
    try {
      const hist = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      hist.push(entrada);
      if (hist.length > MAX_LOG) hist.splice(0, hist.length - MAX_LOG);
      localStorage.setItem(LOG_KEY, JSON.stringify(hist));
    } catch (e) { /* localStorage pode estar cheio */ }
    if (nivel === 'ERRO')  console.error('[AUTO-FIXER]', msg, dados || '');
    else if (nivel === 'AVISO') console.warn('[AUTO-FIXER]', msg, dados || '');
    else                        console.log('[AUTO-FIXER]', msg, dados || '');
  }

  function $id(id) { return document.getElementById(id); }
  function existe(id) { return !!$id(id); }

  // ─────────────────────────────────────────────────────────────
  // 1. DIAGNÓSTICO — verifica todos os pontos críticos
  // ─────────────────────────────────────────────────────────────
  function diagnostico() {
    console.group('🔍 AUTO-FIXER v' + VERSION + ' — Diagnóstico Completo');

    const resultado = {
      versao: VERSION,
      timestamp: new Date().toISOString(),
      pagina: window.location.pathname,
      problemas: [],
      avisos: [],
      ok: []
    };

    // ── 1.1 Variáveis globais essenciais ──
    const vars = ['ghClientes','ghFidelidade','clienteAtual','GH_TOKEN','CLIENTES_PATH','FIDELIDADE_PATH'];
    vars.forEach(v => {
      if (typeof window[v] === 'undefined') {
        resultado.problemas.push('Variável global ausente: ' + v);
      } else {
        resultado.ok.push('Variável ' + v + ' presente');
      }
    });

    // ── 1.2 Funções críticas ──
    const fns = [
      'carregarDados','cadastrar','entrar','sair',
      'validarCodigo','resgatarPremio','mostrarPainelCliente',
      'atualizarUI','_chaveCliente','_gravarClienteAtual',
      'salvarClientes','salvarFidelidade','ghGet','ghPut',
      'setLoading','hideLoading','showMsg'
    ];
    fns.forEach(fn => {
      if (typeof window[fn] !== 'function') {
        resultado.problemas.push('Função crítica ausente: ' + fn + '()');
      } else {
        resultado.ok.push('Função ' + fn + '() ok');
      }
    });

    // ── 1.3 Elementos HTML essenciais ──
    const ids = [
      'card-acesso','card-cliente','card-historico',
      'inp-nome','inp-cel-novo','inp-cel-login',
      'inp-login-dia','inp-login-mes','inp-login-ano',
      'loading-overlay','painel','painel-admin',
      'pontos-atual','sorvetes-grid','progress-bar',
      'admin-lista','admin-busca','admin-paginacao',
      'btn-reivindicar-estrela','secao-reivindicar-estrela'
    ];
    ids.forEach(id => {
      if (!existe(id)) {
        resultado.avisos.push('Elemento HTML #' + id + ' não encontrado (pode ser ok se em outra página)');
      } else {
        resultado.ok.push('Elemento #' + id + ' presente');
      }
    });

    // ── 1.4 localStorage ──
    try {
      const testKey = '_itap_test_' + Date.now();
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      resultado.ok.push('localStorage funcional');
    } catch (e) {
      resultado.problemas.push('localStorage indisponível: ' + e.message);
    }

    // ── 1.5 Sessão do cliente ──
    const celSalvo = localStorage.getItem('itap_cel');
    if (celSalvo) {
      resultado.ok.push('Sessão salva para cel: ' + celSalvo.substring(0,4) + '****');
    } else {
      resultado.avisos.push('Nenhuma sessão de cliente ativa');
    }

    // ── 1.6 Dados carregados ──
    if (typeof ghClientes !== 'undefined' && ghClientes) {
      const total = Object.keys(ghClientes.clientes || {}).length;
      const totalIdx = Object.keys(ghClientes.indice_celular || {}).length;
      resultado.ok.push('ghClientes carregado — ' + total + ' clientes, ' + totalIdx + ' no índice');
      if (total !== totalIdx) {
        resultado.avisos.push('Desincronização: ' + total + ' clientes vs ' + totalIdx + ' no indice_celular');
      }
    } else {
      resultado.avisos.push('ghClientes ainda não carregado (normal antes do carregarDados)');
    }

    if (typeof ghFidelidade !== 'undefined' && ghFidelidade) {
      const codigos = Object.keys(ghFidelidade['códigos'] || ghFidelidade.codigos || {}).length;
      resultado.ok.push('ghFidelidade carregado — ' + codigos + ' códigos');
    } else {
      resultado.avisos.push('ghFidelidade ainda não carregado');
    }

    // ── 1.7 SHA tracking ──
    if (typeof ghClientesSha !== 'undefined' && ghClientesSha) {
      resultado.ok.push('SHA clientes.json rastreado: ' + ghClientesSha.substring(0,8) + '...');
    } else {
      resultado.avisos.push('SHA de clientes.json não disponível (pode causar 409 no próximo save)');
    }

    // ── 1.8 Conectividade GitHub API ──
    if (typeof GH_TOKEN !== 'undefined' && GH_TOKEN && GH_TOKEN.length > 10) {
      resultado.ok.push('GH_TOKEN configurado (' + GH_TOKEN.length + ' chars)');
    } else {
      resultado.problemas.push('GH_TOKEN ausente ou inválido — salvamento não funcionará');
    }

    // ── 1.9 Service Worker ──
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        if (regs.length > 0) {
          log('INFO', 'Service Worker ativo: ' + regs.length + ' registro(s)');
        }
      }).catch(() => {});
      resultado.ok.push('Service Worker API suportada');
    }

    // ── RELATÓRIO FINAL ──
    console.log('\n📊 RESUMO:');
    console.log('✅ OK (' + resultado.ok.length + '):', resultado.ok);
    if (resultado.avisos.length) console.warn('⚠️ AVISOS (' + resultado.avisos.length + '):', resultado.avisos);
    if (resultado.problemas.length) console.error('🔴 PROBLEMAS (' + resultado.problemas.length + '):', resultado.problemas);
    console.groupEnd();

    log('INFO', 'Diagnóstico concluído', {
      problemas: resultado.problemas.length,
      avisos: resultado.avisos.length,
      ok: resultado.ok.length
    });

    return resultado;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CORREÇÃO AUTOMÁTICA
  // ─────────────────────────────────────────────────────────────
  async function corrigir() {
    console.group('🔧 AUTO-FIXER — Aplicando Correções Automáticas');
    const correcoes = [];
    const falhas = [];

    // ── 2.1 Corrigir indice_celular desincronizado ──
    try {
      if (typeof ghClientes !== 'undefined' && ghClientes && ghClientes.clientes) {
        const idx = ghClientes.indice_celular || {};
        let corrigido = false;
        Object.entries(ghClientes.clientes).forEach(([chave, c]) => {
          if (c && c.cel) {
            if (!idx[c.cel] || idx[c.cel] !== chave) {
              idx[c.cel] = chave;
              corrigido = true;
            }
          }
        });
        if (corrigido) {
          ghClientes.indice_celular = idx;
          correcoes.push('indice_celular reconstruído para ' + Object.keys(idx).length + ' clientes');
          log('INFO', 'indice_celular reconstruído');
        } else {
          correcoes.push('indice_celular já estava correto');
        }
      }
    } catch (e) {
      falhas.push('Erro ao reconstruir indice_celular: ' + e.message);
      log('ERRO', 'Falha no indice_celular', e.message);
    }

    // ── 2.2 Corrigir campos obrigatórios ausentes nos clientes ──
    try {
      if (typeof ghClientes !== 'undefined' && ghClientes && ghClientes.clientes) {
        let clientesCorrigidos = 0;
        Object.entries(ghClientes.clientes).forEach(([chave, c]) => {
          if (!c) return;
          let mudou = false;
          if (typeof c.saldoPontos === 'undefined') { c.saldoPontos = 0; mudou = true; }
          if (!Array.isArray(c.codigosUsados)) { c.codigosUsados = []; mudou = true; }
          if (!Array.isArray(c.resgates)) { c.resgates = []; mudou = true; }
          if (typeof c.totalPremios === 'undefined') { c.totalPremios = c.resgates.length; mudou = true; }
          if (typeof c.totalCodigos === 'undefined') { c.totalCodigos = c.codigosUsados.length; mudou = true; }
          if (typeof c.bloqueado === 'undefined') { c.bloqueado = false; mudou = true; }
          if (typeof c.tentativasInvalidas === 'undefined') { c.tentativasInvalidas = 0; mudou = true; }
          if (!c.id) { c.id = chave; mudou = true; }
          // Migrar rodadaAtual para saldoPontos se necessário
          if (c.rodadaAtual && typeof c.saldoPontos === 'number' && c.saldoPontos === 0) {
            const pts = (c.rodadaAtual.pontos || 0);
            if (pts > 0) { c.saldoPontos = pts; mudou = true; }
          }
          if (mudou) {
            ghClientes.clientes[chave] = c;
            clientesCorrigidos++;
          }
        });
        if (clientesCorrigidos > 0) {
          correcoes.push(clientesCorrigidos + ' cliente(s) com campos corrigidos em memória');
          log('INFO', 'Campos de clientes corrigidos', { count: clientesCorrigidos });
        } else {
          correcoes.push('Todos os clientes com estrutura correta');
        }
      }
    } catch (e) {
      falhas.push('Erro ao corrigir campos de clientes: ' + e.message);
      log('ERRO', 'Falha na correção de clientes', e.message);
    }

    // ── 2.3 Restaurar sessão perdida ──
    try {
      const celSalvo = localStorage.getItem('itap_cel');
      if (celSalvo && typeof clienteAtual === 'undefined' || (celSalvo && !window.clienteAtual)) {
        if (typeof _chaveCliente === 'function' && typeof ghClientes !== 'undefined' && ghClientes) {
          const chave = _chaveCliente(celSalvo);
          if (chave && ghClientes.clientes[chave]) {
            window.clienteAtual = ghClientes.clientes[chave];
            correcoes.push('Sessão restaurada para: ' + (window.clienteAtual.nome || celSalvo));
            log('INFO', 'Sessão restaurada', celSalvo);
            if (typeof mostrarPainelCliente === 'function') mostrarPainelCliente();
          }
        }
      }
    } catch (e) {
      falhas.push('Erro ao restaurar sessão: ' + e.message);
    }

    // ── 2.4 Limpar tentativas expiradas de anti-fraude ──
    try {
      const key = 'itap_fid_tentativas';
      const dados = JSON.parse(localStorage.getItem(key) || '{"tentativas":[],"bloqueadoAte":0}');
      const agora = Date.now();
      const antes = dados.tentativas.length;
      dados.tentativas = dados.tentativas.filter(t => agora - t < 10 * 60 * 1000);
      if (dados.bloqueadoAte && agora >= dados.bloqueadoAte) {
        dados.bloqueadoAte = 0;
        correcoes.push('Bloqueio de tentativas expirado removido');
        log('INFO', 'Bloqueio de tentativas local limpo');
      }
      if (dados.tentativas.length !== antes) {
        correcoes.push('Tentativas expiradas removidas: ' + (antes - dados.tentativas.length));
      }
      localStorage.setItem(key, JSON.stringify(dados));
    } catch (e) {
      falhas.push('Erro ao limpar tentativas: ' + e.message);
    }

    // ── 2.5 Corrigir loading-overlay preso ──
    try {
      const overlay = $id('loading-overlay');
      if (overlay && !overlay.classList.contains('hide') && overlay.style.display !== 'none') {
        // Verificar se não há operação em andamento (aguardar 3s)
        setTimeout(() => {
          if (typeof hideLoading === 'function') {
            hideLoading();
            correcoes.push('Loading overlay preso foi liberado');
            log('AVISO', 'Loading overlay estava preso — liberado automaticamente');
          }
        }, 3000);
      }
    } catch (e) {
      falhas.push('Erro ao verificar loading overlay: ' + e.message);
    }

    // ── 2.6 Corrigir SHA ausente (forçar refresh na próxima operação) ──
    try {
      if (typeof ghClientesSha === 'undefined' || !window.ghClientesSha) {
        // SHA será atualizado automaticamente no próximo salvarClientes() via fresh fetch
        correcoes.push('SHA de clientes.json será atualizado na próxima operação de save');
      }
    } catch (e) { /* silencioso */ }

    // ── RELATÓRIO ──
    console.log('\n📋 Correções aplicadas (' + correcoes.length + '):');
    correcoes.forEach(c => console.log('  ✅', c));
    if (falhas.length) {
      console.error('❌ Falhas (' + falhas.length + '):');
      falhas.forEach(f => console.error('  ❌', f));
    }
    console.groupEnd();

    return { correcoes, falhas };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. LIMPAR CACHES LOCAIS CORROMPIDOS
  // ─────────────────────────────────────────────────────────────
  function limpar(opcoes) {
    const opt = opcoes || {};
    const removidos = [];

    const chaves = [
      'itap_fid_tentativas',
      'itap_fid_ultimo_uso',
      'itap_quality_guard',
      'itap_auto_healer',
      'itap_autofixer_log'
    ];

    if (opt.tudo) {
      chaves.push('itap_cel'); // só remove sessão se explicitamente pedido
    }

    chaves.forEach(k => {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        removidos.push(k);
      }
    });

    log('INFO', 'Cache limpo', { removidos });
    console.log('🗑️ AUTO-FIXER: Caches removidos:', removidos);
    return removidos;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. SINCRONIZAR COM GITHUB
  // ─────────────────────────────────────────────────────────────
  async function sincronizar() {
    console.group('🔄 AUTO-FIXER — Sincronizando com GitHub...');
    try {
      if (typeof carregarDados !== 'function') {
        console.error('❌ carregarDados() não disponível');
        console.groupEnd();
        return { ok: false, erro: 'carregarDados não disponível' };
      }
      await carregarDados();
      console.log('✅ Dados sincronizados com sucesso');
      log('INFO', 'Sincronização manual concluída');
      console.groupEnd();
      return { ok: true };
    } catch (e) {
      console.error('❌ Erro na sincronização:', e);
      log('ERRO', 'Falha na sincronização', e.message);
      console.groupEnd();
      return { ok: false, erro: e.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. VERIFICAÇÃO PÓSCARREGAMENTO AUTOMÁTICA
  // ─────────────────────────────────────────────────────────────
  window.addEventListener('load', function () {
    setTimeout(function () {
      // Verificar silenciosamente e logar avisos
      const diag = diagnostico();
      if (diag.problemas.length > 0) {
        log('AVISO', 'Problemas detectados no carregamento', { problemas: diag.problemas });
        // Tentar autocorrigir silenciosamente
        corrigir().then(function (r) {
          if (r.correcoes.length > 0) {
            log('INFO', 'Autocorreção silenciosa aplicada', r.correcoes);
          }
        });
      }
    }, 2500); // Aguarda carregarDados() completar
  });

  // ─────────────────────────────────────────────────────────────
  // 6. MONITOR DE ERROS JAVASCRIPT NÃO TRATADOS
  // ─────────────────────────────────────────────────────────────
  window.addEventListener('error', function (e) {
    const err = {
      msg: e.message,
      arquivo: (e.filename || '').replace(window.location.origin, ''),
      linha: e.lineno,
      col: e.colno,
      ts: new Date().toISOString()
    };
    log('ERRO', 'Erro JS capturado', err);

    // Tentar recuperar loading overlay preso em caso de erro crítico
    if (e.message && (e.message.includes('Cannot read') || e.message.includes('undefined'))) {
      setTimeout(function () {
        try {
          if (typeof hideLoading === 'function') hideLoading();
        } catch (ex) { /* silencioso */ }
      }, 500);
    }
  });

  window.addEventListener('unhandledrejection', function (e) {
    log('ERRO', 'Promise não tratada', String(e.reason));
    // Recuperar loading overlay preso
    setTimeout(function () {
      try {
        if (typeof hideLoading === 'function') hideLoading();
      } catch (ex) { /* silencioso */ }
    }, 500);
  });

  // ─────────────────────────────────────────────────────────────
  // 7. API PÚBLICA
  // ─────────────────────────────────────────────────────────────
  window.ITAP_FIXER = {
    versao: VERSION,

    /** Diagnóstico completo do sistema */
    diagnostico: diagnostico,

    /** Aplica todas as correções automáticas disponíveis */
    corrigir: corrigir,

    /** Limpa caches locais. Passe { tudo: true } para incluir sessão */
    limpar: limpar,

    /** Força resincronização com o GitHub */
    sincronizar: sincronizar,

    /** Exibe o log do auto-fixer */
    log: function () {
      try {
        const hist = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
        console.table(hist.slice(-20));
        return hist;
      } catch (e) { return []; }
    },

    /** Reinicia a página após correção */
    reiniciar: function () {
      log('INFO', 'Reinicialização manual solicitada');
      window.location.reload(true);
    }
  };

  console.log('%c🔧 AUTO-FIXER v' + VERSION + ' ativado', 'color:#e8650a;font-weight:bold;font-size:12px');
  console.log('%cUse ITAP_FIXER.diagnostico() para verificar o sistema', 'color:#888;font-size:11px');

})();
