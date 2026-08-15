
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });





  gtag('js', new Date());
  gtag('config', 'G-S6TCMLQLQF', {'send_page_view': true});



  // Bloqueia acesso pelo domínio antigo (.site) e redireciona para o oficial
  (function() {
    if (window.location.hostname.includes('itapolitanacajuru.site')) {
      document.documentElement.innerHTML = '<div style="font-family:sans-serif;text-align:center;padding:50px"><h1>Acesso Negado</h1><p>Este domínio (.site) está desatualizado e foi desativado.</p><p>Use o site oficial: <a href="https://itapolitanacajuru.com.br" style="color:#1565C0;font-weight:bold">itapolitanacajuru.com.br</a></p></div>';
      window.stop();
    }
  })();



// Dados de cada tema
var faleTemas = {
  promocao: {
    emoji: '🎉',
    titulo: 'Promoções',
    palavras: [
      '✅ Temos promoções semanais e mensais.',
      '✅ Para participar: comente "PROMO ITAPOLITANA" em qualquer post do Instagram.',
      '✅ Realize o cadastro na página de Promoção.',
      '✅ Fique de olho nas redes sociais para não perder nenhuma oferta.',
      '✅ Promoções válidas enquanto durarem os estoques.'
    ],
    link: 'promocao.html',
    linkTexto: 'Mais dúvidas sobre Promoções? Acesse →'
  },
  horario: {
    emoji: '🕐',
    titulo: 'Horário de Funcionamento',
    palavras: [
      '✅ Funcionamos todos os dias: das 10h às 22h.',
      '✅ Inclusive sábados, domingos e feriados.',
      '✅ Atendimento via WhatsApp durante o horário de funcionamento.',
      '✅ Endereço: Praça Largo São Bento — Cajuru/SP.',
      '✅ Veja o mapa e como chegar no site.'
    ],
    link: 'index.html#horario',
    linkTexto: 'Mais dúvidas sobre Horário? Acesse →'
  },
  sabores: {
    emoji: '🍦',
    titulo: 'Sabores e Cardápio',
    palavras: [
      '✅ Mais de 35 sabores de sorvete Tipo artesanal.',
      '✅ Servidos em bolas, casquinhas, cascões, cestinhas e copos.',
      '✅ Também temos açaí, picolés, milkshakes e taças especiais.',
      '✅ Alguns sabores variam conforme a produção do dia.',
      '✅ Consulte o cardápio completo no site.'
    ],
    link: 'index.html#cardápio',
    linkTexto: 'Mais dúvidas sobre Sabores? Acesse →'
  },
  encomendas: {
    emoji: '📦',
    titulo: 'Encomendas',
    palavras: [
      '✅ Fazemos encomendas de caixas de 5L e 10L.',
      '✅ Tortas de sorvete com até 3 sabores — a partir de R$ 100.',
      '✅ Carrinhos cortesia para eventos (reserva antecipada).',
      '✅ Pedido mínimo: consulte na página de Encomendas.',
      '✅ Confirme o pedido pelo WhatsApp — produção após pagamento.'
    ],
    link: 'encomendas.html',
    linkTexto: 'Mais dúvidas sobre Encomendas? Acesse →'
  },
  picoles: {
    emoji: '🍭',
    titulo: 'Picolés',
    palavras: [
      '✅ Picolé de Fruta/Água: varejo R$ 2,50 · atacado R$ 1,80/un.',
      '✅ Picolé de Leite sem Recheio: varejo R$ 2,50 · atacado R$ 2,00/un.',
      '✅ Picolé de Leite com Recheio: varejo R$ 3,00 · atacado R$ 2,00/un.',
      '✅ Picolé Leite Ninho: varejo R$ 4,00 · atacado R$ 3,00/un.',
      '✅ Picolé de Ovomaltine: varejo R$ 4,00 · atacado R$ 3,00/un.',
      '✅ Picolé Esquimó: varejo R$ 8,00 · atacado R$ 6,00/un.',
      '✅ Atacado: mínimo 100 unidades — carrinho disponível com reserva.'
    ],
    link: 'encomendas.html#picolés',
    linkTexto: 'Mais dúvidas sobre Picolés? Acesse →'
  },
  localizacao: {
    emoji: '📍',
    titulo: 'Como Chegar',
    palavras: [
      '✅ Estamos em Cajuru/SP.',
      '✅ Atendemos também Santa Cruz da Esperança e Cássia dos Coqueiros.',
      '✅ Veja o endereço completo e o mapa no Google Maps.',
      '✅ Estacionamento disponível próximo à loja.',
      '✅ Atendemos pelo WhatsApp para pedidos e informações.'
    ],
    link: 'https://maps.google.com/?q=Sorveteria+Itapolitana+Cajuru+SP',
    linkTexto: 'Mais dúvidas sobre Localização? Acesse →',
    externo: true
  },
  avaliacoes: {
    emoji: '⭐',
    titulo: 'Dicas e Avaliações',
    palavras: [
      '✅ Nota 4,8 no Google com centenas de avaliações.',
      '✅ Sorvete feito com amor desde 2007.',
      '✅ 100% feito com ingredientes selecionados.',
      '✅ Veja o que nossos clientes dizem na página de Dicas.',
      '✅ Deixe sua avaliação no Google Maps e ajude outros clientes!'
    ],
    link: 'dicas.html',
    linkTexto: 'Mais dúvidas sobre Avaliações? Acesse →'
  },
  precos: {
    emoji: '💰',
    titulo: 'Preços',
    palavras: [
      '✅ Sorvete: casquinha/copão a partir de R$ 8,00 (1 bola).',
      '✅ Açaí: a partir de R$ 15,00 (300ml) — combos até 700ml.',
      '✅ Milkshake: a partir de R$ 17,00 (300ml).',
      '✅ Torta de sorvete: a partir de R$ 100,00.',
      '✅ Veja a tabela completa de preços no cardápio do site.'
    ],
    link: 'index.html#cardápio',
    linkTexto: 'Mais dúvidas sobre Preços? Acesse →'
  }
};

function mostrarResposta(tema) {
  var dados = faleTemas[tema];
  if (!dados) return;

  var html = '<div style="text-align:center;margin-bottom:16px;">';
  html += '<div style="font-size:16px;font-weight:900;color:#1A1A1A;">' + dados.titulo + '</div>';
  html += '</div>';

  html += '<div style="background:#F9F5FF;border-radius:14px;padding:16px;margin-bottom:16px;">';
  dados.palavras.forEach(function(p) {
    html += '<p style="font-size:13px;color:#333;margin:0 0 10px;line-height:1.5;">' + p + '</p>';
  });
  html += '</div>';

  var target = dados.externo ? '_blank" rel="noopener"' : '_self"';
  html += '<a href="' + dados.link + '" target="' + target + ' onclick="fecharFaleDialog()" ';
  html += 'style="display:block;text-align:center;background:linear-gradient(135deg,#7B2D8B,#4A148C);color:#fff;padding:14px 20px;border-radius:30px;font-size:13px;font-weight:900;text-decoration:none;margin-top:8px;">';
  html += dados.linkTexto + '</a>';

  document.getElementById('fale-resposta-conteudo').innerHTML = html;
  document.getElementById('fale-tela-temas').style.display = 'none';
  document.getElementById('fale-tela-resposta').style.display = 'block';
}

function voltarTemas() {
  document.getElementById('fale-tela-resposta').style.display = 'none';
  document.getElementById('fale-tela-temas').style.display = 'block';
}









function getFotos(){try{return JSON.parse(localStorage.getItem('itap_fotos')||'{}');}catch(e){return {};}}
function imgCard(chave,emoji){
  const f=getFotos()[chave];
  if(f) return `<img decoding="async" loading="lazy" class="prod-card-img" src="${f}" alt="${chave} – Sorveteria Itapolitana Cajuru">`;
  return `<div class="prod-card-sem-foto" style="display:flex;align-items:center;justify-content:center;font-size:11px;color:#bbb;text-transform:uppercase;letter-spacing:1px">${emoji||'Sem foto'}</div>`;
}
// ── Accordion do Cardápio ──────────────────────────────────────────
// ── ACCORDION CASCATA PROFISSIONAL ──────────────────────────────
// Técnica: max-height animado — sem display:none, sem pulo de tela
// Clica → abre suavemente | Clica de novo → fecha
// Dedo/mouse fica no mesmo lugar — tela não se move
// ────────────────────────────────────────────────────────────────
const ACC_CTA_LABELS = {
  'acc-sorvetes': { open: 'Ver sabores', close: 'Fechar opções' },
  'acc-picolés': { open: 'Consultar atacado', close: 'Fechar opções' },
  'acc-açaí': { open: 'Montar meu açaí', close: 'Fechar opções' },
  'acc-milk': { open: 'Ver milk-shakes', close: 'Fechar opções' },
  'acc-tacas': { open: 'Ver taças e sobremesas', close: 'Fechar opções' },
  'acc-tacas-p': { open: 'Ver taças premium', close: 'Fechar opções' },
  'acc-iso': { open: 'Consultar caixas', close: 'Fechar opções' },
  'acc-sobremesas': { open: 'Encomendar torta', close: 'Fechar opções' },
  'acc-enc-caixas': { open: 'Consultar caixas', close: 'Fechar opções' },
  'acc-enc-tortas': { open: 'Ver opções', close: 'Fechar opções' },
  'acc-enc-picolés': { open: 'Escolher picolés', close: 'Fechar opções' },
  'acc-complementos': { open: 'Personalizar pedido', close: 'Fechar opções' }
};
const ITAP_WHATSAPP = '5516996062046';
function buildWhatsAppHref(message) {
  var defaultWhatsApp = '5516996062046';
  var number = /^\d{12,15}$/.test(ITAP_WHATSAPP) ? ITAP_WHATSAPP : defaultWhatsApp;
  return `https://wa.me/${number}?text=${encodeURIComponent(message || 'Olá!')}`;
}
function createCtaStack(parent, ctaIdentifier) {
  var old = (parent && ctaIdentifier) ? parent.getElementsByClassName(ctaIdentifier)[0] : null;
  if (old) old.remove();
  var node = document.createElement('div');
  node.className = 'product-cta-stack ' + ctaIdentifier;
  if (parent) parent.appendChild(node);
  return node;
}

function _trackUiEvent(eventName, params) {
  if (typeof gtag !== 'function') return;
  try { gtag('event', eventName, params || {}); } catch (_) {}
}

function atualizarEstadoHeaderAcc(acc, isOpen) {
  if (!acc) return;
  var h = acc.querySelector('.acc-header');
  if (h) h.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  // Atualiza label do indicador neon
  var label = acc.querySelector('.acc-label');
  if (label) label.textContent = isOpen ? 'Fechar opções' : 'Clique para abrir';
  // legado acc-cta-txt
  var cta = acc.querySelector('.acc-cta-txt');
  var labelCfg = ACC_CTA_LABELS[acc.id];
  if (cta && labelCfg) cta.textContent = isOpen ? labelCfg.close : labelCfg.open;
}

function inicializarAcessibilidadeAcc() {
  if (window.__itapAccA11yInitDone) return;
  window.__itapAccA11yInitDone = true;
  var headers = document.querySelectorAll('.acc > .acc-header');
  headers.forEach(function(header) {
    var acc = header.closest('.acc');
    if (!acc) return;
    var body = acc.querySelector('.acc-body');
    if (!body) return;

    if (!body.id) body.id = acc.id + '-body';

    if (header.tagName !== 'BUTTON') {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = header.className;
      btn.innerHTML = header.innerHTML;
      btn.setAttribute('aria-expanded', header.getAttribute('aria-expanded') || 'false');
      btn.setAttribute('aria-controls', body.id);
      header.parentNode.replaceChild(btn, header);
      header = btn;
    } else if (!header.getAttribute('type')) {
      header.setAttribute('type', 'button');
    }

    header.setAttribute('aria-controls', body.id);
    header.removeAttribute('role');
    header.removeAttribute('tabindex');
    header.removeAttribute('onclick');
    header.removeAttribute('onkeydown');

    if (!header.dataset.accBound) {
      header.dataset.accBound = '1';
      header.addEventListener('click', function() { toggleAcc(acc.id); });
    }

    var arrow = header.querySelector('.acc-arrow');
    if (arrow) arrow.setAttribute('aria-hidden', 'true');

    // Não injeta acc-cta-txt quando o indicador neon já está presente no HTML
    var hasIndicator = !!header.querySelector('.acc-indicator');
    if (!hasIndicator) {
      var labelCfg = ACC_CTA_LABELS[acc.id];
      if (labelCfg) {
        var right = header.querySelector('.acc-right');
        if (!right) {
          right = document.createElement('span');
          right.className = 'acc-right';
          if (arrow) {
            arrow.parentNode.insertBefore(right, arrow);
            right.appendChild(arrow);
          } else {
            header.appendChild(right);
          }
        }
        var cta = right.querySelector('.acc-cta-txt');
        if (!cta) {
          cta = document.createElement('span');
          cta.className = 'acc-cta-txt';
          right.insertBefore(cta, right.firstChild);
        }
        cta.textContent = labelCfg.open;
      }
    }
  });
}

function toggleAcc(id) {
  var el = document.getElementById(id);
  if (!el) return;
  inicializarAcessibilidadeAcc();
  var isOpen = el.classList.contains('open');
  // Fecha todos os outros accordions abertos — padrão iFood: trava altura atual → anima até 0
  document.querySelectorAll('.acc.open').forEach(function(acc) {
    if (acc.id !== id) {
      var b = acc.querySelector('.acc-body');
      if (b) {
        b.style.maxHeight = b.scrollHeight + 'px';
        requestAnimationFrame(function() { b.style.maxHeight = '0'; });
      }
      acc.classList.remove('open');
      atualizarEstadoHeaderAcc(acc, false);
      _trackUiEvent('category_close', { category_id: acc.id });
    }
  });
  // Abre ou fecha o clicado
  if (isOpen) {
    el.classList.remove('menu-foco-scroll-livre');
    var body = el.querySelector('.acc-body');
    if (body) {
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(function() { body.style.maxHeight = '0'; });
    }
    el.classList.remove('open');
    atualizarEstadoHeaderAcc(el, false);
    _trackUiEvent('category_close', { category_id: el.id });
    // Libera o layout imediatamente para evitar saltos de scroll.
    if (_menuFocoId === el.id) {
      _menuFocoDesativar(true);
    }
  } else {
    _menuFocoAtivar(el);
    el.classList.add('open');
    atualizarEstadoHeaderAcc(el, true);
    _trackUiEvent('category_open', { category_id: el.id });
    if (id === 'acc-iso') renderIso();
    if (id === 'acc-sobremesas') renderSobremesas();
    var body = el.querySelector('.acc-body');
    if (body) {
      body.style.maxHeight = body.scrollHeight + 'px';
      setTimeout(function() {
        if (el.classList.contains('open')) {
          // Após a transição, elimina a última trava de altura para o gesto nativo.
          body.style.maxHeight = 'none';
          if (_menuFocoId === id) el.classList.add('menu-foco-scroll-livre');
        }
      }, 520);
    }
  }
}

document.addEventListener('keydown', function(event) {
  if (event.key !== 'Escape') return;
  var active = document.activeElement;
  if (!active || !active.classList || !active.classList.contains('acc-header')) return;
  var acc = active.closest('.acc');
  if (!acc || !acc.classList.contains('open')) return;
  event.preventDefault();
  toggleAcc(acc.id);
  active.focus({ preventScroll: true });
});

document.addEventListener('DOMContentLoaded', inicializarAcessibilidadeAcc);
inicializarAcessibilidadeAcc();

// Volta ao topo do cardápio E fecha o accordion atual
function voltarCardapio(accId) {
  var eraFoco = _menuFocoId === accId;
  var posicaoAnterior = _cardapioScrollAnterior[accId] || {
    left: window.scrollX || window.pageXOffset || 0,
    top: window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
  };
  if (accId) {
    var el = document.getElementById(accId);
    if (el) {
      el.classList.remove('open');
      el.classList.remove('menu-foco-ativo');
      el.classList.remove('menu-foco-scroll-livre');
      var h = el.querySelector('.acc-header');
      if (h) h.setAttribute('aria-expanded', 'false');
      var body = el.querySelector('.acc-body');
      if (body) {
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(function() { body.style.maxHeight = '0'; });
      }
    }
  }
  // Libera o layout imediatamente para que a restauração do scroll encontre a altura real da página.
  if (eraFoco) {
    _menuFocoDesativar(false);
  }
  var vcContainer = document.getElementById('vc-container');
  var vcBtn = document.getElementById('vc-btn');
  if (vcContainer) {
    vcContainer.classList.add('aberto');
    vcContainer.style.maxHeight = '9999px';
    vcContainer.style.opacity = '1';
  }
  if (vcBtn) {
    vcBtn.classList.add('aberto');
    vcBtn.setAttribute('aria-expanded', 'true');
  }
  if (accId) delete _cardapioScrollAnterior[accId];
  _restaurarPosicaoCardapio(posicaoAnterior.left, posicaoAnterior.top);
}
/* =====================================================
   SISTEMA UNIFICADO DE MODAL — PADRÃO PROFISSIONAL
   Técnica usada por iFood, Nubank, Apple, Rappi
   • Abre centralizado e estático no aparelho
   • Fundo semitransparente, página visível atrás
   • Fecha ao clicar fora OU no X OU tecla ESC
   • Volta EXATAMENTE onde estava — sem pulo
   • Mesmo botão substitui painel aberto (não empilha)
   • position:fixed no body — padrão da indústria
   ===================================================== */

// ── Variáveis de estado do modal ──────────────────────
let _scrollY    = 0;     // posição salva antes de travar
let _modalAtivo = null;  // id do modal aberto no momento
let _botaoAtivo = null;  // botão que abriu o modal atual

// ── Trava a página sem mover o scroll ─────────────────
// Técnica: body position:fixed + top negativo
// Resultado: página congela exatamente onde está
function _travarPagina() {
  if (document.body.classList.contains('chat-open')) return; // já travada
  _scrollY = window.scrollY;
  document.documentElement.classList.add('chat-open');
  document.body.classList.add('chat-open');
  document.body.style.top        = '-' + _scrollY + 'px';
}

// ── Libera a página e restaura posição exata ──────────
function _liberarPagina() {
  if (!document.body.classList.contains('chat-open')) return; // já livre
  document.documentElement.classList.remove('chat-open');
  document.body.classList.remove('chat-open');
  document.body.style.top       = '';
  window.scrollTo(0, _scrollY); // restaura posição exata — sem animação
}

// ── Fecha o modal pelo id ──────────────────────────────
function fecharModal(id) {
  const el = document.getElementById(id);
  if (!el) return;

  // Remove destaque do botão que abriu
  if (_botaoAtivo) {
    _botaoAtivo.classList.remove('btn-ativo');
    _botaoAtivo = null;
  }

  // Animação de saída
  el.style.animation = 'fadeOutOverlay .15s ease forwards';

  setTimeout(() => {
    el.classList.remove('show');
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('inert', '');
    el.setAttribute('hidden', '');
    el.style.animation = '';

    if (_modalAtivo === id) _modalAtivo = null;

    // Libera a página apenas se nenhum outro modal estiver aberto
    const aindaAberto = document.querySelector(
      '.modal-overlay.show, .promo-overlay.show'
    );
    if (!aindaAberto) _liberarPagina();

  }, 140);
}

// ── Abre o modal pelo id ───────────────────────────────
function abrirModal(id, originEl) {
  // Remove destaque do botão anterior
  if (_botaoAtivo) {
    _botaoAtivo.classList.remove('btn-ativo');
  }

  // Substitui modal anterior (mesma categoria) sem animação
  if (_modalAtivo && _modalAtivo !== id) {
    const anterior = document.getElementById(_modalAtivo);
    if (anterior) {
      anterior.classList.remove('show');
      anterior.style.animation = '';
    }
  }

  // Trava a página apenas na primeira abertura
  if (!_modalAtivo) {
    _travarPagina();
  }

  // Registra estado atual
  _modalAtivo = id;
  _botaoAtivo = originEl || null;
  if (_botaoAtivo) _botaoAtivo.classList.add('btn-ativo');

  // Exibe o modal
  const el = document.getElementById(id);
  if (!el) return;
  el.removeAttribute('hidden');
  el.style.display = '';
  el.removeAttribute('aria-hidden');
  el.removeAttribute('inert');
  el.classList.add('show');

  // Fecha ao clicar no fundo (fora do painel)
  // Remove listener antigo antes de adicionar novo — evita duplicatas
  if (el._fecharFundo) el.removeEventListener('click', el._fecharFundo);
  el._fecharFundo = function (e) {
    if (e.target === el) fecharModal(id);
  };
  el.addEventListener('click', el._fecharFundo);
}

// ── Fecha com tecla ESC ────────────────────────────────
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && _modalAtivo) fecharModal(_modalAtivo);
});
function seloLeitePasteurizado(){
  return '<span class="selo-leite-pasteurizado" role="note">Leite Pasteurizado da Fazenda</span>';
}
function renderSorvetes(){
  const g=document.getElementById('sorvetes-grid');
  if (!g) return;
  g.innerHTML = '';
  const nomes={casquinha_copo:'Casquinha / Copo',casquinha_copão:'Casquinha / Copo',copo_recheado:'Copo Recheado',copão_recheado:'Copo Recheado',cascão:'Cascão',cestinha:'Cestinha Recheada'};
  const desc={casquinha_copo:'1 bola',casquinha_copão:'1 bola',copo_recheado:'1 bola + recheio',copão_recheado:'1 bola + recheio',cascão:'Casquinha grande',cestinha:'Cestinha recheada crocante'};
  if(produtos&&produtos.sorvetes&&produtos.sorvetes.preços){
    Object.entries(produtos.sorvetes.preços).forEach(([key,preços])=>{
      const preço=Object.values(preços)[0];
      const chave='sorvete_'+key+'_'+Object.keys(preços)[0].replace(/\s/g,'_');
      const c=document.createElement('div');c.className='prod-card';
      c.innerHTML=imgCard(chave,'')+`<div class="prod-card-body"><div class="prod-nome">${nomes[key]||key}</div>${seloLeitePasteurizado()}<div class="prod-desc">${desc[key]||''}</div><div class="prod-preço">A partir de R$ ${preço.toFixed(2).replace('.',',')}</div></div>`;
      g.appendChild(c);
    });
  }
  const ctas=createCtaStack(g.parentElement,'home-cta-sorvetes');
  ctas.innerHTML=`
    <a class="enc-link-btn" href="${buildWhatsAppHref('Olá! Gostaria de saber mais sobre sorvetes Tipo artesanais.')}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#25D366,#128C7E)" onclick="_trackUiEvent('whatsapp_cta_click',{page:'home',category:'sorvetes',cta_type:'consultar_whatsapp'})">Falar no WhatsApp</a>`;

  const _vb=document.createElement('div');_vb.style='padding:6px 0 2px';
  _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-sorvetes\')">← Voltar ao Início do Cardápio</button>';
  g.parentElement.appendChild(_vb);
}
function renderMilk(){
  const g=document.getElementById('milk-grid');
  if (!g) return;
  g.innerHTML = '';
  if(produtos&&produtos.milkshake){
    const m=produtos.milkshake;
    const tipos=[];
    if(m.tradicional) Object.entries(m.tradicional).forEach(([tam,preço])=>tipos.push({nome:`Milkshake Tradicional ${tam}`,preço,chave:'milk_trad_'+tam.replace(/\s/g,'_')}));
    if(m.top) Object.entries(m.top).forEach(([tam,preço])=>tipos.push({nome:`Milkshake Top ${tam}`,preço,chave:'milk_top_'+tam.replace(/\s/g,'_')}));
    tipos.forEach(t=>{
      const c=document.createElement('div');c.className='prod-card';
      c.innerHTML=imgCard(t.chave,'')+`<div class="prod-card-body"><div class="prod-nome">${t.nome}</div>${seloLeitePasteurizado()}<div class="prod-preço">R$ ${t.preço.toFixed(2).replace('.',',')}</div></div>`;
      g.appendChild(c);
    });
  }
  const ctas=createCtaStack(g.parentElement,'home-cta-milk');
  ctas.innerHTML=`
    <a class="enc-link-btn product-cta--attention" href="#acc-milk" onclick="_trackUiEvent('category_cta_click',{page:'home',category:'milkshakes',cta_type:'ver_milkshakes'})">Ver milk-shakes</a>
    <a class="enc-link-btn" href="${buildWhatsAppHref('Olá! Gostaria de consultar as opções de milk-shake.')}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#25D366,#128C7E)" onclick="_trackUiEvent('whatsapp_cta_click',{page:'home',category:'milkshakes',cta_type:'consultar_opcoes'})">Consultar opções no WhatsApp</a>`;

  const _vb=document.createElement('div');_vb.style='padding:6px 0 2px';
  _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-milk\')">← Voltar ao Início do Cardápio</button>';
  g.parentElement.appendChild(_vb);
}
function renderTacas(){
  const g=document.getElementById('tacas-grid');
  if (!g) return;
  g.innerHTML = '';
  if(produtos&&produtos.tacas&&produtos.tacas.tradicionais){
    Object.entries(produtos.tacas.tradicionais).forEach(([nome,preço])=>{
      const chave='taca_trad_'+nome.replace(/\s/g,'_');
      const c=document.createElement('div');c.className='prod-card';
      c.innerHTML=imgCard(chave,'')+`<div class="prod-card-body"><div class="prod-nome">Taça ${nome}</div>${seloLeitePasteurizado()}<div class="prod-preço">R$ ${preço.toFixed(2).replace('.',',')}</div></div>`;
      g.appendChild(c);
    });
  }
  const ctas=createCtaStack(g.parentElement,'home-cta-tacas');
  ctas.innerHTML=`
    <a class="enc-link-btn product-cta--attention" href="#acc-tacas" onclick="_trackUiEvent('category_cta_click',{page:'home',category:'tacas',cta_type:'ver_sobremesas'})">Ver taças e sobremesas</a>
    <a class="enc-link-btn" href="${buildWhatsAppHref('Olá! Gostaria de consultar opções de taças e sobremesas.')}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#25D366,#128C7E)" onclick="_trackUiEvent('whatsapp_cta_click',{page:'home',category:'tacas',cta_type:'falar_whatsapp'})">Falar no WhatsApp</a>`;

  const _vb=document.createElement('div');_vb.style='padding:6px 0 2px';
  _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-tacas\')">← Voltar ao Início do Cardápio</button>';
  g.parentElement.appendChild(_vb);
}
function renderTacasP(){
  const g=document.getElementById('tacas-p-grid');
  if (!g) return;
  g.innerHTML = '';
  if(produtos&&produtos.tacas&&produtos.tacas.sujas){
    Object.entries(produtos.tacas.sujas).forEach(([nome,preço])=>{
      const chave='taca_suja_'+nome.replace(/\s/g,'_');
      const c=document.createElement('div');c.className='prod-card';
      c.innerHTML=imgCard(chave,'')+`<div class="prod-card-body"><div class="prod-nome">Taça Suja – ${nome}</div>${seloLeitePasteurizado()}<div class="prod-preço">R$ ${preço.toFixed(2).replace('.',',')}</div></div>`;
      g.appendChild(c);
    });
  }
  const ctas=createCtaStack(g.parentElement,'home-cta-tacas-p');
  ctas.innerHTML=`
    <a class="enc-link-btn product-cta--attention" href="#acc-tacas-p" onclick="_trackUiEvent('category_cta_click',{page:'home',category:'tacas_premium',cta_type:'ver_sobremesas'})">Ver taças premium</a>
    <a class="enc-link-btn" href="${buildWhatsAppHref('Olá! Gostaria de consultar as taças premium disponíveis.')}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#25D366,#128C7E)" onclick="_trackUiEvent('whatsapp_cta_click',{page:'home',category:'tacas_premium',cta_type:'falar_whatsapp'})">Falar no WhatsApp</a>`;

  const _vb=document.createElement('div');_vb.style='padding:6px 0 2px';
  _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-tacas-p\')">← Voltar ao Início do Cardápio</button>';
  g.parentElement.appendChild(_vb);
}
function renderAçaí(){
  const b=document.getElementById('açaí-body');if(!b)return;b.innerHTML='';

  // Fonte de dados: nova estrutura categorias
  const _ac=produtos&&(produtos.açaí||produtos.acai)||{};
  const categorias=_ac.categorias||[];

  function waLink(nome,tamanho,preco){
    const msg=`Olá! Quero pedir: ${nome}, tamanho ${tamanho}, por R$ ${Number(preco).toFixed(2).replace('.',',')}.`;
    return buildWhatsAppHref(msg);
  }

  if(!categorias.length){
    b.innerHTML='<p style="color:#7B2D8B;font-weight:700;padding:12px">Cardápio em atualização. Em breve!</p>';
    return;
  }

  const wrap=document.createElement('div');wrap.className='natureon-wrap';

  // Cabeçalho premium
  const hdr=document.createElement('div');hdr.className='natureon-header';
  hdr.innerHTML=`
    <div class="natureon-title">🍇 Cardápio Natureon Açaí</div>
    <p class="natureon-sub">Monte sua combinação favorita com muito sabor, cremosidade e ingredientes especiais.</p>`;
  wrap.appendChild(hdr);


  // Renderizar categorias
  categorias.forEach(cat=>{
    const catDiv=document.createElement('div');catDiv.className='natureon-categoria';

    // Cabeçalho da categoria
    const catHdr=document.createElement('div');catHdr.className='natureon-cat-header';
    catHdr.setAttribute('role','heading');catHdr.setAttribute('aria-level','3');
    const emojiSpan=cat.emoji?`<span class="natureon-cat-emoji" aria-hidden="true">${cat.emoji}</span>`:'';
    catHdr.innerHTML=`${emojiSpan}<span class="natureon-cat-titulo">${cat.titulo}</span>`;
    catDiv.appendChild(catHdr);

    // Informações especiais
    if(cat.id==='informacoes'){
      const infoCard=document.createElement('div');infoCard.className='natureon-info-card';
      infoCard.setAttribute('aria-label','Informações da loja');
      cat.produtos.forEach(p=>{
        const item=document.createElement('div');item.className='natureon-info-item';item.textContent=p.nome;
        infoCard.appendChild(item);
      });
      catDiv.appendChild(infoCard);
      wrap.appendChild(catDiv);
      return;
    }

    // Grid de produtos
    const grid=document.createElement('div');grid.className='natureon-grid';

    // Extrair tamanho para mensagem WA — usa label da categoria
    const tamLabel=cat.label||cat.titulo;

    cat.produtos.forEach(p=>{
      if(p.preco===null||p.preco===undefined){return;}
      const card=document.createElement('div');card.className='natureon-card';
      card.setAttribute('role','article');

      const precoStr=`R$ ${Number(p.preco).toFixed(2).replace('.',',')}`;
      const precoInt=Number(p.preco)===Math.floor(p.preco)?`R$ ${Number(p.preco)},00`:precoStr;

      // Separar nome e ingredientes para leitura
      const partes=p.nome.split('+');
      const nomeProd=partes[0].trim();
      const ingredParts=partes.slice(1).map(s=>s.trim());
      const ingredText=ingredParts.length?ingredParts.join(' · '):'';

      const wh=p.preco?`<a class="natureon-card-btn" href="${waLink(p.nome,tamLabel,p.preco)}" target="_blank" rel="noopener" aria-label="Pedir ${p.nome} pelo WhatsApp"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Pedir pelo WhatsApp</a>`:'';

      card.innerHTML=`
        <div class="natureon-card-size" aria-hidden="true">${tamLabel}</div>
        <div class="natureon-card-nome">${escHTML(p.nome)}</div>
        ${ingredText?`<div class="natureon-card-ingredientes" aria-label="Ingredientes: ${escHTML(ingredText)}">${escHTML(ingredText)}</div>`:''}
        <div class="natureon-card-preco" aria-label="Preço: ${precoInt}">${precoInt}</div>
        ${wh}`;
      grid.appendChild(card);
    });

    catDiv.appendChild(grid);
    wrap.appendChild(catDiv);
  });

  // Botão voltar
  const ctas=createCtaStack(wrap,'home-cta-acai');
  ctas.innerHTML=`
    <a class="enc-link-btn product-cta--attention" href="#acc-açaí" onclick="_trackUiEvent('category_cta_click',{page:'home',category:'acai',cta_type:'montar_acai'})">Montar meu açaí</a>
    <a class="enc-link-btn" href="${buildWhatsAppHref('Olá! Gostaria de montar meu açaí com as opções disponíveis.')}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#25D366,#128C7E)" onclick="_trackUiEvent('whatsapp_cta_click',{page:'home',category:'acai',cta_type:'ver_opcoes'})">Ver opções no WhatsApp</a>`;

  const _vb=document.createElement('div');_vb.style='padding:10px 0 4px';
  _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-açaí\')">← Voltar ao Início do Cardápio</button>';
  wrap.appendChild(_vb);

  b.appendChild(wrap);
}
// Escapa HTML para evitar XSS nos nomes de produtos
function escHTML(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

const iconesPicolé={frutas_agua:'',leite_sem_recheio:'',leite_com_recheio:'',leite_ninho:'',ovomaltine:'',esquimós:''};
function renderPicolés(){
  const b=document.getElementById('picolés-body');b.innerHTML='';

  // Descrições detalhadas por tipo
  const descricoes={
    frutas_agua:{
      icon:'',
      titulo:'Picolé de Frutas',
      desc:'Feito com frutas naturais, sem leite. Refrescante e leve — ideal para os dias quentes!',
      badge:'Sem Lactose',
      badgeColor:'#2e7d32'
    },
    leite_sem_recheio:{
      icon:'',
      titulo:'Picolé de Leite',
      desc:'Cremoso, feito com leite. Sabor suave e irresistível para toda a família.',
      badge:'Cremoso',
      badgeColor:'#1565c0'
    },
    leite_com_recheio:{
      icon:'',
      titulo:'Picolé Recheado',
      desc:'Picolé de leite com recheio surpresa por dentro. Cada mordida é uma descoberta!',
      badge:'Com Recheio',
      badgeColor:'#6a1b9a'
    },
    leite_ninho:{
      icon:'',
      titulo:'Picolé Leite Ninho',
      desc:'O sabor inconfundível do Leite Ninho em forma de picolé. Sucesso garantido!',
      badge:'Especial',
      badgeColor:'#e65100'
    },
    ovomaltine:{
      icon:'',
      titulo:'Picolé de Ovomaltine',
      desc:'O clássico sabor de Ovomaltine em um picolé cremoso e irresistível!',
      badge:'Especial',
      badgeColor:'#e65100'
    },
    'esquimós':{
      icon:'',
      titulo:'Picolé Esquimó',
      desc:'Picolé premium coberto com chocolate belga. Sabores nobres para momentos especiais.',
      badge:'Premium',
      badgeColor:'#b71c1c'
    }
  };

  if(produtos&&produtos.picolés){
    const grid=document.createElement('div');
    grid.style='display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:14px';

    Object.entries(produtos.picolés).forEach(([key,p])=>{
      const info=descricoes[key]||{icon:'',titulo:p.nome,desc:'Delicioso picolé Tipo artesanal.',badge:'',badgeColor:'#555'};
      const temSabores=p.sabores&&p.sabores.length>0;
      const qtdSabores=temSabores?p.sabores.length:0;

      const d=document.createElement('div');
      d.className='picolé-item';
      d.style='margin-bottom:0;cursor:default;text-align:center;padding:14px 10px;border-radius:14px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.10);display:flex;flex-direction:column;align-items:center;gap:4px';
      d.innerHTML=`
        <div style="font-size:13px;font-weight:900;color:#4A148C;line-height:1.2;margin-bottom:2px">${info.titulo}</div>
        ${info.badge?`<span style="background:${info.badgeColor};color:#fff;font-size:10px;font-weight:800;border-radius:20px;padding:2px 10px;margin-bottom:2px">${info.badge}</span>`:''}
        ${key === 'frutas_agua' ? '' : seloLeitePasteurizado()}
        <div style="font-size:11px;color:#555;line-height:1.4;margin-bottom:6px;min-height:32px">${info.desc}</div>
        <div style="font-size:15px;font-weight:900;color:#E91E63;margin-bottom:2px">
          R$ ${p.preço_varejo.toFixed(2).replace('.',',')} <span style="font-size:10px;font-weight:500;color:#888">/ un.</span>
        </div>
        <button type="button" class="btn-sabores" style="font-size:11px;padding:8px 12px;width:100%;margin-top:4px" onclick="event.stopPropagation();abrirPicoléInline('${key}','${info.titulo}',this)">
          ${temSabores?qtdSabores+' Sabores':'Ver Sabores'}
        </button>
      `;
      grid.appendChild(d);
    });
    b.appendChild(grid);

    // CTA de atacado e eventos
    const nota=document.createElement('div');
    nota.style='background:linear-gradient(135deg,#1A237E,#283593);color:#fff;border-radius:12px;padding:12px 16px;text-align:center;margin-bottom:10px;font-size:12px';
    nota.innerHTML='<strong>Atacado e Eventos:</strong> Consulte condições e orçamento no WhatsApp.';
    b.appendChild(nota);
    const ctas=createCtaStack(b,'home-cta-picoles');
    ctas.innerHTML=`
      <a class="enc-link-btn product-cta--attention" href="${buildWhatsAppHref('Olá! Gostaria de consultar picolés no atacado para um evento.')}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#25D366,#128C7E)" onclick="_trackUiEvent('wholesale_cta_click',{page:'home',category:'picoles',cta_type:'consultar_atacado'})">Consultar atacado</a>
      <a class="enc-link-btn" href="${buildWhatsAppHref('Olá! Gostaria de solicitar orçamento para picolés em evento.')}" target="_blank" rel="noopener" onclick="_trackUiEvent('event_quote_cta_click',{page:'home',category:'picoles',cta_type:'solicitar_orcamento'})">Solicitar orçamento</a>`;
    
    const _vb=document.createElement('div');_vb.style='padding:10px 0 4px';
    _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-picolés\')">← Voltar ao Início do Cardápio</button>';
    b.appendChild(_vb);
  }
}

function renderIso(){
  const b=document.getElementById('iso-body');if(!b)return;b.innerHTML='';
  if(produtos&&produtos.isopores_viagem){
    const grid=document.createElement('div');grid.className='prod-grid';
    Object.entries(produtos.isopores_viagem).forEach(([tam,preço])=>{
      const chave='isopore_'+tam.replace(/\s/g,'_');
      const d=document.createElement('div');d.className='prod-card';
      d.innerHTML=imgCard(chave,'')+`<div class="prod-card-body"><div class="prod-nome">Isopore ${tam}</div>${seloLeitePasteurizado()}<div class="prod-desc">Leve sorvete para casa</div><div class="prod-preço">R$ ${preço.toFixed(2).replace('.',',')}</div></div>`;
      grid.appendChild(d);
    });
    b.appendChild(grid);
    const btn=document.createElement('div');btn.style='margin-top:12px';
    btn.innerHTML=`<div class="btn-row-grid"><button type="button" class="btn-sabores" onclick="abrirSaboresInline('sorvetes','Sabores para Isopore',this)">Ver os 35 Sabores</button></div>`;
    b.appendChild(btn);
    const ctas=createCtaStack(b,'home-cta-iso');
    ctas.innerHTML=`
      <a class="enc-link-btn product-cta--attention" href="${buildWhatsAppHref('Olá! Gostaria de consultar as opções de sorvete em caixa para minha festa.')}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#25D366,#128C7E)" onclick="_trackUiEvent('order_cta_click',{page:'home',category:'isopores',cta_type:'consultar_caixas'})">Consultar caixas</a>
      <a class="enc-link-btn" href="encomendas.html" onclick="_trackUiEvent('order_cta_click',{page:'home',category:'isopores',cta_type:'encomendar_festa'})">Encomendar para festa</a>`;
  }

  const _vb=document.createElement('div');_vb.style='padding:6px 0 2px';
  _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-iso\')">← Voltar ao Início do Cardápio</button>';
  b.appendChild(_vb);
}
function renderSobremesas(){
  const b=document.getElementById('sobremesas-body');if(!b)return;b.innerHTML='';
  if(produtos&&produtos.sobremesas){
    const grid=document.createElement('div');grid.className='prod-grid';
    Object.entries(produtos.sobremesas).forEach(([nome,preço])=>{
      const chave='sobremesa_'+nome.replace(/\s/g,'_');
      const nomeLow=nome.toLowerCase();
      const emoji='';
      const emojiNome='';
      const d=document.createElement('div');d.className='prod-card';
      d.innerHTML=imgCard(chave,'')+`<div class="prod-card-body"><div class="prod-nome">${nome}</div>${seloLeitePasteurizado()}<div class="prod-preço">R$ ${preço.toFixed(2).replace('.',',')}</div></div>`;
      grid.appendChild(d);
    });
    b.appendChild(grid);
    const btn=document.createElement('div');btn.style='margin-top:12px';
    btn.innerHTML=`<div class="btn-row-grid"><button type="button" class="btn-sabores" onclick="abrirSaboresInline('sorvetes','Sabores para Sobremesas',this)">Ver os 35 Sabores</button></div>`;
    b.appendChild(btn);
    const ctas=createCtaStack(b,'home-cta-sobremesas');
    ctas.innerHTML=`
      <a class="enc-link-btn product-cta--attention" href="encomendas.html#tortas" onclick="_trackUiEvent('order_cta_click',{page:'home',category:'sobremesas',cta_type:'encomendar_torta'})">Encomendar torta</a>
      <a class="enc-link-btn" href="${buildWhatsAppHref('Olá! Gostaria de consultar uma torta de sorvete para minha festa.')}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#25D366,#128C7E)" onclick="_trackUiEvent('whatsapp_cta_click',{page:'home',category:'sobremesas',cta_type:'consultar_disponibilidade'})">Consultar disponibilidade</a>`;
  }

  const _vb=document.createElement('div');_vb.style='padding:6px 0 2px';
  _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-sobremesas\')">← Voltar ao Início do Cardápio</button>';
  b.appendChild(_vb);
}

const SABORES_35_OFICIAL = ["Abacaxi ao Vinho", "Abacaxi Suíço", "Algodão Doce (Blue Ice)", "Amarena", "Ameixa", "Banana com Nutella", "Bis e Trufa", "Cereja Trufada", "Chocolate", "Chocolate com Café", "Coco Queimado", "Creme Paris", "Croquer", "Doce de Leite", "Ferrero Rocher", "Flocos", "Kinder Ovo", "Leite Condensado", "Leite Ninho", "Leite Ninho Folheado", "Leite Ninho com Oreo", "Limão", "Limão Suíço", "Menta com Chocolate", "Milho Verde", "Morango Trufado", "Mousse de Maracujá", "Mousse de Uva", "Nozes", "Nutella", "Ovomaltine", "Pistache", "Prestígio", "Sensação", "Torta de Chocolate"];

function getSaboresDisponíveis() {
  return (typeof SABORES_35_OFICIAL !== "undefined" && SABORES_35_OFICIAL.length > 0) ? SABORES_35_OFICIAL : [
    "Abacaxi ao Vinho", "Abacaxi Suíço", "Algodão Doce (Blue Ice)", "Amarena", "Ameixa",
    "Banana com Nutella", "Bis e Trufa", "Cereja Trufada", "Chocolate", "Chocolate com Café",
    "Coco Queimado", "Creme Paris", "Croquer", "Doce de Leite", "Ferrero Rocher", "Flocos",
    "Kinder Ovo", "Leite Condensado", "Leite Ninho", "Leite Ninho Folheado", "Leite Ninho com Oreo",
    "Limão", "Limão Suíço", "Menta com Chocolate", "Milho Verde", "Morango Trufado",
    "Mousse de Maracujá", "Mousse de Uva", "Nozes", "Nutella", "Ovomaltine", "Pistache",
    "Prestígio", "Sensação", "Torta de Chocolate"
  ];
}
function abrirSabores(tipo,título,el){
  // Convertido para inline — sem modal, sem scroll
  var accBody = _getAccBody(el, null);
  if (!accBody) { accBody = el ? el.closest ? el.closest('.acc-body') : null : null; }
  var sabores = getSaboresDisponíveis();
  if (accBody) {
    mostrarSaboresInline(accBody, título, 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
  }
}

// ── Milkshakes ───────────────────────────────────────────────
function abrirMilkshakeSabores(el) {
  const sabores = getSaboresDisponíveis();
  const total = sabores.length || 36;
  document.getElementById('ms-título').textContent=`Milkshakes – ${total} Sabores`;
  const chips=document.getElementById('ms-chips');chips.innerHTML='';
  
  // Sincronizado: Usa os mesmos sabores das caixas de sorvete
  if(sabores.length > 0) {
    sabores.forEach(s=>{const sp=document.createElement('span');sp.className='chip-sabor';sp.textContent=s;chips.appendChild(sp);});
  } else {
    // Fallback caso a lista esteja vazia
    const fallback=['Chocolate','Morango','Creme','Flocos','Leite Ninho','Ovomaltine','Nutella','Sensação','Prestígio','Milho Verde','Coco','Abacaxi'];
    fallback.forEach(s=>{const sp=document.createElement('span');sp.className='chip-sabor';sp.textContent=s;chips.appendChild(sp);});
  }
  
  document.getElementById('ms-sub').textContent = 'Informe o sabor desejado ao fazer seu pedido na loja';
  abrirModal('modal-sabores', el);
}

// ── Taças Tradicionais ──────────────────────────────────────────
function abrirTacasTradicionais(el) {
  document.getElementById('ms-título').textContent='Taças – 8 Opções';
  const chips=document.getElementById('ms-chips');chips.innerHTML='';
  const t=produtos&&produtos.tacas&&produtos.tacas.tradicionais?produtos.tacas.tradicionais:{};
  Object.entries(t).forEach(([nome,p])=>{
    const sp=document.createElement('span');sp.className='chip-sabor';
    sp.textContent=`${nome} – R$ ${p.toFixed(2).replace('.',',')}`;chips.appendChild(sp);
  });
  document.getElementById('ms-sub').textContent = 'Informe a taça desejada ao fazer seu pedido na loja';
  abrirModal('modal-sabores', el);
}

// ── Taças Premium (Sujas) ────────────────────────────────────
function abrirTacasSujas(el) {
  document.getElementById('ms-título').textContent='Taças Premium (Sujas) – 7 Opções';
  const chips=document.getElementById('ms-chips');chips.innerHTML='';
  const t=produtos&&produtos.tacas&&produtos.tacas.sujas?produtos.tacas.sujas:{};
  Object.entries(t).forEach(([nome,p])=>{
    const sp=document.createElement('span');sp.className='chip-sabor';
    sp.textContent=`${nome} – R$ ${p.toFixed(2).replace('.',',')}`;chips.appendChild(sp);
  });
  document.getElementById('ms-sub').textContent = 'Informe a taça desejada ao fazer seu pedido na loja';
  abrirModal('modal-sabores', el);
}

// ── Picolés ──────────────────────────────────────────────────────
function abrirPicolé(key, nome, el) {
  _produtoAtualKey=key;
  _produtoAtualNome=nome;
  _produtoAtualTipo='picolé';
  _produtoAtualEl=el;
  // Montar lista de picolés para navegação
  if(produtos&&produtos.picolés){
    _produtoLista=Object.entries(produtos.picolés).map(([k,v])=>({key:k,nome:v.nome||k}));
    _produtoIndiceAtual=_produtoLista.findIndex(p=>p.key===key);
  }
  document.getElementById('mp-título').textContent=`Sabores – ${nome}`;
  document.getElementById('mp-sub').textContent='Sabores disponíveis para este tipo de picolé';
  const chips=document.getElementById('mp-chips');chips.innerHTML='';
  const sabs=produtos&&produtos.picolés&&produtos.picolés[key]?produtos.picolés[key].sabores:[];
  sabs.forEach(s=>{const sp=document.createElement('span');sp.className='chip-sabor';sp.textContent=s;chips.appendChild(sp);});
  abrirModal('modal-picolé', el);
}

// ── Complementos do Açaí ────────────────────────────────────────
const labelComp={frutas:'Frutas',cremes:'Cremes',guloseimas:'Guloseimas',chocolates:'Chocolates'};
function abrirComplementos(el){
  const lista=document.getElementById('comp-lista');lista.innerHTML='';
  if(produtos&&produtos.açaí&&produtos.açaí.complementos){
    Object.entries(produtos.açaí.complementos).forEach(([k,info])=>{
      const g=document.createElement('div');g.className='comp-group';
      const getNome=i=>typeof i==='object'&&i!==null?i.nome:i;
      const isEsg=i=>typeof i==='object'&&i!==null&&(i.esgotado||i.estoque<=0);
      g.innerHTML=`<div class="comp-group-h">${labelComp[k]||k}<span class="comp-preço">+ R$ ${info.preço.toFixed(2).replace('.',',')} cada</span></div><div class="chips">${info.itens.map(i=>`<span class="chip-comp" style="${isEsg(i)?'opacity:.45;text-decoration:line-through;':''}">  ${getNome(i)}${isEsg(i)?' ✕':''}</span>`).join('')}</div>`;
      lista.appendChild(g);
    });
  }
  abrirModal('modal-comp', el);
}

// ── Navegação entre produtos (Anterior / Próximo) ────────────────
// Variáveis de estado da navegação
let _produtoAtualKey=null;
let _produtoAtualNome=null;
let _produtoAtualTipo=null;
let _produtoAtualEl=null;
let _produtoLista=[];
let _produtoIndiceAtual=0;

function navProdutoAnterior(){
  if(_produtoLista.length===0)return;
  _produtoIndiceAtual=(_produtoIndiceAtual-1+_produtoLista.length)%_produtoLista.length;
  const p=_produtoLista[_produtoIndiceAtual];
  if(_produtoAtualTipo==='picolé'){abrirPicoléInline(p.key,p.nome,_produtoAtualEl);}
  else if(_produtoAtualTipo==='sorvete'){abrirSaboresInline('sorvete',p.nome,_produtoAtualEl);}
  else if(_produtoAtualTipo==='taça'){abrirSaboresInline('taça',p.nome,_produtoAtualEl);}
  else if(_produtoAtualTipo==='milkshake'){abrirMilkshakeSaboresInline(_produtoAtualEl);}
  else if(_produtoAtualTipo==='isopor'){abrirSaboresInline('isopor',p.nome,_produtoAtualEl);}
  else if(_produtoAtualTipo==='sobremesa'){abrirSaboresInline('sobremesa',p.nome,_produtoAtualEl);}
}

function navProdutoProximo(){
  if(_produtoLista.length===0)return;
  _produtoIndiceAtual=(_produtoIndiceAtual+1)%_produtoLista.length;
  const p=_produtoLista[_produtoIndiceAtual];
  if(_produtoAtualTipo==='picolé'){abrirPicoléInline(p.key,p.nome,_produtoAtualEl);}
  else if(_produtoAtualTipo==='sorvete'){abrirSaboresInline('sorvete',p.nome,_produtoAtualEl);}
  else if(_produtoAtualTipo==='taça'){abrirSaboresInline('taça',p.nome,_produtoAtualEl);}
  else if(_produtoAtualTipo==='milkshake'){abrirMilkshakeSaboresInline(_produtoAtualEl);}
  else if(_produtoAtualTipo==='isopor'){abrirSaboresInline('isopor',p.nome,_produtoAtualEl);}
  else if(_produtoAtualTipo==='sobremesa'){abrirSaboresInline('sobremesa',p.nome,_produtoAtualEl);}
}

let promoInt=null;
const DEFAULT_PROMO_URL = 'promocao.html';
// 22h é o horário padrão de encerramento da loja; usamos como fallback quando só a data é informada.
const DEFAULT_PROMO_END_TIME = '22:00:00';
function _valorPromo(dado, chaves) {
  if (!dado || typeof dado !== 'object' || !Array.isArray(chaves)) return '';
  for (const c of chaves) {
    const v = dado[c];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}
function _resolverDataFimPromo(d) {
  const horaRaw = _valorPromo(d, ['horaFim']);
  const horaMatch = horaRaw.match(/^(?<hh>[01]\d|2[0-3]):(?<mm>[0-5]\d)(?::(?<ss>[0-5]\d))?$/);
  const horaValida = horaMatch && horaMatch.groups ? (horaMatch.groups.hh + ':' + horaMatch.groups.mm) : '';
  const segundos = horaMatch && horaMatch.groups && horaMatch.groups.ss ? horaMatch.groups.ss : '00';
  const dataRaw = _valorPromo(d, ['dataFim']);
  if (dataRaw && horaValida) {
    const dt = new Date(dataRaw + 'T' + horaValida + ':' + segundos);
    if (!isNaN(dt.getTime())) return dt;
  }
  if (dataRaw && !horaValida) {
    const dt = new Date(dataRaw + 'T' + DEFAULT_PROMO_END_TIME);
    if (!isNaN(dt.getTime())) return dt;
  }
  if (horaValida) {
    const agora = new Date();
    const [h, m] = horaValida.split(':').map(Number);
    const fallback = new Date(agora);
    fallback.setHours(h, m, 0, 0);
    if (fallback <= agora) fallback.setDate(fallback.getDate() + 1);
    return fallback;
  }
  return null;
}
async function carregarBarraPromo(){
  // Exibição da barra de promoção desabilitada para evitar sobreposição no topo.
  return;
}
function fecharBarraPromo(){
  sessionStorage.setItem('promo_bar_fechada','1');
  const bar=document.getElementById('promo-top-bar');
  if(bar){bar.classList.remove('show');}
}
let _dadosPromoCache=null;
async function _buscarDadosPromo(){
  if(_dadosPromoCache)return _dadosPromoCache;
  // Verifica sessionStorage primeiro (evita fetch a cada navegação)
  try{
    const sess=sessionStorage.getItem('itap_promo_sess');
    if(sess){_dadosPromoCache=JSON.parse(sess);return _dadosPromoCache;}
  }catch(e){}
  // Fetch com timeout de 3s
  try{
    const ctrl=new AbortController();
    const tid=setTimeout(()=>ctrl.abort(),3000);
    const resp=await fetch('/dados/promo.json?t=' + Date.now(),{signal:ctrl.signal,cache:'no-store'});
    clearTimeout(tid);
    if(resp.ok){
      _dadosPromoCache=await resp.json();
      try{sessionStorage.setItem('itap_promo_sess',JSON.stringify(_dadosPromoCache));}catch(e){}
      localStorage.setItem('itap_promo_cache',JSON.stringify(_dadosPromoCache));
      return _dadosPromoCache;
    }
  }catch(e){}
  // Fallback: localStorage
  try{return JSON.parse(localStorage.getItem('itap_promo_cache')||'{}');}catch(e){return {};}
}
async function carregarPromo(){
  const d=await _buscarDadosPromo();
  const titulo = _valorPromo(d, ['título', 'titulo', 'headerTitulo']);
  const descricao = _valorPromo(d, ['descrição', 'descricao', 'bannerFrase']);
  const imagem = _valorPromo(d, ['imagem', 'fotoUrl', 'bannerImg']);
  if(titulo){document.getElementById('promo-title').textContent=titulo;}
  if(descricao){document.getElementById('promo-desc').textContent=descricao;}
  if(imagem){
    const img=document.getElementById('promo-img');
    img.src=imagem;img.style.display='block';
    document.getElementById('promo-icon').style.display='none';
  }
  if(d.btnTexto){
    const btn=document.getElementById('promo-btn');
    btn.textContent=d.btnTexto;
  }
}
async function abrirLinkPromo(){
  const d=await _buscarDadosPromo();
  const url=String(d.link||DEFAULT_PROMO_URL).trim();
  fecharModal('promo-overlay');
  let externa = false;
  let destino = null;
  try {
    destino = new URL(url, window.location.origin);
    if (destino.protocol !== 'http:' && destino.protocol !== 'https:') {
      window.location.href = DEFAULT_PROMO_URL;
      return;
    }
    externa = destino.hostname !== window.location.hostname;
  } catch(_) {
    // URL inválida: trata como rota interna e segue fallback de navegação padrão.
  }
  if (externa) {
    window.open(destino.href,'_blank','noopener');
    return;
  }
  if (destino) {
    window.location.href = destino.pathname + destino.search + destino.hash;
    return;
  }
  window.location.href = url || DEFAULT_PROMO_URL;
}
async function abrirPromo(){await carregarPromo();abrirModal('promo-overlay');iniciarTimer();}
async function iniciarTimer(){
  let fim = null;
  try{
    const d=await _buscarDadosPromo();
    fim = _resolverDataFimPromo(d);
  }catch(e){}
  if(promoInt)clearInterval(promoInt);
  if(!fim||isNaN(fim.getTime())){
    document.getElementById('promo-timer').textContent='--:--:--:--';
    return;
  }
  const atualizarTimer = () => {
    const diff=fim-new Date();
    if(diff<=0){
      clearInterval(promoInt);
      document.getElementById('promo-timer').textContent='00:00:00:00';
      return;
    }
    const dias=String(Math.floor(diff/86400000)).padStart(2,'0');
    const h=String(Math.floor((diff%86400000)/3600000)).padStart(2,'0');
    const m=String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
    const s=String(Math.floor((diff%60000)/1000)).padStart(2,'0');
    document.getElementById('promo-timer').textContent=`${dias}:${h}:${m}:${s}`;
  };
  atualizarTimer();
  promoInt=setInterval(atualizarTimer,1000);
}
const RESPOSTAS={
  // ── HORÁRIO ──
  'horário':'Funcionamos todos os dias, das 10h às 22h, inclusive feriados.',
  'funciona':'Funcionamos todos os dias, das 10h às 22h, inclusive feriados.',
  'abre':'Abrimos todos os dias às 10h e fechamos às 22h. Te esperamos!',
  'fecha':'Fechamos às 22h todos os dias. Venha antes! ',
  'aberto':'Funcionamos todos os dias, das 10h às 22h, inclusive feriados.',
  'domingo':'Sim! Abrimos também aos domingos, das 10h às 22h.',
  'feriado':'Sim! Funcionamos em feriados, das 10h às 22h.',
  // ── ENDEREÇO E LOCALIZAÇÃO ──
  'endereço':'Estamos na R. Cel. Manoel Caetano, 311 – Pça Largo São Bento – Centro, Cajuru/SP. Fácil de encontrar!',
  'localização':'R. Cel. Manoel Caetano, 311 – Pça Largo São Bento – Centro, Cajuru/SP. Clique em "Ver no Mapa" no site!',
  'onde':'Estamos no centro de Cajuru/SP, na Praça Largo São Bento. R. Cel. Manoel Caetano, 311.',
  'mapa':'Acesse o Google Maps pelo botão no site ou busque "Sorveteria Itapolitana Cajuru".',
  'cajuru':'Estamos em Cajuru/SP desde 2007! Atendemos também Santa Cruz da Esperança e Cássia dos Coqueiros.',
  'santa cruz':'Sim! Atendemos clientes de Santa Cruz da Esperança. Venha nos visitar em Cajuru!',
  'cássia':'Sim! Atendemos clientes de Cássia dos Coqueiros. Estamos em Cajuru/SP.',
  // ── CONTATO ──
  'telefone':'WhatsApp: (16) 99606-2046. Chame para encomendas, dúvidas ou eventos!',
  'whatsapp':'WhatsApp: (16) 99606-2046. Respondemos rapidinho! ',
  'contato':'Fale conosco pelo WhatsApp: (16) 99606-2046. Ou use o formulário "Fale Conosco" no site!',
  'instagram':'Nos siga no Instagram para ver novidades, sabores e promoções! Busque @sorveteriaitapolitanacajuru.',
  // ── CARDÁPIO E SABORES ──
  'sabor':'Temos 35 sabores Tipo artesanal! Destaques: Chocolate, Nutella, Leite Ninho, Morango Trufado, Ferrero Rocher, Pistache, Kinder Ovo, Ovomaltine e muito mais. Veja o cardápio completo no site!',
  'sabores':'Temos 35 sabores Tipo artesanal! Destaques: Chocolate, Nutella, Leite Ninho, Morango Trufado, Ferrero Rocher, Pistache, Kinder Ovo, Ovomaltine e muito mais. Veja o cardápio completo no site!',
  'cardápio':'Abra a área de Encomendas/Cardápio para ver categorias, produtos e próximos passos do pedido.',
  'nutella':'Sim! Temos sorvete de Nutella, Banana com Nutella, Sundae com Nutella e muito mais! Delicioso! ',
  'chocolate':'Temos Chocolate, Chocolate com Café, Bis e Trufa, Menta com Chocolate, Prestígio e Torta de Chocolate! ',
  'leite ninho':'Temos Leite Ninho, Leite Ninho Folheado e Leite Ninho com Oreo! Os favoritos das crianças! ',
  'morango':'Temos Morango Trufado no sorvete e Morango Split nas taças! Também no açaí como complemento. ',
  'pistache':'Sim! Temos sorvete de Pistache — um dos sabores mais pedidos! ',
  'diet':'Sim! Temos sorvete Diet (1 bola por R$ 10). Ideal para quem cuida da saúde! ',
  'vegano':'Para informações sobre opções veganas, entre em contato pelo WhatsApp: (16) 99606-2046.',
  'lactose':'Para informações sobre opções sem lactose, fale conosco pelo WhatsApp: (16) 99606-2046.',
  // ── PREÇOS ──
  'preço':function(){try{return 'Sorvetes: casquinha/copo a partir de R$ '+Object.values(produtos.sorvetes.preços.casquinha_copão)[0].toFixed(2).replace('.',',')+'  · Milkshakes a partir de R$ '+Object.values(produtos.milkshake.tradicional)[0].toFixed(2).replace('.',',')+' · Açaí a partir de R$ '+Object.values(produtos.açaí.copos)[0].toFixed(2).replace('.',',')+'. Veja o cardápio completo no site!';}catch(e){return 'Sorvetes a partir de R$ 8,00 · Milkshakes a partir de R$ 17,00 · Açaí a partir de R$ 15,00. Veja o cardápio completo no site!';}},
  'preços':function(){try{return 'Sorvetes: casquinha/copo a partir de R$ '+Object.values(produtos.sorvetes.preços.casquinha_copão)[0].toFixed(2).replace('.',',')+'  · Milkshakes a partir de R$ '+Object.values(produtos.milkshake.tradicional)[0].toFixed(2).replace('.',',')+' · Açaí a partir de R$ '+Object.values(produtos.açaí.copos)[0].toFixed(2).replace('.',',')+'. Veja o cardápio completo no site!';}catch(e){return 'Sorvetes a partir de R$ 8,00 · Milkshakes a partir de R$ 17,00 · Açaí a partir de R$ 15,00. Veja o cardápio completo no site!';}},
  'quanto':'Sorvetes a partir de R$ 8,00 · Milkshakes a partir de R$ 17,00 · Açaí a partir de R$ 15,00 · Picolés a partir de R$ 2,50. Veja o cardápio completo no site!',
  'valor':'Sorvetes a partir de R$ 8,00 · Milkshakes a partir de R$ 17,00 · Açaí a partir de R$ 15,00. Veja o cardápio completo no site!',
  // ── PAGAMENTO ──
  'pagamento':'Aceitamos Dinheiro, Pix, Cartão de Débito e Crédito. Para encomendas, pagamento antecipado obrigatório.',
  'pix':'Sim! Aceitamos Pix. Para encomendas, pagamento via Pix antecipado.',
  'cartão':'Sim! Aceitamos cartão de débito e crédito. Também Pix e dinheiro.',
  'dinheiro':'Sim! Aceitamos dinheiro, Pix e cartão.',
  // ── AÇAÍ ──
  'açaí':function(){try{return 'Açaí Tipo artesanal em '+Object.entries(produtos.açaí.copos).map(function(e){return e[0]+' (R$ '+e[1].toFixed(0)+')'}).join(', ')+'. Personalize com frutas, cremes e chocolates! Veja os complementos no cardápio.';}catch(e){return 'Açaí Tipo artesanal em copos de 300ml, 360ml, 400ml e 600ml. Personalize com frutas, cremes e chocolates!';}},
  'acai':function(){try{return 'Açaí Tipo artesanal em '+Object.entries(produtos.açaí.copos).map(function(e){return e[0]+' (R$ '+e[1].toFixed(0)+')'}).join(', ')+'. Personalize com frutas, cremes e chocolates!';}catch(e){return 'Açaí Tipo artesanal em copos de 300ml a 600ml. Personalize com frutas, cremes e chocolates!';}},
  'complemento':'Complementos do açaí: Frutas (R$ 2,00), Cremes como Nutella e Ninho (R$ 3,00), Guloseimas como Granola e Ovomaltine (R$ 2,00) e Chocolates como Kit Kat e Oreo (R$ 4,00).',
  // ── MILKSHAKE ──
  'milkshake':function(){try{return 'Milkshakes em copo transparente com tampa bolha! A partir de R$ '+Object.values(produtos.milkshake.tradicional)[0].toFixed(2).replace('.',',')+'. Disponível em vários tamanhos e sabores. Adicional Ovomaltine R$ 3,00!';}catch(e){return 'Milkshakes a partir de R$ 17,00 em copo transparente com tampa bolha! Vários tamanhos e sabores.';}},
  'milk':'Milkshakes em copo transparente com tampa bolha! A partir de R$ 17,00. Adicional Ovomaltine R$ 3,00!',
  // ── PICOLÉS ──
  'picolé':function(){try{return 'Picolés: '+Object.values(produtos.picolés).map(function(p){return p.nome+' (R$ '+p.preço_varejo.toFixed(2).replace('.',',')+')'}).join(' · ')+'. Atacado (mín. 100 un.) via encomenda com 3 dias de antecedência!';}catch(e){return 'Picolés de fruta/água R$ 2,50, de leite R$ 2,50–R$ 3,50. Atacado (mín. 100 un.) via encomenda!';}},
  'picolés':function(){try{return 'Picolés: '+Object.values(produtos.picolés).map(function(p){return p.nome+' (R$ '+p.preço_varejo.toFixed(2).replace('.',',')+')'}).join(' · ')+'. Atacado (mín. 100 un.) via encomenda!';}catch(e){return 'Picolés de fruta/água R$ 2,50, de leite R$ 2,50–R$ 3,50. Atacado (mín. 100 un.) via encomenda!';}},
  'atacado':'Picolés no atacado: mínimo 100 unidades, prazo de 3 dias úteis, pagamento antecipado. Entre em contato: (16) 99606-2046.',
  // ── ENCOMENDAS ──
  'encomendar':'Para encomendas, acesse a página de Encomendas no menu do site! Trabalhamos com Sorvete em Caixa, Torta de Sorvete e Picolés no atacado. Prazo: 3 dias úteis após pagamento.',
  'encomenda':'Para encomendas, acesse a página de Encomendas no menu do site! Prazo: 3 dias úteis após pagamento antecipado.',
  'prazo':'O prazo mínimo para encomendas é de 3 dias úteis após a confirmação e pagamento.',
  'torta':function(){try{return 'Torta de Sorvete R$ '+produtos.sobremesas['Torta de Sorvete'].toFixed(2).replace('.',',')+' com até 3 sabores à escolha. Encomende com 3 dias de antecedência pelo WhatsApp: (16) 99606-2046!';}catch(e){return 'Torta de Sorvete R$ 100,00 com até 3 sabores. Encomende com 3 dias de antecedência!';}},
  'caixa':function(){try{return 'Caixas de 5L (a partir de R$ '+Math.min.apply(null,Object.values(produtos.caixas_viagem).filter(function(_,i){return i<2})).toFixed(0)+') e 10L (a partir de R$ '+Math.min.apply(null,Object.values(produtos.caixas_viagem).filter(function(_,i){return i>=2})).toFixed(0)+') com 2 ou 3 sabores. Perfeito para festas!';}catch(e){return 'Caixas de 5L (a partir de R$ 100) e 10L (a partir de R$ 150) com 2 ou 3 sabores. Perfeito para festas!';}},
  'isopor':'Isopores para viagem: 4 bolas (R$ 25), 7 bolas (R$ 30), 9 bolas (R$ 40), 12 bolas (R$ 50). Ótimo para eventos!',
  // ── TAÇAS E SOBREMESAS ──
  'taça':'Taças especiais: Colegial R$20, Sundae R$23, Banana Split R$25, Universitário R$23, Ula-Ula R$48 e muito mais! Veja o cardápio.',
  'taças':'Taças tradicionais e sujas! Destaques: Sundae com Nutella R$28, Ula-Ula R$48, Prestígio R$42. Veja o cardápio!',
  'sundae':'Sundae R$ 23,00 e Sundae com Nutella R$ 28,00. Delicioso! ',
  'brownie':'Brownie com Sorvete: 1 bola R$ 20,00 · 2 bolas R$ 25,00. Uma combinação perfeita!',
  'fondue':'Fondue de Sorvete R$ 25,00. Perfeito para compartilhar!',
  'sobremesa':'Sobremesas: Torta de Sorvete R$100, Fondue R$25, Brownie com Sorvete R$20–R$25, Petit Gâteau R$20–R$25, Sorvete com Bolo R$15–R$25.',
  // ── EVENTOS E CARRINHO ──
  'evento':'Temos Carrinho para Eventos! Ideal para festas, aniversários e comemorações. Consulte disponibilidade pelo WhatsApp: (16) 99606-2046.',
  'festa':'Fazemos encomendas para festas: Torta de Sorvete, Caixas de 5L e 10L, Picolés no atacado e Carrinho para Eventos! Fale conosco: (16) 99606-2046.',
  'carrinho':'Sim! Temos Carrinho para Eventos. Consulte disponibilidade e valores pelo WhatsApp: (16) 99606-2046.',
  'aniversário':'Para aniversários: Torta de Sorvete R$100, Caixas de sorvete, Picolés no atacado e Carrinho para Eventos! Fale conosco: (16) 99606-2046.',
  // ──  E PROMOÇÃO ──
  'promoção':'Temos sorteio mensal! Cadastre-se na página de Promoção no menu do site para concorrer. Totalmente gratuito!',
  'sorteio':'Sorteio mensal gratuito! Cadastre-se na página de Promoção no menu do site. Boa sorte! ',
  'cadastro':'Para se cadastrar no  ou no Sorteio Mensal, acesse as páginas correspondentes no menu do site. É gratuito!',
  // ── DELIVERY E RETIRADA ──
  'delivery':'Não fazemos delivery. Encomende e retire na loja em Cajuru/SP.',
  'entrega':'Não fazemos delivery. Para encomendas, a retirada é na loja com prazo de 3 dias úteis.',
  'motoboy':'Não fazemos delivery. Atendemos somente na loja em Cajuru/SP.',
  'ifood':'Não fazemos delivery. Atendemos somente na loja em Cajuru/SP.',
  // ── SOBRE A SORVETERIA ──
  'anos':'A Sorveteria Itapolitana está em Cajuru desde 2007 — mais de 19 anos de tradição e sabor!',
  'historia':'A Sorveteria Itapolitana foi fundada em 2007 em Cajuru/SP. São mais de 19 anos servindo sorvetes Tipo artesanal com muito carinho!',
  'tipo artesanal':'Nossos sorvetes são Tipo artesanal — cremosos, em bolas redondas, com 35 sabores incríveis. Feitos com ingredientes selecionados!',
  'qualidade':'Trabalhamos com ingredientes selecionados e muito carinho desde 2007. Qualidade é nossa tradição!',
  // ── DICAS E DEPOIMENTOS ──
  'dicas':       'Temos uma página de Dicas com orientações para festas e eventos: quanto sorvete comprar, como conservar, quais sabores escolher. Acesse "Dicas/Depoimentos" no menu!',
  'depoimentos': 'Veja o que nossos clientes dizem! Acesse a página "Dicas/Depoimentos" no menu do site para ler avaliações e dicas exclusivas.',
  // ── PRIVACIDADE E LGPD ──
  'privacidade': 'Nossa Política de Privacidade está disponível no site. Respeitamos a LGPD e protegemos seus dados pessoais. Consulte o link "Política de Privacidade" no rodapé.',
  'lgpd':        'Seguimos a Lei Geral de Proteção de Dados (LGPD). Seus dados são usados apenas para o  e Sorteio. Veja nossa Política de Privacidade no rodapé do site.',
  'dados pessoais': 'Seus dados pessoais são protegidos conforme a LGPD. Usamos apenas para o  e Sorteio Mensal. Consulte nossa Política de Privacidade no rodapé do site.',
  // ── GALERIA ──
  'galeria':     'Temos uma galeria de fotos no site! Acesse "Galeria" para ver imagens dos nossos produtos e da sorveteria.',
  'foto':        'Veja fotos dos nossos produtos na Galeria do site! E siga @sorveteriaitapolitanacajuru no Instagram para novidades diárias.',
  // ── PICOLÉS RECHEADOS ──
  'recheado':    'Picolés Recheados são nossa especialidade! Para encomenda no atacado (mín. 100 un.), fale pelo WhatsApp: (16) 99606-2046.',
  // ── DEFAULT (FALLBACK PARA WHATSAPP) ──
  'default':'Não entendi direitinho a sua pergunta<br><br>Posso te ajudar com:<br>• Cardápio e pedidos<br>• Endereço e horário<br>• Promoções<br>• Falar com atendente<br><br>Tente escrever o assunto (ex.: cardápio, localização, promoções) ou clique abaixo:<br><a href="https://wa.me/5516996062046?text=Ol%C3%A1%2C+tenho+uma+d%C3%BAvida+sobre+a+Sorveteria+Itapolitana" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:7px;background:#25D366;color:#fff;padding:9px 18px;border-radius:20px;font-size:12px;font-weight:800;text-decoration:none;margin-top:8px">Falar com atendente</a>'
};
window.RESPOSTAS = RESPOSTAS;
const ITABOT_INTENTS = [
  {
    keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'iniciar', 'começo', 'inicio', 'início', 'menu', 'opções', 'opcoes'],
    reply: 'Olá! Eu sou o Ita Bot, assistente virtual da Sorveteria Itapolitana.<br><br>Posso te ajudar com:<br>• Cardápio e pedidos<br>• Endereço e horário de funcionamento<br>• Promoções<br>• Falar com atendente<br><br>Escreva o assunto ou o número da opção.'
  },
  {
    keywords: ['fazer pedido', 'pedido', 'pedir', 'delivery', 'encomenda', 'comprar', 'quero pedir', 'telefone', 'zap', 'whatsapp', 'whats', 'número', 'numero'],
    reply: 'Para fazer seu pedido agora, é só chamar a gente no WhatsApp:<br><a class="itabot-link-btn" href="https://wa.me/5516996062046?text=Ol%C3%A1%2C+quero+fazer+um+pedido+na+Sorveteria+Itapolitana" target="_blank" rel="noopener">Fazer pedido no WhatsApp</a><br><br>Se preferir, você também pode ver o cardápio antes em:<br><a class="itabot-link-btn" href="encomendas.html">Ver cardápio</a>'
  },
  {
    keywords: ['localização', 'localizacao', 'endereço', 'endereco', 'onde fica', 'onde', 'como chegar', 'como ir', 'mapa', 'maps', 'waze'],
    reply: 'Estamos te esperando aqui:<br>Sorveteria Itapolitana<br>R. Cel. Manoel Caetano, 311 – Praça Largo São Bento – Centro<br>Cajuru/SP<br><br>Ver no mapa:<br><a class="itabot-link-btn" href="https://www.google.com/maps/place/Sorveteria+A%C3%A7aiteria+Itapolitana+Cajuru/@-21.2776766,-47.3071817" target="_blank" rel="noopener">Abrir no Google Maps</a>'
  },
  {
    keywords: ['horário', 'horario', 'horarios', 'horas', 'que horas abre', 'que horas fecha', 'funcionamento', 'funciona que dia', 'dias de funcionamento'],
    reply: 'Nosso horário de funcionamento é:<br><br>Todos os dias: 10h às 22h<br><br>Em datas especiais pode haver alteração; se tiver dúvida, pergunte aqui ou no WhatsApp.'
  },
  {
    keywords: ['cardápio', 'cardapio', 'menu', 'sabores', 'sorvetes', 'sorvete', 'açaí', 'acai', 'milk shake', 'milkshake', 'o que vocês vendem', 'produtos'],
    reply: 'Nosso cardápio completo de sorvetes, açaí e milkshakes está aqui:<br><a class="itabot-link-btn" href="encomendas.html">Abrir cardápio</a><br><br>Você pode ver todos os sabores, tamanhos e preços nesse link.'
  },
  {
    keywords: ['promoção', 'promocao', 'promoções', 'promocoes', 'ofertas', 'desconto', 'desconto hoje', 'tem alguma promoção', 'promo do dia'],
    reply: 'Temos promoções especiais em sorvetes e milkshakes!<br><br>Você pode ver as promoções ativas nesta página:<br><a class="itabot-link-btn" href="promocao.html">Ver promoções</a>'
  },
  {
    keywords: ['falar com atendente', 'falar com humano', 'falar com pessoa', 'atendimento', 'suporte', 'quero falar com alguém', 'quero falar com alguem'],
    reply: 'Sem problemas, posso te passar direto para nossa equipe.<br><br>É só clicar neste link para falar com um atendente pelo WhatsApp:<br><a class="itabot-link-btn" href="https://wa.me/5516996062046?text=Ol%C3%A1%2C+vim+pelo+site+da+Sorveteria+Itapolitana+e+quero+falar+com+um+atendente" target="_blank" rel="noopener">Falar com atendente</a>'
  },
  {
    keywords: ['instagram', 'insta', 'facebook', 'face', 'redes sociais', 'social', 'seguir vocês', 'seguir voces'],
    reply: 'Você pode acompanhar as novidades da Sorveteria Itapolitana nas redes sociais:<br><br><a class="itabot-link-btn" href="https://www.instagram.com/sorveteriaitapolitanacajuru" target="_blank" rel="noopener">Instagram</a><a class="itabot-link-btn" href="https://www.facebook.com/itapolitanacajuru/" target="_blank" rel="noopener">Facebook</a>'
  },
  {
    keywords: ['sobre vocês', 'sobre voces', 'quem são vocês', 'quem sao voces', 'história', 'historia', 'quem somos', 'sobre a sorveteria'],
    reply: 'A Sorveteria Itapolitana prepara sorvetes, açaís e milkshakes com receitas especiais para a região.<br><br>Você pode saber mais sobre a nossa história e ver fotos da loja aqui:<br><a class="itabot-link-btn" href="sobre.html">Sobre a loja</a>'
  }
];
// ItaBot: base de conhecimento consolidada a partir de TODO o site
// Carrega FAQs dos módulos e mescla com as respostas existentes
(function carregarFaqsItaBot() {
  'use strict';
  var FAQ_ARQUIVOS = [
    'dados/faq_horarios_localizacao.json',
    'dados/faq_cardapio.json',
    'dados/faq_encomendas.json',
    'dados/faq_sorteio_promocoes.json'
  ];

  function normalizarTag(t) {
    return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function mesclarFaq(faq) {
    if (!faq || !Array.isArray(faq.perguntas)) return;
    faq.perguntas.forEach(function(p) {
      if (!p.tags || !p.resposta) return;
      p.tags.forEach(function(tag) {
        var chave = normalizarTag(tag);
        // Não sobrescreve respostas que já têm função (preços dinâmicos)
        if (typeof window.RESPOSTAS[chave] !== 'function') {
          window.RESPOSTAS[chave] = p.resposta;
        }
      });
    });
  }

  FAQ_ARQUIVOS.forEach(function(url) {
    fetch(url + '?v=' + (window._itapV || Date.now()))
      .then(function(r) { return r.ok ? r.json() : null; })
      .catch(function() { return null; })
      .then(function(faq) { if (faq) mesclarFaq(faq); });
  });
}());
// Scripts de chat legados removidos. O Ita Bot agora é gerenciado pelo script ita-bot-widget.js
function getComplementosCardápio() {
  const fonte = window.PRODUTOS_DATA || {};
  return Array.isArray(fonte.acrescimos) ? fonte.acrescimos : [];
}
function renderComplementosCardápio() {
  const el = document.getElementById('enc-preview-acrescimos');
  if (!el) return;
  const comps = Array.isArray(produtos && produtos.acrescimos) ? produtos.acrescimos : getComplementosCardápio().map(c => ({ id: c.id, nome: c.nome, preço: c.preço, estoque: c.estoque }));
  el.innerHTML = `<div class="enc-preview-list">${comps.map(c => {
    const preco = Number(c.preço ?? c.preco ?? 0);
    const esgotado = Number(c.estoque ?? 0) <= 0 || c.esgotado;
    return `<div class="enc-preview-item ${esgotado ? 'is-esgotado' : ''}"><span>${escHTML(c.nome)}</span><strong>${esgotado ? 'Esgotado' : 'R$ ' + preco.toFixed(2).replace('.',',')}</strong></div>`;
  }).join('')}</div>`;
}
// Se houver banner personalizado no admin, sobrepõe o padrão
async function carregarBanner(){
  try{
    const d=await _buscarDadosPromo();
    if(d.bannerImg){
      const img=document.getElementById('cardápio-banner-img');
      if(img){img.src=d.bannerImg;img.onerror=()=>{img.src='images/banner-cardapio.webp';};}
      localStorage.setItem('itap_banner_cache',d.bannerImg);
      return;
    }
  }catch(e){}
  // Fallback: cache local
  try{
    const cached=localStorage.getItem('itap_banner_cache');
    if(cached){
      const img=document.getElementById('cardápio-banner-img');
      if(img)img.src=cached;
    }
  }catch(e){}
}
const FRASES_SENSORIAIS = [
  '🍦 "O sorvete mais cremoso de Cajuru, desde 2007!"',
  '🍨 "35 sabores Tipo artesanal que encantam na primeira colherada"',
  '🍭 "Açaí, milkshake, taças e sobremesas geladas — tudo aqui!"',
  '✨ "Feito com ingredientes selecionados e muito carinho"',
  '🎂 "Encomende sua torta de sorvete para festas e eventos"',
  '🍦 "A escolha favorita de Cajuru há mais de 19 anos"',
  '🌟 "Picolés, caixas 5L e 10L — perfeito para o seu evento!"',
  '🍪 "Venha nos visitar e descubra seu sabor favorito"',
];
let fraseIdx = 0;
setInterval(() => {
  fraseIdx = (fraseIdx + 1) % FRASES_SENSORIAIS.length;
  const el = document.getElementById('frase-rotativa');
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      el.textContent = FRASES_SENSORIAIS[fraseIdx];
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 400);
  }
}, 4000);
// [frase-rotativa fundida no DOMContentLoaded principal]
const STRIPS = [
  '🍦 Cremoso · Gelado · Irresistível · Feito com Amor · 35 Sabores · Desde 2007 · Tipo artesanal · 🍦',
  '🍨 Sorvete de Massa · Picolés Recheados · Açaí Premium · Tortas · Milkshakes · Taças · 🍨',
  '🎂 Encomende sua Torta de Sorvete · Caixas 5L e 10L · Picolés Atacado · Acréscimos · 🎂',
];
let stripIdx = 0;
setInterval(() => {
  stripIdx = (stripIdx + 1) % STRIPS.length;
  const s = document.getElementById('strip-sensorial');
  if (s) s.textContent = STRIPS[stripIdx];
}, 5000);
// ─────────────────────────────────────────────────────────────────────────
// SINCRONISMO DE PRODUTOS — Single Source of Truth
// Fonte: /dados/produtos.json — mesmo arquivo que o admin salva
// Padrão: iFood / Shopify / Nubank
// ─────────────────────────────────────────────────────────────────────────
const ITAP_PRODUTOS_URL = '/dados/produtos.json';

// Compatibilidade do cardápio: o dataset oficial é carregado por scripts/products.js
// como window.PRODUTOS_DATA. O alias dinâmico evita ReferenceError em botões
// acionados após o carregamento, sem modificar o dataset ou as outras páginas.
if (!Object.getOwnPropertyDescriptor(window, 'produtos')) {
  Object.defineProperty(window, 'produtos', {
    configurable: true,
    enumerable: false,
    get: function() { return window.PRODUTOS_DATA || {}; },
    set: function(value) { window.PRODUTOS_DATA = value; }
  });
}

async function carregarPreçosNuvemCardápio() {
  try {
    const resp = await fetch(ITAP_PRODUTOS_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('produtos.json indisponível');
    const dados = await resp.json();

    // Aplicar sabores de sorvetes
    if (dados.sorvetes && dados.sorvetes.sabores) {
      produtos.sorvetes.sabores = dados.sorvetes.sabores;
    }

    // Aplicar preços de sorvetes
    if (dados.sorvetes && dados.sorvetes.precos) {
      // Normalizar chaves do JSON para o formato interno
      const p = dados.sorvetes.precos;
      produtos.sorvetes.preços = {
        casquinha_copão: p.casquinha_copo || p.casquinha_copão,
        copão_recheado: p.copo_recheado || p.copão_recheado,
        cascão: p.cascão,
        cestinha: p.cestinha
      };
    }

    // Aplicar picolés
    if (dados.picoles) {
      Object.entries(dados.picoles).forEach(([key, p]) => {
        if (produtos.picolés && produtos.picolés[key]) {
          if (p.preco_varejo !== undefined) produtos.picolés[key].preço_varejo = p.preco_varejo;
          if (p.preco_atacado !== undefined) produtos.picolés[key].preço_atacado = p.preco_atacado;
          if (p.sabores) produtos.picolés[key].sabores = p.sabores;
          if (p.estoque !== undefined) produtos.picolés[key].estoque = p.estoque;
        }
      });
    }

    // Aplicar milkshake
    if (dados.milkshake) produtos.milkshake = dados.milkshake;

    // Aplicar taças
    if (dados.tacas) produtos.tacas = dados.tacas;

    // Aplicar açaí
    if (dados.açaí) produtos.açaí = dados.açaí;
    if (dados.acai) produtos.acai = dados.acai;

    // Aplicar dados de Encomendas
    if (dados.caixas_enc) produtos.caixas_enc = dados.caixas_enc;
    if (dados.tortas_enc) produtos.tortas_enc = dados.tortas_enc;
    if (dados.acrescimos) produtos.acrescimos = dados.acrescimos;

    // Aplicar caixas e isóporos
    if (dados.caixas_viagem) produtos.caixas_viagem = dados.caixas_viagem;
    if (dados.isopores_viagem) produtos.isopores_viagem = dados.isopores_viagem;

    // Aplicar sobremesas
    if (dados.sobremesas) produtos.sobremesas = dados.sobremesas;

    // Cache local como fallback offline
    try { localStorage.setItem('itap_produtos_nuvem', JSON.stringify(dados)); } catch(e) {}
    return true;

  } catch(e) {
    console.warn('[Itap Cardápio] Falha ao carregar produtos.json, usando cache local:', e.message);
    const cache = localStorage.getItem('itap_produtos_nuvem');
    if (cache) {
      try {
        const dados = JSON.parse(cache);
        if (dados.sorvetes && dados.sorvetes.sabores) produtos.sorvetes.sabores = dados.sorvetes.sabores;
        if (dados.sorvetes && dados.sorvetes.precos) {
          const p = dados.sorvetes.precos;
          produtos.sorvetes.preços = {
            casquinha_copão: p.casquinha_copo || p.casquinha_copão,
            copão_recheado: p.copo_recheado || p.copão_recheado,
            cascão: p.cascão,
            cestinha: p.cestinha
          };
        }
        if (dados.picoles) Object.entries(dados.picoles).forEach(([key, p]) => {
          if (produtos.picolés && produtos.picolés[key]) {
            if (p.preco_varejo !== undefined) produtos.picolés[key].preço_varejo = p.preco_varejo;
            if (p.preco_atacado !== undefined) produtos.picolés[key].preço_atacado = p.preco_atacado;
            if (p.sabores) produtos.picolés[key].sabores = p.sabores;
          }
        });
        if (dados.caixas_enc) produtos.caixas_enc = dados.caixas_enc;
        if (dados.tortas_enc) produtos.tortas_enc = dados.tortas_enc;
        if (dados.acrescimos) produtos.acrescimos = dados.acrescimos;
        if (dados.milkshake) produtos.milkshake = dados.milkshake;
        if (dados.tacas) produtos.tacas = dados.tacas;
        if (dados.açaí) produtos.açaí = dados.açaí;
        if (dados.caixas_viagem) produtos.caixas_viagem = dados.caixas_viagem;
        if (dados.isopores_viagem) produtos.isopores_viagem = dados.isopores_viagem;
        if (dados.sobremesas) produtos.sobremesas = dados.sobremesas;
      } catch(e2) { console.error('[Itap Cardápio] Cache corrompido:', e2); }
    }
    return false;
  }
}
function formatarPrecoEncomenda(valor) {
  return 'R$ ' + Number(valor || 0).toFixed(2).replace('.', ',');
}
function renderPreviewEncomenda(id, itens, precoGetter) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="enc-preview-list" role="list">${itens.map(item => {
    const nome = item.nome || item.titulo || item.label || '';
    const preco = precoGetter(item);
    return `<div class="enc-preview-item" role="listitem"><span>${escHTML(nome)}</span><strong>${formatarPrecoEncomenda(preco)}</strong></div>`;
  }).join('')}</div>`;
}
function renderEncomendasPreviews() {
  const caixas = Array.isArray(produtos && produtos.caixas_enc) && produtos.caixas_enc.length
    ? produtos.caixas_enc
    : Object.entries((produtos && produtos.caixas_viagem) || {}).map(([nome, preco]) => ({ nome, preço: preco }));
  const tortas = Array.isArray(produtos && produtos.tortas_enc) && produtos.tortas_enc.length
    ? produtos.tortas_enc
    : [{ nome: 'Torta de Sorvete', preço: produtos && produtos.sobremesas ? produtos.sobremesas['Torta de Sorvete'] : 100 }];
  const picoles = Object.entries((produtos && (produtos.picolés || produtos.picoles)) || {}).map(([id, item]) => ({ id, nome: item.nome, preço: item.preço_atacado ?? item.preco_atacado ?? item.preço_varejo ?? item.preco_varejo }));
  renderPreviewEncomenda('enc-preview-caixas', caixas, item => item.preço ?? item.preco);
  renderPreviewEncomenda('enc-preview-tortas', tortas, item => item.preço ?? item.preco);
  renderPreviewEncomenda('enc-preview-picoles', picoles, item => item.preço ?? item.preco);
  renderComplementosCardápio();
}
function renderTudo() {
  renderSorvetes();renderMilk();renderTacas();renderTacasP();renderAçaí();renderPicolés();renderIso();renderSobremesas();
  renderEncomendasPreviews();
  const tortaFotoArea=document.getElementById('torta-foto-area');
  if(tortaFotoArea)tortaFotoArea.innerHTML=imgCard('sobremesa_Torta_de_Sorvete','🎂');
  const tp=document.getElementById('torta-preço');
  if(tp&&produtos&&produtos.sobremesas)tp.textContent='R$ '+produtos.sobremesas['Torta de Sorvete'].toFixed(2).replace('.',',');
}
/* ============================================================
   SINCRONISMO TOTAL — SINGLE SOURCE OF TRUTH
   Padrão: iFood / Nubank / Shopify
   Fonte: dados/config.json (GitHub Raw)
   Aplica em todos os elementos do site ao carregar
   Fallback: localStorage para offline/falha de rede
   ============================================================ */
function aplicarConfig(c) {
  if (!c) return;

  // ─────────────────────────────────────────────────────────────────────────
  // HERO — sincronismo total via config.json
  // ─────────────────────────────────────────────────────────────────────────
  const heroBadge = document.getElementById('hero-badge');
  if (heroBadge && c.heroBadge) heroBadge.textContent = c.heroBadge;

  // hero-título: usa ID direto (padrão profissional — não depende de seletor de tag)
  const heroTituloEl = document.getElementById('hero-título');
  if (heroTituloEl && c.heroTitulo) {
    // Escapa HTML completamente para prevenir XSS (& primeiro, depois < > " ')
    const _titulo = c.heroTitulo
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    heroTituloEl.innerHTML = _titulo.replace(
      /(Cajuru|Itapolitana|sorvete|açaí|picolé|cremoso)/gi,
      '<span class="destaque-texto">$1</span>'
    );
  }

  // hero-descrição: usa ID direto
  const heroDescEl = document.getElementById('hero-descrição');
  if (heroDescEl && c.heroDescricao) heroDescEl.textContent = c.heroDescricao;

  // hero-cta: botão principal e secundário
  const heroCta = document.getElementById('hero-cta-text');
  if (heroCta && c.heroCta) heroCta.textContent = c.heroCta;
  const heroCtaWhats = document.getElementById('hero-cta-whats-text');
  if (heroCtaWhats && c.heroCtaWhats) heroCtaWhats.textContent = c.heroCtaWhats;

  // --- FRASES ROTATIVAS ---
  if (c.heroFrases && Array.isArray(c.heroFrases) && c.heroFrases.length > 0) {
    window.FRASES_HERO = c.heroFrases;
    const fraseEl = document.getElementById('frase-rotativa');
    if (fraseEl) fraseEl.textContent = c.heroFrases[0];
  }

  // --- STRIP SENSORIAL ---
  if (c.stripSensorial && Array.isArray(c.stripSensorial) && c.stripSensorial.length > 0) {
    window.STRIPS = c.stripSensorial;
    const stripEl = document.getElementById('strip-sensorial');
    if (stripEl) stripEl.textContent = c.stripSensorial[0];
  }

  // --- CARDÁPIO TÍTULO ---
  const cardH = document.querySelector('.cardápio-h, #cardapio-titulo');
  if (cardH && c.cardapioTitulo) cardH.textContent = c.cardapioTitulo;

  // ─────────────────────────────────────────────────────────────────────────
  // BOTÕES DE NAVEGAÇÃO — sincronismo total
  // ─────────────────────────────────────────────────────────────────────────
  const navEncomendas = document.querySelector('a[href="encomendas.html"] .itap-nav-label');
  if (navEncomendas && c.navEncomendas) navEncomendas.textContent = c.navEncomendas;

  // nav-promo-btn: botão de promoção no menu (usa ID direto)
  const navPromoLabel = document.querySelector('#nav-promo-btn .itap-nav-label');
  if (navPromoLabel && c.navPromocao) navPromoLabel.textContent = c.navPromocao;

  const navDicas = document.querySelector('a[href="dicas.html"] .itap-nav-label');
  if (navDicas && c.navDicas) navDicas.textContent = c.navDicas;

  // --- BRAND (footer) ---
  const brandName = document.getElementById('brand-name');
  if (brandName && c.nomeEmpresa) brandName.textContent = c.nomeEmpresa;
  const brandSub = document.getElementById('brand-sub');
  if (brandSub && c.slogan) brandSub.textContent = c.slogan;
  // --- CHATBOT: atualizar respostas dinâmicas de endereço e WhatsApp ---
  if (c.enderecoCompleto && window.RESPOSTAS) {
    window.RESPOSTAS['endereço'] = 'Estamos em ' + c.enderecoCompleto + ' 📍';
    window.RESPOSTAS['localização'] = window.RESPOSTAS['endereço'];
    window.RESPOSTAS['onde'] = window.RESPOSTAS['endereço'];
  }
  if (c.whatsappFormatado && window.RESPOSTAS) {
    window.RESPOSTAS['telefone'] = 'WhatsApp: ' + c.whatsappFormatado + ' 📱';
    window.RESPOSTAS['whatsapp'] = window.RESPOSTAS['telefone'];
    window.RESPOSTAS['contato'] = window.RESPOSTAS['telefone'];
  }

  // --- CHATBOT: varredura global — substitui telefone e horário em TODAS as respostas ---
  if (window.RESPOSTAS && (c.whatsappFormatado || c.horarioAbre !== undefined)) {
    const tel   = c.whatsappFormatado || '';
    const abre  = c.horarioAbre  !== undefined ? c.horarioAbre  : 10;
    const fecha = c.horarioFecha !== undefined ? c.horarioFecha : 22;
    const reTel     = /\(\d{2}\)\s?\d{4,5}[-\s]?\d{4}/g;
    const reHorario = /\b\d{1,2}h\s+às\s+\d{1,2}h/g;
    const novoHorario = abre + 'h às ' + fecha + 'h';
    Object.keys(window.RESPOSTAS).forEach(function (k) {
      if (typeof window.RESPOSTAS[k] !== 'string') return;
      let txt = window.RESPOSTAS[k];
      if (tel) txt = txt.replace(reTel, tel);
      txt = txt.replace(reHorario, novoHorario);
      txt = txt.replace(/\b[Aa]brimos às \d{1,2}h/g, 'Abrimos às ' + abre + 'h');
      txt = txt.replace(/\b[Ff]echamos às \d{1,2}h/g, 'Fechamos às ' + fecha + 'h');
      txt = txt.replace(/\babre amanhã às \d{1,2}h/gi, 'abre amanhã às ' + abre + 'h');
      window.RESPOSTAS[k] = txt;
    });
  }

  // --- NÚMERO DE SABORES (numSabores) ---
  if (c.numSabores) {
    const ns = c.numSabores;
    // Botões "Ver 35 Sabores" no cardápio
    document.querySelectorAll('.btn-sabores').forEach(function (btn) {
      btn.textContent = btn.textContent.replace(/\b\d+\s+sabores\b/gi, function (m) {
        return m.replace(/\d+/, ns);
      });
    });
    // Banner de categorias ".vc-banner-sub"
    document.querySelectorAll('.vc-banner-sub').forEach(function (el) {
      el.textContent = el.textContent.replace(/\b\d+\s+sabores\b/gi, function (m) {
        return m.replace(/\d+/, ns);
      });
    });
    // Chatbot: substituir "35 sabores" em todas as respostas
    if (window.RESPOSTAS) {
      Object.keys(window.RESPOSTAS).forEach(function (k) {
        if (typeof window.RESPOSTAS[k] !== 'string') return;
        window.RESPOSTAS[k] = window.RESPOSTAS[k].replace(/\b\d+\s+sabores\b/gi, function (m) {
          return m.replace(/\d+/, ns);
        });
      });
    }
  }

  // --- FOOTER ---
  const footerHorario = document.getElementById('footer-horário');
  if (footerHorario && c.footerHorario) {
    // Escapa HTML completamente para prevenir XSS (& primeiro, depois < > " ')
    const _horario = c.footerHorario
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    footerHorario.innerHTML = _horario.replace(/\n/g, '<br>');
  }

  const footerCopy = document.getElementById('footer-copy');
  if (footerCopy && c.footerCopy) footerCopy.textContent = c.footerCopy;

  const footerDev = document.getElementById('footer-dev');
  if (footerDev && c.footerDev) footerDev.textContent = c.footerDev;

  // --- WHATSAPP LINKS ---
  if (c.whatsapp) {
    document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
      const url = new URL(a.href);
      a.href = 'https://wa.me/' + c.whatsapp + (url.search || '');
    });
  }

  // --- HORÁRIO DINÂMICO ---
  if (c.horarioAbre !== undefined) window.ITAP_HORA_ABRE = c.horarioAbre;
  if (c.horarioFecha !== undefined) window.ITAP_HORA_FECHA = c.horarioFecha;

  // --- JSON-LD: atualizar opens/closes com horários do config ---
  if (c.horarioAbre !== undefined && c.horarioFecha !== undefined) {
    const pad2 = function (n) { return String(n).padStart(2, '0'); };
    const opensStr  = pad2(c.horarioAbre)  + ':00';
    const closesStr = pad2(c.horarioFecha) + ':00';
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (el) {
      try {
        const d = JSON.parse(el.textContent);
        const spec = d.openingHoursSpecification;
        if (!spec) return;
        const arr = Array.isArray(spec) ? spec : [spec];
        arr.forEach(function (s) { s.opens = opensStr; s.closes = closesStr; });
        d.openingHoursSpecification = arr;
        el.textContent = JSON.stringify(d);
      } catch (_) {}
    });
  }

  // --- CARRINHO PARA EVENTOS ---
  const carrinhoLabel1 = document.getElementById('carrinho-label1');
  if (carrinhoLabel1 && c.carrinhoLabel1) carrinhoLabel1.textContent = c.carrinhoLabel1;
  const carrinhoLabel2 = document.getElementById('carrinho-label2');
  if (carrinhoLabel2 && c.carrinhoLabel2) carrinhoLabel2.textContent = c.carrinhoLabel2;
  const carrinhoLink = document.querySelector('.hero-carrinho-wrap a');
  if (carrinhoLink && c.carrinhoWhatsMsg) {
    carrinhoLink.href = 'https://wa.me/' + (c.whatsapp || '5516996062046') + '?text=' + encodeURIComponent(c.carrinhoWhatsMsg);
  }

  // --- MODAL SABORES ---
  const msTitulo = document.getElementById('ms-título');
  if (msTitulo && c.modalSaboresTitulo) msTitulo.textContent = c.modalSaboresTitulo;
  const msSub = document.getElementById('ms-sub');
  if (msSub && c.modalSaboresSub) msSub.textContent = c.modalSaboresSub;

  // --- MODAL PICOLÉ ---
  const mpTitulo = document.getElementById('mp-título');
  if (mpTitulo && c.modalPicoleTitulo) mpTitulo.textContent = c.modalPicoleTitulo;

  // --- MODAL AÇAÍ COMPLEMENTOS ---
  const modalCompTitulo = document.getElementById('modal-comp-titulo');
  if (modalCompTitulo && c.modalAçaíTitulo) modalCompTitulo.textContent = c.modalAçaíTitulo;
  const modalCompSub = document.getElementById('modal-comp-sub');
  if (modalCompSub && c.modalAçaíSub) modalCompSub.textContent = c.modalAçaíSub;

  // --- MODAL FALE CONOSCO ---
  const faleModalTitulo = document.getElementById('fale-modal-titulo');
  if (faleModalTitulo && c.faleModalTitulo) faleModalTitulo.textContent = c.faleModalTitulo;
  const faleModalSub = document.getElementById('fale-modal-sub');
  if (faleModalSub && c.faleModalSub) faleModalSub.textContent = c.faleModalSub;
  const faleBtnTexto = document.getElementById('fale-btn-texto');
  if (faleBtnTexto && c.faleBtnTexto) faleBtnTexto.textContent = c.faleBtnTexto;
  const faleLabelNome = document.getElementById('fale-label-nome');
  if (faleLabelNome && c.faleLabelNome) faleLabelNome.textContent = c.faleLabelNome;
  const faleLabelMsg = document.getElementById('fale-label-msg');
  if (faleLabelMsg && c.faleLabelMsg) faleLabelMsg.textContent = c.faleLabelMsg;

  // --- CHAT FAB E HEADER ---
  const chatFabTexto = document.getElementById('chat-fab-texto');
  if (chatFabTexto && c.chatFabTexto) chatFabTexto.textContent = c.chatFabTexto;
  const chatHdrTitulo = document.getElementById('chat-hdr-titulo');
  if (chatHdrTitulo && c.chatHdrTitulo) chatHdrTitulo.textContent = c.chatHdrTitulo;
  const chatHdrSub = document.getElementById('chat-hdr-sub');
  if (chatHdrSub && c.chatHdrSub) chatHdrSub.textContent = c.chatHdrSub;
  const chatMsgInicio = document.getElementById('chat-msg-inicio');
  if (chatMsgInicio && c.chatMsgInicio) chatMsgInicio.innerHTML = sanitizarHtmlRicoChat(c.chatMsgInicio);
  window.ITAP_CHAT_FORA_HORARIO = c.chatForaHorario || c.fcChatFora || window.ITAP_CHAT_FORA_HORARIO || '';

  // --- CHAT SUGESTÕES (botões rápidos) ---
  renderChatSugestoes(c.chatSugestoes);

  // --- PROMO FAB LABEL ---
  // (o FAB lê fabLabel diretamente de promo.json; este campo não é mais necessário aqui)

  // Salvar no localStorage como fallback
  try { localStorage.setItem('itap_config_cache', JSON.stringify(c)); } catch(e) {}

  // Aplicar títulos dos accordions salvos via admin (GitHub API)
  if (c.titulosCardapio) {
    aplicarTitulosCardapio(c.titulosCardapio);
    try { localStorage.setItem('cfg_titulos_cardapio', JSON.stringify(c.titulosCardapio)); } catch(e) {}
  }
}

// ── APLICAR TÍTULOS DOS ACCORDIONS SALVOS NO ADMIN ──────────────────────
function aplicarTitulosCardapio(cfgTitulos) {
  try {
    // Preferência: dados do GitHub (passados via aplicarConfig), fallback localStorage
    var cfg = cfgTitulos || JSON.parse(localStorage.getItem('cfg_titulos_cardapio') || '{}');
    if (!cfg || !Object.keys(cfg).length) return;
    var mapa = [
      ['acc-sorvetes-titulo','acc-sorvetes-sub','acc-sorvetes'],
      ['acc-picoles-titulo','acc-picoles-sub','acc-picolés'],
      ['acc-açaí-titulo','acc-açaí-sub','acc-açaí'],
      ['acc-milk-titulo','acc-milk-sub','acc-milk'],
      ['acc-tacas-titulo','acc-tacas-sub','acc-tacas'],
      ['acc-tacas-p-titulo','acc-tacas-p-sub','acc-tacas-premium'],
      ['acc-iso-titulo','acc-iso-sub','acc-iso'],
      ['acc-sobremesas-titulo','acc-sobremesas-sub','acc-sobremesas'],
      ['acc-caixas-titulo','acc-caixas-sub','acc-enc-caixas'],
      ['acc-torta-titulo','acc-torta-sub','acc-enc-tortas'],
      ['acc-enc-picoles-titulo','acc-enc-picoles-sub','acc-enc-picolés'],
      ['acc-complementos-titulo','acc-complementos-sub','acc-complementos']
    ];
    mapa.forEach(function(m) {
      var accEl = document.getElementById(m[2]);
      if (!accEl) return;
      var tEl = accEl.querySelector('.acc-title');
      var sEl = accEl.querySelector('.acc-sub');
      if (tEl && cfg[m[0]]) tEl.textContent = cfg[m[0]];
      if (sEl && cfg[m[1]]) sEl.textContent = cfg[m[1]];
    });
  } catch(e) { console.warn('[Itap] Títulos cardápio:', e); }
}
// ─────────────────────────────────────────────────────────────────────────────
async function carregarConfig() {
  if (window.SITE_CONFIG) {
    aplicarConfig(window.SITE_CONFIG);
    return;
  }
  window.addEventListener('siteConfigLoaded', function onConfig(ev) {
    window.removeEventListener('siteConfigLoaded', onConfig);
    aplicarConfig(ev && ev.detail);
  });
}

// =====================================================
// DOMContentLoaded ÚNICO — orquestra toda a inicialização
// Padrão profissional: um único ponto de entrada
// =====================================================
document.addEventListener('DOMContentLoaded', () => {

  // 1. Frase rotativa
  const elFrase = document.getElementById('frase-rotativa');
  if (elFrase) elFrase.style.transition = 'opacity .4s, transform .4s';

  // 2. Carregar config (textos, hero, footer, strip)
  carregarConfig();

  // 2c. Carregar estado da promoção (top bar + FAB) diretamente de promo.json
  carregarBarraPromo();

  // 2b. Aplicar títulos dos accordions (fallback localStorage; GitHub sobrescreve em aplicarConfig)
  aplicarTitulosCardapio();

  // 3. Carregar banner
  carregarBanner();

  // 4. Carregar preços da nuvem primeiro, depois renderizar
  carregarPreçosNuvemCardápio().then(() => {
    renderTudo(); sincronizarCardapioMap();
  }).catch(() => {
    renderTudo();
  });

  // 5. Corrigir chatbot: resolver funções
  if (typeof RESPOSTAS !== 'undefined') {
    Object.keys(RESPOSTAS).forEach(k => {
      if (typeof RESPOSTAS[k] === 'function') RESPOSTAS[k] = RESPOSTAS[k]();
    });
  }

  // 6. Horário dinâmico
  atualizarStatusHorário();
  setInterval(atualizarStatusHorário, 60 * 1000);

  // 7. Status da loja
  atualizarStatusLoja();
  setInterval(atualizarStatusLoja, 60000);

  // 8. Observer de animações de entrada
  if (window._animObserver) {
    document.querySelectorAll('.animar-entrada').forEach(el => window._animObserver.observe(el));
  }

});




// Relógio digital removido
// Widget clima removido

// === HORÁRIO DINÂMICO ===
function atualizarStatusHorário() {
  const statusTexto = document.getElementById('horário-status-texto');
  const statusDot = document.querySelector('.status-dot');
  if (!statusTexto || !statusDot) return;

  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = Domingo, 1 = Segunda...
  const horaAtual = agora.getHours() + agora.getMinutes() / 60;

  let aberto = false;
  let fechaEm = '';

  // Horários dinâmicos via config.json
  const hAbre = window.ITAP_HORA_ABRE !== undefined ? window.ITAP_HORA_ABRE : 10;
  const hFecha = window.ITAP_HORA_FECHA !== undefined ? window.ITAP_HORA_FECHA : 22;
  if (horaAtual >= hAbre && horaAtual < hFecha) {
    aberto = true;
    fechaEm = `Fecha às ${hFecha}h`;
  } else {
    fechaEm = `Abre às ${hAbre}h`;
  }

  if (aberto) {
    statusTexto.textContent = `Aberto agora - ${fechaEm}`;
    statusTexto.style.color = '#4CAF50'; // Verde claro para fundo escuro
    statusDot.style.backgroundColor = '#4CAF50';
  } else {
    statusTexto.textContent = `Fechado - ${fechaEm}`;
    statusTexto.style.color = '#FF5252'; // Vermelho claro para fundo escuro
    statusDot.style.backgroundColor = '#FF5252';
    statusDot.style.animation = 'none';
  }
}

// [atualizarStatusHorário fundida no DOMContentLoaded principal]



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
var _menuFocoPlaceholder = null;
var _menuFocoPortal = null;
var _menuFocoReturning = false;

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

/* MODO GAVETA — a categoria continua no armário e abre no próprio lugar.
   Não há portal, reparenting, backdrop ou ocultação global. O estado serve
   somente para preservar a posição de origem e a restauração determinística. */
function _menuFocoCriarPortal() { return null; }

function _menuFocoAtivar(acc) {
  if (!acc || !acc.id || _menuFocoReturning) return;
  if (_menuFocoId === acc.id) return;
  if (_menuFocoId) _menuFocoDesativar(false);

  _menuFocoScrollX = window.scrollX || window.pageXOffset || 0;
  _menuFocoScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  _cardapioScrollAnterior[acc.id] = { left: _menuFocoScrollX, top: _menuFocoScrollY };
  _menuFocoId = acc.id;
  _menuFocoPortal = null;
  acc.classList.add('menu-foco-ativo');
  acc.classList.remove('menu-foco-scroll-livre');
  var cardapio = document.getElementById('cardapio');
  var vcWrap = document.getElementById('vc-wrap');
  if (cardapio) cardapio.classList.add('menu-foco-cardapio');
  if (vcWrap) vcWrap.classList.add('menu-foco-armario');
  document.documentElement.classList.add('menu-foco-aberto');
  document.body.classList.add('menu-foco-aberto');
}

function _menuFocoDesativar(restaurarPosicao) {
  var id = _menuFocoId;
  if (!id) return;
  var acc = document.getElementById(id);
  var x = _menuFocoScrollX;
  var y = _menuFocoScrollY;
  if (acc) {
    acc.classList.remove('menu-foco-ativo');
    acc.classList.remove('menu-foco-scroll-livre');
  }
  var cardapio = document.getElementById('cardapio');
  var vcWrap = document.getElementById('vc-wrap');
  if (cardapio) cardapio.classList.remove('menu-foco-cardapio');
  if (vcWrap) vcWrap.classList.remove('menu-foco-armario');
  document.documentElement.classList.remove('menu-foco-aberto');
  document.body.classList.remove('menu-foco-aberto');
  _menuFocoId = null;
  _menuFocoPlaceholder = null;
  _menuFocoPortal = null;
  if (restaurarPosicao) _restaurarPosicaoCardapio(x, y);
}

function _menuFocoVoltar(acc) {
  if (!acc || _menuFocoReturning) return;
  _menuFocoReturning = true;
  var body = acc.querySelector('.acc-body');
  var id = acc.id;
  var x = _menuFocoScrollX;
  var y = _menuFocoScrollY;
  var fechar = function() {
    if (body && _nivelAnterior[id]) {
      body.innerHTML = _nivelAnterior[id];
      delete _nivelAnterior[id];
    }
    acc.classList.remove('open');
    atualizarEstadoHeaderAcc(acc, false);
    if (body) body.style.maxHeight = '0';
    _menuFocoDesativar(false);
    _menuFocoReturning = false;
    _restaurarPosicaoCardapio(x, y);
  };
  requestAnimationFrame(fechar);
}


// ═══════════════════════════════════════════════════════════════════════════
// _semPulo() — TÉCNICA PADRÃO DOS GRANDES SITES (iFood, Rappi, WhatsApp Web)
// Congela a posição da tela ANTES de qualquer mudança de conteúdo.
// Restaura a posição DEPOIS no próximo frame — antes do browser autorrolar.
// Recalcula a altura do accordion para não quebrar a animação.
// USO: _semPulo(function() { /* qualquer mudança de conteúdo */ });
// ═══════════════════════════════════════════════════════════════════════════
function _semPulo(fn) {
  var x = window.scrollX || window.pageXOffset || 0;
  var y = window.scrollY || window.pageYOffset || 0;
  fn(); // executa a mudança
  // Restaura posição em múltiplos frames para garantir estabilidade no mobile
  var aplicar = function() { window.scrollTo(x, y); };
  aplicar();
  requestAnimationFrame(function() {
    aplicar();
    requestAnimationFrame(aplicar);
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
  if (!el) return bodyIdHint ? document.getElementById(bodyIdHint) : null;
  // 1. Tenta closest direto
  var found = el.closest ? el.closest('.acc-body') : null;
  if (found) return found;
  // 2. Sobe manualmente até 15 níveis
  var cur = el.parentElement;
  for (var i = 0; i < 15; i++) {
    if (!cur) break;
    if (cur.classList && cur.classList.contains('acc-body')) return cur;
    cur = cur.parentElement;
  }
  // 3. Tenta encontrar pelo acc pai
  var acc = el.closest ? el.closest('.acc') : null;
  if (acc) {
    var accBody = acc.querySelector('.acc-body');
    if (accBody) return accBody;
    if (CARDAPIO_MAP[acc.id]) return document.getElementById(CARDAPIO_MAP[acc.id].bodyId);
  }
  // 4. Fallback direto para o ID fornecido
  if (bodyIdHint) return document.getElementById(bodyIdHint);
  return null;
}

// Mostra sabores/itens inline dentro do acc-body — SEM PULO (padrão iFood)
function mostrarSaboresInline(accBodyEl, titulo, sub, chips) {
  if (!accBodyEl) return;
  var accId = accBodyEl.closest && accBodyEl.closest('.acc') ? accBodyEl.closest('.acc').id : accBodyEl.id;
  if (accId) _nivelAnterior[accId] = accBodyEl.innerHTML;
  var acc = accBodyEl.closest && accBodyEl.closest('.acc') ? accBodyEl.closest('.acc') : null;
  if (acc) _menuFocoAtivar(acc);

  var chipsHtml = (chips && chips.length > 0) ? chips.map(function(s) {
    return '<span class="chip-inline">' + s + '</span>';
  }).join('') : '<div style="font-size:12px;color:#888;padding:10px">Sabores indisponíveis no momento.</div>';

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
      _semPulo(restaurarNivel);
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
  var chips = sabs;
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





// Scroll Reveal Animation
document.addEventListener('DOMContentLoaded', function() {
  const reveals = document.querySelectorAll('.reveal');
  
  function revealOnScroll() {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;
    
    reveals.forEach(reveal => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add('active');
      }
    });
  }
  
  window.addEventListener('scroll', revealOnScroll, { passive: true });
  revealOnScroll(); // Trigger on load
});

  


function sincronizarEspacoCookie(ativo) {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (window.__cookieResizeHandler) {
    window.removeEventListener('resize', window.__cookieResizeHandler);
    window.__cookieResizeHandler = null;
  }
  if (!ativo) {
    document.body.classList.remove('cookie-banner-open');
    document.documentElement.style.setProperty('--cookie-space', '0px');
    return;
  }
  document.body.classList.add('cookie-banner-open');
  const atualizar = () => {
    const altura = Math.ceil(banner.getBoundingClientRect().height || 0);
    document.documentElement.style.setProperty('--cookie-space', `${altura + 16}px`);
  };
  window.__cookieResizeHandler = atualizar;
  window.addEventListener('resize', atualizar, { passive: true });
  requestAnimationFrame(atualizar);
}
function reabrirCookieBanner() {
  localStorage.removeItem('cookies_aceitos');
  document.getElementById('cookie-banner').style.display = 'block';
  sincronizarEspacoCookie(true);
}
function checkCookies() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  if (!localStorage.getItem('cookies_aceitos')) {
    banner.style.display = 'block';
    sincronizarEspacoCookie(true);
  } else {
    banner.style.display = 'none';
    sincronizarEspacoCookie(false);
  }
}
function aceitarCookies() {
  localStorage.setItem('cookies_aceitos', 'true');
  document.getElementById('cookie-banner').style.display = 'none';
  sincronizarEspacoCookie(false);
  if(typeof gtag === 'function') {
    gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    });
  }
}
function recusarCookies() {
  localStorage.setItem('cookies_aceitos', 'false');
  document.getElementById('cookie-banner').style.display = 'none';
  sincronizarEspacoCookie(false);
  if(typeof gtag === 'function') {
    gtag('consent', 'update', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied'
    });
  }
}
document.addEventListener('DOMContentLoaded', checkCookies);










