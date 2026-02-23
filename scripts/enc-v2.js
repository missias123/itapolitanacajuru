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

// Caixas de encomenda: carregadas do admin (localStorage) ou padrão
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

const PRODUTOS = {
  caixas: getCaixasEncomenda(),
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
  // Abrir caixas se vier de complementos
  if(hash === 'complementos'){
    const el = document.getElementById('conteudo-caixas');
    if(el){ el.classList.add('aberto'); }
    setTimeout(()=>{
      const sec = document.getElementById('caixas');
      if(sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
    }, 200);
  }
  // Abrir acrescimos via hash
  if(hash === 'acrescimos'){
    const el = document.getElementById('conteudo-acrescimos');
    if(el){ el.classList.add('aberto'); }
    setTimeout(()=>{
      const sec = document.getElementById('acrescimos');
      if(sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
    }, 200);
  }
  // Re-renderizar acrescimos ao abrir a seção
  const headerAcr = document.querySelector('#acrescimos .categoria-header');
  if(headerAcr){
    headerAcr.addEventListener('click', function(){
      setTimeout(renderizarAcrescimos, 50);
    });
  }
});

function renderizarTudo() {
  renderizarCaixas();
  renderizarTortas();
  renderizarPicoles();
  renderizarAcrescimos();
}

// ---- RENDERIZAR CAIXAS ----
function renderizarCaixas() {
  const c = document.getElementById('lista-caixas');
  if (!c) return;
  c.innerHTML = PRODUTOS.caixas.map(p => {
    const esgotado = p.esgotado || p.estoque <= 0;
    return `
    <div class="prod-card ${esgotado?'esgotado':''}">
      <div class="prod-body">
        <div class="prod-nome">${p.nome}</div>
        <div class="prod-preco">R$ ${p.preco.toFixed(2).replace('.',',')}</div>
        <div class="prod-estoque">${esgotado?'<span class="tag-esgotado">ESGOTADO</span>':`Estoque: ${p.estoque} un.`}</div>
      </div>
      <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}','caixas')" ${esgotado?'disabled':''}>
        🍦 Escolher ${p.maxSabores} Sabores
      </button>
    </div>`;
  }).join('');
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
  fecharModal('modal-sabores');
  showToast(`✅ ${produtoAtual.nome} adicionado ao carrinho!`, 'sucesso');
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
  if (m) { m.classList.remove('ativo'); }
  // Verificar se ainda há algum modal aberto antes de restaurar o scroll
  const algumAberto = document.querySelectorAll('.modal-overlay.ativo').length > 0;
  if (!algumAberto) {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.documentElement.style.overflow = '';
  }
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
  // Re-renderizar acréscimos ao abrir a seção
  if (id === 'conteudo-acrescimos' && aberto) {
    setTimeout(renderizarAcrescimos, 10);
  }
}


// ---- COMPLEMENTOS ----
function getComplementosEnc() {
  const PADRAO = [
    { id:'comp_canudinho', nome:'Canudinho Wafer',  preco:0.25,  estoque:100, esgotado:false },
    { id:'comp_casquinha', nome:'Casquinhas',        preco:0.25,  estoque:100, esgotado:false },
    { id:'comp_cascao',    nome:'Cascão',            preco:1.00,  estoque:100, esgotado:false },
    { id:'comp_cestinha',  nome:'Cestinha',          preco:1.00,  estoque:100, esgotado:false },
    { id:'comp_cobertura', nome:'Cobertura 1.3L',    preco:40.00, estoque:20,  esgotado:false }
  ];
  try {
    const salvo = localStorage.getItem('itap_complementos');
    if (salvo) {
      const dados = JSON.parse(salvo);
      return dados.map((c, i) => ({ ...PADRAO[i] || {}, ...c }));
    }
  } catch(e) {}
  return PADRAO;
}

function renderizarComplementos() {
  const lista = document.getElementById('lista-complementos-enc');
  if (!lista) return;
  const comps = getComplementosEnc();
  lista.innerHTML = comps.map(c => {
    const esgotado = c.esgotado || c.estoque <= 0;
    const item = carrinho.find(x => x.id === c.id);
    const qtd = item ? item.quantidade : 0;
    return `<div class="comp-row" id="comp-row-${c.id}" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border-radius:12px;border:2px solid ${esgotado?'#FECACA':'#e5e7eb'};margin-bottom:2px;opacity:${esgotado?'0.6':'1'}">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:24px">🍪</span>
        <div>
          <div style="font-weight:700;font-size:14px;color:#1a1a1a">${c.nome}</div>
          <div style="font-size:12px;color:#e53935;font-weight:600">R$ ${c.preco.toFixed(2).replace('.',',')} / un.</div>
        </div>
      </div>
      ${esgotado
        ? '<span style="background:#fee2e2;color:#dc2626;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">ESGOTADO</span>'
        : `<div style="display:flex;align-items:center;gap:10px">
            <button onclick="alterarCompEnc('${c.id}',-1)" style="width:34px;height:34px;border-radius:50%;border:2px solid #e53935;background:#fff;color:#e53935;font-size:20px;font-weight:700;cursor:pointer;line-height:1">−</button>
            <span id="comp-qtd-${c.id}" style="font-size:16px;font-weight:700;min-width:20px;text-align:center">${qtd}</span>
            <button onclick="alterarCompEnc('${c.id}',1)" style="width:34px;height:34px;border-radius:50%;border:none;background:#e53935;color:#fff;font-size:20px;font-weight:700;cursor:pointer;line-height:1">+</button>
           </div>`
      }
    </div>`;
  }).join('');
}

function alterarCompEnc(id, delta) {
  const comps = getComplementosEnc();
  const comp = comps.find(c => c.id === id);
  if (!comp) return;
  const idx = carrinho.findIndex(x => x.id === id);
  if (idx > -1) {
    carrinho[idx].quantidade += delta;
    if (carrinho[idx].quantidade <= 0) carrinho.splice(idx, 1);
  } else if (delta > 0) {
    carrinho.push({ id: comp.id, nome: comp.nome, preco: comp.preco, quantidade: 1, sabores: [], tipo: 'complemento' });
  }
  const qtdEl = document.getElementById('comp-qtd-' + id);
  if (qtdEl) {
    const item = carrinho.find(x => x.id === id);
    qtdEl.textContent = item ? item.quantidade : 0;
  }
  atualizarBotaoCarrinho();
}


// ---- COMPLEMENTOS ----
function getComplementosEnc() {
  const PADRAO = [
    { id:'comp_canudinho', nome:'Canudinho Wafer',  preco:0.25,  estoque:100, esgotado:false },
    { id:'comp_casquinha', nome:'Casquinhas',        preco:0.25,  estoque:100, esgotado:false },
    { id:'comp_cascao',    nome:'Cascao',            preco:1.00,  estoque:100, esgotado:false },
    { id:'comp_cestinha',  nome:'Cestinha',          preco:1.00,  estoque:100, esgotado:false },
    { id:'comp_cobertura', nome:'Cobertura 1.3L',    preco:40.00, estoque:20,  esgotado:false }
  ];
  try {
    const salvo = localStorage.getItem('itap_complementos');
    if (salvo) {
      const dados = JSON.parse(salvo);
      return dados.map((c, i) => ({ ...PADRAO[i] || {}, ...c }));
    }
  } catch(e) {}
  return PADRAO;
}

function renderizarComplementos() {
  const lista = document.getElementById('lista-complementos-enc');
  if (!lista) return;
  const comps = getComplementosEnc();
  lista.innerHTML = comps.map(c => {
    const esgotado = c.esgotado || c.estoque <= 0;
    const item = carrinho.find(x => x.id === c.id);
    const qtd = item ? item.quantidade : 0;
    const precoFmt = 'R$ ' + c.preco.toFixed(2).replace('.',',') + ' / un.';
    if (esgotado) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border-radius:12px;border:2px solid #FECACA;margin-bottom:2px;opacity:0.6"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">&#127850;</span><div><div style="font-weight:700;font-size:14px;color:#1a1a1a">' + c.nome + '</div><div style="font-size:12px;color:#e53935;font-weight:600">' + precoFmt + '</div></div></div><span style="background:#fee2e2;color:#dc2626;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">ESGOTADO</span></div>';
    }
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border-radius:12px;border:2px solid #e5e7eb;margin-bottom:2px"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">&#127850;</span><div><div style="font-weight:700;font-size:14px;color:#1a1a1a">' + c.nome + '</div><div style="font-size:12px;color:#e53935;font-weight:600">' + precoFmt + '</div></div></div><div style="display:flex;align-items:center;gap:10px"><button onclick=\"alterarCompEnc(\'' + c.id + '\',-1)\" style=\"width:34px;height:34px;border-radius:50%;border:2px solid #e53935;background:#fff;color:#e53935;font-size:20px;font-weight:700;cursor:pointer\">-</button><span id=\"comp-qtd-' + c.id + '\" style=\"font-size:16px;font-weight:700;min-width:20px;text-align:center\">' + qtd + '</span><button onclick=\"alterarCompEnc(\'' + c.id + '\',1)\" style=\"width:34px;height:34px;border-radius:50%;border:none;background:#e53935;color:#fff;font-size:20px;font-weight:700;cursor:pointer\">+</button></div></div>';
  }).join('');
}

function alterarCompEnc(id, delta) {
  const comps = getComplementosEnc();
  const comp = comps.find(c => c.id === id);
  if (!comp) return;
  const idx = carrinho.findIndex(x => x.id === id);
  if (idx > -1) {
    carrinho[idx].quantidade += delta;
    if (carrinho[idx].quantidade <= 0) carrinho.splice(idx, 1);
  } else if (delta > 0) {
    carrinho.push({ id: comp.id, nome: comp.nome, preco: comp.preco, quantidade: 1, sabores: [], tipo: 'complemento' });
  }
  const qtdEl = document.getElementById('comp-qtd-' + id);
  if (qtdEl) {
    const item = carrinho.find(x => x.id === id);
    qtdEl.textContent = item ? item.quantidade : 0;
  }
  atualizarBotaoCarrinho();
}

// ---- ACRÉSCIMOS (sincronizado com admin - itap_acrescimos) ----
function getAcrescimosEnc() {
  const PADRAO = [
    { id:'acr_canudinho', nome:'Canudinho Wafer', preco:0.25,  estoque:999, esgotado:false },
    { id:'acr_casquinha', nome:'Casquinhas',      preco:0.25,  estoque:999, esgotado:false },
    { id:'acr_cascao',    nome:'Cascão',          preco:1.00,  estoque:999, esgotado:false },
    { id:'acr_cestinha',  nome:'Cestinha',        preco:1.00,  estoque:999, esgotado:false },
    { id:'acr_cobertura', nome:'Cobertura 1.3L',  preco:40.00, estoque:20,  esgotado:false }
  ];
  try {
    const salvo = localStorage.getItem('itap_acrescimos');
    if (salvo) return JSON.parse(salvo);
  } catch(e) {}
  return PADRAO;
}
function renderizarAcrescimos() {
  const lista_el = document.getElementById('lista-acrescimos');
  if (!lista_el) return;
  const lista = getAcrescimosEnc();
  lista_el.innerHTML = lista.map(c => {
    const esgotado = c.esgotado || c.estoque <= 0;
    const item = carrinho.find(x => x.id === c.id);
    const qtd = item ? item.quantidade : 0;
    if (esgotado) {
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border-radius:12px;border:2px solid #FECACA;margin-bottom:8px;opacity:0.6">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:24px">🍪</span>
          <div>
            <div style="font-weight:700;font-size:14px;color:#1a1a1a">${c.nome}</div>
            <div style="font-size:12px;color:#e53935;font-weight:600">R$ ${c.preco.toFixed(2).replace('.',',')} / un.</div>
          </div>
        </div>
        <span style="background:#fee2e2;color:#dc2626;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">ESGOTADO</span>
      </div>`;
    }
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border-radius:12px;border:2px solid #e5e7eb;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:24px">🍪</span>
        <div>
          <div style="font-weight:700;font-size:14px;color:#1a1a1a">${c.nome}</div>
          <div style="font-size:12px;color:#e53935;font-weight:600">R$ ${c.preco.toFixed(2).replace('.',',')} / un.</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <button onclick="alterarAcrescimo('${c.id}',-1)" style="width:36px;height:36px;border-radius:50%;border:2px solid #1B5E20;background:#fff;color:#1B5E20;font-size:22px;font-weight:700;cursor:pointer;line-height:1">−</button>
        <span id="acr-qtd-${c.id}" style="font-size:16px;font-weight:700;min-width:22px;text-align:center">${qtd}</span>
        <button onclick="alterarAcrescimo('${c.id}',1)" style="width:36px;height:36px;border-radius:50%;border:none;background:#1B5E20;color:#fff;font-size:22px;font-weight:700;cursor:pointer;line-height:1">+</button>
      </div>
    </div>`;
  }).join('');
}
function alterarAcrescimo(id, delta) {
  const lista = getAcrescimosEnc();
  const comp = lista.find(c => c.id === id);
  if (!comp) return;
  const idx = carrinho.findIndex(x => x.id === id);
  if (idx > -1) {
    carrinho[idx].quantidade += delta;
    if (carrinho[idx].quantidade <= 0) carrinho.splice(idx, 1);
  } else if (delta > 0) {
    carrinho.push({ id: comp.id, nome: comp.nome, preco: comp.preco, quantidade: 1, sabores: [], tipo: 'acrescimo' });
  }
  const qtdEl = document.getElementById('acr-qtd-' + id);
  if (qtdEl) {
    const item = carrinho.find(x => x.id === id);
    qtdEl.textContent = item ? item.quantidade : 0;
  }
  atualizarBotaoCarrinho();
}
