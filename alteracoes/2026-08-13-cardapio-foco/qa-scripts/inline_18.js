
/* =====================================================
   VER NOSSO CARDÁPIO — Toggle do painel de cardápio
   ===================================================== */

// ── Abre/fecha o painel de cardápio ───────────────────────────
function toggleCardápio() {
  var btn = document.getElementById('vc-btn');
  var c   = document.getElementById('vc-container');
  var ab  = c.classList.contains('aberto');

  if (ab) {
    // Fecha: trava a altura atual antes de animar para 0 (evita pulo)
    c.style.maxHeight = c.scrollHeight + 'px';
    requestAnimationFrame(function() {
      c.style.maxHeight = '0';
      c.style.opacity   = '0';
    });
    c.classList.remove('aberto');
    btn.classList.remove('aberto');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir o cardápio da Sorveteria Itapolitana');
  } else {
    c.classList.add('aberto');
    btn.classList.add('aberto');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Fechar o cardápio da Sorveteria Itapolitana');
    // Altura exata para animação suave de abertura
    c.style.maxHeight = c.scrollHeight + 'px';
    c.style.opacity   = '1';
    // Após animação, remove inline → CSS max-height:9999px assume → accordions expandem livremente
    setTimeout(function(){ if (c.classList.contains('aberto')) c.style.maxHeight = ''; }, 650);
    // exibe barra de categorias
    var catNav = document.getElementById('menu-categorias-cardapio');
    if (catNav) catNav.style.display = '';
  }
}

// ── Fecha o painel de cardápio ───────────────────────────────
function fecharCardápio() {
  var btn = document.getElementById('vc-btn');
  var c   = document.getElementById('vc-container');
  if (c && c.classList.contains('aberto')) {
    c.style.maxHeight = c.scrollHeight + 'px';
    requestAnimationFrame(function() {
      c.style.maxHeight = '0';
      c.style.opacity   = '0';
    });
    c.classList.remove('aberto');
    btn.classList.remove('aberto');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir o cardápio da Sorveteria Itapolitana');
    // oculta barra de categorias ao fechar
    var catNav = document.getElementById('menu-categorias-cardapio');
    if (catNav) catNav.style.display = 'none';
  }
}

// ── Barra sticky de categorias: mostra/oculta com o cardápio ──
(function() {
  document.addEventListener('click', function(e) {
    var pill = e.target.closest('.cat-pill');
    if (!pill) return;
    e.preventDefault();
    var accId = pill.getAttribute('data-acc');
    var target = accId && document.getElementById(accId);
    if (!target) return;
    // Destaca a pill ativa
    document.querySelectorAll('.cat-pill').forEach(function(p) { p.classList.remove('ativa'); });
    pill.classList.add('ativa');
    // Abre o accordion antes de rolar
    if (target.querySelector('.acc-header[aria-expanded="false"]')) {
      if (typeof toggleAcc === 'function') toggleAcc(accId);
    }
    // Sem scrollIntoView: abrir a categoria não pode deslocar a tela.
    // O foco permanece no ponto em que o usuário clicou.
    var header = target.querySelector('.acc-header');
    if (header && typeof header.focus === 'function') header.focus({ preventScroll: true });
  });
})();

// Cardápio fecha com ESC — não fecha ao clicar fora (só pelo botão)
// NOTA: Este listener é separado do ESC dos modais — sem conflito
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') fecharCardápio();
});
