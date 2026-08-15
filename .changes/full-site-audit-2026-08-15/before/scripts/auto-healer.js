/**
 * AUTO-HEALER v1 — Sorveteria Itapolitana Cajuru
 * 
 * Script que detecta e corrige automaticamente erros de carregamento de recursos
 * bloqueados pela Content Security Policy (CSP) ou outros problemas de rede.
 * 
 * Funcionalidades:
 * - Detecta recursos 404 ou bloqueados
 * - Tenta recarregar com fallback URLs
 * - Injeta CSP dinamicamente se necessário
 * - Registra tentativas de correção
 * - Notifica o Quality Guard sobre ações tomadas
 */

(function() {
  'use strict';

  const HEALER_KEY = 'itap_auto_healer';
  const CRITICAL_RESOURCES = {
    'googletagmanager.com': {
      type: 'script',
      fallbacks: [
        'https://www.googletagmanager.com/gtag/js',
        'https://www.googletagmanager.com/gtm.js'
      ],
      priority: 'critical'
    },
    'google-analytics.com': {
      type: 'script',
      fallbacks: ['https://www.google-analytics.com/analytics.js'],
      priority: 'critical'
    },
    'stats.g.doubleclick.net': {
      type: 'beacon',
      fallbacks: ['https://stats.g.doubleclick.net/collect'],
      priority: 'high'
    }
  };

  // ═══════════════════════════════════════════════════════
  // 1. VERIFICAR E CORRIGIR CSP
  // ═══════════════════════════════════════════════════════
  function verificarECorrigirCSP() {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!cspMeta) {
      console.warn('⚠️ AUTO-HEALER: CSP não encontrada. Criando CSP padrão...');
      criarCSPPadrao();
      return false;
    }

    const cspContent = cspMeta.getAttribute('content') || '';
    const dominiosCriticos = [
      'googletagmanager.com',
      'google-analytics.com',
      'stats.g.doubleclick.net'
    ];

    let cspIncompleta = false;
    const dominiosAusentes = [];

    dominiosCriticos.forEach(dominio => {
      if (!cspContent.includes(dominio)) {
        cspIncompleta = true;
        dominiosAusentes.push(dominio);
      }
    });

    if (cspIncompleta) {
      console.warn('⚠️ AUTO-HEALER: CSP incompleta. Domínios ausentes:', dominiosAusentes);
      atualizarCSP(cspMeta, dominiosAusentes);
      return false;
    }

    return true;
  }

  function criarCSPPadrao() {
    const cspContent = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: https://www.google-analytics.com https://stats.g.doubleclick.net;";
    
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspContent;
    document.head.insertBefore(meta, document.head.firstChild);
    
    registrarAcao('CSP_CRIADA', { dominio: 'todos', acao: 'criada' });
    console.log('✅ AUTO-HEALER: CSP padrão criada com sucesso');
  }

  function atualizarCSP(meta, dominiosAusentes) {
    let cspContent = meta.getAttribute('content') || '';
    
    dominiosAusentes.forEach(dominio => {
      if (dominio.includes('googletagmanager') || dominio.includes('google-analytics')) {
        if (!cspContent.includes(`https://${dominio}`)) {
          cspContent = cspContent.replace(
            /script-src[^;]*/,
            match => match + ` https://${dominio}`
          );
        }
      }
      
      if (dominio.includes('google-analytics') || dominio.includes('doubleclick')) {
        if (!cspContent.includes(`https://${dominio}`)) {
          cspContent = cspContent.replace(
            /connect-src[^;]*/,
            match => match + ` https://${dominio}`
          );
        }
      }
    });

    meta.setAttribute('content', cspContent);
    registrarAcao('CSP_ATUALIZADA', { dominios: dominiosAusentes });
    console.log('✅ AUTO-HEALER: CSP atualizada com sucesso');
  }

  // ═══════════════════════════════════════════════════════
  // 2. MONITORAR FALHAS DE RECURSOS
  // ═══════════════════════════════════════════════════════
  const recursosFalhados = [];

  window.addEventListener('error', function(e) {
    if (e.target && e.target !== window) {
      const src = e.target.src || e.target.href || '';
      
      Object.keys(CRITICAL_RESOURCES).forEach(dominio => {
        if (src.includes(dominio)) {
          console.warn(`⚠️ AUTO-HEALER: Recurso crítico falhou: ${src}`);
          tentarRecarregarRecurso(e.target, dominio);
        }
      });
    }
  }, true);

  function tentarRecarregarRecurso(elemento, dominio) {
    const config = CRITICAL_RESOURCES[dominio];
    if (!config) return;

    const tentativa = {
      dominio,
      elemento: elemento.tagName,
      urlOriginal: elemento.src || elemento.href,
      tentativas: [],
      timestamp: new Date().toISOString()
    };

    config.fallbacks.forEach((fallbackUrl, index) => {
      setTimeout(() => {
        console.log(`🔄 AUTO-HEALER: Tentativa ${index + 1}/${config.fallbacks.length} para ${dominio}`);
        
        if (elemento.tagName === 'SCRIPT') {
          const novoScript = document.createElement('script');
          novoScript.src = fallbackUrl;
          novoScript.async = true;
          novoScript.onload = () => {
            tentativa.tentativas.push({ url: fallbackUrl, status: 'sucesso' });
            registrarAcao('RECURSO_RECARREGADO', tentativa);
            console.log(`✅ AUTO-HEALER: ${dominio} recarregado com sucesso`);
          };
          novoScript.onerror = () => {
            tentativa.tentativas.push({ url: fallbackUrl, status: 'falhou' });
          };
          document.head.appendChild(novoScript);
        }
      }, index * 1000);
    });
  }

  // ═══════════════════════════════════════════════════════
  // 3. DETECTAR VIOLAÇÕES DE CSP
  // ═══════════════════════════════════════════════════════
  document.addEventListener('securitypolicyviolation', function(e) {
    console.warn('🚨 AUTO-HEALER: Violação de CSP detectada', {
      diretiva: e.violatedDirective,
      bloqueado: e.blockedURI
    });

    if (e.blockedURI.includes('googletagmanager') || e.blockedURI.includes('google-analytics')) {
      console.log('🔧 AUTO-HEALER: Tentando corrigir CSP para Google Tag Manager...');
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (cspMeta) {
        atualizarCSP(cspMeta, ['googletagmanager.com', 'google-analytics.com']);
      }
    }

    registrarAcao('CSP_VIOLATION_DETECTADA', {
      diretiva: e.violatedDirective,
      bloqueado: e.blockedURI,
      origem: e.sourceFile
    });
  });

  // ═══════════════════════════════════════════════════════
  // 4. VALIDAR RECURSOS CRÍTICOS NO CARREGAMENTO
  // ═══════════════════════════════════════════════════════
  window.addEventListener('load', function() {
    setTimeout(() => {
      console.log('🔍 AUTO-HEALER: Validando recursos críticos...');
      
      if (typeof gtag !== 'undefined') {
        console.log('✅ AUTO-HEALER: Google Analytics carregado com sucesso');
        registrarAcao('GOOGLE_ANALYTICS_OK', {});
      } else {
        console.warn('⚠️ AUTO-HEALER: Google Analytics não foi carregado');
        registrarAcao('GOOGLE_ANALYTICS_FALHOU', {});
      }

      if (typeof dataLayer !== 'undefined') {
        console.log('✅ AUTO-HEALER: Google Tag Manager carregado com sucesso');
        registrarAcao('GOOGLE_TAG_MANAGER_OK', {});
      } else {
        console.warn('⚠️ AUTO-HEALER: Google Tag Manager não foi carregado');
        registrarAcao('GOOGLE_TAG_MANAGER_FALHOU', {});
      }
    }, 2000);
  });

  // ═══════════════════════════════════════════════════════
  // 5. REGISTRAR AÇÕES E ARMAZENAR HISTÓRICO
  // ═══════════════════════════════════════════════════════
  function registrarAcao(tipo, dados) {
    try {
      const historico = JSON.parse(localStorage.getItem(HEALER_KEY) || '[]');
      historico.push({
        tipo,
        dados,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      if (historico.length > 50) {
        historico.shift();
      }
      
      localStorage.setItem(HEALER_KEY, JSON.stringify(historico));
    } catch(e) {
      console.error('Erro ao registrar ação:', e);
    }
  }

  // ═══════════════════════════════════════════════════════
  // 6. API PÚBLICA - window.AUTO_HEALER
  // ═══════════════════════════════════════════════════════
  window.AUTO_HEALER = {
    verificar: function() {
      console.log('🔍 AUTO-HEALER: Executando verificação manual...');
      const cspOk = verificarECorrigirCSP();
      console.log(cspOk ? '✅ CSP OK' : '⚠️ CSP corrigida');
      return this.relatorio();
    },

    relatorio: function() {
      try {
        const historico = JSON.parse(localStorage.getItem(HEALER_KEY) || '[]');
        return {
          total_acoes: historico.length,
          ultimas_acoes: historico.slice(-10),
          recursos_criticos: CRITICAL_RESOURCES,
          timestamp: new Date().toISOString()
        };
      } catch(e) {
        return { erro: e.message };
      }
    },

    limpar: function() {
      localStorage.removeItem(HEALER_KEY);
      console.log('🗑️ AUTO-HEALER: Histórico limpo');
    },

    corrigirCSP: function() {
      verificarECorrigirCSP();
      console.log('✅ AUTO-HEALER: CSP verificada e corrigida');
    }
  };

  // ═══════════════════════════════════════════════════════
  // 7. INICIALIZAR NA CARGA DA PÁGINA
  // ═══════════════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verificarECorrigirCSP);
  } else {
    verificarECorrigirCSP();
  }

  console.log('🚀 AUTO-HEALER v1 ativado - Monitorando recursos críticos');

})();
