// ============================================================
// ENCOMENDAS.JS - Sorveteria Itapolitana Cajuru
// Lógica completa do fluxo de encomendas
// ============================================================

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
    "Leite Ninho Foleado","Leite Ninho com Óreo","Limão",
    "Limão Suíço","Menta com Chocolate","Milho Verde","Morango Trufado",
    "Mousse de Maracujá","Mousse de Uva","Nozes","Nutella","Ovomaltine",
    "Pistache","Prestígio","Sensação","Torta de Chocolate"
  ];
}
const SABORES_SORVETE = getSaboresAtivos();

const PRODUTOS = {
  caixas: [
    { id:"cx5l2s", nome:"Caixa 5 Litros – 2 Sabores", preco:100.00, maxSabores:2, estoque:20 },
    { id:"cx5l3s", nome:"Caixa 5 Litros – 3 Sabores", preco:115.00, maxSabores:3, estoque:20 },
    { id:"cx10l2s", nome:"Caixa 10 Litros – 2 Sabores", preco:150.00, maxSabores:2, estoque:15 },
    { id:"cx10l3s", nome:"Caixa 10 Litros – 3 Sabores", preco:165.00, maxSabores:3, estoque:15 }
  ],
  tortas: [
    { id:"torta1", nome:"Torta de Sorvete", preco:100.00, maxSabores:3, estoque:10 }
  ],
  // Picolés carregados do products.js (fonte única)
  picoles: Object.entries(produtos.picoles).map(([key, p]) => ({
    id: 'pic_'+key,
    nome: p.nome,
    precoVarejo: p.preco_varejo,
    precoAtacado: p.preco_atacado,
    estoque: p.estoque,
    sabores: p.sabores
  }))
};

// ---- COMPLEMENTOS ----
const COMPLEMENTOS_PADRAO = [
  { id:'canudinho_wafer', nome:'Canudinho Wafer', preco:0.25, estoque:999, foto:'' },
  { id:'casquinhas',     nome:'Casquinhas',      preco:0.25, estoque:999, foto:'' },
  { id:'cascao',         nome:'Cascão',          preco:1.00, estoque:999, foto:'' },
  { id:'cestinha',       nome:'Cestinha',        preco:1.00, estoque:999, foto:'' },
  { id:'cobertura_13l',  nome:'Cobertura 1.3L',  preco:40.00,estoque:999, foto:'' }
];
function getComplementos() {
  let lista;
  try {
    const salvo = localStorage.getItem('itap_complementos');
    lista = salvo ? JSON.parse(salvo) : COMPLEMENTOS_PADRAO;
  } catch(e) { lista = COMPLEMENTOS_PADRAO; }
  // Injetar fotos do itap_fotos (mesmo localStorage do admin)
  let fotos = {};
  try { fotos = JSON.parse(localStorage.getItem('itap_fotos') || '{}'); } catch(e){}
  return lista.map(c => ({ ...c, foto: fotos['comp_enc_'+c.id] || c.foto || '' }));
}
let compQtds = {}; // { id: quantidade }

function renderizarComplementos() {
  const lista = document.getElementById('comp-sorvete-lista');
  if (!lista) return;
  const comps = getComplementos();
  compQtds = {};
  comps.forEach(c => { compQtds[c.id] = 0; });
  lista.innerHTML = comps.map(c => {
    const esgotado = c.estoque <= 0;
    const fotoHtml = c.foto
      ? `<img src="${c.foto}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;margin-right:10px;flex-shrink:0;" onerror="this.style.display='none'">`
      : `<div style="width:48px;height:48px;border-radius:8px;background:linear-gradient(135deg,#F3E5F5,#EDE7F6);display:flex;align-items:center;justify-content:center;font-size:22px;margin-right:10px;flex-shrink:0;">🍪</div>`;
    return `
    <div class="comp-sorvete-item${esgotado?' esgotado':''}" id="comp-item-${c.id}">
      ${fotoHtml}
      <div class="comp-sorvete-info">
        <span class="comp-sorvete-nome">${c.nome}${esgotado?'<span class="comp-sorvete-tag-esgotado">ESGOTADO</span>':''}</span>
        <span class="comp-sorvete-preco">R$ ${c.preco.toFixed(2).replace('.',',')} / un.</span>
      </div>
      <div class="comp-sorvete-ctrl">
        <button class="comp-btn comp-btn-menos" onclick="alterarComp('${c.id}',-1)" ${esgotado?'disabled':''}>−</button>
        <span class="comp-qtd" id="comp-qtd-${c.id}">0</span>
        <button class="comp-btn comp-btn-mais" onclick="alterarComp('${c.id}',1)" ${esgotado?'disabled':''}><b>+</b></button>
      </div>
    </div>`;
  }).join('');
}

function alterarComp(id, delta) {
  const comps = getComplementos();
  const c = comps.find(x => x.id === id);
  if (!c) return;
  if (c.estoque <= 0) return;
  const atual = compQtds[id] || 0;
  const novo = Math.max(0, Math.min(atual + delta, c.estoque));
  compQtds[id] = novo;
  const el = document.getElementById('comp-qtd-'+id);
  if (el) el.textContent = novo;
  const item = document.getElementById('comp-item-'+id);
  if (item) item.classList.toggle('ativo', novo > 0);
}

function getCompsCarrinho() {
  const comps = getComplementos();
  return comps
    .filter(c => (compQtds[c.id]||0) > 0)
    .map(c => ({
      id: 'comp_'+c.id,
      nome: c.nome,
      preco: c.preco,
      sabores: [],
      quantidade: compQtds[c.id],
      tipo: 'complemento'
    }));
}

// Estado global
let carrinho = [];
let produtoAtual = null;
let saboresSelecionados = [];
let picoleAtual = null;
let selecoesPickle = {};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  renderizarTudo();
  atualizarBotaoCarrinho();
  // Abrir seção via hash (ex: encomendas.html#caixas)
  const hash = window.location.hash.replace('#','');
  const mapa = {caixas:'conteudo-caixas', tortas:'conteudo-tortas', picoles:'conteudo-picoles'};
  if(hash && mapa[hash]){
    const el = document.getElementById(mapa[hash]);
    if(el){ el.classList.add('aberto'); }
    setTimeout(()=>{
      const sec = document.getElementById(hash);
      if(sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
    }, 200);
  }
});

function renderizarTudo() {
  renderizarCaixas();
  renderizarTortas();
  renderizarPicoles();
}

// ---- RENDERIZAR CAIXAS ----
function renderizarCaixas() {
  const c = document.getElementById('lista-caixas');
  if (!c) return;
  c.innerHTML = PRODUTOS.caixas.map(p => `
    <div class="prod-card ${p.estoque===0?'esgotado':''}">
      <div class="prod-body">
        <div class="prod-nome">${p.nome}</div>
        <div class="prod-preco">R$ ${p.preco.toFixed(2).replace('.',',')}</div>
        <div class="prod-estoque">${p.estoque===0?'<span class="tag-esgotado">ESGOTADO</span>':`Estoque: ${p.estoque} un.`}</div>
      </div>
      <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}','caixas')" ${p.estoque===0?'disabled':''}>
        🍦 Escolher ${p.maxSabores} Sabores
      </button>
    </div>`).join('');
}

// ---- RENDERIZAR TORTAS ----
function renderizarTortas() {
  const c = document.getElementById('lista-tortas');
  if (!c) return;
  c.innerHTML = PRODUTOS.tortas.map(p => `
    <div class="prod-card ${p.estoque===0?'esgotado':''}">
      <div class="prod-body">
        <div class="prod-nome">${p.nome}</div>
        <div class="prod-preco">R$ ${p.preco.toFixed(2).replace('.',',')}</div>
        <div class="prod-estoque">${p.estoque===0?'<span class="tag-esgotado">ESGOTADO</span>':`Estoque: ${p.estoque} un.`}</div>
      </div>
      <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}','tortas')" ${p.estoque===0?'disabled':''}>
        🎂 Escolher ${p.maxSabores} Sabores
      </button>
    </div>`).join('');
}

// ---- RENDERIZAR PICOLÉS ----
function renderizarPicoles() {
  const c = document.getElementById('lista-picoles');
  if (!c) return;
  c.innerHTML = PRODUTOS.picoles.map(p => `
    <div class="prod-card picole ${p.estoque===0?'esgotado':''}">
      <div class="prod-body">
        <div class="prod-nome">${p.nome}</div>
        <div class="prod-precos-picole">
          <span>Varejo: R$ ${p.precoVarejo.toFixed(2).replace('.',',')}</span>
          <span class="destaque">Atacado: R$ ${p.precoAtacado.toFixed(2).replace('.',',')}</span>
        </div>
        <div class="prod-estoque">${p.estoque===0?'<span class="tag-esgotado">ESGOTADO</span>':`Estoque: ${p.estoque} un.`}</div>
      </div>
      <button class="btn-sabores btn-picole" onclick="abrirModalPicole('${p.id}')" ${p.estoque===0?'disabled':''}>
        🍭 Ver Sabores
      </button>
    </div>`).join('');
}

// ---- MODAL SABORES SORVETE ----
function abrirSaboresSorvete(id, cat) {
  const lista = PRODUTOS[cat];
  const p = lista.find(x => x.id === id);
  if (!p) return;
  produtoAtual = {...p, categoria: cat};
  saboresSelecionados = [];

  const modal = document.getElementById('modal-sabores');
  document.getElementById('modal-subtitulo-sabores').textContent = `Selecione exatamente ${p.maxSabores} sabores`;

  const grid = document.getElementById('grid-sabores');
  grid.innerHTML = SABORES_SORVETE.map(s => `
    <button class="sabor-item" onclick="toggleSabor('${s}',this)">${s}</button>`).join('');

  atualizarBtnConfirmar();
  renderizarComplementos();
  abrirModal('modal-sabores');
}

function toggleSabor(sabor, btn) {
  const idx = saboresSelecionados.indexOf(sabor);
  if (idx > -1) {
    saboresSelecionados.splice(idx, 1);
    btn.classList.remove('sel');
  } else {
    if (saboresSelecionados.length >= produtoAtual.maxSabores) {
      showToast('⚠️ Limite de sabores atingido!', 'alerta');
      return;
    }
    saboresSelecionados.push(sabor);
    btn.classList.add('sel');
  }
  atualizarBtnConfirmar();
}

function atualizarBtnConfirmar() {
  const btn = document.getElementById('btn-confirmar-sabores');
  const max = produtoAtual ? produtoAtual.maxSabores : 0;
  const atual = saboresSelecionados.length;
  btn.textContent = `Confirmar Seleção (${atual}/${max})`;
  btn.disabled = atual !== max;
  btn.className = 'btn-confirmar' + (atual === max ? ' pronto' : '');
}

function confirmarSabores() {
  if (!produtoAtual || saboresSelecionados.length !== produtoAtual.maxSabores) return;
  addCarrinho({
    id: produtoAtual.id,
    nome: produtoAtual.nome,
    preco: produtoAtual.preco,
    sabores: [...saboresSelecionados],
    quantidade: 1,
    tipo: 'sorvete'
  });
  // Adicionar complementos selecionados ao carrinho
  getCompsCarrinho().forEach(comp => addCarrinho(comp));
  fecharModal('modal-sabores');
  const nComps = getCompsCarrinho().length;
  showToast(`✅ ${produtoAtual.nome} adicionado${nComps>0?' + complementos':''}!`, 'sucesso');
}

// ---- MODAL PICOLÉS ----
function abrirModalPicole(id) {
  const p = PRODUTOS.picoles.find(x => x.id === id);
  if (!p) return;
  picoleAtual = p;
  selecoesPickle = {};

  document.getElementById('picole-titulo').textContent = p.nome;
  document.getElementById('picole-precos').textContent =
    `Varejo: R$ ${p.precoVarejo.toFixed(2).replace('.',',')} | Atacado: R$ ${p.precoAtacado.toFixed(2).replace('.',',')}`;

  const lista = document.getElementById('lista-sabores-picole');
  lista.innerHTML = p.sabores.map(s => `
    <div class="picole-row">
      <span class="picole-sabor-nome">${s}</span>
      <div class="qty-ctrl">
        <button class="btn-qty" onclick="qtdPickle('${s}',-1)">−</button>
        <span class="qty-val" id="pqty-${s.replace(/\s+/g,'_')}"">0</span>
        <button class="btn-qty" onclick="qtdPickle('${s}',1)">+</button>
      </div>
    </div>`).join('');

  atualizarTotalPickle();
  abrirModal('modal-picole');
}

function qtdPickle(sabor, delta) {
  if (!selecoesPickle[sabor]) selecoesPickle[sabor] = 0;
  const nova = selecoesPickle[sabor] + delta;
  if (nova < 0 || nova > 250) return;
  selecoesPickle[sabor] = nova;
  const el = document.getElementById(`pqty-${sabor.replace(/\s+/g,'_')}`);
  if (el) el.textContent = nova;
  atualizarTotalPickle();
}

function atualizarTotalPickle() {
  const total = Object.values(selecoesPickle).reduce((a,b)=>a+b,0);
  const el = document.getElementById('total-picoles');
  if (el) el.textContent = total;
  const btn = document.getElementById('btn-add-picoles');
  const aviso = document.getElementById('aviso-minimo-picole');
  if (btn) {
    btn.disabled = total === 0;
    btn.textContent = total > 0 ? `Adicionar ${total} picolé(s) ao carrinho` : 'Selecione ao menos 1 picolé';
  }
  if (aviso) {
    aviso.style.display = (total > 0 && total < 100) ? 'block' : 'none';
    if (total > 0 && total < 100) aviso.textContent = `⚠️ Para atacado: mínimo 100 unidades. Faltam ${100-total}.`;
  }
}

function confirmarPickle() {
  const total = Object.values(selecoesPickle).reduce((a,b)=>a+b,0);
  if (total === 0) return;
  const sabores = Object.entries(selecoesPickle).filter(([,q])=>q>0).map(([s,q])=>`${s}: ${q} un.`);
  addCarrinho({
    id: picoleAtual.id+'_'+Date.now(),
    nome: picoleAtual.nome,
    preco: picoleAtual.precoAtacado,
    sabores,
    quantidade: total,
    tipo: 'picole'
  });
  fecharModal('modal-picole');
  showToast(`✅ ${total} picolé(s) adicionado(s)!`, 'sucesso');
}

// ---- CARRINHO ----
function addCarrinho(item) {
  if (item.tipo === 'sorvete') {
    const ex = carrinho.find(c => c.id===item.id && JSON.stringify(c.sabores)===JSON.stringify(item.sabores));
    if (ex) { ex.quantidade++; }
    else carrinho.push(item);
  } else {
    carrinho.push(item);
  }
  atualizarBotaoCarrinho();
}

function atualizarBotaoCarrinho() {
  const total = carrinho.reduce((a,b)=>a+b.quantidade,0);
  const badge = document.getElementById('carrinho-badge');
  const btn = document.getElementById('btn-carrinho');
  if (badge) badge.textContent = total;
  if (btn) {
    btn.disabled = total === 0;
    btn.classList.toggle('ativo', total > 0);
  }
}

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
    return `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-nome">${item.nome}</div>
        <div class="cart-item-sabores">${item.sabores.join(' • ')}</div>
        <div class="cart-item-preco-unit">R$ ${item.preco.toFixed(2).replace('.',',')} / un.</div>
      </div>
      <div class="cart-item-ctrl">
        <div class="qty-ctrl">
          <button class="btn-qty" onclick="qtdCarrinho(${i},-1)">−</button>
          <span class="qty-val">${item.quantidade}</span>
          <button class="btn-qty" onclick="qtdCarrinho(${i},1)">+</button>
        </div>
        <div class="cart-item-sub">R$ ${sub.toFixed(2).replace('.',',')}</div>
        <button class="btn-remover" onclick="removerItem(${i})" title="Remover">🗑️</button>
      </div>
    </div>`;
  }).join('');
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.',',')}`;

  // Verificar mínimo picolés
  const totalPic = carrinho.filter(i=>i.tipo==='picole').reduce((a,b)=>a+b.quantidade,0);
  const aviso = document.getElementById('aviso-min-carrinho');
  const btnNext = document.getElementById('btn-ir-dados');
  if (totalPic > 0 && totalPic < 100) {
    if (aviso) { aviso.style.display='block'; aviso.textContent=`⚠️ Mínimo 100 picolés. Você tem ${totalPic}. Faltam ${100-totalPic}.`; }
    if (btnNext) btnNext.disabled = true;
  } else {
    if (aviso) aviso.style.display='none';
    if (btnNext) btnNext.disabled = false;
  }
}

function qtdCarrinho(i, delta) {
  if (!carrinho[i]) return;
  const nova = carrinho[i].quantidade + delta;
  if (nova <= 0) { removerItem(i); return; }
  if (nova > 100) return;
  carrinho[i].quantidade = nova;
  renderCarrinho();
  atualizarBotaoCarrinho();
}

function removerItem(i) {
  carrinho.splice(i,1);
  if (carrinho.length === 0) { fecharCarrinho(); atualizarBotaoCarrinho(); return; }
  renderCarrinho();
  atualizarBotaoCarrinho();
}

// ---- ETAPAS CHECKOUT ----
function mostrarEtapa(etapa) {
  document.querySelectorAll('.etapa').forEach(e => e.classList.remove('ativa'));
  const el = document.getElementById(`etapa-${etapa}`);
  if (el) el.classList.add('ativa');
  // Steps
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
  const totalPic = carrinho.filter(i=>i.tipo==='picole').reduce((a,b)=>a+b.quantidade,0);
  if (totalPic > 0 && totalPic < 100) { showToast(`Mínimo 100 picolés. Você tem ${totalPic}.`,'alerta'); return; }
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
            <button class="btn-qty-mini" onclick="qtdCarrinho(${i},-1);renderResumoPedido()">−</button>
            <span>${item.quantidade}</span>
            <button class="btn-qty-mini" onclick="qtdCarrinho(${i},1);renderResumoPedido()">+</button>
          </div>
        </div>
        ${item.sabores.map(s=>`<div class="resumo-sabor">• ${s}</div>`).join('')}
        <div class="resumo-sub">R$ ${sub.toFixed(2).replace('.',',')}</div>
      </div>`;
    }).join('')}
    <div class="resumo-total-final">
      <span>Total do Pedido</span>
      <strong>R$ ${total.toFixed(2).replace('.',',')}</strong>
    </div>
    <div class="aviso-prazo">
      ⏰ <strong>Prazo:</strong> Entrega em até <strong>3 dias úteis</strong> após confirmação do pagamento.
    </div>`;
}

function finalizarPedido() {
  const nome = document.getElementById('cliente-nome').value.trim();
  const tel = document.getElementById('cliente-tel').value.trim();
  if (!nome) { showToast('Informe seu nome.','alerta'); return; }
  if (!tel) { showToast('Informe seu WhatsApp.','alerta'); return; }

  let total = 0;
  let msg = `🍦 *PEDIDO - Sorveteria Itapolitana Cajuru*\n\n`;
  msg += `👤 *Cliente:* ${nome}\n📱 *WhatsApp:* ${tel}\n\n`;
  msg += `📦 *ITENS:*\n`;
  carrinho.forEach(item => {
    const sub = item.preco * item.quantidade;
    total += sub;
    msg += `\n▶ *${item.nome}* (${item.quantidade} un.)\n`;
    item.sabores.forEach(s => msg += `   • ${s}\n`);
    msg += `   Subtotal: R$ ${sub.toFixed(2).replace('.',',')}\n`;
  });
  msg += `\n💰 *TOTAL: R$ ${total.toFixed(2).replace('.',',')}*\n`;
  msg += `\n⏰ Entrega em até 3 dias úteis após confirmação do pagamento.\n`;
  msg += `📍 Retirada: Rua Liga dos Bairros, Cajuru/SP`;

  const numPedido = 'ITA'+Date.now().toString().slice(-6);
  document.getElementById('num-pedido').textContent = numPedido;
  document.getElementById('btn-whatsapp-final').onclick = () =>
    window.open(`https://wa.me/5516991472045?text=${encodeURIComponent(msg)}`, '_blank');

  mostrarEtapa('confirmacao');
}

function novoPedido() {
  carrinho = [];
  fecharCarrinho();
  atualizarBotaoCarrinho();
  showToast('✅ Novo pedido iniciado!','sucesso');
}

// ---- UTILS ----
function abrirModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('ativo'); document.body.style.overflow='hidden'; }
}
function fecharModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('ativo'); document.body.style.overflow=''; }
}
function showToast(msg, tipo='sucesso') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ativo ${tipo}`;
  setTimeout(()=>t.classList.remove('ativo'), 3200);
}
function toggleSecao(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const aberto = el.classList.toggle('aberto');
  const icon = el.previousElementSibling?.querySelector('.toggle-icon');
  if (icon) icon.textContent = aberto ? '▲' : '▼';
}
