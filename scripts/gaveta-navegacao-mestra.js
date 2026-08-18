/* ==========================================================
   GAVETA: NAVEGAÇÃO MESTRA (FONTE ÚNICA DE VERDADE)
   Sorveteria Itapolitana Cajuru
   ========================================================== */
(function() {
  'use strict';

  const NAV_ITEMS = [
    { label: 'Início', href: 'index.html', icon: '🏠', bg: 'linear-gradient(135deg, #EF0129, #B71C1C)' },
    { label: 'Promo', href: 'promocao.html', icon: '🎁', bg: 'linear-gradient(135deg, #E65100, #EF6C00)' },
    { label: 'Feedback', href: 'dicas.html', icon: '⭐', bg: 'linear-gradient(135deg, #2E7D32, #388E3C)' },
    { label: 'História', href: 'sobre.html', icon: '📖', bg: 'linear-gradient(135deg, #4A148C, #6A1B9A)' },
    { label: 'Comprar', href: 'encomendas.html', icon: '🛍️', bg: 'linear-gradient(135deg, #0D47A1, #1565C0)' }
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
            return `
              <a href="${item.href}" class="itap-nav-btn" style="background: ${item.bg};" ${isActive ? 'aria-current="page"' : ''}>
                <span class="itap-nav-icon">${item.icon}</span>
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNavbar);
  } else {
    renderNavbar();
  }
})();
