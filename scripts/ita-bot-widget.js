/**
 * ITA BOT WIDGET — Sorveteria Itapolitana
 * Robô de dúvidas flutuante para todas as páginas do site.
 * Auto-injeta CSS, HTML e lógica do chat.
 * Não duplica se #chat-dialog já existir (index.html).
 */
(function () {
  'use strict';

  // Não injeta se o widget já estiver na página (index.html)
  if (document.getElementById('chat-dialog')) return;

  /* ─── Detecta raiz do site para construir paths ─── */
  var _base = (function () {
    var scripts = document.querySelectorAll('script[src*="ita-bot-widget"]');
    if (scripts.length) {
      return scripts[scripts.length - 1].src.replace(/scripts\/ita-bot-widget\.js.*$/, '');
    }
    return '';
  })();

  var APP_BOTTOM_BAR_HEIGHT = 56; // altura da barra inferior
  document.documentElement.style.setProperty('--itabot-app-bottom-bar-height', APP_BOTTOM_BAR_HEIGHT + 'px');

  /* ─── CSS ─── */
  var css = `
.itabot-wrap{display:none;position:fixed;bottom:18px;right:8px;z-index:9996;flex-direction:column;align-items:flex-end;gap:0}
@media(max-width:600px){.itabot-wrap{bottom:14px;right:10px}}
@media(min-width:601px){.itabot-wrap{bottom:18px;right:12px}}
@media(min-width:768px){.itabot-wrap{bottom:24px;right:24px}}
.duvidas-card{background:#fff;border-radius:22px;padding:10px 12px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;border:2.5px solid #FFD600;min-width:88px;cursor:pointer;filter:drop-shadow(0 6px 20px rgba(232,0,13,.30));transition:filter .2s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.duvidas-card:hover{filter:drop-shadow(0 8px 26px rgba(232,0,13,.45))}
.duvidas-card-logo{font-size:9px;font-weight:900;color:#C62828;letter-spacing:.5px;text-transform:uppercase;text-align:center;line-height:1.1;padding:0 2px}
.duvidas-btn{background:linear-gradient(135deg,#FF2020,#E8000D,#C62828);color:#fff;border:none;border-radius:11px;padding:9px 14px;font-size:13px;font-weight:900;letter-spacing:1.5px;cursor:pointer;width:100%;text-align:center;animation:duvidas-pulse 1.5s ease-in-out infinite;touch-action:manipulation;margin:0;display:block;text-shadow:0 1px 3px rgba(0,0,0,.35);position:relative;overflow:hidden}
.duvidas-btn::after{content:'';position:absolute;top:0;left:-70%;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:duvidas-shine 1.5s ease-in-out infinite;pointer-events:none}
@keyframes duvidas-pulse{0%,100%{transform:scale(1);box-shadow:0 4px 14px rgba(232,0,13,.55)}50%{transform:scale(1.04);box-shadow:0 6px 18px rgba(232,0,13,.75)}}
@keyframes duvidas-shine{0%{left:-70%}60%,100%{left:130%}}
@media(prefers-reduced-motion:reduce){.duvidas-btn,.duvidas-btn::after{animation:none}.duvidas-btn{box-shadow:0 4px 14px rgba(232,0,13,.55)}}
.duvidas-chips-wrap{padding:8px 14px 10px;background:#FAFAFA;border-top:1px solid #F3F4F6;flex-shrink:0}
.duvidas-chips-label{font-size:10px;color:#999;font-weight:700;margin-bottom:6px;letter-spacing:.3px;text-transform:uppercase;display:block}
.duvidas-chips-row{display:flex;gap:6px;flex-wrap:wrap}
.duvidas-chip{background:#FFF5F5;color:#C62828;border:1.5px solid #FFCDD2;border-radius:22px;padding:6px 11px;font-size:11px;font-weight:800;cursor:pointer;letter-spacing:.5px;text-transform:uppercase;transition:background .15s,transform .1s,border-color .15s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;flex-shrink:0;min-height:34px}
.duvidas-chip:hover,.duvidas-chip:focus-visible{background:#FFEBEE;border-color:#E8000D;transform:translateY(-1px);outline:2px solid #E8000D;outline-offset:1px}
.duvidas-chip:active{transform:scale(.95)}
#chat-dialog{display:none;position:fixed;inset:0;width:100%;height:100%;z-index:10000;background:rgba(0,0,0,.55);overflow:hidden}
#chat-dialog.aberto{display:flex;animation:duvidaFadeIn .22s ease-out}
@keyframes duvidaFadeIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
@media(prefers-reduced-motion:reduce){@keyframes duvidaFadeIn{from{opacity:0}to{opacity:1}}}
.chat-box{background:#fff;border-radius:0;width:100%;max-width:100%;height:100dvh;display:flex;flex-direction:column}
.chat-hdr{background:linear-gradient(135deg,#FF6B35,#C62828);color:#fff;padding:10px 16px 12px;border-radius:0;display:flex;flex-direction:column;gap:8px}
.chat-hdr-logo-row{display:flex;align-items:center;justify-content:center;gap:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.22)}
.chat-hdr-logo-img{width:46px;height:46px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px #fff,0 0 0 4px #FBD100;flex-shrink:0}
.chat-hdr-logo-text{font-size:13px;font-weight:900;color:#FBD100;letter-spacing:1.5px;text-transform:uppercase;text-shadow:0 1px 4px rgba(0,0,0,.4)}
.chat-hdr-main-row{display:flex;align-items:center;justify-content:space-between}
.chat-hdr-btns{display:flex;flex-direction:column;gap:5px;align-items:flex-end;flex-shrink:0}
.chat-btn-home{background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.55);border-radius:8px;color:#fff;font-size:10px;font-weight:900;padding:4px 8px;cursor:pointer;letter-spacing:.8px;white-space:nowrap;text-transform:uppercase;touch-action:manipulation}
.chat-btn-home:hover{background:rgba(255,255,255,.32)}
.chat-hdr h3{font-size:16px;font-weight:800}
.chat-hdr p{font-size:11px;color:#fff;font-weight:600}
.chat-close{background:rgba(255,255,255,.2);border:none;border-radius:50%;width:48px;height:48px;color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.chat-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
.msg{max-width:80%;padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.5;animation:msg-slide .22s ease-out}
@keyframes msg-slide{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
.msg.bot{background:#F3F4F6;color:#111827;align-self:flex-start;border-bottom-left-radius:4px}
.msg.bot a{color:#E8000D;font-weight:800;text-decoration:none}
.msg.user{background:linear-gradient(135deg,#FF6B35,#E8000D);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.chat-typing{background:#F3F4F6;align-self:flex-start;padding:12px 16px;border-radius:16px;display:none;gap:5px;align-items:center;border-bottom-left-radius:4px}
.chat-typing.show{display:flex}
.chat-typing span{width:7px;height:7px;border-radius:50%;background:#aaa;animation:dot-jump 1.2s infinite}
.chat-typing span:nth-child(2){animation-delay:.18s}
.chat-typing span:nth-child(3){animation-delay:.36s}
@keyframes dot-jump{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
.chat-inp-row{padding:12px 16px;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));display:flex;gap:8px;border-top:1px solid #F3F4F6}
.chat-inp{flex:1;padding:12px 16px;border:2px solid #F3F4F6;border-radius:14px;font-size:16px;outline:none;transition:border-color .2s;box-sizing:border-box}
.chat-inp:focus{border-color:#0D47A1;box-shadow:0 0 0 3px rgba(13,71,161,.2)}
.chat-send{background:linear-gradient(135deg,#FF6B35,#E8000D);color:#fff;border:none;border-radius:50%;width:48px;height:48px;font-size:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;box-shadow:0 4px 12px rgba(232,0,13,.25);transition:transform .1s}
.chat-send:active{transform:scale(.95)}
.sug{background:#FFF3E0;color:#BF360C;border:2px solid #E64A19;border-radius:20px;padding:8px 14px;font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer;flex-shrink:0;min-height:36px}
:root{--itabot-app-bottom-bar-height:56px;--itabot-chat-bottom-safe:calc(var(--itabot-app-bottom-bar-height) + env(safe-area-inset-bottom,0px));--itabot-logo-size:80px}
/* Ajuste de posição do Ita Bot para não sobrepor a barra inferior do app (tabs) */
.itabot-top-row{display:flex;align-items:center;justify-content:center;gap:12px;width:100%}
.itabot-top-row .itap-brand-icon,.itabot-top-row .brand-icon{width:var(--itabot-logo-size);min-width:var(--itabot-logo-size);margin:0;display:flex;align-items:center;justify-content:center}
.itabot-top-row .itap-brand-icon img,.itabot-top-row .brand-icon img{width:var(--itabot-logo-size);height:var(--itabot-logo-size)}
.itabot-wrap{position:static;top:auto;right:auto;bottom:auto;display:none;align-items:center;justify-content:center;flex:0 0 auto;width:var(--itabot-logo-size);min-width:var(--itabot-logo-size)}
.duvidas-card{width:var(--itabot-logo-size);height:var(--itabot-logo-size);min-width:var(--itabot-logo-size);padding:0;display:flex;align-items:center;justify-content:center;background:transparent;border:none;box-shadow:none;filter:none;animation:none;overflow:visible;transform:none}
.duvidas-card::before{display:none}
.duvidas-card:hover{transform:none;box-shadow:none;filter:none}
.duvidas-card svg{width:100%;height:100%;display:block;transform-origin:center bottom;animation:itabot-sway 1.9s ease-in-out infinite;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 8px rgba(0,234,255,.92)) drop-shadow(0 0 16px rgba(0,234,255,.55))}
.duvidas-card-logo,.duvidas-btn{display:none}
@keyframes itabot-sway{0%,100%{transform:translateY(0) rotate(-4deg) scale(1)}50%{transform:translateY(-2px) rotate(4deg) scale(1.03)}}
@media(prefers-reduced-motion:reduce){.duvidas-card svg{animation:none}}
#chat-dialog{inset:0 0 var(--itabot-chat-bottom-safe) 0;height:auto}
.chat-box{border-radius:24px 24px 0 0;height:100%;overflow:hidden}
.chat-msgs{padding-bottom:20px}
.chat-footer{background:linear-gradient(135deg,#0060B0,#0292EC);color:#fff;text-align:center;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0px));border-top:3px solid #FBD100;flex-shrink:0}
.chat-footer-title{font-size:11px;font-weight:900;color:#FBD100;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
.chat-footer-wa{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 16px;border-radius:999px;background:rgba(37,211,102,.18);border:1px solid rgba(37,211,102,.78);color:#fff;font-size:12px;font-weight:900;text-decoration:none}
.chat-footer-copy{font-size:10px;color:rgba(255,255,255,.76);font-weight:700;margin-top:8px;line-height:1.4}
@media(max-width:600px){:root{--itabot-logo-size:76px}.itabot-top-row{gap:10px}}
@media(min-width:601px){:root{--itabot-logo-size:90px}.itabot-top-row{gap:14px}}
@media(min-width:768px){:root{--itabot-chat-bottom-safe:env(safe-area-inset-bottom,0px)}#chat-dialog{inset:0;padding:18px 24px 24px;align-items:flex-start;justify-content:flex-end}.chat-box{max-width:420px;height:min(720px,calc(100dvh - 42px));border-radius:28px;box-shadow:0 18px 50px rgba(0,0,0,.32)}}
`;

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ─── HTML ─── */
  var logoSrc = _base + 'images/logo.webp';

  var html = `
<div class="itabot-wrap" id="itabot-wrap">
  <span class="itabot-badge" id="itabot-badge" aria-hidden="true" style="display:none"></span>
  <div class="itabot-bubble" id="itabot-bubble" aria-hidden="true" style="display:none"></div>
  <button type="button" id="chat-fab-btn" class="duvidas-card"
      onclick="_itabotAbrirItaBot()"
      aria-label="Clique para tirar suas dúvidas sobre sorvetes, açaí e encomendas."
      aria-haspopup="dialog">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 82" width="80" height="66" aria-hidden="true">
      <rect x="2" y="21" width="5" height="15" rx="2.5" fill="#D0D0E0"/>
      <rect x="51" y="21" width="5" height="15" rx="2.5" fill="#D0D0E0"/>
      <rect x="7" y="13" width="44" height="36" rx="11" fill="#E8E8F8"/>
      <rect x="7" y="13" width="44" height="13" rx="11" fill="white" opacity=".22"/>
      <rect x="25" y="7" width="6" height="7" rx="2.5" fill="#C8C8D8"/>
      <circle cx="28" cy="6" r="5.5" fill="#FFD700" stroke="#E8C000" stroke-width=".8"/>
      <circle cx="26" cy="4.5" r="1.8" fill="white" opacity=".55"/>
      <rect x="11" y="22" width="14" height="11" rx="3.5" fill="#1A1A2E"/>
      <rect x="13" y="24" width="10" height="7" rx="2.5" fill="#E8000D"/>
      <circle cx="15" cy="26" r="2" fill="white" opacity=".85"/>
      <rect x="31" y="22" width="14" height="11" rx="3.5" fill="#1A1A2E"/>
      <rect x="33" y="24" width="10" height="7" rx="2.5" fill="#E8000D"/>
      <circle cx="35" cy="26" r="2" fill="white" opacity=".85"/>
      <circle cx="29" cy="37" r="2.5" fill="#C0C0D0"/>
      <path d="M16,43 Q29,52 42,43" stroke="#1A1A2E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M20,45 Q29,49 38,45" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="9" cy="34" r="5" fill="#FFB0C8" opacity=".38"/>
      <circle cx="49" cy="34" r="5" fill="#FFB0C8" opacity=".38"/>
      <rect x="11" y="47" width="36" height="24" rx="8" fill="#D0D0E0"/>
      <circle cx="29" cy="59" r="5" fill="#B8B8CC"/>
      <rect x="45" y="47" width="22" height="8" rx="4" fill="#D0D0E0"/>
      <polygon points="62,54 90,54 76,80" fill="#DBA87A"/>
      <line x1="76" y1="54" x2="70" y2="79" stroke="#C8945A" stroke-width=".7" opacity=".5"/>
      <line x1="76" y1="54" x2="82" y2="79" stroke="#C8945A" stroke-width=".7" opacity=".5"/>
      <ellipse cx="76" cy="43" rx="14" ry="11" fill="#F7B73B"/>
      <ellipse cx="75" cy="30" rx="12" ry="10" fill="#EF5350"/>
      <ellipse cx="76" cy="18" rx="9" ry="8" fill="#F9C6D0"/>
      <ellipse cx="73" cy="15" rx="3" ry="2" fill="white" opacity=".5"/>
    </svg>
  </button>
</div>

<div id="chat-dialog" role="dialog" aria-modal="false" aria-labelledby="chat-hdr-titulo" aria-hidden="true">
<div class="chat-box">
<div class="chat-hdr">
  <div class="chat-hdr-logo-row">
    <img src="${logoSrc}" alt="Logo Sorveteria Itapolitana" class="chat-hdr-logo-img" loading="lazy" decoding="async">
    <div>
      <div class="chat-hdr-logo-text">Itapolitana</div>
      <div style="font-size:9px;color:rgba(255,255,255,.8);font-weight:700;letter-spacing:.8px;">Cajuru · SP · Sorvete Artesanal</div>
    </div>
  </div>
  <div class="chat-hdr-main-row">
    <div style="display:flex;align-items:center;gap:11px">
      <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 27 68 57" width="36" height="36" aria-hidden="true">
          <rect x="2" y="48" width="6" height="18" rx="3" fill="#D0D0E0"/>
          <rect x="3" y="52" width="4" height="10" rx="2" fill="#B8B8CC"/>
          <rect x="58" y="48" width="6" height="18" rx="3" fill="#D0D0E0"/>
          <rect x="59" y="52" width="4" height="10" rx="2" fill="#B8B8CC"/>
          <rect x="8" y="40" width="50" height="40" rx="13" fill="#E8E8F8"/>
          <rect x="8" y="40" width="50" height="16" rx="13" fill="white" opacity=".22"/>
          <rect x="8" y="53" width="50" height="3" fill="#E8E8F8"/>
          <rect x="30" y="34" width="7" height="8" rx="2.5" fill="#C8C8D8"/>
          <circle cx="33" cy="33" r="5.5" fill="#FFD700" stroke="#E8C000" stroke-width=".8"/>
          <circle cx="31.5" cy="31.5" r="1.8" fill="white" opacity=".55"/>
          <rect x="15" y="49" width="15" height="12" rx="4" fill="#1A1A2E"/>
          <rect x="17" y="51" width="11" height="8" rx="3" fill="#FF6B35"/>
          <circle cx="19" cy="53" r="2" fill="white" opacity=".8"/>
          <rect x="36" y="49" width="15" height="12" rx="4" fill="#1A1A2E"/>
          <rect x="38" y="51" width="11" height="8" rx="3" fill="#FF6B35"/>
          <circle cx="40" cy="53" r="2" fill="white" opacity=".8"/>
          <circle cx="33" cy="65" r="2.5" fill="#C0C0D0"/>
          <path d="M19,71 Q33,80 47,71" stroke="#1A1A2E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M23,73 Q33,77 43,73" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="12" cy="61" r="5.5" fill="#FFB0C8" opacity=".38"/>
          <circle cx="54" cy="61" r="5.5" fill="#FFB0C8" opacity=".38"/>
        </svg>
      </div>
      <div>
        <h3 id="chat-hdr-titulo" style="font-size:15px;font-weight:900;margin:0;color:#fff">🤖 DÚVIDAS — Ita Bot</h3>
        <p id="chat-hdr-sub" style="font-size:11px;margin:0;color:rgba(255,255,255,.85)">Pergunte sobre sabores, horários, encomendas e muito mais</p>
      </div>
    </div>
    <div class="chat-hdr-btns">
      <button class="chat-close" onclick="_itabotFecharChatDialog()" type="button" aria-label="Fechar chat">✕</button>
      <button class="chat-btn-home" onclick="_itabotFecharChatDialog();window.location.href='${_base}index.html'" type="button" aria-label="Voltar para página inicial">🏠 Início</button>
    </div>
  </div>
</div>
<div class="chat-msgs" id="chat-msgs">
  <div class="msg bot" id="chat-msg-inicio">Olá! 👋 Sou o <strong>Ita Bot</strong>, assistente da Sorveteria Itapolitana! 🍦<br><br>Digite uma palavra e respondo na hora 👇<br><small style="color:#888;font-size:11px">Ex: horário · sabores · preço · picolé · açaí · encomenda · localização</small></div>
</div>
<div class="chat-typing" id="chat-typing"><span></span><span></span><span></span></div>
<div id="chat-sugs-container" style="display:flex;gap:8px;padding:10px 12px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;-ms-overflow-style:none;border-top:1px solid #F3F4F6">
  <button class="sug" onclick="_itabotEnviarSug(this)" type="button">Horário</button>
  <button class="sug" onclick="_itabotEnviarSug(this)" type="button">Como encomendar</button>
  <button class="sug" onclick="_itabotEnviarSug(this)" type="button">Sabores</button>
  <button class="sug" onclick="_itabotEnviarSug(this)" type="button">Preços</button>
  <button class="sug" onclick="_itabotEnviarSug(this)" type="button">Localização</button>
  <button class="sug" onclick="_itabotEnviarSug(this)" type="button">Picolés</button>
</div>
<div class="duvidas-chips-wrap" id="duvidas-chips-wrap">
  <span class="duvidas-chips-label">Pergunte sobre:</span>
  <div class="duvidas-chips-row" role="group" aria-label="Temas de dúvidas rápidas">
    <button class="duvidas-chip" onclick="_itabotInserirKeyword('sabores')" type="button">SABORES</button>
    <button class="duvidas-chip" onclick="_itabotInserirKeyword('horário')" type="button">HORÁRIO</button>
    <button class="duvidas-chip" onclick="_itabotInserirKeyword('encomendas')" type="button">ENCOMENDAS</button>
    <button class="duvidas-chip" onclick="_itabotInserirKeyword('localização')" type="button">LOCALIZAÇÃO</button>
    <button class="duvidas-chip" onclick="_itabotInserirKeyword('whatsapp')" type="button">WHATSAPP</button>
    <button class="duvidas-chip" onclick="_itabotInserirKeyword('pagamento')" type="button">PAGAMENTOS</button>
    <button class="duvidas-chip" onclick="_itabotInserirKeyword('promoção')" type="button">PROMOÇÕES</button>
    <button class="duvidas-chip" onclick="_itabotInserirKeyword('artesanal')" type="button">ARTESANAL</button>
  </div>
</div>
<div class="chat-inp-row">
  <input class="chat-inp" id="chat-inp" onkeydown="if(event.key==='Enter')_itabotEnviarChat()" placeholder="Digite sua dúvida aqui…" type="text" autocomplete="off" spellcheck="false" aria-label="Digite sua dúvida"/>
  <button class="chat-send" onclick="_itabotEnviarChat()" type="button" aria-label="Enviar mensagem">➤</button>
</div>
<!-- Ajuste de posição do Ita Bot para não sobrepor a barra inferior do app (tabs) -->
<!-- Navegação duplicada removida: o chat mantém só o CTA útil de atendimento humano -->
<div class="chat-footer"> 
  <div class="chat-footer-title">Atendimento humano</div>
  <a href="https://wa.me/5516996062046" target="_blank" rel="noopener" class="chat-footer-wa">💬 Continuar no WhatsApp</a>
  <div class="chat-footer-copy">Todos os dias, das 10h às 22h · 🚫 Não fazemos delivery · Encomende e retire na loja</div>
</div>
</div>
</div>`;

  var container = document.createElement('div');
  container.innerHTML = html;
  while (container.firstChild) {
    document.body.appendChild(container.firstChild);
  }

  /* ─── Fechar ao clicar fora (backdrop) ou ESC ─── */
  document.addEventListener('click', function (e) {
    var cd = document.getElementById('chat-dialog');
    if (cd && cd.classList.contains('aberto') && e.target === cd) {
      _itabotFecharChatDialog();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var cd = document.getElementById('chat-dialog');
      if (cd && cd.classList.contains('aberto')) { _itabotFecharChatDialog(); e.preventDefault(); }
    }
  });

  /* ─── Page-lock helpers ─── */
  var _scrollY = 0;
  function _itabotTravarPagina() {
    if (document.body.style.position === 'fixed') return;
    _scrollY = window.scrollY;
    document.body.style.position  = 'fixed';
    document.body.style.top       = '-' + _scrollY + 'px';
    document.body.style.width     = '100%';
    document.body.style.overflowY = 'scroll';
  }
  function _itabotLiberarPagina() {
    if (document.body.style.position !== 'fixed') return;
    document.body.style.position  = '';
    document.body.style.top       = '';
    document.body.style.width     = '';
    document.body.style.overflowY = '';
    window.scrollTo(0, _scrollY);
  }

  /* ─── Chat open/close ─── */
  function _itabotAbrirItaBot() {
    var d = document.getElementById('chat-dialog');
    if (d) { d.classList.add('aberto'); d.removeAttribute('aria-hidden'); d.setAttribute('aria-modal', 'true'); _itabotTravarPagina(); }
    setTimeout(function () {
      var inp = document.getElementById('chat-inp');
      if (inp) inp.focus();
    }, 120);
  }
  function _itabotFecharChatDialog() {
    var d = document.getElementById('chat-dialog');
    if (d) { d.classList.remove('aberto'); d.setAttribute('aria-hidden', 'true'); d.setAttribute('aria-modal', 'false'); _itabotLiberarPagina(); }
  }
  window._itabotAbrirItaBot = _itabotAbrirItaBot;
  window._itabotFecharChatDialog = _itabotFecharChatDialog;

  /* ─── RESPOSTAS ─── */
  var RESPOSTAS = {
    'horário':       '🕙 Funcionamos todos os dias, das 10h às 22h, inclusive feriados.',
    'funciona':      '🕙 Funcionamos todos os dias, das 10h às 22h, inclusive feriados.',
    'abre':          '🕙 Abrimos todos os dias às 10h e fechamos às 22h. Te esperamos!',
    'fecha':         '🕙 Fechamos às 22h todos os dias. Venha antes! 😊',
    'aberto':        '🕙 Funcionamos todos os dias, das 10h às 22h, inclusive feriados.',
    'domingo':       '🕙 Sim! Abrimos também aos domingos, das 10h às 22h. 🍦',
    'feriado':       '🕙 Sim! Funcionamos em feriados, das 10h às 22h.',
    'endereço':      '📍 Estamos na R. Cel. Manoel Caetano, 311 – Pça Largo São Bento – Centro, Cajuru/SP. Fácil de encontrar!',
    'localização':   '📍 R. Cel. Manoel Caetano, 311 – Pça Largo São Bento – Centro, Cajuru/SP. Clique em "Ver no Mapa" no site!',
    'onde':          '📍 Estamos no centro de Cajuru/SP, na Praça Largo São Bento. R. Cel. Manoel Caetano, 311.',
    'mapa':          '📍 Acesse o Google Maps pelo botão no site ou busque "Sorveteria Itapolitana Cajuru".',
    'cajuru':        '📍 Estamos em Cajuru/SP desde 2007! Atendemos também Santa Cruz da Esperança e Cássia dos Coqueiros.',
    'santa cruz':    '📍 Sim! Atendemos clientes de Santa Cruz da Esperança. Venha nos visitar em Cajuru!',
    'cássia':        '📍 Sim! Atendemos clientes de Cássia dos Coqueiros. Estamos em Cajuru/SP.',
    'telefone':      '📱 WhatsApp: (16) 99606-2046. Chame para encomendas, dúvidas ou eventos!',
    'whatsapp':      '📱 WhatsApp: (16) 99606-2046. Respondemos rapidinho! 😊',
    'contato':       '📱 Fale conosco pelo WhatsApp: (16) 99606-2046. Ou use o formulário "Fale Conosco" no site!',
    'instagram':     '📸 Nos siga no Instagram para ver novidades, sabores e promoções! Busque @sorveteriaitapolitanacajuru.',
    'sabor':         '🍦 Temos 35 sabores tipo artesanal! Destaques: Chocolate, Nutella, Leite Ninho, Morango Trufado, Ferrero Rocher, Pistache, Kinder Ovo, Ovomaltine e muito mais. Veja o cardápio completo no site!',
    'sabores':       '🍦 Temos 35 sabores tipo artesanal! Destaques: Chocolate, Nutella, Leite Ninho, Morango Trufado, Ferrero Rocher, Pistache, Kinder Ovo, Ovomaltine e muito mais. Veja o cardápio completo no site!',
    'cardápio':      '🍦 Acesse o cardápio completo no site! Sorvetes, Açaí, Milkshake, Taças, Picolés e Sobremesas. Tudo fresquinho!',
    'nutella':       '🍦 Sim! Temos sorvete de Nutella, Banana com Nutella, Sundae com Nutella e muito mais! Delicioso! 😋',
    'chocolate':     '🍦 Temos Chocolate, Chocolate com Café, Bis e Trufa, Menta com Chocolate, Prestígio e Torta de Chocolate! 🍫',
    'leite ninho':   '🍦 Temos Leite Ninho, Leite Ninho Folheado e Leite Ninho com Oreo! Os favoritos das crianças! 🥛',
    'morango':       '🍦 Temos Morango Trufado no sorvete e Morango Split nas taças! Também no açaí como complemento. 🍓',
    'pistache':      '🍦 Sim! Temos sorvete de Pistache — um dos sabores mais pedidos! 🟢',
    'diet':          '🍦 Sim! Temos sorvete Diet (1 bola por R$ 10). Ideal para quem cuida da saúde! 🌿',
    'vegano':        '🍦 Para informações sobre opções veganas, entre em contato pelo WhatsApp: (16) 99606-2046.',
    'lactose':       '🍦 Para informações sobre opções sem lactose, fale conosco pelo WhatsApp: (16) 99606-2046.',
    'preço':         '💰 Sorvetes a partir de R$ 8,00 · Milkshakes a partir de R$ 17,00 · Açaí a partir de R$ 15,00. Veja o cardápio completo no site!',
    'preços':        '💰 Sorvetes a partir de R$ 8,00 · Milkshakes a partir de R$ 17,00 · Açaí a partir de R$ 15,00. Veja o cardápio completo no site!',
    'quanto':        '💰 Sorvetes a partir de R$ 8,00 · Milkshakes a partir de R$ 17,00 · Açaí a partir de R$ 15,00 · Picolés a partir de R$ 2,50.',
    'valor':         '💰 Sorvetes a partir de R$ 8,00 · Milkshakes a partir de R$ 17,00 · Açaí a partir de R$ 15,00.',
    'pagamento':     '💳 Aceitamos Dinheiro, Pix, Cartão de Débito e Crédito. Para encomendas, pagamento antecipado obrigatório.',
    'pix':           '💳 Sim! Aceitamos Pix. Para encomendas, pagamento via Pix antecipado.',
    'cartão':        '💳 Sim! Aceitamos cartão de débito e crédito. Também Pix e dinheiro.',
    'dinheiro':      '💳 Sim! Aceitamos dinheiro, Pix e cartão.',
    'açaí':          '🫐 Açaí tipo artesanal em copos de 300ml, 360ml, 400ml e 600ml. Personalize com frutas, cremes e chocolates!',
    'acai':          '🫐 Açaí tipo artesanal em copos de 300ml a 600ml. Personalize com frutas, cremes e chocolates!',
    'complemento':   '🫐 Complementos do açaí: Frutas (R$ 2,00), Cremes Nutella/Ninho (R$ 3,00), Guloseimas (R$ 2,00), Chocolates Kit Kat/Oreo (R$ 4,00).',
    'milkshake':     '🥤 Milkshakes a partir de R$ 17,00 em copo transparente com tampa bolha! Adicional Ovomaltine R$ 3,00!',
    'milk':          '🥤 Milkshakes a partir de R$ 17,00. Vários tamanhos e sabores.',
    'picolé':        '🍭 Picolés de fruta/água R$ 2,50, de leite R$ 2,50–R$ 3,50. Atacado (mín. 100 un.) via encomenda!',
    'picolés':       '🍭 Picolés de fruta/água R$ 2,50, de leite R$ 2,50–R$ 3,50. Atacado (mín. 100 un.) via encomenda!',
    'atacado':       '📦 Picolés no atacado: mínimo 100 unidades, prazo de 3 dias úteis, pagamento antecipado. Entre em contato: (16) 99606-2046.',
    'encomendar':    '📦 Para encomendas, acesse a página de Encomendas no menu do site! Prazo: 3 dias úteis após pagamento antecipado.',
    'encomenda':     '📦 Para encomendas, acesse a página de Encomendas no menu do site! Prazo: 3 dias úteis após pagamento antecipado.',
    'prazo':         '📦 O prazo mínimo para encomendas é de 3 dias úteis após a confirmação e pagamento.',
    'torta':         '🎂 Torta de Sorvete R$ 100,00 com até 3 sabores à escolha. Encomende com 3 dias de antecedência pelo WhatsApp: (16) 99606-2046!',
    'caixa':         '🍦 Caixas de 5L (a partir de R$ 100) e 10L (a partir de R$ 150) com 2 ou 3 sabores. Perfeito para festas!',
    'isopor':        '🍦 Isopores para viagem: 4 bolas (R$ 25), 7 bolas (R$ 30), 9 bolas (R$ 40), 12 bolas (R$ 50).',
    'taça':          '🍨 Taças especiais: Colegial R$20, Sundae R$23, Banana Split R$25, Universitário R$23, Ula-Ula R$48 e muito mais!',
    'taças':         '🍨 Taças tradicionais e sujas! Destaques: Sundae com Nutella R$28, Ula-Ula R$48, Prestígio R$42.',
    'sundae':        '🍨 Sundae R$ 23,00 e Sundae com Nutella R$ 28,00. Delicioso! 😋',
    'brownie':       '🍮 Brownie com Sorvete: 1 bola R$ 20,00 · 2 bolas R$ 25,00.',
    'fondue':        '🍮 Fondue de Sorvete R$ 25,00. Perfeito para compartilhar!',
    'sobremesa':     '🍮 Sobremesas: Torta de Sorvete R$100, Fondue R$25, Brownie com Sorvete R$20–R$25.',
    'evento':        '🎪 Temos Carrinho para Eventos! Consulte disponibilidade pelo WhatsApp: (16) 99606-2046.',
    'festa':         '🎉 Fazemos encomendas para festas: Torta, Caixas, Picolés no atacado e Carrinho para Eventos! Fale: (16) 99606-2046.',
    'carrinho':      '🛒 Sim! Temos Carrinho para Eventos. Consulte pelo WhatsApp: (16) 99606-2046.',
    'aniversário':   '🎂 Para aniversários: Torta de Sorvete, Caixas, Picolés e Carrinho para Eventos! Fale: (16) 99606-2046.',
    'fidelidade':    '⭐ Clube de Fidelidade Itapolitana! Acumule pontos e ganhe prêmios. Cadastre-se na página de Fidelidade!',
    'pontos':        '⭐ Com 10 pontos (milkshakes) = 1 bola de sorvete! Com 30 pontos (caixas) = 1 caixa com 12 picolés!',
    'clube':         '⭐ Clube de Fidelidade: acumule pontos e ganhe prêmios! Acesse a página de Fidelidade no menu.',
    'prêmio':        '⭐ Prêmios do Clube: 10 pontos = 1 bola de sorvete · 30 pontos = 1 caixa com 12 picolés de fruta/água.',
    'promoção':      '🎁 Temos sorteio mensal! Cadastre-se na página de Promoção no menu do site para concorrer. Gratuito!',
    'sorteio':       '🎁 Sorteio mensal gratuito! Cadastre-se na página de Promoção no menu do site. Boa sorte! 🍀',
    'cadastro':      '📝 Para se cadastrar no Clube de Fidelidade ou no Sorteio Mensal, acesse as páginas no menu. É gratuito!',
    'delivery':      '🚫 Não fazemos delivery. Encomende e retire na loja em Cajuru/SP.',
    'entrega':       '🚫 Não fazemos delivery. Para encomendas, a retirada é na loja com prazo de 3 dias úteis.',
    'motoboy':       '🚫 Não fazemos delivery. Atendemos somente na loja em Cajuru/SP.',
    'ifood':         '🚫 Não fazemos delivery. Atendemos somente na loja em Cajuru/SP.',
    'anos':          '🍦 A Sorveteria Itapolitana está em Cajuru desde 2007 — mais de 19 anos de tradição e sabor!',
    'historia':      '🍦 A Sorveteria Itapolitana foi fundada em 2007 em Cajuru/SP. São mais de 19 anos de tradição!',
    'artesanal':     '🍦 Nossos sorvetes são tipo artesanal — cremosos, em bolas redondas, com 35 sabores incríveis!',
    'qualidade':     '🍦 Trabalhamos com ingredientes selecionados e muito carinho desde 2007. Qualidade é nossa tradição!',
    'default':       'Hmm, não encontrei isso aqui 😊<br>Tente perguntar sobre: <em>horário · sabores · preços · picolé · açaí · milkshake · encomenda · fidelidade · promoções · localização · pagamento</em><br><br><a href="https://wa.me/5516996062046" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:7px;background:#25D366;color:#fff;padding:9px 18px;border-radius:20px;font-size:12px;font-weight:800;text-decoration:none;margin-top:8px">💬 Falar no WhatsApp</a>'
  };

  /* ─── Carrega FAQs dos JSON e mescla ─── */
  (function () {
    var arquivos = [
      _base + 'dados/faq_horarios_localizacao.json',
      _base + 'dados/faq_cardapio.json',
      _base + 'dados/faq_encomendas.json',
      _base + 'dados/faq_fidelidade.json',
      _base + 'dados/faq_sorteio_promocoes.json'
    ];
    function norm(t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    arquivos.forEach(function (url) {
      fetch(url + '?v=' + Date.now())
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (faq) {
          if (!faq || !Array.isArray(faq.perguntas)) return;
          faq.perguntas.forEach(function (p) {
            if (!p.tags || !p.resposta) return;
            p.tags.forEach(function (tag) {
              var chave = norm(tag);
              if (typeof RESPOSTAS[chave] !== 'function') RESPOSTAS[chave] = p.resposta;
            });
          });
        });
    });
  }());

  /* ─── Chat functions ─── */
  function _itabotAddMsg(tipo, txt) {
    var m = document.getElementById('chat-msgs');
    var d = document.createElement('div');
    d.className = 'msg ' + tipo;
    if (tipo === 'bot') { d.innerHTML = txt; } else { d.textContent = txt; }
    m.appendChild(d);
    m.scrollTop = m.scrollHeight;
  }
  function _itabotGetResp(msg) {
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    var l = norm(msg);
    for (var k in RESPOSTAS) {
      if (k !== 'default' && l.indexOf(norm(k)) !== -1) {
        return typeof RESPOSTAS[k] === 'function' ? RESPOSTAS[k]() : RESPOSTAS[k];
      }
    }
    var d = RESPOSTAS['default'];
    return typeof d === 'function' ? d() : d;
  }
  window._itabotEnviarSug = function (btn) {
    document.getElementById('chat-inp').value = btn.textContent;
    var sugs = document.getElementById('chat-sugs-container');
    if (sugs) sugs.style.display = 'none';
    _itabotEnviarChat();
  };
  window._itabotInserirKeyword = function (kw) {
    var inp = document.getElementById('chat-inp');
    if (!inp) return;
    inp.value = kw;
    inp.focus();
    _itabotEnviarChat();
  };
  function _itabotEnviarChat() {
    var inp = document.getElementById('chat-inp');
    var msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    var sugs = document.getElementById('chat-sugs-container');
    if (sugs) sugs.style.display = 'none';
    _itabotAddMsg('user', msg);
    var t = document.getElementById('chat-typing');
    t.classList.add('show');
    setTimeout(function () {
      t.classList.remove('show');
      _itabotAddMsg('bot', _itabotGetResp(msg));
    }, 700 + Math.random() * 500);
  }
  window._itabotEnviarChat = _itabotEnviarChat;

  function _itabotPosicionarAoLadoDoLogo() {
    var wrap = document.getElementById('itabot-wrap');
    var logo = document.querySelector('.itap-brand-icon, .brand-icon');
    if (!wrap || !logo) return;
    var row = logo.parentElement && logo.parentElement.classList && logo.parentElement.classList.contains('itabot-top-row')
      ? logo.parentElement
      : null;
    if (!row) {
      var host = logo.parentElement;
      row = document.createElement('div');
      row.className = 'itabot-top-row';
      host.insertBefore(row, logo);
      row.appendChild(logo);
    }
    if (wrap.parentElement !== row) row.appendChild(wrap);
    var logoImg = logo.querySelector('img');
    var size = logoImg ? Math.round(logoImg.getBoundingClientRect().width || logoImg.width || 80) : 80;
    document.documentElement.style.setProperty('--itabot-logo-size', size + 'px');
    wrap.style.display = 'flex';
  }
  window.addEventListener('resize', _itabotPosicionarAoLadoDoLogo);

  /* ─── Mostra o widget no topo, ao lado do logo ─── */
  _itabotPosicionarAoLadoDoLogo();

}());
