/* ==========================================================
   GAVETA: NAVEGAÇÃO MESTRA (FONTE ÚNICA DE VERDADE)
   Sorveteria Itapolitana Cajuru
   Versão: 3.1 — 18/08/2026 — Unificação Total World Class
   ========================================================== */
(function() {
  'use strict';

  const NAV_ITEMS = [
    { label: 'INÍCIO', href: 'index.html', icon: 'home', bg: 'linear-gradient(135deg, #EF0129, #B71C1C)' },
    { label: 'PROMOÇÃO', href: 'promocao.html', icon: 'promo', bg: 'linear-gradient(135deg, #E65100, #EF6C00)' },
    { label: 'FEEDBACK', href: 'dicas.html', icon: 'star', bg: 'linear-gradient(135deg, #2E7D32, #388E3C)' },
    { label: 'HISTÓRIA', href: 'sobre.html', icon: 'info', bg: 'linear-gradient(135deg, #4A148C, #6A1B9A)' },
    { label: 'ENCOMENDAS', href: 'encomendas.html', icon: 'box', bg: 'linear-gradient(135deg, #0D47A1, #1565C0)' }
  ];

  function renderNavbar() {
    const slots = document.querySelectorAll('[data-itap-header-slot]');
    if (!slots.length) return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const headerHtml = `
      <header class="itap-header">
        <nav class="itap-nav-container" aria-label="Navegação Principal">
          ${NAV_ITEMS.map(item => {
            const isActive = currentPath === item.href || (currentPath === '' && item.href === 'index.html');

            // Tenta usar ItapIcon se estiver disponível, senão usa emoji como fallback
            const iconHtml = (typeof window.ItapIcon === 'function')
              ? window.ItapIcon(item.icon, 'white small')
              : `<span class="itap-nav-icon-fallback">${getEmoji(item.icon)}</span>`;

            return `
              <a href="${item.href}" class="itap-nav-btn" style="background: ${item.bg};" ${isActive ? 'aria-current="page"' : ''}>
                <span class="itap-nav-icon">${iconHtml}</span>
                <span class="itap-nav-label">${item.label}</span>
              </a>
            `;
          }).join('')}
        </nav>
      </header>
    `;

    slots.forEach(slot => {
      slot.innerHTML = headerHtml;
    });
  }

  function getEmoji(iconName) {
    const emojis = { 'home': '🏠', 'promo': '🎁', 'star': '⭐', 'info': '📖', 'box': '🛍️' };
    return emojis[iconName] || '🍦';
  }

  // Estilos críticos para o cabeçalho unificado
  function injectStyles() {
    if (document.getElementById('itap-nav-mestra-styles')) return;
    const style = document.createElement('style');
    style.id = 'itap-nav-mestra-styles';
    style.textContent = `
      .itap-header {
        position: sticky;
        top: 0;
        z-index: 2000;
        width: 100%;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 8px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }
      .itap-nav-container {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 0 12px;
        flex-wrap: nowrap;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .itap-nav-container::-webkit-scrollbar { display: none; }
      .itap-nav-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 68px;
        padding: 6px 4px;
        border-radius: 12px;
        text-decoration: none;
        color: white !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255,255,255,0.2);
        flex: 1;
        max-width: 110px;
      }
      .itap-nav-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0,0,0,0.25);
        filter: brightness(1.1);
      }
      .itap-nav-btn[aria-current="page"] {
        border: 2px solid white;
        box-shadow: 0 0 12px rgba(255,255,255,0.6);
        filter: brightness(1.2);
        transform: scale(1.05);
      }
      .itap-nav-icon {
        height: 20px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .itap-nav-label {
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
        text-align: center;
        white-space: nowrap;
        letter-spacing: 0.6px;
      }
      .itap-nav-icon svg { width: 18px; height: 18px; }
      @media (max-width: 600px) {
        .itap-nav-container {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 12px !important;
          padding: 10px 15px !important;
          overflow-x: visible !important;
        }
        .itap-nav-btn {
          min-width: 0 !important;
          max-width: none !important;
          min-height: 88px !important;
          height: 88px !important;
          padding: 14px 10px !important;
          border-radius: 18px !important;
          box-shadow: 0 5px 14px rgba(0,0,0,0.18) !important;
        }
        /* Botão FEEDBACK (3º item no array NAV_ITEMS) no topo sozinho */
        .itap-nav-btn:nth-child(3) {
          grid-column: 1 / span 2 !important;
          order: -1 !important;
          min-height: 98px !important;
          height: 98px !important;
          background: linear-gradient(135deg, #2E7D32, #1B5E20) !important;
        }
        .itap-nav-icon {
          height: 38px !important;
          margin-bottom: 8px !important;
        }
        .itap-nav-icon svg, .itap-nav-icon-fallback {
          width: 36px !important;
          height: 36px !important;
          font-size: 34px !important;
        }
        .itap-nav-label {
          font-size: clamp(14px, 4vw, 16px) !important;
          font-weight: 900 !important;
          line-height: 1.15 !important;
          letter-spacing: 0.6px !important;
        }
      }
      @media (max-width: 380px) {
        .itap-nav-label { font-size: 13px !important; }
        .itap-nav-btn { min-height: 82px !important; height: 82px !important; padding-inline: 8px !important; }
        .itap-nav-btn:nth-child(3) { min-height: 92px !important; height: 92px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  injectStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNavbar);
  } else {
    renderNavbar();
  }
})();
