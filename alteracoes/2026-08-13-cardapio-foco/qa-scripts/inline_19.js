
/* =====================================================
   MELHORIAS VISUAIS — INTERSECTION OBSERVER
   ===================================================== */

// Animações de entrada com Intersection Observer
// Observer exposto globalmente para ser usado pelo DOMContentLoaded principal
window._animObserver = null;
if ('IntersectionObserver' in window) {
  window._animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visivel');
        window._animObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
}

// Status da loja (aberto/fechado) em tempo real
function atualizarStatusLoja() {
  const agora = new Date();
  const hora = agora.getHours();
  const min = agora.getMinutes();
  const horaAtual = hora + min / 60;

  // Horários dinâmicos via config.json (fallback: 10h–22h)
  const abre  = window.ITAP_HORA_ABRE  !== undefined ? window.ITAP_HORA_ABRE  : 10;
  const fecha = window.ITAP_HORA_FECHA !== undefined ? window.ITAP_HORA_FECHA : 22;
  const aberto = horaAtual >= abre && horaAtual < fecha;

  const statusEls = document.querySelectorAll('.status-loja');
  statusEls.forEach(el => {
    if (aberto) {
      el.className = 'status-loja aberto';
      el.innerHTML = '<span class="dot"></span> Aberto agora';
    } else {
      el.className = 'status-loja fechado';
      const abreAmanha = hora >= fecha;
      el.innerHTML = `<span class="dot"></span> ${abreAmanha ? 'Abre amanhã às ' + abre + 'h' : 'Abre às ' + abre + 'h'}`;
    }
  });
}

// Barra de carregamento
(function() {
  const bar = document.createElement('div');
  bar.id = 'loading-bar';
  bar.style.width = '0%';
  document.body.prepend(bar);
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    bar.style.width = progress + '%';
  }, 200);
  
  window.addEventListener('load', () => {
    clearInterval(interval);
    bar.style.width = '100%';
    setTimeout(() => { bar.style.opacity = '0'; }, 300);
    setTimeout(() => { bar.remove(); }, 600);
  });
})();

// [atualizarStatusLoja fundida no DOMContentLoaded principal]

// ── NAVEGAÇÃO INLINE EM 3 NÍVEIS ─────────────────────────────────────────────
// Guarda o HTML original do acc-body para restaurar ao clicar Voltar
var _nivelAnterior = {};
var _cardapioScrollAnterior = {};
var _menuFocoId = null;
var _menuFocoScrollX = 0;
var _menuFocoScrollY = 0;

// Restaura a posição original depois de liberar o Modo Foco.
// A aplicação em múltiplos frames evita que o reflow do accordion provoque salto.
function _restaurarPosicaoCardapio(x, y) {
  var left = Number.isFinite(Number(x)) ? Number(x) : 0;
  var top = Number.isFinite(Number(y)) ? Number(y) : 0;
  var aplicar = function() {
    window.scrollTo({ left: left, top: top, behavior: 'auto' });
    document.documentElement.scrollTop = top;
    if (document.body) document.body.scrollTop = top;
  };
  aplicar();
  requestAnimationFrame(function() {
    aplicar();
    requestAnimationFrame(function() {
      aplicar();
      setTimeout(aplicar, 40);
      setTimeout(aplicar, 120);
    });
  });
}

/* Modo Foco: isola o conteúdo aberto no cardápio da página inicial.
   Escopo deliberadamente limitado ao index.html; não compartilha estado com
   encomendas, promoção ou qualquer outra página. */
function _menuFocoAtivar(acc) {
  if (!acc || !acc.id) return;
  if (_menuFocoId === acc.id) return;
  if (_menuFocoId) _menuFocoDesativar(false);
  _menuFocoScrollX = window.scrollX || window.pageXOffset || 0;
  _menuFocoScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  document.documentElement.style.setProperty('--menu-foco-scroll-left', _menuFocoScrollX + 'px');
  document.documentElement.style.setProperty('--menu-foco-scroll-top', _menuFocoScrollY + 'px');
  document.documentElement.classList.add('menu-foco-aberto');
  document.body.classList.add('menu-foco-aberto');
  acc.classList.add('menu-foco-ativo');
  _menuFocoId = acc.id;

  var back = acc.querySelector(':scope > .menu-foco-back');
  if (!back) {
    back = document.createElement('button');
    back.type = 'button';
    back.className = 'menu-foco-back';
    back.setAttribute('aria-label', 'Voltar ao cardápio');
    back.textContent = '← Voltar ao cardápio';
    back.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      _menuFocoVoltar(acc);
    });
    var header = acc.querySelector(':scope > .acc-header');
    if (header && header.nextSibling) acc.insertBefore(back, header.nextSibling);
    else acc.appendChild(back);
  }
}

function _menuFocoDesativar(restaurarPosicao) {
  if (!_menuFocoId) return;
  var acc = document.getElementById(_menuFocoId);
  var x = _menuFocoScrollX;
  var y = _menuFocoScrollY;
  if (acc) {
    acc.classList.remove('menu-foco-ativo');
    var back = acc.querySelector(':scope > .menu-foco-back');
    if (back) back.remove();
  }
  document.documentElement.classList.remove('menu-foco-aberto');
  document.body.classList.remove('menu-foco-aberto');
  document.documentElement.style.removeProperty('--menu-foco-scroll-left');
  document.documentElement.style.removeProperty('--menu-foco-scroll-top');
  _menuFocoId = null;
  if (restaurarPosicao) _restaurarPosicaoCardapio(x, y);
}

function _menuFocoVoltar(acc) {
  if (!acc) return;
  var id = acc.id;
  var body = acc.querySelector('.acc-body');
  var x = _menuFocoScrollX;
  var y = _menuFocoScrollY;

  // Restaura o nível anterior enquanto o painel ainda está fixo.
  // Assim o reflow não desloca a página antes da liberação do foco.
  if (body && _nivelAnterior[id]) {
    body.innerHTML = _nivelAnterior[id];
    delete _nivelAnterior[id];
  }
  _menuFocoDesativar(false);
  _restaurarPosicaoCardapio(x, y);
}


// ═══════════════════════════════════════════════════════════════════════════
// _semPulo() — TÉCNICA PADRÃO DOS GRANDES SITES (iFood, Rappi, WhatsApp Web)
// Congela a posição da tela ANTES de qualquer mudança de conteúdo.
// Restaura a posição DEPOIS no próximo frame — antes do browser autorrolar.
// Recalcula a altura do accordion para não quebrar a animação.
// USO: _semPulo(function() { /* qualquer mudança de conteúdo */ });
// ═══════════════════════════════════════════════════════════════════════════
function _semPulo(fn) {
  var y = window.scrollY || window.pageYOffset || 0;
  fn(); // executa a mudança
  // Restaura posição em 2 frames consecutivos para garantir
  requestAnimationFrame(function() {
    window.scrollTo(0, y);
    requestAnimationFrame(function() {
      window.scrollTo(0, y);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA INLINE — NAVEGAÇÃO ESTÁTICA EM 3 NÍVEIS (sem modal, sem scroll)
// Regra: ao clicar em qualquer botão do cardápio, a página NÃO se move.
// Botão ← Voltar retorna ao nível anterior dentro do mesmo accordion.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// CARDAPIO_MAP — Tabela Mestre do Cardápio
// Sincronizada automaticamente com dados/produtos.json via Admin
// Estrutura: accId → { bodyId, titulo, tipo, getSabores() }
// ═══════════════════════════════════════════════════════════════════════════

var CARDAPIO_MAP = {};

function sincronizarCardapioMap() {
  CARDAPIO_MAP = {
    'acc-sorvetes': {
      bodyId: 'sorvetes-body',
      titulo: function() { var s = getSaboresDisponíveis(); return '🍦 ' + s.length + ' Sabores de Sorvete'; },
      sub: 'Informe o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() { return getSaboresDisponíveis(); }
    },
    'acc-milk': {
      bodyId: 'milk-body',
      titulo: function() { var s = getSaboresDisponíveis(); return '🥤 Milkshakes – ' + s.length + ' Sabores'; },
      sub: 'Informe o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() { return getSaboresDisponíveis(); }
    },
    'acc-tacas': {
      bodyId: 'tacas-body',
      titulo: function() {
        var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
        return '🍨 Taças – ' + Object.keys(t).length + ' Opções + 35 Sabores';
      },
      sub: 'Escolha a taça e o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() {
        var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
        var opcoes = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
        return opcoes.concat(['───────────────']).concat(getSaboresDisponíveis());
      }
    },
    'acc-tacas-p': {
      bodyId: 'tacas-p-body',
      titulo: function() {
        var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
        return '👑 Taças Premium – ' + Object.keys(t).length + ' Opções + 35 Sabores';
      },
      sub: 'Escolha a taça e o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() {
        var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
        var opcoes = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
        return opcoes.concat(['───────────────']).concat(getSaboresDisponíveis());
      }
    },
    'acc-açaí': {
      bodyId: 'açaí-body',
      titulo: function() { return '🍇 Cardápio Natureon Açaí'; },
      sub: 'Monte sua combinação favorita com muito sabor, cremosidade e ingredientes especiais',
      getSabores: function() {
        var cats = produtos && produtos.açaí && produtos.açaí.categorias ? produtos.açaí.categorias : [];
        var items = [];
        cats.forEach(function(c) {
          items.push('── ' + c.titulo + ' ──');
          (c.produtos||[]).forEach(function(p) {
            if(p.preco!=null) items.push(p.nome + ' – R$ ' + Number(p.preco).toFixed(2).replace('.',','));
          });
        });
        return items;
      }
    },
    'acc-picolés': {
      bodyId: 'picolés-body',
      titulo: function() { return '🍭 Picolés'; },
      sub: 'Sabores disponíveis para este tipo de picolé',
      getSabores: function() { return getSaboresDisponíveis(); }
    },
    'acc-iso': {
      bodyId: 'iso-body',
      titulo: function() { return '🧊 Isopores de Viagem'; },
      sub: 'Informe o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() { return getSaboresDisponíveis(); }
    },
    'acc-sobremesas': {
      bodyId: 'sobremesas-body',
      titulo: function() { return '🍰 Sobremesas'; },
      sub: 'Informe a sobremesa desejada ao fazer seu pedido na loja',
      getSabores: function() {
        var s = produtos && produtos.sobremesas ? produtos.sobremesas : {};
        return Object.entries(s).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
      }
    }
  };
}

// Obtém o acc-body correto usando CARDAPIO_MAP ou closest
function _getAccBody(el, bodyIdHint) {
  // 1. Tenta closest direto
  var found = el.closest ? el.closest('.acc-body') : null;
  if (found) return found;
  // 2. Sobe manualmente até 10 níveis
  var cur = el.parentElement;
  for (var i = 0; i < 10; i++) {
    if (!cur) break;
    if (cur.classList && cur.classList.contains('acc-body')) return cur;
    cur = cur.parentElement;
  }
  // 3. Usa bodyIdHint ou CARDAPIO_MAP
  if (bodyIdHint) return document.getElementById(bodyIdHint);
  // 4. Tenta encontrar pelo acc pai
  var acc = el.closest ? el.closest('.acc') : null;
  if (acc && CARDAPIO_MAP[acc.id]) return document.getElementById(CARDAPIO_MAP[acc.id].bodyId);
  return null;
}

// Mostra sabores/itens inline dentro do acc-body — SEM PULO (padrão iFood)
function mostrarSaboresInline(accBodyEl, titulo, sub, chips) {
  if (!accBodyEl) return;
  var accId = accBodyEl.closest && accBodyEl.closest('.acc') ? accBodyEl.closest('.acc').id : accBodyEl.id;
  if (accId) _nivelAnterior[accId] = accBodyEl.innerHTML;
  var acc = accBodyEl.closest && accBodyEl.closest('.acc') ? accBodyEl.closest('.acc') : null;
  if (acc) _menuFocoAtivar(acc);

  var chipsHtml = chips.map(function(s) {
    return '<span class="chip-inline">' + s + '</span>';
  }).join('');

  _semPulo(function() {
    accBodyEl.innerHTML =
      '<div class="sabores-inline">' +
        '<div class="sabores-inline-titulo">' + titulo + '</div>' +
        '<div class="sabores-inline-sub">' + sub + '</div>' +
        '<div class="chips-inline">' + chipsHtml + '</div>' +
        '<button type="button" class="btn-voltar-nivel" onclick="voltarNivel(this)">← Voltar</button>' +
      '</div>';
  });
}

function voltarNivel(btn) {
  var accBody = btn.closest ? btn.closest('.acc-body') : null;
  if (!accBody) {
    var cur = btn.parentElement;
    for (var i = 0; i < 8; i++) {
      if (!cur) break;
      if (cur.classList && cur.classList.contains('acc-body')) { accBody = cur; break; }
      cur = cur.parentElement;
    }
  }
  if (!accBody) return;
  var acc = accBody.closest ? accBody.closest('.acc') : null;
  var accId = acc ? acc.id : accBody.id;
  if (accId && _nivelAnterior[accId]) {
    var focoAtivo = _menuFocoId === accId;
    var focoX = _menuFocoScrollX;
    var focoY = _menuFocoScrollY;
    var restaurarNivel = function() {
      accBody.innerHTML = _nivelAnterior[accId];
      delete _nivelAnterior[accId];
    };
    if (focoAtivo) {
      restaurarNivel();
      _menuFocoDesativar(false);
      _restaurarPosicaoCardapio(focoX, focoY);
    } else {
      _semPulo(restaurarNivel);
    }
  }
}

// ── FUNÇÕES INLINE — usam CARDAPIO_MAP para localizar o container correto ────

function abrirSaboresInline(tipo, titulo, el) {
  var bodyId = tipo === 'sorvetes' ? 'sorvetes-body' :
               tipo === 'milkshakes' ? 'milk-body' :
               tipo === 'iso' ? 'iso-body' :
               tipo === 'sobremesas' ? 'sobremesas-body' : null;
  var accBody = _getAccBody(el, bodyId);
  if (!accBody) return;
  var sabores = getSaboresDisponíveis();
  mostrarSaboresInline(accBody, titulo, 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
}

function abrirMilkshakeSaboresInline(el) {
  var accBody = _getAccBody(el, 'milk-body');
  if (!accBody) return;
  var sabores = getSaboresDisponíveis();
  mostrarSaboresInline(accBody, '🥤 Milkshakes – ' + sabores.length + ' Sabores', 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
}

function abrirTacasTradicionaisInline(el) {
  var accBody = _getAccBody(el, 'tacas-body');
  if (!accBody) return;
  var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
  var opcoes = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  var sabores = getSaboresDisponíveis();
  // Mostra: seção de opções de taças + seção dos 35 sabores
  mostrarDuasSecoes(accBody,
    '🍨 Taças – ' + opcoes.length + ' Opções', 'Escolha a taça desejada ao fazer seu pedido na loja', opcoes,
    '🍦 ' + sabores.length + ' Sabores Disponíveis', 'Informe o sabor desejado ao fazer seu pedido na loja', sabores
  );
}

function abrirTacasSujasInline(el) {
  var accBody = _getAccBody(el, 'tacas-p-body');
  if (!accBody) return;
  var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
  var opcoes = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  var sabores = getSaboresDisponíveis();
  mostrarDuasSecoes(accBody,
    '👑 Taças Premium – ' + opcoes.length + ' Opções', 'Escolha a taça desejada ao fazer seu pedido na loja', opcoes,
    '🍦 ' + sabores.length + ' Sabores Disponíveis', 'Informe o sabor desejado ao fazer seu pedido na loja', sabores
  );
}

function abrirPicoléInline(key, nome, el) {
  var accBody = _getAccBody(el, 'picolés-body');
  if (!accBody) return;
  var sabs = produtos && produtos.picolés && produtos.picolés[key] && produtos.picolés[key].sabores ? produtos.picolés[key].sabores : [];
  var chips = sabs.length > 0 ? sabs : getSaboresDisponíveis();
  mostrarSaboresInline(accBody, '🍭 Sabores – ' + nome, 'Sabores disponíveis para este tipo de picolé', chips);
}

function abrirComplementosInline(el) {
  var accBody = _getAccBody(el, 'açaí-body');
  if (!accBody) return;

  var acc = accBody.closest ? accBody.closest('.acc') : null;
  var accId = acc ? acc.id : accBody.id;
  if (accId) _nivelAnterior[accId] = accBody.innerHTML;
  if (acc) _menuFocoAtivar(acc);

  var labelComp = {frutas:'🍓 Frutas', cremes:'🍯 Cremes', guloseimas:'🍬 Guloseimas', chocolates:'🍫 Chocolates'};
  var html = '<div class="sabores-inline">';
  html += '<div class="sabores-inline-titulo">🫐 Ingredientes do Açaí</div>';
  html += '<div class="sabores-inline-sub">Escolha os ingredientes ao fazer seu pedido na loja</div>';

  if (produtos && produtos.açaí && produtos.açaí.complementos) {
    Object.entries(produtos.açaí.complementos).forEach(function(entry) {
      var k = entry[0], info = entry[1];
      var getNome = function(i) { return typeof i === 'object' && i !== null ? i.nome : i; };
      var isEsg = function(i) { return typeof i === 'object' && i !== null && (i.esgotado || i.estoque <= 0); };
      html += '<div style="margin-bottom:12px">';
      var precoVal = (info.preco !== undefined ? info.preco : (info['pre\u00e7o'] !== undefined ? info['pre\u00e7o'] : null));
      var precoStr = precoVal !== null ? '+ R$ ' + Number(precoVal).toFixed(2).replace('.',',') + ' cada' : '';
      html += '<div style="font-size:13px;font-weight:900;color:#7B2D8B;margin-bottom:6px;">' + (labelComp[k] || k) + (precoStr ? ' <span style="font-size:11px;color:#9333EA;font-weight:700">' + precoStr + '</span>' : '') + '</div>';
      html += '<div class="chips-inline">';
      info.itens.forEach(function(i) {
        var esg = isEsg(i);
        html += '<span class="chip-inline" style="' + (esg ? 'opacity:.45;text-decoration:line-through;' : '') + '">' + getNome(i) + (esg ? ' ✕' : '') + '</span>';
      });
      html += '</div></div>';
    });
  } else {
    html += '<div style="text-align:center;color:#555;padding:12px">Consulte os ingredientes disponíveis na loja</div>';
  }

  html += '<button type="button" class="btn-voltar-nivel" onclick="voltarNivel(this)">← Voltar</button>';
  html += '</div>';
  _semPulo(function() { accBody.innerHTML = html; });
}

// Mostra duas seções (opções + sabores) dentro do acc-body
function mostrarDuasSecoes(accBodyEl, titulo1, sub1, chips1, titulo2, sub2, chips2) {
  if (!accBodyEl) return;
  var acc = accBodyEl.closest && accBodyEl.closest('.acc') ? accBodyEl.closest('.acc') : null;
  var accId = acc ? acc.id : accBodyEl.id;
  if (accId) _nivelAnterior[accId] = accBodyEl.innerHTML;
  if (acc) _menuFocoAtivar(acc);

  var chips1Html = chips1.map(function(s) { return '<span class="chip-inline">' + s + '</span>'; }).join('');
  var chips2Html = chips2.map(function(s) { return '<span class="chip-inline">' + s + '</span>'; }).join('');

  _semPulo(function() {
    accBodyEl.innerHTML =
      '<div class="sabores-inline">' +
        '<div class="sabores-inline-titulo">' + titulo1 + '</div>' +
        '<div class="sabores-inline-sub">' + sub1 + '</div>' +
        '<div class="chips-inline">' + chips1Html + '</div>' +
        '<div style="height:1px;background:linear-gradient(90deg,transparent,#E040FB,transparent);margin:14px 0"></div>' +
        '<div class="sabores-inline-titulo">' + titulo2 + '</div>' +
        '<div class="sabores-inline-sub">' + sub2 + '</div>' +
        '<div class="chips-inline">' + chips2Html + '</div>' +
        '<button type="button" class="btn-voltar-nivel" onclick="voltarNivel(this)">← Voltar</button>' +
      '</div>';
  });
}

