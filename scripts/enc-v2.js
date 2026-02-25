
// ENCOMENDAS.JS - Sorveteria Itapolitana Cajuru
// Lógica completa do fluxo de encomendas

// Função utilitária de sanitização
function sanitizeString(str) {
  // Remove tags HTML e escapa caracteres especiais para prevenir XSS
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '/': '&#x2F;',
  };
  const reg = /[&<>"'\/]/ig;
  return str.replace(reg, (match)=>(map[match]));
}

// Função utilitária de debounce
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

const GIST_ID_PRECO = '92bd9d1997c2fdd225ad3115c7028445';
const GIST_RAW_PRECO = 'https://gist.githubusercontent.com/missias123/' + GIST_ID_PRECO + '/raw/itap-produtos.json';

async function carregarPrecosNuvem() {
  try {
    const resp = await fetch(GIST_RAW_PRECO + '?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('Gist indisponível');
    const dados = await resp.json();
    if (dados.picoles) {
      Object.entries(dados.picoles).forEach(([key, p]) => {
        if (produtos.picoles[key]) {
          produtos.picoles[key].preco_varejo = p.preco_varejo;
          produtos.picoles[key].preco_atacado = p.preco_atacado;
          if (p.estoque !== undefined) produtos.picoles[key].estoque = p.estoque;
        }
      });
    }
    if (dados.sorvetes_precos) produtos.sorvetes.precos = dados.sorvetes_precos;
    if (dados.milkshake) produtos.milkshake = dados.milkshake;
    if (dados.tacas) produtos.tacas = dados.tacas;
    if (dados.acai) produtos.acai = dados.acai;
    if (dados.caixas_viagem) produtos.caixas_viagem = dados.caixas_viagem;
    if (dados.isopores_viagem) produtos.isopores_viagem = dados.isopores_viagem;
    if (dados.sobremesas) produtos.sobremesas = dados.sobremesas;
    localStorage.setItem('itap_produtos_nuvem', JSON.stringify(dados));
    if (dados.caixas_enc && dados.caixas_enc.length > 0)
      localStorage.setItem('itap_caixas_enc', JSON.stringify(dados.caixas_enc));
    if (dados.tortas_enc && dados.tortas_enc.length > 0)
      localStorage.setItem('itap_tortas_enc', JSON.stringify(dados.tortas_enc));
    console.log('[Itap] Preços carregados da nuvem ✅');
    return true;
  } catch(e) {
    const cache = localStorage.getItem('itap_produtos_nuvem');
    if (cache) {
      try {
        const dados = JSON.parse(cache);
        if (dados.picoles) {
          Object.entries(dados.picoles).forEach(([key, p]) => {
            if (produtos.picoles[key]) {
              produtos.picoles[key].preco_varejo = p.preco_varejo;
              produtos.picoles[key].preco_atacado = p.preco_atacado;
            }
          });
        }
      } catch(e2) {}
    }
    return false;
  }
}

// ---- UTILITÁRIOS DE ESTOQUE DE PICOLÉS ----
const STORAGE_PICOLES = 'itap_estoque_picoles';
function getEstoquePickles() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PICOLES) || '{}');
  } catch(e) { return {}; }
}
function atualizarEstoquePickleLocal(sabor, delta) {
  const estoque = getEstoquePickles();
  const atual = estoque[sabor] || 0;
  estoque[sabor] = Math.max(0, atual + delta);
  localStorage.setItem(STORAGE_PICOLES, JSON.stringify(estoque));
  window.dispatchEvent(new Event('storage'));
}

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

// Sabores carregados do admin (localStorage) ou lista padrão
function getSaboresAtivos() {
  const salvo = localStorage.getItem('itap_sabores');
  if (salvo) {
    const dados = JSON.parse(salvo);
    return dados.filter(s => !s.esgotado).map(s => s.nome);
  }
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

// Caixas de encomenda
function getCaixasEncomenda() {
  const PADRAO = [
    { id:"cx5l_2s",  nome:"Caixa 5 Litros – 2 Sabores",  preco:100.00, maxSabores:2, estoque:20, esgotado:false },
    { id:"cx5l_3s",  nome:"Caixa 5 Litros – 3 Sabores",  preco:115.00, maxSabores:3, estoque:20, esgotado:false },
    { id:"cx10l_2s", nome:"Caixa 10 Litros – 2 Sabores", preco:150.00, maxSabores:2, estoque:15, esgotado:false },
    { id:"cx10l_3s", nome:"Caixa 10 Litros – 3 Sabores", preco:165.00, maxSabores:3, estoque:15, esgotado:false }
  ];
  try {
    const salvo = localStorage.getItem('itap_caixas_enc');
    if (salvo) {
      const dados = JSON.parse(salvo);
      return dados.map((c, i) => ({
        ...PADRAO[i] || {},
        ...c,
        maxSabores: PADRAO[i] ? PADRAO[i].maxSabores : 2
      }));
    }
  } catch(e) {}
  return PADRAO;
}

function getTortasEncomenda() {
  const PADRAO = [
    { id:"torta1", nome:"Torta de Sorvete", preco:100.00, maxSabores:3, estoque:10, esgotado:false }
  ];
  try {
    const salvo = localStorage.getItem('itap_tortas_enc');
    if (salvo) {
      const dados = JSON.parse(salvo);
      return dados.map((t, i) => ({
        ...PADRAO[i] || {},
        ...t,
        maxSabores: (PADRAO[i] ? PADRAO[i].maxSabores : 3)
      }));
    }
  } catch(e) {}
  return PADRAO;
}

const PRODUTOS = {
  caixas: getCaixasEncomenda(),
  tortas: getTortasEncomenda(),
  picoles: Object.entries(produtos.picoles).map(([key, p]) => ({
    id: 'pic_'+key,
    nome: p.nome,
    precoVarejo: p.preco_varejo,
    precoAtacado: p.preco_atacado,
    estoque: p.estoque,
    sabores: p.sabores
  }))
};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  const modalCarrinho = document.getElementById('modal-carrinho');
  if (modalCarrinho) {
    modalCarrinho.addEventListener('click', function(e) {
      if (e.target === modalCarrinho) fecharCarrinho();
    });
  }
  const btnIrDados = document.getElementById('btn-ir-dados');
  if (btnIrDados) {
    btnIrDados.addEventListener('click', function(e) {
      e.stopPropagation();
      irParaDados();
    });
  }
  const btnFinalizar = document.getElementById('btn-finalizar');
  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', function(e) {
      e.stopPropagation();
      finalizarPedido();
    });
  }
  const btnVoltarEtapa = document.getElementById('btn-voltar-etapa');
  if (btnVoltarEtapa) {
    btnVoltarEtapa.addEventListener('click', function(e) {
      e.stopPropagation();
      mostrarEtapa('revisao');
    });
  }
  const btnContinuar = document.getElementById('btn-continuar-comprando');
  if (btnContinuar) {
    btnContinuar.addEventListener('click', function(e) {
      e.stopPropagation();
      fecharCarrinho();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  carregarPrecosNuvem().then(() => {
    PRODUTOS.caixas = getCaixasEncomenda();
    PRODUTOS.tortas = getTortasEncomenda();
    PRODUTOS.picoles = Object.entries(produtos.picoles).map(([key, p]) => ({
      id: 'pic_'+key,
      nome: p.nome,
      precoVarejo: p.preco_varejo,
      precoAtacado: p.preco_atacado,
      estoque: p.estoque,
      sabores: p.sabores
    }));
    renderizarTudo();
    atualizarBotaoCarrinhoDebounced();
  });
  renderizarTudo();
  atualizarBotaoCarrinhoDebounced();
});

// ---- PICOLÉS ----
function totalPickleGlobal() {
  return Object.values(selecoesPickleGlobal).reduce((a,b)=>a+b,0);
}

function atualizarTotalPickle() {
  const totalGlobal = totalPickleGlobal();
  const el = document.getElementById('total-picoles');
  if (el) el.textContent = totalGlobal;
  const btn = document.getElementById('btn-add-picoles');
  const aviso = document.getElementById('aviso-minimo-picolé');
  if (btn) {
    if (totalGlobal < MIN_PICOLES) {
      btn.style.display = 'none';
      btn.disabled = true;
    } else if (totalGlobal > MAX_PICOLES) {
      btn.style.display = 'block';
      btn.disabled = true;
      btn.textContent = `⚠️ Máximo ${MAX_PICOLES} picolés atingido`;
    } else {
      btn.style.display = 'block';
      btn.disabled = false;
      btn.textContent = `✅ Adicionar ${totalGlobal} picolé(s) ao carrinho`;
    }
  }
  if (aviso) {
    if (totalGlobal > 0 && totalGlobal < MIN_PICOLES) {
      aviso.style.display = 'block';
      aviso.textContent = `🧳 Total acumulado: ${totalGlobal} picolés. Faltam ${MIN_PICOLES - totalGlobal} para liberar o carrinho.`;
    } else if (totalGlobal > MAX_PICOLES) {
      aviso.style.display = 'block';
      aviso.textContent = `⚠️ Máximo ${MAX_PICOLES} picolés. Reduza ${totalGlobal - MAX_PICOLES} unidades.`;
    } else {
      aviso.style.display = 'none';
    }
  }
}

function abrirModalPicolé(id, originEl) {
  const p = PRODUTOS.picoles.find(x => x.id === id);
  if (!p) return;
  picoleAtual = p;
  selecoesPickle = {};
  Object.entries(selecoesPickleGlobal).forEach(([chave, qtd]) => {
    if (chave.startsWith(p.id + '::')) {
      const sabor = chave.slice(p.id.length + 2);
      selecoesPickle[sabor] = qtd;
    }
  });
  document.getElementById('picolé-titulo').textContent = p.nome;
  document.getElementById('picolé-precos').textContent =
    `Varejo: R$ ${p.precoVarejo.toFixed(2).replace('.',',')} | Atacado: R$ ${p.precoAtacado.toFixed(2).replace('.',',')}`;

  const lista = document.getElementById('lista-sabores-picolé');
  lista.innerHTML = p.sabores.map(s => {
    const qtdAtual = selecoesPickle[s] || 0;
    return `
    <div class="picolé-row">
      <span class="picolé-sabor-nome">${s}</span>
      <div class="qty-ctrl">
        <button class="btn-qty" onclick="qtdPickle('${s}',-1)">−</button>
        <span class="qty-val" id="pqty-${s.replace(/\s+/g,'_')}">${qtdAtual}</span>
        <button class="btn-qty" onclick="qtdPickle('${s}',1)">+</button>
      </div>
    </div>`;
  }).join('');

  atualizarTotalPickle();
  abrirModal('modal-picolé', originEl);
}

function qtdPickle(sabor, delta) {
  if (!selecoesPickle[sabor]) selecoesPickle[sabor] = 0;
  const nova = selecoesPickle[sabor] + delta;
  if (nova < 0) return;

  const estoque = getEstoquePickles();
  const disponivel = estoque[sabor] || 0;
  if (delta > 0 && nova > disponivel) {
    showToast(`⚠️ Estoque insuficiente para ${sabor}. Disponível: ${disponivel}`, 'alerta');
    return;
  }

  const totalGlobal = totalPickleGlobal();
  const diff = nova - (selecoesPickle[sabor] || 0);
  if (totalGlobal + diff > MAX_PICOLES) {
    showToast(`⚠️ Máximo ${MAX_PICOLES} picolés no total.`, 'alerta');
    return;
  }

  selecoesPickle[sabor] = nova;
  const chave = picoleAtual.id + '::' + sabor;
  if (nova === 0) { delete selecoesPickleGlobal[chave]; }
  else { selecoesPickleGlobal[chave] = nova; }
  
  const el = document.getElementById(`pqty-${sabor.replace(/\s+/g,'_')}`);
  if (el) el.textContent = nova;
  atualizarTotalPickle();
}

function confirmarPickle() {
  const totalGlobal = totalPickleGlobal();
  if (totalGlobal === 0) return;
  
  Object.entries(selecoesPickleGlobal).forEach(([chave, qtd]) => {
    const [tipoId, ...saborParts] = chave.split('::');
    const sabor = saborParts.join('::');
    const p = PRODUTOS.picoles.find(x => x.id === tipoId);
    
    if (qtd > 0) {
      addCarrinho({
        id: 'pic_' + sabor.replace(/\s+/g,'_'),
        nome: `Picolé ${p.nome}`,
        sabor: sabor,
        preco: p.precoAtacado,
        sabores: [sabor],
        quantidade: qtd,
        tipo: 'picolé',
        saborOriginal: sabor
      });
      atualizarEstoquePickleLocal(sabor, -qtd);
    }
  });

  selecoesPickleGlobal = {};
  selecoesPickle = {};
  fecharModal('modal-picolé');
  showToast(`✅ ${totalGlobal} picolé(s) adicionado(s)!`, 'sucesso');
}

// ---- CARRINHO ----
function addCarrinho(item) {
  if (item.tipo === 'sorvete') {
    const ex = carrinho.find(c => c.id===item.id && JSON.stringify(c.sabores)===JSON.stringify(item.sabores));
    if (ex) { ex.quantidade++; }
    else { item._uid = item.id + '_' + Date.now(); carrinho.push(item); }
    showToast(`✅ ${item.nome} adicionado ao carrinho!`, 'sucesso');
  } else if (item.tipo === 'picolé') {
    const ex = carrinho.find(c => c.tipo === 'picolé' && c.id === item.id);
    if (ex) {
      ex.quantidade = item.quantidade;
      ex.sabores = item.sabores;
    } else { 
      item._uid = item.id + '_picole_' + Date.now();
      carrinho.push(item);
    }
    showToast(`✅ ${item.nome} adicionado ao carrinho!`, 'sucesso');
  } else {
    item._uid = item.id + '_' + Date.now();
    carrinho.push(item);
    showToast(`✅ ${item.nome} adicionado ao carrinho!`, 'sucesso');
  }
  atualizarBotaoCarrinhoDebounced();
}

function _atualizarBotaoCarrinhoInterno() {
  const btn = document.getElementById('btn-carrinho-flutuante');
  const total = carrinho.reduce((a, b) => a + b.quantidade, 0);
  if (btn) {
    btn.disabled = total === 0;
    btn.classList.toggle('ativo', total > 0);
    if (total > 0) {
      btn.textContent = `🛒 Ver Carrinho ${total}`;
    } else {
      btn.textContent = "🛒 Ver Carrinho";
    }
  }
}

const atualizarBotaoCarrinhoDebounced = debounce(_atualizarBotaoCarrinhoInterno, 100);

function abrirCarrinho() {
  if (carrinho.length === 0) { showToast('Carrinho vazio! Adicione produtos.','alerta'); return; }
  renderCarrinho();
  mostrarEtapa('revisao');
  abrirModal('modal-carrinho');
}

function fecharCarrinho() { fecharModal('modal-carrinho'); }

function renderCarrinho() {
  const lista = document.getElementById('lista-carrinho');
  const totalEl = document.getElementById('total-carrinho');
  if (!lista) return;
  let total = 0;
  lista.innerHTML = carrinho.map((item,i) => {
    const sub = item.preco * item.quantidade;
    total += sub;
    const uid = item._uid || String(i);
    return `
    <div class="cart-item" data-uid="${uid}">
      <div class="cart-item-info">
        <div class="cart-item-nome">${item.nome}</div>
        <div class="cart-item-sabores">${item.tipo === 'picolé' ? `Sabor: ${item.sabor}` : item.sabores.join(' • ')}</div>
        <div class="cart-item-preco-unit">R$ ${item.preco.toFixed(2).replace('.',',')} / un.</div>
      </div>
      <div class="cart-item-ctrl">
        <div class="qty-ctrl">
          <button class="btn-qty" onclick="qtdCarrinhoPorUid('${uid}',-1)">−</button>
          <span class="qty-val">${item.quantidade}</span>
          <button class="btn-qty" onclick="qtdCarrinhoPorUid('${uid}',1)">+</button>
        </div>
        <div class="cart-item-sub">R$ ${sub.toFixed(2).replace('.',',')}</div>
        <button class="btn-remover" onclick="removerItemPorUid('${uid}')" title="Remover">🗑️</button>
      </div>
    </div>`;
  }).join('');
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.',',')}`;
  
  const totalPic = carrinho.filter(i=>i.tipo==='picolé').reduce((a,b)=>a+b.quantidade,0);
  const temPicole = carrinho.some(i=>i.tipo==='picolé');
  const aviso = document.getElementById('aviso-min-carrinho');
  const btnNext = document.getElementById('btn-ir-dados');
  if (temPicole && totalPic < 100) {
    if (aviso) {
      aviso.style.display = 'block';
      aviso.style.cssText = 'display:block;background:#FEF2F2;border:2px solid #EF4444;border-radius:10px;padding:12px 14px;margin-top:10px;font-size:13px;font-weight:700;color:#DC2626;text-align:center';
      aviso.textContent = `🔒 Mínimo 100 picolés para atacado. Você tem ${totalPic}. Faltam ${100 - totalPic}.`;
    }
    if (btnNext) {
      btnNext.disabled = true;
      btnNext.style.opacity = '0.4';
    }
  } else {
    if (aviso) aviso.style.display = 'none';
    if (btnNext) {
      btnNext.disabled = false;
      btnNext.style.opacity = '1';
    }
  }
}

function qtdCarrinhoPorUid(uid, delta) {
  const idx = carrinho.findIndex(c => (c._uid || '') === uid);
  if (idx === -1) return;
  const item = carrinho[idx];
  const nova = item.quantidade + delta;
  if (nova <= 0) { removerItemPorUid(uid); return; }
  if (item.tipo === 'picolé' && nova > MAX_PICOLES) {
    showToast(`⚠️ Máximo ${MAX_PICOLES} picolés no total.`, 'alerta');
    return;
  }
  item.quantidade = nova;
  renderCarrinho();
  atualizarBotaoCarrinhoDebounced();
}

function removerItemPorUid(uid) {
  const idx = carrinho.findIndex(c => (c._uid || '') === uid);
  if (idx === -1) return;
  carrinho.splice(idx, 1);
  if (carrinho.length === 0) { fecharCarrinho(); atualizarBotaoCarrinhoDebounced(); return; }
  renderCarrinho();
  atualizarBotaoCarrinhoDebounced();
}

// ---- ETAPAS CHECKOUT ----
function mostrarEtapa(etapa) {
  document.querySelectorAll('.etapa').forEach(e => e.classList.remove('ativa'));
  const el = document.getElementById(`etapa-${etapa}`);
  if (el) el.classList.add('ativa');
  
  const steps = ['revisao','dados','confirmacao'];
  const idx = steps.indexOf(etapa);
  steps.forEach((s,i) => {
    const st = document.getElementById(`step-${s}`);
    if (!st) return;
    st.classList.remove('ativo','completo');
    if (i < idx) st.classList.add('completo');
    else if (i === idx) st.classList.add('ativo');
  });
}

function irParaDados() {
  if (carrinho.length === 0) { showToast('Carrinho vazio!','alerta'); return; }
  const totalPicoles = carrinho.filter(i=>i.tipo==='picolé').reduce((a,b)=>a+b.quantidade,0);
  const temPicole = carrinho.some(i=>i.tipo==='picolé');
  if (temPicole && totalPicoles < 100) {
    showToast(`🔒 Mínimo 100 picolés para atacado. Você tem ${totalPicoles}.`, 'alerta');
    return;
  }
  renderResumoPedido();
  mostrarEtapa('dados');
}

function renderResumoPedido() {
  const el = document.getElementById('resumo-pedido');
  if (!el) return;
  let total = 0;
  el.innerHTML = `
    <h3 class="resumo-titulo">📋 Revisão do Pedido</h3>
    ${carrinho.map((item,i) => {
      const sub = item.preco * item.quantidade;
      total += sub;
      return `
      <div class="resumo-item">
        <div class="resumo-item-topo">
          <strong>${item.nome}</strong>
          <div class="qty-ctrl-mini">
            <button class="btn-qty-mini" onclick="qtdCarrinhoPorUid('${item._uid||String(i)}',-1);renderResumoPedido()">−</button>
            <span>${item.quantidade}</span>
            <button class="btn-qty-mini" onclick="qtdCarrinhoPorUid('${item._uid||String(i)}',1);renderResumoPedido()">+</button>
          </div>
        </div>
        ${item.sabores.map(s=>`<div class="resumo-sabor">• ${s}</div>`).join('')}
        <div class="resumo-sub">R$ ${sub.toFixed(2).replace('.',',')}</div>
      </div>`;
    }).join('')}
    <div class="resumo-total-final">
      <span>Total do Pedido</span>
      <strong>R$ ${total.toFixed(2).replace('.',',')}</strong>
    </div>`;
}

function verificarFormulario() {
  const nome = (document.getElementById('cliente-nome')?.value || '').trim();
  const tel  = (document.getElementById('cliente-tel')?.value  || '').trim();
  const end  = (document.getElementById('cliente-endereco')?.value || '').trim();
  const btn  = document.getElementById('btn-finalizar');
  const barra = document.getElementById('barra-btn-finalizar');
  const texto = document.getElementById('texto-btn-finalizar');
  if (!btn) return;
  const liberado = nome.length >= 3 && tel.length >= 8 && end.length >= 5;
  btn.disabled = !liberado;
  btn.style.opacity = liberado ? '1' : '0.4';
  if (liberado) {
    if (barra) barra.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32, #43A047)';
    if (texto) texto.textContent = '📲 Gerar Pedido e Enviar via WhatsApp';
  } else {
    if (barra) barra.style.background = 'linear-gradient(135deg, #424242, #616161)';
    if (texto) texto.textContent = '🔒 Preencha os campos abaixo';
  }
}

async function finalizarPedido() {
  const btnFinalizar = document.getElementById("btn-finalizar");
  const textoBtn = document.getElementById("texto-btn-finalizar");
  const barra = document.getElementById("barra-btn-finalizar");
  const originalBtnText = btnFinalizar ? btnFinalizar.textContent : "";

  if (btnFinalizar) {
    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "Gerando Pedido...";
    btnFinalizar.classList.add("loading");
  }
  if (textoBtn) textoBtn.textContent = "⏳ Gerando número do pedido...";
  if (barra) barra.style.background = "linear-gradient(135deg, #E65100, #FF6D00)";

  const nomeEl = document.getElementById('cliente-nome');
  const telEl  = document.getElementById('cliente-tel');
  const endEl  = document.getElementById('cliente-endereco');
  const nome = sanitizeString(((nomeEl ? nomeEl.value : "") || _nomeCliente || "").trim());
  const tel  = sanitizeString(((telEl  ? telEl.value  : "") || _telCliente  || "").trim());
  const end  = sanitizeString(((endEl  ? endEl.value  : "") || _enderecoCliente || "").trim());

  if (!nome || nome.length < 3 || !tel || tel.length < 8 || !end || end.length < 5) {
    showToast('⚠️ Preencha todos os campos corretamente.', 'alerta');
    if (btnFinalizar) {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = originalBtnText;
      btnFinalizar.classList.remove("loading");
    }
    return;
  }

  const agora = new Date();
  const mm = String(agora.getMonth() + 1).padStart(2, '0');
  const aaaa = agora.getFullYear();
  const hh = String(agora.getHours()).padStart(2, '0');
  const min = String(agora.getMinutes()).padStart(2, '0');
  const dataFormatada = `${String(agora.getDate()).padStart(2, '0')}/${mm}/${aaaa} ${hh}:${min}`;

  function _resetBtnFinalizar() {
    if (btnFinalizar) {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = '✓';
      btnFinalizar.classList.remove("loading");
    }
    if (textoBtn) textoBtn.textContent = '📲 Gerar Pedido e Enviar via WhatsApp';
    if (barra) barra.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32, #43A047)';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  fetch('https://api.counterapi.dev/v1/itap-cajuru-prod/pedido-seq/up', { signal: controller.signal })
    .then(r => r.json())
    .then(data => {
      clearTimeout(timeoutId);
      const seq = (data && data.count) ? data.count : 1;
      const numPedido = `${String(seq).padStart(4, '0')}/${mm}/${aaaa} ${hh}:${min}`;
      _concluirPedido(nome, tel, end, numPedido, dataFormatada, _resetBtnFinalizar);
    })
    .catch(() => {
      clearTimeout(timeoutId);
      const seqLocal = parseInt(localStorage.getItem('itap_seq_pedido') || '0') + 1;
      localStorage.setItem('itap_seq_pedido', seqLocal.toString());
      const numPedido = `L${String(seqLocal).padStart(3, '0')}/${mm}/${aaaa} ${hh}:${min}`;
      _concluirPedido(nome, tel, end, numPedido, dataFormatada, _resetBtnFinalizar);
    });
}

function _concluirPedido(nome, tel, end, numPedido, dataFormatada, _resetBtn) {
  try {
    let total = 0;
    let msg = `🍦 *PEDIDO - Sorveteria Itapolitana Cajuru*\n\n`;
    msg += `🔢 *Pedido Nº:* ${numPedido}\n📅 *Data:* ${dataFormatada}\n\n`;
    msg += `👤 *Cliente:* ${nome}\n📱 *WhatsApp:* ${tel}\n📍 *Endereço:* ${end}\n\n`;
    msg += `📦 *ITENS:*\n`;
    carrinho.forEach(item => {
      const sub = item.preco * item.quantidade;
      total += sub;
      msg += `\n▶ *${item.nome}* (${item.quantidade} un.)\n`;
      if (item.sabores && item.sabores.length > 0) {
        item.sabores.forEach(s => msg += `   • ${s}\n`);
      }
      msg += `   Subtotal: R$ ${sub.toFixed(2).replace('.',',')}\n`;
    });
    msg += `\n💰 *TOTAL: R$ ${total.toFixed(2).replace('.',',')}*\n`;
    
    const linkWpp = document.getElementById('link-whatsapp-final');
    if (linkWpp) {
      linkWpp.href = `https://wa.me/5516991472045?text=${encodeURIComponent(msg)}`;
    }
    
    const numEl = document.getElementById('num-pedido');
    if (numEl) numEl.textContent = numPedido;
    
    carrinho = [];
    atualizarBotaoCarrinhoDebounced();
    mostrarEtapa('confirmacao');
    if (typeof _resetBtn === 'function') _resetBtn();
  } catch(e) {
    console.error('Erro ao concluir pedido:', e);
    if (typeof _resetBtn === 'function') _resetBtn();
    showToast('⚠️ Erro ao gerar pedido.', 'alerta');
  }
}

// ---- UTILS ----
let _encScrollY = 0;
function abrirModal(id, originEl) {
  const m = document.getElementById(id);
  if (m) {
    _encScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    m.classList.add('ativo');
  }
}
function fecharModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('ativo'); }
  document.body.style.overflow = '';
}
function showToast(msg, tipo='sucesso') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ativo ${tipo}`;
  setTimeout(()=>t.classList.remove('ativo'), 3200);
}

function renderizarTudo() {
  // Funções de renderização das seções (sorvetes, picoles, etc)
  // Devem estar definidas no HTML ou em outros scripts
  if (typeof renderizarSorvetes === 'function') renderizarSorvetes();
  if (typeof renderizarPicoles === 'function') renderizarPicoles();
  if (typeof renderizarTortas === 'function') renderizarTortas();
}
