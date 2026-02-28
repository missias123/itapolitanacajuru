
// ENCOMENDAS.JS - Sorveteria Itapolitana Cajuru
// Lógica completa do fluxo de encomendas
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

// Variáveis globais
var carrinho = [];
var produtoAtual = null;
var saboresSelecionados = [];
var selecoesPickle = {};        // seleções do modal atual (por sabor)
var selecoesPickleGlobal = {};  // acumulado de TODOS os tipos (chave: tipo_id + sabor)
var _nomeCliente = '';
var _telCliente = '';
var _enderecoCliente = '';

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
  // Modal carrinho: listeners diretos nos botões (sem conflito de dupla chamada)
  const modalCarrinho = document.getElementById('modal-carrinho');
  if (modalCarrinho) {
    // Fechar ao clicar no overlay (fora do modal-box)
    modalCarrinho.addEventListener('click', function(e) {
      if (e.target === modalCarrinho) fecharCarrinho();
    });
  }
  // Botão ir para dados (etapa 1 → 2)
  const btnIrDados = document.getElementById('btn-ir-dados');
  if (btnIrDados) {
    btnIrDados.addEventListener('click', function(e) {
      e.stopPropagation();
      irParaDados();
    });
  }
  // Botão Confirmar e Enviar Pedido (etapa 2 → 3)
  const btnFinalizar = document.getElementById('btn-finalizar');
  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', function(e) {
      e.stopPropagation();
      finalizarPedido();
    });
  }
  // Botão Voltar ao Carrinho
  const btnVoltarEtapa = document.getElementById('btn-voltar-etapa');
  if (btnVoltarEtapa) {
    btnVoltarEtapa.addEventListener('click', function(e) {
      e.stopPropagation();
      mostrarEtapa('revisao');
    });
  }
  // Botão Continuar Comprando (etapa 1)
  const btnContinuar = document.getElementById('btn-continuar-comprando');
  if (btnContinuar) {
    btnContinuar.addEventListener('click', function(e) {
      e.stopPropagation();
      fecharCarrinho();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  // Botão Revisar Carrinho (etapa 2 → 1) - alias do voltar-etapa
  const btnVoltarEtapa2 = document.getElementById('btn-voltar-etapa2');
  if (btnVoltarEtapa2) {
    btnVoltarEtapa2.addEventListener('click', function(e) {
      e.stopPropagation();
      mostrarEtapa('revisao');
    });
  }
  // Botão Desistir e Voltar às Encomendas (etapa 3)
  const btnVoltarCardapio = document.getElementById('btn-voltar-cardapio');
  if (btnVoltarCardapio) {
    btnVoltarCardapio.addEventListener('click', function(e) {
      e.stopPropagation();
      fecharCarrinho();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  // Botão Voltar às Encomendas (etapa 2) — fecha o modal, mantém o carrinho
  const btnSairFormulario = document.getElementById('btn-sair-formulario');
  if (btnSairFormulario) {
    btnSairFormulario.addEventListener('click', function(e) {
      e.stopPropagation();
      fecharCarrinho();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Carregar preços da nuvem e re-renderizar
  carregarPrecosNuvem().then(() => {
    // Re-inicializar PRODUTOS com preços atualizados
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
    atualizarBotaoCarrinho();
  });
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
  renderizarPicolés();
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
      <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}','caixas',this)" ${esgotado?'disabled':''}>
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
      <button class="btn-sabores" onclick="abrirSaboresSorvete('${p.id}','tortas',this)" ${p.estoque===0?'disabled':''}>
        🎂 Escolher ${p.maxSabores} Sabores
      </button>
    </div>`).join('');
}

// ---- RENDERIZAR PICOLÉS ----
function renderizarPicolés() {
  const c = document.getElementById('lista-picoles');
  if (!c) return;
  c.innerHTML = PRODUTOS.picoles.map(p => `
    <div class="prod-card picolé ${p.estoque===0?'esgotado':''}">
      <div class="prod-body">
        <div class="prod-nome">${p.nome}</div>
        <div class="prod-precos-picolé">
          <span>Varejo: R$ ${p.precoVarejo.toFixed(2).replace('.',',')}</span>
          <span class="destaque">Atacado: R$ ${p.precoAtacado.toFixed(2).replace('.',',')}</span>
        </div>
        <div class="prod-estoque">${p.estoque===0?'<span class="tag-esgotado">ESGOTADO</span>':`Estoque: ${p.estoque} un.`}</div>
      </div>
      <button class="btn-sabores btn-picolé" onclick="abrirModalPicolé('${p.id}',this)" ${p.estoque===0?'disabled':''}>
        🍭 Ver Sabores
      </button>
    </div>`).join('');
}

// ---- MODAL SABORES SORVETE ----
function abrirSaboresSorvete(id, cat, originEl) {
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
  abrirModal('modal-sabores', originEl);
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
  const faltam = max - atual;
  // Texto dinâmico indicando quantos sabores faltam
  let txtBotao;
  if (atual === 0) {
    txtBotao = `🔒 Selecione ${max} sabores para continuar`;
  } else if (faltam > 0) {
    txtBotao = `🔒 Falta${faltam > 1 ? 'm' : ''} ${faltam} sabor${faltam > 1 ? 'es' : ''}`;
  } else {
    txtBotao = `✅ Confirmar Seleção (${atual}/${max})`;
  }
  btn.title = txtBotao;
  const txtEl = document.getElementById('txt-confirmar-sabores');
  if (txtEl) txtEl.textContent = txtBotao;
  // Botão só libera quando tiver exatamente o número de sabores necessário
  btn.disabled = atual !== max;
  btn.className = 'btn-confirmar' + (atual === max ? ' pronto' : ' bloqueado');
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
function mostrarTelasTiposPicole() {
  // Mostra a tela de seleção de tipos dentro do modal
  const telaTipos = document.getElementById('picole-tela-tipos');
  const telaSabores = document.getElementById('picole-tela-sabores');
  if (telaTipos) telaTipos.style.display = 'block';
  if (telaSabores) telaSabores.style.display = 'none';
  // Atualizar título
  const titulo = document.getElementById('picolé-titulo');
  if (titulo) titulo.textContent = 'Picolés — Escolha o Tipo';
  const precos = document.getElementById('picolé-precos');
  if (precos) precos.textContent = 'Toque em um tipo para ver os sabores';
  // Renderizar botões dos tipos
  const lista = document.getElementById('picole-lista-tipos');
  if (lista) {
    lista.innerHTML = PRODUTOS.picoles.map(p => {
      const totalTipo = Object.entries(selecoesPickleGlobal)
        .filter(([k]) => k.startsWith(p.id + '::'))
        .reduce((a,[,v]) => a + v, 0);
      const esgotado = p.estoque === 0;
      return `
        <button class="btn-tipo-picole ${esgotado ? 'esgotado' : ''}" onclick="abrirTipoPicole('${p.id}')" ${esgotado ? 'disabled' : ''}>
          <span class="btn-tipo-nome">${p.nome}</span>
          ${totalTipo > 0 ? `<span class="btn-tipo-qtd">${totalTipo} un.</span>` : ''}
          <span class="btn-tipo-preco">Atacado: R$ ${p.precoAtacado.toFixed(2).replace('.',',')}</span>
        </button>`;
    }).join('');
  }
  // Atualizar total na tela de tipos
  const elTipos = document.getElementById('total-picoles-tipos');
  if (elTipos) elTipos.textContent = totalPickleGlobal();
  // Atualizar botão na tela de tipos
  const btnTipos = document.getElementById('btn-add-picoles-tipos');
  const totalGlobal = totalPickleGlobal();
  if (btnTipos) {
    if (totalGlobal === 0) { btnTipos.disabled = true; btnTipos.textContent = `🍭 Selecione ao menos ${MIN_PICOLES} picolés para liberar`; }
    else if (totalGlobal < MIN_PICOLES) { btnTipos.disabled = true; btnTipos.textContent = `🔒 Faltam ${MIN_PICOLES - totalGlobal} picolés (total: ${totalGlobal})`; }
    else if (totalGlobal > MAX_PICOLES) { btnTipos.disabled = true; btnTipos.textContent = `⚠️ Máximo ${MAX_PICOLES} picolés atingido`; }
    else { btnTipos.disabled = false; btnTipos.textContent = `✅ Adicionar ${totalGlobal} picolé(s) ao carrinho`; }
  }
}

function abrirTipoPicole(id) {
  // Abre os sabores do tipo selecionado dentro do mesmo modal
  const telaTipos = document.getElementById('picole-tela-tipos');
  const telaSabores = document.getElementById('picole-tela-sabores');
  if (telaTipos) telaTipos.style.display = 'none';
  if (telaSabores) telaSabores.style.display = 'block';
  abrirModalPicolé(id);
}

function abrirModalPicolé(id, originEl) {
  const p = PRODUTOS.picoles.find(x => x.id === id);
  if (!p) return;
   picoleAtual = p;
  // Restaurar seleções já feitas para este tipo a partir do global
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

  // TRAVA 1: Limite de 25 unidades por sabor
  if (delta > 0 && nova > 25) {
    showToast(`⚠️ Limite excedido de sabores!`, 'alerta');
    // Forçar o valor a 25 caso algo tenha passado
    selecoesPickle[sabor] = 25;
    const elFix = document.getElementById(`pqty-${sabor.replace(/\s+/g,'_')}`);
    if (elFix) elFix.textContent = 25;
    atualizarTotalPickle();
    return;
  }

  // TRAVA 2: Verificar limite global de 250
  const totalGlobal = totalPickleGlobal();
  const diff = nova - (selecoesPickle[sabor] || 0);
  if (totalGlobal + diff > MAX_PICOLES) {
    showToast(`⚠️ Máximo ${MAX_PICOLES} picolés no total. Você já tem ${totalGlobal}.`, 'alerta');
    return;
  }

  selecoesPickle[sabor] = nova;
  // Atualizar o global
  const chave = picoleAtual.id + '::' + sabor;
  if (nova === 0) { delete selecoesPickleGlobal[chave]; }
  else { selecoesPickleGlobal[chave] = nova; }
  const el = document.getElementById(`pqty-${sabor.replace(/\s+/g,'_')}`);
  if (el) el.textContent = nova;
  atualizarTotalPickle();
}
function totalPickleGlobal() {
  return Object.values(selecoesPickleGlobal).reduce((a,b)=>a+b,0);
}

const MIN_PICOLES = 100;
const MAX_PICOLES = 250;

function atualizarTotalPickle() {
  // Usa o total GLOBAL (todos os tipos acumulados)
  const totalGlobal = totalPickleGlobal();
  const el = document.getElementById('total-picoles');
  if (el) el.textContent = totalGlobal;
  const btn = document.getElementById('btn-add-picoles');
  const aviso = document.getElementById('aviso-minimo-picolé');
  // Regra: bloqueado 0-99, liberado 100-250, bloqueado 251+
  if (btn) {
    if (totalGlobal === 0) {
      btn.disabled = true;
      btn.textContent = `🍭 Selecione ao menos ${MIN_PICOLES} picolés para liberar`;
    } else if (totalGlobal < MIN_PICOLES) {
      btn.disabled = true;
      btn.textContent = `🔒 Faltam ${MIN_PICOLES - totalGlobal} picolés (total: ${totalGlobal})`;
    } else if (totalGlobal > MAX_PICOLES) {
      btn.disabled = true;
      btn.textContent = `⚠️ Máximo ${MAX_PICOLES} picolés atingido`;
    } else {
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
  // Atualizar barra de progresso fixa no header
  const progressNum = document.getElementById('picole-progress-num');
  const progressStatus = document.getElementById('picole-progress-status');
  const progressFill = document.getElementById('picole-progress-fill');
  if (progressNum) progressNum.textContent = totalGlobal;
  if (progressFill) {
    const pct = Math.min((totalGlobal / MAX_PICOLES) * 100, 100);
    progressFill.style.width = pct + '%';
    if (totalGlobal >= MIN_PICOLES && totalGlobal <= MAX_PICOLES) {
      progressFill.classList.add('ok');
    } else {
      progressFill.classList.remove('ok');
    }
  }
  if (progressStatus) {
    if (totalGlobal === 0) {
      progressStatus.textContent = `🔒 Faltam ${MIN_PICOLES}`;
      progressStatus.classList.remove('ok');
    } else if (totalGlobal < MIN_PICOLES) {
      progressStatus.textContent = `🔒 Faltam ${MIN_PICOLES - totalGlobal}`;
      progressStatus.classList.remove('ok');
    } else if (totalGlobal > MAX_PICOLES) {
      progressStatus.textContent = `⚠️ Máx. atingido`;
      progressStatus.classList.remove('ok');
    } else {
      progressStatus.textContent = `✅ Pronto!`;
      progressStatus.classList.add('ok');
    }
  }
}

function confirmarPickle() {
  const totalGlobal = totalPickleGlobal();
  if (totalGlobal < MIN_PICOLES) { showToast(`⚠️ Mínimo ${MIN_PICOLES} picolés no total. Você tem ${totalGlobal}. Continue comprando outros tipos!`, 'alerta'); return; }
  if (totalGlobal > MAX_PICOLES) { showToast(`⚠️ Máximo ${MAX_PICOLES} picolés no total.`, 'alerta'); return; }
  // Adicionar um item por SABOR no carrinho (não por tipo)
  Object.entries(selecoesPickleGlobal).forEach(([chave, qtd]) => {
    if (qtd <= 0) return;
    const [tipoId, ...saborParts] = chave.split('::');
    const sabor = saborParts.join('::');
    const p = PRODUTOS.picoles.find(x => x.id === tipoId);
    if (!p) return;
    const itemId = tipoId + '::' + sabor;
    // Se já existe esse sabor no carrinho, atualizar quantidade
    const ex = carrinho.find(c => c.tipo === 'picolé' && c.id === itemId);
    if (ex) { ex.quantidade = qtd; }
    else {
      carrinho.push({
        id: itemId,
        nome: sabor,
        nomeTipo: p.nome,
        preco: p.precoAtacado,
        sabores: [],
        quantidade: qtd,
        tipo: 'picolé'
      });
    }
  });
  // Limpar seleções globais
  selecoesPickleGlobal = {};
  selecoesPickle = {};
  fecharModal('modal-picolé');
  atualizarBotaoCarrinho();
  showToast(`✅ ${totalGlobal} picolé(s) adicionado(s) ao carrinho!`, 'sucesso');
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
    if (item.tipo === 'picolé') {
      // Picolé: tipo no topo (pequeno/cinza), sabor em destaque + contador embaixo
      return `
      <div class="cart-item" style="flex-direction:column;align-items:stretch;padding:10px 14px;">
        <div style="font-size:10px;color:#9CA3AF;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:2px">${item.nomeTipo || ''}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div style="flex:1;min-width:0">
            <div class="cart-item-nome" style="margin:0;font-size:15px;font-weight:800">${item.nome}</div>
            <div class="cart-item-preco-unit" style="margin:0">R$ ${item.preco.toFixed(2).replace('.',',')} / un.</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <div class="qty-ctrl">
              <button class="btn-qty" onclick="qtdCarrinho(${i},-1)">−</button>
              <span class="qty-val">${item.quantidade}</span>
              <button class="btn-qty" onclick="qtdCarrinho(${i},1)">+</button>
            </div>
            <button class="btn-remover" onclick="removerItem(${i})" title="Remover">🗑️</button>
          </div>
        </div>
        <div style="text-align:right;font-weight:700;color:#1565C0;font-size:13px;margin-top:4px">R$ ${sub.toFixed(2).replace('.',',')}</div>
      </div>`;
    }
    // Caixa / Torta: tipo no topo, sabores abaixo
    const saboresHtml = item.sabores && item.sabores.length > 0
      ? item.sabores.map(s => `<div style="font-size:12px;color:#6B7280;margin-top:2px">• ${s}</div>`).join('') : '';
    return `
    <div class="cart-item" style="flex-direction:column;align-items:stretch;padding:10px 14px;">
      <div style="font-size:10px;color:#9CA3AF;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:2px">${item.tipo === 'sorvete' ? 'Sorvete' : item.tipo || ''}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="flex:1;min-width:0">
          <div class="cart-item-nome" style="margin:0;font-size:15px;font-weight:800">${item.nome}</div>
          ${saboresHtml}
          <div class="cart-item-preco-unit" style="margin-top:3px">R$ ${item.preco.toFixed(2).replace('.',',')} / un.</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <div class="qty-ctrl">
            <button class="btn-qty" onclick="qtdCarrinho(${i},-1)">−</button>
            <span class="qty-val">${item.quantidade}</span>
            <button class="btn-qty" onclick="qtdCarrinho(${i},1)">+</button>
          </div>
          <div class="cart-item-sub" style="font-size:12px;font-weight:700;color:#1565C0">R$ ${sub.toFixed(2).replace('.',',')}</div>
          <button class="btn-remover" onclick="removerItem(${i})" title="Remover">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.',',')}`;
  const totalPic = carrinho.filter(i=>i.tipo==='picolé').reduce((a,b)=>a+b.quantidade,0);
  const temPicole = carrinho.some(i=>i.tipo==='picolé');
  const aviso = document.getElementById('aviso-min-carrinho');
  const btnNext = document.getElementById('btn-ir-dados');
  if (temPicole && totalPic < 100) {
    // Bloquear botão Prosseguir
    if (aviso) {
      aviso.style.display = 'block';
      aviso.style.cssText = 'display:block;background:#FEF2F2;border:2px solid #EF4444;border-radius:10px;padding:12px 14px;margin-top:10px;font-size:13px;font-weight:700;color:#DC2626;text-align:center';
      aviso.textContent = `🔒 Mínimo 100 picolés para atacado. Você tem ${totalPic}. Faltam ${100 - totalPic}.`;
    }
    if (btnNext) {
      btnNext.disabled = true;
      btnNext.style.opacity = '0.4';
      btnNext.title = `Mínimo 100 picolés. Você tem ${totalPic}.`;
    }
  } else {
    if (aviso) aviso.style.display = 'none';
    if (btnNext) {
      btnNext.disabled = false;
      btnNext.style.opacity = '1';
      btnNext.title = '';
    }
  }
}

function qtdCarrinho(i, delta) {
  if (!carrinho[i]) return;
  const item = carrinho[i];
  const nova = item.quantidade + delta;
  if (nova <= 0) { removerItem(i); return; }
  // Verificar limite máximo por tipo
  if (item.tipo === 'picolé' && nova > MAX_PICOLES) {
    showToast(`⚠️ Máximo ${MAX_PICOLES} picolés no total.`, 'alerta');
    return;
  }
  item.quantidade = nova;
  const totalPicAtual = carrinho.filter(c=>c.tipo==='picolé').reduce((a,b)=>a+b.quantidade,0);
  const temPicole = carrinho.some(c=>c.tipo==='picolé');
  if (temPicole && totalPicAtual < 100 && delta < 0) {
    renderCarrinho(); // atualiza visual com aviso
    atualizarBotaoCarrinho();
    // Se estiver na etapa de dados, voltar para revisão
    const etapaDados = document.getElementById('etapa-dados');
    if (etapaDados && etapaDados.classList.contains('ativa')) {
      mostrarEtapa('revisao');
    }
    return;
  }
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
  // Botão Finalizar: visível apenas na etapa de revisão
  const btnIrDados = document.getElementById('btn-ir-dados');
  if (btnIrDados) {
    btnIrDados.closest('div[style]') && (btnIrDados.closest('div[style]').style.display = etapa === 'revisao' ? 'flex' : 'none');
  }
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
  // Scroll para o topo do modal
  setTimeout(() => {
    const modalBox = document.querySelector('#modal-carrinho .modal-box');
    if (modalBox) modalBox.scrollTop = 0;
  }, 50);
}

function irParaDados() {
  if (carrinho.length === 0) { showToast('Carrinho vazio!','alerta'); return; }
  const totalPicoles = carrinho.filter(i=>i.tipo==='picolé').reduce((a,b)=>a+b.quantidade,0);
  const temPicole = carrinho.some(i=>i.tipo==='picolé');
  if (temPicole && totalPicoles < 100) {
    showToast(`🔒 Mínimo 100 picolés para atacado. Você tem ${totalPicoles}. Faltam ${100-totalPicoles}.`, 'alerta');
    return;
  }
  renderResumoPedido();
  const etapaDados = document.getElementById('etapa-dados');
  if (!etapaDados) { showToast('Erro ao carregar formulário. Recarregue a página.','alerta'); return; }
  mostrarEtapa('dados');
  setTimeout(() => {
    const modalBox = document.querySelector('#modal-carrinho .modal-box');
    if (modalBox) modalBox.scrollTop = 0;
  }, 100);
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
      // Tipo no topo para todos os produtos
      const tipoLabel = item.tipo === 'picolé' ? (item.nomeTipo || 'Picolé') : item.tipo === 'sorvete' ? 'Sorvete' : item.tipo === 'acrescimo' ? 'Acréscimo' : (item.tipo || '');
      const tipoTopoHtml = tipoLabel ? `<div style="font-size:10px;color:#9CA3AF;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:2px">${tipoLabel}</div>` : '';
      return `
      <div class="resumo-item">
        ${tipoTopoHtml}
        <div class="resumo-item-topo">
          <strong>${item.nome}</strong>
          <div class="qty-ctrl-mini">
            <button class="btn-qty-mini" onclick="qtdCarrinho(${i},-1);renderResumoPedido()">−</button>
            <span>${item.quantidade}</span>
            <button class="btn-qty-mini" onclick="qtdCarrinho(${i},1);renderResumoPedido()">+</button>
          </div>
        </div>
        ${item.sabores && item.sabores.length > 0 ? item.sabores.map(s=>`<div class="resumo-sabor">• ${s}</div>`).join('') : ''}
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

function verificarFormulario() {
  const nome = (document.getElementById('cliente-nome')?.value || '').trim();
  const tel  = (document.getElementById('cliente-tel')?.value  || '').trim();
  const end  = (document.getElementById('cliente-endereco')?.value || '').trim();
  const btn  = document.getElementById('btn-finalizar');
  const hint = document.getElementById('campos-obrigatorios-hint');
  const barra = document.getElementById('barra-btn-finalizar');
  const texto = document.getElementById('texto-btn-finalizar');
  if (!btn) return;
  const liberado = nome.length >= 3 && tel.length >= 8 && end.length >= 5;
  btn.disabled = !liberado;
  btn.style.opacity = liberado ? '1' : '0.4';
  // Feedback visual corporativo
  if (liberado) {
    if (hint) hint.style.display = 'none';
    if (barra) barra.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32, #43A047)';
    if (texto) texto.textContent = '📲 Gerar Pedido e Enviar via WhatsApp';
    btn.title = 'Clique para gerar seu pedido';
  } else {
    if (hint) hint.style.display = 'block';
    if (barra) barra.style.background = 'linear-gradient(135deg, #424242, #616161)';
    if (texto) texto.textContent = '🔒 Preencha os campos abaixo';
    btn.title = 'Preencha todos os campos para continuar';
  }
}

function finalizarPedido() {
  // CHECKOUT CORPORATIVO — Padrão de produção
  // Validação robusta + loading state + fallback garantido
  const _totalPicFinal = carrinho.filter(i=>i.tipo==='picolé').reduce((a,b)=>a+b.quantidade,0);
  const _temPicoleFinal = carrinho.some(i=>i.tipo==='picolé');
  if (_temPicoleFinal && _totalPicFinal < 100) {
    showToast(`🔒 Pedido bloqueado: mínimo 100 picolés. Você tem ${_totalPicFinal}.`, 'alerta');
    mostrarEtapa('revisao');
    return;
  }
  const nomeEl = document.getElementById('cliente-nome');
  const telEl  = document.getElementById('cliente-tel');
  const endEl  = document.getElementById('cliente-endereco');
  const nome = ((nomeEl ? nomeEl.value : '') || _nomeCliente || '').trim();
  const tel  = ((telEl  ? telEl.value  : '') || _telCliente  || '').trim();
  const end  = ((endEl  ? endEl.value  : '') || _enderecoCliente || '').trim();
  // Validação de campos
  if (!nome || nome.length < 3) { showToast('⚠️ Preencha seu nome completo (mínimo 3 caracteres).', 'alerta'); return; }
  if (!tel  || tel.length  < 8) { showToast('⚠️ Preencha seu WhatsApp com DDD.', 'alerta'); return; }
  if (!end  || end.length  < 5) { showToast('⚠️ Preencha o endereço de entrega.', 'alerta'); return; }
  if (carrinho.length === 0)    { showToast('⚠️ Carrinho vazio! Adicione produtos.', 'alerta'); return; }
  // === LOADING STATE: bloquear duplo clique e mostrar progresso ===
  const btnFin = document.getElementById('btn-finalizar');
  const textoBtn = document.getElementById('texto-btn-finalizar');
  const barra = document.getElementById('barra-btn-finalizar');
  if (btnFin) { btnFin.disabled = true; btnFin.textContent = '⏳'; }
  if (textoBtn) textoBtn.textContent = '⏳ Gerando número do pedido...';
  if (barra) barra.style.background = 'linear-gradient(135deg, #E65100, #FF6D00)';
  // Data/hora atual
  const agora = new Date();
  const dd   = String(agora.getDate()).padStart(2, '0');
  const mm   = String(agora.getMonth() + 1).padStart(2, '0');
  const aaaa = agora.getFullYear();
  const hh   = String(agora.getHours()).padStart(2, '0');
  const min  = String(agora.getMinutes()).padStart(2, '0');
  const dataFormatada = `${dd}/${mm}/${aaaa} ${hh}:${min}`;
  // Função de reset do botão em caso de erro
  function _resetBtnFinalizar() {
    if (btnFin) { btnFin.disabled = false; btnFin.textContent = '✓'; btnFin.style.opacity = '1'; }
    if (textoBtn) textoBtn.textContent = '📲 Gerar Pedido e Enviar via WhatsApp';
    if (barra) barra.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32, #43A047)';
  }
  // SISTEMA DE NUMERAÇÃO DE PEDIDOS
  // Formato: ITA-001-250225 (prefixo + sequência diária + data compacta)
  // Sequência reinicia todo dia — armazenada no localStorage por data
  try {
    const dataChave = `${dd}${mm}${String(aaaa).slice(2)}`; // ex: 250225
    const chaveSeq = `itap_seq_${dataChave}`;
    const seq = parseInt(localStorage.getItem(chaveSeq) || '0') + 1;
    localStorage.setItem(chaveSeq, seq.toString());
    const seqStr = String(seq).padStart(3, '0');
    const numPedido = `ITA-${seqStr}-${dataChave}`;
    _concluirPedido(nome, tel, end, numPedido, dataFormatada, _resetBtnFinalizar);
  } catch(e) {
    _resetBtnFinalizar();
    showToast('⚠️ Erro ao gerar pedido. Tente novamente.', 'alerta');
  }
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
    // Regra global: todo produto mostra tipo + nome + sabores
    if (item.tipo === 'picolé' && item.nomeTipo) {
      msg += `\n▶ *${item.nomeTipo} — ${item.nome}* (${item.quantidade} un.)\n`;
    } else if (item.tipo === 'sorvete') {
      msg += `\n▶ *Sorvete — ${item.nome}* (${item.quantidade} un.)\n`;
      if (item.sabores && item.sabores.length > 0) {
        item.sabores.forEach(s => msg += `   • ${s}\n`);
      }
    } else if (item.tipo === 'acrescimo') {
      msg += `\n▶ *Acréscimo — ${item.nome}* (${item.quantidade} un.)\n`;
    } else {
      msg += `\n▶ *${item.nome}* (${item.quantidade} un.)\n`;
      if (item.sabores && item.sabores.length > 0) {
        item.sabores.forEach(s => msg += `   • ${s}\n`);
      }
    }
    msg += `   Subtotal: R$ ${sub.toFixed(2).replace('.',',')}\n`;
  });
  msg += `\n💰 *TOTAL: R$ ${total.toFixed(2).replace('.',',')}*\n`;
  msg += `\n⏰ Entrega em até 3 dias úteis após confirmação do pagamento.\n`;
  msg += `📍 Retirada na loja em Cajuru/SP`;
  // Salvar pedido no localStorage para o Admin visualizar
  try {
    const pedidos = JSON.parse(localStorage.getItem('itap_pedidos') || '[]');
    pedidos.unshift({
      num: numPedido,
      data: new Date().toLocaleString('pt-BR'),
      nome: nome,
      tel: tel,
      endereco: end,
      itens: carrinho.map(i => ({ nome: i.nome, nomeTipo: i.nomeTipo || '', qtd: i.quantidade, sabores: i.sabores || [], preco: i.preco, tipo: i.tipo || 'sorvete' })),
      total: total,
      status: 'novo'
    });
    if (pedidos.length > 50) pedidos.length = 50;
    localStorage.setItem('itap_pedidos', JSON.stringify(pedidos));
  } catch(e) { console.warn('Erro ao salvar pedido:', e); }
  const numEl = document.getElementById('num-pedido');
  if (numEl) numEl.textContent = numPedido;
  const dataEl = document.getElementById('data-pedido');
  if (dataEl) dataEl.textContent = `📅 Data: ${dataFormatada}`;

  // Atualizar o href do link WhatsApp diretamente (evita bloqueio de popup)
  // ESVAZIAR CARRINHO E REDUZIR ESTOQUE IMEDIATAMENTE
  // Feito aqui (antes de mostrar a tela de confirmação) para
  // garantir que o estoque e carrinho sejam atualizados mesmo
  // que o usuário saia da página ao abrir o WhatsApp
  const caixas = getCaixasEncomenda();
  const tortas = getTortasEncomenda();
  const estoquePicoles = typeof getEstoquePickles === 'function' ? getEstoquePickles() : JSON.parse(localStorage.getItem('itap_estoque_picoles') || '{}');

  carrinho.forEach(item => {
    // Baixa de Caixas
    const cx = caixas.find(c => c.id === item.id);
    if (cx && cx.estoque > 0) { cx.estoque = Math.max(0, cx.estoque - item.quantidade); }
    
    // Baixa de Tortas
    const tr = tortas.find(t => t.id === item.id);
    if (tr && tr.estoque > 0) { tr.estoque = Math.max(0, tr.estoque - item.quantidade); }

    // BAIXA DE PICOLÉS (POR SABOR)
    if (item.tipo === 'picolé') {
      const sabor = item.nome; // O nome do item no carrinho de picolé é o sabor
      if (estoquePicoles[sabor] !== undefined) {
        estoquePicoles[sabor] = Math.max(0, estoquePicoles[sabor] - item.quantidade);
      }
    }
  });

  localStorage.setItem('itap_caixas_enc', JSON.stringify(caixas));
  localStorage.setItem('itap_tortas_enc', JSON.stringify(tortas));
  localStorage.setItem('itap_estoque_picoles', JSON.stringify(estoquePicoles));
  // Esvaziar carrinho imediatamente
  carrinho.length = 0;
  atualizarBotaoCarrinho();

  // Atualizar o link WhatsApp (apenas o href, sem onclick)
  const linkWpp = document.getElementById('link-whatsapp-final');
  if (linkWpp) {
    linkWpp.href = `https://wa.me/5516991472045?text=${encodeURIComponent(msg)}`;
  }
  mostrarEtapa('confirmacao');
  } catch(e) {
    console.error('[ITAP] Erro ao concluir pedido:', e);
    if (typeof _resetBtn === 'function') _resetBtn();
    else {
      const btnFin = document.getElementById('btn-finalizar');
      if (btnFin) { btnFin.disabled = false; btnFin.textContent = '✓'; btnFin.style.opacity = '1'; }
      const textoBtn = document.getElementById('texto-btn-finalizar');
      if (textoBtn) textoBtn.textContent = '📲 Gerar Pedido e Enviar via WhatsApp';
      const barra = document.getElementById('barra-btn-finalizar');
      if (barra) barra.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32, #43A047)';
    }
    showToast('⚠️ Erro ao gerar pedido. Tente novamente.', 'alerta');
  }
}

function novoPedido() {
  carrinho = [];
  fecharCarrinho();
  atualizarBotaoCarrinho();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('✅ Novo pedido iniciado! Carrinho limpo.','sucesso');
}

// ---- UTILS ----
let _encScrollY = 0;
let _encOriginEl = null;
function abrirModal(id, originEl) {
  const m = document.getElementById(id);
  if (m) {
    _encScrollY = window.scrollY;
    _encOriginEl = originEl || null;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _encScrollY + 'px';
    document.body.style.width = '100%';
    m.classList.add('ativo');
  }
}
function fecharModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('ativo'); }
  const algumAberto = document.querySelectorAll('.modal-overlay.ativo').length > 0;
  if (!algumAberto) {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.documentElement.style.overflow = '';
    window.scrollTo({ top: _encScrollY, behavior: 'instant' });
    if (_encOriginEl) {
      setTimeout(() => { _encOriginEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
    }
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
  const jaAberto = el.classList.contains('aberto');

  // Fechar TODAS as seções abertas (accordion exclusivo)
  const todasSecoes = ['conteudo-caixas', 'conteudo-tortas', 'conteudo-picoles', 'conteudo-acrescimos'];
  todasSecoes.forEach(secId => {
    const secEl = document.getElementById(secId);
    if (secEl && secEl.classList.contains('aberto')) {
      secEl.classList.remove('aberto');
      const icon = secEl.previousElementSibling?.querySelector('.toggle-icon');
      if (icon) icon.textContent = '▼';
    }
  });

  // Se não estava aberto, abrir agora
  if (!jaAberto) {
    el.classList.add('aberto');
    const icon = el.previousElementSibling?.querySelector('.toggle-icon');
    if (icon) icon.textContent = '▲';
    // Re-renderizar ao abrir
    if (id === 'conteudo-acrescimos') {
      setTimeout(renderizarAcrescimos, 10);
    }
    if (id === 'conteudo-picoles') {
      setTimeout(renderizarPicolés, 10);
    }
    if (id === 'conteudo-caixas') {
      setTimeout(renderizarCaixas, 10);
    }
    if (id === 'conteudo-tortas') {
      setTimeout(renderizarTortas, 10);
    }
    // Scroll suave até a seção
    setTimeout(() => {
      const pai = el.closest('.categoria');
      if (pai) pai.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}


// ---- ACRÉSCIMOS (sincronizado com admin - itap_acrescimos) ----
function getAcrescimosEnc() {
  const PADRAO = [
    { id:'acr_canudinho', nome:'Canudinho Wafer', preco:0.25,  estoque:100, esgotado:false },
    { id:'acr_casquinha', nome:'Casquinhas',      preco:0.25,  estoque:100, esgotado:false },
    { id:'acr_cascão',    nome:'Cascão',          preco:1.00,  estoque:100, esgotado:false },
    { id:'acr_cestinha',  nome:'Cestinha',        preco:1.00,  estoque:100, esgotado:false },
    { id:'acr_cobertura', nome:'Cobertura 1.3L',  preco:40.00, estoque:100, esgotado:false }
  ];
  try {
    const salvo = localStorage.getItem('itap_acrescimos');
    if (salvo) {
      const todos = JSON.parse(salvo);
      // Filtrar apenas slots com nome preenchido (ativos)
      const ativos = todos.filter(c => c.nome && c.nome.trim() !== '');
      return ativos.length > 0 ? ativos : PADRAO;
    }
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
