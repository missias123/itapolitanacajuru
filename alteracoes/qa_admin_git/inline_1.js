
/* =====================================================
   VALIDAÇÃO PROFISSIONAL — JAVASCRIPT
   ===================================================== */

// Contador de caracteres em tempo real
function initContadores() {
  document.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(el => {
    const max = parseInt(el.getAttribute('maxlength'));
    if (!max) return;
    
    // Criar contador
    const counter = document.createElement('span');
    counter.className = 'char-counter';
    counter.textContent = `0/${max}`;
    el.parentElement.style.position = 'relative';
    el.parentElement.appendChild(counter);
    
    // Atualizar contador ao digitar
    el.addEventListener('input', () => {
      const len = el.value.length;
      counter.textContent = `${len}/${max}`;
      counter.className = 'char-counter';
      if (len >= max) {
        counter.classList.add('limite');
        el.classList.add('campo-erro');
      } else if (len >= max * 0.85) {
        counter.classList.add('quase');
        el.classList.remove('campo-erro');
      } else {
        el.classList.remove('campo-erro');
        if (len > 0) el.classList.add('campo-ok');
        else el.classList.remove('campo-ok');
      }
    });
    
    // Inicializar com valor atual
    if (el.value.length > 0) {
      el.dispatchEvent(new Event('input'));
    }
  });
}

// Válidação de WhatsApp em tempo real
function initVálidacaoWhatsApp() {
  const el = document.getElementById('cfg-whatsapp');
  if (!el) return;
  
  el.addEventListener('input', () => {
    const val = el.value.replace(/\D/g, '');
    el.value = val; // Remover não-números automaticamente
    
    const erroEl = el.parentElement.querySelector('.erro-inline') || criarErroInline(el);
    
    if (val.length > 0 && (val.length < 12 || val.length > 13)) {
      el.classList.add('campo-erro');
      el.classList.remove('campo-ok');
      erroEl.textContent = `⚠️ WhatsApp deve ter 12-13 dígitos (ex: 5516996062046). Atual: ${val.length} dígitos`;
      erroEl.classList.add('ativo');
    } else if (val.length >= 12) {
      el.classList.remove('campo-erro');
      el.classList.add('campo-ok');
      erroEl.classList.remove('ativo');
    }
  });
}

// Válidação de preço em tempo real
function initVálidacaoPreços() {
  document.querySelectorAll('input[type="number"][id*="preço"], input[type="number"][id*="valor"]').forEach(el => {
    el.addEventListener('input', () => {
      const val = parseFloat(el.value);
      const erroEl = el.parentElement.querySelector('.erro-inline') || criarErroInline(el);
      
      if (isNaN(val) || val < 0) {
        el.classList.add('campo-erro');
        erroEl.textContent = '⚠️ Preço deve ser um número positivo (ex: 15.00)';
        erroEl.classList.add('ativo');
      } else if (val > 999) {
        el.classList.add('campo-erro');
        erroEl.textContent = '⚠️ Preço acima de R$999? Verifique se está correto.';
        erroEl.classList.add('ativo');
      } else {
        el.classList.remove('campo-erro');
        el.classList.add('campo-ok');
        erroEl.classList.remove('ativo');
      }
    });
  });
}

// Criar elemento de erro inline
function criarErroInline(el) {
  const div = document.createElement('div');
  div.className = 'erro-inline';
  el.parentElement.appendChild(div);
  return div;
}

// Conversão automática de imagem para WebP via Canvas API
function processarImagem(file, maxWidth, maxHeight, qualidade, callback) {
  if (!file || !file.type.startsWith('image/')) {
    callback(null, 'Arquivo não é uma imagem válida');
    return;
  }
  
  // Verificar tamanho máximo (5MB antes de processar)
  if (file.size > 5 * 1024 * 1024) {
    callback(null, 'Imagem muito grande (máx. 5MB). Escolha uma imagem menor.');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Calcular dimensões mantendo proporção
      let w = img.width;
      let h = img.height;
      
      if (w > maxWidth) {
        h = Math.round(h * maxWidth / w);
        w = maxWidth;
      }
      if (h > maxHeight) {
        w = Math.round(w * maxHeight / h);
        h = maxHeight;
      }
      
      // Desenhar no canvas
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      
      // Exportar como WebP
      canvas.toBlob((blob) => {
        if (!blob) {
          callback(null, 'Erro ao processar imagem');
          return;
        }
        
        const tamanhoKB = Math.round(blob.size / 1024);
        // Converter blob para dataUrl para uso em preview e upload base64
        const reader2 = new FileReader();
        reader2.onload = (ev) => {
          const info = {
            blob,
            dataUrl: ev.target.result,   // data:image/webp;base64,...
            width: w,
            height: h,
            tamanhoKB,
            tamanho: blob.size,
            formato: 'WebP',
            reducao: Math.round((1 - blob.size / file.size) * 100)
          };
          callback(info, null);
        };
        reader2.readAsDataURL(blob);
      }, 'image/webp', qualidade);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Criar campo de upload de imagem profissional
function criarUploadImagem(containerId, opções) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const {
    label = 'Imagem',
    maxWidth = 1200,
    maxHeight = 630,
    maxKB = 300,
    qualidade = 0.82,
    hint = '',
    obrigatório = false,
    onProcessada = null
  } = opções;
  
  container.innerHTML = `
    <div class="campo-edit">
      <label class="${obrigatório ? 'label-obrigatório' : ''}">${label}</label>
      <div style="background:#fff3e0;border:1.5px solid #ffcc80;border-radius:10px;padding:10px 14px;margin-bottom:10px;font-size:.8rem;color:#bf360c;line-height:1.7">
        <strong>📋 Especificações da imagem:</strong><br>
        📐 <strong>Dimensões:</strong> até ${maxWidth} × ${maxHeight} px — redimensionado automaticamente se maior<br>
        💾 <strong>Tamanho máximo:</strong> ${maxKB} KB após conversão<br>
        🖼️ <strong>Formatos aceitos:</strong> JPG, JPEG, PNG, WebP, HEIC<br>
        ⚡ <strong>Conversão automática:</strong> toda imagem é salva como WebP no GitHub
      </div>
      <div class="upload-area" id="${containerId}-area">
        <input type="file" accept="image/*" id="${containerId}-input"/>
        <div class="upload-icon">📷</div>
        <div class="upload-texto">Clique ou arraste a imagem aqui</div>
        <div class="upload-regras">
          <span>📐 ${maxWidth}×${maxHeight}px</span>
          <span>💾 Máx. ${maxKB}KB</span>
          <span>🖼️ JPG · PNG · WebP</span>
          <span>⚡ → WebP automático</span>
        </div>
      </div>
      <div class="upload-progress"><div class="upload-progress-bar" id="${containerId}-prog"></div></div>
      <div class="img-preview-wrap" id="${containerId}-preview-wrap">
        <img class="img-preview" id="${containerId}-preview" src="" alt="Preview"/>
        <div class="img-preview-info" id="${containerId}-info"></div>
      </div>
      <div class="erro-inline" id="${containerId}-erro"></div>
      ${hint ? `<div class="hint">${hint}</div>` : ''}
    </div>
  `;
  
  const input = document.getElementById(`${containerId}-input`);
  const previewWrap = document.getElementById(`${containerId}-preview-wrap`);
  const previewImg = document.getElementById(`${containerId}-preview`);
  const infoEl = document.getElementById(`${containerId}-info`);
  const erroEl = document.getElementById(`${containerId}-erro`);
  const progBar = document.getElementById(`${containerId}-prog`);
  const area = document.getElementById(`${containerId}-area`);
  
  // Drag & Drop
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processarUpload(file);
  });
  
  input.addEventListener('change', () => {
    if (input.files[0]) processarUpload(input.files[0]);
  });
  
  function processarUpload(file) {
    erroEl.classList.remove('ativo');
    progBar.parentElement.style.display = 'block';
    progBar.style.width = '30%';
    
    processarImagem(file, maxWidth, maxHeight, qualidade, (info, erro) => {
      progBar.style.width = '100%';
      
      setTimeout(() => {
        progBar.parentElement.style.display = 'none';
        progBar.style.width = '0%';
      }, 500);
      
      if (erro) {
        erroEl.textContent = '❌ ' + erro;
        erroEl.classList.add('ativo');
        previewWrap.classList.remove('ativo');
        return;
      }
      
      // Mostrar preview
      const url = URL.createObjectURL(info.blob);
      previewImg.src = url;
      previewWrap.classList.add('ativo');
      
      // Mostrar informações
      const statusKB = info.tamanhoKB <= maxKB ? 'info-ok' : 'info-aviso';
      infoEl.innerHTML = `
        <span class="info-ok">✅ WebP convertido</span>
        <span>${info.width}×${info.height}px</span>
        <span class="${statusKB}">${info.tamanhoKB}KB ${info.reducao > 0 ? `(${info.reducao}% menor)` : ''}</span>
      `;
      
      if (info.tamanhoKB > maxKB) {
        erroEl.textContent = `⚠️ Imagem ainda grande (${info.tamanhoKB}KB). Recomendado: máx. ${maxKB}KB. Tente uma imagem menor.`;
        erroEl.classList.add('ativo');
      }
      
      // Callback com o blob processado
      if (onProcessada) onProcessada(info.blob, info);
    });
  }
}

// Inicializar tudo quando o admin carregar
// =====================================================
// DOMContentLoaded ÚNICO DO ADMIN — orquestra tudo
// Padrão profissional: um único ponto de entrada
// =====================================================
document.addEventListener('DOMContentLoaded', () => {

  // 0. Guard: remove qualquer texto "solto" no <body> (bug clássico quando algo fica fora de <script>/<style>)
  // Isso evita aparecer texto indesejado abaixo do painel admin em caso de regressões de marcação.
  try{
    const soltos = Array.from(document.body.childNodes)
      .filter(n => n && n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length);
    soltos.forEach(n => n.remove());
  }catch(e){}

  // 0. Carrega a sessão já ativa nesta aba e mostra o status ao usuário
  try { preencherTokenSalvoNoLogin(); } catch(e) { console.warn('[Admin] preencherTokenSalvoNoLogin', e); }
  try { carregarConfigAdmin(); } catch(e) { console.warn('[Admin] carregarConfigAdmin', e); }

  // 1. Spellcheck e autocorreção em todos os campos
  if (typeof aplicarSpellcheck === 'function') aplicarSpellcheck();
  if (typeof aplicarAutocorrecao === 'function') aplicarAutocorrecao();

  // 2. Dirty-check: qualquer digitação no admin-app marca como alterado
  const adminApp = document.getElementById('admin-app');
  if (adminApp) {
    adminApp.addEventListener('input', e => {
      // Ignora campos de busca/filtro (não são dados persistíveis)
      const ignorePatterns = ['busca','filtro','search','pesquisa'];
      const id = (e.target.id || '').toLowerCase();
      if (!ignorePatterns.some(p => id.includes(p))) markDirty();
    });
  }

  // 2. Aguardar login para inicializar contadores e validações
  const _adminObserver = new MutationObserver(() => {
    const adminAppLogin=document.getElementById('admin-app');
    if(adminAppLogin&&adminAppLogin.style.display!=='none'){
      setTimeout(() => {
        if (typeof initContadores === 'function') initContadores();
        if (typeof initVálidacaoWhatsApp === 'function') initVálidacaoWhatsApp();
        if (typeof initVálidacaoPrecos === 'function') initVálidacaoPrecos();
      }, 300);
      _adminObserver.disconnect();
    }
  });
  _adminObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });

});

// =====================================================================
// SISTEMA DE PORTUGUÊS PERFEITO — Padrão grandes sites (iFood, Nubank)
// Camada 1: spellcheck nativo do navegador em todos os campos de texto
// Camada 2: autocorreção automática de erros comuns
// Camada 3: validação antes de salvar que avisa sobre erros
// =====================================================================
(function ativarPortuguesPerfeito() {

  // --- CAMADA 1: spellcheck nativo em todos os campos ---
  function aplicarSpellcheck() {
    document.querySelectorAll('input[type="text"], input[type="search"], textarea').forEach(el => {
      el.setAttribute('spellcheck', 'true');
      el.setAttribute('lang', 'pt-BR');
      el.setAttribute('autocomplete', 'off');
    });
  }

  // --- CAMADA 2: dicionário de autocorreção automática ---
  const AUTOCORRECOES = {
    // Erros de acento comuns
    'voce': 'você', 'Voce': 'Você', 'VOCE': 'VOCÊ',
    'nao': 'não', 'Nao': 'Não',
    'sao': 'são', 'Sao': 'São',
    'tambem': 'também', 'Tambem': 'Também',
    'ate': 'até', 'Ate': 'Até',
    'so': 'só', 'So': 'Só',
    'la': 'lá', 'La': 'Lá',
    'ja': 'já', 'Ja': 'Já',
    'ola': 'olá', 'Ola': 'Olá',
    'obrigado': 'obrigado', // correto
    'pagina': 'página', 'Pagina': 'Página',
    'cardapio': 'cardápio', 'Cardapio': 'Cardápio',
    'promocao': 'promoção', 'Promocao': 'Promoção',
    'configuracao': 'configuração', 'Configuracao': 'Configuração',
    'configuracoes': 'configurações', 'Configuracoes': 'Configurações',
    'encomenda': 'encomenda', // correto
    'fidelidade': 'fidelidade', // correto
    'sorvete': 'sorvete', // correto
    'açaí': 'açaí', 'Açaí': 'Açaí',
    'picole': 'picolé', 'Picole': 'Picolé',
    'milkshake': 'milkshake', // correto
    'preco': 'preço', 'Preco': 'Preço',
    'precos': 'preços', 'Precos': 'Preços',
    'sabor': 'sabor', // correto
    'sabores': 'sabores', // correto
    'estoque': 'estoque', // correto
    'esgotado': 'esgotado', // correto
    'disponivel': 'disponível', 'Disponivel': 'Disponível',
    'disponiveis': 'disponíveis', 'Disponiveis': 'Disponíveis',
    'necessario': 'necessário', 'Necessario': 'Necessário',
    'necessarios': 'necessários', 'Necessarios': 'Necessários',
    'unitario': 'unitário', 'Unitario': 'Unitário',
    'localizacao': 'localização', 'Localizacao': 'Localização',
    'exibicao': 'exibição', 'Exibicao': 'Exibição',
    'endereco': 'endereço', 'Endereco': 'Endereço',
    'telefone': 'telefone', // correto
    'numero': 'número', 'Numero': 'Número',
    'numeros': 'números', 'Numeros': 'Números',
    'titulo': 'título', 'Titulo': 'Título',
    'subtitulo': 'subtítulo', 'Subtitulo': 'Subtítulo',
    'descricao': 'descrição', 'Descricao': 'Descrição',
    'horario': 'horário', 'Horario': 'Horário',
    'horarios': 'horários', 'Horarios': 'Horários',
    'categoria': 'categoria', // correto
    'categorias': 'categorias', // correto
    'adicionar': 'adicionar', // correto
    'remover': 'remover', // correto
    'salvar': 'salvar', // correto
    'cancelar': 'cancelar', // correto
    'confirmar': 'confirmar', // correto
    'atualizar': 'atualizar', // correto
    'excluir': 'excluir', // correto
    'editar': 'editar', // correto
    'visualizar': 'visualizar', // correto
    'imagem': 'imagem', // correto
    'imagens': 'imagens', // correto
    'produto': 'produto', // correto
    'produtos': 'produtos', // correto
    'pedido': 'pedido', // correto
    'pedidos': 'pedidos', // correto
    'cliente': 'cliente', // correto
    'clientes': 'clientes', // correto
    'premio': 'prêmio', 'Premio': 'Prêmio',
    'premios': 'prêmios', 'Premios': 'Prêmios',
    'codigo': 'código', 'Codigo': 'Código',
    'codigos': 'códigos', 'Codigos': 'Códigos',
    'pontos': 'pontos', // correto
    'sorteio': 'sorteio', // correto
    'sorteios': 'sorteios', // correto
    'participante': 'participante', // correto
    'participantes': 'participantes', // correto
    'inscricao': 'inscrição', 'Inscricao': 'Inscrição',
    'inscricoes': 'inscrições', 'Inscricoes': 'Inscrições',
    'whatsapp': 'WhatsApp',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
  };

  function autocorrigirTexto(texto) {
    // Corrigir palavra por palavra
    return texto.replace(/\b(\w+)\b/g, (palavra) => {
      return AUTOCORRECOES[palavra] || palavra;
    });
  }

  // Aplicar autocorreção ao sair do campo (blur)
  function aplicarAutocorrecao() {
    document.querySelectorAll('input[type="text"], textarea').forEach(el => {
      el.addEventListener('blur', function() {
        const corrigido = autocorrigirTexto(this.value);
        if (corrigido !== this.value) {
          this.value = corrigido;
          this.style.borderColor = '#2e7d32';
          setTimeout(() => { this.style.borderColor = ''; }, 1500);
        }
      });
    });
  }

  // --- CAMADA 3: validação antes de salvar ---
  const PALAVRAS_SUSPEITAS = [
    /\b[A-Z]{5,}\b/,  // palavras todas em maiúsculo (grito)
    /[a-z]{3,}ao\b/,  // palavras terminando em 'ao' sem til (ex: configuracao)
    /[a-z]{3,}oes\b/, // palavras terminando em 'oes' sem til (ex: configuracoes)
    /[a-z]{3,}e\b(?!s)/, // palavras terminando em 'e' que deveriam ter acento
  ];

  // Interceptar funções de salvar para validar português
  const fnsSalvar = ['salvarHome', 'salvarPreços', 'salvarPromoção', 'salvarConfig',
                     'salvarConfigFidelidade', 'salvarSabores', 'salvarEstoque'];

  fnsSalvar.forEach(nome => {
    const original = window[nome];
    if (typeof original === 'function') {
      window[nome] = async function(...args) {
        // Verificar todos os campos de texto visíveis
        const campos = document.querySelectorAll('.seção.ativo input[type="text"], .seção.ativo textarea');
        let avisos = [];
        campos.forEach(el => {
          const val = el.value.trim();
          if (!val) return;
          // Verificar erros comuns
          if (/[a-z]{4,}ao\b/.test(val) && !/[\u00e3\u00e2]/.test(val)) {
            const label = el.closest('.campo-edit')?.querySelector('label')?.textContent || el.id;
            avisos.push(`"${label}": verifique acentuação (ex: configuração, não, são)`);
          }
        });
        if (avisos.length > 0) {
          const ok = confirm(
            '⚠️ Possíveis erros de português detectados:\n\n' +
            avisos.slice(0, 3).join('\n') +
            '\n\nDeseja salvar mesmo assim?'
          );
          if (!ok) return;
        }
        return original.apply(this, args);
      };
    }
  });

  // [aplicarSpellcheck e aplicarAutocorrecao fundidas no DOMContentLoaded principal]

  // Reaplicar quando o usuário navegar entre seções
  const origIrPara = window.irPara;
  if (typeof origIrPara === 'function') {
    window.irPara = function(...args) {
      const r = origIrPara.apply(this, args);
      setTimeout(() => { aplicarSpellcheck(); aplicarAutocorrecao(); }, 300);
      return r;
    };
  }

  // --- CAMADA 4: Aviso de alterações não salvas (padrão Shopify/WordPress) ---
  let _temAlteracoesNaoSalvas = false;

  function marcarAlterado() { _temAlteracoesNaoSalvas = true; }
  function marcarSalvo()    { _temAlteracoesNaoSalvas = false; }

  // Detectar mudanças em qualquer campo do admin
  document.addEventListener('input', function(e) {
    if (e.target.matches('input, textarea, select')) marcarAlterado();
  });

  // Interceptar salvarArquivo para marcar como salvo após sucesso
  const _origSalvarArquivo = window.salvarArquivo;
  if (typeof _origSalvarArquivo === 'function') {
    window.salvarArquivo = async function(...args) {
      const resultado = await _origSalvarArquivo.apply(this, args);
      if (resultado) marcarSalvo();
      return resultado;
    };
  }

  // Aviso ao tentar sair da página com alterações não salvas
  window.addEventListener('beforeunload', function(e) {
    if (_temAlteracoesNaoSalvas) {
      e.preventDefault();
      e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
      return e.returnValue;
    }
  });

  // Expor funções para uso externo
  window._adminMarcarAlterado = marcarAlterado;
  window._adminMarcarSalvo    = marcarSalvo;

})();

// ── TÍTULOS DO CARDÁPIO (GitHub API) ─────────────────────────────────────────
function carregarTitulosCardapio() {
  // Preferência: dados do GitHub (STATE.config), fallback localStorage
  var titulos = (STATE.config && STATE.config.titulosCardapio)
    ? STATE.config.titulosCardapio
    : JSON.parse(localStorage.getItem('cfg_titulos_cardapio') || '{}');
  var campos = [
    ['acc-sorvetes-titulo','Sorvetes de Massa'],
    ['acc-sorvetes-sub','Cremoso, gelado, irresistível · 35 sabores pra você escolher'],
    ['acc-picoles-titulo','Picolés'],
    ['acc-picoles-sub','Refrescante e gostoso · Fruta, Leite, Recheado, Ninho, Esquimó'],
    ['acc-açaí-promo-titulo','🔥 Açaí em Promoção'],
    ['acc-açaí-promo-sub','Aproveite agora! 8 combos irresistíveis · 400ml a 700ml'],
    ['acc-açaí-titulo','Açaí Natureon'],
    ['acc-açaí-sub','O melhor açaí da região · Cremoso, gelado e com muitos complementos'],
    ['acc-milk-titulo','Milkshakes'],
    ['acc-milk-sub','Cremoso e gelado · Tradicional e Top · 35 sabores'],
    ['acc-tacas-titulo','Taças'],
    ['acc-tacas-sub','Uma experiência única · Colegial, Sundae, Banana Split e mais'],
    ['acc-tacas-p-titulo','Taças Premium (Taças Sujas)'],
    ['acc-tacas-p-sub','O melhor da sorveteria · Prestígio, Kit Kat, Unicórnio e mais'],
    ['acc-iso-titulo','Isopores de Viagem'],
    ['acc-iso-sub','Leve o prazer para casa · 4 tamanhos disponíveis'],
    ['acc-sobremesas-titulo','Sobremesas Geladas'],
    ['acc-sobremesas-sub','Momentos especiais merecem isso · Fondue, Petit Gâteau, Brownie e mais'],
    ['acc-caixas-titulo','Sorvetes em Caixa 5 e 10 Litros'],
    ['acc-caixas-sub','Ideal para festas e eventos · 2 ou 3 sabores à escolha'],
    ['acc-torta-titulo','Tortas de Sorvete'],
    ['acc-torta-sub','Faça a festa! 3 sabores · Encomende com 3 dias de antecedência'],
    ['acc-enc-picoles-titulo','Picolés para Encomenda'],
    ['acc-enc-picoles-sub','Preço especial de atacado · 5 tipos · Mín. 100 unidades'],
    ['acc-complementos-titulo','Complementos para Sorvetes'],
    ['acc-complementos-sub','Canudinho, Casquinha, Cascão, Cestinha, Cobertura']
  ];
  campos.forEach(function(c) {
    var el = document.getElementById(c[0]);
    if (el) el.value = titulos[c[0]] || c[1];
  });
}

async function salvarTitulosCardapio() {
  var campos = ['acc-sorvetes-titulo','acc-sorvetes-sub','acc-picoles-titulo','acc-picoles-sub',
    'acc-açaí-promo-titulo','acc-açaí-promo-sub','acc-açaí-titulo','acc-açaí-sub',
    'acc-milk-titulo','acc-milk-sub','acc-tacas-titulo','acc-tacas-sub',
    'acc-tacas-p-titulo','acc-tacas-p-sub','acc-iso-titulo','acc-iso-sub',
    'acc-sobremesas-titulo','acc-sobremesas-sub','acc-caixas-titulo','acc-caixas-sub',
    'acc-torta-titulo','acc-torta-sub','acc-enc-picoles-titulo','acc-enc-picoles-sub',
    'acc-complementos-titulo','acc-complementos-sub'];
  var titulos = {};
  campos.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) titulos[id] = el.value.trim();
  });
  const cfg = STATE.config || {};
  cfg.titulosCardapio = titulos;
  STATE.config = cfg;
  // Manter localStorage como fallback para browsers offline
  try { localStorage.setItem('cfg_titulos_cardapio', JSON.stringify(titulos)); } catch(e) {}
  const ok = await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar títulos do cardápio');
}

// ── CARDÁPIO COMPLETO ──────────────────────────────────────────────────────
// ── CARDÁPIO — TABELAS DE PREÇO (padrão iFood/Baskin-Robbins) ────────────────
function _precoRowHTML(nome, preco, placeholder) {
  const n = String(nome||'').replace(/"/g,'&quot;');
  const p = Number(preco||0).toFixed(2);
  return `<div class="preco-row" style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
    <input type="text" class="preco-nome" value="${n}" placeholder="${placeholder||'Nome do item'}" style="flex:2;padding:8px 10px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.9rem;background:#fafafa"/>
    <div style="display:flex;align-items:center;gap:4px;background:#fff8f0;border:1.5px solid #f0c070;border-radius:8px;padding:5px 10px">
      <span style="font-size:.78rem;color:#999;font-weight:700">R$</span>
      <input type="number" class="preco-valor" value="${p}" min="0" step="0.5" style="width:65px;border:none;outline:none;font-size:.95rem;font-weight:900;color:#e65100;background:transparent;text-align:right"/>
    </div>
    <button class="btn btn-erro btn-sm" onclick="this.closest('.preco-row').remove()" title="Remover item" style="padding:5px 9px">🗑️</button>
  </div>`;
}
function renderCardapioPrecoTabela(containerId, obj, placeholder) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const items = Object.entries(obj||{});
  el.innerHTML = items.length
    ? items.map(([nome,preco]) => _precoRowHTML(nome, preco, placeholder)).join('')
    : `<p style="color:#bbb;font-size:.82rem;padding:6px 2px">Nenhum item ainda — clique em ➕ Adicionar abaixo.</p>`;
}
function addCardapioPrecoRow(containerId, placeholder) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const p = el.querySelector('p');
  if (p) p.remove();
  el.insertAdjacentHTML('beforeend', _precoRowHTML('', 0, placeholder||'Nome'));
  el.querySelectorAll('.preco-nome').forEach((inp,_,arr)=>{ if(inp===arr[arr.length-1]) inp.focus(); });
}
function readCardapioPrecoTabela(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return {};
  const obj = {};
  el.querySelectorAll('.preco-row').forEach(row => {
    const nome = (row.querySelector('.preco-nome')?.value||'').trim();
    const preco = parseFloat(row.querySelector('.preco-valor')?.value||'0')||0;
    if (nome) obj[nome] = preco;
  });
  return obj;
}
// Açaí Promo — 3 colunas: Tamanho/Nome | Descrição | Preço
function _promoComboRowHTML(nome, desc, preco) {
  const n = String(nome||'').replace(/"/g,'&quot;');
  const d = String(desc||'').replace(/"/g,'&quot;');
  const p = Number(preco||0).toFixed(2);
  return `<div class="promo-combo-row" style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
    <input type="text" class="combo-nome" value="${n}" placeholder="Ex: 400ml" style="flex:1;min-width:80px;padding:7px 9px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.88rem;background:#fafafa"/>
    <input type="text" class="combo-desc" value="${d}" placeholder="Descrição curta (opcional)" style="flex:2;min-width:120px;padding:7px 9px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.88rem;background:#fafafa"/>
    <div style="display:flex;align-items:center;gap:4px;background:#fff8f0;border:1.5px solid #f0c070;border-radius:8px;padding:5px 10px">
      <span style="font-size:.78rem;color:#999;font-weight:700">R$</span>
      <input type="number" class="combo-preco" value="${p}" min="0" step="0.5" style="width:60px;border:none;outline:none;font-size:.95rem;font-weight:900;color:#e65100;background:transparent;text-align:right"/>
    </div>
    <button class="btn btn-erro btn-sm" onclick="this.closest('.promo-combo-row').remove()" title="Remover" style="padding:5px 9px">🗑️</button>
  </div>`;
}
function renderCardapioPromoTabela(containerId, lista) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = (lista&&lista.length)
    ? lista.map(i => _promoComboRowHTML(i.nome, i.desc, i.preco)).join('')
    : `<p style="color:#bbb;font-size:.82rem;padding:6px 2px">Nenhum combo ainda — clique em ➕ Adicionar abaixo.</p>`;
}
function addCardapioPromoCombo() {
  const el = document.getElementById('card-açaí-promo-tabela');
  if (!el) return;
  const p = el.querySelector('p'); if (p) p.remove();
  el.insertAdjacentHTML('beforeend', _promoComboRowHTML('','',0));
  el.querySelectorAll('.combo-nome').forEach((inp,_,arr)=>{ if(inp===arr[arr.length-1]) inp.focus(); });
}
function readCardapioPromoTabela() {
  const el = document.getElementById('card-açaí-promo-tabela');
  if (!el) return [];
  const arr = [];
  el.querySelectorAll('.promo-combo-row').forEach(row => {
    const nome = (row.querySelector('.combo-nome')?.value||'').trim();
    const desc = (row.querySelector('.combo-desc')?.value||'').trim();
    const preco = parseFloat(row.querySelector('.combo-preco')?.value||'0')||0;
    if (nome) arr.push({nome, desc, preco});
  });
  return arr;
}

function preencherCardapio() {
  const p = STATE.produtos;
  if (!p) {
    adminMostrarErroCarregamento('card-sorvetes-sabores', 'dados/produtos.json');
    return;
  }

  // Sorvetes
  if (p.sorvetes && p.sorvetes.sabores) {
    document.getElementById('card-sorvetes-sabores').value = p.sorvetes.sabores.join('\n');
  }

  // Picolés
  if (p.picoles) {
    if (p.picoles.frutas_agua) document.getElementById('card-picoles-fruta').value = (p.picoles.frutas_agua.sabores || []).join('\n');
    if (p.picoles.leite_sem_recheio) document.getElementById('card-picoles-leite').value = (p.picoles.leite_sem_recheio.sabores || []).join('\n');
    if (p.picoles.leite_com_recheio) document.getElementById('card-picoles-recheado').value = (p.picoles.leite_com_recheio.sabores || []).join('\n');
    if (p.picoles.leite_ninho) document.getElementById('card-picoles-ninho').value = (p.picoles.leite_ninho.sabores || []).join('\n');
    if (p.picoles.ovomaltine) document.getElementById('card-picoles-ovomaltine').value = (p.picoles.ovomaltine.sabores || []).join('\n');
    if (p.picoles.esquimós) document.getElementById('card-picoles-esquimo').value = (p.picoles.esquimós.sabores || []).join('\n');
  }

  // Açaí Promoção — tabela 3 colunas
  renderCardapioPromoTabela('card-açaí-promo-tabela', p.acai_promocao || []);

  // Açaí Tipo Artesanal — tabela 2 colunas
  if (p.acai) {
    renderCardapioPrecoTabela('card-açaí-tamanhos-tabela', p.acai.copos || {}, 'Ex: 400ml');
    if (p.acai.complementos) {
      let comps = [];
      Object.entries(p.acai.complementos).forEach(([cat, dados]) => {
        comps.push(`--- ${cat.toUpperCase()} (R$ ${Number(dados.preco||0).toFixed(2).replace('.',',')}) ---`);
        comps = comps.concat(dados.itens||[]);
      });
      document.getElementById('card-açaí-complementos').value = comps.join('\n');
    }
  }

  // Milkshakes
  if (p.milkshake) {
    if (Array.isArray(p.milkshake.sabores)) document.getElementById('card-milk-sabores').value = p.milkshake.sabores.join('\n');
    renderCardapioPrecoTabela('card-milk-trad-tabela', p.milkshake.tradicional || {}, 'Ex: 400ml');
    renderCardapioPrecoTabela('card-milk-top-tabela', p.milkshake.top || {}, 'Ex: 600ml');
    const ov = document.getElementById('card-milk-adicional-ovomaltine');
    if (ov) ov.value = p.milkshake.adicional_ovomaltine || 3;
  }

  // Taças — tabelas 2 colunas
  if (p.tacas) {
    renderCardapioPrecoTabela('card-tacas-tabela', p.tacas.tradicionais || {}, 'Ex: Colegial');
    renderCardapioPrecoTabela('card-tacas-p-tabela', p.tacas.sujas || {}, 'Ex: Unicórnio');
  }

  // Isopores
  renderCardapioPrecoTabela('card-iso-tabela', p.isopores_viagem || {}, 'Ex: 4 Bolas');

  // Sobremesas
  renderCardapioPrecoTabela('card-sobremesas-tabela', p.sobremesas || {}, 'Ex: Fondue');

  // Botões e textos (config)
  const c = STATE.config || {};
  document.getElementById('card-sorvetes-btn').value = c.cardSorvetesBtn || '🍦 Ver 35 Sabores';
  document.getElementById('card-sorvetes-desc').value = c.cardSorvetesDesc || 'Cremoso, gelado, irresistível · 35 sabores pra você escolher';
  document.getElementById('card-picoles-btn').value = c.cardPicolesBtn || '🧊 Ver Sabores de Picolés';
  document.getElementById('card-açaí-promo-btn').value = c.cardAçaíPromoBtn || '🫐 Ver Combos em Promoção';
  document.getElementById('card-açaí-btn').value = c.cardAçaíBtn || '🍇 Montar Meu Açaí';
  document.getElementById('card-milk-btn').value = c.cardMilkBtn || '🥤 Ver Milkshakes';
  document.getElementById('card-tacas-btn').value = c.cardTacasBtn || '🍧 Ver Taças';
  document.getElementById('card-tacas-p-btn').value = c.cardTacasPBtn || '👑 Ver Taças Premium';
  document.getElementById('card-iso-btn').value = c.cardIsoBtn || '🧊 Ver Isopores';
  document.getElementById('card-sobremesas-btn').value = c.cardSobremesasBtn || '🍨 Ver Sobremesas';
}

async function salvarCardápio() {
  const p = STATE.produtos;
  const c = STATE.config;
  if (!p || !c) return;

  // Sorvetes
  if (p.sorvetes) p.sorvetes.sabores = document.getElementById('card-sorvetes-sabores').value.split('\n').map(s => s.trim()).filter(s => s);

  // Picolés
  if (p.picoles) {
    if (p.picoles.frutas_agua) p.picoles.frutas_agua.sabores = document.getElementById('card-picoles-fruta').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.leite_sem_recheio) p.picoles.leite_sem_recheio.sabores = document.getElementById('card-picoles-leite').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.leite_com_recheio) p.picoles.leite_com_recheio.sabores = document.getElementById('card-picoles-recheado').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.leite_ninho) p.picoles.leite_ninho.sabores = document.getElementById('card-picoles-ninho').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.ovomaltine) p.picoles.ovomaltine.sabores = document.getElementById('card-picoles-ovomaltine').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.esquimós) p.picoles.esquimós.sabores = document.getElementById('card-picoles-esquimo').value.split('\n').map(s => s.trim()).filter(s => s);
  }

  // Açaí Promoção — tabela 3 colunas
  p.acai_promocao = readCardapioPromoTabela();

  // Açaí Tamanhos — tabela 2 colunas
  if (!p.acai) p.acai = {};
  const coposAcai = readCardapioPrecoTabela('card-açaí-tamanhos-tabela');
  if (Object.keys(coposAcai).length) p.acai.copos = coposAcai;

  // Milkshake sabores + tamanhos — tabelas
  if (!p.milkshake) p.milkshake = {};
  p.milkshake.sabores = document.getElementById('card-milk-sabores').value.split('\n').map(s=>s.trim()).filter(s=>s);
  const milkTrad = readCardapioPrecoTabela('card-milk-trad-tabela');
  if (Object.keys(milkTrad).length) p.milkshake.tradicional = milkTrad;
  const milkTop = readCardapioPrecoTabela('card-milk-top-tabela');
  if (Object.keys(milkTop).length) p.milkshake.top = milkTop;
  const ovomaltineVal = parseFloat(document.getElementById('card-milk-adicional-ovomaltine')?.value||'3')||0;
  p.milkshake.adicional_ovomaltine = ovomaltineVal;

  // Taças — tabelas 2 colunas
  if (!p.tacas) p.tacas = {};
  const tacasTrad = readCardapioPrecoTabela('card-tacas-tabela');
  if (Object.keys(tacasTrad).length) p.tacas.tradicionais = tacasTrad;
  const tacasSujas = readCardapioPrecoTabela('card-tacas-p-tabela');
  if (Object.keys(tacasSujas).length) p.tacas.sujas = tacasSujas;

  // Isopores
  const iso = readCardapioPrecoTabela('card-iso-tabela');
  if (Object.keys(iso).length) p.isopores_viagem = iso;

  // Sobremesas
  const sob = readCardapioPrecoTabela('card-sobremesas-tabela');
  if (Object.keys(sob).length) p.sobremesas = sob;

  // Botões e textos (config)
  c.cardSorvetesBtn = document.getElementById('card-sorvetes-btn').value.trim();
  c.cardSorvetesDesc = document.getElementById('card-sorvetes-desc').value.trim();
  c.cardPicolesBtn = document.getElementById('card-picoles-btn').value.trim();
  c.cardAçaíPromoBtn = document.getElementById('card-açaí-promo-btn').value.trim();
  c.cardAçaíBtn = document.getElementById('card-açaí-btn').value.trim();
  c.cardMilkBtn = document.getElementById('card-milk-btn').value.trim();
  c.cardTacasBtn = document.getElementById('card-tacas-btn').value.trim();
  c.cardTacasPBtn = document.getElementById('card-tacas-p-btn').value.trim();
  c.cardIsoBtn = document.getElementById('card-iso-btn').value.trim();
  c.cardSobremesasBtn = document.getElementById('card-sobremesas-btn').value.trim();

  mostrarLoading('Salvando Cardápio...');
  const ok1 = await salvarArquivo(PATHS.produtos, p, 'produtosSha', 'Admin: atualizar cardápio completo');
  const ok2 = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar botões do cardápio');
  ocultarLoading();

  if (ok1 && ok2) toast('✅ Cardápio completo atualizado!', 'sucesso');
}

// ── DEPOIMENTOS ─────────────────────────────────────────────────────────────
function preencherDepoimentos() {
  console.log('[preencherDepoimentos] Iniciando...');
  const c = STATE.config || {};
  console.log('[preencherDepoimentos] STATE.config:', c);

  // Novos campos Fase 3.2 - dicasPagina
  const dp = c.dicasPagina || {};
  const dicasH1El = document.getElementById('dicas-h1');
  if (dicasH1El) dicasH1El.value = dp.h1 || 'Dicas Essenciais da Sorveteria Itapolitana Cajuru';
  const dicasIntroEl = document.getElementById('dicas-intro');
  if (dicasIntroEl) dicasIntroEl.value = dp.intro || '';

  document.getElementById('dep-titulo').value = c.depTitulo || 'O que nossos clientes dizem';
  document.getElementById('dep-subtitulo').value = c.depSubtitulo || 'Confira as avaliações de quem já provou e amou nossos sorvetes e açaís.';
  // Estratégia de migração: config.json antigos salvavam uma única string em "depDica".
  // O novo formato usa o array "depDicas". A leitura aceita os dois formatos para garantir
  // que configs salvos antes da migração continuem funcionando sem perda de dados.
  // Remoção segura: após confirmar via auditoria (scripts/tests-admin-sync) que todos os
  // ambientes de produção já salvaram pelo menos uma vez com o novo formato (depDicas array).
  const depDicas = Array.isArray(c.depDicas) ? c.depDicas : (c.depDica ? [c.depDica] : []);
  document.getElementById('dep-dicas').value = depDicas.join('\n');

  const lista = c.depoimentos || [];
  console.log('[preencherDepoimentos] Depoimentos encontrados:', lista.length);
  const container = document.getElementById('dep-lista');
  if (!container) {
    console.error('[preencherDepoimentos] Elemento #dep-lista NÃO encontrado!');
    return;
  }

  container.innerHTML = lista.length
    ? lista.map((d, i) => `
    <div class="dep-item card" style="margin-bottom:15px; padding:15px; border:1px solid #eee">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px">
        <strong>Depoimento #${i+1}</strong>
        <button class="btn btn-erro btn-sm" onclick="removerDepoimentoComConfirm(${i})">&#128465;&#65039; Remover</button>
      </div>
      <div class="campo-edit"><label>Nome do Cliente</label><input type="text" id="dep-nome-${i}" value="${d.nome}" placeholder="Ex: João Silva"/></div>
      <div class="campo-edit"><label>Texto do Depoimento</label><textarea id="dep-texto-${i}" rows="3">${d.texto}</textarea></div>
      <div class="campo-edit"><label>Estrelas (1-5)</label><input type="number" id="dep-estrelas-${i}" value="${d.estrelas}" min="1" max="5"/></div>
      <div class="campo-edit">
        <label>📸 Foto do Cliente (opcional)</label>
        <div style="background:#f3e5f5;border:1.5px solid #ce93d8;border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:.78rem;color:#6a1b9a;line-height:1.7">
          📐 <strong>Dimensões:</strong> 200 × 200 px (quadrado) — redimensionado automaticamente<br>
          💾 <strong>Tamanho máximo:</strong> 50 KB após conversão<br>
          🖼️ <strong>Formatos aceitos:</strong> JPG, PNG, WebP<br>
          ⚡ <strong>Conversão automática:</strong> salva como WebP no GitHub
        </div>
        <div class="upload-area" id="dep-foto-area-${i}" style="padding:12px">
          <input type="file" accept="image/*" id="dep-foto-input-${i}" onchange="processarFotoDepoimento(this.files[0], ${i})"/>
          <div class="upload-icon" style="font-size:1.4rem">👤</div>
          <div class="upload-texto" style="font-size:.82rem">Clique para adicionar foto do cliente</div>
          <div class="upload-regras">
            <span>📐 200×200px</span>
            <span>💾 Máx. 50KB</span>
            <span>⚡ → WebP</span>
          </div>
        </div>
        ${d.foto ? `<div class="img-preview-wrap" style="display:block"><img class="img-preview" src="${d.foto}" alt="Foto ${d.nome}" style="width:80px;height:80px;border-radius:50%;object-fit:cover"/><div class="img-preview-info">Foto atual</div></div>` : ''}
        <div class="img-preview-wrap" id="dep-foto-preview-wrap-${i}" style="display:none">
          <img class="img-preview" id="dep-foto-preview-${i}" src="" alt="Preview foto" style="width:80px;height:80px;border-radius:50%;object-fit:cover"/>
          <div class="img-preview-info" id="dep-foto-info-${i}"></div>
        </div>
        <div class="erro-inline" id="dep-foto-erro-${i}"></div>
        <div class="hint">✅ Foto circular exibida ao lado do nome no depoimento. Deixe em branco para usar avatar padrão.</div>
      </div>
    </div>
  `).join('')
    : '<div style="text-align:center;padding:24px 10px;background:#fff8f0;border-radius:10px;border:1.5px dashed #ffcc80"><div style="font-size:2rem;margin-bottom:8px">💬</div><p style="color:#888;margin-bottom:12px">Nenhum depoimento cadastrado ainda.</p><p style="font-size:.82rem;color:#aaa">Clique em <strong>➕ Adicionar Depoimento</strong> abaixo para criar o primeiro.</p></div>';
  console.log('[preencherDepoimentos] Conteúdo renderizado. Lista vazia?', lista.length === 0);
  preencherDicasItens();
  const seoPg = c.seoPaginas || {};
  const seoDicasTit = document.getElementById('cfg-seo-dicas-titulo');
  if (seoDicasTit) seoDicasTit.value = seoPg.dicas?.titulo || '';
  const seoDicasDesc = document.getElementById('cfg-seo-dicas-descricao');
  if (seoDicasDesc) seoDicasDesc.value = seoPg.dicas?.descricao || '';
  const seoDicasPal = document.getElementById('cfg-seo-dicas-palavras');
  if (seoDicasPal) seoDicasPal.value = seoPg.dicas?.palavrasChave || '';
  console.log('[preencherDepoimentos] Concluído com sucesso!');
}

function adicionarDepoimento() {
  if (!STATE.config.depoimentos) STATE.config.depoimentos = [];
  STATE.config.depoimentos.push({nome: '', texto: '', estrelas: 5});
  preencherDepoimentos();
}

function preencherDicasItens() {
  const c = STATE.config || {};
  const container = document.getElementById('dicas-lista');
  if (!container) return;
  const lista = Array.isArray(c.dicasItens) ? c.dicasItens : [];
  container.innerHTML = lista.length
    ? lista.map((d, i) => `
    <div class="card" style="margin-bottom:12px;padding:14px;border:1px solid #eee">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
        <strong>Dica #${i+1}</strong>
        <button class="btn btn-erro btn-sm" onclick="removerDicaItem(${i})">&#128465;&#65039; Remover</button>
      </div>
      <div class="campo-edit"><label>Título</label><input type="text" id="dica-titulo-${i}" value="${esc(d.titulo || '')}" maxlength="100" placeholder="Ex.: Como conservar melhor seu sorvete"/></div>
      <div class="campo-edit"><label>Descrição</label><textarea id="dica-desc-${i}" rows="3" maxlength="280" placeholder="Resumo da dica para aparecer no card.">${esc(d.descricao || '')}</textarea></div>
      <div class="campo-edit"><label>Imagem (URL)</label><input type="url" id="dica-img-${i}" value="${esc(d.imagem || '')}" placeholder="https://... ou images/arquivo.webp"/></div>
      <div class="campo-edit"><label>Link de destino</label><input type="url" id="dica-link-${i}" value="${esc(d.link || '')}" placeholder="https://..."/></div>
    </div>
  `).join('')
    : '<div style="text-align:center;padding:24px 10px;background:#fff8f0;border-radius:10px;border:1.5px dashed #ffcc80"><div style="font-size:2rem;margin-bottom:8px">💡</div><p style="color:#888;margin-bottom:12px">Nenhuma dica cadastrada ainda.</p><p style="font-size:.82rem;color:#aaa">Clique em <strong>➕ Adicionar Dica</strong> abaixo para criar a primeira.</p></div>';
}

function adicionarDicaItem() {
  if (!STATE.config) STATE.config = {};
  if (!Array.isArray(STATE.config.dicasItens)) STATE.config.dicasItens = [];
  STATE.config.dicasItens.push({ titulo: '', descricao: '', imagem: '', link: '' });
  preencherDicasItens();
}

function removerDicaItem(i) {
  if (!Array.isArray(STATE.config?.dicasItens)) return;
  STATE.config.dicasItens.splice(i, 1);
  preencherDicasItens();
}

// Armazena fotos de depoimentos pendentes de upload (base64 WebP)
const _depFotosPendentes = {};

function processarFotoDepoimento(file, idx) {
  if (!file) return;
  const erroEl = document.getElementById(`dep-foto-erro-${idx}`);
  const previewWrap = document.getElementById(`dep-foto-preview-wrap-${idx}`);
  const previewImg = document.getElementById(`dep-foto-preview-${idx}`);
  const infoEl = document.getElementById(`dep-foto-info-${idx}`);
  if (erroEl) { erroEl.textContent = ''; erroEl.classList.remove('ativo'); }

  processarImagem(file, 200, 200, 0.82, (info, erro) => {
    if (erro) {
      if (erroEl) { erroEl.textContent = erro; erroEl.classList.add('ativo'); }
      return;
    }
    _depFotosPendentes[idx] = info.dataUrl;
    if (previewImg) previewImg.src = info.dataUrl;
    if (previewWrap) previewWrap.style.display = 'block';
    if (infoEl) infoEl.textContent = `${info.width}×${info.height}px — ${info.tamanhoKB} KB`;
  });
}

async function salvarDepoimentos() {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para salvar depoimentos.', 'aviso');
    return;
  }
  const c = STATE.config;

  // Novos campos Fase 3.2 - dicasPagina
  c.dicasPagina = c.dicasPagina || {};
  const dicasH1El = document.getElementById('dicas-h1');
  if (dicasH1El) c.dicasPagina.h1 = dicasH1El.value.trim();
  const dicasIntroEl = document.getElementById('dicas-intro');
  if (dicasIntroEl) c.dicasPagina.intro = dicasIntroEl.value.trim();

  c.depTitulo = document.getElementById('dep-titulo').value.trim();
  c.depSubtitulo = document.getElementById('dep-subtitulo').value.trim();
  c.depDicas = document.getElementById('dep-dicas').value.split('\n').map(s => s.trim()).filter(s => s);
  // Campo legado "depDica" (singular) mantido para compatibilidade com consumidores externos.
  // Remoção prevista: após confirmar que TODOS os ambientes salvaram com "depDicas" (array)
  // e que nenhum script lê config.depDica — remover na próxima versão principal do admin (v9+).
  c.depDica = c.depDicas[0] || '';

  const lista = [];
  const container = document.getElementById('dep-lista');
  const itens = container.querySelectorAll('.dep-item');

  // Upload de fotos pendentes
  for (let i = 0; i < itens.length; i++) {
    const dep = c.depoimentos && c.depoimentos[i] ? { ...c.depoimentos[i] } : {};
    dep.nome = document.getElementById(`dep-nome-${i}`)?.value.trim() || '';
    dep.texto = document.getElementById(`dep-texto-${i}`)?.value.trim() || '';
    dep.estrelas = parseInt(document.getElementById(`dep-estrelas-${i}`)?.value) || 5;
    // Se há foto nova pendente, fazer upload
    if (_depFotosPendentes[i]) {
      try {
        const nomeArq = `images/depoimentos/dep-foto-${i}.webp`;
        const b64 = _depFotosPendentes[i].split(',')[1];
        await ghPutImagem(nomeArq, b64);
        dep.foto = nomeArq + '?v=' + Date.now();
        delete _depFotosPendentes[i];
      } catch(e) {
        console.warn('Erro ao fazer upload da foto do depoimento:', e);
      }
    }
    lista.push(dep);
  }
  c.depoimentos = lista;
  const dicasItens = [];
  const dicasSalvas = Array.isArray(c.dicasItens) ? c.dicasItens : [];
  for (let i = 0; i < dicasSalvas.length; i++) {
    const titulo = (document.getElementById(`dica-titulo-${i}`)?.value || '').trim();
    const descricao = (document.getElementById(`dica-desc-${i}`)?.value || '').trim();
    const imagemRaw = (document.getElementById(`dica-img-${i}`)?.value || '').trim();
    const linkRaw = (document.getElementById(`dica-link-${i}`)?.value || '').trim();
    // allowRelative=true permite imagens locais versionadas no próprio repositório (ex.: images/dicas/x.webp).
    const imagem = cmsValidarUrl(imagemRaw, {allowRelative:true, allowEmpty:true});
    const link = cmsValidarUrl(linkRaw, {allowRelative:true, allowEmpty:true});
    if (imagem===null || link===null) {
      toast(`⚠️ URL inválida na dica #${i+1}. Use apenas links http/https.`, 'erro');
      return;
    }
    if (!titulo && !descricao && !imagem && !link) continue;
    dicasItens.push({ titulo, descricao, imagem, link });
  }
  c.dicasItens = dicasItens;
  c.seoPaginas = c.seoPaginas || {};
  c.seoPaginas.dicas = c.seoPaginas.dicas || {};
  const seoDicasTit = document.getElementById('cfg-seo-dicas-titulo');
  if (seoDicasTit) c.seoPaginas.dicas.titulo = seoDicasTit.value.trim();
  const seoDicasDesc = document.getElementById('cfg-seo-dicas-descricao');
  if (seoDicasDesc) c.seoPaginas.dicas.descricao = seoDicasDesc.value.trim();
  const seoDicasPal = document.getElementById('cfg-seo-dicas-palavras');
  if (seoDicasPal) c.seoPaginas.dicas.palavrasChave = seoDicasPal.value.trim();
  
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar depoimentos e dicas');
}

function preencherNotasOperacionais(){
  try{
    const cfg = STATE.config || {};
    const obs = cfg.adminConteudoPaginas || {};
    prefillLog('[preencherNotasOperacionais] adminConteudoPaginas', obs);
    setFieldValue('qualidade-observacoes', obs.qualidade || '', 'notas.qualidade');
    setFieldValue('rastreio-observacoes', obs.rastreio || '', 'notas.rastreio');
    setFieldValue('auditoria-observacoes', obs.auditoria || '', 'notas.auditoria');
  }catch(e){
    console.error('[Admin] preencherNotasOperacionais',e);
  }
}

async function salvarNotasOperacionais(){
  const cfg = STATE.config || {};
  cfg.adminConteudoPaginas = cfg.adminConteudoPaginas || {};
  const q = document.getElementById('qualidade-observacoes');
  if (q) cfg.adminConteudoPaginas.qualidade = q.value.trim();
  const r = document.getElementById('rastreio-observacoes');
  if (r) cfg.adminConteudoPaginas.rastreio = r.value.trim();
  const a = document.getElementById('auditoria-observacoes');
  if (a) cfg.adminConteudoPaginas.auditoria = a.value.trim();
  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar observacoes de qualidade/rastreio/auditoria');
}

// ── FALE CONOSCO ────────────────────────────────────────────────────────────
function preencherFaleConosco() {
  const c = STATE.config || {};
  // --- Contato geral ---
  document.getElementById('fc-titulo').value = c.fcTitulo || 'Fale com a Itapolitana';
  document.getElementById('fc-subtitulo').value = c.fcSubtitulo || 'Manda uma mensagem, a gente responde rapidinho!';
  document.getElementById('fc-msg-sucesso').value = c.fcMsgSucesso || 'Mensagem enviada! Retornaremos em breve.';
  document.getElementById('fc-email').value = c.fcEmail || '';
  document.getElementById('fc-endereco').value = c.fcEndereco || c.enderecoCompleto || '';
  document.getElementById('fc-horario').value = c.fcHorario || c.horario || '';
  // --- Modal Fale Conosco (IDs: fale-modal-titulo, fale-modal-sub, fale-label-nome, fale-label-msg, fale-btn-texto) ---
  document.getElementById('fc-modal-titulo').value = c.faleModalTitulo || '📩 Fale Conosco';
  document.getElementById('fc-modal-sub').value = c.faleModalSub || 'Envie sua mensagem via WhatsApp';
  document.getElementById('fc-label-nome').value = c.faleLabelNome || 'Seu nome';
  document.getElementById('fc-label-msg').value = c.faleLabelMsg || 'Sua mensagem';
  document.getElementById('fc-btn-texto').value = c.faleBtnTexto || '💬 Enviar via WhatsApp';
  // --- Chat FAB e Header (IDs: chat-fab-texto, chat-hdr-titulo, chat-hdr-sub, chat-msg-inicio) ---
  document.getElementById('fc-chat-fab').value = c.chatFabTexto || '💬 Fale Conosco';
  document.getElementById('fc-chat-hdr-titulo').value = c.chatHdrTitulo || '💬 Fale Conosco';
  document.getElementById('fc-chat-hdr-sub').value = c.chatHdrSub || 'Assistente Itapolitana · Responde na hora';
  document.getElementById('fc-chat-inicio').value = c.chatMsgInicio || c.fcChatInicio || 'Olá! 👋 Sou o assistente da Sorveteria Itapolitana. Como posso te ajudar?';
  // --- Chat Sugestões (IDs: chat-sug-1 a chat-sug-6) ---
  const sugs = c.chatSugestoes || c.fcChatOpcoes || ['Horário','Como encomendar','Sabores','Preços','Localização','Picolés'];
  document.getElementById('fc-chat-opcoes').value = sugs.join('\n');
  document.getElementById('fc-chat-fora').value = c.chatForaHorario || c.fcChatFora || 'Estamos fechados agora. Retornaremos em breve!';
  // --- Clube FAB (ID: clube-fab-texto) ---
  document.getElementById('fc-clube-fab').value = c.clubeFabTexto || '🍦 ';
  // --- Modais do Cardápio (IDs: ms-título, ms-sub, mp-título, modal-comp-titulo, modal-comp-sub) ---
  document.getElementById('fc-modal-sorvetes-titulo').value = c.modalSaboresTitulo || 'Sabores Disponíveis';
  document.getElementById('fc-modal-sorvetes-sub').value = c.modalSaboresSub || 'Informe o sabor desejado ao fazer seu pedido na loja';
  document.getElementById('fc-modal-picole-titulo').value = c.modalPicoleTitulo || 'Sabores do Picolé';
  document.getElementById('fc-modal-açaí-titulo').value = c.modalAçaíTitulo || '🫐 Complementos do Açaí';
  document.getElementById('fc-modal-açaí-sub').value = c.modalAçaíSub || 'Disponíveis para o Açaí Personalizado';
}

async function salvarFaleConosco() {
  const c = STATE.config;
  // --- Contato geral ---
  c.fcTitulo = document.getElementById('fc-titulo').value.trim();
  c.fcSubtitulo = document.getElementById('fc-subtitulo').value.trim();
  c.fcMsgSucesso = document.getElementById('fc-msg-sucesso').value.trim();
  c.fcEmail = document.getElementById('fc-email').value.trim();
  c.fcEndereco = document.getElementById('fc-endereco').value.trim();
  c.fcHorario = document.getElementById('fc-horario').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar fale conosco geral');
}

// Salvar Modal Fale Conosco (IDs: fale-modal-titulo, fale-modal-sub, fale-label-nome, fale-label-msg, fale-btn-texto)
async function salvarModalFaleConosco() {
  const c = STATE.config;
  c.faleModalTitulo = document.getElementById('fc-modal-titulo').value.trim();
  c.faleModalSub = document.getElementById('fc-modal-sub').value.trim();
  c.faleLabelNome = document.getElementById('fc-label-nome').value.trim();
  c.faleLabelMsg = document.getElementById('fc-label-msg').value.trim();
  c.faleBtnTexto = document.getElementById('fc-btn-texto').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar modal fale conosco');
}

// Salvar Chat (IDs: chat-fab-texto, chat-hdr-titulo, chat-hdr-sub, chat-msg-inicio, chat-sug-1..6)
async function salvarChat() {
  const c = STATE.config;
  const sugestoes = document.getElementById('fc-chat-opcoes').value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  if (sugestoes.length !== 6) {
    toast('⚠️ As sugestões rápidas devem ter exatamente 6 linhas preenchidas.', 'erro');
    return;
  }
  c.chatFabTexto = document.getElementById('fc-chat-fab').value.trim();
  c.chatHdrTitulo = document.getElementById('fc-chat-hdr-titulo').value.trim();
  c.chatHdrSub = document.getElementById('fc-chat-hdr-sub').value.trim();
  c.chatMsgInicio = document.getElementById('fc-chat-inicio').value.trim();
  c.chatSugestoes = sugestoes;
  c.fcChatOpcoes = c.chatSugestoes; // compatibilidade retroativa
  c.chatForaHorario = document.getElementById('fc-chat-fora').value.trim();
  c.fcChatFora = c.chatForaHorario; // compatibilidade retroativa
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar chat e sugestoes');
}

// Salvar Clube FAB (ID: clube-fab-texto)
async function salvarClubeFab() {
  const c = STATE.config;
  c.clubeFabTexto = document.getElementById('fc-clube-fab').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar clube fab');
}

// Salvar Modais do Cardápio (IDs: ms-título, ms-sub, mp-título, modal-comp-titulo, modal-comp-sub)
async function salvarModaisCardapio() {
  const c = STATE.config;
  c.modalSaboresTitulo = document.getElementById('fc-modal-sorvetes-titulo').value.trim();
  c.modalSaboresSub = document.getElementById('fc-modal-sorvetes-sub').value.trim();
  c.modalPicoleTitulo = document.getElementById('fc-modal-picole-titulo').value.trim();
  c.modalAçaíTitulo = document.getElementById('fc-modal-açaí-titulo').value.trim();
  c.modalAçaíSub = document.getElementById('fc-modal-açaí-sub').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar modais cardapio');
}

// Salvar Carrinho para Eventos (IDs: carrinho-label1, carrinho-label2)
async function salvarCarrinhoEvento() {
  const c = STATE.config;
  c.carrinhoLabel1 = document.getElementById('home-carrinho-label1').value.trim();
  c.carrinhoLabel2 = document.getElementById('home-carrinho-label2').value.trim();
  c.carrinhoWhatsMsg = document.getElementById('home-carrinho-whats').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar carrinho para eventos');
}


// ═══════════════════════════════════════════════════════════
// MODAL DE CONFIRMACAO CENTRALIZADO
// ═══════════════════════════════════════════════════════════
let _confirmarCallback = null;
function confirmarAcao(titulo, mensagem, labelConfirmar, callback, tipo) {
  tipo = tipo || 'perigo'; // 'perigo' = vermelho, 'aviso' = laranja
  const cor = tipo === 'aviso' ? '#E65100' : '#c62828';
  const corBtn = tipo === 'aviso' ? '#E65100' : '#c62828';
  document.getElementById('modal-confirmar-titulo').textContent = titulo;
  document.getElementById('modal-confirmar-msg').innerHTML = mensagem;
  document.getElementById('modal-confirmar-btn').textContent = labelConfirmar;
  document.getElementById('modal-confirmar-btn').style.background = corBtn;
  document.getElementById('modal-confirmar-icone').textContent = tipo === 'aviso' ? '⚠️' : '🗑️';
  _confirmarCallback = callback;
  document.getElementById('modal-confirmar').style.display = 'flex';
}
function _confirmarOk() {
  document.getElementById('modal-confirmar').style.display = 'none';
  if (typeof _confirmarCallback === 'function') _confirmarCallback();
  _confirmarCallback = null;
}
function _confirmarCancelar() {
  document.getElementById('modal-confirmar').style.display = 'none';
  _confirmarCallback = null;
}

// ═══════════════════════════════════════════════════════════
// EXCLUIR ENCOMENDA
// ═══════════════════════════════════════════════════════════
function excluirEncomenda(numPedido) {
  const registros = STATE.encomendas?.registros || [];
  const enc = registros.find(r => r.num === numPedido);
  if (!enc) return;
  confirmarAcao(
    'Excluir Pedido',
    `Tem certeza que deseja excluir o pedido <strong>${numPedido}</strong> de <strong>${enc.nome || 'cliente'}</strong>?<br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir pedido',
    async () => {
      const idx = STATE.encomendas.registros.findIndex(r => r.num === numPedido);
      if (idx > -1) STATE.encomendas.registros.splice(idx, 1);
      const ok = await salvarArquivo(PATHS.encomendas, STATE.encomendas, 'encomendasSha', 'Admin: excluir pedido ' + numPedido);
      if (ok) { toast('Pedido ' + numPedido + ' excluído.', 'ok'); renderEncomendas(); }
    }
  );
}

// ═══════════════════════════════════════════════════════════
// EXCLUIR CLIENTE
// ═══════════════════════════════════════════════════════════
function excluirCliente(clienteId) {
  if(!fidRequireWrite())return;
  const clientes = STATE.clientes?.clientes || STATE.fidelidade?.clientes || {};
  const c = clientes[clienteId];
  if (!c) return;
  confirmarAcao(
    'Excluir Cliente',
    `Tem certeza que deseja excluir o cadastro de <strong>${c.nome || clienteId}</strong>?<br><small style="color:#888">Celular: ${c.cel||'-'}</small><br><br><span style="color:#c62828;font-weight:700">Todos os pontos e histórico serão perdidos. Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir cliente',
    async () => {
      let ok = false;
      if (STATE.clientes?.clientes) {
        delete STATE.clientes.clientes[clienteId];
        // Remover do índice de celular também
        if (STATE.clientes.indice_celular && c.cel) delete STATE.clientes.indice_celular[c.cel];
        ok = await salvarArquivo(PATHS.clientes, STATE.clientes, 'clientesSha', 'Admin: excluir cliente ' + (c.nome||clienteId));
      } else {
        delete STATE.fidelidade.clientes[clienteId];
        ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: excluir cliente ' + (c.nome||clienteId));
      }
      if (ok) { toast('Cliente ' + (c.nome || clienteId) + ' excluído.', 'ok'); renderClientes(); renderDuplicidades(); }
    }
  );
}

// Substituir confirm() nativo por confirmarAcao() em todas as exclusoes existentes
// Inscrito do sorteio
function removerInscritoSorteioComConfirm(idx) {
  const ins = STATE.fidelidade?.sorteioInscritos?.[idx];
  if (!ins) return;
  confirmarAcao(
    'Remover Inscrito',
    `Remover <strong>${ins.nome || 'inscrito'}</strong> do sorteio?`,
    'Sim, remover',
    () => {
      STATE.fidelidade.sorteioInscritos.splice(idx, 1);
      salvarSorteio();
    },
    'aviso'
  );
}
// Remover depoimento
function removerDepoimentoComConfirm(i) {
  const dep = STATE.config?.depoimentos?.[i];
  confirmarAcao(
    'Remover Depoimento',
    `Remover o depoimento de <strong>${dep?.nome || 'cliente'}</strong>?`,
    'Sim, remover',
    () => {
      STATE.config.depoimentos.splice(i, 1);
      salvarArquivo(PATHS.config, STATE.config, 'configSha', 'Admin: remover depoimento');
      preencherDepoimentos();
    },
    'aviso'
  );
}
// Remover sabor
function removerSaborComConfirm(nome, tipo) {
  confirmarAcao(
    'Remover Sabor',
    `Remover o sabor <strong>${nome}</strong> permanentemente?`,
    'Sim, remover sabor',
    () => {
      const idx = STATE.produtos?.[tipo]?.findIndex(s => s.nome === nome);
      if (idx > -1) {
        STATE.produtos[tipo].splice(idx, 1);
        salvarArquivo(PATHS.produtos, STATE.produtos, 'produtosSha', 'Admin: remover sabor ' + nome);
        renderizarSaboresAdmin();
      }
    },
    'aviso'
  );
}
// ═══════════════════════════════════════════════════════════
// PRODUTOS / COMBOS — ADMIN CRUD
// ═══════════════════════════════════════════════════════════
const PROD_CAT_LABELS = {caixas_enc:'Caixa de Sorvete',tortas_enc:'Torta de Sorvete',acrescimos:'Acréscimo'};

function getProdutosList() {
  const p = STATE.produtos || {};
  const filtro = document.getElementById('prod-filtro-cat')?.value || '';
  const cats = filtro ? [filtro] : ['caixas_enc','tortas_enc','acrescimos'];
  let lista = [];
  cats.forEach(cat => {
    if(Array.isArray(p[cat])) p[cat].forEach(item => lista.push({...item, _cat: cat}));
  });
  return lista;
}

function renderProdutosAdmin() {
  const lista = getProdutosList();
  const tbody = document.getElementById('tabela-produtos');
  if (!tbody) return;
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">Nenhum produto cadastrado.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(item => {
    const esg = item.esgotado || false;
    const statusHtml = esg
      ? '<span style="color:#c62828;font-weight:700">❌ Inativo</span>'
      : '<span style="color:#2e7d32;font-weight:700">✅ Ativo</span>';
    const preco = item['preço'] !== undefined ? item['preço'] : (item.preco || 0);
    return `<tr>
      <td style="font-weight:600">${item.nome}</td>
      <td><span style="background:#fce4d6;color:#e65100;border-radius:10px;padding:2px 8px;font-size:.75rem;font-weight:700">${PROD_CAT_LABELS[item._cat]||item._cat}</span></td>
      <td style="font-weight:700;color:#e65100">R$ ${Number(preco).toFixed(2)}</td>
      <td>${item.estoque ?? '-'}</td>
      <td>${statusHtml}</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn btn-amarelo" style="padding:4px 9px;font-size:.76rem" onclick="abrirFormProduto('${item._cat}','${item.id}')">✏️ Editar</button>
        <button class="btn btn-vermelho" style="padding:4px 9px;font-size:.76rem" onclick="excluirProduto('${item._cat}','${item.id}')">🗑️ Excluir</button>
      </td>
    </tr>`;
  }).join('');
}

function abrirFormProduto(cat, id) {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para editar produtos.', 'aviso');
    return;
  }
  const panel = document.getElementById('prod-form-panel');
  const tit = document.getElementById('prod-form-titulo');
  if (!panel) return;
  if (cat && id) {
    const arr = STATE.produtos?.[cat] || [];
    const item = arr.find(x => x.id === id);
    if (!item) return;
    tit.textContent = '✏️ Editar Produto';
    document.getElementById('prod-f-nome').value = item.nome || '';
    document.getElementById('prod-f-cat').value = cat;
    const preco = item['preço'] !== undefined ? item['preço'] : (item.preco || 0);
    document.getElementById('prod-f-preco').value = preco;
    document.getElementById('prod-f-maxsab').value = item.maxSabores || '';
    document.getElementById('prod-f-estoque').value = item.estoque ?? '';
    document.getElementById('prod-f-status').value = String(item.esgotado || false);
    document.getElementById('prod-f-id').value = id;
    document.getElementById('prod-f-cat-orig').value = cat;
  } else {
    tit.textContent = '➕ Adicionar Produto';
    document.getElementById('prod-f-nome').value = '';
    document.getElementById('prod-f-cat').value = 'caixas_enc';
    document.getElementById('prod-f-preco').value = '';
    document.getElementById('prod-f-maxsab').value = '';
    document.getElementById('prod-f-estoque').value = '';
    document.getElementById('prod-f-status').value = 'false';
    document.getElementById('prod-f-id').value = '';
    document.getElementById('prod-f-cat-orig').value = '';
  }
  panel.style.display = 'block';
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}

function fecharFormProduto() {
  const panel = document.getElementById('prod-form-panel');
  if (panel) panel.style.display = 'none';
}

async function salvarProduto() {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para salvar produtos.', 'aviso');
    return;
  }
  const nome = (document.getElementById('prod-f-nome').value || '').trim();
  if (!nome) { toast('Informe o nome do produto.','erro'); return; }
  const cat = document.getElementById('prod-f-cat').value;
  const preco = parseFloat(document.getElementById('prod-f-preco').value) || 0;
  const maxSaboresVal = parseInt(document.getElementById('prod-f-maxsab').value);
  const maxSabores = isNaN(maxSaboresVal) ? undefined : maxSaboresVal;
  const estoqueVal = parseInt(document.getElementById('prod-f-estoque').value);
  const esgotado = document.getElementById('prod-f-status').value === 'true';
  const editId = document.getElementById('prod-f-id').value;
  const catOrig = document.getElementById('prod-f-cat-orig').value;

  if (!STATE.produtos) STATE.produtos = {};
  ['caixas_enc','tortas_enc','acrescimos'].forEach(c => { if(!Array.isArray(STATE.produtos[c])) STATE.produtos[c] = []; });

  if (editId && catOrig) {
    const origArr = STATE.produtos[catOrig];
    const idx = origArr.findIndex(x => x.id === editId);
    if (idx > -1) origArr.splice(idx, 1);
    const updated = {id: editId, nome, 'preço': preco, esgotado};
    if (maxSabores) updated.maxSabores = maxSabores;
    if (!isNaN(estoqueVal)) updated.estoque = estoqueVal;
    if (!Array.isArray(STATE.produtos[cat])) STATE.produtos[cat] = [];
    STATE.produtos[cat].push(updated);
  } else {
    const catArr = STATE.produtos[cat];
    let maxId = 0;
    catArr.forEach(x => { const n = parseInt((x.id||'').replace(/\D/g,'')); if(n > maxId) maxId = n; });
    const prefix = cat === 'acrescimos' ? 'acr' : cat.replace('_enc','');
    const newId = prefix + '_' + String(maxId+1).padStart(3,'0');
    const novo = {id: newId, nome, 'preço': preco, esgotado};
    if (maxSabores) novo.maxSabores = maxSabores;
    if (!isNaN(estoqueVal)) novo.estoque = estoqueVal;
    catArr.push(novo);
  }

  const ok = await salvarArquivo(PATHS.produtos, STATE.produtos, 'produtosSha', 'Admin: ' + (editId ? 'editar' : 'adicionar') + ' produto ' + nome);
  if (ok) { fecharFormProduto(); renderProdutosAdmin(); }
}

function excluirProduto(cat, id) {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para excluir produtos.', 'aviso');
    return;
  }
  const arr = STATE.produtos?.[cat] || [];
  const item = arr.find(x => x.id === id);
  if (!item) return;
  confirmarAcao(
    'Excluir Produto',
    `Tem certeza que deseja excluir <strong>${item.nome}</strong>?<br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita. O produto deixará de aparecer nas encomendas.</span>`,
    'Sim, excluir produto',
    async () => {
      const idx = STATE.produtos[cat].findIndex(x => x.id === id);
      if (idx > -1) STATE.produtos[cat].splice(idx, 1);
      const ok = await salvarArquivo(PATHS.produtos, STATE.produtos, 'produtosSha', 'Admin: excluir produto ' + item.nome);
      if (ok) { toast('🗑️ Produto excluído.','ok'); renderProdutosAdmin(); }
    }
  );
}

function copiarListaProdutos() {
  const lista = getProdutosList();
  if (!lista.length) { toast('Nenhum produto para copiar.','aviso'); return; }
  const header = 'Nome;Categoria;Preço;Estoque;Status';
  const rows = lista.map(x => {
    const preco = x['preço'] !== undefined ? x['preço'] : (x.preco || 0);
    return `${x.nome};${PROD_CAT_LABELS[x._cat]||x._cat};R$ ${Number(preco).toFixed(2)};${x.estoque??'-'};${x.esgotado?'Inativo':'Ativo'}`;
  });
  copiarTextoSeguro([header,...rows].join('\n')).then((ok)=>toast(ok?`${lista.length} produtos copiados!`:'Erro ao copiar produtos.',ok?'sucesso':'erro'));
}

function exportarProdutosCSV() {
  const lista = getProdutosList();
  if (!lista.length) { toast('Nenhum produto para exportar.','aviso'); return; }
  const BOM = '\uFEFF';
  const header = 'Nome,Categoria,Preço,Estoque,Status';
  const rows = lista.map(x => {
    const preco = x['preço'] !== undefined ? x['preço'] : (x.preco || 0);
    return `"${(x.nome||'').replace(/"/g,'""')}","${PROD_CAT_LABELS[x._cat]||x._cat}",${Number(preco).toFixed(2)},${x.estoque??''},${x.esgotado?'Inativo':'Ativo'}`;
  });
  const csv = BOM + [header,...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `produtos_itapolitana_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast(`CSV com ${lista.length} produtos exportado!`,'sucesso');
}

// ═══════════════════════════════════════════════════════════
// PROMOÇÕES — ADMIN CRUD
// ═══════════════════════════════════════════════════════════
function renderPromocoesTable() {
  const lista = STATE.promocoes?.promocoes || [];
  const tbody = document.getElementById('tabela-promocoes');
  if (!tbody) return;
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px">Nenhuma promoção cadastrada. Clique em "Adicionar promoção" para começar.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map((p, i) => {
    const statusHtml = p.status === 'ativa'
      ? '<span style="color:#2e7d32;font-weight:700">✅ Ativa</span>'
      : '<span style="color:#999;font-weight:700">❌ Inativa</span>';
    const periodoExib = p.periodo || ((p.dataInicio || p.dataFim) ? getPromoPeriodo(p.dataInicio, p.dataFim) : '-');
    return `<tr style="${p.status==='ativa'?'':'opacity:.6'}">
      <td style="font-weight:600">${p.nome}</td>
      <td style="font-size:.82rem;color:#666">${periodoExib}</td>
      <td>${statusHtml}</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn btn-amarelo" style="padding:4px 9px;font-size:.76rem" onclick="abrirFormPromocao(${i})">✏️ Editar</button>
        <button class="btn btn-vermelho" style="padding:4px 9px;font-size:.76rem" onclick="excluirPromocaoItem(${i})">🗑️ Excluir</button>
      </td>
    </tr>`;
  }).join('');
}

let _promoFormListenersBound = false;

function normalizePromoDate(value) {
  const raw = String(value || '').trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const ano = parseInt(m[1], 10);
  const mes = parseInt(m[2], 10);
  const dia = parseInt(m[3], 10);
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== (mes - 1) || d.getDate() !== dia) return null;
  return raw;
}

function getPromoPeriodo(dataInicio, dataFim) {
  return `${dataInicio || '-'} até ${dataFim || '-'}`;
}

function _promoNomeValido() {
  return ((document.getElementById('promo-nome')?.value || '').trim().length >= 3);
}
function _promoDescricaoValida() {
  return ((document.getElementById('promo-descricao')?.value || '').trim().length >= 10);
}
function _promoDataInicioValida() {
  return !!normalizePromoDate(document.getElementById('promo-data-inicio')?.value || '');
}
function _promoDataFimValida() {
  const ini = normalizePromoDate(document.getElementById('promo-data-inicio')?.value || '');
  const fim = normalizePromoDate(document.getElementById('promo-data-fim')?.value || '');
  return !!(ini && fim && fim >= ini);
}
function _promoProdutosValidos() {
  return ((document.getElementById('promo-produtos-afetados')?.value || '').trim().length >= 1);
}
function _promoRegrasValidas() {
  return ((document.getElementById('promo-regras')?.value || '').trim().length >= 5);
}
function _promoStatusValido() {
  return !!(document.getElementById('promo-status')?.value || '').trim();
}

function setPromoFieldState(el, enabled, valid) {
  if (!el) return;
  el.disabled = !enabled;
  el.classList.toggle('form-control-disabled', !enabled);
  if (!enabled) {
    el.classList.remove('is-valid', 'is-invalid');
    return;
  }
  if (valid === true) {
    el.classList.add('is-valid');
    el.classList.remove('is-invalid');
  } else if (valid === false) {
    el.classList.add('is-invalid');
    el.classList.remove('is-valid');
  } else {
    el.classList.remove('is-valid', 'is-invalid');
  }
}

function validatePromocaoForm() {
  const elNome = document.getElementById('promo-nome');
  const elDesc = document.getElementById('promo-descricao');
  const elInicio = document.getElementById('promo-data-inicio');
  const elFim = document.getElementById('promo-data-fim');
  const elProdutos = document.getElementById('promo-produtos-afetados');
  const elRegras = document.getElementById('promo-regras');
  const elStatus = document.getElementById('promo-status');
  const elSalvar = document.getElementById('promo-salvar');

  if (!elNome || !elDesc || !elInicio || !elFim || !elProdutos || !elRegras || !elStatus || !elSalvar) return;

  const nomeOk = _promoNomeValido();
  const descOk = _promoDescricaoValida();
  const inicioOk = _promoDataInicioValida();
  const fimOk = _promoDataFimValida();
  const produtosOk = _promoProdutosValidos();
  const regrasOk = _promoRegrasValidas();
  const statusOk = _promoStatusValido();
  const nomeHasValue = (elNome.value || '').trim() !== '';
  const descHasValue = (elDesc.value || '').trim() !== '';
  const inicioHasValue = (elInicio.value || '').trim() !== '';
  const fimHasValue = (elFim.value || '').trim() !== '';
  const produtosHasValue = (elProdutos.value || '').trim() !== '';
  const regrasHasValue = (elRegras.value || '').trim() !== '';
  const statusHasValue = (elStatus.value || '').trim() !== '';

  const descEnabled = nomeOk;
  const inicioEnabled = nomeOk && descOk;
  const fimEnabled = inicioEnabled && inicioOk;
  const produtosEnabled = fimEnabled && fimOk;
  const regrasEnabled = produtosEnabled && produtosOk;
  const statusEnabled = regrasEnabled && regrasOk;

  setPromoFieldState(elNome, true, nomeHasValue ? nomeOk : null);
  setPromoFieldState(elDesc, descEnabled, descEnabled ? (descHasValue ? descOk : null) : null);
  setPromoFieldState(elInicio, inicioEnabled, inicioEnabled ? (inicioHasValue ? inicioOk : null) : null);
  setPromoFieldState(elFim, fimEnabled, fimEnabled ? (fimHasValue ? fimOk : null) : null);
  setPromoFieldState(elProdutos, produtosEnabled, produtosEnabled ? (produtosHasValue ? produtosOk : null) : null);
  setPromoFieldState(elRegras, regrasEnabled, regrasEnabled ? (regrasHasValue ? regrasOk : null) : null);
  setPromoFieldState(elStatus, statusEnabled, statusEnabled ? (statusHasValue ? statusOk : null) : null);

  elSalvar.disabled = !(nomeOk && descOk && inicioOk && fimOk && produtosOk && regrasOk && statusOk);
}

function bindPromocaoFormEvents() {
  if (_promoFormListenersBound) return;
  ['promo-nome', 'promo-descricao', 'promo-data-inicio', 'promo-data-fim', 'promo-produtos-afetados', 'promo-regras', 'promo-status']
    .forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', validatePromocaoForm);
      el.addEventListener('change', validatePromocaoForm);
    });
  _promoFormListenersBound = true;
}

function abrirFormPromocao(idx) {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para editar promoções.', 'aviso');
    return;
  }
  const panel = document.getElementById('promos-form-panel');
  const tit = document.getElementById('promos-form-titulo');
  if (!panel) return;
  bindPromocaoFormEvents();
  if (idx !== undefined) {
    const p = STATE.promocoes?.promocoes?.[idx];
    if (!p) return;
    tit.textContent = '✏️ Editar Promoção';
    document.getElementById('promo-nome').value = p.nome || '';
    document.getElementById('promo-descricao').value = p.descricao || '';
    document.getElementById('promo-data-inicio').value = p.dataInicio || '';
    document.getElementById('promo-data-fim').value = p.dataFim || '';
    document.getElementById('promo-produtos-afetados').value = p.produtosAfetados || '';
    document.getElementById('promo-regras').value = p.regras || '';
    document.getElementById('promo-status').value = p.status || '';
    document.getElementById('promo-idx').value = idx;
  } else {
    tit.textContent = '➕ Nova Promoção';
    document.getElementById('promo-nome').value = '';
    document.getElementById('promo-descricao').value = '';
    document.getElementById('promo-data-inicio').value = '';
    document.getElementById('promo-data-fim').value = '';
    document.getElementById('promo-produtos-afetados').value = '';
    document.getElementById('promo-regras').value = '';
    document.getElementById('promo-status').value = '';
    document.getElementById('promo-idx').value = '';
  }
  validatePromocaoForm();
  panel.style.display = 'block';
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}

function fecharFormPromocao() {
  const panel = document.getElementById('promos-form-panel');
  if (panel) panel.style.display = 'none';
}

async function salvarPromocaoItem() {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para salvar promoções.', 'aviso');
    return;
  }
  const nome = (document.getElementById('promo-nome').value || '').trim();
  const descricao = (document.getElementById('promo-descricao').value || '').trim();
  const dataInicio = (document.getElementById('promo-data-inicio').value || '').trim();
  const dataFim = (document.getElementById('promo-data-fim').value || '').trim();
  const produtosAfetados = (document.getElementById('promo-produtos-afetados').value || '').trim();
  const regras = (document.getElementById('promo-regras').value || '').trim();
  const status = document.getElementById('promo-status').value;
  const idxRaw = document.getElementById('promo-idx').value;

  if (!_promoNomeValido()) { toast('Informe o nome da promoção com pelo menos 3 caracteres.','erro'); return; }
  if (!_promoDescricaoValida()) { toast('Descrição muito curta. Use no mínimo 10 caracteres.','erro'); return; }
  if (!_promoDataInicioValida()) { toast('Informe uma data de início válida.','erro'); return; }
  if (!_promoDataFimValida()) { toast('A data de fim deve ser igual ou posterior à data de início.','erro'); return; }
  if (!_promoProdutosValidos()) { toast('Informe ao menos um produto afetado.','erro'); return; }
  if (!_promoRegrasValidas()) { toast('Informe regras com no mínimo 5 caracteres.','erro'); return; }
  if (!_promoStatusValido()) { toast('Selecione o status da promoção.','erro'); return; }

  const periodo = getPromoPeriodo(dataInicio, dataFim);

  if (!STATE.promocoes) STATE.promocoes = {promocoes: []};
  if (!Array.isArray(STATE.promocoes.promocoes)) STATE.promocoes.promocoes = [];

  if (idxRaw !== '') {
    const idx = parseInt(idxRaw);
    STATE.promocoes.promocoes[idx] = {nome, periodo, descricao, dataInicio, dataFim, produtosAfetados, regras, status};
  } else {
    STATE.promocoes.promocoes.push({nome, periodo, descricao, dataInicio, dataFim, produtosAfetados, regras, status});
  }
  const ok = await salvarArquivo(PATHS.promocoes, STATE.promocoes, 'promocoesSha', 'Admin: ' + (idxRaw !== '' ? 'editar' : 'adicionar') + ' promoção ' + nome);
  if (ok) { fecharFormPromocao(); renderPromocoesTable(); }
}

function excluirPromocaoItem(idx) {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para excluir promoções.', 'aviso');
    return;
  }
  const p = STATE.promocoes?.promocoes?.[idx];
  if (!p) return;
  confirmarAcao(
    'Excluir Promoção',
    `Tem certeza que deseja excluir a promoção <strong>${p.nome}</strong>?<br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir promoção',
    async () => {
      STATE.promocoes.promocoes.splice(idx, 1);
      const ok = await salvarArquivo(PATHS.promocoes, STATE.promocoes, 'promocoesSha', 'Admin: excluir promoção ' + p.nome);
      if (ok) { toast('🗑️ Promoção excluída.','ok'); renderPromocoesTable(); }
    }
  );
}

function copiarListaPromocoes() {
  const lista = STATE.promocoes?.promocoes || [];
  if (!lista.length) { toast('Nenhuma promoção para copiar.','aviso'); return; }
  const header = 'Nome;Período;Status';
  const rows = lista.map(p => `${p.nome};${p.periodo||'-'};${p.status}`);
  copiarTextoSeguro([header,...rows].join('\n')).then((ok)=>toast(ok?`${lista.length} promoções copiadas!`:'Erro ao copiar promoções.',ok?'sucesso':'erro'));
}

function exportarPromocoesCSV() {
  const lista = STATE.promocoes?.promocoes || [];
  if (!lista.length) { toast('Nenhuma promoção para exportar.','aviso'); return; }
  const BOM = '\uFEFF';
  const header = 'Nome,Período,Descrição,Status';
  const rows = lista.map(p => `"${(p.nome||'').replace(/"/g,'""')}","${(p.periodo||'').replace(/"/g,'""')}","${(p.descricao||'').replace(/"/g,'""')}",${p.status}`);
  const csv = BOM + [header,...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `promocoes_itapolitana_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast(`CSV com ${lista.length} promoções exportado!`,'sucesso');
}

// ═══════════════════════════════════════════════════════════
// CLIENTES — FORM INLINE (substituição de prompt())
// ═══════════════════════════════════════════════════════════
function abrirFormCliente(clienteId) {
  if(!fidRequireWrite())return;
  const panel = document.getElementById('cliente-form-panel');
  const tit = document.getElementById('cliente-form-titulo');
  if (!panel) return;
  if (clienteId) {
    const clientes = STATE.clientes?.clientes || {};
    const c = clientes[clienteId];
    if (!c) return;
    tit.textContent = '✏️ Editar Cliente';
    document.getElementById('cli-f-nome').value = c.nome || '';
    document.getElementById('cli-f-cel').value = c.cel || '';
    document.getElementById('cli-f-nasc').value = c.dataNasc || '';
    document.getElementById('cli-f-pontos').value = c.saldoPontos || 0;
    document.getElementById('cli-f-cel-orig').value = clienteId; // armazena chave USR-XXXX
  } else {
    tit.textContent = '➕ Adicionar Cliente';
    document.getElementById('cli-f-nome').value = '';
    document.getElementById('cli-f-cel').value = '';
    document.getElementById('cli-f-nasc').value = '';
    document.getElementById('cli-f-pontos').value = '0';
    document.getElementById('cli-f-cel-orig').value = '';
  }
  panel.style.display = 'block';
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}

function fecharFormCliente() {
  const panel = document.getElementById('cliente-form-panel');
  if (panel) panel.style.display = 'none';
}

async function salvarClienteForm() {
  if(!fidRequireWrite())return;
  const nome = (document.getElementById('cli-f-nome').value || '').trim();
  if (nome.length < 3) { toast('Nome muito curto.','erro'); return; }
  const celRaw = (document.getElementById('cli-f-cel').value || '').replace(/\D/g,'');
  if (celRaw.length < 10) { toast('WhatsApp inválido.','erro'); return; }
  const nasc = document.getElementById('cli-f-nasc').value || '';
  const pontos = parseInt(document.getElementById('cli-f-pontos').value) || 0;
  const clienteIdOrig = document.getElementById('cli-f-cel-orig').value; // USR-XXXX key (vazio = novo cliente)

  if (!STATE.clientes) STATE.clientes = {clientes:{},indice_celular:{}};
  if (!STATE.clientes.clientes) STATE.clientes.clientes = {};
  if (!STATE.clientes.indice_celular) STATE.clientes.indice_celular = {};

  const clientes = STATE.clientes.clientes;
  const agora = new Date().toISOString();

  if (clienteIdOrig) {
    // EDIÇÃO: clienteIdOrig é a chave USR-XXXX
    const c = clientes[clienteIdOrig];
    if (!c) { toast('Cliente não encontrado.','erro'); return; }
    const celAntigo = c.cel || '';
    if (celRaw !== celAntigo) {
      // Celular mudou: verificar duplicata por valor (não por chave)
      const celDuplo = Object.entries(clientes).find(([k,v]) => k !== clienteIdOrig && String(v.cel||'').replace(/\D/g,'') === celRaw);
      if (celDuplo) { toast('Novo WhatsApp já está em uso.','erro'); return; }
      clientes[clienteIdOrig] = {...c, nome, cel: celRaw, dataNasc: nasc, saldoPontos: pontos,
        cel_anterior: [...(Array.isArray(c.cel_anterior) ? c.cel_anterior : []), celAntigo],
        historico_alteracoes: [...(c.historico_alteracoes||[]), {data:agora,tipo:'edicao_admin',descricao:'Edição manual pelo admin — celular alterado de ' + celAntigo + ' para ' + celRaw,por:'admin'}]
      };
      // Atualizar índice de celular
      if (celAntigo) delete STATE.clientes.indice_celular[celAntigo];
      STATE.clientes.indice_celular[celRaw] = clienteIdOrig;
    } else {
      clientes[clienteIdOrig].nome = nome;
      clientes[clienteIdOrig].dataNasc = nasc;
      clientes[clienteIdOrig].saldoPontos = pontos;
      clientes[clienteIdOrig].historico_alteracoes = [...(clientes[clienteIdOrig].historico_alteracoes||[]), {data:agora,tipo:'edicao_admin',descricao:'Edição manual pelo admin',por:'admin'}];
    }
  } else {
    // NOVO CLIENTE: verificar duplicata por valor do campo cel
    const celDuplo = Object.values(clientes).find(v => String(v.cel||'').replace(/\D/g,'') === celRaw);
    if (celDuplo) { toast('WhatsApp já está cadastrado.','aviso'); return; }
    let maxNum = 0;
    Object.values(clientes).forEach(v => { const m = (v.id_permanente||'').match(/USR-2026-(\d+)/); if(m) maxNum = Math.max(maxNum, parseInt(m[1],10)); });
    const novoId = 'USR-2026-' + String(maxNum+1).padStart(4,'0');
    clientes[novoId] = {  // chave USR-XXXX (não o celular)
      id_permanente: novoId, nome, cel: celRaw, dataNasc: nasc,
      cadastro: agora, saldoPontos: pontos, codigosUsados: [], resgates: [],
      totalPremios: 0, totalCodigos: 0, bloqueado: false, motivo_bloqueio: null,
      tentativas_fraude: 0, ultimo_acesso: agora,
      historico_alteracoes: [{data:agora,tipo:'cadastro_manual',descricao:'Cadastro manual pelo admin',por:'admin'}]
    };
    STATE.clientes.indice_celular[celRaw] = novoId;
  }

  const ok = await salvarArquivo(PATHS.clientes, STATE.clientes, 'clientesSha', 'Admin: ' + (clienteIdOrig ? 'editar' : 'cadastrar') + ' cliente ' + nome);
  if (ok) { fecharFormCliente(); renderClientes(); toast('✅ ' + nome + ' salvo com sucesso!','sucesso'); }
}

function copiarListaClientes() {
  const clientes = Object.values(STATE.clientes?.clientes || {});
  if (!clientes.length) { toast('Nenhum cliente para copiar.','aviso'); return; }
  const header = 'Nome;WhatsApp;Pontos;Cadastro;Status';
  const rows = clientes.map(c => {
    const cad = c.cadastro ? new Date(c.cadastro).toLocaleDateString('pt-BR') : '-';
    const status = c.bloqueado ? 'Bloqueado' : c.fraude ? 'Fraude' : 'Ativo';
    return `${c.nome};${c.cel};${c.saldoPontos||0};${cad};${status}`;
  });
  copiarTextoSeguro([header,...rows].join('\n')).then((ok)=>toast(ok?`${clientes.length} clientes copiados!`:'Erro ao copiar clientes.',ok?'sucesso':'erro'));
}

function exportarClientesCSV() {
  const clientes = Object.values(STATE.clientes?.clientes || {});
  if (!clientes.length) { toast('Nenhum cliente para exportar.','aviso'); return; }
  const BOM = '\uFEFF';
  const header = 'ID,Nome,WhatsApp,Data Nasc.,Pontos,Cadastro,Status';
  const rows = clientes.map(c => {
    const cad = c.cadastro ? new Date(c.cadastro).toLocaleDateString('pt-BR') : '-';
    const status = c.bloqueado ? 'Bloqueado' : c.fraude ? 'Fraude' : 'Ativo';
    const nasc = c.dataNasc ? c.dataNasc.split('-').reverse().join('/') : '-';
    return `"${c.id_permanente||'-'}","${(c.nome||'').replace(/"/g,'""')}","${c.cel||''}","${nasc}",${c.saldoPontos||0},"${cad}","${status}"`;
  });
  const csv = BOM + [header,...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `clientes_itapolitana_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast(`CSV com ${clientes.length} clientes exportado!`,'sucesso');
}

// ═══════════════════════════════════════════════════════════
//  — EXCLUIR CÓDIGO INDIVIDUAL
// ═══════════════════════════════════════════════════════════
function excluirCodigo(cod) {
  if(!fidRequireWrite())return;
  const codigos=fidGetCodigos();
  const v = codigos[cod];
  if (!v) return;
  confirmarAcao(
    'Excluir Código',
    `Tem certeza que deseja excluir o código <strong>${cod}</strong>?<br><span style="font-size:.82rem;color:#666">Status: ${v.status} ${v.usadoPor?'· Usado por: '+v.usadoPor:''}</span><br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir código',
    async () => {
      const fidData=fidEnsureCodigos();
      delete fidData.codigos[cod];
      STATE.fidelidade.liberados = Object.keys(fidData.codigos).length;
      const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: excluir código ' + cod);
      if (ok) { toast('Código excluído.','ok'); renderCódigos(); atualizarStatsCódigos(); fidRenderProgresso(); }
    }
  );
}


// ═══════════════════════════════════════════════════════════
// MODAL AJUSTE DE PONTOS (Fidelidade – cliente)
// ═══════════════════════════════════════════════════════════
let _pontosClienteId = null;
function abrirModalPontos(clienteId){
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[clienteId];
  if(!c){toast('Cliente não encontrado','erro');return;}
  _pontosClienteId=clienteId;
  document.getElementById('mp-nome').textContent=c.nome||clienteId;
  const saldo=c.saldoPontos||0;
  document.getElementById('mp-saldo').textContent=saldo;
  document.getElementById('mp-saldo-novo').textContent=saldo;
  document.getElementById('mp-qtd').value='';
  document.getElementById('mp-tipo').value='manual';
  document.getElementById('mp-motivo').value='';
  // Histórico
  const hist=c.historico_alteracoes||[];
  const filtrados=hist.filter(h=>h.pontos!==undefined||['ponto_manual','codigo_validado_admin','bonus','correcao','resgate','expiracao','manual'].includes(h.tipo));
  const ultimos=filtrados.slice(-20).reverse();
  let histHtml=ultimos.length?ultimos.map(h=>{
    const tipo=h.tipo||'manual';
    const pts=h.pontos!==undefined?(h.pontos>0?'+'+h.pontos:h.pontos):'';
    const data=h.data?new Date(h.data).toLocaleString('pt-BR'):'-';
    return `<div class="hist-item"><span class="hist-tipo ${tipo.includes('resgate')?'resgate':tipo.includes('expi')?'expiracao':tipo.includes('corr')?'correcao':tipo.includes('bonus')?'bonus':'manual'}">${tipo}</span><div style="flex:1"><div style="font-weight:600">${h.descricao||'—'}</div><div style="color:#888;font-size:.75rem">${data}</div></div>${pts?`<span style="font-weight:800;color:${pts.startsWith('+')?'#2e7d32':'#c62828'}">${pts} pts</span>`:''}</div>`;
  }).join(''):'<p style="color:#aaa;font-size:.82rem;text-align:center;padding:10px">Nenhuma transação registrada.</p>';
  document.getElementById('mp-historico').innerHTML=histHtml;
  document.getElementById('modal-pontos').classList.add('show');
}
function fecharModalPontos(){document.getElementById('modal-pontos').classList.remove('show');_pontosClienteId=null;}
function previewNovoPontos(){
  const qtd=parseInt(document.getElementById('mp-qtd').value)||0;
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[_pontosClienteId];
  const saldo=c?c.saldoPontos||0:0;
  const novo=Math.max(0,saldo+qtd);
  document.getElementById('mp-saldo-novo').textContent=novo;
  document.getElementById('mp-saldo-novo').style.color=qtd>=0?'#2e7d32':'#c62828';
}
async function salvarModalPontos(){
  if(!GH_WRITE_ALLOWED){toast('Modo somente leitura.','aviso');return;}
  const qtd=parseInt(document.getElementById('mp-qtd').value)||0;
  if(qtd===0){toast('Informe uma quantidade diferente de 0.','aviso');return;}
  const tipo=document.getElementById('mp-tipo').value;
  const motivo=document.getElementById('mp-motivo').value.trim()||'Ajuste manual pelo admin';
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[_pontosClienteId];
  if(!c){toast('Cliente não encontrado','erro');return;}
  const saldoAnterior=c.saldoPontos||0;
  c.saldoPontos=Math.max(0,saldoAnterior+qtd);
  const agora=new Date().toISOString();
  if(!c.historico_alteracoes)c.historico_alteracoes=[];
  c.historico_alteracoes.push({data:agora,tipo,descricao:motivo,por:'admin',pontos:qtd});
  const ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: ajuste de pontos ${_pontosClienteId} (${qtd>0?'+':''}${qtd})`);
  if(ok){fecharModalPontos();renderClientes();toast(`✅ Pontos ajustados! Novo saldo: ${c.saldoPontos}`,'sucesso');}
}

// ═══════════════════════════════════════════════════════════
// RASTREIO — Minha Encomenda (como o cliente vê)
// ═══════════════════════════════════════════════════════════
function buscarRastreio(){
  const busca=(document.getElementById('rastreio-busca')?.value||'').trim().toLowerCase();
  const container=document.getElementById('rastreio-resultado');
  if(!busca){container.innerHTML='<p style="color:#aaa;text-align:center;padding:30px">Digite o nº do pedido ou telefone.</p>';return;}
  const registros=STATE.encomendas?.registros||[];
  const e=registros.find(r=>{
    const num=(r.num||'').toLowerCase();
    const tel=(r.telefone||r.tel||'').replace(/\D/g,'');
    return num===busca||num.includes(busca)||tel.endsWith(busca.replace(/\D/g,''));
  });
  if(!e){container.innerHTML='<div style="background:#ffebee;border-radius:12px;padding:20px;text-align:center;color:#c62828;font-weight:700">❌ Pedido não encontrado. Verifique o número ou telefone.</div>';return;}
  container.innerHTML=renderRastreioCard(e);
}
function renderRastreioCard(e){
  const statusAtual=e.status||'novo';
  const idxAtual=TIMELINE_PASSOS.indexOf(statusAtual);
  const tlHtml=TIMELINE_PASSOS.map((s,i)=>{
    let cls='tl-step';
    if(i<idxAtual)cls+=' done';else if(i===idxAtual)cls+=' current';
    return `<div class="${cls}"><div class="tl-dot">${TIMELINE_ICONES[i]}</div><div class="tl-label">${TIMELINE_LABELS[i]}</div></div>`;
  }).join('');
  let itensHtml='';let totalCalc=0;
  (e.itens||[]).forEach(it=>{
    const sub=(it.preço||0)*(it.qtd||1);totalCalc+=sub;
    const sabores=it.sabores&&it.sabores.length?`<br><small style="color:#888">${esc(it.sabores.join(', '))}</small>`:'';
    itensHtml+=`<div class="rastreio-item"><span><strong>${esc(it.nome)}</strong>${sabores} ×${it.qtd}</span><span>R$ ${sub.toFixed(2).replace('.',',')}</span></div>`;
  });
  const total=e.total||totalCalc;
  const dataStr=e.dataFormatada||(e.data?new Date(e.data).toLocaleString('pt-BR'):'-');
  const label=ENC_STATUS_LABELS[statusAtual]||statusAtual;
  const cor=ENC_STATUS_BORDA[statusAtual]||'#e65100';
  return `<div class="rastreio-card">
    <div class="rastreio-num">${esc(e.num||'-')}</div>
    <div class="rastreio-nome">👤 ${esc(e.nome||'-')}</div>
    <div class="rastreio-data">📅 ${dataStr} &nbsp;·&nbsp; 📱 ${esc(e.telefone||e.tel||'-')}</div>
    ${e.endereço?`<div class="rastreio-data" style="margin-top:2px">📍 ${esc(e.endereço)}</div>`:''}
    <div style="margin:14px 0;padding:10px 14px;background:${ENC_STATUS_COR[statusAtual]||'#f8f9fa'};border-left:4px solid ${cor};border-radius:8px">
      <strong>Status atual:</strong> <span style="color:${cor};font-weight:800">${label}</span>
    </div>
    <div class="timeline" style="margin:16px 0">${tlHtml}</div>
    <div class="rastreio-itens-wrap">${itensHtml||'<p style="color:#aaa">Sem itens.</p>'}</div>
    <div class="rastreio-total"><span>Total do Pedido</span><span>R$ ${parseFloat(total||0).toFixed(2).replace('.',',')}</span></div>
    <div style="margin-top:16px;text-align:center">
      <button onclick="abrirModalEncomenda('${esc(e.num)}')" class="btn btn-laranja" style="width:100%">📋 Abrir no Admin</button>
    </div>
  </div>`;
}
function renderRastreioRecentes(){
  const registros=(STATE.encomendas?.registros||[]).slice(0,10);
  const isReadOnly=!GH_WRITE_ALLOWED;
  const container=document.getElementById('rastreio-recentes');
  if(!container)return;
  if(!registros.length){
    container.innerHTML=
      '<p style="color:#aaa;font-size:.85rem;margin:0">Nenhuma encomenda ainda.</p>'+
      (isReadOnly?'<div style="margin-top:10px;background:#e3f2fd;border:1px solid #bbdefb;color:#0d47a1;border-radius:10px;padding:12px;font-size:.82rem;line-height:1.45">ℹ️ Você está em modo somente leitura (sem token GitHub). A listagem funciona, mas você não conseguirá salvar alterações.</div>':'');
    return;
  }
  container.innerHTML=registros.map(e=>{
    const cor=ENC_STATUS_BORDA[e.status]||'#888';
    const label=ENC_STATUS_LABELS[e.status]||e.status||'—';
    const dataStr=e.dataFormatada||(e.data?new Date(e.data).toLocaleDateString('pt-BR'):'-');
    const totalStr=e.total?`R$ ${parseFloat(e.total).toFixed(2).replace('.',',')}`:'-';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f2f5;cursor:pointer" onclick="document.getElementById('rastreio-busca').value='${esc(e.num)}';buscarRastreio()">
      <div>
        <div style="font-weight:700;color:#333;font-size:.88rem">${esc(e.num||'-')} — ${esc(e.nome||'-')}</div>
        <div style="font-size:.75rem;color:#888">📅 ${dataStr} · ${esc(e.tipo||'geral')}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:#1565c0;font-size:.9rem">${totalStr}</div>
        <span style="background:${cor};color:#fff;padding:1px 8px;border-radius:8px;font-size:.7rem">${label}</span>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// AUDITORIA — Detector de inconsistências
// ═══════════════════════════════════════════════════════════
let _auditoriaResultados = [];
function executarAuditoria(){
  _auditoriaResultados=[];
  const filtroMod=document.getElementById('audit-filtro-mod')?.value||'';
  const clientesCarregados=Boolean(STATE.clientes?.clientes&&typeof STATE.clientes.clientes==='object');
  const clientes=clientesCarregados?STATE.clientes.clientes:{};
  const fidelidade=STATE.fidelidade||{};
  const encomendas=STATE.encomendas?.registros||[];
  // ── 1. Clientes com pontos negativos (não deveria ser possível)
  if(!filtroMod||filtroMod==='clientes'){
    Object.entries(clientes).forEach(([id,c])=>{
      if((c.saldoPontos||0)<0){
        _auditoriaResultados.push({modulo:'clientes',severidade:'alta',tipo:'pontos_negativos',titulo:`Pontos negativos: ${c.nome}`,descricao:`Cliente ${id} tem saldo de pontos negativo: ${c.saldoPontos}`,admin:c.saldoPontos,site:0,id,acao:'zerar_pontos',clienteId:id});
      }
    });
    // ── 2. Clientes com muitas tentativas de fraude sem bloqueio
    Object.entries(clientes).forEach(([id,c])=>{
      if((c.tentativas_fraude||0)>=3&&!c.bloqueado){
        _auditoriaResultados.push({modulo:'clientes',severidade:'critica',tipo:'fraude_sem_bloqueio',titulo:`Fraude não bloqueada: ${c.nome}`,descricao:`${c.tentativas_fraude} tentativas de fraude registradas mas conta não está bloqueada.`,admin:'não bloqueado',site:c.tentativas_fraude+' tentativas',id,clienteId:id});
      }
    });
    // ── 3. Clientes duplicados por nome+nasc
    const vistos={};
    Object.entries(clientes).forEach(([id,c])=>{
      const chave=`${(c.nome||'').trim().toLowerCase()}|${c.dataNasc||''}`;
      if(chave.length>2){
        if(vistos[chave]){
          _auditoriaResultados.push({modulo:'clientes',severidade:'media',tipo:'duplicata_possivel',titulo:`Possível duplicata: ${c.nome}`,descricao:`IDs ${vistos[chave]} e ${id} têm mesmo nome e data de nascimento.`,admin:id,site:vistos[chave],id});
        }else{vistos[chave]=id;}
      }
    });
  }
  // ── 4. Encomendas travadas em "novo" por mais de 3 dias
  if(!filtroMod||filtroMod==='encomendas'){
    const TRES_DIAS_MS=3*24*60*60*1000;
    const tresDiasAtras=Date.now()-TRES_DIAS_MS;
    encomendas.forEach(e=>{
      if(e.status==='novo'&&e.data&&new Date(e.data).getTime()<tresDiasAtras){
        _auditoriaResultados.push({modulo:'encomendas',severidade:'alta',tipo:'enc_travada',titulo:`Encomenda parada: ${e.num}`,descricao:`Pedido de ${e.nome} está com status "novo" há mais de 3 dias (${e.dataFormatada||e.data}).`,admin:'novo',site:'—',id:e.num});
      }
    });
    // ── 5. Encomendas sem total registrado
    encomendas.forEach(e=>{
      if(!e.total&&e.total!==0){
        _auditoriaResultados.push({modulo:'encomendas',severidade:'baixa',tipo:'enc_sem_total',titulo:`Encomenda sem total: ${e.num}`,descricao:`Pedido ${e.num} de ${e.nome} não tem valor total registrado.`,admin:'sem total',site:'—',id:e.num});
      }
    });
  }
  // ── 6. Fidelidade — códigos usados em clientes inexistentes
  if((!filtroMod||filtroMod==='fidelidade')&&clientesCarregados){
    const codigos=fidelidade.códigos||fidelidade.codigos||{};
    Object.entries(codigos).forEach(([cod,v])=>{
      if(v.status==='usado'&&v.usadoPor){
        const cel=(v.usadoPor||'').replace(/\D/g,'');
        const achouCliente=Object.values(clientes).some(c=>(c.cel||'').replace(/\D/g,'')===cel);
        if(!achouCliente&&cel){
          _auditoriaResultados.push({modulo:'fidelidade',severidade:'media',tipo:'codigo_sem_cliente',titulo:`Código usado por cliente inexistente`,descricao:`Código ${cod} foi usado por ${v.usadoPor} mas esse telefone não existe nos clientes cadastrados.`,admin:v.usadoPor,site:'não cadastrado',id:cod});
        }
      }
    });
  }
  renderAuditoria();
}
function renderAuditoria(){
  const filtroMod=document.getElementById('audit-filtro-mod')?.value||'';
  const filtroSev=document.getElementById('audit-filtro-sev')?.value||'';
  const workerAtivo=Boolean(getAdminToken());
  const clientesCarregados=Boolean(STATE.clientes?.clientes&&typeof STATE.clientes.clientes==='object');
  const encomendasCarregadas=Array.isArray(STATE.encomendas?.registros);
  let lista=_auditoriaResultados.filter(r=>{
    if(filtroMod&&r.modulo!==filtroMod)return false;
    if(filtroSev&&r.severidade!==filtroSev)return false;
    return true;
  });
  // Ordenar por severidade
  const sevOrd={critica:0,alta:1,media:2,baixa:3};
  lista.sort((a,b)=>(sevOrd[a.severidade]||4)-(sevOrd[b.severidade]||4));
  // Stats
  const cnt={critica:0,alta:0,media:0,baixa:0};
  _auditoriaResultados.forEach(r=>cnt[r.severidade]=(cnt[r.severidade]||0)+1);
  document.getElementById('audit-cnt-critica').textContent=cnt.critica||0;
  document.getElementById('audit-cnt-alta').textContent=cnt.alta||0;
  document.getElementById('audit-cnt-media').textContent=cnt.media||0;
  document.getElementById('audit-cnt-baixa').textContent=cnt.baixa||0;
  document.getElementById('audit-cnt-total').textContent=_auditoriaResultados.length;
  // Atualizar badge da nav
  const badgeNav=document.getElementById('badge-audit-nav');
  if(badgeNav){
    const total=_auditoriaResultados.length;
    badgeNav.textContent=total;
    badgeNav.style.display=total>0?'inline-block':'none';
  }
  const container=document.getElementById('audit-lista');
  if(!container)return;
  if(!lista.length){
    if(!workerAtivo&&(!clientesCarregados||!encomendasCarregadas)){
      container.innerHTML=`<div style="background:#e3f2fd;border:1px solid #bbdefb;border-radius:12px;padding:20px;color:#0d47a1;font-size:.84rem;line-height:1.5">
        ℹ️ <strong>Modo somente leitura.</strong> A Auditoria está com escopo reduzido porque os dados de Clientes/Encomendas não foram carregados nesta sessão.<br>
        Adicione um token GitHub para auditoria completa.
      </div>`;
      return;
    }
    container.innerHTML=`<div style="background:#e8f5e9;border-radius:12px;padding:24px;text-align:center;color:#2e7d32;font-weight:700">✅ Nenhuma inconsistência encontrada nos filtros selecionados!</div>`;
    return;
  }
  container.innerHTML=lista.map(r=>{
    const acaoBtns=r.tipo==='fraude_sem_bloqueio'?`<button class="btn btn-vermelho" style="padding:5px 12px;font-size:.78rem" onclick="toggleBloqueio('${r.clienteId}',true)">🔒 Bloquear Agora</button>`
      :r.tipo==='pontos_negativos'?`<button class="btn btn-laranja" style="padding:5px 12px;font-size:.78rem" onclick="zerarPontosNegativos('${r.clienteId}')">🔧 Zerar Pontos</button>`
      :r.tipo==='enc_travada'?`<button class="btn" style="background:#1565c0;color:#fff;padding:5px 12px;font-size:.78rem" onclick="abrirModalEncomenda('${r.id}')">📋 Ver Encomenda</button>`
      :'';
    return `<div class="audit-card ${r.severidade}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
        <div>
          <span class="audit-badge ${r.severidade}">${r.severidade}</span>
          <span style="margin-left:8px;font-size:.75rem;color:#888;text-transform:uppercase">${r.modulo}</span>
          <div style="font-weight:800;font-size:.92rem;color:#333;margin-top:4px">${esc(r.titulo)}</div>
          <div style="font-size:.82rem;color:#555;margin-top:3px">${esc(r.descricao)}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start;margin-top:4px">
          ${acaoBtns}
        </div>
      </div>
      <div class="audit-vals">
        <span><strong>Admin:</strong> <span class="audit-val-admin">${esc(String(r.admin))}</span></span>
        <span><strong>Site/Esperado:</strong> <span class="audit-val-site">${esc(String(r.site))}</span></span>
      </div>
    </div>`;
  }).join('');
}
function exportarRelatorioAuditoria(){
  if(!_auditoriaResultados.length){toast('Nenhuma inconsistência para exportar.','aviso');return;}
  const data={geradoEm:new Date().toISOString(),totalInconsistencias:_auditoriaResultados.length,resultados:_auditoriaResultados};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`auditoria_${new Date().toISOString().slice(0,10)}.json`;
  a.click();URL.revokeObjectURL(url);
  toast('Relatório exportado!','sucesso');
}
async function zerarPontosNegativos(clienteId){
  if(!GH_WRITE_ALLOWED){toast('Modo somente leitura.','aviso');return;}
  const clientes=STATE.clientes?.clientes||{};
  const c=clientes[clienteId];
  if(!c)return;
  c.saldoPontos=0;
  if(!c.historico_alteracoes)c.historico_alteracoes=[];
  c.historico_alteracoes.push({data:new Date().toISOString(),tipo:'correcao',descricao:'Pontos negativos zerados via auditoria',por:'admin',pontos:0});
  const ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha','Admin: zerar pontos negativos '+clienteId);
  if(ok){executarAuditoria();toast('Pontos zerados!','sucesso');}
}

