/* 
 * ITA BOT WIDGET — Sorveteria Itapolitana
 * Assistente virtual interativo para todas as páginas do site.
 * Auto-injeta CSS, HTML e lógica do chat.
 */
(function () {
  'use strict';

  console.log('ItaBot Widget: Inicializando...');

  /* ─── Detecta raiz do site para construir paths ─── */
  var _base = (function () {
    var scripts = document.querySelectorAll('script[src*="ita-bot-widget"]');
    if (scripts.length) {
      return scripts[scripts.length - 1].src.replace(/scripts\/ita-bot-widget.*\.js.*$/, '');
    }
    return '';
  })();

  /* ─── Estado da conversa ─── */
  var _ctxData    = {};     // dados acumulados no contexto
  var _ctx        = null;   // estado de contexto conversacional
  var _prodData   = null;   // cache de dados/produtos.json
  var _promoData  = null;   // cache de dados/promo.json
  var _saudacao   = false;  // flag: saudação inicial já mostrada
  var _scrollY    = 0;      // para page-lock
  var _engine     = null;   // instância do motor compartilhado (ItaBotEngine)

  /* ─── Instanciar motor compartilhado (se disponível) ─── */
  function _getEngine() {
    if (_engine) return _engine;
    if (window.ItaBotEngine) {
      _engine = window.ItaBotEngine.createEngine();
      return _engine;
    }
    return null;
  }

  /* ─── Normaliza string ─── */
  function _norm(s) {
    var ACCENT_RE = /[\u0300-\u036f]/g;
    return String(s || '').toLowerCase().normalize('NFD').replace(ACCENT_RE, '').trim();
  }

  /* ─── Injeção de CSS ─── */
  function _itabotInjetarCss() {
    if (document.getElementById('itabot-css')) return;
    var style = document.createElement('style');
    style.id = 'itabot-css';
    style.textContent = [
      '#chat-dialog { display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%; z-index:2147483000 !important; background:#08080A !important; isolation:isolate; contain:paint; overflow:hidden; align-items:center; justify-content:center; }',
      '#chat-dialog.aberto { display:flex !important; }',
      '.chat-box { width:100%; max-width:460px; height:100%; max-height: 100dvh; background:#fff; border-radius:28px 28px 0 0; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 18px 50px rgba(0,0,0,0.32); position:absolute; bottom:0; left:0; right:0; margin:0 auto; padding-bottom:env(safe-area-inset-bottom,0px); }',
      '@media (min-width: 601px) {',
      '  #chat-dialog { align-items:center; justify-content:center; }',
      '  .chat-box { width:95%; height:90%; max-height:800px; border-radius:28px; position:relative; bottom:auto; left:auto; right:auto; margin:auto; padding-bottom:0; }',
      '}',
      '#chat-dialog.keyboard-open .chat-box {',
      '  height: calc(100dvh - var(--keyboard-height, 0px)) !important;',
      '  max-height: calc(100dvh - var(--keyboard-height, 0px)) !important;',
      '}',
      '/* Tela de dúvidas do launcher: usa a área visual real quando o teclado mobile abre. */',
      '@media (max-width:600px) { #chat-dialog.itabot-fullscreen-mode .chat-box { height:var(--itabot-vv-height, 100dvh); max-height:none; } #chat-dialog.itabot-fullscreen-mode.itabot-keyboard-open .chat-box { position:fixed; top:var(--itabot-vv-top, 0px); bottom:auto; height:var(--itabot-vv-height, 100dvh) !important; max-height:none !important; } }',
      '#chat-dialog.itabot-fullscreen-mode .itabot-fullscreen-scroll { flex:1 1 auto !important; min-height:0; overflow-y:auto !important; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; scroll-padding-bottom:24px; }',
      '#chat-dialog.itabot-fullscreen-mode .itabot-direct-message { scroll-margin-bottom:24px; }',
      '#chat-dialog.itabot-fullscreen-mode .itabot-direct-message input, #chat-dialog.itabot-fullscreen-mode .itabot-direct-message textarea { font-size:16px !important; line-height:1.35; }',
      '#chat-dialog.itabot-fullscreen-mode.itabot-keyboard-open .itabot-fullscreen-footer { display:none !important; }',
      '#chat-dialog.itabot-fullscreen-mode.itabot-keyboard-open .itabot-direct-message { margin-bottom:32px !important; }',
      '.chat-msgs { flex:1 1 auto; min-height:0; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:12px; background:#f9f9f9; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; }',
      '.chat-inp-row { flex:0 0 auto; position:relative; padding:12px; background:#fff; border-top:1px solid #eee; display:flex; gap:8px; align-items:center; padding-bottom:max(12px, env(safe-area-inset-bottom, 0px)); }',
      '.chat-inp { flex:1; border:1px solid #ddd; border-radius:24px; padding:10px 16px; font-size:16px !important; outline:none; }',
      '.chat-hdr { background:linear-gradient(135deg,#E8000D,#C62828); color:#fff; padding:16px 20px; flex-shrink:0; }',
      '.chat-hdr-logo-row { display:flex; align-items:center; justify-content:space-between; }',
      '.chat-hdr-brand { display:flex; align-items:center; gap:12px; }',
      '.chat-hdr-logo-img { width:44px; height:44px; border-radius:50%; border:2px solid #fff; }',
      '.chat-hdr-logo-text { font-size:18px; font-weight:900; letter-spacing:0.5px; }',
      '.chat-close { background:none; border:none; color:#fff; font-size:24px; cursor:pointer; padding:4px; line-height:1; }',
      '.chat-msgs { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:12px; background:#f9f9f9; }',
      '.msg { padding:12px 16px; border-radius:18px; font-size:14px; line-height:1.5; max-width:85%; word-wrap:break-word; }',
      '.msg.bot { background:#fff; color:#1A0A00; align-self:flex-start; border-bottom-left-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #eee; }',
      '.msg.user { background:#E8000D; color:#fff; align-self:flex-end; border-bottom-right-radius:4px; box-shadow:0 4px 12px rgba(232,0,13,0.2); }',
      '.chat-typing { padding:10px 20px; display:none; gap:4px; align-items:center; }',
      '.chat-typing.show { display:flex; }',
      '.chat-typing span { width:6px; height:6px; background:#ccc; border-radius:50%; animation:typing 1.4s infinite ease-in-out; }',
      '.chat-typing span:nth-child(2) { animation-delay:0.2s; }',
      '.chat-typing span:nth-child(3) { animation-delay:0.4s; }',
      '@keyframes typing { 0%,80%,100% { transform:scale(0.6); opacity:0.4; } 40% { transform:scale(1); opacity:1; } }',
      '.chat-inp-row { padding:12px; background:#fff; border-top:1px solid #eee; display:flex; gap:8px; align-items:center; }',
      '.chat-inp { flex:1; border:1px solid #ddd; border-radius:24px; padding:10px 16px; font-size:14px; outline:none; }',
      '.chat-inp:focus { border-color:#E8000D; }',
      '.chat-send { background:#E8000D; color:#fff; border:none; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform 0.2s; }',
      '.chat-send:active { transform:scale(0.9); }',
      '.chat-chips { display:flex; gap:8px; padding:0 20px 12px; overflow-x:auto; scrollbar-width:none; }',
      '.chat-chips::-webkit-scrollbar { display:none; }',
      '.chip { background:#fff; color:#E8000D; border:1.5px solid #FFEBEE; padding:8px 16px; border-radius:20px; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,0.05); }',
      '.chip:active { background:#FFEBEE; }',
      '.msg-links { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; width: 100%; }',
      '.msg-link-btn { display: flex; align-items: center; justify-content: center; padding: 12px 16px; background: #0D47A1; color: #fff !important; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none !important; transition: all 0.2s; border: none; text-align: center; box-shadow: 0 2px 8px rgba(13,71,161,0.2); }',
      '.msg-link-btn:active { transform: scale(0.98); background: #1565C0; }',
      '.msg-link-btn.secondary { background: #E65100; box-shadow: 0 2px 8px rgba(230,81,0,0.2); }',
      '.msg-link-btn.secondary:active { background: #EF6C00; }',
      '/* Launcher ItaBot 3D: transparente, flutuante e reposicionável */',
      '#itabot-launcher { position:fixed; right:calc(14px + env(safe-area-inset-right, 0px)); bottom:calc(16px + env(safe-area-inset-bottom, 0px)); z-index:2147482000; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; gap:4px; width:188px; height:300px; max-width:calc(100vw - 20px); padding:0; border:0; border-radius:0; color:#0af; background:transparent; box-shadow:none; cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:transform .2s ease, opacity .2s ease, filter .2s ease, left .22s ease, right .22s ease, top .22s ease, bottom .22s ease; }',
      '#itabot-launcher:hover { transform:translateY(-4px) scale(1.06); filter:drop-shadow(0 0 14px rgba(34,194,255,.65)); }',
      '#itabot-launcher:focus-visible { outline:2px solid #22c2ff; outline-offset:4px; border-radius:18px; }',
      '#itabot-launcher.itabot-launcher-icon-only { width:188px; height:300px; padding:0; justify-content:flex-start; gap:4px; }',
      '.itabot-launcher-robot { position:relative; flex:0 0 164px; width:156px; height:164px; display:block; overflow:hidden; filter:drop-shadow(0 8px 12px rgba(2,56,104,.42)); animation:itabot-ghost-float 4.8s ease-in-out infinite; isolation:isolate; }',
      '.itabot-launcher-image { position:absolute; inset:0 auto auto 0; display:block; width:100%; height:100%; max-width:none; object-fit:contain; object-position:top center; clip-path:none; user-select:none; -webkit-user-drag:none; pointer-events:none; }',

      '.itabot-launcher-dot { display:none; }',
      '.itabot-launcher-led-panel { position:relative; display:flex; flex:0 0 30px; align-items:center; width:50%; min-width:92px; min-height:30px; height:30px; margin-top:2px; padding:0 10px; box-sizing:border-box; border:1.5px solid #FF6B73; border-radius:4px; background:#E8000D; box-shadow:0 0 0 1px rgba(255,255,255,.96),0 0 8px rgba(232,0,13,.88),inset 0 0 4px rgba(70,0,0,.62); overflow:hidden; pointer-events:none; user-select:none; }',
      '.itabot-launcher-led-panel::after { content:""; position:absolute; inset:0; background:repeating-linear-gradient(180deg,rgba(0,0,0,.2) 0 1px,transparent 1px 3px); mix-blend-mode:multiply; pointer-events:none; }',
      '.itabot-launcher-led-track { position:relative; z-index:1; display:block; flex:0 0 auto; min-width:max-content; padding-left:100%; color:#FFFFFF; font:900 15px/26px Arial,sans-serif; letter-spacing:.035em; text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 0 3px #000; white-space:nowrap; animation:itabot-launcher-led-scroll 6.2s linear infinite; }',
      '@keyframes itabot-launcher-led-scroll { from { transform:translateX(0); } to { transform:translateX(-100%); } }',
      '@keyframes itabot-ghost-float { 0%,100% { transform:translate3d(0,0,0) rotate(-1deg); } 25% { transform:translate3d(1px,-4px,0) rotate(1deg); } 50% { transform:translate3d(0,-8px,0) rotate(0deg); } 75% { transform:translate3d(-1px,-4px,0) rotate(-1deg); } }',

      '@media (prefers-reduced-motion:reduce) { #itabot-launcher, .itabot-launcher-robot, .itabot-launcher-led-track, .sabor-novo-badge { -webkit-animation:none; animation:none; -webkit-transition:none; transition:none; } }',
      /* Celular pequeno: até 480px (iPhone SE, Android compacto) */
      '@media (max-width:480px) { #itabot-launcher, #itabot-launcher.itabot-launcher-icon-only { right:calc(8px + env(safe-area-inset-right, 0px)); bottom:calc(72px + env(safe-area-inset-bottom, 0px)); width:140px; height:180px; max-width:calc(100vw - 16px); } .itabot-launcher-robot { -webkit-flex-basis:120px; flex-basis:120px; width:116px; height:120px; } .itabot-launcher-led-panel { -webkit-flex:0 0 22px; flex:0 0 22px; width:85%; min-width:80px; min-height:22px; height:22px; margin-top:2px; padding:0 6px; box-sizing:border-box; } .itabot-launcher-led-track { font-size:10px; line-height:20px; } }',
      /* Celular grande / phablet: 481px – 767px (iPhone Plus, Android XL) */
      '@media (min-width:481px) and (max-width:767px) { #itabot-launcher, #itabot-launcher.itabot-launcher-icon-only { right:calc(10px + env(safe-area-inset-right, 0px)); bottom:calc(80px + env(safe-area-inset-bottom, 0px)); width:164px; height:220px; max-width:calc(100vw - 20px); } .itabot-launcher-robot { -webkit-flex-basis:148px; flex-basis:148px; width:140px; height:148px; } .itabot-launcher-led-panel { -webkit-flex:0 0 26px; flex:0 0 26px; width:80%; min-width:84px; min-height:26px; height:26px; margin-top:2px; padding:0 8px; box-sizing:border-box; } .itabot-launcher-led-track { font-size:12px; line-height:24px; } }',
      /* Tablet: 768px – 1024px (iPad, Android tablet) */
      '@media (min-width:768px) and (max-width:1024px) { #itabot-launcher, #itabot-launcher.itabot-launcher-icon-only { right:calc(16px + env(safe-area-inset-right, 0px)); bottom:calc(20px + env(safe-area-inset-bottom, 0px)); width:176px; height:280px; max-width:calc(100vw - 20px); } .itabot-launcher-robot { -webkit-flex-basis:156px; flex-basis:156px; width:150px; height:158px; } .itabot-launcher-led-panel { -webkit-flex:0 0 28px; flex:0 0 28px; width:75%; min-width:88px; min-height:28px; height:28px; margin-top:2px; padding:0 8px; box-sizing:border-box; } .itabot-launcher-led-track { font-size:14px; line-height:26px; } }',
      /* Desktop: 1025px+ (PC, Mac, Chrome, Firefox, Edge, Safari) */
      '@media (min-width:1025px) { #itabot-launcher { bottom:calc(24px + env(safe-area-inset-bottom, 0px)); right:calc(24px + env(safe-area-inset-right, 0px)); } }',
      'body.chat-open #itabot-launcher, body.modal-aberto #itabot-launcher, #chat-dialog.aberto ~ #itabot-launcher { display:none !important; }'
    ].join('');
    document.head.appendChild(style);
  }

  /* ─── Launcher flutuante inteligente ─── */
  function _itabotInjetarLauncher() {
    if (document.getElementById('itabot-launcher')) return;
    var launcher = document.createElement('button');
    launcher.id = 'itabot-launcher';
    launcher.type = 'button';
    launcher.setAttribute('data-role', 'duvidas');
      launcher.setAttribute('aria-label', 'Abrir o painel HTML de dúvidas do ItaBot');
    launcher.innerHTML = [
      '<span class="itabot-launcher-robot" aria-hidden="true">',
        '<img class="itabot-launcher-image" src="' + _base + 'images/itabot-3d-v2027.png?v=2027-resilience" onerror="this.style.display=\'none\'" alt="" draggable="false"/>',
      '</span>',
      '<span class="itabot-launcher-led-panel" aria-hidden="true"><span class="itabot-launcher-led-track">DÚVIDA — CLIQUE AQUI&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;</span></span>',
      '<span class="itabot-launcher-dot" aria-hidden="true"></span>'
    ].join('');
    document.body.appendChild(launcher);

    var lastLayout = '';
    var raf = 0;
    var mobile = function () { return window.matchMedia && window.matchMedia('(max-width: 600px)').matches; };
    var visible = function (el) {
      if (!el || el === launcher || el === document.body || el === document.documentElement) return false;
      var cs = window.getComputedStyle(el);
      var r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > .08 && r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
    };
    var blockedAt = function (x, y) {
      var el = document.elementFromPoint(x, y);
      if (!visible(el)) return false;
      if (el.closest && el.closest('#itabot-launcher')) return false;
      var node = el;
      var interactive = el.closest && el.closest('a,button,input,textarea,select,[role="button"],[data-itabot-obstacle="true"]');
      if (interactive && !interactive.closest('#itabot-launcher')) return true;
      var tag = String(el.tagName || '').toLowerCase();
      var semanticText = /^(h1|h2|h3|h4|h5|h6|p|li|label|figcaption|blockquote|summary)$/.test(tag);
      var identity = String((el.id || '') + ' ' + (el.className && typeof el.className === 'string' ? el.className : '')).toLowerCase();
      var importantLayer = /(cookie|consent|carrinho|cart|checkout|compr|encomend|footer|header|nav|banner)/.test(identity);
      if (semanticText || importantLayer) return true;
      while (node && node !== document.body && node !== document.documentElement) {
        var cs = window.getComputedStyle(node);
        var r = node.getBoundingClientRect();
        var positioned = cs.position === 'fixed' || cs.position === 'sticky';
        var overlaysViewport = positioned && r.width > 40 && r.height > 24 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
        if (overlaysViewport && cs.pointerEvents !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > .08) return true;
        node = node.parentElement;
      }
      return false;
    };
    var collisionScore = function (x, y, w, h) {
      var pad = 6;
      var cols = 4, rows = 3, hits = 0;
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var px = x + pad + ((w - pad * 2) * (col + .5) / cols);
          var py = y + pad + ((h - pad * 2) * (row + .5) / rows);
          if (blockedAt(px, py)) hits++;
        }
      }
      return hits;
    };
    var isFree = function (x, y, w, h) { return collisionScore(x, y, w, h) === 0; };
    var layout = function () {
      if (!document.body || document.body.classList.contains('chat-open') || document.body.classList.contains('modal-aberto')) return;
      var vw = window.innerWidth, vh = window.innerHeight;
      var narrow = mobile();
      launcher.style.visibility = 'hidden';
      launcher.style.pointerEvents = 'none';
      launcher.classList.remove('itabot-launcher-icon-only');
      // Tamanhos dobrados para corresponder ao CSS
      // mobile ≤480px: 140×180, phablet 481-767: 164×220, tablet 768-1024: 176×280, desktop: 188×300
      var fullW = vw <= 480 ? 140 : (vw <= 767 ? 164 : (vw <= 1024 ? 176 : 188));
      var fullH = vw <= 480 ? 180 : (vw <= 767 ? 220 : (vw <= 1024 ? 280 : 300));
      var iconW = fullW, iconH = fullH;
      var safeBottom = narrow ? 110 : (vw < 1025 ? 44 : 52);
      var margin = narrow ? 10 : 20;
      var overlayBottom = safeBottom;
      var fixedNodes = document.querySelectorAll('body *');
      for (var f = 0; f < fixedNodes.length; f++) {
        var fixedNode = fixedNodes[f];
        if (fixedNode === launcher || (fixedNode.closest && fixedNode.closest('#chat-dialog'))) continue;
        var fixedStyle = window.getComputedStyle(fixedNode);
        if (fixedStyle.position !== 'fixed' && fixedStyle.position !== 'sticky') continue;
        var fixedRect = fixedNode.getBoundingClientRect();
        if (fixedRect.width < 80 || fixedRect.height < 24 || fixedRect.bottom <= 0 || fixedRect.top >= vh) continue;
        if (fixedStyle.pointerEvents === 'none' || fixedStyle.visibility === 'hidden' || parseFloat(fixedStyle.opacity || '1') <= .08) continue;
        if (fixedRect.bottom >= vh - 2 && fixedRect.top > 0) overlayBottom = Math.max(overlayBottom, vh - fixedRect.top + 12);
      }
      var bottomY = Math.max(24, vh - fullH - overlayBottom - 16);
      var candidates = [
        [vw - fullW - margin, bottomY, 'br'],
        [margin, bottomY, 'bl'],
        [vw - fullW - margin, Math.max(12, vh * .22), 'tr'],
        [margin, Math.max(12, vh * .22), 'tl'],
        [vw - fullW - margin, Math.max(12, vh * .5 - fullH / 2), 'mr'],
        [margin, Math.max(12, vh * .5 - fullH / 2), 'ml']
      ];
      var chosen = null;
      var findFree = function (w, h, icon) {
        for (var k = 0; k < candidates.length; k++) {
          if (candidates[k][0] >= 0 && candidates[k][1] >= 0 && isFree(candidates[k][0], candidates[k][1], w, h)) return { x:candidates[k][0], y:candidates[k][1], mode:candidates[k][2], icon:icon };
        }
        // Grade mais densa: procura uma área livre entre cartões, textos e controles.
        var stepX = Math.max(24, Math.round(vw / 8)), stepY = Math.max(24, Math.round(vh / 8));
        for (var gy = 10; gy <= Math.max(10, vh - h - overlayBottom); gy += stepY) {
          for (var gx = margin; gx <= Math.max(margin, vw - w - margin); gx += stepX) {
            if (isFree(gx, gy, w, h)) return { x:gx, y:gy, mode:'grid', icon:icon };
          }
        }
        return null;
      };
      chosen = findFree(fullW, fullH, false);
      if (!chosen) {
        launcher.classList.add('itabot-launcher-icon-only');
        chosen = findFree(iconW, iconH, true);
      }
      if (!chosen) {
        // Último recurso: escolhe o ponto com menos colisões, mantendo o widget acessível.
        var best = { score: Infinity, x:Math.max(8, vw - iconW - margin), y:Math.max(8, bottomY), mode:'br-fallback' };
        var fallbackPoints = candidates.concat([[best.x, best.y, 'br-fallback']]);
        for (var b = 0; b < fallbackPoints.length; b++) {
          var score = collisionScore(fallbackPoints[b][0], fallbackPoints[b][1], iconW, iconH);
          if (score < best.score) best = { score:score, x:fallbackPoints[b][0], y:fallbackPoints[b][1], mode:fallbackPoints[b][2] };
        }
        launcher.classList.add('itabot-launcher-icon-only');
        chosen = { x:best.x, y:best.y, mode:best.mode, icon:true };
      }
      launcher.style.left = Math.round(chosen.x) + 'px';
      launcher.style.top = Math.round(chosen.y) + 'px';
      launcher.style.right = 'auto';
      launcher.style.bottom = 'auto';
      launcher.style.visibility = 'visible';
      launcher.style.pointerEvents = 'auto';
      launcher.setAttribute('aria-hidden', 'false');
      var next = chosen.mode + (chosen.icon ? '-icon' : '-full');
      if (next !== lastLayout) {
        launcher.dataset.position = chosen.mode;
        lastLayout = next;
      }
    };
    var schedule = function () { if (raf) return; raf = window.requestAnimationFrame(function () { raf = 0; layout(); }); };
    window.addEventListener('resize', schedule, { passive:true });
    window.addEventListener('orientationchange', function () { setTimeout(schedule, 80); }, { passive:true });
    window.addEventListener('scroll', schedule, { passive:true });
    window.addEventListener('focusin', schedule, { passive:true });
    window.addEventListener('focusout', function () { setTimeout(schedule, 80); }, { passive:true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', schedule, { passive:true });
      window.visualViewport.addEventListener('scroll', schedule, { passive:true });
    }
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(document.body);
    if (window.MutationObserver) new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style','hidden'] });
    // Verificação periódica para detectar overlays criados por scripts/canvas que não disparam mutações.
    window.setInterval(schedule, 900);
    setTimeout(layout, 60);

    launcher.addEventListener('click', function () {
      // Hook para promoções externas (ex: picolé): se retornar true, intercepta o clique
      if (typeof window._itabotClickInterceptor === 'function' && window._itabotClickInterceptor()) return;
      _itabotAbrirTelaCheia();
    });
  }

  function _itabotAbrirTelaCheia() {
    var dialog = document.getElementById('chat-dialog');

    // Se o diálogo existe mas NÃO é o de tela cheia (é o de chat bubble), removemos para recriar
    if (dialog && !dialog.classList.contains('itabot-fullscreen-mode')) {
      dialog.remove();
      dialog = null;
    }

    if (!dialog) {
      // Cria a estrutura de tela cheia se ainda não existir
      var wrap = document.createElement('div');
      wrap.id = 'chat-dialog';
      wrap.className = 'itabot-fullscreen-mode';
      wrap.innerHTML = [
        '<div class="chat-box itabot-fullscreen-box" role="dialog" aria-modal="true" aria-labelledby="fale-modal-titulo">',
          '<div class="chat-hdr">',
            '<div class="chat-hdr-logo-row">',
              '<div class="chat-hdr-brand">',
                '<img src="' + _base + 'images/logo.webp" alt="Itapolitana" class="chat-hdr-logo-img"/>',
                '<div>',
                  '<div class="chat-hdr-logo-text" id="fale-modal-titulo">ItaBot · Dúvidas</div>',
                  '<div class="itabot-status-line" id="fale-modal-sub"><span class="itabot-status-dot" aria-hidden="true"></span> ONLINE · IA ITAPOLITANA</div>',
                '</div>',
              '</div>',
              '<button class="chat-close" type="button" aria-label="Fechar" onclick="_itabotFecharTelaCheia()">✕</button>',
            '</div>',
          '</div>',
          '<div id="fale-tela-temas" class="itabot-fullscreen-scroll" style="overflow-y:auto;flex:1;padding:16px;background:#f9f9f9;">',
            '<p style="font-size:13px;color:#666;text-align:center;margin:0 0 16px;font-weight:700;">Toque em um tema para ver a resposta imediata</p>',
            '<div style="display:flex;flex-direction:column;gap:10px;max-width:600px;margin:0 auto;">',
              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\'promocao\')"><span style="font-size:18px;">🎉</span><span style="flex:1;text-align:left;font-weight:900;">Promoções e Sorteios</span><span style="font-size:18px;color:#888;">›</span></button>',
              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\'horario\')"><span style="font-size:18px;">⏰</span><span style="flex:1;text-align:left;font-weight:900;">Horário de Funcionamento</span><span style="font-size:18px;color:#888;">›</span></button>',
              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\'sabores\')"><span style="font-size:18px;">🍨</span><span style="flex:1;text-align:left;font-weight:900;">Sabores e Cardápio</span><span style="font-size:18px;color:#888;">›</span></button>',
              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\'encomendas\')"><span style="font-size:18px;">📦</span><span style="flex:1;text-align:left;font-weight:900;">Encomendas e Retirada na Loja</span><span style="font-size:18px;color:#888;">›</span></button>',
              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\'picoles\')"><span style="font-size:18px;">🍧</span><span style="flex:1;text-align:left;font-weight:900;">Picolés</span><span style="font-size:18px;color:#888;">›</span></button>',
              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\'localizacao\')"><span style="font-size:18px;">📍</span><span style="font-size:18px;flex:1;text-align:left;font-weight:900;">Como Chegar</span><span style="font-size:18px;color:#888;">›</span></button>',
              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\'avaliacoes\')"><span style="font-size:18px;">⭐</span><span style="flex:1;text-align:left;font-weight:900;">Dicas e Avaliações</span><span style="font-size:18px;color:#888;">›</span></button>',
              '<button type="button" class="fale-tema-btn" onclick="_itabotMostrarTema(\'precos\')"><span style="font-size:18px;">💰</span><span style="flex:1;text-align:left;font-weight:900;">Preços</span><span style="font-size:18px;color:#888;">›</span></button>',
            '</div>',
            '<div class="itabot-direct-message" style="margin:24px auto;max-width:600px;background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,.06);">',
              '<div style="font-size:14px;font-weight:900;color:#07579c;margin-bottom:8px;">💬 Enviar mensagem direta via WhatsApp</div>',
              '<input type="text" id="itabot-nome" placeholder="Seu nome" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:10px;margin-bottom:8px;font-size:14px;outline:none;" />',
              '<textarea id="itabot-msg" placeholder="Escreva sua dúvida ou pedido..." style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:10px;margin-bottom:10px;font-size:14px;min-height:80px;outline:none;resize:vertical;"></textarea>',
              '<button type="button" onclick="_itabotEnviarWhatsApp()" style="width:100%;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:900;cursor:pointer;box-shadow:0 4px 12px rgba(37,211,102,.3);">Enviar via WhatsApp</button>',
            '</div>',
          '</div>',
          '<div id="fale-tela-resposta" class="itabot-fullscreen-scroll" style="display:none;overflow-y:auto;flex:1;padding:20px;background:#f9f9f9;">',
            '<button type="button" onclick="_itabotVoltarTemas()" style="background:none;border:none;color:#07579c;font-size:14px;font-weight:900;cursor:pointer;margin-bottom:16px;display:flex;align-items:center;gap:6px;">‹ Voltar para os temas</button>',
            '<div id="fale-resposta-conteudo" style="max-width:600px;margin:0 auto;background:#fff;padding:20px;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.06);"></div>',
          '</div>',
          '<div class="itabot-fullscreen-footer" style="padding:12px;background:#fff;border-top:1px solid #eee;display:flex;justify-content:center;">',
            '<button type="button" onclick="_itabotFecharTelaCheia()" style="background:#E8000D;color:#fff;border:none;border-radius:24px;padding:12px 32px;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(232,0,13,.3);">Fechar e Voltar ao Site</button>',
          '</div>',
        '</div>'
      ].join('');
      document.body.appendChild(wrap);
      _itabotVincularTeclado(wrap);
      
      // Inserir estilos dos botões de tema
      if (!document.getElementById('itabot-temas-css')) {
        var st = document.createElement('style');
        st.id = 'itabot-temas-css';
        st.textContent = [
          '#chat-dialog.itabot-fullscreen-mode { background:linear-gradient(135deg,rgba(3,22,45,.78),rgba(4,82,120,.72)) !important; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); }',
          '#chat-dialog.itabot-fullscreen-mode .itabot-fullscreen-box { background:linear-gradient(180deg,#f7fcff 0%,#eef8ff 100%); border:1px solid rgba(255,255,255,.72); box-shadow:0 28px 80px rgba(0,22,54,.42),0 0 0 1px rgba(34,194,255,.18); }',
          '#chat-dialog.itabot-fullscreen-mode .chat-hdr { background:linear-gradient(135deg,#062c63 0%,#0b72b8 58%,#16b9d4 100%); padding:18px 20px; position:relative; overflow:hidden; }',
          '#chat-dialog.itabot-fullscreen-mode .chat-hdr::after { content:""; position:absolute; width:220px; height:220px; right:-100px; top:-150px; border-radius:50%; background:rgba(255,255,255,.16); pointer-events:none; }',
          '#chat-dialog.itabot-fullscreen-mode .chat-hdr-brand, #chat-dialog.itabot-fullscreen-mode .chat-hdr-logo-row { position:relative; z-index:1; }',
          '#chat-dialog.itabot-fullscreen-mode .chat-hdr-logo-img { width:48px; height:48px; box-shadow:0 0 0 3px rgba(255,255,255,.2),0 0 22px rgba(101,232,255,.55); }',
          '#chat-dialog.itabot-fullscreen-mode .chat-hdr-logo-text { font-size:19px; letter-spacing:.2px; }',
          '.itabot-status-line { display:flex; align-items:center; gap:6px; margin-top:3px; color:rgba(255,255,255,.86); font-size:10px; font-weight:900; letter-spacing:1px; }',
          '.itabot-status-dot { width:7px; height:7px; border-radius:50%; background:#59ffb3; box-shadow:0 0 0 4px rgba(89,255,179,.16),0 0 12px rgba(89,255,179,.85); animation:itabot-status-pulse 1.8s ease-in-out infinite; }',
          '@keyframes itabot-status-pulse { 0%,100%{opacity:.68;transform:scale(.9)} 50%{opacity:1;transform:scale(1.12)} }',
          '#chat-dialog.itabot-fullscreen-mode .itabot-fullscreen-scroll { padding:18px !important; background:linear-gradient(180deg,#f5fbff,#edf7ff) !important; }',
          '#chat-dialog.itabot-fullscreen-mode .itabot-fullscreen-scroll > p { color:#416075 !important; font-size:13px !important; letter-spacing:.1px; }',
          '#chat-dialog.itabot-fullscreen-mode .fale-tema-btn { display:flex; align-items:center; gap:13px; background:rgba(255,255,255,.9); border:1px solid rgba(13,71,161,.12); border-radius:18px; padding:16px 17px; width:100%; min-height:58px; cursor:pointer; font-size:15px; color:#102a43; transition:transform .16s cubic-bezier(.23,1,.32,1),background .16s,border-color .16s,box-shadow .16s; box-shadow:0 7px 18px rgba(10,58,95,.07); }',
          '#chat-dialog.itabot-fullscreen-mode .fale-tema-btn:hover { background:#fff; border-color:#22c2ff; transform:translateY(-2px); box-shadow:0 12px 26px rgba(10,91,145,.14),0 0 0 3px rgba(34,194,255,.08); }',
          '#chat-dialog.itabot-fullscreen-mode .fale-tema-btn:active { transform:scale(.98); }',
          '#chat-dialog.itabot-fullscreen-mode .fale-tema-btn:focus-visible { outline:3px solid #fbd100; outline-offset:3px; }',
          '#chat-dialog.itabot-fullscreen-mode .itabot-direct-message { background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(232,248,255,.92)) !important; border:1px solid rgba(34,194,255,.16); box-shadow:0 12px 28px rgba(10,58,95,.1) !important; }',
          '#chat-dialog.itabot-fullscreen-mode .itabot-direct-message input, #chat-dialog.itabot-fullscreen-mode .itabot-direct-message textarea { border:1px solid #b8d9ea !important; background:#fff !important; min-height:46px; }',
          '#chat-dialog.itabot-fullscreen-mode .itabot-direct-message textarea { min-height:92px; }',
          '#chat-dialog.itabot-fullscreen-mode .chat-close { min-width:44px; min-height:44px; border-radius:14px; position:relative; z-index:2; background:rgba(255,255,255,.14); transition:background .16s,transform .16s; }',
          '#chat-dialog.itabot-fullscreen-mode .chat-close:hover { background:rgba(255,255,255,.28); transform:rotate(4deg) scale(1.04); }',
          '#chat-dialog.itabot-fullscreen-mode .itabot-fullscreen-footer { background:rgba(255,255,255,.88) !important; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); padding-bottom:max(12px,env(safe-area-inset-bottom,0px)) !important; }',
          '#chat-dialog.itabot-fullscreen-mode .itabot-fullscreen-footer button { min-height:48px; padding-inline:26px !important; }',
          '#itabot-launcher::before { content:""; position:absolute; inset:11px 6px 27px; border-radius:30px; background:radial-gradient(circle,rgba(34,194,255,.22),transparent 68%); filter:blur(6px); opacity:.9; pointer-events:none; z-index:-1; }',
          '#itabot-launcher:active { transform:scale(.96); }',
          '@media (max-width:600px) { #chat-dialog.itabot-fullscreen-mode .fale-tema-btn { min-height:62px; padding:16px 15px; font-size:15px; } #chat-dialog.itabot-fullscreen-mode .chat-hdr { padding-top:max(18px,env(safe-area-inset-top,0px)); } #chat-dialog.itabot-fullscreen-mode .itabot-fullscreen-scroll { padding:16px 14px !important; } }',
          '@media (prefers-reduced-motion:reduce) { .itabot-status-dot { animation:none; } #chat-dialog.itabot-fullscreen-mode .fale-tema-btn, #itabot-launcher, #itabot-launcher::before { transition:none; } }'
        ].join('');
        document.head.appendChild(st);
      }
      dialog = wrap;
    }
    document.body.classList.add('chat-open', 'modal-aberto');
    dialog.classList.add('aberto');

    // Resetar para a tela de temas ao abrir
    document.getElementById('fale-tela-temas').style.display = 'block';
    document.getElementById('fale-tela-resposta').style.display = 'none';
  }

  window._itabotFecharTelaCheia = function () {
    var dialog = document.getElementById('chat-dialog');
    if (dialog) dialog.classList.remove('aberto');
  document.body.classList.remove('chat-open', 'modal-aberto');
  window.location.href = 'index.html';
  };

  var _itabotConteudoTemas = {
    promocao: {
      titulo: '🎉 Promoções e Sorteios',
      textos: [
        '⚠️ As inscrições para o sorteio da caixa de sorvete foram encerradas. A campanha anterior teve mais de 1.400 inscritos.',
        '🍰 Inscrições já estão abertas para o sorteio mensal de uma torta de sorvete. O sorteio começa em janeiro de 2027.',
        '📝 Cadastre-se exclusivamente pelo site oficial da Itapolitana Cajuru: itapolitanacajuru.com.br, na aba Promoção.'
      ],
      linkTexto: 'Ver Página de Promoção',
      linkUrl: 'promocao.html'
    },
    horario: {
      titulo: '⏰ Horário de Funcionamento',
      textos: [
        '✅ Segunda a Domingo das 10:00 às 22:00.',
        '✅ Atendimento direto na sorveteria em Cajuru - SP.'
      ],
      linkTexto: 'Ver Localização',
      linkUrl: 'sobre.html'
    },
    sabores: {
      titulo: '🍨 Sabores e Cardápio',
      textos: [
        '✅ Mais de 38 sabores artesanais exclusivos de massas.',
        '✅ Opções de milkshakes, caixas para viagem (5L e 10L) e complementos para açaí.'
      ],
      linkTexto: 'Ver Cardápio na Início',
      linkUrl: 'index.html'
    },
    encomendas: {
      titulo: '📦 Encomendas e Retirada',
      textos: [
        '✅ Pedidos de caixas de sorvete e picolés em atacado (mín. 100 un.).',
        '✅ Retirada exclusiva na loja física com antecedência de até 5 dias úteis.',
        '✅ Não realizamos entregas (delivery).'
      ],
      linkTexto: 'Fazer Encomenda',
      linkUrl: 'encomendas.html'
    },
    picoles: {
      titulo: '🍧 Picolés',
      textos: [
        '✅ Linha completa de picolés tradicionais, recheados, cremosos e de fruta.',
        '✅ Vendas individuais na loja ou em lotes para atacado e eventos.'
      ],
      linkTexto: 'Ver Encomendas',
      linkUrl: 'encomendas.html'
    },
    localizacao: {
      titulo: '📍 Como Chegar',
      textos: [
        '✅ Sorveteria Itapolitana Cajuru - SP.',
        '✅ Local de fácil acesso com estacionamento e ambiente acolhedor.'
      ],
      linkTexto: 'Ver Sobre Nós',
      linkUrl: 'sobre.html'
    },
    avaliacoes: {
      titulo: '⭐ Dicas e Avaliações',
      textos: [
        '✅ Venha conhecer o melhor sorvete da região com nota máxima de satisfação.',
        '✅ Deixe seu feedback e nos ajude a melhorar sempre.'
      ],
      linkTexto: 'Ver Dicas',
      linkUrl: 'dicas.html'
    },
    precos: {
      titulo: '💰 Preços',
      textos: [
        '✅ Preços justos para consumo na hora, caixas e atacado de picolés.',
        '✅ Consulte o cardápio interativo na página inicial para valores atualizados.'
      ],
      linkTexto: 'Ver Início',
      linkUrl: 'index.html'
    }
  };

  window._itabotMostrarTema = function (temaKey) {
    var dados = _itabotConteudoTemas[temaKey];
    if (!dados) return;
    var html = '<div style="font-size:18px;font-weight:900;color:#07579c;margin-bottom:12px;">' + dados.titulo + '</div>';
    dados.textos.forEach(function (t) {
      html += '<p style="font-size:14px;color:#333;margin:0 0 10px;line-height:1.5;">' + t + '</p>';
    });
    html += '<a href="' + dados.linkUrl + '" onclick="_itabotFecharTelaCheia()" style="display:block;text-align:center;background:linear-gradient(135deg,#07579c,#033663);color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:900;text-decoration:none;margin-top:16px;box-shadow:0 4px 12px rgba(7,87,156,.25);">' + dados.linkTexto + '</a>';
    document.getElementById('fale-resposta-conteudo').innerHTML = html;
    document.getElementById('fale-tela-temas').style.display = 'none';
    document.getElementById('fale-tela-resposta').style.display = 'block';
  };

  window._itabotVoltarTemas = function () {
    document.getElementById('fale-tela-resposta').style.display = 'none';
    document.getElementById('fale-tela-temas').style.display = 'block';
  };

  window._itabotEnviarWhatsApp = function () {
    var nome = document.getElementById('itabot-nome').value.trim();
    var msg = document.getElementById('itabot-msg').value.trim();
    var texto = 'Olá, meu nome é ' + (nome || 'Cliente') + '. ' + (msg || 'Gostaria de tirar uma dúvida sobre a Itapolitana.');
    window.open('https://wa.me/5516996062046?text=' + encodeURIComponent(texto), '_blank');
  };

  /* ─── Teclado mobile: mantém qualquer campo ativo acima do Gboard ─── */
  function _itabotVincularTeclado(dialog) {
    if (!dialog || dialog.__itabotKeyboardBound) return;
    dialog.__itabotKeyboardBound = true;

    var viewport = window.visualViewport;
    if (!viewport) return;

    var raf = 0;
    var mobileViewport = function () {
      return window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
    };
    var isTextField = function (el) {
      return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };
    var keyboardIsOpen = function () {
      var layoutHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
      return mobileViewport() && viewport.height < layoutHeight - 80;
    };
    var scrollFieldIntoView = function () {
      var active = document.activeElement;
      if (!isTextField(active) || !dialog.contains(active)) return;
      var scrollArea = active.closest('.itabot-fullscreen-scroll, .chat-msgs');
      var visibleTop = viewport.offsetTop || 0;
      var visibleBottom = visibleTop + viewport.height;
      var rect = active.getBoundingClientRect();
      var margin = 20;
      if (rect.bottom > visibleBottom - margin && scrollArea) {
        scrollArea.scrollTop += rect.bottom - (visibleBottom - margin);
      } else if (rect.top < visibleTop + margin && scrollArea) {
        scrollArea.scrollTop -= (visibleTop + margin) - rect.top;
      }
      try {
        active.scrollIntoView({ block:'nearest', inline:'nearest' });
      } catch (err) {
        active.scrollIntoView(false);
      }
    };
    var update = function () {
      raf = 0;
      var layoutHeight = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
      var visibleHeight = Math.max(1, Math.round(viewport.height));
      var visibleTop = Math.max(0, Math.round(viewport.offsetTop || 0));
      var keyboardOpen = keyboardIsOpen();
      var chatBox = dialog.querySelector('.chat-box');
      if (chatBox && mobileViewport()) {
        chatBox.style.height = visibleHeight + 'px';
        chatBox.style.top = visibleTop + 'px';
        chatBox.style.bottom = 'auto';
      } else if (chatBox) {
        chatBox.style.height = '';
        chatBox.style.top = '';
        chatBox.style.bottom = '';
      }
      dialog.style.setProperty('--itabot-vv-height', visibleHeight + 'px');
      dialog.style.setProperty('--itabot-vv-top', visibleTop + 'px');
      dialog.style.setProperty('--keyboard-height', Math.max(0, layoutHeight - visibleHeight) + 'px');
      dialog.classList.toggle('keyboard-open', keyboardOpen);
      dialog.classList.toggle('itabot-keyboard-open', keyboardOpen && dialog.classList.contains('itabot-fullscreen-mode'));
      if (keyboardOpen) {
        requestAnimationFrame(scrollFieldIntoView);
      }
    };
    var schedule = function () {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    viewport.addEventListener('resize', schedule, { passive:true });
    viewport.addEventListener('scroll', schedule, { passive:true });
    window.addEventListener('resize', schedule, { passive:true });
    dialog.addEventListener('focusin', function (event) {
      if (!isTextField(event.target)) return;
      setTimeout(schedule, 60);
      setTimeout(scrollFieldIntoView, 320);
    });
    dialog.addEventListener('focusout', function () {
      setTimeout(schedule, 120);
    });
    schedule();
  }

  /* ─── Injeção de HTML ─── */
  function _itabotInjetarHtml() {
    if (document.getElementById('chat-dialog')) {
      console.log('ItaBot: Chat dialog já existe no DOM.');
      return;
    }
    var div = document.createElement('div');
    div.id = 'chat-dialog';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.innerHTML = [
      '<div class="chat-box">',
        '<div class="chat-hdr">',
          '<div class="chat-hdr-logo-row">',
            '<div class="chat-hdr-brand">',
              '<img src="' + _base + 'images/logo.webp" alt="Logo" class="chat-hdr-logo-img">',
              '<div>',
                '<div class="chat-hdr-logo-text">Ita Bot</div>',
                '<div style="font-size:10px; opacity:0.8;">Assistente Virtual</div>',
              '</div>',
            '</div>',
            '<button class="chat-close" id="itabot-close-btn" aria-label="Fechar">&times;</button>',
          '</div>',
        '</div>',
        '<div class="chat-msgs" id="itabot-msgs"></div>',
        '<div class="chat-typing" id="itabot-typing"><span></span><span></span><span></span></div>',
        '<div class="chat-chips" id="itabot-chips"></div>',
        '<div class="chat-inp-row">',
          '<input type="text" class="chat-inp" id="itabot-input" placeholder="Digite sua dúvida...">',
          '<button class="chat-send" id="itabot-send-btn">➤</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(div);

    document.getElementById('itabot-close-btn').onclick = _itabotFecharItaBot;
    document.getElementById('itabot-send-btn').onclick = _itabotEnviarMensagem;
    document.getElementById('itabot-input').onkeydown = function (e) {
      if (e.key === 'Enter') _itabotEnviarMensagem();
    };
    div.onclick = function (e) {
      if (e.target === div) _itabotFecharItaBot();
    };

    _itabotVincularTeclado(div);
  }

  /* ─── Lógica de abertura/fechamento ─── */
  function _itabotAbrirItaBot() {
    var d = document.getElementById('chat-dialog');
    if (!d) {
      _itabotInjetarCss();
      _itabotInjetarHtml();
      d = document.getElementById('chat-dialog');
    }
    d.classList.add('aberto');
    // O Ita Bot é uma tela inteira: fecha visualmente todo o conteúdo anterior.
    document.documentElement.classList.add('chat-open');
    document.body.classList.add('chat-open','modal-aberto');
    _scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _scrollY + 'px';
    document.body.style.width = '100%';

    if (!_saudacao) {
      _saudacao = true;
      _itabotSaudacaoInicial();
    }
    
    setTimeout(function() {
      var inp = document.getElementById('itabot-input');
      if (inp) inp.focus();
    }, 300);
  }

  function _itabotFecharItaBot() {
    var d = document.getElementById('chat-dialog');
    if (d) d.classList.remove('aberto');
    document.documentElement.classList.remove('chat-open');
    document.body.classList.remove('chat-open','modal-aberto');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, _scrollY);
  }

  /* ─── Lógica de Mensagens ─── */
  function _itabotInserirMensagem(tipo, conteudo) {
    var container = document.getElementById('itabot-msgs');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'msg ' + tipo;
    
    var html = '';
    if (typeof conteudo === 'string') {
      html = conteudo;
    } else if (conteudo.answer) {
      html = conteudo.answer;
      
      // Renderizar botões de link se existirem
      if (conteudo.linkText && conteudo.linkHref) {
        html += '<div class="msg-links">';
        html += '<a href="' + conteudo.linkHref + '" ' + (conteudo.external ? 'target="_blank" rel="noopener"' : '') + ' class="msg-link-btn">' + conteudo.linkText + '</a>';
        if (conteudo.linkText2 && conteudo.linkHref2) {
          html += '<a href="' + conteudo.linkHref2 + '" ' + (conteudo.external2 ? 'target="_blank" rel="noopener"' : '') + ' class="msg-link-btn secondary">' + conteudo.linkText2 + '</a>';
        }
        html += '</div>';
      }

      if (conteudo.chips) {
        _itabotRenderizarChips(conteudo.chips);
      }
    }
    
    div.innerHTML = html;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function _itabotRenderizarChips(chips) {
    var container = document.getElementById('itabot-chips');
    if (!container) return;
    container.innerHTML = '';
    if (!chips || !chips.length) return;
    
    chips.forEach(function (texto) {
      var btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = texto;
      btn.onclick = function () {
        _itabotEnviarTexto(texto);
      };
      container.appendChild(btn);
    });
  }

  function _itabotOcultarTyping() {
    var t = document.getElementById('itabot-typing');
    if (t) t.classList.remove('show');
  }

  function _itabotMostrarTyping() {
    var t = document.getElementById('itabot-typing');
    if (t) t.classList.add('show');
    var container = document.getElementById('itabot-msgs');
    if (container) container.scrollTop = container.scrollHeight;
  }

  function _itabotSaudacaoInicial() {
    _itabotMostrarTyping();
    setTimeout(function () {
      _itabotOcultarTyping();
      _itabotInserirMensagem('bot', {
        answer: 'Olá! 👋 Sou o <strong>Ita Bot</strong>, assistente da Sorveteria Itapolitana!<br><br>Como posso te ajudar hoje?',
        chips: ['🍦 Cardápio', '📦 Encomendas', '🎁 Promoções', '📍 Localização']
      });
    }, 800);
  }

  function _itabotEnviarMensagem() {
    var inp = document.getElementById('itabot-input');
    var texto = inp.value.trim();
    if (!texto) return;
    inp.value = '';
    _itabotEnviarTexto(texto);
  }

  function _itabotEnviarTexto(texto) {
    _itabotInserirMensagem('user', texto);
    _itabotRenderizarChips([]); // Limpa chips ao enviar
    _itabotMostrarTyping();
    
    setTimeout(function () {
      var resp = _itabotGetResp(texto);
      
      if (resp && resp.__async && typeof resp.__asyncFn === 'function') {
        resp.__asyncFn(function(finalResp) {
          _itabotOcultarTyping();
          _itabotInserirMensagem('bot', finalResp);
        });
      } else {
        _itabotOcultarTyping();
        _itabotInserirMensagem('bot', resp);
      }
    }, 600 + Math.random() * 600);
  }

  function _itabotGetResp(texto) {
    var eng = _getEngine();
    if (eng) {
      var r = eng.getResponse(texto);
      // Garantir formato de objeto
      if (typeof r === 'string') return { answer: r };
      return r;
    }
    
    // Fallback simples se o motor falhar
    var l = _norm(texto);
    if (l.indexOf('cardapio') !== -1 || l.indexOf('sabor') !== -1) {
      return { answer: 'Você pode conferir nosso cardápio completo clicando no botão abaixo:', chips: ['🍦 Ver Cardápio'] };
    }
    if (l.indexOf('promo') !== -1 || l.indexOf('sorteio') !== -1) {
      return { answer: 'Temos sorteios mensais! Confira as promoções ativas:', chips: ['🎁 Ver Promoções'] };
    }
    return { 
      answer: 'Não entendi muito bem, mas você pode falar com um atendente no WhatsApp ou escolher uma opção abaixo:', 
      chips: ['🍦 Cardápio', '📍 Localização', '💬 WhatsApp'] 
    };
  }

  /* ─── Binding de Triggers ─── */
  function _itabotBindTriggers() {
    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-role="duvidas"], .ita-bot-duvidas-btn, #ita-bot-duvidas, [data-itabot-open="true"]');
      if (!trigger) return;
      event.preventDefault();
      _itabotAbrirTelaCheia();
    });
  }

  /* ─── Carregamento de Conhecimento ─── */
  function _itabotCarregarConhecimento() {
    var eng = _getEngine();
    if (!eng) return;

    // 1. Carregar dados de produtos e promo do window se já existirem (via site-loader)
    if (window.SITE_CONFIG) {
      eng.loadData(window.PRODUTOS_DATA || null, window.SITE_CONFIG.promo || null);
    }

    // 2. Carregar FAQs estruturados
    var faqs = [
      'dados/faq_horarios_localizacao.json',
      'dados/faq_encomendas.json',
      'dados/faq_sorteio_promocoes.json'
    ];

    faqs.forEach(function(url) {
      fetch(_base + url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.perguntas) {
            data.perguntas.forEach(function(p) {
              p.tags.forEach(function(tag) {
                eng.mergeRespostas(tag, p.resposta);
              });
            });
          }
        })
        .catch(function(err) { console.warn('ItaBot: Erro ao carregar FAQ ' + url, err); });
    });
  }

  /* ─── Inicialização ─── */
  _itabotInjetarCss();
  _itabotInjetarLauncher();
  _itabotBindTriggers();
  _itabotCarregarConhecimento();

  // Escutar evento do site-loader para atualizar dados se carregarem depois
  window.addEventListener('siteConfigLoaded', function(e) {
    var eng = _getEngine();
    if (eng && e.detail) {
      eng.loadData(window.PRODUTOS_DATA || null, e.detail.promo || null);
    }
  });

  // Escutar evento do products.js para atualizar preços se carregarem depois
  window.addEventListener('produtosNuvemCarregados', function(e) {
    var eng = _getEngine();
    if (eng && e.detail) {
      eng.loadData(e.detail, (window.SITE_CONFIG ? window.SITE_CONFIG.promo : null));
    }
  });

    // Exportar globalmente para fallback
  window.abrirItaBot = _itabotAbrirItaBot;
  window.abrirChat = _itabotAbrirItaBot;
  window._itabotAbrirTelaCheia = _itabotAbrirTelaCheia;

})();
