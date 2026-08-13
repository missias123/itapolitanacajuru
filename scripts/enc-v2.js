// Lógica completa do fluxo de encomendas - Versão Gênio UX (Anti-Erro)
// =====================================================

const ITAP_PRODUTOS_URL = 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/dados/produtos.json';
const ITAP_WORKER_API = 'https://api.itapolitanacajuru.com.br';

// Estado Global
let carrinho = [];
let produtoAtual = null;
let saboresSelecionados = [];

// Objeto de Dados (Inicializado Vazio)
const PRODUTOS = {
  caixas: [],
  tortas: [],
  picolés: [],
  acréscimos: []
};

// ---- HELPERS DE DADOS ----
function getCaixasEncomenda() {
  return [
    { id: "cx5l_2s", nome: "Caixa 5 Litros - 2 Sabores", preço: 100, maxSabores: 2, estoque: 20, esgotado: false },
    { id: "cx5l_3s", nome: "Caixa 5 Litros - 3 Sabores", preço: 115, maxSabores: 3, estoque: 20, esgotado: false },
    { id: "cx10l_2s", nome: "Caixa 10 Litros - 2 Sabores", preço: 150, maxSabores: 2, estoque: 15, esgotado: false },
    { id: "cx10l_3s", nome: "Caixa 10 Litros - 3 Sabores", preço: 165, maxSabores: 3, estoque: 15, esgotado: false }
  ];
}

function getTortasEncomenda() {
  return [
    { id: "torta1", nome: "Torta de Sorvete", preço: 100, maxSabores: 3, estoque: 10, esgotado: false }
  ];
}

// ---- MODAIS E INTERFACE ----
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

function abrirSaboresSorvete(id, tipo) {
  const lista = tipo === 'caixas' ? PRODUTOS.caixas : PRODUTOS.tortas;
  produtoAtual = lista.find(p => p.id === id);
  if (!produtoAtual) {
      console.error('Produto não encontrado:', id);
      return;
  }

  saboresSelecionados = [];
  const titulo = document.getElementById('titulo-modal-sabores');
  if (titulo) titulo.textContent = produtoAtual.nome;

  renderizarGridSabores();
  atualizarBtnConfirmar();
  abrirModal('modal-sabores');
}

function renderizarGridSabores() {
  const grid = document.getElementById('grid-sabores');
  if (!grid) return;

  const sabores = [
    "Abacaxi", "Abacaxi c/ Vinho", "Açaí", "Amendoim", "Banana", "Baunilha", "Beijinho", "Blue Ice", "Brigadeiro", "Café", "Cajá", "Cereja", "Chiclete", "Chocolate", "Chocolate Branco", "Coco", "Coco Queimado", "Creme", "Doce de Leite", "Flocos", "Goiaba", "Iogurte c/ Amora", "Leite Condensado", "Limão", "Maçã Verde", "Manga", "Maracujá", "Melancia", "Milho Verde", "Morango", "Mousse de Maracujá", "Nata c/ Morango", "Ninho c/ Nutella", "Passas ao Rum", "Pavê", "Pêssego", "Pistache", "Queijo c/ Goiabada", "Sensação", "Tapioca", "Uva"
  ];

  grid.innerHTML = sabores.map(s => `
    <button class="sabor-item" onclick="toggleSabor('${s}', this)">${s}</button>
  `).join('');
}

function toggleSabor(sabor, btn) {
  const idx = saboresSelecionados.indexOf(sabor);
  if (idx !== -1) {
    saboresSelecionados.splice(idx, 1);
    btn.classList.remove('sel');
  } else {
    if (saboresSelecionados.length >= produtoAtual.maxSabores) {
      alert(`⚠️ Máximo de ${produtoAtual.maxSabores} sabores atingido!`);
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
  
  btn.disabled = (atual !== max);
  btn.textContent = atual === max ? `✅ Confirmar (${atual}/${max})` : `Escolha ${max} sabores (${atual}/${max})`;
}

function confirmarSabores() {
  if (!produtoAtual || saboresSelecionados.length !== produtoAtual.maxSabores) return;
  
  carrinho.push({
    id: produtoAtual.id + '_' + Date.now(),
    nome: produtoAtual.nome,
    preço: produtoAtual.preço,
    sabores: [...saboresSelecionados],
    quantidade: 1
  });

  fecharModal('modal-sabores');
  atualizarBotãoCarrinho();
  alert('✅ Adicionado ao carrinho!');
}

function atualizarBotãoCarrinho() {
  const total = carrinho.length;
  const badge = document.getElementById('carrinho-badge');
  if (badge) badge.textContent = total;
  
  const btn = document.getElementById('btn-carrinho');
  if (btn) btn.style.display = total > 0 ? 'flex' : 'none';
}

// ---- INICIALIZAÇÃO ----
function inicializar() {
  PRODUTOS.caixas = getCaixasEncomenda();
  PRODUTOS.tortas = getTortasEncomenda();
  
  // Renderização básica para teste
  const containerCaixas = document.getElementById('lista-caixas');
  if (containerCaixas) {
    containerCaixas.innerHTML = PRODUTOS.caixas.map(p => `
      <div class="prod-card">
        <div class="prod-nome">${p.nome}</div>
        <div class="prod-preço">R$ ${p.preço},00</div>
        <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}', 'caixas')">Escolher Sabores</button>
      </div>
    `).join('');
  }

  const containerTortas = document.getElementById('lista-tortas');
  if (containerTortas) {
    containerTortas.innerHTML = PRODUTOS.tortas.map(p => `
      <div class="prod-card">
        <div class="prod-nome">${p.nome}</div>
        <div class="prod-preço">R$ ${p.preço},00</div>
        <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}', 'tortas')">Escolher Sabores</button>
      </div>
    `).join('');
  }
}

// EXPOSIÇÃO GLOBAL IMEDIATA
window.abrirSaboresSorvete = abrirSaboresSorvete;
window.toggleSabor = toggleSabor;
window.confirmarSabores = confirmarSabores;
window.fecharModal = fecharModal;

document.addEventListener('DOMContentLoaded', inicializar);
