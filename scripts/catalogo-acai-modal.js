/* Catálogo modal somente para leitura. Fonte oficial: dados/produtos.json > cadastro_skus.por_chave. */
(function () {
  'use strict';

  var dialog = document.getElementById('catalogo-acai-natureon');
  if (!dialog) return;
  var body = document.getElementById('catalogo-acai-corpo');
  var closeButton = document.getElementById('fechar-catalogo-acai');
  var live = document.getElementById('catalogo-acai-status');
  var lastTrigger = null;
  var loaded = false;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  function money(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function categories(records) {
    var desired = ['Açaí — 250 ml', 'Açaí — 300 ml', 'Açaí — 400 ml', 'Açaí — 500 ml', 'Açaí — 600 ml', 'Açaí — 700 ml', 'Milk-shake de Açaí', 'Taças Gourmet — 500 ml'];
    var order = function (category) {
      var index = desired.indexOf(category);
      return index === -1 ? 99 : index;
    };
    return records.filter(function (record) {
      return record.ativo !== false && desired.indexOf(record.categoria || '') !== -1;
    }).sort(function (a, b) {
      var categoryCompare = order(a.categoria) - order(b.categoria);
      return categoryCompare || String(a.nome).localeCompare(String(b.nome), 'pt-BR') || String(a.sku).localeCompare(String(b.sku));
    }).reduce(function (grouped, record) {
      (grouped[record.categoria] = grouped[record.categoria] || []).push(record);
      return grouped;
    }, {});
  }

  function combination(name) {
    return String(name).replace(/^Açaí Natureon\s*\+\s*/i, '') || 'Combinação Natureon';
  }

  function render(records) {
    var grouped = categories(records);
    var sections = Object.keys(grouped).map(function (category) {
      var products = grouped[category].map(function (product) {
        return '<article class="catalogo-acai-produto">' +
          '<h3>' + escapeHtml(product.nome) + '</h3>' +
          '<p class="catalogo-acai-tamanho">' + escapeHtml(product.tamanho || category.replace(/^.*—\s*/, '')) + '</p>' +
          '<p class="catalogo-acai-combinacao"><span>Combinação</span> ' + escapeHtml(combination(product.nome)) + '</p>' +
          '<p class="catalogo-acai-preco">' + money(product.preco) + '</p>' +
        '</article>';
      }).join('');
      return '<section class="catalogo-acai-grupo" aria-labelledby="grupo-' + escapeHtml(category.replace(/[^a-z0-9]+/gi, '-').toLowerCase()) + '">' +
        '<h2 id="grupo-' + escapeHtml(category.replace(/[^a-z0-9]+/gi, '-').toLowerCase()) + '">' + escapeHtml(category) + '</h2>' +
        '<div class="catalogo-acai-grid">' + products + '</div>' +
      '</section>';
    }).join('');
    if (!sections) throw new Error('Nenhum produto de Açaí Natureon disponível no catálogo mestre.');
    body.innerHTML = '<section class="catalogo-acai-intro" aria-labelledby="catalogo-acai-titulo-interno">' +
      '<p class="catalogo-acai-selo">Catálogo somente informativo</p>' +
      '<h1 id="catalogo-acai-titulo-interno">Açaí Natureon</h1>' +
      '<p class="catalogo-acai-subtitulo">Açaí premium de verdade!</p>' +
      '<p>Monte sua combinação favorita com açaí cremoso e complementos especiais.</p>' +
      '<dl class="catalogo-acai-institucional"><div><dt>Local</dt><dd>Cajuru – SP</dd></div><div><dt>Desde</dt><dd>2007</dd></div><div><dt>Atendimento</dt><dd>Todos os dias, das 10h às 22h</dd></div><div><dt>Consulta</dt><dd>Produtos disponíveis para consulta no balcão da Itapolitana</dd></div></dl>' +
    '</section>' + sections +
    '<footer class="catalogo-acai-rodape"><strong>Agradecemos a preferência!</strong><span>Consulte a disponibilidade dos produtos diretamente na loja.</span><span>Sorveteria Itapolitana · Cajuru – SP · Todos os dias, das 10h às 22h</span></footer>';
  }

  function fetchRecords() {
    return fetch('dados/produtos.json?v=' + Date.now(), { cache: 'no-store' })
      .then(function (response) { if (!response.ok) throw new Error('Falha ao carregar o catálogo.'); return response.json(); })
      .then(function (raw) { return Object.values((raw.cadastro_skus && raw.cadastro_skus.por_chave) || {}); });
  }

  function showCatalog(trigger) {
    lastTrigger = trigger || document.activeElement;
    if (dialog.open) return;
    dialog.showModal();
    document.documentElement.classList.add('catalogo-acai-aberto');
    body.scrollTop = 0;
    closeButton.focus({ preventScroll: true });
    live.textContent = 'Catálogo Açaí Natureon aberto.';
    if (loaded) return;
    body.innerHTML = '<p class="catalogo-acai-carregando" role="status">Carregando catálogo de Açaí Natureon…</p>';
    fetchRecords().then(function (records) { render(records); loaded = true; }).catch(function () {
      body.innerHTML = '<p class="catalogo-acai-erro" role="alert">Não foi possível carregar o catálogo agora. Tente novamente em instantes.</p>';
    });
  }

  function closeCatalog() {
    if (!dialog.open) return;
    dialog.close();
    document.documentElement.classList.remove('catalogo-acai-aberto');
    live.textContent = 'Catálogo Açaí Natureon fechado.';
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
