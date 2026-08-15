/**
 * itap-admin-validacao.js
 * Sistema de validação de campos do painel administrativo — Sorveteria Itapolitana Cajuru
 *
 * Funcionalidades:
 *  - Contador de caracteres Unicode em tempo real (todos os campos com maxlength)
 *  - Cores progressivas: verde → amarelo (≥80%) → vermelho (≥100%)
 *  - spellcheck="true" / lang="pt-BR" automático em textareas
 *  - Validadores específicos: SEO (preview Google), URL, telefone, e-mail, preço, alt text
 *  - ARIA: aria-invalid, aria-describedby, aria-live
 *  - Aviso ao sair com alterações não salvas (complementa checkDirty existente)
 *  - Mensagens de erro específicas por tipo de campo
 *  - Preservação do texto digitado — nunca apaga o conteúdo do usuário
 *
 * Sem dependências externas. Compatível com ES5+.
 * Seguro: nenhuma entrada é enviada ou alterada automaticamente.
 */
;(function (global) {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
   * 1. UTILITÁRIOS BASE
   * ══════════════════════════════════════════════════════════════════════════ */

  /** Conta caracteres reais (Unicode-safe — lida com emojis e acentos) */
  function contarChars(str) {
    try { return Array.from(String(str || '')).length; }
    catch (_) { return String(str || '').length; }
  }

  /** Escapa HTML para exibição segura em prévia */
  function escHtml(s) {
    var AMP_RE = /&/g, LT_RE = /</g, GT_RE = />/g, QUOT_RE = /"/g;
    return String(s || '').replace(AMP_RE,'&amp;').replace(LT_RE,'&lt;').replace(GT_RE,'&gt;').replace(QUOT_RE,'&quot;');
  }

  /** Retorna elemento por id (null-safe) */
  function $id(id) { return document.getElementById(id); }

  /** Cria elemento com atributos opcionais */
  function criarEl(tag, attrs, innerHTML) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
    if (innerHTML !== undefined) el.innerHTML = innerHTML;
    return el;
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 2. REGRAS DE VALIDAÇÃO POR CAMPO
   * Cada entrada define: min, aviso, tipo e mensagem de destino no site.
   * ══════════════════════════════════════════════════════════════════════════ */
  var REGRAS = {
    /* ── SEO / meta ─────────────────────────────────────────────── */
    'cfg-seo-titulo':              { min:20, tipo:'seo-title',  destino:'Título <title> da Página Inicial (aba do navegador e Google)' },
    'cfg-seo-descricao':           { min:50, tipo:'seo-desc',   destino:'Meta description da Página Inicial (resultado no Google)' },
    'cfg-seo-promocao-titulo':     { min:10, tipo:'seo-title',  destino:'Título <title> da página Promoção' },
    'cfg-seo-promocao-descricao':  { min:50, tipo:'seo-desc',   destino:'Meta description da página Promoção' },
    'cfg-seo-enc-titulo':          { min:10, tipo:'seo-title',  destino:'Título <title> da página Encomendas' },
    'cfg-seo-enc-descricao':       { min:50, tipo:'seo-desc',   destino:'Meta description da página Encomendas' },
    'cfg-seo-sobre-titulo':        { min:10, tipo:'seo-title',  destino:'Título <title> da página Sobre' },
    'cfg-seo-sobre-descricao':     { min:50, tipo:'seo-desc',   destino:'Meta description da página Sobre' },
    'cfg-seo-galeria-titulo':      { min:10, tipo:'seo-title',  destino:'Título <title> da página Galeria' },
    'cfg-seo-galeria-descricao':   { min:50, tipo:'seo-desc',   destino:'Meta description da página Galeria' },
    'cfg-seo-dicas-titulo':        { min:10, tipo:'seo-title',  destino:'Título <title> da página Dicas' },
    'cfg-seo-dicas-descricao':     { min:50, tipo:'seo-desc',   destino:'Meta description da página Dicas' },
    'cfg-seo-fid-titulo':          { min:10, tipo:'seo-title',  destino:'Título <title> da página Fidelidade' },
    'cfg-seo-fid-descricao':       { min:50, tipo:'seo-desc',   destino:'Meta description da página Fidelidade' },
    'cfg-seo-fidelidade-titulo':   { min:10, tipo:'seo-title',  destino:'Título <title> da página Fidelidade' },
    'cfg-seo-fidelidade-descricao':{ min:50, tipo:'seo-desc',   destino:'Meta description da página Fidelidade' },
    'cfg-seo-carrossel-titulo':    { min:10, tipo:'seo-title',  destino:'Título <title> da página Carrossel' },
    'cfg-seo-carrossel-descricao': { min:50, tipo:'seo-desc',   destino:'Meta description da página Carrossel' },
    'fid-seo-titulo':              { min:10, tipo:'seo-title',  destino:'Título SEO do programa Fidelidade' },
    'fid-seo-descricao':           { min:50, tipo:'seo-desc',   destino:'Meta description do programa Fidelidade' },
    /* ── Textos principais ───────────────────────────────────────── */
    'home-titulo':                 { min:10, destino:'Título hero da Página Inicial' },
    'home-subtitulo':              { min:10, destino:'Subtítulo hero da Página Inicial' },
    'home-descricao':              { min:20, destino:'Descrição hero da Página Inicial' },
    'home-badge':                  { min:3,  destino:'Badge acima do título na Página Inicial' },
    'home-cta':                    { min:3,  destino:'Botão CTA principal da Página Inicial' },
    'index-hero-h1-principal':     { min:20, destino:'H1 principal da Página Inicial (SEO crítico)' },
    'index-hero-descricao-principal':{ min:30, destino:'Descrição principal do hero da Página Inicial' },
    'index-hero-badge-acai':       { min:5,  destino:'Badge de destaque do Açaí na Página Inicial' },
    'index-strip-sensorial-texto': { min:10, destino:'Faixa animada (strip) na Página Inicial' },
    'index-cardapio-h2-titulo':    { min:10, destino:'Título H2 da seção Cardápio na Página Inicial' },
    'index-quem-somos-titulo':     { min:5,  destino:'Título "Quem Somos" na Página Inicial' },
    'index-horario-status-texto':  { min:5,  destino:'Status de horário exibido na Página Inicial' },
    'enc-hero-titulo':             { min:10, destino:'Título H1 da página Encomendas' },
    'enc-hero-desc':               { min:20, destino:'Descrição hero da página Encomendas' },
    /* ── Contato e dados da empresa ─────────────────────────────── */
    'cfg-whatsapp':                { tipo:'telefone', destino:'Número WhatsApp em todos os botões do site' },
    'cfg-whats-fmt':               { tipo:'telefone-fmt', destino:'WhatsApp formatado exibido ao cliente' },
    'cfg-endereco':                { min:5,  destino:'Endereço curto (rodapé, chatbot)' },
    'cfg-endereço-completo':       { min:10, destino:'Endereço completo (página Sobre, chatbot)' },
    'cfg-horario':                 { min:5,  destino:'Horário geral (rodapé, chatbot, página Sobre)' },
    'cfg-horário-det':             { min:5,  destino:'Horário detalhado (página Sobre, FAQ)' },
    'cfg-instagram':               { tipo:'instagram', destino:'Link do Instagram (rodapé, chatbot)' },
    'cfg-CNPJ':                    { tipo:'cnpj', destino:'CNPJ (página Sobre)' },
    'cfg-nome-empresa':            { min:3,  destino:'Nome da empresa (SEO, rodapé, schema)' },
    'cfg-slogan':                  { min:5,  destino:'Slogan (meta tags, schema)' },
    'cfg-footer-copy':             { min:10, destino:'Texto de copyright no rodapé' },
    /* ── Banners e alt text ──────────────────────────────────────── */
    'home-banner-alt':             { min:10, tipo:'alt', destino:'Texto alternativo do banner do carrossel (SEO + acessibilidade)' },
    'crs-banner-alt':              { min:10, tipo:'alt', destino:'Texto alternativo do banner do carrossel (SEO + acessibilidade)' },
    /* ── Promoção ────────────────────────────────────────────────── */
    'promo-título':                { min:10, destino:'Título da promoção (página Promoção)' },
    'promo-descricao':             { min:20, destino:'Descrição da promoção (página Promoção)' },
    'promo-fab':                   { min:3,  destino:'Texto do botão flutuante FAB de promoção' },
    /* ── Links / URLs ────────────────────────────────────────────── */
    'cfg-dash-sobre-url':          { tipo:'url', destino:'URL da página Sobre no link do dashboard' },
    'cfg-dash-galeria-url':        { tipo:'url', destino:'URL da página Galeria no link do dashboard' },
    'cfg-dash-carrossel-url':      { tipo:'url', destino:'URL do carrossel no link do dashboard' },
    'home-carrinho-whats':         { min:5,  destino:'Mensagem pré-preenchida do link WhatsApp (carrinho eventos)' }
  };

  /* ══════════════════════════════════════════════════════════════════════════
   * 3. CSS DOS CONTADORES (injetado uma única vez)
   * ══════════════════════════════════════════════════════════════════════════ */
  var CSS_CONTADOR = [
    '.itap-contador{display:flex;align-items:center;gap:6px;font-size:.76rem;margin-top:4px;padding:3px 0;color:#546e7a;transition:color .2s}',
    '.itap-contador.ok{color:#2e7d32}',
    '.itap-contador.aviso{color:#f57c00}',
    '.itap-contador.erro{color:#c62828;font-weight:700}',
    '.itap-contador-barra{flex:1;height:4px;border-radius:2px;background:#e0e0e0;overflow:hidden}',
    '.itap-contador-fill{height:100%;border-radius:2px;transition:width .15s,background .2s;background:#2e7d32}',
    '.itap-contador-fill.aviso{background:#f57c00}',
    '.itap-contador-fill.erro{background:#c62828}',
    '.itap-erro-campo{margin-top:4px;padding:6px 10px;border-radius:6px;font-size:.78rem;background:#ffebee;border-left:3px solid #c62828;color:#b71c1c;display:none}',
    '.itap-erro-campo.ativo{display:block}',
    '.itap-aviso-campo{margin-top:4px;padding:6px 10px;border-radius:6px;font-size:.78rem;background:#fff8e1;border-left:3px solid #f9a825;color:#e65100;display:none}',
    '.itap-aviso-campo.ativo{display:block}',
    '.itap-seo-preview{margin-top:8px;border:1px solid #e0e0e0;border-radius:8px;padding:12px 14px;background:#fff;font-family:Arial,sans-serif}',
    '.itap-seo-preview .seo-url{font-size:.75rem;color:#188038;margin-bottom:2px}',
    '.itap-seo-preview .seo-titulo{font-size:1.05rem;color:#1a0dab;font-weight:400;cursor:pointer;line-height:1.3;margin-bottom:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}',
    '.itap-seo-preview .seo-desc{font-size:.83rem;color:#4d5156;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
    '.itap-seo-preview .seo-label{font-size:.7rem;color:#999;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}',
    'input[aria-invalid="true"],textarea[aria-invalid="true"]{border-color:#c62828!important;box-shadow:0 0 0 2px rgba(198,40,40,.15)!important}',
    'input:focus,textarea:focus{outline:2px solid #1565c0;outline-offset:1px}'
  ].join('');

  function injetarCSS() {
    if ($id('itap-validacao-css')) return;
    var s = criarEl('style', {id:'itap-validacao-css'}, CSS_CONTADOR);
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 4. CONTADOR DE CARACTERES
   * ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Cria e vincula um contador de caracteres a um campo.
   * @param {HTMLElement} campo - input ou textarea
   * @param {number} max - limite máximo (de maxlength)
   * @param {number} min - limite mínimo opcional
   */
  function criarContador(campo, max, min) {
    if (campo.dataset.itapContador) return; // evita duplicação
    campo.dataset.itapContador = '1';

    var wrapperId = 'itap-cnt-' + (campo.id || Math.random().toString(36).slice(2));
    var fillId    = wrapperId + '-fill';
    var textoId   = wrapperId + '-txt';

    // Container do contador
    var wrap = criarEl('div', {
      class: 'itap-contador ok',
      id: wrapperId,
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    });

    var barra = criarEl('div', {class: 'itap-contador-barra'});
    var fill  = criarEl('div', {class: 'itap-contador-fill', id: fillId, style:'width:0%'});
    barra.appendChild(fill);

    var texto = criarEl('span', {id: textoId});
    wrap.appendChild(barra);
    wrap.appendChild(texto);

    // Inserir APÓS o campo (antes do próximo hint ou no final do campo-edit)
    var next = campo.nextElementSibling;
    if (next) {
      campo.parentNode.insertBefore(wrap, next);
    } else {
      campo.parentNode.appendChild(wrap);
    }

    // aria-describedby no campo
    var descIds = (campo.getAttribute('aria-describedby') || '').trim();
    campo.setAttribute('aria-describedby', (descIds ? descIds + ' ' : '') + wrapperId);

    function atualizar() {
      var val   = campo.value;
      var used  = contarChars(val);
      var pct   = max > 0 ? (used / max) * 100 : 0;
      var over  = used > max;
      var abaixoMin = min > 0 && used > 0 && used < min;

      // Barra
      fill.style.width = Math.min(pct, 100) + '%';
      fill.className = 'itap-contador-fill' + (over ? ' erro' : pct >= 80 ? ' aviso' : '');

      // Texto e cor
      var msg;
      if (over) {
        var excesso = used - max;
        msg = 'Ultrapassou o limite em ' + excesso + ' caractere' + (excesso > 1 ? 's' : '');
        wrap.className = 'itap-contador erro';
        campo.setAttribute('aria-invalid','true');
      } else if (abaixoMin) {
        msg = used + ' de ' + max + ' · mín. ' + min;
        wrap.className = 'itap-contador aviso';
        campo.removeAttribute('aria-invalid');
      } else if (pct >= 80) {
        msg = used + ' de ' + max + ' caracteres';
        wrap.className = 'itap-contador aviso';
        campo.removeAttribute('aria-invalid');
      } else {
        msg = used + ' de ' + max + ' caracteres';
        wrap.className = 'itap-contador ok';
        campo.removeAttribute('aria-invalid');
      }

      if (min > 0 && used === 0) {
        msg = 'Mínimo de ' + min + ' caracteres · máx. ' + max;
        wrap.className = 'itap-contador ok';
      }

      texto.textContent = msg;

      // Força sincronização do leitor de tela apenas quando muda de estado
      wrap.setAttribute('aria-label', msg);
    }

    campo.addEventListener('input',  atualizar);
    campo.addEventListener('change', atualizar);
    campo.addEventListener('paste',  function(){ setTimeout(atualizar, 10); });
    atualizar();
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 5. VALIDADORES ESPECÍFICOS
   * ══════════════════════════════════════════════════════════════════════════ */

  /** Exibe mensagem de erro abaixo do campo */
  function mostrarErroCampo(campo, msg) {
    var erroId = 'itap-err-' + campo.id;
    var erroEl = $id(erroId);
    if (!erroEl) {
      erroEl = criarEl('div', {
        class: 'itap-erro-campo',
        id: erroId,
        role: 'alert',
        'aria-live': 'assertive'
      });
      campo.parentNode.insertBefore(erroEl, campo.nextElementSibling);
      // Adicionar ao aria-describedby
      var desc = (campo.getAttribute('aria-describedby') || '').trim();
      if (desc.indexOf(erroId) < 0) {
        campo.setAttribute('aria-describedby', (desc ? desc + ' ' : '') + erroId);
      }
    }
    erroEl.textContent = msg;
    erroEl.classList.add('ativo');
    campo.setAttribute('aria-invalid','true');
  }

  /** Remove mensagem de erro */
  function limparErroCampo(campo) {
    var erroEl = $id('itap-err-' + campo.id);
    if (erroEl) {
      erroEl.classList.remove('ativo');
      erroEl.textContent = '';
    }
    campo.removeAttribute('aria-invalid');
  }

  /** Validação de URL */
  function validarURL(campo) {
    var val = campo.value.trim();
    if (!val) return; // campo vazio é tratado como obrigatório em outro lugar
    if (!/^https?:\/\//i.test(val)) {
      mostrarErroCampo(campo, '⚠️ O endereço deve começar com https:// ou http://. Verifique o link informado.');
      return;
    }
    try { new URL(val); limparErroCampo(campo); }
    catch(_) { mostrarErroCampo(campo, '⚠️ O endereço informado não é um link válido. Exemplo correto: https://www.instagram.com/sorveteriaitapolitanacajuru'); }
  }

  /** Validação de telefone / WhatsApp */
  function validarTelefone(campo) {
    var val = campo.value.replace(/\D/g, '');
    if (!val) return;
    if (val.length < 10 || val.length > 13) {
      mostrarErroCampo(campo, '⚠️ O número deve ter entre 10 e 13 dígitos (incluindo DDD e código do país se necessário). Exemplo: 5516996062046');
      return;
    }
    var NUMEROS_RE = /^[0-9]+$/;
    if (!NUMEROS_RE.test(val)) {
      mostrarErroCampo(campo, '⚠️ Use apenas números. Não inclua espaços, traços ou parênteses no número armazenado.');
      return;
    }
    limparErroCampo(campo);
  }

  /** Validação de Instagram */
  function validarInstagram(campo) {
    var val = campo.value.trim();
    if (!val) return;
    var INSTA_PREFIX_RE = /^@/;
    var INSTA_URL_RE = /^https?:\/\/(www\.)?instagram\.com\//;
    if (!INSTA_PREFIX_RE.test(val) && !INSTA_URL_RE.test(val)) {
      mostrarErroCampo(campo, '⚠️ Informe o @usuário do Instagram (ex: @sorveteriaitapolitanacajuru) ou o link completo.');
      return;
    }
    limparErroCampo(campo);
  }

  /** Validação de CNPJ */
  function validarCNPJ(campo) {
    var val = campo.value.replace(/\D/g, '');
    if (!val) return;
    if (val.length !== 14) {
      mostrarErroCampo(campo, '⚠️ O CNPJ deve ter 14 dígitos. Exemplo: 08922044000180 ou 08.922.044/0001-80');
      return;
    }
    limparErroCampo(campo);
  }

  /** Validação de texto alternativo de imagem */
  function validarAlt(campo) {
    var val = campo.value.trim();
    if (!val) return;
    if (/^(imagem de|foto de|image of)/i.test(val)) {
      mostrarErroCampo(campo, '⚠️ Evite começar com "imagem de" ou "foto de". Descreva o conteúdo diretamente. Ex: "Taça de açaí com granola e morango — Itapolitana Cajuru"');
      return;
    }
    if (contarChars(val) < 10) {
      mostrarErroCampo(campo, '⚠️ O texto alternativo está muito curto. Descreva o que aparece na imagem com pelo menos 10 caracteres.');
      return;
    }
    limparErroCampo(campo);
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 6. PRÉVIA DE SEO (Google Snippet)
   * ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Cria ou atualiza prévia de resultado de busca do Google.
   * Vincula campo de título ao campo de descrição correspondente e vice-versa.
   */
  var seoLinks = {
    'cfg-seo-titulo':              { descId: 'cfg-seo-descricao',           url: 'itapolitanacajuru.com.br' },
    'cfg-seo-promocao-titulo':     { descId: 'cfg-seo-promocao-descricao',  url: 'itapolitanacajuru.com.br/promocao.html' },
    'cfg-seo-enc-titulo':          { descId: 'cfg-seo-enc-descricao',       url: 'itapolitanacajuru.com.br/encomendas.html' },
    'cfg-seo-sobre-titulo':        { descId: 'cfg-seo-sobre-descricao',     url: 'itapolitanacajuru.com.br/sobre.html' },
    'cfg-seo-galeria-titulo':      { descId: 'cfg-seo-galeria-descricao',   url: 'itapolitanacajuru.com.br/galeria.html' },
    'cfg-seo-dicas-titulo':        { descId: 'cfg-seo-dicas-descricao',     url: 'itapolitanacajuru.com.br/dicas.html' },
    'cfg-seo-fid-titulo':          { descId: 'cfg-seo-fid-descricao',       url: 'itapolitanacajuru.com.br/fidelidade' },
    'cfg-seo-fidelidade-titulo':   { descId: 'cfg-seo-fidelidade-descricao',url: 'itapolitanacajuru.com.br/fidelidade' },
    'cfg-seo-carrossel-titulo':    { descId: 'cfg-seo-carrossel-descricao', url: 'itapolitanacajuru.com.br/carrossel.html' },
    'fid-seo-titulo':              { descId: 'fid-seo-descricao',           url: 'itapolitanacajuru.com.br/fidelidade' }
  };

  function criarPreviewSEO(campoTitulo, url, campoDesc) {
    var previewId = 'itap-seo-preview-' + campoTitulo.id;
    if ($id(previewId)) return;

    var preview = criarEl('div', {class: 'itap-seo-preview', id: previewId, 'aria-label': 'Prévia de como este resultado aparecerá no Google'});
    preview.innerHTML = [
      '<div class="seo-label">📊 Prévia no Google</div>',
      '<div class="seo-url">' + escHtml(url) + '</div>',
      '<div class="seo-titulo" id="' + previewId + '-t">Preencha o título acima</div>',
      '<div class="seo-desc" id="' + previewId + '-d">Preencha a descrição para ver a prévia</div>'
    ].join('');

    // Inserir após o campo de título
    var next = campoTitulo.nextElementSibling;
    if (next) {
      campoTitulo.parentNode.insertBefore(preview, next);
    } else {
      campoTitulo.parentNode.appendChild(preview);
    }

    function atualizar() {
      var tEl = $id(previewId + '-t');
      var dEl = $id(previewId + '-d');
      if (tEl) tEl.textContent = campoTitulo.value || 'Preencha o título acima';
      if (dEl && campoDesc) dEl.textContent = campoDesc.value || 'Preencha a descrição para ver a prévia';
    }

    campoTitulo.addEventListener('input', atualizar);
    if (campoDesc) campoDesc.addEventListener('input', atualizar);
    atualizar();
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 7. ALERTAS DE QUALIDADE DE TEXTO
   * ══════════════════════════════════════════════════════════════════════════ */

  /** Detecta problemas comuns e exibe aviso (não bloqueia) */
  function alertaQualidade(campo) {
    var val = campo.value;
    if (!val || val.length < 5) return;

    var avisoId = 'itap-aviso-' + campo.id;
    var avisoEl = $id(avisoId);
    if (!avisoEl) {
      avisoEl = criarEl('div', {class:'itap-aviso-campo', id: avisoId, role:'status'});
      campo.parentNode.insertBefore(avisoEl, campo.nextElementSibling);
    }

    var problemas = [];

    // Espaços duplos
    var DOUBLE_SPACE_RE = /  /;
    if (DOUBLE_SPACE_RE.test(val)) problemas.push('espaços duplicados encontrados');

    // CAPS LOCK excessivo (mais de 50% maiúsculas em texto com mais de 10 chars)
    if (val.length > 10) {
      var letras   = val.replace(/[^a-zA-ZÀ-ú]/g,'');
      var maiusc   = val.replace(/[^A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]/g,'');
      if (letras.length > 5 && maiusc.length / letras.length > 0.5) {
        problemas.push('muitas letras maiúsculas — use apenas no início das frases');
      }
    }

    // Reticências com mais de 3 pontos
    var LONG_ELLIPSIS_RE = /\.{4,}/;
    if (LONG_ELLIPSIS_RE.test(val)) problemas.push('evite reticências longas (....) no texto do site');

    // Links malformados em campos de texto livre
    var urlMatch = campo.tagName === 'TEXTAREA' && val.match(/\bhttps?:\/\/[^\s]+/gi);
    if (urlMatch && urlMatch.some(function(u){ return /^http:/i.test(u); })) {
      problemas.push('verifique se os links no texto começam com https://');
    }

    if (problemas.length > 0) {
      avisoEl.innerHTML = '⚠️ <strong>Atenção:</strong> ' + problemas.map(escHtml).join('; ') + '.';
      avisoEl.classList.add('ativo');
    } else {
      avisoEl.classList.remove('ativo');
      avisoEl.textContent = '';
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 8. SPELLCHECK E ACESSIBILIDADE
   * ══════════════════════════════════════════════════════════════════════════ */

  function aplicarSpellcheck(campo) {
    if (campo.tagName === 'TEXTAREA' || campo.type === 'text') {
      campo.setAttribute('spellcheck', 'true');
      campo.setAttribute('lang', 'pt-BR');
      campo.setAttribute('autocorrect', 'on');
    }
  }

  function aplicarLabel(campo) {
    // Garante que o campo tem aria-label se não tiver label associado
    if (!campo.getAttribute('aria-label') && !campo.getAttribute('aria-labelledby')) {
      var labelEl = document.querySelector('label[for="' + campo.id + '"]');
      if (!labelEl) {
        // Tentar encontrar label anterior no mesmo campo-edit
        var parent = campo.closest ? campo.closest('.campo-edit') : null;
        if (parent) {
          var lbl = parent.querySelector('label');
          if (lbl && !lbl.htmlFor) {
            lbl.htmlFor = campo.id;
          }
        }
      }
    }
    // Marcar campo obrigatório com aria-required quando aplicável
    var regra = REGRAS[campo.id];
    if (regra && regra.obrigatorio) {
      campo.setAttribute('aria-required','true');
      campo.setAttribute('required','');
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 9. AVISO AO SAIR SEM SALVAR
   * ══════════════════════════════════════════════════════════════════════════ */

  var _campos_alterados = typeof Set === 'function' ? new Set() : {};
  var _usaSet = typeof Set === 'function';

  function marcarAlterado(campo) {
    if (_usaSet) { _campos_alterados.add(campo.id); }
    else { _campos_alterados[campo.id] = true; }
  }

  function limparAlterados() {
    if (_usaSet) { _campos_alterados.clear(); }
    else { _campos_alterados = {}; }
  }

  function temAlteracoes() {
    if (_usaSet) { return _campos_alterados.size > 0; }
    return Object.keys(_campos_alterados).length > 0;
  }

  // Expõe para o painel existente poder limpar após salvar
  global.itapValidacaoLimparAlterados = limparAlterados;

  /* ══════════════════════════════════════════════════════════════════════════
   * 10. INICIALIZAÇÃO PRINCIPAL
   * ══════════════════════════════════════════════════════════════════════════ */

  function inicializarCampo(campo) {
    if (!campo || !campo.id || campo.dataset.itapInit) return;
    campo.dataset.itapInit = '1';

    var max  = parseInt(campo.getAttribute('maxlength') || '0', 10);
    var regra = REGRAS[campo.id] || {};
    var min  = regra.min || 0;

    // Spellcheck e lang
    aplicarSpellcheck(campo);

    // Label acessível
    aplicarLabel(campo);

    // Contador de caracteres
    if (max > 0) {
      criarContador(campo, max, min);
    }

    // Destino no site (tooltip/hint acessível)
    if (regra.destino) {
      var destinoId = 'itap-dest-' + campo.id;
      if (!$id(destinoId)) {
        var destEl = criarEl('div', {
          id: destinoId,
          style: 'font-size:.72rem;color:#78909c;margin-top:2px'
        }, '📍 Aparece em: <strong>' + escHtml(regra.destino) + '</strong>');
        campo.parentNode.insertBefore(destEl, campo.nextElementSibling);
        var desc = (campo.getAttribute('aria-describedby') || '').trim();
        if (desc.indexOf(destinoId) < 0) {
          campo.setAttribute('aria-describedby', (desc ? desc + ' ' : '') + destinoId);
        }
      }
    }

    // Validadores específicos por tipo
    var tipo = regra.tipo || '';
    if (tipo === 'url') {
      campo.addEventListener('blur', function(){ validarURL(campo); });
      campo.addEventListener('change', function(){ validarURL(campo); });
    }
    if (tipo === 'telefone') {
      campo.addEventListener('blur', function(){ validarTelefone(campo); });
    }
    if (tipo === 'instagram') {
      campo.addEventListener('blur', function(){ validarInstagram(campo); });
    }
    if (tipo === 'cnpj') {
      campo.addEventListener('blur', function(){ validarCNPJ(campo); });
    }
    if (tipo === 'alt') {
      campo.addEventListener('blur',  function(){ validarAlt(campo); });
      campo.addEventListener('input', function(){ validarAlt(campo); });
    }

    // Preview SEO para campos de título
    if (tipo === 'seo-title' && seoLinks[campo.id]) {
      var link    = seoLinks[campo.id];
      var descCampo = $id(link.descId);
      criarPreviewSEO(campo, link.url, descCampo);
    }

    // Alertas de qualidade em campos de texto longo
    if (campo.tagName === 'TEXTAREA' && max >= 50) {
      campo.addEventListener('blur',  function(){ alertaQualidade(campo); });
      campo.addEventListener('input', function(){
        setTimeout(function(){ alertaQualidade(campo); }, 600);
      });
    }

    // Rastrear alterações
    campo.addEventListener('input', function(){ marcarAlterado(campo); });
    campo.addEventListener('change', function(){ marcarAlterado(campo); });
  }

  /** Inicializa TODOS os campos da página (inputs + textareas com maxlength OU com ID em REGRAS) */
  function inicializarTodos() {
    var seletores = 'input[maxlength], textarea[maxlength]';
    var campos = document.querySelectorAll(seletores);
    for (var i = 0; i < campos.length; i++) {
      inicializarCampo(campos[i]);
    }
    // Campos em REGRAS sem maxlength
    Object.keys(REGRAS).forEach(function(id) {
      var el = $id(id);
      if (el && !el.dataset.itapInit) inicializarCampo(el);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 11. OBSERVER — inicializa campos adicionados dinamicamente pelo painel
   * ══════════════════════════════════════════════════════════════════════════ */

  function observarDOM() {
    if (!global.MutationObserver) return;
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return;
          var campos = node.querySelectorAll ? node.querySelectorAll('input[maxlength], textarea[maxlength]') : [];
          for (var i = 0; i < campos.length; i++) inicializarCampo(campos[i]);
          if (node.matches && (node.matches('input[maxlength]') || node.matches('textarea[maxlength]'))) {
            inicializarCampo(node);
          }
        });
      });
    });
    observer.observe(document.body, {childList: true, subtree: true});
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 12. AVISO AO SAIR DA PÁGINA COM ALTERAÇÕES
   * ══════════════════════════════════════════════════════════════════════════ */

  function registrarAvisoPagina() {
    global.addEventListener('beforeunload', function(e) {
      if (!temAlteracoes()) return;
      var msg = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
      e.returnValue = msg;
      return msg;
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * 13. API PÚBLICA (window.itapValidacao)
   * ══════════════════════════════════════════════════════════════════════════ */
  global.itapValidacao = {
    /** Reinicializa todos os campos (chamar após trocar de aba no painel) */
    init: function() {
      inicializarTodos();
    },
    /** Inicializa um campo específico (para campos gerados dinamicamente) */
    initCampo: function(idOuEl) {
      var el = typeof idOuEl === 'string' ? $id(idOuEl) : idOuEl;
      inicializarCampo(el);
    },
    /** Valida todos os campos visíveis e retorna array de erros */
    validarTodos: function() {
      var erros = [];
      var campos = document.querySelectorAll('input[maxlength]:not([disabled]), textarea[maxlength]:not([disabled])');
      for (var i = 0; i < campos.length; i++) {
        var c = campos[i];
        var max = parseInt(c.getAttribute('maxlength') || '0', 10);
        if (max > 0 && contarChars(c.value) > max) {
          erros.push({ id: c.id, msg: 'O campo "' + (c.id || 'desconhecido') + '" ultrapassou o limite de ' + max + ' caracteres.' });
        }
        var regra = REGRAS[c.id] || {};
        if (regra.min && c.value.trim() && contarChars(c.value) < regra.min) {
          erros.push({ id: c.id, msg: 'O campo "' + (c.id || 'desconhecido') + '" precisa de pelo menos ' + regra.min + ' caracteres.' });
        }
      }
      return erros;
    },
    limparAlterados: limparAlterados,
    temAlteracoes:   temAlteracoes,
    contarChars:     contarChars
  };

  /* ══════════════════════════════════════════════════════════════════════════
   * 14. BOOT
   * ══════════════════════════════════════════════════════════════════════════ */
  function boot() {
    injetarCSS();
    inicializarTodos();
    observarDOM();
    registrarAvisoPagina();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    // Adiado para garantir que o painel já renderizou seus campos
    setTimeout(boot, 300);
  }

})(typeof window !== 'undefined' ? window : this);
