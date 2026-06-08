/**
 * ITA BOT WIDGET — Sorveteria Itapolitana
 * Assistente virtual interativo para todas as páginas do site.
 * Auto-injeta CSS, HTML e lógica do chat.
 * Não duplica se #chat-dialog já existir (index.html).
 */
(function () {
  'use strict';

  if (document.getElementById('chat-dialog')) return;

  /* ─── Detecta raiz do site para construir paths ─── */
  var _base = (function () {
    var scripts = document.querySelectorAll('script[src*="ita-bot-widget"]');
    if (scripts.length) {
      return scripts[scripts.length - 1].src.replace(/scripts\/ita-bot-widget\.js.*$/, '');
    }
    return '';
  })();

  /* ─── Estado da conversa ─── */
  var _ctxData    = {};     // dados acumulados no contexto (ex: nome para login)
  var _prodData   = null;   // cache de dados/produtos.json
  var _promoData  = null;   // cache de dados/promo.json
  var _cliData    = null;   // cache de dados/clientes.json (carregado sob demanda)
  var _saudacao   = false;  // flag: saudação inicial já mostrada
  var _scrollY    = 0;      // para page-lock

  /* ─── Normaliza string ─── */
  function _norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  /* ─── CSS ─── */
  var css = ':root{--itabot-kb-offset:0px}' +
 'html.itabot-open,body.itabot-open{position:fixed;width:100%;height:100dvh;overflow:hidden;overscroll-behavior:none}' +
 '#chat-dialog{display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.55);overflow:hidden}' +
 '#chat-dialog.aberto{display:flex;animation:itabot-in .22s ease-out}' +
 '@keyframes itabot-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}' +
 '@media(prefers-reduced-motion:reduce){@keyframes itabot-in{from{opacity:0}to{opacity:1}}}' +
 '.chat-box{background:#F0F2F5;width:100%;max-width:100%;height:100dvh;min-height:0;display:flex;flex-direction:column;overflow:hidden}' +
 '@media(min-width:768px){#chat-dialog{padding:18px 24px 24px;align-items:flex-start;justify-content:flex-end}.chat-box{max-width:420px;height:min(740px,calc(100dvh - 42px));border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.32)}}' +
 '.chat-hdr{background:linear-gradient(135deg,#e8470a,#ff6b35);padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.18)}' +
'.chat-hdr-logo-img{width:42px;height:42px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px #fff,0 0 0 4px rgba(255,255,255,.3);flex-shrink:0}' +
'.chat-hdr-info{flex:1;min-width:0}' +
'.chat-hdr-title{font-size:14px;font-weight:900;color:#FBD100;letter-spacing:.8px;text-shadow:0 1px 3px rgba(0,0,0,.3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'.chat-hdr-sub{font-size:10px;color:rgba(255,255,255,.85);font-weight:600;display:flex;align-items:center;gap:4px;margin-top:2px}' +
'.chat-hdr-online{width:7px;height:7px;border-radius:50%;background:#4CAF50;flex-shrink:0;animation:itabot-green 2s infinite}' +
'@keyframes itabot-green{0%,100%{opacity:1}50%{opacity:.35}}' +
'@media(prefers-reduced-motion:reduce){.chat-hdr-online{animation:none}}' +
'.chat-close{background:rgba(255,255,255,.18);border:none;border-radius:50%;width:40px;height:40px;min-width:40px;color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:background .15s}' +
'.chat-close:hover{background:rgba(255,255,255,.32)}' +
 '.chat-msgs{flex:1;min-height:0;overflow-y:auto;padding:14px 12px calc(8px + var(--itabot-kb-offset));display:flex;flex-direction:column;gap:6px;-webkit-overflow-scrolling:touch;scroll-behavior:smooth}' +
'.msg{max-width:84%;padding:11px 15px;border-radius:18px;font-size:14px;line-height:1.6;animation:msg-in .22s ease-out;word-break:break-word}' +
'@keyframes msg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
'@media(prefers-reduced-motion:reduce){@keyframes msg-in{from{opacity:0}to{opacity:1}}}' +
'.msg.bot{background:#fff;color:#111827;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.1)}' +
'.msg.user{background:linear-gradient(135deg,#FF6B35,#E8000D);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;box-shadow:0 2px 6px rgba(232,0,13,.28)}' +
'.chat-typing{background:#fff;align-self:flex-start;padding:12px 16px;border-radius:18px;border-bottom-left-radius:4px;display:none;gap:5px;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}' +
'.chat-typing.show{display:flex}' +
'.chat-typing span{width:7px;height:7px;border-radius:50%;background:#bbb;animation:dot-jump 1.2s infinite}' +
'.chat-typing span:nth-child(2){animation-delay:.18s}.chat-typing span:nth-child(3){animation-delay:.36s}' +
'@keyframes dot-jump{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}' +
'.itabot-chips{display:flex;flex-wrap:wrap;gap:7px;padding:2px 0 4px;align-self:flex-start;max-width:100%}' +
'.itabot-chip{background:#fff;color:#C62828;border:1.5px solid #FFCDD2;border-radius:20px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;transition:background .15s,transform .1s,border-color .15s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;min-height:38px;display:inline-flex;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,.07)}' +
'.itabot-chip:hover,.itabot-chip:focus-visible{background:#FFEBEE;border-color:#E8000D;transform:translateY(-1px);outline:2px solid #E8000D;outline-offset:1px}' +
'.itabot-chip:active{transform:scale(.95)}' +
'.itabot-link-btn{display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#FF6B35,#E8000D);color:#fff!important;text-decoration:none!important;border-radius:12px;padding:11px 16px;font-size:13px;font-weight:900;letter-spacing:.3px;margin-top:8px;min-height:46px;box-shadow:0 3px 10px rgba(232,0,13,.25);transition:filter .15s,transform .1s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;word-break:break-word;box-sizing:border-box}' +
'.itabot-link-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}.itabot-link-btn:active{transform:scale(.97)}' +
 '.chat-controls{display:flex;flex-direction:column;flex-shrink:0;transform:translateY(calc(var(--itabot-kb-offset) * -1));transition:transform .22s ease}' +
 '.chat-inp-row{padding:10px 12px;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));display:flex;gap:8px;border-top:1px solid #E5E7EB;background:#fff;flex-shrink:0;align-items:center;position:relative}' +
'.chat-inp{flex:1;padding:11px 16px;border:2px solid #E5E7EB;border-radius:24px;font-size:16px;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;background:#F8F9FA;color:#111;-webkit-appearance:none;appearance:none}' +
'.chat-inp:focus{border-color:#E8000D;box-shadow:0 0 0 3px rgba(232,0,13,.12);background:#fff}' +
'.chat-inp::placeholder{color:rgba(0,0,0,.38)}' +
'.chat-send{background:linear-gradient(135deg,#FF6B35,#E8000D);color:#fff;border:none;border-radius:50%;width:46px;height:46px;min-width:46px;font-size:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;box-shadow:0 3px 10px rgba(232,0,13,.28);transition:transform .1s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
'.chat-send:active{transform:scale(.92)}' +
'.itabot-wrap{position:static;display:none;flex-direction:row;align-items:center;gap:6px;flex:0 0 auto;width:auto;min-width:0}' +
'.duvidas-card{display:flex;align-items:center;justify-content:center;background:transparent;border:2.5px solid rgba(255,255,255,.8);border-radius:50%;box-shadow:none;filter:none;animation:none;overflow:visible;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
'.duvidas-card svg{width:90%;height:90%;display:block}' +
'.duvidas-card-logo,.duvidas-btn,.itabot-duvidas-btn{display:none}' +
'.ita-bot-duvidas-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 28px;min-height:44px;background:linear-gradient(135deg,#1565C0,#0D47A1);color:#fff;border:2px solid rgba(255,255,255,.85);border-radius:999px;font-family:inherit;font-size:14px;font-weight:900;letter-spacing:.8px;line-height:1;cursor:pointer;white-space:nowrap;touch-action:manipulation;-webkit-tap-highlight-color:transparent;animation:itabot-btn-pulse 1.8s ease-in-out infinite}' +
'.ita-bot-duvidas-btn:hover{filter:brightness(1.12);transform:scale(1.04)}' +
'.ita-bot-duvidas-btn:focus-visible{outline:3px solid #FFD600;outline-offset:2px}' +
'@keyframes itabot-btn-pulse{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.9),0 4px 12px rgba(0,60,180,.35)}50%{box-shadow:0 0 0 2px #fff,0 0 18px rgba(0,80,220,.65),0 0 32px rgba(0,80,220,.3)}}' +
'.itap-header-top{display:flex;justify-content:center;align-items:center;padding:2px 0;width:100%;box-sizing:border-box}' +
'.itap-header-duvidas{display:flex;justify-content:center}' +
'@media(max-width:600px){.ita-bot-duvidas-btn{font-size:13px;padding:9px 22px}.msg{font-size:13px}}' +
'@media(prefers-reduced-motion:reduce){.ita-bot-duvidas-btn{animation:none;box-shadow:0 4px 12px rgba(0,60,180,.35)}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ─── HTML ─── */
  var logoSrc = _base + 'images/logo.webp';

  var html = '<div class="itabot-wrap" id="itabot-wrap">' +
  '<span class="itabot-badge" id="itabot-badge" aria-hidden="true" style="display:none"></span>' +
  '<div class="itabot-bubble" id="itabot-bubble" aria-hidden="true" style="display:none"></div>' +
  '<button type="button" id="ita-bot-trigger" class="duvidas-card" onclick="_itabotAbrirItaBot()"' +
  ' aria-label="Clique para tirar suas dúvidas sobre sorvetes, açaí e encomendas." aria-haspopup="dialog">' +
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 82" width="80" height="66" aria-hidden="true">' +
  '<rect x="2" y="21" width="5" height="15" rx="2.5" fill="#D0D0E0"/><rect x="51" y="21" width="5" height="15" rx="2.5" fill="#D0D0E0"/>' +
  '<rect x="7" y="13" width="44" height="36" rx="11" fill="#E8E8F8"/><rect x="7" y="13" width="44" height="13" rx="11" fill="white" opacity=".22"/>' +
  '<rect x="25" y="7" width="6" height="7" rx="2.5" fill="#C8C8D8"/><circle cx="28" cy="6" r="5.5" fill="#FFD700" stroke="#E8C000" stroke-width=".8"/>' +
  '<circle cx="26" cy="4.5" r="1.8" fill="white" opacity=".55"/>' +
  '<rect x="11" y="22" width="14" height="11" rx="3.5" fill="#1A1A2E"/><rect x="13" y="24" width="10" height="7" rx="2.5" fill="#E8000D"/><circle cx="15" cy="26" r="2" fill="white" opacity=".85"/>' +
  '<rect x="31" y="22" width="14" height="11" rx="3.5" fill="#1A1A2E"/><rect x="33" y="24" width="10" height="7" rx="2.5" fill="#E8000D"/><circle cx="35" cy="26" r="2" fill="white" opacity=".85"/>' +
  '<circle cx="29" cy="37" r="2.5" fill="#C0C0D0"/>' +
  '<path d="M16,43 Q29,52 42,43" stroke="#1A1A2E" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
  '<path d="M20,45 Q29,49 38,45" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>' +
  '<circle cx="9" cy="34" r="5" fill="#FFB0C8" opacity=".38"/><circle cx="49" cy="34" r="5" fill="#FFB0C8" opacity=".38"/>' +
  '<rect x="11" y="47" width="36" height="24" rx="8" fill="#D0D0E0"/><circle cx="29" cy="59" r="5" fill="#B8B8CC"/>' +
  '<rect x="45" y="47" width="22" height="8" rx="4" fill="#D0D0E0"/><polygon points="62,54 90,54 76,80" fill="#DBA87A"/>' +
  '<line x1="76" y1="54" x2="70" y2="79" stroke="#C8945A" stroke-width=".7" opacity=".5"/>' +
  '<line x1="76" y1="54" x2="82" y2="79" stroke="#C8945A" stroke-width=".7" opacity=".5"/>' +
  '<ellipse cx="76" cy="43" rx="14" ry="11" fill="#F7B73B"/><ellipse cx="75" cy="30" rx="12" ry="10" fill="#EF5350"/>' +
  '<ellipse cx="76" cy="18" rx="9" ry="8" fill="#F9C6D0"/><ellipse cx="73" cy="15" rx="3" ry="2" fill="white" opacity=".5"/>' +
  '</svg></button>' +
  '<button type="button" class="itabot-duvidas-btn" onclick="_itabotAbrirItaBot()" aria-label="Abrir dúvidas com Ita Bot">DÚVIDAS</button>' +
  '</div>' +
  '<div id="chat-dialog" role="dialog" aria-modal="false" aria-labelledby="chat-hdr-titulo" aria-hidden="true">' +
  '<div class="chat-box">' +
  '<div class="chat-hdr">' +
  '<img src="' + logoSrc + '" alt="Logo Sorveteria Itapolitana" class="chat-hdr-logo-img" loading="lazy" decoding="async">' +
  '<div class="chat-hdr-info">' +
  '<div class="chat-hdr-title" id="chat-hdr-titulo">🍦 Ita Bot</div>' +
  '<div class="chat-hdr-sub"><span class="chat-hdr-online"></span>Assistente Itapolitana</div>' +
  '</div>' +
  '<button class="chat-close" onclick="_itabotFecharChatDialog()" type="button" aria-label="Fechar chat">\u2715</button>' +
  '</div>' +
  '<div class="chat-msgs" id="duvidas-resposta" aria-live="polite" role="log" aria-relevant="additions text">' +
  '<div class="chat-typing" id="itabot-typing"><span></span><span></span><span></span></div>' +
  '</div>' +
  '<div class="chat-controls" id="itabot-chat-controls">' +
  '<div class="chat-inp-row" id="itabot-input-area">' +
  '<input class="chat-inp" id="duvidas-pergunta" onkeydown="if(event.key===\'Enter\')_itabotEnviarChat()"' +
  ' onfocus="_itabotHandleInputFocus()" placeholder="Digite sua d\u00favida aqui\u2026" type="text" autocomplete="off" spellcheck="false" aria-label="Campo para digitar sua d\u00favida"/>' +
  '<button class="chat-send" onclick="_itabotEnviarChat()" type="button" aria-label="Enviar mensagem">\u27a4</button>' +
  '</div></div>' +
  '</div></div>';

  var container = document.createElement('div');
  container.innerHTML = html;
  while (container.firstChild) {
    document.body.appendChild(container.firstChild);
  }

  /* ─── Fechar ao clicar fora (backdrop) ou ESC ─── */
  document.addEventListener('click', function (e) {
    var cd = document.getElementById('chat-dialog');
    if (cd && cd.classList.contains('aberto') && e.target === cd) { _itabotFecharChatDialog(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var cd = document.getElementById('chat-dialog');
      if (cd && cd.classList.contains('aberto')) { _itabotFecharChatDialog(); e.preventDefault(); }
    }
  });

  /* ─── Page-lock helpers ─── */
  function _itabotTravarPagina() {
    if (document.body.classList.contains('itabot-open')) return;
    _scrollY = window.scrollY;
    document.documentElement.classList.add('itabot-open');
    document.body.classList.add('itabot-open');
    document.body.style.top       = '-' + _scrollY + 'px';
  }
  function _itabotLiberarPagina() {
    if (!document.body.classList.contains('itabot-open')) return;
    document.documentElement.classList.remove('itabot-open');
    document.body.classList.remove('itabot-open');
    document.body.style.top       = '';
    window.scrollTo(0, _scrollY);
  }

  /* ─── Chat open / close ─── */
  function _itabotAbrirItaBot() {
    var d = document.getElementById('chat-dialog');
    if (d) { d.classList.add('aberto'); d.removeAttribute('aria-hidden'); d.setAttribute('aria-modal', 'true'); _itabotTravarPagina(); }
    _itabotAtualizarViewport();
    if (!_saudacao) { setTimeout(_itabotMostrarSaudacao, 320); }
    setTimeout(function () {
      var inp = document.getElementById('duvidas-pergunta');
      if (inp) { inp.focus(); _itabotHandleInputFocus(); }
    }, 160);
  }
  function _itabotFecharChatDialog() {
    var d = document.getElementById('chat-dialog');
    if (d) { d.classList.remove('aberto'); d.setAttribute('aria-hidden', 'true'); d.setAttribute('aria-modal', 'false'); _itabotLiberarPagina(); }
    document.documentElement.style.setProperty('--itabot-kb-offset', '0px');
  }
  window._itabotAbrirItaBot     = _itabotAbrirItaBot;
  window._itabotFecharChatDialog = _itabotFecharChatDialog;

  /* ─── Indicador de "digitando" ─── */
  function _itabotMostrarTyping() {
    var t = document.getElementById('itabot-typing');
    if (t) { t.classList.add('show'); _itabotScrollFim(); }
  }
  function _itabotOcultarTyping() {
    var t = document.getElementById('itabot-typing');
    if (t) { t.classList.remove('show'); }
  }
  function _itabotScrollFim() {
    var el = document.getElementById('duvidas-resposta');
    setTimeout(function () {
      if (el) { el.scrollTop = el.scrollHeight; }
    }, 300);
  }
  function _itabotAtualizarViewport() {
    var dialog = document.getElementById('chat-dialog');
    if (!dialog || !dialog.classList.contains('aberto')) return;
    var vv = window.visualViewport;
    var offsetBottom = 0;
    if (vv) {
      offsetBottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    }
    document.documentElement.style.setProperty('--itabot-kb-offset', offsetBottom + 'px');
    _itabotScrollFim();
  }
  function _itabotHandleInputFocus() {
    _itabotAtualizarViewport();
    _itabotScrollFim();
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', _itabotAtualizarViewport);
    window.visualViewport.addEventListener('scroll', _itabotAtualizarViewport);
  }
  window._itabotHandleInputFocus = _itabotHandleInputFocus;

  /* ─── Carregamento assíncrono de dados ─── */
  function _itabotCarregarDados() {
    fetch(_base + 'dados/produtos.json?v=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) { _prodData = d; });
    fetch(_base + 'dados/promo.json?v=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) { _promoData = d; });
  }
  _itabotCarregarDados();

  /* ─── Saudação inicial ─── */
  function _itabotMostrarSaudacao() {
    _saudacao = true;
    _itabotMostrarTyping();
    setTimeout(function () {
      _itabotOcultarTyping();
      _itabotInserirMensagem('bot', {
        answer: 'Ol\u00e1! \ud83d\udc4b Sou o Ita Bot, assistente da Sorveteria Itapolitana em Cajuru! \ud83c\udf66\n\nPosso te ajudar com:\n\ud83c\udf66 Card\u00e1pio e sabores\n\ud83d\udce6 Encomendas e festas\n\ud83c\udf89 Promo\u00e7\u00f5es e sorteio\n\u2b50 \n\ud83d\udccd Hor\u00e1rio, localiza\u00e7\u00e3o e contato\n\nDigite sua d\u00favida ou toque em uma op\u00e7\u00e3o:',
        chips: ['\ud83c\udf66 Card\u00e1pio', '\ud83d\udce6 Encomendas', '\ud83c\udf89 Promo\u00e7\u00f5es', '\u2b50 Fidelidade', '\ud83d\udccd Localiza\u00e7\u00e3o', '\ud83d\udd59 Hor\u00e1rio', '\ud83d\udcac Atendente']
      });
    }, 700);
  }

  /* ─── Inserir chips de resposta rápida ─── */
  function _itabotInserirChips(chips) {
    var el  = document.getElementById('duvidas-resposta');
    var tip = document.getElementById('itabot-typing');
    if (!el) return;
    var wrap = document.createElement('div');
    wrap.className = 'itabot-chips';
    for (var i = 0; i < chips.length; i++) {
      (function (txt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'itabot-chip';
        btn.textContent = txt;
        btn.onclick = function () { _itabotClicarChip(txt); };
        wrap.appendChild(btn);
      }(chips[i]));
    }
    if (tip) { el.insertBefore(wrap, tip); } else { el.appendChild(wrap); }
    _itabotScrollFim();
  }

  /* ─── Clicar em chip ─── */
  function _itabotClicarChip(txt) {
    var el = document.getElementById('duvidas-resposta');
    if (el) { var cs = el.querySelectorAll('.itabot-chips'); for (var i = 0; i < cs.length; i++) { cs[i].remove(); } }
    if (_norm(txt).indexOf('tentar novamente') !== -1) {
      _ctxData = {};
      _itabotMostrarTyping();
      setTimeout(function () {
        _itabotOcultarTyping();
      }, 400);
      return;
    }
    _itabotEnviarChatComMsg(txt);
  }
  window._itabotClicarChip = _itabotClicarChip;

  /* ─── Inserir mensagem no chat ─── */
  function _itabotInserirMensagem(tipo, conteudo) {
    var el  = document.getElementById('duvidas-resposta');
    var tip = document.getElementById('itabot-typing');
    if (!el) return;
    var msgEl = document.createElement('div');
    msgEl.className = 'msg ' + (tipo === 'user' ? 'user' : 'bot');
    msgEl.setAttribute('role', 'article');
    if (tipo === 'bot' && conteudo && typeof conteudo === 'object') {
      if (conteudo.answer) {
        var txt = document.createElement('span');
        txt.style.cssText = 'display:block;white-space:pre-wrap;line-height:1.6';
        txt.textContent = conteudo.answer;
        msgEl.appendChild(txt);
      }
      function addBtn(linkText, linkHref, external) {
        if (!linkText || !linkHref) return;
        var a = document.createElement('a');
        a.href = external ? linkHref : (_base + linkHref);
        a.className = 'itabot-link-btn';
        if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        a.textContent = linkText;
        msgEl.appendChild(a);
      }
      addBtn(conteudo.linkText,  conteudo.linkHref,  conteudo.external);
      addBtn(conteudo.linkText2, conteudo.linkHref2, conteudo.external2);
    } else {
      msgEl.textContent = String(conteudo || '');
    }
    if (tip) { el.insertBefore(msgEl, tip); } else { el.appendChild(msgEl); }
    if (tipo === 'bot' && conteudo && conteudo.chips && conteudo.chips.length) {
      _itabotInserirChips(conteudo.chips);
    }
    _itabotScrollFim();
  }

  /* ─── Builders: respostas de cardápio por categoria ─── */
  function _respSorvetes() {
    var sabores = (_prodData && _prodData.sorvetes && _prodData.sorvetes.sabores) ? _prodData.sorvetes.sabores : [];
    var precos  = (_prodData && _prodData.sorvetes && _prodData.sorvetes.precos)  ? _prodData.sorvetes.precos  : null;
    var n = sabores.length || 35;
    var preview = sabores.length > 0
      ? sabores.slice(0, 8).join(', ') + ' e mais ' + (sabores.length - 8) + '...'
      : 'Chocolate, Nutella, Morango Trufado, Pistache, Kinder Ovo e mais!';
    var cp0  = (precos && precos.casquinha_copo && precos.casquinha_copo['1 Bola'] != null) ? precos.casquinha_copo : null;
    var pMin = cp0 ? 'R$ ' + cp0['1 Bola'].toFixed(2).replace('.', ',') : 'R$ 8,00';
    return {
      answer: '\ud83c\udf66 Temos ' + n + ' sabores tipo artesanal!\n\n\u2728 Destaques: ' + preview + '\n\n\ud83d\udcb0 A partir de ' + pMin + ' (1 bola na casquinha/copo).\nVer card\u00e1pio completo e fazer pedido:',
      linkText: '\ud83c\udf66 Ver todos os sabores',
      linkHref: 'encomendas.html',
      chips: ['\ud83e\uddd0 Pre\u00e7os de sorvete', '\ud83e\uddc2 Caixas para festas', '\ud83c\udf78 Milkshakes', '\ud83e\uded0 A\u00e7a\u00ed']
    };
  }
  function _respAcai() {
    var copos = (_prodData && _prodData.acai && _prodData.acai.copos) ? _prodData.acai.copos : null;
    var linhaCopos = copos
      ? Object.keys(copos).map(function (k) { return k + ' R$ ' + copos[k].toFixed(2).replace('.', ','); }).join(' \u00b7 ')
      : '300ml R$ 15 \u00b7 360ml R$ 16 \u00b7 400ml R$ 17 \u00b7 600ml R$ 20';
    return {
      answer: '\ud83e\uded0 A\u00e7a\u00ed tipo artesanal!\n\nTamanhos: ' + linhaCopos + '\n\nComplementos:\n\ud83c\udf53 Frutas: Morango, Banana, Uva, Kiwi, Abacaxi \u2192 R$ 2,00\n\ud83c\udf6b Cremes (Nutella, Ninho, Pistache) \u2192 R$ 3,00\n\ud83c\udf6d Guloseimas (Granola, Ovomaltine, Leite Cond.) \u2192 R$ 2,00\n\ud83c\udf2b Chocolates (Kit Kat, Oreo, Kinder Bueno) \u2192 R$ 4,00',
      linkText: '\ud83e\uded0 Ver card\u00e1pio completo',
      linkHref: 'encomendas.html',
      chips: ['\ud83c\udf66 Sorvetes', '\ud83c\udf78 Milkshakes', '\ud83c\udf60 Picol\u00e9s', '\ud83c\udf68 Ta\u00e7as']
    };
  }
  function _respPicoles() {
    var p = _prodData && _prodData.picoles;
    var fruta = (p && p.frutas_agua) ? p.frutas_agua.preco_varejo.toFixed(2).replace('.', ',') : '2,50';
    var leite = (p && p.leite_com_recheio && p.leite_com_recheio.preco_varejo != null) ? p.leite_com_recheio.preco_varejo.toFixed(2).replace('.', ',') : '3,00';
    var ninho = (p && p.leite_ninho) ? p.leite_ninho.preco_varejo.toFixed(2).replace('.', ',') : '4,00';
    return {
      answer: '\ud83c\udf60 Picol\u00e9s tipo artesanal!\n\n\ud83c\udf4a Fruta/\u00c1gua \u2014 R$ ' + fruta + ' (Abacaxi, Caju, Gro\u00e9selha, Lim\u00e3o, Melancia, Uva...)\n\ud83e\udd5b Leite sem Recheio \u2014 R$ 2,50 (Coco Queimado, Milho Verde, Amendoim, Pistache)\n\ud83c\udf53 Leite com Recheio \u2014 R$ ' + leite + ' (A\u00e7a\u00ed, Blue Ice, Morango, Chocolate...)\n\ud83c\udf3c Leite Ninho \u2014 R$ ' + ninho + '\n\ud83d\udce6 Atacado (m\u00edn. 100 un.) via encomenda!',
      linkText: '\ud83d\udce6 Ver encomendas',
      linkHref: 'encomendas.html',
      chips: ['\ud83d\udce6 Atacado de picol\u00e9s', '\ud83c\udf66 Sorvetes', '\ud83e\uded0 A\u00e7a\u00ed']
    };
  }
  function _respTacas() {
    var trad = (_prodData && _prodData.tacas && _prodData.tacas.tradicionais) ? _prodData.tacas.tradicionais : null;
    var lista = trad
      ? Object.keys(trad).slice(0, 5).map(function (k) { return k + ' R$ ' + trad[k].toFixed(2).replace('.', ','); }).join('\n')
      : 'Colegial R$ 20 \u00b7 Sundae R$ 23 \u00b7 Banana Split R$ 25 \u00b7 Universit\u00e1rio R$ 23 \u00b7 Ula-Ula R$ 48';
    return {
      answer: '\ud83c\udf68 Ta\u00e7as e Sobremesas!\n\n\u2728 Ta\u00e7as tradicionais:\n' + lista + '\n\n\ud83c\udf6b Ta\u00e7as sujas (Prest\u00edgio, Bis, Kit Kat, Sonho de Valsa) \u2014 R$ 42-45\n\n\ud83e\udd82 Tamb\u00e9m: Brownie R$ 20, Fondue R$ 25, Petit G\u00e2teau R$ 20, Torta de Sorvete R$ 100',
      linkText: '\ud83c\udf68 Ver card\u00e1pio completo',
      linkHref: 'encomendas.html',
      chips: ['\ud83c\udf66 Sorvetes', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83c\udf78 Milkshakes']
    };
  }
  function _respMilkshake() {
    var mk  = (_prodData && _prodData.milkshake && _prodData.milkshake.tradicional) ? _prodData.milkshake.tradicional : null;
    var pMin = (mk && mk['300ml'] != null) ? 'R$ ' + mk['300ml'].toFixed(2).replace('.', ',') : 'R$ 17,00';
    var pMax = (mk && mk['750ml'] != null) ? 'R$ ' + mk['750ml'].toFixed(2).replace('.', ',') : 'R$ 28,00';
    return {
      answer: '\ud83e\udd64 Milkshakes em copo transparente com tampa bolha!\n\nTradicional: 300ml ' + pMin + ' \u00b7 400ml R$ 20 \u00b7 500ml R$ 22 \u00b7 750ml ' + pMax + '\nTop: 360ml R$ 20 \u00b7 600ml R$ 24\n\n\u2795 Adicional Ovomaltine R$ 3,00!',
      linkText: '\ud83e\udd64 Ver card\u00e1pio',
      linkHref: 'encomendas.html',
      chips: ['\ud83c\udf66 Sorvetes', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83c\udf68 Ta\u00e7as']
    };
  }
  function _respEncomendas() {
    return {
      answer: '\ud83d\udce6 Encomendas e Festas!\n\nO processo \u00e9 simples:\n1\ufe0f\u20e3 Escolha os produtos no site\n2\ufe0f\u20e3 Pague antecipado (Pix, cart\u00e3o ou dinheiro)\n3\ufe0f\u20e3 Retire na loja em 3 dias \u00fateis\n\n\ud83e\udd82 Op\u00e7\u00f5es:\n\ud83c\udf82 Torta de Sorvete R$ 100 (at\u00e9 3 sabores)\n\ud83e\uddc8 Caixa 5L a partir de R$ 100\n\ud83e\uddc8 Caixa 10L a partir de R$ 150\n\ud83c\udf60 Picol\u00e9s atacado (m\u00edn. 100 un.)\n\ud83d\udedc Carrinho para Eventos (consulte)',
      linkText: '\ud83d\udce6 Fazer encomenda online',
      linkHref: 'encomendas.html',
      chips: ['\ud83d\udcac Falar no WhatsApp', '\ud83c\udf66 Ver card\u00e1pio']
    };
  }

  /* ─── Builder: busca dinâmica de sabor em produtos.json ─── */
  function _buscarSabor(msg) {
    if (!_prodData || !_prodData.sorvetes || !_prodData.sorvetes.sabores) return null;
    var l = _norm(msg);
    var sabores = _prodData.sorvetes.sabores;
    var encontrado = null;
    for (var i = 0; i < sabores.length; i++) {
      var sNorm = _norm(sabores[i]);
      if (l.indexOf(sNorm) !== -1) { encontrado = sabores[i]; break; }
      // Tenta por parte da palavra (>= 4 letras)
      var partes = sNorm.split(' ');
      for (var j = 0; j < partes.length; j++) {
        if (partes[j].length >= 4 && l.indexOf(partes[j]) !== -1) { encontrado = sabores[i]; break; }
      }
      if (encontrado) break;
    }
    if (!encontrado) return null;
    var precos = _prodData.sorvetes.precos;
    var cp = (precos && precos.casquinha_copo && precos.casquinha_copo['1 Bola'] != null) ? precos.casquinha_copo : null;
    var linhaPre = cp
      ? '1 bola R$ ' + cp['1 Bola'].toFixed(2).replace('.', ',') + ' \u00b7 2 bolas R$ ' + (cp['2 Bolas'] != null ? cp['2 Bolas'].toFixed(2).replace('.', ',') : '') + ' \u00b7 3 bolas R$ ' + (cp['3 Bolas'] != null ? cp['3 Bolas'].toFixed(2).replace('.', ',') : '')
      : 'a partir de R$ 8,00';
    return {
      answer: '\ud83c\udf66 Temos ' + encontrado + '! \ud83d\ude0b\n\nPre\u00e7os (casquinha/copo): ' + linhaPre + '\n\nGostaria de ver outras op\u00e7\u00f5es ou o card\u00e1pio completo?',
      linkText: '\ud83c\udf66 Ver card\u00e1pio completo',
      linkHref: 'encomendas.html',
      chips: ['\ud83e\uddd0 Outros pre\u00e7os', '\ud83c\udf78 Milkshakes', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83d\udce6 Fazer encomenda']
    };
  }

  /* ─── Builder: promoções ─── */
  function _respPromoAtiva() {
    if (_promoData && _promoData.ativo) {
      return {
        answer: '\ud83c\udf89 ' + (_promoData.titulo || 'Promo\u00e7\u00e3o ativa!') + '\n\n' + (_promoData.descricao || ''),
        linkText: _promoData.btnTexto || '\ud83c\udf81 Ver promo\u00e7\u00e3o',
        linkHref: 'promocao.html'
      };
    }
    return {
      answer: '\ud83c\udf89 Temos o Sorteio Mensal! \ud83c\udf40\n\nTodo m\u00eas sorteamos 1 caixa de sorvete de 5 litros. Cadastre-se gratuitamente para participar!',
      linkText: '\ud83c\udf81 Participar do sorteio',
      linkHref: 'promocao.html',
      chips: ['\ud83e\uded0 Promo\u00e7\u00f5es de a\u00e7a\u00ed', '\ud83c\udf66 Pre\u00e7os de sorvete']
    };
  }
  function _respPromoAcai() {
    var copos = (_prodData && _prodData.acai && _prodData.acai.copos) ? _prodData.acai.copos : null;
    var acaiPromo = (_prodData && _prodData.acai_promocao) ? _prodData.acai_promocao : null;
    var txt = '\ud83e\uded0 Pre\u00e7os do A\u00e7a\u00ed tipo artesanal!\n\n';
    if (copos) {
      txt += Object.keys(copos).map(function (k) { return k + ': R$ ' + copos[k].toFixed(2).replace('.', ','); }).join('\n');
    } else {
      txt += '300ml R$ 15 \u00b7 360ml R$ 16 \u00b7 400ml R$ 17 \u00b7 600ml R$ 20';
    }
    if (acaiPromo && acaiPromo.length) {
      txt += '\n\n\ud83d\udd25 Combos especiais:\n' + acaiPromo.slice(0, 3).map(function (p) { return '\u2022 ' + p.nome + ' ' + p.desc + ' \u2014 R$ ' + p.preco.toFixed(2).replace('.', ','); }).join('\n');
    }
    return { answer: txt, linkText: '\ud83e\uded0 Ver card\u00e1pio do a\u00e7a\u00ed', linkHref: 'encomendas.html' };
  }
  function _respPromoSorvetes() {
    var cp = (_prodData && _prodData.sorvetes && _prodData.sorvetes.precos && _prodData.sorvetes.precos.casquinha_copo)
      ? _prodData.sorvetes.precos.casquinha_copo : null;
    var linhaPrecos = cp
      ? Object.keys(cp).map(function (k) { return k + ': R$ ' + cp[k].toFixed(2).replace('.', ','); }).join(' \u00b7 ')
      : '1 bola R$ 8,00 \u00b7 2 bolas R$ 10,00 \u00b7 3 bolas R$ 12,00';
    return {
      answer: '\ud83c\udf66 Pre\u00e7os dos sorvetes tipo artesanal!\n\nCasquinha/Copo: ' + linhaPrecos + '\n\n35 sabores para escolher! Veja o card\u00e1pio completo:',
      linkText: '\ud83c\udf66 Ver card\u00e1pio',
      linkHref: 'encomendas.html'
    };
  }

  function _buscarPontosAsync(nome, dataStr) {
    // Parseia DD/MM/AAAA → AAAA-MM-DD com validação de numerais e faixas
    var dataNorm = null;
    var partes = dataStr.replace(/[.\-]/g, '/').split('/');
    if (partes.length === 3) {
      var dd = parseInt(partes[0], 10);
      var mm = parseInt(partes[1], 10);
      var aaaa = parseInt(partes[2], 10);
      if (!isNaN(dd) && !isNaN(mm) && !isNaN(aaaa) &&
          dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12 &&
          aaaa >= 1900 && aaaa <= 2099 && String(partes[2]).length === 4) {
        dataNorm = String(aaaa) + '-' + String(mm).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
      }
    }
    if (!dataNorm) {
      _itabotOcultarTyping();
      _itabotInserirMensagem('bot', {
        answer: 'N\u00e3o entendi a data \ud83d\ude05\n\nUse o formato DD/MM/AAAA, por exemplo: 15/03/1995',
        chips: ['\ud83d\udd04 Tentar novamente']
      });
      return;
    }
    function procurar(data) {
      var nNorm = _norm(nome);
      var clientes = (data && data.clientes) ? data.clientes : {};
      var ids = Object.keys(clientes);
      for (var i = 0; i < ids.length; i++) {
        var c = clientes[ids[i]];
        if (_norm(c.nome) === nNorm && c.dataNasc === dataNorm) {
          var primeiro = c.nome.split(' ')[0];
          var pts = c.saldoPontos || 0;
          var prox = pts < 10
            ? 'Faltam ' + (10 - pts) + ' ponto(s) para 1 Milk Shake de 300ml! \ud83e\udd64'
            : (pts >= 30 ? 'Voc\u00ea pode resgatar 1 caixa com 7 bolas! \ud83c\udf66\ud83c\udf89' : 'Faltam ' + (30 - pts) + ' ponto(s) para 1 caixa com 7 bolas!');
          _itabotOcultarTyping();
          _itabotInserirMensagem('bot', {
            answer: '\u2b50 Encontrei voc\u00ea, ' + primeiro + '!\n\nSaldo atual: ' + pts + ' ponto' + (pts !== 1 ? 's' : '') + '\n' + prox,
            linkHref: ''
          });
          return;
        }
      }
      _itabotOcultarTyping();
      _itabotInserirMensagem('bot', {
        answer: 'N\u00e3o encontrei cadastro com esse nome e data de nascimento \ud83d\ude14\n\nVerifique os dados ou cadastre-se gratuitamente!',
        answer: 'O programa de fidelidade está temporariamente indisponível. Fale conosco pelo WhatsApp! 💬',
        linkHref: '',
        chips: ['\ud83d\udd04 Tentar novamente']
      });
    }
    if (_cliData) { setTimeout(function () { procurar(_cliData); }, 500); return; }
    fetch(_base + 'dados/clientes.json?v=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (data) {
        if (!data) {
          _itabotOcultarTyping();
          _itabotInserirMensagem('bot', { answer: 'Não consegui acessar o sistema agora 😔 Entre em contato pelo WhatsApp para mais informações! 💬' });
          return;
        }
        _cliData = data;
        procurar(data);
      });
  }

  /* ─── Handler de contexto ─── */
  function _handleContexto(msg) {
    var l = _norm(msg);
    if (_ctx === 'await_cardapio_cat') {
      _ctx = null;
      if (l.indexOf('sorvete') !== -1 || l.indexOf('massa') !== -1 || l.indexOf('bola') !== -1 || l.indexOf('sabor') !== -1) return _respSorvetes();
      if (l.indexOf('picol') !== -1)                                                                                           return _respPicoles();
      if (l.indexOf('acai') !== -1  || l.indexOf('acaí') !== -1)                                                              return _respAcai();
      if (l.indexOf('taca') !== -1  || l.indexOf('taça') !== -1 || l.indexOf('sobremesa') !== -1 || l.indexOf('brownie') !== -1) return _respTacas();
      if (l.indexOf('milk') !== -1  || l.indexOf('shake') !== -1)                                                             return _respMilkshake();
      if (l.indexOf('encomen') !== -1 || l.indexOf('festa') !== -1 || l.indexOf('caixa') !== -1 || l.indexOf('torta') !== -1) return _respEncomendas();
      // não reconhecido → mantém contexto e pede de novo
      _ctx = 'await_cardapio_cat';
      return { answer: 'N\u00e3o entendi a categoria \ud83d\ude05 Escolha uma op\u00e7\u00e3o:', chips: ['\ud83c\udf66 Sorvetes', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83c\udf60 Picol\u00e9s', '\ud83c\udf68 Ta\u00e7as', '\ud83e\udd64 Milkshakes', '\ud83d\udce6 Encomendas'] };
    }
    if (_ctx === 'await_promo_cat') {
      _ctx = null;
      if (l.indexOf('acai') !== -1 || l.indexOf('açai') !== -1)                                            return _respPromoAcai();
      if (l.indexOf('sorvete') !== -1 || l.indexOf('preco') !== -1 || l.indexOf('preço') !== -1)           return _respPromoSorvetes();
      return _respPromoAtiva();
    }
      _ctxData.nome = msg.trim();
      var prim = msg.trim().split(' ')[0];
      return { answer: '\u00d3timo, ' + prim + '! \ud83d\ude0a\n\nAgora me diga sua data de nascimento no formato DD/MM/AAAA:' };
    }
  }

  /* ─── Resposta principal (síncrona) ─── */
  function _itabotGetResp(msg) {
    var l = _norm(msg);

    // Contexto ativo
      var cr = _handleContexto(msg);
      if (cr) return cr;
    }

      _ctxData = {};
    }

    // Busca direta de sabor ("preço do sorvete de X", "tem sorvete de X", "flocos")
    if (l.indexOf('sorvete de') !== -1 || l.indexOf('preco do') !== -1 || l.indexOf('preço do') !== -1 || /\btem\b/.test(l)) {
      var sf = _buscarSabor(msg);
      if (sf) return sf;
    }

    // Cardápio → drill-down por categoria
    if (l === 'cardapio' || l === 'menu' || l.indexOf('cardapio') !== -1 || l.indexOf('card\u00e1pio') !== -1) {
      _ctx = 'await_cardapio_cat';
      return {
        answer: 'Que \u00f3timo! \ud83d\ude0b Qual categoria te interessa?',
        chips: ['\ud83c\udf66 Sorvetes de massa', '\ud83e\uded0 A\u00e7a\u00ed', '\ud83c\udf60 Picol\u00e9s', '\ud83c\udf68 Ta\u00e7as e Sobremesas', '\ud83e\udd64 Milkshakes', '\ud83d\udce6 Encomendas / Festas']
      };
    }

    // Promoções → drill-down por tipo
    if (l.indexOf('promo') !== -1 || l.indexOf('oferta') !== -1 || l.indexOf('desconto') !== -1) {
      if (_promoData && _promoData.ativo) return _respPromoAtiva();
      _ctx = 'await_promo_cat';
      return {
        answer: 'Temos op\u00e7\u00f5es incr\u00edveis! \ud83c\udf89 Sobre qual voc\u00ea quer saber?',
        chips: ['\ud83e\uded0 Pre\u00e7os do A\u00e7a\u00ed', '\ud83c\udf66 Pre\u00e7os de Sorvete', '\ud83c\udf81 Sorteio mensal', '\ud83c\udf89 Ver tudo']
      };
    }

    // Fidelidade
      return {
        linkHref: '',
      };
    }

    // 1) itaBotKnowledge
    for (var i = 0; i < itaBotKnowledge.length; i++) {
      var entry = itaBotKnowledge[i];
      for (var j = 0; j < entry.keywords.length; j++) {
        if (l.indexOf(_norm(entry.keywords[j])) !== -1) {
          return _itabotMontarResposta(entry);
        }
      }
    }

    // 2) RESPOSTAS fallback
    for (var k in RESPOSTAS) {
      if (k !== 'default' && l.indexOf(_norm(k)) !== -1) {
        var r = typeof RESPOSTAS[k] === 'function' ? RESPOSTAS[k]() : RESPOSTAS[k];
        return { answer: _norm(r) ? r.replace(/<[^>]*>/g, ' ').trim() : r };
      }
    }

    // 3) Tenta buscar sabor sem palavra-chave explícita
    if (_prodData) {
      var sf2 = _buscarSabor(msg);
      if (sf2) return sf2;
    }

    // 4) Default
    return {
      answer: 'N\u00e3o entendi direitinho \ud83d\ude05 Mas posso te ajudar com:',
      chips: ['\ud83c\udf66 Card\u00e1pio', '\ud83d\udce6 Encomendas', '\ud83c\udf89 Promo\u00e7\u00f5es', '\u2b50 Fidelidade', '\ud83d\udccd Localiza\u00e7\u00e3o', '\ud83d\udd59 Hor\u00e1rio', '\ud83d\udcac Atendente']
    };
  }

  /* ─── Enviar mensagem ─── */
  function _itabotEnviarChatComMsg(msgForcada) {
    var inp = document.getElementById('duvidas-pergunta');
    var msg = (msgForcada !== null && msgForcada !== undefined) ? String(msgForcada) : (inp ? inp.value.trim() : '');
    if (!msg) return;

    // Remove chips existentes
    var el = document.getElementById('duvidas-resposta');
    if (el) { var cs = el.querySelectorAll('.itabot-chips'); for (var i = 0; i < cs.length; i++) { cs[i].remove(); } }

    if (inp && (msgForcada === null || msgForcada === undefined)) inp.value = '';
    _itabotInserirMensagem('user', msg);
    _itabotMostrarTyping();

      _ctx = null;
      var nomeGuardado = _ctxData.nome || '';
      _buscarPontosAsync(nomeGuardado, msg);
      return;
    }

    var delay = 450 + Math.floor(Math.random() * 350);
    setTimeout(function () {
      _itabotOcultarTyping();
      _itabotInserirMensagem('bot', _itabotGetResp(msg));
    }, delay);
  }
  function _itabotEnviarChat() { _itabotEnviarChatComMsg(null); }
  window._itabotEnviarChat    = _itabotEnviarChat;
  window._itabotEnviarSug     = function (btn) { _itabotEnviarChatComMsg(btn.textContent); };
  window._itabotInserirKeyword = function (kw) {
    var inp = document.getElementById('duvidas-pergunta');
    if (inp) { inp.value = kw; inp.focus(); }
    _itabotEnviarChatComMsg(kw);
  };

  /* ─── RESPOSTAS estáticas ─── */
  var RESPOSTAS = {
    'horário':       '\ud83d\udd59 Funcionamos todos os dias, das 10h \u00e0s 22h, inclusive feriados.',
    'funciona':      '\ud83d\udd59 Funcionamos todos os dias, das 10h \u00e0s 22h, inclusive feriados.',
    'abre':          '\ud83d\udd59 Abrimos todos os dias \u00e0s 10h e fechamos \u00e0s 22h. Te esperamos!',
    'fecha':         '\ud83d\udd59 Fechamos \u00e0s 22h todos os dias. Venha antes! \ud83d\ude0a',
    'aberto':        '\ud83d\udd59 Funcionamos todos os dias, das 10h \u00e0s 22h, inclusive feriados.',
    'domingo':       '\ud83d\udd59 Sim! Abrimos tamb\u00e9m aos domingos, das 10h \u00e0s 22h. \ud83c\udf66',
    'feriado':       '\ud83d\udd59 Sim! Funcionamos em feriados, das 10h \u00e0s 22h.',
    'endereço':      '\ud83d\udccd Estamos na R. Cel. Manoel Caetano, 311 \u2013 Pra\u00e7a Largo S\u00e3o Bento \u2013 Centro, Cajuru/SP.',
    'localização':   '\ud83d\udccd R. Cel. Manoel Caetano, 311 \u2013 Centro, Cajuru/SP. Clique em "Ver no Mapa" no site!',
    'onde':          '\ud83d\udccd Estamos no centro de Cajuru/SP, na Pra\u00e7a Largo S\u00e3o Bento. R. Cel. Manoel Caetano, 311.',
    'mapa':          '\ud83d\udccd Busque "Sorveteria Itapolitana Cajuru" no Google Maps ou use o bot\u00e3o no site.',
    'cajuru':        '\ud83d\udccd Estamos em Cajuru/SP desde 2007! Atendemos tamb\u00e9m Santa Cruz da Esperan\u00e7a e C\u00e1ssia dos Coqueiros.',
    'whatsapp':      '\ud83d\udcf1 WhatsApp: (16) 99606-2046. Respondemos rapidinho! \ud83d\ude0a',
    'telefone':      '\ud83d\udcf1 WhatsApp: (16) 99606-2046. Chame para encomendas, d\u00favidas ou eventos!',
    'contato':       '\ud83d\udcf1 Fale conosco pelo WhatsApp: (16) 99606-2046.',
    'instagram':     '\ud83d\udcf8 Nos siga: @sorveteriaitapolitanacajuru',
    'sabor':         '\ud83c\udf66 Temos 35 sabores tipo artesanal! Destaques: Chocolate, Nutella, Leite Ninho, Morango Trufado, Ferrero Rocher, Pistache, Kinder Ovo e muito mais.',
    'sabores':       '\ud83c\udf66 Temos 35 sabores tipo artesanal! Digite o nome de um sabor para saber o pre\u00e7o.',
    'nutella':       '\ud83c\udf66 Sim! Temos sorvete de Nutella, Banana com Nutella, Sundae com Nutella e mais! \ud83d\ude0b',
    'chocolate':     '\ud83c\udf6b Temos Chocolate, Chocolate com Caf\u00e9, Bis e Trufa, Menta com Chocolate, Prest\u00edgio e Torta de Chocolate!',
    'leite ninho':   '\ud83e\udd5b Temos Leite Ninho, Leite Ninho Folheado e Leite Ninho com Oreo! Os favoritos das crian\u00e7as!',
    'morango':       '\ud83c\udf53 Temos Morango Trufado no sorvete e Morango Split nas ta\u00e7as!',
    'pistache':      '\ud83d\udfe2 Sim! Temos sorvete de Pistache \u2014 um dos sabores mais pedidos!',
    'diet':          '\ud83c\udf3f Sim! Sorvete Diet (1 bola R$ 10). Ideal para quem cuida da sa\u00fade!',
    'vegano':        '\ud83c\udf3f Para informa\u00e7\u00f5es sobre op\u00e7\u00f5es veganas, entre em contato pelo WhatsApp: (16) 99606-2046.',
    'lactose':       '\ud83c\udf3f Para op\u00e7\u00f5es sem lactose, fale pelo WhatsApp: (16) 99606-2046.',
    'preço':         '\ud83d\udcb0 Sorvetes a partir de R$ 8,00 \u00b7 Milkshakes a partir de R$ 17,00 \u00b7 A\u00e7a\u00ed a partir de R$ 15,00.',
    'preços':        '\ud83d\udcb0 Sorvetes a partir de R$ 8,00 \u00b7 Milkshakes a partir de R$ 17,00 \u00b7 A\u00e7a\u00ed a partir de R$ 15,00.',
    'quanto':        '\ud83d\udcb0 Sorvetes a partir de R$ 8,00 \u00b7 Milkshakes a partir de R$ 17,00 \u00b7 A\u00e7a\u00ed a partir de R$ 15,00 \u00b7 Picol\u00e9s a partir de R$ 2,50.',
    'pagamento':     '\ud83d\udcb3 Aceitamos Dinheiro, Pix, Cart\u00e3o de D\u00e9bito e Cr\u00e9dito. Encomendas exigem pagamento antecipado.',
    'pix':           '\ud83d\udcb3 Sim! Aceitamos Pix. Para encomendas, pagamento via Pix antecipado.',
    'cartão':        '\ud83d\udcb3 Sim! Aceitamos cart\u00e3o de d\u00e9bito e cr\u00e9dito. Tamb\u00e9m Pix e dinheiro.',
    'complemento':   '\ud83e\uded0 Complementos do a\u00e7a\u00ed: Frutas (R$ 2), Cremes Nutella/Ninho (R$ 3), Guloseimas (R$ 2), Chocolates Kit Kat/Oreo (R$ 4).',
    'atacado':       '\ud83d\udce6 Picol\u00e9s no atacado: m\u00ednimo 100 un., prazo de 3 dias \u00fateis, pagamento antecipado. (16) 99606-2046.',
    'prazo':         '\ud83d\udce6 O prazo m\u00ednimo para encomendas \u00e9 de 3 dias \u00fateis ap\u00f3s confirma\u00e7\u00e3o e pagamento.',
    'torta':         '\ud83c\udf82 Torta de Sorvete R$ 100 com at\u00e9 3 sabores. Encomende com 3 dias de anteced\u00eancia!',
    'caixa':         '\ud83c\udf66 Caixas de 5L (a partir de R$ 100) e 10L (a partir de R$ 150) com 2 ou 3 sabores. Perfeito para festas!',
    'isopor':        '\ud83c\udf66 Is\u00f3pores para viagem: 4 bolas (R$ 25), 7 bolas (R$ 30), 9 bolas (R$ 40), 12 bolas (R$ 50).',
    'taça':          '\ud83c\udf68 Ta\u00e7as especiais: Colegial R$ 20, Sundae R$ 23, Banana Split R$ 25, Ula-Ula R$ 48 e muito mais!',
    'sundae':        '\ud83c\udf68 Sundae R$ 23,00 e Sundae com Nutella R$ 28,00.',
    'brownie':       '\ud83e\udd6e Brownie com Sorvete: 1 bola R$ 20 \u00b7 2 bolas R$ 25.',
    'fondue':        '\ud83e\udd6e Fondue de Sorvete R$ 25. Perfeito para compartilhar!',
    'evento':        '\ud83c\udfaa Temos Carrinho para Eventos! Consulte pelo WhatsApp: (16) 99606-2046.',
    'festa':         '\ud83c\udf89 Fazemos encomendas para festas: Torta, Caixas, Picol\u00e9s no atacado e Carrinho para Eventos!',
    'sorteio':       '\ud83c\udf81 Sorteio mensal gratuito! Cadastre-se na p\u00e1gina de Promo\u00e7\u00e3o no menu. Boa sorte! \ud83c\udf40',
    'delivery':      '\ud83d\udeab N\u00e3o fazemos delivery. Encomende e retire na loja em Cajuru/SP.',
    'entrega':       '\ud83d\udeab N\u00e3o fazemos delivery. Para encomendas, a retirada \u00e9 na loja.',
    'artesanal':     '\ud83c\udf66 Nossos sorvetes s\u00e3o tipo artesanal \u2014 cremosos, em bolas redondas, com 35 sabores incr\u00edveis!',
    'anos':          '\ud83c\udf66 A Sorveteria Itapolitana est\u00e1 em Cajuru desde 2007 \u2014 mais de 19 anos!',
    'historia':      '\ud83c\udf66 Fundada em 2007 em Cajuru/SP, mais de 19 anos de tradi\u00e7\u00e3o!',
  };

  /* ─── BASE DE CONHECIMENTO DO ITA BOT ─── */
  var itaBotKnowledge = [
    {
      keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'iniciar', 'inicio', 'início', 'menu', 'opções', 'opcoes', 'começo'],
      chips: ['\ud83c\udf66 Card\u00e1pio', '\ud83d\udce6 Encomendas', '\ud83c\udf89 Promo\u00e7\u00f5es', '\u2b50 Fidelidade', '\ud83d\udccd Localiza\u00e7\u00e3o', '\ud83d\udd59 Hor\u00e1rio']
    },
    {
      keywords: ['fazer pedido', 'pedido', 'pedir', 'comprar', 'quero pedir', 'zap', 'whatsapp', 'whats', 'número', 'numero', 'chamar'],
      answer: 'Para fazer seu pedido, chame a gente no WhatsApp:',
      linkText: '\ud83d\udcac Fazer pedido no WhatsApp',
      linkHref: 'https://wa.me/5516996062046?text=Ol%C3%A1%2C+quero+fazer+um+pedido+na+Sorveteria+Itapolitana',
      external: true,
      linkText2: '\ud83c\udf66 Ver card\u00e1pio',
      linkHref2: 'encomendas.html'
    },
    {
      keywords: ['localização', 'localizacao', 'endereço', 'endereco', 'onde fica', 'como chegar', 'como ir', 'mapa', 'maps', 'waze'],
      answer: 'Estamos aqui: R. Cel. Manoel Caetano, 311 \u2013 Pra\u00e7a Largo S\u00e3o Bento \u2013 Centro, Cajuru/SP.',
      linkText: '\ud83d\udccd Abrir no Google Maps',
      linkHref: 'https://www.google.com/maps/place/Sorveteria+A%C3%A7aiteria+Itapolitana+Cajuru/@-21.2776766,-47.3071817',
      external: true
    },
    {
      keywords: ['horário', 'horario', 'horas', 'que horas abre', 'que horas fecha', 'funcionamento', 'dias de funcionamento'],
      answer: '\ud83d\udd59 Funcionamos todos os dias, das 10h \u00e0s 22h (incluindo s\u00e1bados, domingos e feriados).',
      chips: ['\ud83d\udccd Localiza\u00e7\u00e3o', '\ud83d\udcf1 WhatsApp', '\ud83c\udf66 Card\u00e1pio']
    },
    {
      answer: 'O programa de fidelidade está temporariamente indisponível. Fale conosco pelo WhatsApp! 💬',
      linkHref: ''
    },
    {
      linkText: '\ud83c\udf9f Registrar c\u00f3digo',
      linkHref: ''
    },
    {
      linkHref: ''
    },
    {
      keywords: ['falar com atendente', 'falar com humano', 'falar com pessoa', 'atendimento humano', 'quero falar com alguem'],
      answer: 'Sem problemas! Vou te passar direto para nossa equipe. \ud83d\ude0a',
      linkText: '\ud83d\udcac Falar com atendente',
      linkHref: 'https://wa.me/5516996062046?text=Ol%C3%A1%2C+vim+pelo+site+da+Sorveteria+Itapolitana+e+quero+falar+com+um+atendente',
      external: true
    },
    {
      keywords: ['instagram', 'insta', 'facebook', 'redes sociais', 'seguir'],
      answer: 'Acompanhe as novidades nas redes sociais:',
      linkText: '\ud83d\udcf8 Instagram',
      linkHref: 'https://www.instagram.com/sorveteriaitapolitanacajuru',
      external: true,
      linkText2: '\ud83d\udcd8 Facebook',
      linkHref2: 'https://www.facebook.com/itapolitanacajuru/',
      external2: true
    },
    {
      keywords: ['sobre vocês', 'sobre voces', 'quem são vocês', 'história', 'historia', 'quem somos', 'sobre a sorveteria'],
      answer: 'A Sorveteria Itapolitana prepara sorvetes, a\u00e7a\u00eds e milkshakes com receitas especiais desde 2007 para Cajuru e regi\u00e3o.',
      linkText: '\ud83c\udfea Sobre a loja',
      linkHref: 'sobre.html'
    }
  ];

  /* Monta payload de resposta do bot. */
  function _itabotMontarResposta(entry) {
    return {
      answer:    entry.answer    || '',
      linkText:  entry.linkText  || '',
      linkHref:  entry.linkHref  || '',
      external:  !!entry.external,
      linkText2: entry.linkText2 || '',
      linkHref2: entry.linkHref2 || '',
      external2: !!entry.external2,
      chips:     entry.chips     || []
    };
  }

  /* ─── Carrega FAQs dos JSON e mescla em RESPOSTAS ─── */
  (function () {
    var arquivos = [
      _base + 'dados/faq_horarios_localizacao.json',
      _base + 'dados/faq_cardapio.json',
      _base + 'dados/faq_encomendas.json',
      _base + 'dados/faq_sorteio_promocoes.json'
    ];
    arquivos.forEach(function (url) {
      fetch(url + '?v=' + Date.now())
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (faq) {
          if (!faq || !Array.isArray(faq.perguntas)) return;
          faq.perguntas.forEach(function (p) {
            if (!p.tags || !p.resposta) return;
            p.tags.forEach(function (tag) {
              var chave = _norm(tag);
              if (typeof RESPOSTAS[chave] !== 'function') RESPOSTAS[chave] = p.resposta;
            });
          });
        });
    });
  }());

  /* ─── Conecta o botão Dúvidas do topo ao chat Ita Bot ─── */
  function _itabotPosicionarAoLadoDoLogo() {
    var staticTop = document.querySelector('.itap-header-top');
    if (staticTop) {
      var staticDuvidasBtn = staticTop.querySelector('.ita-bot-duvidas-btn, #ita-bot-duvidas');
      if (staticDuvidasBtn) staticDuvidasBtn.onclick = _itabotAbrirItaBot;
      return;
    }
    var wrap = document.getElementById('itabot-wrap');
    var headerInner = document.querySelector('.itap-header-inner, .itap-header');
    if (!headerInner) return;
    var top = document.createElement('div');
    top.className = 'itap-header-top';
    var duvidasDiv = document.createElement('div');
    duvidasDiv.className = 'itap-header-duvidas';
    var duvidasBtn = document.createElement('button');
    duvidasBtn.type = 'button';
    duvidasBtn.className = 'ita-bot-duvidas-btn';
    duvidasBtn.setAttribute('aria-label', 'Dúvidas — Ita Bot');
    duvidasBtn.setAttribute('aria-haspopup', 'dialog');
    duvidasBtn.textContent = '\ud83d\udcac D\u00daVIDAS';
    duvidasBtn.onclick = _itabotAbrirItaBot;
    duvidasDiv.appendChild(duvidasBtn);
    top.appendChild(duvidasDiv);
    headerInner.insertBefore(top, headerInner.firstChild);
    if (wrap) { var oldBtn = wrap.querySelector('.itabot-duvidas-btn'); if (oldBtn) oldBtn.style.display = 'none'; }
  }
  _itabotPosicionarAoLadoDoLogo();

}());
