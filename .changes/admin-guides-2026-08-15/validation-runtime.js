
/* Guia de edição segura — validação local antes de qualquer salvamento */
(function () {
  'use strict';
  const ROOT = '#admin-app';
  const FIELD_SELECTOR = ROOT + ' input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), ' + ROOT + ' textarea, ' + ROOT + ' select';
  const TEXT_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'date', 'datetime-local', 'time', 'month', 'number']);
  const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
  const PT_BR_CORRECTIONS = [
    [/\bcaramelho\b/gi, 'caramelo'],
    [/\bpicol[eé]s?\b/gi, 'picolé/picolés'],
    [/\bpromocao\b/gi, 'promoção'],
    [/\bcardapio\b/gi, 'cardápio'],
    [/\bacrescimo\b/gi, 'acréscimo'],
    [/\bacrescimos\b/gi, 'acréscimos'],
    [/\bsorvete[s]? tipo artesanal/gi, 'sorvete tipo artesanal']
  ];

  const IMAGE_RULES = {
    'home-banner-input': { label: 'banner principal', width: 1536, height: 1024, ratio: 1.5, minWidth: 768, minHeight: 512, maxBytes: 250 * 1024, text: 'Aceitos: JPG, JPEG, PNG, WebP ou HEIC. Recomendado 1536 × 1024 px (3:2), máximo de 250 KB. A imagem aparece no carrossel da página inicial.' },
    'promo-img-input': { label: 'imagem da promoção', width: 800, height: 600, ratio: 4 / 3, minWidth: 400, minHeight: 300, maxBytes: 150 * 1024, text: 'Aceitos: JPG, JPEG, PNG, WebP ou HEIC. Recomendado 800 × 600 px (4:3), máximo de 150 KB. A imagem aparece no card principal da Promoção.' },
    'crs-banner-input': { label: 'banner dedicado', width: 1536, height: 1024, ratio: 1.5, minWidth: 768, minHeight: 512, maxBytes: 250 * 1024, text: 'Aceitos: JPG, JPEG, PNG ou WebP. Recomendado 1536 × 1024 px (3:2), máximo de 250 KB. O banner será usado somente no carrossel dedicado do site.' }
  };

  function getId(el) { return (el.id || '').toLowerCase(); }
  function hasClass(el, name) { return !!(el && el.classList && el.classList.contains(name)); }
  function labelFor(el) {
    const explicit = el.closest('.campo-edit')?.querySelector('label');
    if (explicit && explicit.textContent.trim()) return explicit.textContent.trim().replace(/\s+/g, ' ');
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    return el.id || 'campo';
  }
  function numberRule(el) {
    const id = getId(el);
    const isPrice = /pre[cç][oô]|preco|valor|price/.test(id);
    const isStock = /estoque|quantidade|qtd|unidades|lote/.test(id);
    const isWholesale = /atacado|picol|picole|picoles/.test(id) && isPrice;
    if (isPrice) {
      const inheritedMin = Number.isFinite(Number(el.min)) ? Number(el.min) : 0;
      return {
        kind: 'number', min: isWholesale ? Math.max(1.8, inheritedMin) : Math.max(0, inheritedMin), max: 100000,
        step: el.step && el.step !== 'any' ? el.step : '0.01',
        help: isWholesale ? 'Preço em reais. Use somente número, por exemplo 1.80; o site exibirá R$ 1,80. Atacado: mínimo permitido R$ 1,80.' : 'Preço em reais. Digite somente o número, por exemplo 12.50; o site exibirá R$ 12,50. Não use R$ nem ponto de milhar.'
      };
    }
    if (isStock) {
      return { kind: 'number', min: Math.max(0, Number(el.min || 0)), max: Math.min(999, Number(el.max || 999)), step: '1', help: 'Informe uma quantidade inteira entre 0 e 999. Zero significa esgotado; não use vírgula nem texto.' };
    }
    if (el.type === 'number') return { kind: 'number', min: Number(el.min || 0), max: Number(el.max || 999999), step: el.step || 'any', help: 'Digite apenas números dentro da faixa aceita pelo site.' };
    return null;
  }
  function textRule(el) {
    const id = getId(el);
    const existingMax = Number(el.getAttribute('maxlength') || 0);
    let max = existingMax;
    if (!max) {
      if (el.tagName === 'TEXTAREA') max = 500;
      else if (/nome|titulo|t[ií]tulo|subtitulo|subt[ií]tulo|label|acao|a[cç][aã]o|badge|slogan/.test(id)) max = 120;
      else if (/descricao|descri[cç][aã]o|mensagem|texto|frase|dica|copy|alt|seo/.test(id)) max = 250;
      else max = 160;
      el.maxLength = max;
    }
    if (/url|maps|link/.test(id) || el.type === 'url') return { kind: 'url', max, help: 'Cole somente um endereço HTTPS válido do site ou do WhatsApp. Não cole código HTML, JavaScript ou scripts.' };
    if (el.type === 'tel' || /cel|telefone|whats|whatsapp/.test(id)) return { kind: 'tel', max, help: 'Telefone brasileiro com DDD 16. Aceitos números e formatação; não use outro DDD.' };
    if (el.type === 'date' || el.type === 'datetime-local') return { kind: 'date', max, help: 'Use uma data válida. A tela do navegador mostrará o formato correspondente ao português brasileiro.' };
    if (/novo.?sab|novo.?sabor/.test(id)) return { kind: 'text', max: Math.min(max, 40), help: 'Nome de sabor existente no catálogo. Use português brasileiro, acentos e cedilha; não crie categoria ou estrutura nova.' };
    if (/sabor|produto|nome/.test(id)) return { kind: 'text', max, help: 'Use o nome oficial do catálogo em português brasileiro, com acentos e cedilha. Não inclua HTML, código ou informação que o site não exibe.' };
    if (/seo|meta/.test(id)) return { kind: 'text', max, help: 'Texto SEO em português brasileiro, sem HTML ou scripts. Respeite o limite porque o site pode cortar o conteúdo em telas menores.' };
    if (/h1|h2|hero/.test(id)) return { kind: 'text', max, help: 'Título visível no site. Use frase curta em português brasileiro; respeite o limite para não cortar em celular.' };
    if (el.tagName === 'TEXTAREA') return { kind: 'text', max, help: 'Texto livre em português brasileiro, com acentos e cedilha. Não use HTML, scripts ou excesso de espaços; respeite o limite do campo.' };
    return { kind: 'text', max, help: 'Digite somente o conteúdo que o site já possui espaço para exibir. Use português brasileiro, acentos e cedilha; não use HTML ou scripts.' };
  }
  function ruleFor(el) {
    if (el.type === 'file') return { kind: 'file', image: IMAGE_RULES[el.id] || null, help: IMAGE_RULES[el.id]?.text || 'Aceitos somente arquivos de imagem usados pelo site: JPG, JPEG, PNG ou WebP.' };
    if (el.type === 'checkbox' || el.type === 'radio') return { kind: 'choice', help: 'Marque somente uma opção já prevista pelo site. Não cria novos produtos, categorias ou botões.' };
    if (el.tagName === 'SELECT') return { kind: 'choice', help: 'Escolha somente uma opção disponível. O Admin não aceita valores novos fora da lista do site.' };
    if (el.type === 'number') return numberRule(el);
    if (TEXT_TYPES.has(el.type) || el.tagName === 'TEXTAREA') return textRule(el);
    return { kind: 'text', max: 160, help: 'Edite somente o conteúdo previsto pelo site, em português brasileiro.' };
  }
  function findMeta(el) { return el.parentElement?.querySelector(':scope > .admin-inline-meta'); }
  function ensureMeta(el, rule) {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.title = rule.help;
      const group = el.closest('.campo-edit') || el.parentElement;
      if (!group || group.querySelector(':scope > .admin-inline-meta')) return null;
      const meta = document.createElement('div'); meta.className = 'admin-inline-meta';
      meta.innerHTML = '<span class="admin-guide-icon">ℹ</span><span class="admin-guide-text"></span>';
      meta.querySelector('.admin-guide-text').textContent = rule.help;
      group.appendChild(meta); return meta;
    }
    let meta = findMeta(el);
    if (!meta) {
      meta = document.createElement('div'); meta.className = 'admin-inline-meta';
      meta.innerHTML = '<span class="admin-guide-icon">ℹ</span><span class="admin-guide-text"></span><span class="admin-counter"></span>';
      el.insertAdjacentElement('afterend', meta);
    }
    meta.querySelector('.admin-guide-text').textContent = rule.help;
    return meta;
  }
  function bytesText(n) { return n < 1024 * 1024 ? Math.round(n / 1024) + ' KB' : (n / (1024 * 1024)).toFixed(1) + ' MB'; }
  function setError(el, message) {
    el.classList.add('admin-field-invalid'); el.classList.remove('admin-field-valid');
    let box = el.parentElement?.querySelector(':scope > .admin-field-error');
    if (!box) { box = document.createElement('div'); box.className = 'admin-field-error'; el.insertAdjacentElement('afterend', box); }
    box.textContent = 'Erro: ' + message;
    const meta = findMeta(el); if (meta) { meta.classList.add('admin-meta-error'); meta.classList.remove('admin-meta-ok'); }
    el.setAttribute('aria-invalid', 'true');
    return false;
  }
  function clearError(el) {
    el.classList.remove('admin-field-invalid'); el.classList.add('admin-field-valid');
    const box = el.parentElement?.querySelector(':scope > .admin-field-error'); if (box) box.remove();
    const meta = findMeta(el); if (meta) { meta.classList.remove('admin-meta-error'); meta.classList.add('admin-meta-ok'); }
    el.removeAttribute('aria-invalid'); return true;
  }
  function updateCounter(el, rule) {
    const meta = findMeta(el); if (!meta) return;
    const counter = meta.querySelector('.admin-counter'); if (!counter) return;
    if (rule.max) counter.textContent = `${(el.value || '').length}/${rule.max} caracteres`;
    else counter.textContent = '';
  }
  function invalidBrazilianWord(value) {
    for (const [pattern, suggestion] of PT_BR_CORRECTIONS) { pattern.lastIndex = 0; if (pattern.test(value)) return suggestion; }
    return null;
  }
  function validateImage(el, file, rule) {
    if (!file) return true;
    const image = rule.image;
    const name = (file.name || '').toLowerCase();
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    if (!image) return ALLOWED_IMAGE_EXTENSIONS.includes(ext) ? true : setError(el, 'use JPG, JPEG, PNG, WebP ou HEIC.');
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return setError(el, `${image.label}: formato inválido. Use JPG, JPEG, PNG, WebP ou HEIC.`);
    if (file.size > image.maxBytes) return setError(el, `${image.label}: arquivo com ${bytesText(file.size)}; o máximo é ${bytesText(image.maxBytes)}.`);
    if (name.startsWith('.')) return setError(el, 'o nome do arquivo não pode começar com ponto.');
    if (ext === '.heic') { clearError(el); return true; }
    const objectUrl = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = function () {
      URL.revokeObjectURL(objectUrl);
      const ratio = probe.width / probe.height;
      if (probe.width < image.minWidth || probe.height < image.minHeight) { setError(el, `${image.label}: resolução insuficiente. Use pelo menos ${image.minWidth} × ${image.minHeight} px; ideal ${image.width} × ${image.height} px.`); return; }
      if (Math.abs(ratio - image.ratio) > 0.04) { setError(el, `${image.label}: proporção incorreta. Use aproximadamente ${image.width} × ${image.height} px.`); return; }
      clearError(el);
    };
    probe.onerror = function () { URL.revokeObjectURL(objectUrl); setError(el, 'não foi possível ler a imagem. Reenvie um arquivo de imagem válido.'); };
    probe.src = objectUrl;
    return true;
  }
  function normalizeSafeText(el) {
    if (!el || el.type === 'file' || el.type === 'number' || el.tagName === 'SELECT') return;
    const id = getId(el);
    if (!TEXT_TYPES.has(el.type) && el.tagName !== 'TEXTAREA') return;
    if (/sabor|produto|nome/.test(id)) return;
    let value = String(el.value || '').replace(/\u00a0/g, ' ');
    value = value.replace(/[ \t]{2,}/g, ' ');
    const corrections = [
      [/\bcardapio\b/gi, 'cardápio'],
      [/\bpromocao\b/gi, 'promoção'],
      [/\bacrescimos\b/gi, 'acréscimos'],
      [/\bacrescimo\b/gi, 'acréscimo'],
      [/\bdescri[cç]ao\b/gi, 'descrição'],
      [/\bsubtitulo\b/gi, 'subtítulo'],
      [/\bTitulo\b/g, 'Título'],
      [/\bCajuru\s*\/\s*SP\b/gi, 'Cajuru/SP']
    ];
    for (const [pattern, replacement] of corrections) value = value.replace(pattern, replacement);
    if (value !== el.value) {
      const start = el.selectionStart;
      el.value = value;
      if (typeof start === 'number' && document.activeElement === el) {
        const next = Math.min(value.length, start);
        try { el.setSelectionRange(next, next); } catch (_) {}
      }
    }
  }
  function validateField(el, show = true) {
    const rule = ruleFor(el);
    ensureMeta(el, rule); updateCounter(el, rule);
    if (el.type === 'file') return validateImage(el, el.files?.[0], rule);
    if (rule.kind === 'choice') return true;
    const value = (el.value || '');
    if (!value && !el.required && el.type !== 'file') return clearError(el);
    if (rule.max && value.length > rule.max) return show ? setError(el, `use no máximo ${rule.max} caracteres.`) : false;
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) return show ? setError(el, 'remova caracteres de controle ou invisíveis.') : false;
    if (rule.kind === 'text') {
      if (/<\s*script|<\s*style|javascript\s*:|on\w+\s*=|<iframe/i.test(value)) return show ? setError(el, 'HTML, JavaScript e scripts não são permitidos.') : false;
      if (el.id !== 'index-hero-h1-principal' && /<[^>]+>/.test(value)) return show ? setError(el, 'não use HTML neste campo; digite apenas texto.') : false;
      if (el.id === 'index-hero-h1-principal' && /<(?!\/?(span|strong|em|br)\b)[^>]+>/i.test(value)) return show ? setError(el, 'no título, somente as tags span, strong, em e br são permitidas.') : false;
      const suggestion = invalidBrazilianWord(value);
      if (suggestion) return show ? setError(el, `revise a grafia em português brasileiro. Sugestão: ${suggestion}.`) : false;
    }
    if (rule.kind === 'url' && value.trim()) {
      try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
      catch (_) { return show ? setError(el, 'informe uma URL válida iniciando com https:// ou http://.') : false; }
    }
    if (rule.kind === 'tel' && value.trim()) {
      const digits = value.replace(/\D/g, '');
      if (!/^16\d{8,9}$/.test(digits)) return show ? setError(el, 'use um telefone com DDD 16 e 8 ou 9 dígitos.') : false;
    }
    if (rule.kind === 'number') {
      const n = Number(value);
      if (value === '' || !Number.isFinite(n)) return show ? setError(el, 'informe um número válido.') : false;
      if (n < rule.min || n > rule.max) return show ? setError(el, `o valor deve ficar entre ${rule.min} e ${rule.max}.`) : false;
      if (rule.step !== 'any') {
        const step = Number(rule.step); if (Number.isFinite(step) && Math.abs((n / step) - Math.round(n / step)) > 0.000001) return show ? setError(el, `use incrementos de ${rule.step}.`) : false;
      }
    }
    return clearError(el);
  }
  function allFields() { return Array.from(document.querySelectorAll(FIELD_SELECTOR)); }
  function enhanceField(el) {
    if (!el || el.dataset.adminGuideReady === '1') return;
    el.dataset.adminGuideReady = '1';
    const rule = ruleFor(el);
    if (el.type === 'file') {
      el.accept = '.jpg,.jpeg,.png,.webp,.heic,image/jpeg,image/png,image/webp,image/heic';
    }
    ensureMeta(el, rule); updateCounter(el, rule);
    el.addEventListener('input', function () { el.dataset.touched = '1'; normalizeSafeText(el); validateField(el, true); });
    el.addEventListener('change', function () { el.dataset.touched = '1'; validateField(el, true); });
  }
  function enhanceAll() { allFields().forEach(enhanceField); }
  function showSummary(errors) {
    let summary = document.querySelector('.admin-validation-summary');
    if (!summary) {
      summary = document.createElement('div'); summary.className = 'admin-validation-summary';
      const root = document.querySelector(ROOT); if (root) root.prepend(summary);
    }
    if (!errors.length) { summary.classList.remove('visible'); summary.textContent = ''; return; }
    summary.innerHTML = '<strong>Não foi possível salvar ainda.</strong>' + errors.slice(0, 5).map(e => `<div>• ${e}</div>`).join('') + (errors.length > 5 ? `<div>• e mais ${errors.length - 5} campo(s).</div>` : '');
    summary.classList.add('visible');
  }
  function validateBeforeSave() {
    enhanceAll();
    const errors = [];
    allFields().forEach(el => {
      if (!el.value && !el.required && el.type !== 'file') return;
      const ok = validateField(el, true);
      if (!ok) errors.push(labelFor(el));
    });
    showSummary(errors);
    if (errors.length) {
      const first = document.querySelector('.admin-field-invalid');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first?.focus({ preventScroll: true });
      return false;
    }
    return true;
  }
  window.itapolitanaValidarAntesDeSalvar = validateBeforeSave;
  document.addEventListener('click', function (event) {
    const target = event.target.closest('button, input[type="submit"]');
    if (!target) return;
    const action = target.getAttribute('onclick') || '';
    if (/\b(salvar|publicar|confirmar|adicionar)\w*\s*\(/i.test(action) && !validateBeforeSave()) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('submit', function (event) {
    if (!validateBeforeSave()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  const observer = new MutationObserver(function () { enhanceAll(); });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceAll); else enhanceAll();
})();
