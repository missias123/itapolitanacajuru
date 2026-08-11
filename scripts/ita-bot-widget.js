/* 
 * ITA BOT WIDGET — Sorveteria Itapolitana
 * Assistente virtual interativo para todas as páginas do site.
 * Auto-injeta CSS, HTML e lógica do chat.
 */
(function () {
  'use strict';

  // Se já existir um diálogo de chat, não faz nada para evitar duplicação
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
  var _ctxData    = {};     // dados acumulados no contexto
  var _ctx        = null;   // estado de contexto conversacional
  var _prodData   = null;   // cache de dados/produtos.json
  var _promoData  = null;   // cache de dados/promo.json
  var _saudacao   = false;  // flag: saudação inicial já mostrada
  var _scrollY    = 0;      // para page-lock
  var _engine     = null;   // instância do motor compartilhado (ItaBotEngine)

  /* ─── Instanciar motor compartilhado (se disponível) ─── */
  if (window.ItaBotEngine) {
    _engine = window.ItaBotEngine.createEngine();
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
      '#chat-dialog { display:none; position:fixed; inset:0; width:100%; height:100dvh; z-index:100000; background:rgba(0,0,0,0.55); overflow:hidden; align-items:center; justify-content:center; }',
      '#chat-dialog.aberto { display:flex; }',
      '.chat-box { width:95%; max-width:460px; height:90dvh; background:#fff; border-radius:28px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 18px 50px rgba(0,0,0,0.32); position:relative; }',
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
      '.itabot-link-btn { display:block; background:#f5f5f5; color:#E8000D; padding:10px; border-radius:12px; margin-top:8px; text-align:center; font-weight:700; text-decoration:none; border:1px solid #eee; }'
    ].join('');
    document.head.appendChild(style);
  }

  /* ─── Injeção de HTML ─── */
  function _itabotInjetarHtml() {
    if (document.getElementById('chat-dialog')) return;
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
    
    if (typeof conteudo === 'string') {
      div.innerHTML = conteudo;
    } else if (conteudo.answer) {
      div.innerHTML = conteudo.answer;
      if (conteudo.chips) {
        _itabotRenderizarChips(conteudo.chips);
      }
    }
    
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
      _itabotOcultarTyping();
      var resp = _itabotGetResp(texto);
      _itabotInserirMensagem('bot', resp);
    }, 600 + Math.random() * 600);
  }

  function _itabotGetResp(texto) {
    if (_engine) {
      var r = _engine.getResponse(texto);
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

  /* ─── Inicialização ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _itabotBindTriggers);
  } else {
    _itabotBindTriggers();
  }

  // Exportar globalmente para fallback
  window.abrirItaBot = _itabotAbrirItaBot;
  window.abrirChat = _itabotAbrirItaBot;

})();
