/**
 * QUALITY GUARD — Sorveteria Itapolitana Cajuru
 * Script embutido no código que monitora automaticamente:
 * - Erros de JavaScript em tempo real
 * - Core Web Vitals (LCP, CLS, FID/INP)
 * - Service Worker (PWA offline)
 * - Recursos 404
 * - Performance de carregamento
 * Inspirado nas práticas do Google, iFood e Amazon.
 */
(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════
  // 1. MEMÓRIA DE QUALIDADE — persiste entre sessões
  // ═══════════════════════════════════════════════════════
  const QG_KEY = 'itap_quality_guard';
  
  function lerMemoria() {
    try {
      return JSON.parse(localStorage.getItem(QG_KEY) || '{}');
    } catch(e) { return {}; }
  }
  
  function salvarMemoria(dados) {
    try {
      const atual = lerMemoria();
      const novo = Object.assign(atual, dados, { ultima_atualizacao: new Date().toISOString() });
      localStorage.setItem(QG_KEY, JSON.stringify(novo));
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════
  // 2. CAPTURA DE ERROS JS EM TEMPO REAL
  // ═══════════════════════════════════════════════════════
  const erros_js = [];
  
  window.addEventListener('error', function(e) {
    const erro = {
      tipo: 'JS_ERROR',
      msg: e.message,
      arquivo: e.filename ? e.filename.replace(window.location.origin, '') : 'desconhecido',
      linha: e.lineno,
      ts: new Date().toISOString()
    };
    erros_js.push(erro);
    salvarMemoria({ erros_js: erros_js.slice(-10) }); // guarda últimos 10
  });

  window.addEventListener('unhandledrejection', function(e) {
    const erro = {
      tipo: 'PROMISE_ERROR',
      msg: String(e.reason),
      ts: new Date().toISOString()
    };
    erros_js.push(erro);
    salvarMemoria({ erros_js: erros_js.slice(-10) });
  });

  // ═══════════════════════════════════════════════════════
  // 3. CAPTURA DE RECURSOS 404
  // ═══════════════════════════════════════════════════════
  const recursos_404 = [];
  
  // Interceptar erros de carregamento de recursos
  window.addEventListener('error', function(e) {
    if (e.target && e.target !== window && e.target.tagName) {
      const tag = e.target.tagName.toLowerCase();
      const src = e.target.src || e.target.href || '';
      if (src && (tag === 'img' || tag === 'script' || tag === 'link')) {
        const recurso = {
          tipo: '404',
          tag: tag,
          url: src.replace(window.location.origin, ''),
          ts: new Date().toISOString()
        };
        recursos_404.push(recurso);
        salvarMemoria({ recursos_404: recursos_404.slice(-10) });
      }
    }
  }, true); // capture phase

  // ═══════════════════════════════════════════════════════
  // 4. CORE WEB VITALS — LCP, CLS, FID/INP
  // ═══════════════════════════════════════════════════════
  const vitals = {};

  // LCP — Largest Contentful Paint (ideal < 2500ms)
  // Salva após 5s do load para capturar o valor final estabilizado
  if ('PerformanceObserver' in window) {
    try {
      let lcpValue = 0;
      const lcpObserver = new PerformanceObserver(function(list) {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        lcpValue = last.startTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      window.addEventListener('load', function() {
        setTimeout(function() {
          vitals.lcp = Math.round(lcpValue);
          vitals.lcp_status = lcpValue < 2500 ? 'BOM' : lcpValue < 4000 ? 'MELHORAR' : 'RUIM';
          vitals._timestamp = Date.now(); salvarMemoria({ vitals });
        }, 5000);
      });
    } catch(e) {}

    // CLS — Cumulative Layout Shift (ideal < 0.1)
    // Salva apenas após 5s do load para capturar o valor estabilizado
    try {
      let cls_total = 0;
      const clsObserver = new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          if (!entry.hadRecentInput) cls_total += entry.value;
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      // Salvar após 5 segundos (valor já estabilizado)
      window.addEventListener('load', function() {
        setTimeout(function() {
          vitals.cls = Math.round(cls_total * 1000) / 1000;
          vitals.cls_status = cls_total < 0.1 ? 'BOM' : cls_total < 0.25 ? 'MELHORAR' : 'RUIM';
          vitals._timestamp = Date.now(); salvarMemoria({ vitals });
        }, 5000);
      });
    } catch(e) {}

    // INP — Interaction to Next Paint (ideal < 200ms)
    try {
      new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          if (!vitals.inp || entry.duration > vitals.inp) {
            vitals.inp = Math.round(entry.duration);
            vitals.inp_status = entry.duration < 200 ? 'BOM' : entry.duration < 500 ? 'MELHORAR' : 'RUIM';
            vitals._timestamp = Date.now(); salvarMemoria({ vitals });
          }
        });
      }).observe({ type: 'event', durationThreshold: 16, buffered: true });
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════
  // 5. SERVICE WORKER — Registro automático (PWA offline)
  // ═══════════════════════════════════════════════════════
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function(reg) {
          salvarMemoria({ sw_status: 'ATIVO', sw_scope: reg.scope });
          // Verificar atualizações silenciosamente
          reg.addEventListener('updatefound', function() {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                salvarMemoria({ sw_update_disponivel: true });
              }
            });
          });
        })
        .catch(function(err) {
          salvarMemoria({ sw_status: 'ERRO', sw_erro: err.message });
        });
    });
  } else {
    salvarMemoria({ sw_status: 'NAO_SUPORTADO' });
  }

  // ═══════════════════════════════════════════════════════
  // 6. PERFORMANCE DE CARREGAMENTO
  // ═══════════════════════════════════════════════════════
  window.addEventListener('load', function() {
    setTimeout(function() {
      try {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
          const perf = {
            ttfb: Math.round(nav.responseStart - nav.requestStart),        // Time to First Byte
            dom_load: Math.round(nav.domContentLoadedEventEnd),            // DOM pronto
            page_load: Math.round(nav.loadEventEnd),                       // Página completa
            transferido_kb: Math.round(nav.transferSize / 1024)            // KB transferidos
          };
          perf.ttfb_status = perf.ttfb < 800 ? 'BOM' : perf.ttfb < 1800 ? 'MELHORAR' : 'RUIM';
          perf.load_status = perf.page_load < 3000 ? 'BOM' : perf.page_load < 6000 ? 'MELHORAR' : 'RUIM';
          salvarMemoria({ performance: perf });
        }
      } catch(e) {}
    }, 2000);
  });

  // ═══════════════════════════════════════════════════════
  // 7. CHECKLIST DE QUALIDADE — verificações automáticas
  // ═══════════════════════════════════════════════════════
  window.addEventListener('DOMContentLoaded', function() {
    const checklist = {};

    // Verificar viewport meta
    checklist.viewport = !!document.querySelector('meta[name="viewport"]');
    
    // Verificar favicon
    checklist.favicon = !!document.querySelector('link[rel*="icon"]');
    
    // Verificar manifest PWA
    checklist.manifest = !!document.querySelector('link[rel="manifest"]');
    
    // Verificar HTTPS
    checklist.https = location.protocol === 'https:';
    
    // Verificar Open Graph
    checklist.open_graph = !!document.querySelector('meta[property="og:title"]');
    
    // Verificar Schema.org
    checklist.schema = !!document.querySelector('script[type="application/ld+json"]');
    
    // Verificar canonical
    checklist.canonical = !!document.querySelector('link[rel="canonical"]');
    
    // Verificar description
    checklist.meta_description = !!document.querySelector('meta[name="description"]');
    
    // Verificar imagens com alt
    const imgs = document.querySelectorAll('img');
    const imgs_sem_alt = Array.from(imgs).filter(img => !img.alt).length;
    checklist.imagens_alt = imgs_sem_alt === 0;
    checklist.imagens_sem_alt_count = imgs_sem_alt;
    
    // Verificar botões com touch-action
    const botoes = document.querySelectorAll('button, .btn, [onclick]');
    checklist.total_botoes = botoes.length;
    
    // Score de qualidade (0-100)
    const itens = ['viewport','favicon','manifest','https','open_graph','schema','canonical','meta_description','imagens_alt'];
    const aprovados = itens.filter(k => checklist[k]).length;
    checklist.score = Math.round((aprovados / itens.length) * 100);
    
    salvarMemoria({ checklist, pagina: window.location.pathname });
  });

  // ═══════════════════════════════════════════════════════
  // 8. API PÚBLICA — window.ITAP_QUALITY
  // ═══════════════════════════════════════════════════════
  window.ITAP_QUALITY = {
    /** Retorna o relatório completo de qualidade da sessão atual */
    relatorio: function() {
      const mem = lerMemoria();
      return {
        pagina: window.location.pathname,
        checklist: mem.checklist || {},
        vitals: mem.vitals || {},
        performance: mem.performance || {},
        erros_js: mem.erros_js || [],
        recursos_404: mem.recursos_404 || [],
        sw_status: mem.sw_status || 'desconhecido',
        ultima_atualizacao: mem.ultima_atualizacao
      };
    },
    /** Exibe o relatório no console de forma legível */
    console: function() {
      const r = this.relatorio();
      console.group('🍦 ITAPOLITANA — Relatório de Qualidade');
      console.log('📄 Página:', r.pagina);
      console.log('✅ Checklist:', r.checklist);
      console.log('⚡ Core Web Vitals:', r.vitals);
      console.log('🚀 Performance:', r.performance);
      console.log('🔧 Service Worker:', r.sw_status);
      if (r.erros_js.length) console.warn('❌ Erros JS:', r.erros_js);
      if (r.recursos_404.length) console.warn('❌ Recursos 404:', r.recursos_404);
      console.groupEnd();
      return r;
    },
    /** Limpa a memória de qualidade */
    limpar: function() {
      localStorage.removeItem(QG_KEY);
      console.log('🗑️ Memória de qualidade limpa.');
    }
  };

})();
