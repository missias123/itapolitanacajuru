// ENCOMENDAS.JS - Sorveteria Itapolitana Cajuru
// Lógica completa do fluxo de encomendas
// =====================================================
// SINGLE SOURCE OF TRUTH — dados/produtos.json
// Admin salva → produtos.json → site lê (padrão profissional)
// =====================================================
const ITAP_PRODUTOS_URL = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/dados/produtos.json';
const ITAP_WORKER_API = 'https://api.itapolitanacajuru.com.br';
const _GH_TK  = (function(){return localStorage.getItem('itap_gh_token')||'';})();
const _GH_API = 'https://api.github.com/repos/missias123/itapolitanacajuru/contents/';

// Estado Global da Página de Encomendas
let carrinho = [];
let produtoAtual = null;
let picoléAtual = null;
let saboresSelecionados = [];
let selecoesPickle = {}; // { "Sabor": qtd }
let selecoesPickleGlobal = {}; // { "tipoId::Sabor": qtd }

// Objeto de Dados Centralizado
const PRODUTOS = {
  caixas: [],
  tortas: [],
  picolés: [],
  acréscimos: []
};

// ---- HELPERS DE DADOS ----
function getCaixasEncomenda() {
  return window._itap_caixas || [
    { id: "cx5l_2s", nome: "Caixa 5 Litros - 2 Sabores", preço: 100, maxSabores: 2, estoque: 20, esgotado: false },
    { id: "cx5l_3s", nome: "Caixa 5 Litros - 3 Sabores", preço: 115, maxSabores: 3, estoque: 20, esgotado: false },
    { id: "cx10l_2s", nome: "Caixa 10 Litros - 2 Sabores", preço: 150, maxSabores: 2, estoque: 15, esgotado: false },
    { id: "cx10l_3s", nome: "Caixa 10 Litros - 3 Sabores", preço: 165, maxSabores: 3, estoque: 15, esgotado: false }
  ];
}

function getTortasEncomenda() {
  return window._itap_tortas || [
    { id: "torta1", nome: "Torta de Sorvete", preço: 100, maxSabores: 3, estoque: 10, esgotado: false }
  ];
}

function getAcréscimosEncomenda() {
  return window._itap_acréscimos || [];
}

function getPicolésAtacado() {
  if (!window.PRODUTOS_DATA || !window.PRODUTOS_DATA.picolés) return [];
  return Object.entries(window.PRODUTOS_DATA.picolés).map(([id, p]) => ({
    id,
    nome: p.nome,
    preçoVarejo: p.preço_varejo,
    preçoAtacado: p.preço_atacado,
    estoque: p.estoque,
    sabores: p.sabores,
    esgotado: p.estoque <= 0
  }));
}

// ---- INICIALIZAÇÃO ----
function inicializarEncomendas() {
  console.log('[Itap] Inicializando Encomendas...');
  
  // 1. Carregar dados iniciais (locais ou globais)
  PRODUTOS.caixas = getCaixasEncomenda();
  PRODUTOS.tortas = getTortasEncomenda();
  PRODUTOS.picolés = getPicolésAtacado();
  PRODUTOS.acréscimos = getAcréscimosEncomenda();

  // 2. Renderizar interface inicial
  renderizarTudo();

  // 3. Escutar atualização da nuvem (via products.js)
  document.addEventListener('produtosNuvemCarregados', () => {
    console.log('[Itap] Sincronizando dados da nuvem nas encomendas...');
    PRODUTOS.caixas = getCaixasEncomenda();
    PRODUTOS.tortas = getTortasEncomenda();
    PRODUTOS.picolés = getPicolésAtacado();
    PRODUTOS.acréscimos = getAcréscimosEncomenda();
    renderizarTudo();
  });
}

function renderizarTudo() {
  renderizarCaixas();
  renderizarTortas();
  renderizarPicolés();
  renderizarAcréscimos();
  atualizarBotãoCarrinho();
}

// ---- RENDERIZADORES ----

function renderizarCaixas() {
  const container = document.getElementById('lista-caixas');
  if (!container) return;
  
  if (PRODUTOS.caixas.length === 0) {
    container.innerHTML = '<p class="aviso-vazio">Carregando opções de caixas...</p>';
    return;
  }

  container.innerHTML = PRODUTOS.caixas.map(p => {
    const esgotado = p.esgotado || p.estoque <= 0;
    return `
      <div class="prod-card ${esgotado ? 'esgotado' : ''}">
        <div class="prod-body">
          <div class="prod-nome-wrap"><div class="prod-nome">${p.nome}</div></div>
          <div class="prod-preço">R$ ${p.preço.toFixed(2).replace('.', ',')}</div>
          <div class="prod-estoque">${esgotado ? '<span class="tag-esgotado">ESGOTADO</span>' : `Estoque: ${p.estoque} un.`}</div>
        </div>
        <button class="btn-sabores" onclick="${esgotado ? '' : "abrirSaboresSorvete('" + p.id + "','caixas')"}" ${esgotado ? 'disabled' : ''}>
          🍦 ${esgotado ? 'Esgotado' : 'Escolher ' + p.maxSabores + ' Sabores'}
        </button>
      </div>`;
  }).join('');
}

function renderizarTortas() {
  const container = document.getElementById('lista-tortas');
  if (!container) return;

  if (PRODUTOS.tortas.length === 0) {
    container.innerHTML = '<p class="aviso-vazio">Carregando opções de tortas...</p>';
    return;
  }

  container.innerHTML = PRODUTOS.tortas.map(p => {
    const esgotado = p.esgotado || p.estoque <= 0;
    return `
      <div class="prod-card ${esgotado ? 'esgotado' : ''}">
        <div class="prod-body">
          <div class="prod-nome-wrap"><div class="prod-nome">${p.nome}</div></div>
          <div class="prod-preço">R$ ${p.preço.toFixed(2).replace('.', ',')}</div>
          <div class="prod-estoque">${esgotado ? '<span class="tag-esgotado">ESGOTADO</span>' : `Estoque: ${p.estoque} un.`}</div>
        </div>
        <button class="btn-sabores" onclick="${esgotado ? '' : "abrirSaboresSorvete('" + p.id + "','tortas')"}" ${esgotado ? 'disabled' : ''}>
          🎂 ${esgotado ? 'Esgotado' : 'Escolher ' + p.maxSabores + ' Sabores'}
        </button>
      </div>`;
  }).join('');
}

function renderizarPicolés() {
  const container = document.getElementById('lista-picolés');
  if (!container) return;

  if (PRODUTOS.picolés.length === 0) {
    container.innerHTML = '<p class="aviso-vazio">Carregando picolés...</p>';
    return;
  }

  container.innerHTML = PRODUTOS.picolés.map(p => {
    const esgotado = p.esgotado || p.estoque <= 0;
    return `
      <div class="prod-card ${esgotado ? 'esgotado' : ''}">
        <div class="prod-body">
          <div class="prod-nome-wrap"><div class="prod-nome">${p.nome}</div></div>
          <div class="prod-preço">R$ ${p.preçoAtacado.toFixed(2).replace('.', ',')} <small>(atacado)</small></div>
          <div class="prod-estoque">${esgotado ? '<span class="tag-esgotado">ESGOTADO</span>' : `Estoque: ${p.estoque} un.`}</div>
        </div>
        <button class="btn-sabores" onclick="${esgotado ? '' : "abrirPicolésSincronizado('" + p.id + "')"}" ${esgotado ? 'disabled' : ''}>
          🍭 ${esgotado ? 'Esgotado' : 'Escolher Sabores'}
        </button>
      </div>`;
  }).join('');
}

function renderizarAcréscimos() {
  const container = document.getElementById('lista-acréscimos');
  if (!container) return;
  // Implementação futura ou simplificada
}

// ---- MODAL DE SABORES (SORVETE/TORTA) ----
function abrirSaboresSorvete(id, tipo) {
  const lista = tipo === 'caixas' ? PRODUTOS.caixas : PRODUTOS.tortas;
  produtoAtual = lista.find(p => p.id === id);
  if (!produtoAtual) return;

  saboresSelecionados = [];
  const modal = document.getElementById('modal-sabores');
  const titulo = document.getElementById('titulo-modal-sabores');
  if (titulo) titulo.textContent = produtoAtual.nome;

  renderizarGridSabores();
  atualizarBtnConfirmar();
  abrirModal('modal-sabores');
}

function renderizarGridSabores() {
  const grid = document.getElementById('grid-sabores');
  if (!grid) return;

  // Busca sabores globais do motor ou de uma lista padrão
  const sabores = window.SABORES_SORVETE || [
    "Abacaxi", "Abacaxi c/ Vinho", "Açaí", "Amendoim", "Banana", "Baunilha", "Beijinho", "Blue Ice", "Brigadeiro", "Café", "Cajá", "Cereja", "Chiclete", "Chocolate", "Chocolate Branco", "Coco", "Coco Queimado", "Creme", "Doce de Leite", "Flocos", "Goiaba", "Iogurte c/ Amora", "Leite Condensado", "Limão", "Maçã Verde", "Manga", "Maracujá", "Melancia", "Milho Verde", "Morango", "Mousse de Maracujá", "Nata c/ Morango", "Ninho c/ Nutella", "Passas ao Rum", "Pavê", "Pêssego", "Pistache", "Queijo c/ Goiabada", "Sensação", "Tapioca", "Uva"
  ];

  grid.innerHTML = sabores.map(s => {
    const sel = saboresSelecionados.includes(s);
    return `<button class="sabor-item ${sel ? 'sel' : ''}" onclick="toggleSabor('${s}', this)">${s}</button>`;
  }).join('');
}

function toggleSabor(sabor, btn) {
  const idx = saboresSelecionados.indexOf(sabor);
  if (idx !== -1) {
    saboresSelecionados.splice(idx, 1);
    btn.classList.remove('sel');
  } else {
    if (saboresSelecionados.length >= produtoAtual.maxSabores) {
      showToast(`⚠️ Máximo de ${produtoAtual.maxSabores} sabores atingido!`, 'alerta');
      return;
    }
    saboresSelecionados.push(sabor);
    btn.classList.add('sel');
  }
  atualizarBtnConfirmar();
}

function atualizarBtnConfirmar() {
  const btn = document.getElementById('btn-confirmar-sabores');
  if (!btn) return;
  const max = produtoAtual ? produtoAtual.maxSabores : 0;
  const atual = saboresSelecionados.length;
  
  if (atual === max) {
    btn.disabled = false;
    btn.textContent = `✅ Confirmar (${atual}/${max})`;
    btn.classList.add('pronto');
  } else {
    btn.disabled = true;
    btn.textContent = `🔒 Escolha ${max} sabores (${atual}/${max})`;
    btn.classList.remove('pronto');
  }
}

function confirmarSabores() {
  if (!produtoAtual || saboresSelecionados.length !== produtoAtual.maxSabores) return;
  
  addCarrinho({
    id: produtoAtual.id + '_' + Date.now(), // ID único para o carrinho
    baseId: produtoAtual.id,
    nome: produtoAtual.nome,
    preço: produtoAtual.preço,
    sabores: [...saboresSelecionados],
    quantidade: 1,
    tipo: 'sorvete'
  });

  fecharModal('modal-sabores');
  showToast(`✅ ${produtoAtual.nome} adicionado!`, 'sucesso');
}

// ---- PICOLÉS (Sincronizado com produtos.json) ----
function abrirPicolésSincronizado(id) {
  picoléAtual = PRODUTOS.picolés.find(p => p.id === id);
  if (!picoléAtual) return;

  selecoesPickle = {};
  // Recuperar o que já está no global para este tipo
  Object.entries(selecoesPickleGlobal).forEach(([chave, qtd]) => {
    if (chave.startsWith(id + '::')) {
      const sabor = chave.split('::')[1];
      selecoesPickle[sabor] = qtd;
    }
  });

  const titulo = document.getElementById('titulo-modal-picolé');
  if (titulo) titulo.textContent = picoléAtual.nome;

  renderizarGridPicolés();
  atualizarTotalPickle();
  abrirModal('modal-picolé');
}

function renderizarGridPicolés() {
  const grid = document.getElementById('grid-picolés');
  if (!grid) return;

  const sabores = picoléAtual.sabores || [];
  grid.innerHTML = sabores.map(s => {
    const qtd = selecoesPickle[s] || 0;
    return `
      <div class="pickle-item">
        <div class="pickle-info">
          <div class="pickle-nome">${s}</div>
        </div>
        <div class="pickle-ctrl">
          <button class="btn-p-qty" onclick="alterarQtdPicolé('${s}', -1)">−</button>
          <span class="p-qty-val" id="pqty-${s.replace(/\s+/g, '_')}">${qtd}</span>
          <button class="btn-p-qty" onclick="alterarQtdPicolé('${s}', 1)">+</button>
        </div>
      </div>`;
  }).join('');
}

function alterarQtdPicolé(sabor, delta) {
  const atual = selecoesPickle[sabor] || 0;
  const nova = Math.max(0, atual + delta);
  
  if (delta > 0 && nova > 25) {
    showToast('⚠️ Máximo 25 por sabor no atacado.', 'alerta');
    return;
  }

  const totalGlobal = Object.values(selecoesPickleGlobal).reduce((a, b) => a + b, 0);
  if (delta > 0 && totalGlobal + 1 > 250) {
    showToast('⚠️ Máximo 250 picolés no total.', 'alerta');
    return;
  }

  selecoesPickle[sabor] = nova;
  const chave = picoléAtual.id + '::' + sabor;
  if (nova === 0) delete selecoesPickleGlobal[chave];
  else selecoesPickleGlobal[chave] = nova;

  const el = document.getElementById(`pqty-${sabor.replace(/\s+/g, '_')}`);
  if (el) el.textContent = nova;
  atualizarTotalPickle();
}

function atualizarTotalPickle() {
  const total = Object.values(selecoesPickleGlobal).reduce((a, b) => a + b, 0);
  const elTotal = document.getElementById('total-picolés');
  if (elTotal) elTotal.textContent = total;

  const btn = document.getElementById('btn-add-picolés');
  if (btn) {
    if (total < 100) {
      btn.disabled = true;
      btn.textContent = `🔒 Mínimo 100 picolés (${total}/100)`;
    } else {
      btn.disabled = false;
      btn.textContent = `✅ Confirmar ${total} picolés`;
    }
  }
}

function confirmarPickle() {
  const total = Object.values(selecoesPickleGlobal).reduce((a, b) => a + b, 0);
  if (total < 100) return;

  // Limpar picolés antigos do carrinho e adicionar novos
  carrinho = carrinho.filter(c => c.tipo !== 'picolé');
  
  Object.entries(selecoesPickleGlobal).forEach(([chave, qtd]) => {
    const [tipoId, sabor] = chave.split('::');
    const p = PRODUTOS.picolés.find(x => x.id === tipoId);
    if (!p) return;

    carrinho.push({
      id: chave,
      nome: `${p.nome} - ${sabor}`,
      preço: p.preçoAtacado,
      quantidade: qtd,
      tipo: 'picolé',
      sabores: []
    });
  });

  fecharModal('modal-picolé');
  atualizarBotãoCarrinho();
  showToast('✅ Picolés adicionados ao carrinho!', 'sucesso');
}

// ---- CARRINHO E FINALIZAÇÃO ----
function addCarrinho(item) {
  carrinho.push(item);
  atualizarBotãoCarrinho();
}

function atualizarBotãoCarrinho() {
  const total = carrinho.reduce((a, b) => a + b.quantidade, 0);
  const totalValor = carrinho.reduce((a, b) => a + (b.preço * b.quantidade), 0);
  
  const badge = document.getElementById('carrinho-badge');
  const totalEl = document.getElementById('carrinho-total');
  
  if (badge) badge.textContent = total;
  if (totalEl) totalEl.textContent = `R$ ${totalValor.toFixed(2).replace('.', ',')}`;
  
  const btn = document.getElementById('btn-carrinho');
  if (btn) btn.classList.toggle('ativo', total > 0);
}

// Funções de Modal (Garantir que existam)
function abrirModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function fecharModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
  document.body.style.overflow = '';
}

function showToast(msg, tipo) {
  console.log(`[Toast] ${tipo}: ${msg}`);
  // Implementação simples ou integração com o site-loader
  alert(msg); 
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarEncomendas);
