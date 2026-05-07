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
/* Ajuste de safe area para evitar sobreposição em mobile – touch target mínimo 44px (Apple/Google HIG) */
.duvidas-chip{background:#FFF5F5;color:#C62828;border:1.5px solid #FFCDD2;border-radius:22px;padding:8px 13px;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:.5px;text-transform:uppercase;transition:background .15s,transform .1s,border-color .15s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;flex-shrink:0;min-height:44px;display:inline-flex;align-items:center;justify-content:center}
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
/* Fonte maior para melhor legibilidade em mobile */
.msg{max-width:85%;padding:12px 16px;border-radius:16px;font-size:15px;line-height:1.55;animation:msg-slide .22s ease-out}
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
/* Ajuste do Ita Bot: ícone com contorno branco e botão "DÚVIDAS" no topo direito, ao lado do logo, em todas as páginas */
.itabot-top-row{display:flex;align-items:center;justify-content:center;gap:8px;width:100%}
.itabot-top-row .itap-brand-icon,.itabot-top-row .brand-icon{width:var(--itabot-logo-size);min-width:var(--itabot-logo-size);margin:0;display:flex;align-items:center;justify-content:center}
.itabot-top-row .itap-brand-icon img,.itabot-top-row .brand-icon img{width:var(--itabot-logo-size);height:var(--itabot-logo-size)}
/* Wrap do robô: flex-row para robô + botão "DÚVIDAS" lado a lado */
.itabot-wrap{position:static;top:auto;right:auto;bottom:auto;display:none;flex-direction:row;align-items:center;gap:6px;flex:0 0 auto;width:auto;min-width:0}
/* Robô: círculo com borda branca, sem fundo grande, sem neon */
.duvidas-card{width:var(--itabot-logo-size);height:var(--itabot-logo-size);min-width:var(--itabot-logo-size);padding:0;display:flex;align-items:center;justify-content:center;background:transparent;border:2.5px solid rgba(255,255,255,.8);border-radius:50%;box-shadow:none;filter:none;animation:none;overflow:visible;transform:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.duvidas-card::before{display:none}
.duvidas-card:hover{border-color:#fff;transform:scale(1.06);box-shadow:none;filter:none;transition:transform .15s}
/* SVG do robô: animação suave, sombra leve (sem neon) */
.duvidas-card svg{width:90%;height:90%;display:block;transform-origin:center bottom;animation:itabot-sway 1.9s ease-in-out infinite;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))}
.duvidas-card-logo,.duvidas-btn{display:none}
@keyframes itabot-sway{0%,100%{transform:translateY(0) rotate(-4deg) scale(1)}50%{transform:translateY(-2px) rotate(4deg) scale(1.03)}}
/* Botão "DÚVIDAS" pulsante ao lado do robô – abre o chat Ita Bot em tela cheia */
.itabot-duvidas-btn{background:linear-gradient(135deg,#D00000,#E8000D);color:#fff;border:2px solid #fff;border-radius:999px;padding:7px 13px;font-size:11px;font-weight:900;letter-spacing:1px;cursor:pointer;white-space:nowrap;animation:itabot-btn-pulse 1.35s ease-in-out infinite;-webkit-tap-highlight-color:transparent;touch-action:manipulation;text-transform:uppercase;line-height:1;align-self:center;flex-shrink:0;text-shadow:0 0 6px rgba(255,255,255,.65),0 0 12px rgba(255,64,64,.55)}
.itabot-duvidas-btn:hover{filter:brightness(1.1);transform:scale(1.05)}
@keyframes itabot-btn-pulse{
0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.95),0 0 10px rgba(255,40,40,.55),0 0 22px rgba(255,0,80,.35)}
50%{box-shadow:0 0 0 2px rgba(255,255,255,1),0 0 18px rgba(255,64,64,.92),0 0 34px rgba(255,0,110,.72),0 0 54px rgba(255,0,140,.5)}
}
@media(prefers-reduced-motion:reduce){.duvidas-card svg,.itabot-duvidas-btn{animation:none}}
/* Botão-link de ação nas respostas do bot — grande e fácil de tocar em mobile */
.itabot-link-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#FF6B35,#E8000D);color:#fff!important;text-decoration:none!important;border-radius:12px;padding:12px 20px;font-size:14px;font-weight:900;letter-spacing:.4px;margin-top:6px;min-height:48px;box-shadow:0 3px 10px rgba(232,0,13,.25);transition:filter .15s,transform .1s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;white-space:normal;word-break:break-word}
.itabot-link-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}.itabot-link-btn:active{transform:scale(.97)}
/* Chat Ita Bot: modal fullscreen acima de tudo, inclusive barra inferior Android */
/* Ajuste de safe area para evitar sobreposição em mobile (cabeçalho e barra inferior) */
#chat-dialog{inset:0;height:100%}
/* chat-box: tela cheia, sem borda de bottom-sheet */
.chat-box{border-radius:0;height:100%;overflow:hidden}
.chat-msgs{padding-bottom:20px}
.chat-footer{background:linear-gradient(135deg,#0060B0,#0292EC);color:#fff;text-align:center;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0px));border-top:3px solid #FBD100;flex-shrink:0}
.chat-footer-title{font-size:11px;font-weight:900;color:#FBD100;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
.chat-footer-wa{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 16px;border-radius:999px;background:rgba(37,211,102,.18);border:1px solid rgba(37,211,102,.78);color:#fff;font-size:12px;font-weight:900;text-decoration:none}
.chat-footer-copy{font-size:10px;color:rgba(255,255,255,.76);font-weight:700;margin-top:8px;line-height:1.4}
@media(max-width:600px){:root{--itabot-logo-size:72px}.itabot-top-row{gap:6px}.itabot-duvidas-btn{font-size:10px;padding:6px 10px}}
@media(min-width:601px){:root{--itabot-logo-size:90px}.itabot-top-row{gap:10px}}
@media(min-width:768px){#chat-dialog{padding:18px 24px 24px;align-items:flex-start;justify-content:flex-end}.chat-box{max-width:420px;height:min(720px,calc(100dvh - 42px));border-radius:28px;box-shadow:0 18px 50px rgba(0,0,0,.32)}}

/* === AJUSTE UX: header com logo e robô equilibrados + DÚVIDAS central === */
.itabot-top-row{display:grid!important;grid-template-columns:auto 1fr auto!important;align-items:center!important;gap:10px!important;width:100%!important;max-width:420px;margin:0 auto}
.itap-header-duvidas{display:flex;justify-content:center;align-items:center;width:100%}
.ita-bot-duvidas-btn{background:linear-gradient(135deg,#1565C0,#0D47A1);color:#fff;border:2px solid rgba(255,255,255,.8);border-radius:999px;padding:9px 16px;font-size:14px;font-weight:900;letter-spacing:.6px;cursor:pointer;animation:itabot-btn-pulse 1.8s ease-in-out infinite}
.ita-bot-duvidas-btn:focus-visible{outline:3px solid #FFD600;outline-offset:2px}
.itabot-top-row .itabot-wrap{display:flex!important;align-items:center;justify-content:center}
.itabot-top-row .duvidas-card{width:var(--itabot-logo-size)!important;height:var(--itabot-logo-size)!important;min-width:var(--itabot-logo-size)!important}

/* === TELA DE DÚVIDAS minimalista em 3 blocos === */
.chat-box{display:flex;flex-direction:column;height:100dvh!important;background:#fff}
.chat-hdr{background:#fff;color:#1A0A00;border-bottom:1px solid #ECECEC;padding:10px 12px;display:flex;gap:8px}
.chat-hdr-logo-row{border:0;padding:0;flex:1;justify-content:flex-start}
.chat-hdr-main-row{display:flex;justify-content:flex-end}
.chat-hdr-main-row>div:first-child,.chat-btn-home,.chat-hdr p,.chat-hdr h3{display:none!important}
.chat-close{background:#F3F4F6;color:#111827;width:40px;height:40px;font-size:18px}
#duvidas-resposta.chat-msgs{flex:1!important;min-height:40vh;padding:14px 16px;overflow-y:auto;background:#FAFAFA;font-size:15px;line-height:1.6;color:#111827}
.chat-typing,.chat-sugs,.duvidas-chips-wrap,.chat-footer{display:none!important}
.chat-inp-row{border-top:1px solid #ECECEC;background:#fff;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));display:flex;gap:8px}
#duvidas-pergunta.chat-inp{flex:1;border:2px solid #E5E7EB;border-radius:12px;padding:12px 14px;font-size:16px}
.chat-send{width:auto;height:auto;min-width:92px;border-radius:12px;padding:0 14px;font-size:14px;font-weight:800}
@media(max-width:600px){.ita-bot-duvidas-btn{font-size:13px;padding:8px 14px}#duvidas-resposta.chat-msgs{font-size:14px}}

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
  <button type="button" id="ita-bot-trigger" class="duvidas-card"
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
  <!-- Botão "DÚVIDAS" pulsante ao lado do robô – abre o chat Ita Bot em tela cheia -->
  <button type="button"
      class="itabot-duvidas-btn"
      onclick="_itabotAbrirItaBot()"
      aria-label="Abrir dúvidas com Ita Bot">DÚVIDAS</button>
</div>
<!-- Ajuste estrutural do Ita Bot: #itabot-wrap fecha aqui (somente robô + botão DÚVIDAS). -->
<!-- #chat-dialog é bloco separado, fora do #itabot-wrap, para evitar HTML inválido e sobreposição no Android. -->
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
<div class="chat-msgs" id="duvidas-resposta" aria-live="polite">Olá! 👋 Sou o <strong>Ita Bot</strong>. Digite sua dúvida abaixo e vou responder aqui.</div>
<div class="chat-inp-row">
  <input class="chat-inp" id="duvidas-pergunta" onkeydown="if(event.key==='Enter')_itabotEnviarChat()" placeholder="Digite sua dúvida ou palavra-chave" type="text" autocomplete="off" spellcheck="false" aria-label="Digite sua dúvida"/>
  <button class="chat-send" onclick="_itabotEnviarChat()" type="button" aria-label="Enviar mensagem">Enviar</button>
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
      var inp = document.getElementById('duvidas-pergunta');
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
    'default':       'Hmm, não encontrei isso aqui 😊<br>Tente perguntar sobre: <em>cardápio · horário · encomendas · fidelidade · promoções · picolé · açaí · milkshake · localização · pagamento · WhatsApp</em><br><br><a href="https://wa.me/5516996062046" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:7px;background:#25D366;color:#fff;padding:9px 18px;border-radius:20px;font-size:12px;font-weight:800;text-decoration:none;margin-top:8px">💬 Falar no WhatsApp</a>'
  };

  /* ─── BASE DE CONHECIMENTO DO ITA BOT ───────────────────────────────────
     Cada entrada define uma INTENÇÃO reconhecida pelo bot:
       - keywords : palavras-chave que ativam esta intenção (normalizadas em minúsculas)
       - answer   : texto de resposta exibido ao usuário
       - linkText : texto do botão de ação (opcional)
       - linkHref : URL de destino — use caminhos relativos para páginas internas
                    (ex.: 'encomendas.html') e URL completa para links externos
       - external : true → abre em nova aba; false/omitido → abre na mesma aba (PWA)

     Como adicionar uma nova intenção no futuro:
       1. Adicione um objeto ao array abaixo, seguindo o padrão existente.
       2. Inclua todas as variações de palavras-chave relevantes no array keywords.
       3. Defina a página/âncora correta em linkHref.
     ─────────────────────────────────────────────────────────────────────── */
  var itaBotKnowledge = [

    // ── Intenção: Cardápio / Menu / Sabores de sorvete / Taças / Sobremesas ──
    {
      keywords: ['cardápio', 'cardapio', 'menu', 'sabores', 'sabor', 'sorvetes', 'sorvete', 'gelado', 'gelados', 'casquinha', 'taça', 'taca', 'taças', 'tacas', 'sundae', 'banana split', 'sobremesa', 'isopor'],
      answer: '🍦 Temos 35 sabores tipo artesanal! Chocolate, Nutella, Leite Ninho, Morango Trufado, Pistache, Ferrero Rocher, Kinder Ovo, Ovomaltine e muito mais. Também taças, isopores e sobremesas. Confira o cardápio completo:',
      linkText: '🍦 Abrir Cardápio Digital',
      linkHref: 'index.html'
    },

    // ── Intenção: Açaí ──
    {
      keywords: ['açaí', 'acai', 'açai', 'complemento açaí', 'complementos acai', 'topping acai'],
      answer: '🫐 Açaí tipo artesanal em copos de 300ml (R$15), 360ml (R$16), 400ml (R$17) e 600ml (R$20). Personalize com frutas, cremes e chocolates! Também temos Açaí Promocional a partir de R$15. Veja no cardápio:',
      linkText: '🫐 Ver Cardápio — Açaí',
      linkHref: 'index.html'
    },

    // ── Intenção: Milkshake ──
    {
      keywords: ['milkshake', 'milk shake', 'milk'],
      answer: '🥤 Milkshakes em copo transparente com tampa bolha! Tradicional: 300ml R$17 · 400ml R$20 · 500ml R$22 · 750ml R$28. Adicional Ovomaltine R$3,00. Veja no cardápio:',
      linkText: '🥤 Ver Cardápio — Milkshakes',
      linkHref: 'index.html'
    },

    // ── Intenção: Picolé (varejo e atacado) ──
    {
      keywords: ['picolé', 'picole', 'picolés', 'picoles', 'leitinho', 'esquimó', 'esquimo'],
      answer: '🍭 Picolés: Fruta/Água R$2,50 · Leite sem recheio R$2,50 · Leite com recheio R$3,00 · Leite Ninho (o LEITINHO!) R$4,00 · Esquimó R$8,00. Atacado (mín. 100 un.) disponível via encomenda. Veja o cardápio ou encomende:',
      linkText: '🍭 Ver Picolés / Fazer Encomenda',
      linkHref: 'encomendas.html'
    },

    // ── Intenção: Promoções / Sorteio mensal ──
    {
      keywords: ['promoção', 'promocao', 'promoções', 'promocoes', 'sorteio', 'desconto', 'oferta', 'promo', 'ganhar', 'concorrer', 'grátis'],
      answer: '🎉 Sorteio Mensal 2026: todo dia 01 sorteamos 1 caixa de 5L de sorvete — totalmente gratuito! Cadastre-se pelo site para concorrer. Também confira promoções especiais do dia:',
      linkText: '🎉 Ver Promoções e Sorteio',
      linkHref: 'promocao.html'
    },

    // ── Intenção: Encomendas / Pedidos / Festas e eventos ──
    {
      keywords: ['encomendar', 'encomenda', 'encomendas', 'pedido', 'pedir', 'reservar', 'torta', 'caixa', 'festa', 'evento', 'aniversário', 'aniversario', 'casamento', 'formatura', 'carrinho', 'atacado'],
      answer: '📦 Trabalhamos com Torta de Sorvete (R$100), Caixa 5L (a partir de R$100), Caixa 10L (a partir de R$150), Picolés no atacado (mín. 100 un.) e Carrinho para Eventos. Prazo mínimo: 3 dias úteis + pagamento antecipado. Faça seu pedido online:',
      linkText: '📦 Fazer Encomenda',
      linkHref: 'encomendas.html'
    },

    // ── Intenção: Clube de Fidelidade / Pontos / Cupom / Prêmios ──
    {
      keywords: ['fidelidade', 'pontos', 'clube', 'cupom', 'cupons', 'prêmio', 'premio', 'resgatar', 'resgate', 'validar código', 'validar codigo'],
      answer: '⭐ Clube de Fidelidade Itapolitana! Compre acima de R$30 de segunda a sexta → ganhe cupom → acumule pontos. Prêmios: 10 pontos = 1 bola de sorvete · 30 pontos = 1 caixa de 12 picolés. Programa gratuito, disponível a partir de maio/2026. Acesse:',
      linkText: '⭐ Abrir Clube de Fidelidade',
      linkHref: 'fidelidade.html'
    },

    // ── Intenção: Cadastro (fidelidade ou sorteio) ──
    {
      keywords: ['cadastro', 'cadastrar', 'cadastre', 'me cadastrar', 'quero me cadastrar'],
      answer: '📝 Você pode se cadastrar gratuitamente no Clube de Fidelidade ou no Sorteio Mensal pelas páginas do menu. Acesse diretamente:',
      linkText: '⭐ Clube de Fidelidade',
      linkHref: 'fidelidade.html'
    },

    // ── Intenção: Horário de funcionamento ──
    {
      keywords: ['horário', 'horario', 'abre', 'fecha', 'aberto', 'aberta', 'fechado', 'fechada', 'funciona', 'funcionamento', 'hoje abre', 'hoje fecha', 'domingo', 'sábado', 'sabado', 'feriado', 'fim de semana'],
      answer: '🕙 Funcionamos TODOS os dias (inclusive sábados, domingos e feriados), das 10h às 22h. Te esperamos! 🍦',
      linkText: '🗺️ Ver localização e horário',
      linkHref: 'index.html'
    },

    // ── Intenção: Endereço / Localização / Como chegar ──
    {
      keywords: ['endereço', 'endereco', 'localização', 'localizacao', 'onde fica', 'onde estão', 'como chegar', 'mapa', 'google maps', 'cajuru', 'santa cruz', 'cássia', 'cassia'],
      answer: '📍 Estamos na R. Cel. Manoel Caetano, 311 – Praça Largo São Bento – Centro, Cajuru/SP. Atendemos também clientes de Santa Cruz da Esperança e Cássia dos Coqueiros. Veja no mapa:',
      linkText: '📍 Abrir no Google Maps',
      linkHref: 'https://www.google.com/maps/place/Sorveteria+A%C3%A7aiteria+Itapolitana+Cajuru/@-21.2776766,-47.3071817',
      external: true
    },

    // ── Intenção: WhatsApp / Contato / Falar com atendente ──
    {
      keywords: ['whatsapp', 'zap', 'wpp', 'contato', 'telefone', 'fone', 'falar', 'atendente', 'fale conosco', 'número'],
      answer: '📱 Fale direto com a gente pelo WhatsApp para encomendas, dúvidas e eventos! Número: (16) 99606-2046 · Atendimento: todos os dias das 10h às 22h.',
      linkText: '💬 Chamar no WhatsApp',
      linkHref: 'https://wa.me/5516996062046',
      external: true
    },

    // ── Intenção: Instagram / Redes sociais ──
    {
      keywords: ['instagram', 'insta', 'redes sociais', 'seguir', 'novidades'],
      answer: '📸 Siga nosso Instagram para ver novidades, promoções e novos sabores! Perfil: @sorveteriaitapolitanacajuru',
      linkText: '📸 Abrir Instagram',
      linkHref: 'https://www.instagram.com/sorveteriaitapolitanacajuru',
      external: true
    },

    // ── Intenção: Formas de pagamento ──
    {
      keywords: ['pagamento', 'pagar', 'formas de pagamento', 'aceita cartão', 'aceita pix', 'aceita dinheiro', 'pix', 'crédito', 'credito', 'débito', 'debito', 'dinheiro'],
      answer: '💳 Aceitamos Dinheiro, Pix, Cartão de Débito e Crédito. Para encomendas, o pagamento antecipado é obrigatório (conta o prazo de 3 dias úteis após o pagamento). Dúvidas? Fale conosco:',
      linkText: '💬 Falar no WhatsApp',
      linkHref: 'https://wa.me/5516996062046',
      external: true
    },

    // ── Intenção: Não fazemos delivery ──
    {
      keywords: ['delivery', 'entrega', 'entregar', 'motoboy', 'ifood', 'rappi', 'uber eats', 'traz em casa', 'entregam'],
      answer: '🚫 Não fazemos delivery. Atendemos somente na loja em Cajuru/SP. Para encomendas, a retirada é feita no local com prazo de 3 dias úteis. Veja como fazer pedidos:',
      linkText: '📦 Ver Encomendas (retirada na loja)',
      linkHref: 'encomendas.html'
    },

    // ── Intenção: Opções diet / vegano / lactose ──
    {
      keywords: ['diet', 'dieta', 'vegano', 'vegan', 'lactose', 'intolerante', 'diabético', 'diabetico', 'açúcar', 'acucar', 'sem açúcar', 'sem lactose'],
      answer: '🌿 Temos Sorvete Diet (1 bola R$10,00). Para informações sobre opções veganas ou sem lactose, entre em contato — teremos prazer em orientá-lo!',
      linkText: '💬 Consultar via WhatsApp',
      linkHref: 'https://wa.me/5516996062046',
      external: true
    },

    // ── Intenção: Preços / Valores gerais ──
    {
      keywords: ['preço', 'precos', 'preços', 'quanto custa', 'quanto é', 'valor', 'valores', 'tabela de preços', 'tabela precos'],
      answer: '💰 Valores: Sorvetes a partir de R$8,00 · Açaí a partir de R$15,00 · Milkshakes a partir de R$17,00 · Picolés a partir de R$2,50 · Taças a partir de R$20,00. Veja todos os preços no cardápio:',
      linkText: '🍦 Ver Cardápio com Preços',
      linkHref: 'index.html'
    }

  ];

  /* Monta a resposta como DocumentFragment usando apenas DOM APIs (sem innerHTML).
     UX: texto limpo em span + link-botão opcional. Segurança: textContent em cada nó. */
  function _itabotMontarResposta(entry) {
    var frag = document.createDocumentFragment();
    var span = document.createElement('span');
    span.style.cssText = 'display:block;margin-bottom:10px;line-height:1.6';
    span.textContent = entry.answer;
    frag.appendChild(span);
    if (entry.linkHref && entry.linkText) {
      var a = document.createElement('a');
      a.href = entry.external ? entry.linkHref : (_base + entry.linkHref);
      a.className = 'itabot-link-btn';
      if (entry.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      a.textContent = entry.linkText;
      frag.appendChild(a);
    }
    return frag;
  }

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
  /* Converte string HTML (de RESPOSTAS/FAQ) em DocumentFragment seguro usando DOMParser.
     RESPOSTAS vêm de dados estáticos do servidor, nunca do input do usuário. */
  function _itabotHtmlParaFragmento(html) {
    try {
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('script, style').forEach(function (n) { n.remove(); });
      doc.querySelectorAll('*').forEach(function (n) {
        var toRemove = [];
        for (var i = 0; i < n.attributes.length; i++) {
          var a = n.attributes[i];
          if (/^on/i.test(a.name) || /javascript\s*:/i.test(a.value)) toRemove.push(a.name);
        }
        toRemove.forEach(function (name) { n.removeAttribute(name); });
      });
      var frag = document.createDocumentFragment();
      Array.from(doc.body.childNodes).forEach(function (child) {
        frag.appendChild(document.adoptNode(child));
      });
      return frag;
    } catch (e) {
      var frag2 = document.createDocumentFragment();
      var span = document.createElement('span');
      span.textContent = html.replace(/<[^>]*>/g, ' ').trim();
      frag2.appendChild(span);
      return frag2;
    }
  }
  /* Exibe um DocumentFragment na área de resposta (sem innerHTML, sem parseFromString aqui). */
  function _itabotSetResposta(frag) {
    var el = document.getElementById('duvidas-resposta');
    if (!el) return;
    while (el.firstChild) { el.removeChild(el.firstChild); }
    if (frag) { el.appendChild(frag); }
    el.scrollTop = 0;
  }
  /* Lookup: recebe msg do usuário, retorna DocumentFragment com dados estáticos.
     msg é usada SOMENTE como chave de busca — nunca incluída no conteúdo exibido. */
  function _itabotGetResp(msg) {
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    var l = norm(msg);

    // 1) Verifica itaBotKnowledge primeiro: intenções com resposta + link de redirecionamento
    for (var i = 0; i < itaBotKnowledge.length; i++) {
      var entry = itaBotKnowledge[i];
      for (var j = 0; j < entry.keywords.length; j++) {
        if (l.indexOf(norm(entry.keywords[j])) !== -1) {
          return _itabotMontarResposta(entry);  /* retorna DocumentFragment */
        }
      }
    }

    // 2) Fallback: verifica RESPOSTAS para palavras-chave específicas (sabores, preços detalhados, etc.)
    for (var k in RESPOSTAS) {
      if (k !== 'default' && l.indexOf(norm(k)) !== -1) {
        var r = typeof RESPOSTAS[k] === 'function' ? RESPOSTAS[k]() : RESPOSTAS[k];
        return _itabotHtmlParaFragmento(r);  /* converte HTML estático em DOM fragment */
      }
    }

    // 3) Resposta padrão quando nenhuma palavra-chave for reconhecida
    var d = RESPOSTAS['default'];
    var dHtml = typeof d === 'function' ? d() : d;
    return _itabotHtmlParaFragmento(dHtml);
  }
  window._itabotEnviarSug = function (btn) {
    var inp = document.getElementById('duvidas-pergunta');
    if (!inp) return;
    inp.value = btn.textContent;
    _itabotEnviarChat();
  };
  window._itabotInserirKeyword = function (kw) {
    var inp = document.getElementById('duvidas-pergunta');
    if (!inp) return;
    inp.value = kw;
    inp.focus();
    _itabotEnviarChat();
  };
  function _itabotEnviarChat() {
    var inp = document.getElementById('duvidas-pergunta');
    if (!inp) return;
    var msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    _itabotSetResposta(_itabotGetResp(msg));
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

    var center = row.querySelector('.itap-header-duvidas');
    if (!center) {
      center = document.createElement('div');
      center.className = 'itap-header-duvidas';
      center.innerHTML = '<button type="button" id="ita-bot-duvidas" class="ita-bot-duvidas-btn" aria-label="Abrir dúvidas com o Ita Bot">DÚVIDAS</button>';
      row.appendChild(center);
    }
    var centerBtn = center.querySelector('#ita-bot-duvidas');
    if (centerBtn) centerBtn.onclick = _itabotAbrirItaBot;

    if (wrap.parentElement !== row) row.appendChild(wrap);
    var oldBtn = wrap.querySelector('.itabot-duvidas-btn');
    if (oldBtn) oldBtn.style.display = 'none';

    var logoImg = logo.querySelector('img');
    var size = logoImg ? Math.round(logoImg.getBoundingClientRect().width || logoImg.width || 80) : 80;
    document.documentElement.style.setProperty('--itabot-logo-size', size + 'px');
    wrap.style.display = 'flex';
  }
  window.addEventListener('resize', _itabotPosicionarAoLadoDoLogo);

  /* ─── Mostra o widget no topo, ao lado do logo ─── */
  _itabotPosicionarAoLadoDoLogo();

}());
