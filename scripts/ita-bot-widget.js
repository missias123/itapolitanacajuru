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
      return scripts[scripts.length - 1].src.replace(/scripts\/ita-bot-widget\.js.*$/, '');
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
      '/* Launcher inteligente do itaBot: compacto, acessível e reposicionável */',
      '#itabot-launcher { position:fixed; right:calc(14px + env(safe-area-inset-right, 0px)); bottom:calc(16px + env(safe-area-inset-bottom, 0px)); z-index:2147482000; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; gap:2px; width:94px; height:116px; max-width:calc(100vw - 20px); padding:0; border:0; border-radius:0; color:#0af; background:transparent; box-shadow:none; cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:transform .2s ease, opacity .2s ease, filter .2s ease, left .22s ease, right .22s ease, top .22s ease, bottom .22s ease; }',
      '#itabot-launcher:hover { transform:translateY(-4px) scale(1.06); filter:drop-shadow(0 0 14px rgba(34,194,255,.65)); }',
      '#itabot-launcher:focus-visible { outline:2px solid #22c2ff; outline-offset:4px; border-radius:18px; }',
      '#itabot-launcher.itabot-launcher-icon-only { width:94px; height:116px; padding:0; justify-content:flex-start; gap:2px; }',
      '.itabot-launcher-robot { position:relative; flex:0 0 80px; width:72px; height:80px; display:block; filter:drop-shadow(0 6px 8px rgba(2,56,104,.35)); animation:itabot-float 3.2s ease-in-out infinite; }',
      '.itabot-launcher-robot svg { display:block; width:100%; height:100%; overflow:visible; }',
      '.itabot-launcher-copy { min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:center; line-height:1; padding:0; margin-top:0; }',
      '.itabot-launcher-name { display:none; }',
      '.itabot-launcher-question { margin:0; font-size:12px; font-weight:950; letter-spacing:1.4px; text-transform:uppercase; color:#ffffff; background:linear-gradient(135deg, rgba(7,87,156,.92), rgba(10,140,226,.92)); padding:4px 10px; border-radius:999px; white-space:nowrap; border:1px solid rgba(115,224,255,.65); box-shadow:0 0 10px rgba(34,194,255,.45), 0 2px 6px rgba(0,0,0,.3); animation:itabot-fale-pulse 1.6s ease-in-out infinite; transform-origin:center; }',
      '@keyframes itabot-fale-pulse { 0%,100% { transform:scale(1); box-shadow:0 0 8px rgba(34,194,255,.4), 0 2px 6px rgba(0,0,0,.3); filter:brightness(1); } 50% { transform:scale(1.06); box-shadow:0 0 16px rgba(34,194,255,.8), 0 3px 8px rgba(0,0,0,.4); filter:brightness(1.15); } }',
      '.itabot-launcher-dot { display:none; }',
      '@keyframes itabot-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }',
      '@media (prefers-reduced-motion:reduce) { #itabot-launcher, .itabot-launcher-robot, .itabot-launcher-question { animation:none; transition:none; } }',
      '@media (max-width:600px) { #itabot-launcher { right:calc(10px + env(safe-area-inset-right, 0px)); bottom:calc(76px + env(safe-area-inset-bottom, 0px)); width:82px; height:102px; } .itabot-launcher-robot { flex-basis:68px; width:60px; height:68px; } .itabot-launcher-question { font-size:11px; padding:3px 8px; letter-spacing:1.1px; } }',
      '@media (min-width:601px) and (max-width:1024px) { #itabot-launcher { bottom:calc(20px + env(safe-area-inset-bottom, 0px)); right:calc(16px + env(safe-area-inset-right, 0px)); } }',
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
    launcher.setAttribute('aria-label', 'Abrir ItaBot — Dúvidas');
    launcher.innerHTML = [
      '<span class="itabot-launcher-robot" aria-hidden="true">',
        '<svg viewBox="0 0 80 96" role="img" aria-hidden="true">',
          '<defs>',
            '<linearGradient id="itabotBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2fbff"/><stop offset=".4" stop-color="#4ac5f5"/><stop offset="1" stop-color="#0f59a8"/></linearGradient>',
            '<linearGradient id="itabotHelmet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0fdff"/><stop offset=".45" stop-color="#55d0f7"/><stop offset="1" stop-color="#1464b5"/></linearGradient>',
            '<linearGradient id="itabotScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2b45"/><stop offset=".5" stop-color="#04121f"/><stop offset="1" stop-color="#01060b"/></linearGradient>',
            '<filter id="itabotGlow"><feGaussianBlur stdDeviation="1.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
            '<filter id="blueOutline"><feMorphology operator="dilate" radius="1.8" in="SourceAlpha" result="dilated"/><feFlood flood-color="#00d4ff" result="blue"/><feComposite in="blue" in2="dilated" operator="in" result="outline"/><feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
            '<clipPath id="itabotTickerClip"><rect x="18" y="32.5" width="44" height="5" rx="1.8"/></clipPath>',
          '</defs>',
          '<g filter="url(#blueOutline)">',
            '<!-- Corpo perolizado -->',
            '<path d="M20 45c0-8 9-14 20-14s20 6 20 14v28c0 8-8 13-20 13S20 81 20 73Z" fill="url(#itabotBody)" stroke="#b8e8ff" stroke-width="1.4"/>',
            '<!-- Capacete -->',
            '<path d="M12 31C12 14 24 5 40 5s28 9 28 26v7H12Z" fill="url(#itabotHelmet)" stroke="#b8e8ff" stroke-width="1.4"/>',
            '<!-- Visor de TV LED (olhos, boca e mensagens integrados) -->',
            '<path d="M16 27c2-13 10-20 24-20s22 7 24 20v11H16Z" fill="url(#itabotScreen)" stroke="#5ff4ff" stroke-width="1.2"/>',
            '<path d="M19 33h42" stroke="#164e6f" stroke-width=".8" opacity=".9"/>',
            '<!-- Olhos LED expressivos (^ ^) -->',
            '<path d="M26 22 q4 -5.5 8 0" fill="none" stroke="#7effff" stroke-width="2.6" stroke-linecap="round" filter="url(#itabotGlow)"/>',
            '<path d="M46 22 q4 -5.5 8 0" fill="none" stroke="#7effff" stroke-width="2.6" stroke-linecap="round" filter="url(#itabotGlow)"/>',
            '<!-- Boca LED amigável -->',
            '<path d="M34 29 q6 6 12 0" fill="none" stroke="#7effff" stroke-width="2.2" stroke-linecap="round" filter="url(#itabotGlow)"/>',
            '<!-- Ticker LED passando mensagens na própria tela -->',
            '<g clip-path="url(#itabotTickerClip)">',
              '<text class="itabot-ticker-text" x="65" y="36.5" fill="#ffffff" font-size="3.4" font-family="Arial, sans-serif" font-weight="900" letter-spacing=".4">ITABOT • SORVETE • SABORES</text>',
              '<text class="itabot-ticker-text" x="65" y="36.5" fill="#9effff" font-size="3.4" font-family="Arial, sans-serif" font-weight="900" letter-spacing=".4"><animate attributeName="x" from="65" to="-75" dur="5.5s" repeatCount="indefinite"/>ITABOT • SORVETE • SABORES</text>',
            '</g>',
            '<!-- Antena piscante -->',
            '<line x1="40" y1="5" x2="40" y2="1" stroke="#5ff4ff" stroke-width="2" stroke-linecap="round"/>',
            '<circle cx="40" cy="1" r="2.5" fill="#ff2a6d" filter="url(#itabotGlow)"/>',
            '<!-- Braços articulados -->',
            '<path d="M13 55 5 63M67 55l8 5" stroke="#68d5ff" stroke-width="5.5" stroke-linecap="round"/>',
            '<!-- Sorvete delicioso na mão -->',
            '<polygon points="73,53 83,53 78,67" fill="#e5ab4b" stroke="#8d5b10" stroke-width="1"/>',
            '<path d="M71 53 a6.5 6.5 0 0 1 13 0 z" fill="#ff2a6d"/>',
            '<circle cx="78" cy="46" r="3" fill="#ffe600"/>',
            '<!-- Pernas -->',
            '<path d="M29 82v7M51 82v7" stroke="#48b5f0" stroke-width="6.5" stroke-linecap="round"/>',
          '</g>',
        '</svg>',
      '</span>',
      '<span class="itabot-launcher-copy"><span class="itabot-launcher-name">ItaBot</span><span class="itabot-launcher-question">FALE</span></span>',
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
      var fullW = Math.min(narrow ? 156 : 184, vw - 24);
      var fullH = narrow ? 58 : 66;
      var iconW = 58, iconH = 58;
      var safeBottom = narrow ? 86 : (vw < 1025 ? 24 : 28);
      var margin = narrow ? 10 : 16;
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
      var bottomY = Math.max(10, vh - fullH - overlayBottom);
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
      _itabotAbrirTelaCheia();
    });
  }

  function _itabotAbrirTelaCheia() {
    var dialog = document.getElementById('chat-dialog');
    if (!dialog) {
      // Cria a estrutura de tela cheia se ainda não existir
      var wrap = document.createElement('div');
      wrap.id = 'chat-dialog';
      wrap.innerHTML = [
        '<div class="chat-box itabot-fullscreen-box" role="dialog" aria-modal="true" aria-labelledby="fale-modal-titulo">',
          '<div class="chat-hdr">',
            '<div class="chat-hdr-logo-row">',
              '<div class="chat-hdr-brand">',
                '<img src="images/logo.webp" alt="Itapolitana" class="chat-hdr-logo-img"/>',
                '<div>',
                  '<div class="chat-hdr-logo-text" id="fale-modal-titulo">ItaBot · Dúvidas</div>',
                  '<div style="font-size:11px;opacity:.85;" id="fale-modal-sub">Assistente Itapolitana · Responde na hora</div>',
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
      wrap.classList.add('itabot-fullscreen-mode');
      _itabotVincularTeclado(wrap);
      
      // Inserir estilos dos botões de tema
      if (!document.getElementById('itabot-temas-css')) {
        var st = document.createElement('style');
        st.id = 'itabot-temas-css';
        st.textContent = [
          '.fale-tema-btn { display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:14px 16px; width:100%; cursor:pointer; font-size:15px; color:#1a202c; transition:transform .15s, background .15s, border-color .15s; box-shadow:0 2px 6px rgba(0,0,0,.03); }',
          '.fale-tema-btn:hover { background:#f0f9ff; border-color:#0284c7; transform:translateY(-1px); }',
          '.fale-tema-btn:active { transform:scale(.98); }'
        ].join('');
        document.head.appendChild(st);
      }
    }
    document.body.classList.add('chat-open');
    document.getElementById('chat-dialog').classList.add('aberto');
  }

  window._itabotFecharTelaCheia = function () {
    var dialog = document.getElementById('chat-dialog');
    if (dialog) dialog.classList.remove('aberto');
    document.body.classList.remove('chat-open');
    window.location.href = 'index.html';
  };

  var _itabotConteudoTemas = {
    promocao: {
      titulo: '🎉 Promoções e Sorteios',
      textos: [
        '✅ Temos promoções semanais e mensais para clientes e seguidores.',
        '✅ Para participar: comente nos posts oficiais do Instagram e cadastre-se na aba Promoção do site.',
        '✅ Sorteios auditados mensalmente com caixas de sorvete exclusivas.'
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
    window.open('https://wa.me/5516999999999?text=' + encodeURIComponent(texto), '_blank');
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
      _itabotAbrirItaBot();
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
