
// ENCOMENDAS.JS - Sorveteria Itapolitana Cajuru
// Versão Simplificada e Estável

// Variáveis globais
var carrinho = [];
var picoleAtual = null;
var selecoesPickleGlobal = {};
var selecoesPickle = {};
var _nomeCliente = '';
var _telCliente = '';
var _enderecoCliente = '';

const MIN_PICOLES = 100;
const MAX_PICOLES = 250;

// Funções utilitárias básicas
function sanitizeString(str) {
  return str.replace(/[&<>"'\/]/ig, "");
}

// Debounce simples para o botão do carrinho
let timeoutBotao;
function atualizarBotaoCarrinho() {
  clearTimeout(timeoutBotao);
  timeoutBotao = setTimeout(() => {
    const badge = document.getElementById('carrinho-badge');
    const btn = document.getElementById('btn-carrinho');
    if (badge) badge.textContent = carrinho.length;
    if (btn) btn.disabled = carrinho.length === 0;
  }, 100);
}

// Sabores
function getSaboresAtivos() {
  return [
    "Abacaxi ao Vinho","Abacaxi Suíço","Algodão Doce (Blue Ice)","Amarena","Ameixa",
    "Banana com Nutella","Bis e Trufa","Cereja Trufada","Chocolate","Chocolate com Café",
    "Coco Queimado","Creme Paris","Croquer","Doce de Leite","Ferrero Rocher",
    "Flocos","Kinder Ovo","Leite Condensado","Leite Ninho",
    "Leite Ninho Folheado","Leite Ninho com Oreo","Limão",
    "Limão Suíço","Menta com Chocolate","Milho Verde","Morango Trufado",
    "Mousse de Maracujá","Mousse de Uva","Nozes","Nutella","Ovomaltine",
    "Pistache","Prestígio","Sensação","Torta de Chocolate"
  ];
}
const SABORES_SORVETE = getSaboresAtivos();

// Produtos
const PRODUTOS = {
  caixas: [
    { id:"cx5l_2s",  nome:"Caixa 5 Litros – 2 Sabores",  preco:100.00, maxSabores:2 },
    { id:"cx5l_3s",  nome:"Caixa 5 Litros – 3 Sabores",  preco:115.00, maxSabores:3 },
    { id:"cx10l_2s", nome:"Caixa 10 Litros – 2 Sabores", preco:150.00, maxSabores:2 },
    { id:"cx10l_3s", nome:"Caixa 10 Litros – 3 Sabores", preco:165.00, maxSabores:3 }
  ],
  tortas: [
    { id:"torta1", nome:"Torta de Sorvete", preco:100.00, maxSabores:3 }
  ]
};

// UI - Toggle Seção
function toggleSecao(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const todas = ['conteudo-caixas', 'conteudo-tortas', 'conteudo-picoles', 'conteudo-acrescimos'];
  todas.forEach(s => {
    const secao = document.getElementById(s);
    if (secao && s !== id) secao.style.display = 'none';
  });
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// Renderização Básica
function renderizarTudo() {
  const listaCaixas = document.getElementById('lista-caixas');
  if (listaCaixas) {
    listaCaixas.innerHTML = PRODUTOS.caixas.map(p => `
      <div class="produto-card">
        <div class="produto-info">
          <h4>${p.nome}</h4>
          <p class="preco">R$ ${p.preco.toFixed(2).replace('.',',')}</p>
        </div>
        <button class="btn-add" onclick="abrirModalSabores('${p.id}')">Escolher Sabores</button>
      </div>
    `).join('');
  }
  
  const listaTortas = document.getElementById('lista-tortas');
  if (listaTortas) {
    listaTortas.innerHTML = PRODUTOS.tortas.map(p => `
      <div class="produto-card">
        <div class="produto-info">
          <h4>${p.nome}</h4>
          <p class="preco">R$ ${p.preco.toFixed(2).replace('.',',')}</p>
        </div>
        <button class="btn-add" onclick="abrirModalSabores('${p.id}')">Escolher Sabores</button>
      </div>
    `).join('');
  }
}

// Modal de Sabores
let produtoSendoAdicionado = null;
let saboresSelecionados = [];

function abrirModalSabores(id) {
  const p = PRODUTOS.caixas.find(x => x.id === id) || PRODUTOS.tortas.find(x => x.id === id);
  if (!p) return;
  produtoSendoAdicionado = p;
  saboresSelecionados = [];
  
  const modal = document.getElementById('modal-sabores');
  const lista = document.getElementById('lista-sabores-grid');
  const titulo = document.getElementById('modal-sabores-titulo');
  
  if (titulo) titulo.textContent = p.nome;
  if (lista) {
    lista.innerHTML = SABORES_SORVETE.map(s => `
      <div class="sabor-item" onclick="toggleSabor('${s}')" id="sabor-${s.replace(/\s+/g, '-')}">
        ${s}
      </div>
    `).join('');
  }
  
  if (modal) modal.classList.add('ativo');
  atualizarContadorSabores();
}

function toggleSabor(sabor) {
  const idx = saboresSelecionados.indexOf(sabor);
  if (idx > -1) {
    saboresSelecionados.splice(idx, 1);
  } else {
    if (saboresSelecionados.length < produtoSendoAdicionado.maxSabores) {
      saboresSelecionados.push(sabor);
    } else {
      alert(`Máximo de ${produtoSendoAdicionado.maxSabores} sabores atingido.`);
      return;
    }
  }
  
  // Atualizar visual
  document.querySelectorAll('.sabor-item').forEach(el => {
    const s = el.textContent.trim();
    if (saboresSelecionados.includes(s)) el.classList.add('selecionado');
    else el.classList.remove('selecionado');
  });
  
  atualizarContadorSabores();
}

function atualizarContadorSabores() {
  const btn = document.getElementById('btn-confirmar-sabores');
  if (btn) {
    btn.textContent = `Confirmar Seleção (${saboresSelecionados.length}/${produtoSendoAdicionado.maxSabores}) ✓`;
    btn.disabled = saboresSelecionados.length === 0;
  }
}

function confirmarSabores() {
  if (saboresSelecionados.length === 0) return;
  
  carrinho.push({
    ...produtoSendoAdicionado,
    sabores: [...saboresSelecionados],
    quantidade: 1,
    _uid: Date.now().toString()
  });
  
  fecharModal('modal-sabores');
  atualizarBotaoCarrinho();
  alert('Item adicionado ao carrinho!');
}

function fecharModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('ativo');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  renderizarTudo();
  atualizarBotaoCarrinho();
});
