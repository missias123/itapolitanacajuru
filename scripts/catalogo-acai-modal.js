/* Catálogo visual somente para leitura: páginas renderizadas do PDF original do Açaí Natureon. */
(function () {
  'use strict';

  var dialog = document.getElementById('catalogo-acai-natureon');
  if (!dialog) return;
  var body = document.getElementById('catalogo-acai-corpo');
  var closeButton = document.getElementById('fechar-catalogo-acai');
  var live = document.getElementById('catalogo-acai-status');
  var lastTrigger = null;
  var loaded = false;
  var pages = Array.from({ length: 12 }, function (_, index) {
    return 'images/cardapio-acai-pdf/pagina-' + String(index + 1).padStart(2, '0') + '.webp';
  });

  function renderVisualPages() {
    body.innerHTML = '<div class="catalogo-acai-paginas" aria-label="Páginas visuais do cardápio de Açaí Natureon">' + pages.map(function (src, index) {
      var page = index + 1;
      return '<figure class="catalogo-acai-pagina">' +
        '<img src="' + src + '" alt="Página ' + page + ' do cardápio de Açaí Natureon" width="1200" height="1697" loading="' + (index < 2 ? 'eager' : 'lazy') + '" decoding="async"' + (index === 0 ? ' fetchpriority="high"' : '') + '>' +
      '</figure>';
    }).join('') + '</div>';
    loaded = true;
  }

  function showCatalog(trigger) {
    lastTrigger = trigger || document.activeElement;
    if (dialog.open) return;
    if (!loaded) renderVisualPages();
    dialog.showModal();
    document.documentElement.classList.add('catalogo-acai-aberto');
    body.scrollTop = 0;
    closeButton.focus({ preventScroll: true });
    live.textContent = 'Cardápio visual de Açaí Natureon aberto.';
  }

  function closeCatalog() {
    if (!dialog.open) return;
    dialog.close();
    document.documentElement.classList.remove('catalogo-acai-aberto');
    live.textContent = 'Cardápio visual de Açaí Natureon fechado.';
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-acai-modal-trigger]').forEach(function (trigger) {
    trigger.addEventListener('click', function (event) { event.preventDefault(); showCatalog(trigger); });
  });
  closeButton.addEventListener('click', closeCatalog);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); closeCatalog(); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) closeCatalog(); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var focusable = Array.prototype.slice.call(dialog.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  if (window.location.hash === '#catalogo-acai-natureon') {
    window.setTimeout(function () { showCatalog(document.querySelector('[data-acai-modal-trigger]')); }, 0);
  }
}());
