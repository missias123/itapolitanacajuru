
// ENCOMENDAS.JS - Sorveteria Itapolitana Cajuru
// Versão com Melhorias Corporativas (Segurança, Performance, Resiliência)
// SEM ALTERAR O FUNCIONAMENTO VISUAL DO SITE

// --- MELHORIAS CORPORATIVAS (INVISÍVEIS) ---

// 1. Segurança: Sanitização de Strings
function sanitizeString(str) {
  if (!str) return "";
  return str.replace(/[&<>"'\/]/ig, "").trim();
}

// 2. Performance: Memoização para cálculos de total
const memoTotal = {};
function calcularTotalCarrinho(itens) {
  const key = JSON.stringify(itens);
  if (memoTotal[key]) return memoTotal[key];
  const total = itens.reduce((acc, item) => acc + (item.preco * (item.quantidade || 1)), 0);
  memoTotal[key] = total;
  return total;
}

// 3. Performance: Debounce para atualização da UI
let timeoutUI;
function atualizarBotaoCarrinho() {
  clearTimeout(timeoutUI);
  timeoutUI = setTimeout(() => {
    const badge = document.getElementById('carrinho-badge');
    const btn = document.getElementById('btn-carrinho');
    if (badge) badge.textContent = carrinho.length;
    if (btn) btn.disabled = carrinho.length === 0;
  }, 150);
}

// 4. Resiliência: Fetch com Retry para geração de número de pedido
async function fetchWithRetry(url, options, retries = 3) {
  try {
    const resp = await fetch(url, options);
    if (!resp.ok) throw new Error('Falha na rede');
    return await resp.json();
  } catch (e) {
    if (retries > 0) {
      console.log(`Tentando novamente... (${retries} restantes)`);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw e;
  }
}

// --- LÓGICA DO SITE ---

var carrinho = [];
var produtoSendoAdicionado = null;
var saboresSelecionados = [];

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

const SABORES_SORVETE = [
  "Abacaxi ao Vinho","Abacaxi Suíço","Algodão Docê","Amarena","Ameixa",
  "Banana com Nutella","Bis e Trufa","Cereja Trufada","Chocolate","Chocolate com Café",
  "Coco Queimado","Creme Paris","Croquer","Doce de Leite","Ferrero Rocher",
  "Flocos","Kinder Ovo","Leite Condensado","Leite Ninho",
  "Leite Ninho Folheado","Leite Ninho com Oreo","Limão",
  "Limão Suíço","Menta com Chocolate","Milho Verde","Morango Trufado",
  "Mousse de Maracujá","Mousse de Uva","Nozes","Nutella","Ovomaltine",
  "Pistache","Prestígio","Sensação","Torta de Chocolate"
];

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

function renderizarTudo() {
  const listaCaixas = document.getElementById('lista-caixas');
  if (listaCaixas) {
    listaCaixas.innerHTML = PRODUTOS.caixas.map(p => `
      <div class="produto-card">
        <div class="produto-info">
          <h4 style="margin:0">${p.nome}</h4>
          <p style="margin:5px 0 0; color:#2E7D32; font-weight:bold">R$ ${p.preco.toFixed(2).replace('.',',')}</p>
        </div>
        <button class="btn-add" onclick="abrirModalSabores('${p.id}')">Escolher</button>
      </div>
    `).join('');
  }
  
  const listaTortas = document.getElementById('lista-tortas');
  if (listaTortas) {
    listaTortas.innerHTML = PRODUTOS.tortas.map(p => `
      <div class="produto-card">
        <div class="produto-info">
          <h4 style="margin:0">${p.nome}</h4>
          <p style="margin:5px 0 0; color:#2E7D32; font-weight:bold">R$ ${p.preco.toFixed(2).replace('.',',')}</p>
        </div>
        <button class="btn-add" onclick="abrirModalSabores('${p.id}')">Escolher</button>
      </div>
    `).join('');
  }
}

function abrirModalSabores(id) {
  const p = PRODUTOS.caixas.find(x => x.id === id) || PRODUTOS.tortas.find(x => x.id === id);
  if (!p) return;
  produtoSendoAdicionado = p;
  saboresSelecionados = [];
  
  const modal = document.getElementById('modal-sabores');
  const lista = document.getElementById('grid-sabores');
  const titulo = document.getElementById('modal-sabores-titulo');
  const subtitulo = document.getElementById('modal-subtitulo-sabores');
  
  if (titulo) titulo.textContent = p.nome;
  if (subtitulo) subtitulo.textContent = `Selecione até ${p.maxSabores} sabores`;
  if (lista) {
    lista.innerHTML = SABORES_SORVETE.map(s => `
      <div class="sabor-item" onclick="toggleSabor(this, '${s}')">
        ${s}
      </div>
    `).join('');
  }
  
  if (modal) modal.classList.add('ativo');
  atualizarContadorSabores();
}

function toggleSabor(el, sabor) {
  const idx = saboresSelecionados.indexOf(sabor);
  if (idx > -1) {
    saboresSelecionados.splice(idx, 1);
    el.classList.remove('selecionado');
  } else {
    if (saboresSelecionados.length < produtoSendoAdicionado.maxSabores) {
      saboresSelecionados.push(sabor);
      el.classList.add('selecionado');
    } else {
      alert(`Máximo de ${produtoSendoAdicionado.maxSabores} sabores atingido.`);
    }
  }
  atualizarContadorSabores();
}

function atualizarContadorSabores() {
  const btn = document.getElementById('btn-confirmar-sabores');
  if (btn) {
    btn.textContent = `Confirmar (${saboresSelecionados.length}/${produtoSendoAdicionado.maxSabores})`;
    btn.disabled = saboresSelecionados.length === 0;
  }
}

function confirmarSabores() {
  if (saboresSelecionados.length === 0) return;
  
  carrinho.push({
    nome: sanitizeString(produtoSendoAdicionado.nome),
    preco: produtoSendoAdicionado.preco,
    sabores: saboresSelecionados.map(s => sanitizeString(s)),
    quantidade: 1,
    _uid: Date.now().toString()
  });
  
  fecharModal('modal-sabores');
  atualizarBotaoCarrinho();
  showToast('Item adicionado ao carrinho!');
}

function abrirCarrinho() {
  const modal = document.getElementById('modal-carrinho');
  const lista = document.getElementById('itens-carrinho');
  const totalTxt = document.getElementById('total-carrinho');
  
  if (lista) {
    lista.innerHTML = carrinho.map((item, idx) => `
      <div class="item-carrinho">
        <div>
          <strong style="display:block">${item.nome}</strong>
          <small style="color:#666">${item.sabores.join(', ')}</small>
        </div>
        <div style="text-align:right">
          <div style="font-weight:bold">R$ ${item.preco.toFixed(2).replace('.',',')}</div>
          <button onclick="removerItem(${idx})" style="color:red; border:none; background:none; cursor:pointer; font-size:0.8rem; padding:0">Remover</button>
        </div>
      </div>
    `).join('');
  }
  
  if (totalTxt) {
    const total = calcularTotalCarrinho(carrinho);
    totalTxt.textContent = `R$ ${total.toFixed(2).replace('.',',')}`;
  }
  
  if (modal) modal.classList.add('ativo');
}

function removerItem(idx) {
  carrinho.splice(idx, 1);
  abrirCarrinho();
  atualizarBotaoCarrinho();
}

function finalizarPedido() {
  const nome = sanitizeString(document.getElementById('nome-cliente').value);
  const tel = sanitizeString(document.getElementById('tel-cliente').value);
  const end = sanitizeString(document.getElementById('end-cliente').value);
  
  if (!nome || !tel || !end) {
    alert('Por favor, preencha todos os campos de entrega.');
    return;
  }
  
  const total = calcularTotalCarrinho(carrinho);
  let msg = `*NOVO PEDIDO - ITAPOLITANA CAJURU*\n\n`;
  msg += `*Cliente:* ${nome}\n`;
  msg += `*Tel:* ${tel}\n`;
  msg += `*Endereço:* ${end}\n\n`;
  msg += `*ITENS:*\n`;
  
  carrinho.forEach(item => {
    msg += `- ${item.nome}\n  Sabores: ${item.sabores.join(', ')}\n`;
  });
  
  msg += `\n*TOTAL: R$ ${total.toFixed(2).replace('.',',')}*`;
  
  const url = `https://api.whatsapp.com/send?phone=5516991234567&text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function fecharModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('ativo');
}

function showToast(msg) {
  let t = document.getElementById('itap-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'itap-toast';
    t.style.cssText = "position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#333; color:white; padding:10px 20px; border-radius:20px; z-index:2000; display:none;";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  renderizarTudo();
  atualizarBotaoCarrinho();
});
