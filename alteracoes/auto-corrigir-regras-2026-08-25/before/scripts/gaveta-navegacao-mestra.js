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
        --neon-rgb: 255,255,255;
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
        border: 1px solid rgba(var(--neon-rgb), 0.72);
        box-shadow: 0 0 0 1px rgba(var(--neon-rgb), 0.16) inset, 0 0 7px rgba(var(--neon-rgb), 0.18);
        flex: 1;
        max-width: 110px;
      }
      .itap-nav-btn:nth-child(1) { --neon-rgb: 239, 1, 41; }
      .itap-nav-btn:nth-child(2) { --neon-rgb: 239, 108, 0; }
      .itap-nav-btn:nth-child(3) { --neon-rgb: 46, 125, 50; }
      .itap-nav-btn:nth-child(4) { --neon-rgb: 106, 27, 154; }
      .itap-nav-btn:nth-child(5) { --neon-rgb: 21, 101, 192; }
      .itap-nav-btn:hover,
      .itap-nav-btn:focus-visible {
        transform: translateY(-2px);
        border-color: rgba(var(--neon-rgb), 1);
        box-shadow: 0 0 0 1px rgba(var(--neon-rgb), 0.45) inset, 0 0 10px rgba(var(--neon-rgb), 0.7), 0 0 23px rgba(var(--neon-rgb), 0.46);
        filter: brightness(1.12) saturate(1.12);
        outline: none;
      }
      .itap-nav-btn:active {
        transform: translateY(0) scale(0.97);
        border-color: rgba(var(--neon-rgb), 1);
        box-shadow: 0 0 0 1px rgba(var(--neon-rgb), 0.65) inset, 0 0 13px rgba(var(--neon-rgb), 0.88), 0 0 28px rgba(var(--neon-rgb), 0.58);
        filter: brightness(1.18) saturate(1.16);
      }
      .itap-nav-btn[aria-current="page"] {
        border: 2px solid rgba(var(--neon-rgb), 1);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.55) inset, 0 0 10px rgba(var(--neon-rgb), 0.72), 0 0 20px rgba(var(--neon-rgb), 0.42);
        filter: brightness(1.12) saturate(1.08);
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
        .itap-header {
          padding: 3px 0 5px;
        }
        .itap-nav-container {
          display: grid !important;
          width: min(calc(100% - 16px), 420px) !important;
          margin: 0 auto !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 4px !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .itap-nav-btn {
          box-sizing: border-box !important;
          min-width: 0 !important;
          width: 100% !important;
          max-width: none !important;
          min-height: 38px !important;
          height: 38px !important;
          padding: 0 4px !important;
          border-radius: 9px !important;
          border-width: 1px !important;
          box-shadow: 0 0 0 1px rgba(var(--neon-rgb), 0.22) inset, 0 0 7px rgba(var(--neon-rgb), 0.18) !important;
          gap: 0;
          flex-direction: row !important;
          justify-content: center !important;
          align-items: center !important;
          padding-left: 4px !important;
          transform: none !important;
        }
        .itap-nav-btn[aria-current="page"] {
          transform: none !important;
          box-shadow: 0 0 0 2px rgba(var(--neon-rgb), 0.76) inset, 0 0 10px rgba(var(--neon-rgb), 0.7), 0 0 18px rgba(var(--neon-rgb), 0.4) !important;
        }
        /* FEEDBACK fica sozinho na primeira linha e ocupa toda a largura, bem compacto */
        .itap-nav-btn:nth-child(3) {
          grid-column: 1 / -1 !important;
          order: -1 !important;
          width: 100% !important;
          justify-self: stretch !important;
          min-height: 38px !important;
          height: 38px !important;
          padding: 0 8px !important;
          border-radius: 9px !important;
          background: linear-gradient(135deg, #2E7D32 0%, #43A047 52%, #1B5E20 100%) !important;
          box-shadow: 0 4px 10px rgba(27,94,32,0.24), 0 0 0 1px rgba(255,255,255,0.22) inset !important;
          justify-content: center !important;
          flex-direction: row !important;
          gap: 0 !important;
        }
        /* No Android, os botões exibem somente os nomes; os símbolos ficam ocultos. */
        .itap-nav-icon,
        .itap-nav-icon svg,
        .itap-nav-icon-fallback {
          display: none !important;
        }
        .itap-nav-label {
          max-width: 100% !important;
          overflow-wrap: normal !important;
          white-space: nowrap !important;
          font-family: 'Segoe UI', 'Trebuchet MS', Arial, sans-serif !important;
          font-size: clamp(11px, 3.2vw, 13px) !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          letter-spacing: 0.2px !important;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
          text-align: center !important;
        }
        .itap-nav-btn:nth-child(3) .itap-nav-label {
          font-size: clamp(11.5px, 3.35vw, 13.5px) !important;
          letter-spacing: 0.25px !important;
          text-align: center !important;
        }
      }
      @media (max-width: 380px) {
        .itap-header { padding-bottom: 4px; }
        .itap-nav-container { width: min(calc(100% - 16px), 420px) !important; gap: 3px !important; padding-inline: 0 !important; }
        .itap-nav-btn { min-height: 36px !important; height: 36px !important; padding-inline: 3px !important; }
        .itap-nav-btn:nth-child(3) { min-height: 36px !important; height: 36px !important; width: 100% !important; }
        .itap-nav-label { font-size: 11px !important; letter-spacing: 0.15px !important; }
        .itap-nav-btn:nth-child(3) .itap-nav-label { font-size: 11.5px !important; }
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
