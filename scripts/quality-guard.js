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
  const RECENT_PAGES_KEY = 'itap_recent_pages';
  const PWA_INSTALL_KEY = 'itap_pwa_install_prompt_until';
  const PWA_FIRST_SEEN_KEY = 'itap_pwa_first_seen_at';
  
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

  function salvarPaginaRecente() {
    try {
      const titulo = (document.title || '').trim().slice(0, 80) || 'Página';
      const item = {
        path: window.location.pathname || '/',
        title: titulo,
        ts: new Date().toISOString()
      };
      const atual = JSON.parse(localStorage.getItem(RECENT_PAGES_KEY) || '[]');
      const semDuplicado = atual.filter(function(p) { return p.path !== item.path; });
      semDuplicado.unshift(item);
      localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(semDuplicado.slice(0, 8)));
    } catch(e) {}
  }

  function instalarUiPwa() {
    let cssInjetado = false;
    let bannerPwa = null;
    let toastRede = null;
    let deferredPrompt = null;
    let monitorPromptAndroid = null;

    function promptAdiadoAtivo() {
      try {
        return Number(localStorage.getItem(PWA_INSTALL_KEY) || 0) > Date.now();
      } catch(e) { return false; }
    }

    function adiarPrompt(dias) {
      try {
        const expiryTimestamp = Date.now() + (dias * 24 * 60 * 60 * 1000);
        localStorage.setItem(PWA_INSTALL_KEY, String(expiryTimestamp));
      } catch(e) {}
    }

    function obterPrimeiraVisitaTs() {
      try {
        var atual = Number(localStorage.getItem(PWA_FIRST_SEEN_KEY) || 0);
        if (atual > 0) return atual;
        var agora = Date.now();
        localStorage.setItem(PWA_FIRST_SEEN_KEY, String(agora));
        return agora;
      } catch(e) {
        return Date.now();
      }
    }

    function contarPaginasRecentesUnicas() {
      try {
        var lista = JSON.parse(localStorage.getItem(RECENT_PAGES_KEY) || '[]');
        if (!Array.isArray(lista)) return 0;
        var unicas = {};
        lista.forEach(function(item) {
          if (item && item.path) unicas[item.path] = true;
        });
        return Object.keys(unicas).length;
      } catch(e) {
        return 0;
      }
    }

    function prontoParaPromptAndroid() {
      var paginas = contarPaginasRecentesUnicas();
      var primeiraVisita = obterPrimeiraVisitaTs();
      var tempoDecorrido = Date.now() - primeiraVisita;
      return paginas >= 2 && tempoDecorrido >= 30 * 1000;
    }

    function obterBotoesInstalacao() {
      return Array.prototype.slice.call(document.querySelectorAll('.js-pwa-install'));
    }

    function atualizarBotoesInstalacao(visivel) {
      const botoes = obterBotoesInstalacao();
      botoes.forEach(function(btn) {
        btn.hidden = !visivel;
        btn.disabled = !visivel;
        btn.classList.toggle('is-hidden', !visivel);
        btn.setAttribute('aria-hidden', visivel ? 'false' : 'true');
      });
      return botoes.length > 0;
    }

    function existemBotoesInstalacao() {
      return obterBotoesInstalacao().length > 0;
    }

    function ocultarPromptsPwa() {
      atualizarBotoesInstalacao(false);
      removerBanner();
    }

    function finalizarPromptInstalacao(resultado) {
      deferredPrompt = null;
      ocultarPromptsPwa();
      adiarPrompt(resultado === 'accepted' ? 30 : 7);
    }

    function dispararPromptInstalacao() {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      if (deferredPrompt.userChoice && typeof deferredPrompt.userChoice.then === 'function') {
        deferredPrompt.userChoice
          .then(function(choice) {
            finalizarPromptInstalacao(choice && choice.outcome);
          })
          .catch(function() {
            finalizarPromptInstalacao('dismissed');
          });
      } else {
        finalizarPromptInstalacao('dismissed');
      }
    }

    function tentarMostrarPromptAndroid() {
      if (!deferredPrompt) return false;
      if (standalone) return false;
      if (promptAdiadoAtivo()) return false;
      if (!prontoParaPromptAndroid()) return false;

      if (existemBotoesInstalacao()) {
        atualizarBotoesInstalacao(true);
        return true;
      }

      // Exibir o install prompt em momento de valor (após navegação + tempo),
      // seguindo padrão de engajamento de apps grandes: primeiro valor, depois convite.
      mostrarBanner({
        msg: 'Instale o app da Itapolitana na tela inicial para abrir como aplicativo.',
        primaryLabel: 'Instalar app',
        onPrimary: function() {
          dispararPromptInstalacao();
        }
      });
      return true;
    }

    function iniciarMonitorPromptAndroid() {
      if (monitorPromptAndroid) return;
      monitorPromptAndroid = setInterval(function() {
        if (tentarMostrarPromptAndroid()) {
          clearInterval(monitorPromptAndroid);
          monitorPromptAndroid = null;
        }
      }, 5000);
    }

    window.addEventListener('beforeunload', function() {
      if (monitorPromptAndroid) {
        clearInterval(monitorPromptAndroid);
        monitorPromptAndroid = null;
      }
    });

    function injetarCss() {
      if (cssInjetado) return;
      cssInjetado = true;
      const style = document.createElement('style');
      style.textContent = '.itap-pwa-banner{position:fixed;left:12px;right:12px;bottom:14px;z-index:9990;background:#fff;border:2px solid #EF0129;border-radius:14px;box-shadow:0 10px 28px rgba(0,0,0,.25);padding:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px}.itap-pwa-msg{min-width:0;font-size:.86rem;font-weight:800;color:#1A0A00;line-height:1.25}.itap-pwa-acoes{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;flex-shrink:0}.itap-pwa-btn{border:none;border-radius:999px;padding:8px 12px;font-size:.78rem;font-weight:900;cursor:pointer;min-height:44px}.itap-pwa-btn.primary{background:#EF0129;color:#fff}.itap-pwa-btn.ghost{background:#f1f1f1;color:#333}.itap-net-toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:9991;pointer-events:none;background:#1A0A00;color:#fff;padding:8px 12px;border-radius:999px;font-size:.78rem;font-weight:800;box-shadow:0 8px 16px rgba(0,0,0,.24);opacity:0;transition:opacity .2s ease}.itap-net-toast.show{opacity:1}@media (max-width:767px){.itap-pwa-banner{grid-template-columns:1fr}.itap-pwa-acoes{justify-content:stretch}.itap-pwa-btn{flex:1 1 0}}@media (min-width:768px){.itap-pwa-banner{max-width:560px;left:50%;right:auto;transform:translateX(-50%)}}';
      document.head.appendChild(style);
    }

    document.addEventListener('click', function(e) {
      const alvo = e.target && e.target.closest ? e.target.closest('.js-pwa-install') : null;
      if (!alvo || alvo.hidden || alvo.disabled) return;
      e.preventDefault();
      dispararPromptInstalacao();
    });

    function removerBanner() {
      if (bannerPwa && bannerPwa.parentNode) bannerPwa.parentNode.removeChild(bannerPwa);
      bannerPwa = null;
    }

    function mostrarBanner(opts) {
      if (promptAdiadoAtivo()) return;
      injetarCss();
      removerBanner();
      bannerPwa = document.createElement('div');
      bannerPwa.className = 'itap-pwa-banner';
      bannerPwa.innerHTML = '<div class="itap-pwa-msg"></div><div class="itap-pwa-acoes"></div>';
      const msg = bannerPwa.querySelector('.itap-pwa-msg');
      const acoes = bannerPwa.querySelector('.itap-pwa-acoes');
      if (msg) msg.textContent = opts.msg;

      const btnPrincipal = document.createElement('button');
      btnPrincipal.className = 'itap-pwa-btn primary';
      btnPrincipal.textContent = opts.primaryLabel || 'Instalar';
      btnPrincipal.addEventListener('click', opts.onPrimary);
      acoes.appendChild(btnPrincipal);

      const btnFechar = document.createElement('button');
      btnFechar.className = 'itap-pwa-btn ghost';
      btnFechar.textContent = 'Agora não';
      btnFechar.addEventListener('click', function() {
        adiarPrompt(7);
        ocultarPromptsPwa();
      });
      acoes.appendChild(btnFechar);

      document.body.appendChild(bannerPwa);
    }

    function mostrarToast(texto, cor) {
      injetarCss();
      if (!toastRede) {
        toastRede = document.createElement('div');
        toastRede.className = 'itap-net-toast';
        document.body.appendChild(toastRede);
      }
      toastRede.textContent = texto;
      toastRede.style.background = cor || '#1A0A00';
      toastRede.classList.add('show');
      setTimeout(function() { toastRede.classList.remove('show'); }, 2200);
    }

    window.addEventListener('offline', function() {
      document.documentElement.classList.add('itap-offline');
      mostrarToast('Você está offline. Alguns recursos podem ficar limitados.', '#C62828');
    });

    window.addEventListener('online', function() {
      document.documentElement.classList.remove('itap-offline');
      mostrarToast('Conexão restaurada!', '#2E7D32');
    });

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent || '');

    if (standalone) ocultarPromptsPwa();

    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      deferredPrompt = e;
      if (standalone) return;
      if (!tentarMostrarPromptAndroid()) iniciarMonitorPromptAndroid();
    });

    window.addEventListener('appinstalled', function() {
      finalizarPromptInstalacao('accepted');
    });

    if (isIos && !standalone && !promptAdiadoAtivo()) {
      setTimeout(function() {
        mostrarBanner({
          msg: 'No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início".',
          primaryLabel: 'Entendi',
          onPrimary: function() {
            adiarPrompt(30);
            removerBanner();
          }
        });
      }, 1600);
    }
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
  function deveIgnorarRecursoExterno(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.href);
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();
      const ehHostGtm = /(^|\.)googletagmanager\.com$/.test(host);
      const ehHostGa = /(^|\.)google-analytics\.com$/.test(host);
      const ehGtm = ehHostGtm && (path === '/gtm.js' || path === '/ns.html');
      const ehGa = ehHostGa;
      return ehGtm || ehGa;
    } catch (e) {
      return false;
    }
  }
  
  // Interceptar erros de carregamento de recursos
  window.addEventListener('error', function(e) {
    if (e.target && e.target !== window && e.target.tagName) {
      const tag = e.target.tagName.toLowerCase();
      const src = e.target.src || e.target.href || '';
      if (src && (tag === 'img' || tag === 'script' || tag === 'link')) {
        if (deveIgnorarRecursoExterno(src)) return;
        const recurso = {
          tipo: '404',
          tag: tag,
          url: src.replace(window.location.origin, '').slice(0, 500),
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
  window.addEventListener('load', function() {
    salvarPaginaRecente();
    instalarUiPwa();

    const checklist = {};

    // Verificar viewport meta
    checklist.viewport = !!document.querySelector('meta[name="viewport"]');
    
    // Verificar favicon
    checklist.favicon = !!document.querySelector('link[rel*="icon"]');
    
    // Verificar manifest PWA
    checklist.manifest = !!document.querySelector('link[rel="manifest"]');
    checklist.theme_color = !!document.querySelector('meta[name="theme-color"]');
    checklist.apple_touch_icon = !!document.querySelector('link[rel="apple-touch-icon"]');
    
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

    // Verificar lazy loading em imagens (a 1ª imagem pode usar eager — hero)
    const todasImgs = Array.from(imgs);
    const imgs_sem_lazy = todasImgs.slice(1).filter(function(img) {
      return img.loading !== 'lazy';
    }).length;
    checklist.lazy_loading = imgs_sem_lazy === 0;
    checklist.imagens_sem_lazy_count = imgs_sem_lazy;

    // Verificar presença de H1 na página
    checklist.h1_presente = !!document.querySelector('h1');

    // Verificar sem rolagem horizontal
    checklist.sem_rolagem_horizontal = document.documentElement.scrollWidth <= window.innerWidth + 2;

    // Verificar tamanho de botões (44px touch target — padrão WCAG 2.5.5)
    var botoes_pequenos = 0;
    document.querySelectorAll('button, a.btn, .btn').forEach(function(b) {
      try {
        var r = b.getBoundingClientRect();
        if (r.height > 0 && r.height < 44) botoes_pequenos++;
      } catch(e) {}
    });
    // true = todos os botões visíveis têm pelo menos 44px de altura (nenhum é pequeno demais)
    checklist.botoes_grande = botoes_pequenos === 0;
    checklist.botoes_pequenos_count = botoes_pequenos;
    
    // Score de qualidade (0-100)
    const itens = ['viewport','favicon','manifest','theme_color','apple_touch_icon','https','open_graph','schema','canonical','meta_description','imagens_alt','lazy_loading','h1_presente','sem_rolagem_horizontal','botoes_grande'];
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

/**
 * AUTO-HEALING & INTEGRITY GUARD — Sorveteria Itapolitana Cajuru
 * Monitora se os grids de produtos estão preenchidos. Se algum grid crítico
 * ficar vazio por falha de renderização ou rede, re-executa a renderização automaticamente.
 */
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    try {
      const gridsCriticos = ['sorvetes-grid', 'milk-grid', 'tacas-grid'];
      gridsCriticos.forEach(function(gridId) {
        const el = document.getElementById(gridId);
        if (el && el.children.length === 0) {
          console.warn('[Quality Guard] Auto-Healing acionado para grid vazio:', gridId);
          if (typeof renderTudo === 'function') {
            renderTudo();
          }
        }
      });
    } catch(e) {}
  }, 1200);
});
