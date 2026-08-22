/* Design: controlador mobile-first do HTML de retirada; dados vêm exclusivamente de dados/produtos.json. */
(function () {
  'use strict';
  const WHATSAPP = '5516996062046';
  const SABORES_NOVOS = new Set(['cheesecake', 'passas ao rum', 'bem casado']);
  const PALETA_SABORES_MASSA = {
    'abacaxi ao vinho':['#F59E0B','#FFFBEB','rgba(245,158,11,.36)'],'abacaxi suíço':['#FACC15','#FEFCE8','rgba(250,204,21,.40)'],'amarena':['#E11D48','#FFF1F2','rgba(225,29,72,.34)'],'ameixa':['#7C3AED','#F5F3FF','rgba(124,58,237,.32)'],'banana com nutella':['#D97706','#FFF7ED','rgba(217,119,6,.32)'],'bem casado':['#C08457','#FFF7ED','rgba(192,132,87,.34)'],'bis e trufa':['#7C3F2C','#FFF7ED','rgba(124,63,44,.34)'],'blue ice':['#38BDF8','#F0F9FF','rgba(56,189,248,.38)'],'cereja trufada':['#BE123C','#FFF1F2','rgba(190,18,60,.34)'],'cheesecake':['#E2A77A','#FFF7ED','rgba(226,167,122,.34)'],'chocolate belga':['#6B3E26','#FFF7ED','rgba(107,62,38,.36)'],'chocolate com café':['#4B2E25','#F8FAFC','rgba(75,46,37,.36)'],'coco queimado':['#A16207','#FFFBEB','rgba(161,98,7,.34)'],'creme paris':['#D4A017','#FFFBEB','rgba(212,160,23,.34)'],'croquer':['#B45309','#FFF7ED','rgba(180,83,9,.34)'],'doce de leite':['#B7794B','#FFF7ED','rgba(183,121,75,.34)'],'ferrero rocher':['#A16207','#FFFBEB','rgba(161,98,7,.36)'],'flocos':['#64748B','#F8FAFC','rgba(100,116,139,.32)'],'kinder ovo':['#2563EB','#EFF6FF','rgba(37,99,235,.34)'],'leite condensado':['#CBD5E1','#F8FAFC','rgba(148,163,184,.34)'],'leite ninho':['#60A5FA','#EFF6FF','rgba(96,165,250,.38)'],'leite ninho folheado':['#38BDF8','#F0F9FF','rgba(56,189,248,.38)'],'leite ninho com oreo':['#60A5FA','#EFF6FF','rgba(96,165,250,.38)'],'leite ninho trufado':['#3B82F6','#EFF6FF','rgba(59,130,246,.38)'],'limão':['#84CC16','#F7FEE7','rgba(132,204,22,.34)'],'limão suíço':['#A3E635','#F7FEE7','rgba(163,230,53,.38)'],'menta com chocolate':['#10B981','#ECFDF5','rgba(16,185,129,.34)'],'milho verde':['#EAB308','#FEFCE8','rgba(234,179,8,.36)'],'morango trufado':['#F43F5E','#FFF1F2','rgba(244,63,94,.36)'],'mousse de maracujá':['#F59E0B','#FFFBEB','rgba(245,158,11,.36)'],'mousse de uva':['#A78BFA','#F5F3FF','rgba(167,139,250,.36)'],'nozes':['#8D6E63','#FAF7F5','rgba(141,110,99,.34)'],'nutella':['#7C2D12','#FFF7ED','rgba(124,45,18,.36)'],'ovomaltine':['#B45309','#FFF7ED','rgba(180,83,9,.36)'],'passas ao rum':['#7F1D1D','#FFF1F2','rgba(127,29,29,.36)'],'pistache':['#65A30D','#F7FEE7','rgba(101,163,13,.34)'],'prestígio':['#5B3A29','#FFF7ED','rgba(91,58,41,.36)'],'sensação':['#EC4899','#FDF2F8','rgba(236,72,153,.36)']
  };
  const STORAGE_KEY = 'itap_retirada_v1';
  // Regra exclusiva do Peça e retire: o cadastro mestre e Encomendas não são alterados.
  const RETIRADA_SKUS_OCULTOS = new Set(['SOB-009']);
  const state = { data: null, catalog: [], cart: loadCart(), flavorProduct: null, popsicleGroup: null, selectedFlavors: [], flavorCounts: {}, boxAddOnCounts: {}, serviceMode: '', containerType: '', cakeChoice: '', query: '', lastCatalogSku: null };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
  const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const escape = (text) => String(text || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  function normalizeCart(items) {
    return (Array.isArray(items) ? items : []).filter((item) => item && !RETIRADA_SKUS_OCULTOS.has(item.sku)).map((item) => {
      const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
      const isTravel = item.serviceMode === 'travel';
      const boxAddOns = Array.isArray(item.boxAddOns) ? item.boxAddOns.filter(Boolean).map((addOn) => ({ ...addOn, quantity: Math.max(0, Math.floor(Number(addOn.quantity) || 0)), price: Number(addOn.price) || 0 })).filter((addOn) => addOn.quantity > 0) : [];
      return { ...item, quantity, price: Number(item.price) || 0, retail: Number(item.retail) || 0, wholesale: Number(item.wholesale) || 0, boxAddOns, packagingSku: isTravel ? item.packagingSku || 'EMB-VIAGEM' : '', packagingName: isTravel ? item.packagingName || 'Embalagem para viagem' : '', packagingFee: isTravel ? Number(item.packagingFee || 1) : 0 };
    }).filter((item) => item.quantity > 0);
  }
  function loadCart() { try { return normalizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { return []; } }
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); }
  function announce(message) { $('#live-region').textContent = message; }
  function setOrderStage(stage) { $$('[data-order-step]').forEach((item) => item.classList.toggle('is-current', Number(item.dataset.orderStep) === Number(stage))); }
  function openDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
  function closeDialog(id) { const dialog = document.getElementById(id); if (dialog?.open) dialog.close(); }
  function fixedScoopCount(product) {
    const match = (product.fixedIngredients || []).join(' ').match(/\b(\d+)\s*sabores?\s+de\s+sorvete\b/i);
    return match ? Number(match[1]) : 0;
  }
  function productBallCount(product) {
    const fixed = fixedScoopCount(product);
    if (fixed) return fixed;
    const match = `${product.name} ${product.size}`.match(/(\d+)\s*bolas?/i);
    return match ? Number(match[1]) : 0;
  }
  function hasFixedThreeFlavorLimit(product) {
    return isIceCreamCake(product) || product.category === 'Tortas por encomenda' || product.category === 'Caixas para encomenda';
  }
  function usesFlavorDistribution(product) {
    return !hasFixedThreeFlavorLimit(product) && product.category !== 'Milkshake' && productBallCount(product) > 0;
  }
  function needsMassFlavors(product) {
    if (product.fixedAcai) return false;
    if (isIceCreamCake(product)) return true;
    if (fixedScoopCount(product) > 0) return true;
    if (product.category === 'Sorvetes de massa' || product.category === 'Caixas para encomenda' || product.category === 'Tortas por encomenda') return true;
    if (product.category === 'Isopores para viagem') return true;
    return /\b\d+\s*bola/i.test(`${product.name} ${product.size}`) && product.category === 'Sobremesas';
  }
  function isTravelOnlyBox(product) { return product?.category === 'Isopores para viagem'; }
  function needsPackagingChoice(product) {
    return !isTravelOnlyBox(product) && !product.fixedAcai && product.type !== 'picole' && (needsMassFlavors(product) || product.category === 'Milkshake');
  }
  function needsContainerChoice(product) { return normalize(product?.name).includes('casquinha/copo'); }
  function isIceCreamCake(product) { return normalize(product?.name).includes('torta de sorvete'); }
  function displayName(name) { return String(name || '').replace(/Casquinha\/copo/gi, 'Casquinha ou copo'); }
  function flavorRule(product) {
    if (product.category === 'Milkshake') return { source: 'milkshake', min: 1, max: 2, label: 'Escolha 1 sabor ou até 2 sabores para o milkshake' };
    if (hasFixedThreeFlavorLimit(product)) return { source: 'massa', min: 3, max: 3, label: 'Escolha 3 sabores de sorvete' };
    const required = productBallCount(product) || 1;
    if (usesFlavorDistribution(product)) return { source: 'massa', min: required, max: required, ballCount: required, distribution: true, label: `Distribua ${required} bola${required > 1 ? 's' : ''} entre os sabores que quiser` };
    return { source: 'massa', min: required, max: required, label: `Escolha ${required} sabor${required > 1 ? 'es' : ''} de sorvete (${required} bola${required > 1 ? 's' : ''})` };
  }
  function productType(category) { return category === 'Picolés' ? 'picole' : 'produto'; }
  function retiradaAberta() { return !window.ItapHorarioPedidos || window.ItapHorarioPedidos.estaAberto('retirada'); }
  function applyOrderButtonState(button, label, available = true) {
    const open = retiradaAberta(); const closed = available && !open;
    button.disabled = !available;
    button.classList.toggle('is-order-closed', closed);
    button.setAttribute('aria-disabled', String(!available || closed));
    button.title = closed ? (window.ItapHorarioPedidos?.textoAviso('retirada') || 'Pedidos indisponíveis neste momento.') : '';
    button.textContent = !available ? 'Esgotado' : closed ? 'Ver horário de retirada' : label;
  }
  function runWhenRetiradaOpen(callback) {
    if (retiradaAberta()) return callback();
    window.ItapHorarioPedidos?.aviso('retirada');
  }
  function productAvailable(data, item) {
    if (!item || item.ativo === false) return false;
    const packages = data?.disponibilidade?.embalagens || {};
    return (item.dependencias_embalagem || []).every((sku) => packages[sku]?.ativo !== false);
  }
  function buildCatalog(data) {
    const entries = Object.values(data.cadastro_skus?.por_chave || {});
    const travelPackagingEntry = entries.find((item) => item.sku === 'EMB-VIAGEM');
    const travelPackagingAvailability = data?.disponibilidade?.embalagens?.['EMB-VIAGEM'];
    const travelPackaging = { sku: 'EMB-VIAGEM', name: travelPackagingEntry?.nome || 'Embalagem para viagem', price: Number(travelPackagingEntry?.preco || 1), available: travelPackagingEntry?.ativo !== false && travelPackagingAvailability?.ativo !== false };
    const picoMeta = new Map();
    Object.entries(data.picolés || {}).forEach(([groupId, group]) => (group.sabores || []).forEach((flavor) => picoMeta.set(flavor.codigo, { groupId, groupName: group.nome, varejo: Number(group.preço_varejo), atacado: Number(group.preço_atacado), stock: Number(flavor.estoque ?? group.estoque ?? 0), unavailable: Boolean(flavor.esgotado || group.esgotado) })));
    return entries.filter((item) => !RETIRADA_SKUS_OCULTOS.has(item.sku)).map((item) => {
      const meta = picoMeta.get(item.sku);
      const category = item.categoria || 'Outros produtos';
      return { id: item.sku, sku: item.sku, category, name: item.nome, size: item.tamanho || '', price: Number(item.preco || 0), active: item.ativo !== false, available: productAvailable(data, item), type: meta ? 'picole' : productType(category), picole: meta || null, includedExtras: Array.isArray(item.acrescimos_inclusos) ? item.acrescimos_inclusos : [], fixedIngredients: Array.isArray(item.ingredientes) ? item.ingredientes : [], travelPackaging, fixedAcai: normalize(category).includes('acai') || normalize(item.nome).includes('acai natureon'), selectable: category !== 'Sabores de massa' && !(category === 'Picolés' && !meta) };
    });
  }
  function cartKey(product, flavors, serviceMode = '', containerType = '', cakeChoice = '', flavorDistribution = '', boxAddOns = []) { return `${product.sku}::${(flavors || []).map((item) => `${item.code || item}:${Number(item.quantity) || 1}`).sort().join('|')}::${serviceMode}::${containerType}::${cakeChoice}::${normalize(flavorDistribution).replace(/\s+/g, ' ')}::${(boxAddOns || []).map((item) => `${item.sku || item.id}:${Number(item.quantity) || 0}`).sort().join('|')}`; }
  function currentPopsicleCount() { return state.cart.filter((item) => item.type === 'picole').reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
  function priceFor(item) { if (item.type === 'picole') return currentPopsicleCount() >= 100 ? item.wholesale : item.retail; return item.price; }
  function itemBaseTotal(item) { return Number(item.quantity || 0) * priceFor(item); }
  function itemPackagingTotal(item) { return Number(item.quantity || 0) * Number(item.packagingFee || 0); }
  function itemAddOnTotal(item) { return Number(item.quantity || 0) * (item.boxAddOns || []).reduce((sum, addOn) => sum + Number(addOn.quantity || 0) * Number(addOn.price || 0), 0); }
  function itemTotal(item) { return itemBaseTotal(item) + itemPackagingTotal(item) + itemAddOnTotal(item); }
  function total() { return state.cart.reduce((sum, item) => sum + itemTotal(item), 0); }
  function totalProducts() { return state.cart.reduce((sum, item) => sum + itemBaseTotal(item), 0); }
  function totalPackaging() { return state.cart.reduce((sum, item) => sum + itemPackagingTotal(item), 0); }
  function totalAddOns() { return state.cart.reduce((sum, item) => sum + itemAddOnTotal(item), 0); }
  function totalItems() { return state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
  function refreshCartUi() {
    state.cart = normalizeCart(state.cart);
    saveCart();
    renderCartSummary();
    if (state.catalog.length) renderCatalog();
    if ($('#cart-dialog')?.open) renderCart();
  }
  function setCart(item) { const index = state.cart.findIndex((entry) => entry.key === item.key); if (index >= 0) state.cart[index] = item; else state.cart.push(item); refreshCartUi(); }
  function addProduct(product, flavors = [], serviceMode = '', openReview = true, containerType = '', cakeChoice = '', flavorDistribution = '', boxAddOns = []) {
    state.lastCatalogSku = product.sku;
    const key = cartKey(product, flavors, serviceMode, containerType, cakeChoice, flavorDistribution, boxAddOns);
    const current = state.cart.find((item) => item.key === key);
    const travelPackaging = product.travelPackaging || { sku: 'EMB-VIAGEM', name: 'Embalagem para viagem', price: 1, available: true };
    const item = current || { key, sku: product.sku, name: product.name, size: product.size, category: product.category, type: product.type, price: product.price, flavors, flavorDistribution, boxAddOns, includedExtras: product.includedExtras || [], fixedIngredients: product.fixedIngredients || [], serviceMode, containerType, cakeChoice, packagingSku: serviceMode === 'travel' ? travelPackaging.sku : '', packagingName: serviceMode === 'travel' ? travelPackaging.name : '', packagingFee: serviceMode === 'travel' ? travelPackaging.price : 0, quantity: 0, retail: product.picole?.varejo, wholesale: product.picole?.atacado, stock: product.picole?.stock };
    item.quantity += 1;
    setCart(item);
    setOrderStage(2);
    if (openReview) { renderCart(); openDialog('cart-dialog'); }
    announce(`${displayName(product.name)} foi adicionado ao pedido.`);
  }
  function updateQuantity(key, delta) { const current = state.cart.find((item) => item.key === key); if (!current) return; const limit = current.type === 'picole' && Number.isFinite(current.stock) ? current.stock : Infinity; current.quantity = Math.max(0, Math.min(limit, current.quantity + delta)); setCart(current); }
  function removeItem(key) { state.cart = state.cart.filter((item) => item.key !== key); refreshCartUi(); announce('Produto excluído do pedido.'); }
  function isTraditionalMilkshake(product) { return normalize(product?.category) === 'milkshake'; }
  function isAcaiMilkshake(product) { return normalize(product?.category).includes('milk-shake de acai'); }
  function isAcaiGourmetCup(product) { return String(product?.sku || '').startsWith('ACA-TCG-'); }
  function displayCategory(product) {
    if (isTraditionalMilkshake(product) || isAcaiMilkshake(product)) return 'Milk-shakes';
    if (normalize(product?.category).includes('acai')) return 'Açaí Natureon';
    if (normalize(product?.category).includes('tacas')) return 'Taças';
    return product.category;
  }
  function productSearchText(product) { return normalize([product.category, displayCategory(product), product.name, product.size, product.sku, product.picole?.groupName].filter(Boolean).join(' ')); }
  function categoryRank(category) {
    const value = normalize(category);
    if (value.includes('sorvetes de massa')) return 0;
    if (value.includes('isopores para viagem')) return .5;
    if (value.includes('acai')) return 1;
    if (value === 'milk-shakes') return 2;
    if (value.includes('picoles')) return 3;
    if (value === 'tacas') return 4;
    if (value.includes('sobremesas')) return 5;
    return 99;
  }
  function categoryOrder(categories) { return [...categories].sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b, 'pt-BR')); }
  const SECTION_GUIDES = [
    { id: 'massa', title: 'Sorvetes de massa', hint: 'Tamanhos, bolas e sabores', matches: (category) => normalize(category).includes('sorvetes de massa') },
    { id: 'caixas', title: 'Caixas para viagem', hint: '4 a 12 bolas', matches: (category) => normalize(category).includes('isopores para viagem') },
    { id: 'acai', title: 'Açaí Natureon', hint: 'Combinações prontas', matches: (category) => { const value = normalize(category); return value.includes('acai') && !value.includes('milk-shake'); } },
    { id: 'milkshake', title: 'Milk-shakes', hint: 'Tradicional ou Açaí pronto', matches: (category) => normalize(category) === 'milk-shakes' },
    { id: 'picoles', title: 'Picolés', hint: 'Sabores e quantidade', matches: (category) => normalize(category).includes('picoles') },
    { id: 'tacas', title: 'Taças', hint: 'Ingredientes e sabores', matches: (category) => normalize(category) === 'tacas' },
    { id: 'sobremesas', title: 'Sobremesas', hint: 'Especiais e tortas', matches: (category) => normalize(category).includes('sobremesas') }
  ];
  function sectionGuide(category) { return SECTION_GUIDES.find((guide) => guide.matches(category)) || { id: 'outros', title: category, hint: 'Ver produtos desta seção', matches: () => false }; }
  function sectionPresentation(category) {
    const value = normalize(category);
    if (value.includes('sorvetes de massa')) return { tone: 'massa', title: 'Sorvetes de massa', point: 'Escolha tamanho, recipiente e sabores' };
    if (value.includes('isopores para viagem')) return { tone: 'caixas', title: 'Caixas de sorvete — 4 a 12 bolas', point: 'Para viagem · distribua as bolas como preferir' };
    if (value.includes('acai')) return { tone: 'acai', title: 'Açaí Natureon', point: 'Combinações prontas e Taças Gourmet · adicione direto ao pedido' };
    if (value === 'milk-shakes') return { tone: 'milkshake', title: 'Milk-shakes', point: 'Tradicional: até 2 sabores · Açaí: receita pré-montada' };
    if (value.includes('picoles')) return { tone: 'picoles', title: 'Picolés', point: 'Escolha os sabores conforme o estoque' };
    if (value === 'tacas') return { tone: 'tacas', title: 'Taças', point: 'Ingredientes especiais · escolha sabores quando necessário' };
    if (value.includes('sobremesas')) return { tone: 'sobremesas', title: 'Sobremesas', point: 'Tortas e especiais · confira o prazo quando indicado' };
    return { tone: 'outros', title: category, point: 'Escolha o produto e avance para o pedido' };
  }
  function isPublicOrderProduct(product) {
    const category = normalize(product.category);
    const exclusiveOrderCategories = ['sabores de massa', 'caixas para encomenda', 'tortas por encomenda', 'acrescimos'];
    return product.selectable && !exclusiveOrderCategories.some((item) => category.includes(item));
  }
  function renderCatalog() {
    const root = $('#catalog'); const query = normalize(state.query); const grouped = new Map(); const renderedSections = new Map();
    state.catalog.filter(isPublicOrderProduct).filter((product) => !query || productSearchText(product).includes(query)).forEach((product) => { const category = displayCategory(product); if (!grouped.has(category)) grouped.set(category, []); grouped.get(category).push(product); });
    root.innerHTML = ''; $('#section-nav').innerHTML = ''; $('#section-chooser-list').innerHTML = '';
    if (!grouped.size) { root.innerHTML = '<div class="empty-state">Não encontramos produto com esse nome ou código. Tente buscar outro termo.</div>'; return; }
    categoryOrder(grouped.keys()).forEach((category) => {
      const products = grouped.get(category); const presentation = sectionPresentation(category); const title = presentation.title; const section = document.createElement('section'); section.className = 'catalog-section'; section.dataset.sectionTone = presentation.tone; section.id = `sec-${slug(category)}`; renderedSections.set(category, section);
      const head = document.createElement('div'); head.className = 'catalog-section__head'; head.innerHTML = `<div class="catalog-section__bar"><h2>${escape(title)}</h2></div><p class="catalog-section__summary"><strong>${escape(presentation.point)}</strong><span>${products.length} produto${products.length !== 1 ? 's' : ''} para pedir</span></p>`; section.append(head);
      const nav = document.createElement('button'); nav.type = 'button'; nav.textContent = title; nav.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth', block: 'start' })); $('#section-nav').append(nav);
      if (category === 'Picolés') renderPopsicles(products, section); else renderProducts(products, section);
      root.append(section);
    });
    renderSectionChooser(grouped, renderedSections);
  }
  function renderSectionChooser(grouped, renderedSections) {
    const root = $('#section-chooser-list'); if (!root) return;
    const used = new Set();
    SECTION_GUIDES.forEach((guide) => {
      const categories = categoryOrder([...grouped.keys()].filter((category) => guide.matches(category)));
      if (!categories.length) return;
      categories.forEach((category) => used.add(category));
      const productCount = categories.reduce((sum, category) => sum + (grouped.get(category)?.length || 0), 0);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'section-choice'; button.dataset.sectionGuide = guide.id;
      button.innerHTML = `<span><span class="section-choice__title">${escape(guide.title)}</span><span class="section-choice__hint">${escape(guide.hint)}</span></span><span class="section-choice__count">${productCount}</span>`;
      button.addEventListener('click', () => {
        $$('.section-choice', root).forEach((item) => item.classList.toggle('is-active', item === button));
        renderedSections.get(categories[0])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        announce(`${guide.title}: ${productCount} produtos disponíveis.`);
      });
      root.append(button);
    });
    categoryOrder([...grouped.keys()].filter((category) => !used.has(category))).forEach((category) => {
      const products = grouped.get(category) || []; const button = document.createElement('button'); button.type = 'button'; button.className = 'section-choice';
      button.innerHTML = `<span><span class="section-choice__title">${escape(category)}</span><span class="section-choice__hint">Ver produtos desta seção</span></span><span class="section-choice__count">${products.length}</span>`;
      button.addEventListener('click', () => renderedSections.get(category)?.scrollIntoView({ behavior: 'smooth', block: 'start' })); root.append(button);
    });
  }
  function slug(value) { return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function buildProductList(products) {
    const list = document.createElement('div'); list.className = 'product-list'; products.forEach((product, index) => {
      const row = document.createElement('article'); row.className = 'product'; row.dataset.catalogSku = product.sku; const hasFlavor = needsMassFlavors(product) || product.category === 'Milkshake';
      const meta = isIceCreamCake(product) ? `${product.size || 'Torta de sorvete'} · Escolha 3 sabores · Retirada com antecedência mínima de 48 horas.` : product.size ? product.size : hasFlavor ? flavorRule(product).label : 'Produto pronto para retirada';
      const extras = product.includedExtras?.length ? ` · Inclui ${product.includedExtras.join(' e ')}.` : '';
      const fixedIngredients = product.fixedIngredients?.length ? `<p class="product__ingredients"><strong>Ingredientes fixos:</strong> ${escape(product.fixedIngredients.filter((item) => !/sabores? de sorvete/i.test(item)).join(', '))}</p>` : '';
      const ballCount = productBallCount(product); const ballRule = usesFlavorDistribution(product) && ballCount ? `<p class="product__ball-rule"><strong>${ballCount} bola${ballCount > 1 ? 's' : ''}:</strong> ${ballCount === 1 ? 'escolha 1 sabor.' : `pode distribuir ${ballCount} bolas entre os sabores que quiser — todas do mesmo sabor ou em sabores diferentes.`}</p>` : '';
      row.innerHTML = `<div><p class="product__name"><span class="product__number">${String(index + 1).padStart(2, '0')}</span>${escape(displayName(product.name))}${!product.available ? ' <span class="stock-tag">Esgotado</span>' : ''}</p><p class="product__meta">${escape(meta)}${escape(extras)}${needsContainerChoice(product) ? ' · Primeiro escolha casquinha ou copo.' : ''}</p>${fixedIngredients}${ballRule}<p class="product__price">${money(product.price)}</p></div>`;
      const button = document.createElement('button'); button.className = 'add-btn'; button.type = 'button'; const label = needsContainerChoice(product) ? 'Escolher recipiente' : hasFlavor ? 'Escolher sabores' : 'Adicionar ao pedido'; applyOrderButtonState(button, label, Boolean(product.selectable && product.available));
      button.addEventListener('click', () => runWhenRetiradaOpen(() => { state.lastCatalogSku = product.sku; hasFlavor ? beginFlavors(product) : addProduct(product); })); row.append(button); list.append(row);
    }); return list;
  }
  function milkshakeSubgroup(title, point, group) {
    const heading = document.createElement('div'); heading.className = `product-subgroup product-subgroup--${group}`; heading.innerHTML = `<strong>${escape(title)}</strong><span>${escape(point)}</span>`; return heading;
  }
  function renderProducts(products, section) {
    if (section.dataset.sectionTone === 'milkshake') {
      const traditional = products.filter(isTraditionalMilkshake); const acai = products.filter(isAcaiMilkshake);
      if (traditional.length) { section.append(milkshakeSubgroup('Milk-shakes tradicionais', 'Escolha 1 sabor ou até 2 sabores.', 'traditional'), buildProductList(traditional)); }
      if (acai.length) { section.append(milkshakeSubgroup('Milk-shakes de Açaí Natureon', 'Receitas pré-montadas · adicione direto ao pedido.', 'acai'), buildProductList(acai)); }
      return;
    }
    if (section.dataset.sectionTone === 'acai') {
      const combinations = products.filter((product) => !isAcaiGourmetCup(product)); const gourmetCups = products.filter(isAcaiGourmetCup);
      if (combinations.length) section.append(buildProductList(combinations));
      if (gourmetCups.length) section.append(milkshakeSubgroup('Taças Gourmet Açaí Natureon', '4 receitas pré-montadas · 500 ml · adicione direto ao pedido.', 'acai'));
      if (gourmetCups.length) section.append(buildProductList(gourmetCups));
      return;
    }
    section.append(buildProductList(products));
  }
  function renderPopsicles(products, section) {
    const list = document.createElement('div');
    const byGroup = new Map();
    list.className = 'product-list';
    products.filter((product) => product.picole).forEach((product) => {
      const id = product.picole.groupId;
      if (!byGroup.has(id)) byGroup.set(id, []);
      byGroup.get(id).push(product);
    });
    byGroup.forEach((groupProducts) => {
      const group = groupProducts[0].picole;
      const availableFlavors = groupProducts.filter((product) => !product.picole.unavailable && product.picole.stock > 0).length;
      const availabilityText = availableFlavors === 1 ? '1 sabor disponível.' : `${availableFlavors} sabores disponíveis.`;
      const row = document.createElement('article');
      row.className = 'product'; row.dataset.catalogSku = groupProducts[0].sku;
      row.innerHTML = `<div><p class="product__name">${escape(group.groupName)}${availableFlavors ? '' : ' <span class="stock-tag">Esgotado</span>'}</p><p class="product__meta">${availabilityText} Escolha os sabores dentro do botão.</p><p class="product__price">Varejo ${money(group.varejo)} · Atacado ${money(group.atacado)} a partir de 100 unidades</p></div>`;
      const button = document.createElement('button');
      button.className = 'add-btn'; button.type = 'button';
      applyOrderButtonState(button, 'Escolher sabores', Boolean(availableFlavors));
      button.addEventListener('click', () => runWhenRetiradaOpen(() => { state.lastCatalogSku = groupProducts[0].sku; beginPopsicleGroup(groupProducts); }));
      row.append(button); list.append(row);
    });
    section.append(list);
  }
  function beginPopsicleGroup(products) {
    state.popsicleGroup = products;
    const group = products[0]?.picole;
    $('#popsicle-title').textContent = group ? group.groupName : 'Escolha os sabores do picolé';
    $('#popsicle-subtitle').textContent = 'Toque em + para adicionar cada sabor. Você pode diminuir ou retirar antes de enviar.';
    renderPopsicleDialog();
    openDialog('popsicle-dialog');
  }
  function renderPopsicleDialog() {
    const root = $('#popsicle-list');
    const products = state.popsicleGroup || [];
    const selected = products.reduce((sum, product) => sum + Number(state.cart.find((item) => item.sku === product.sku)?.quantity || 0), 0);
    root.innerHTML = '';
    $('#popsicle-status').textContent = selected ? `${selected} picolé${selected !== 1 ? 's' : ''} deste tipo no pedido.` : 'Toque em + para adicionar cada sabor ao pedido.';
    products.forEach((product) => {
      const item = state.cart.find((entry) => entry.sku === product.sku);
      const qty = item?.quantity || 0;
      const unavailable = product.picole.unavailable || product.picole.stock <= 0 || !product.available;
      const stockText = product.picole.stock === 1 ? '1 unidade disponível.' : `${product.picole.stock} unidades disponíveis.`;
      const row = document.createElement('div');
      row.className = `popsicle-row${unavailable ? ' is-unavailable' : ''}`;
      row.innerHTML = `<div><p class="product__name">${escape(product.name)}${unavailable ? ' <span class="stock-tag">Esgotado</span>' : ''}</p><p class="product__meta">${unavailable ? 'Este sabor está indisponível.' : stockText}</p></div>`;
      const control = document.createElement('div'); control.className = 'qty';
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${product.name}`);
      minus.disabled = !qty || !retiradaAberta();
      minus.addEventListener('click', () => { if (item) { updateQuantity(item.key, -1); renderPopsicleDialog(); } });
      const count = document.createElement('span'); count.textContent = qty;
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar ${product.name}`);
      plus.disabled = unavailable || qty >= product.picole.stock || !retiradaAberta();
      plus.addEventListener('click', () => { const current = state.cart.find((entry) => entry.sku === product.sku); if (current) updateQuantity(current.key, 1); else addProduct(product, [], '', false); renderPopsicleDialog(); });
      control.append(minus, count, plus); row.append(control); root.append(row);
    });
  }
  function flavorDistributionTotal(value) { return (String(value || '').match(/\d+/g) || []).reduce((sum, number) => sum + Number(number), 0); }
  function massFlavorOptions() { return (state.data.sabores_sorvete || []).map((item) => ({ code: item.codigo, name: item.nome, unavailable: Boolean(item.esgotado || state.data.cadastro_skus?.por_chave?.['massas.' + item.codigo]?.ativo === false) })); }
  function selectedFlavorEntries() { const lookup = new Map(massFlavorOptions().map((item) => [item.code, item])); return Object.entries(state.flavorCounts || {}).filter(([, quantity]) => Number(quantity) > 0).map(([code, quantity]) => ({ ...(lookup.get(code) || { code, name: code }), quantity: Number(quantity) })); }
  function countedFlavorTotal() { return selectedFlavorEntries().reduce((sum, item) => sum + item.quantity, 0); }
  function countedFlavorText() { return selectedFlavorEntries().map((item) => `${item.quantity} ${item.name}`).join(' + '); }
  function boxAddOnOptions() {
    const entries = Object.values(state.data?.cadastro_skus?.por_chave || {});
    return (state.data?.acrescimos || []).map((item, index) => {
      const master = entries.find((entry) => entry.nome === item.nome);
      return { id: item.id || `acr_${index}`, sku: master?.sku || `ACR-${String(index + 1).padStart(3, '0')}`, name: item.nome, price: Number(item.preço || 0), stock: Number(item.estoque ?? 0), unavailable: Boolean(item.esgotado || master?.ativo === false) };
    });
  }
  function selectedBoxAddOns() { const options = new Map(boxAddOnOptions().map((item) => [item.id, item])); return Object.entries(state.boxAddOnCounts || {}).filter(([, quantity]) => Number(quantity) > 0).map(([id, quantity]) => ({ ...(options.get(id) || { id, name: id, price: 0, sku: id }), quantity: Number(quantity) })); }
  function ensureBoxAddOnsUi() {
    let section = $('#box-addons');
    if (!section) { section = document.createElement('section'); section.id = 'box-addons'; section.className = 'box-addons'; section.hidden = true; section.setAttribute('aria-labelledby', 'box-addons-title'); section.innerHTML = '<p class="box-addons__title" id="box-addons-title">Complementos para viagem (opcional)</p><p class="box-addons__hint">Depois de escolher o sorvete, você pode acrescentar complementos à sua caixa.</p><p class="box-addons__travel">Caixa exclusiva para viagem. A embalagem da caixa é adicionada automaticamente.</p><div class="box-addons__list" id="box-addons-list"></div><p class="box-addons__total" id="box-addons-total" aria-live="polite"></p>'; $('#item-mode').before(section); }
    return { section, list: $('#box-addons-list'), total: $('#box-addons-total') };
  }
  function renderBoxAddOns() {
    const ui = ensureBoxAddOnsUi(); ui.list.innerHTML = '';
    boxAddOnOptions().forEach((addOn) => {
      const quantity = Number(state.boxAddOnCounts?.[addOn.id] || 0); const unavailable = addOn.unavailable || addOn.stock <= 0;
      const row = document.createElement('div'); row.className = `box-addon-row${unavailable ? ' is-unavailable' : ''}`;
      const info = document.createElement('div'); const name = document.createElement('p'); name.className = 'box-addon-row__name'; name.textContent = addOn.name; const meta = document.createElement('p'); meta.className = 'box-addon-row__meta'; meta.textContent = unavailable ? 'Indisponível agora.' : `${money(addOn.price)} cada · SKU ${addOn.sku}`; info.append(name, meta);
      const control = document.createElement('div'); control.className = 'qty'; const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${addOn.name}`); minus.disabled = !quantity || unavailable; minus.addEventListener('click', () => { if (quantity <= 1) delete state.boxAddOnCounts[addOn.id]; else state.boxAddOnCounts[addOn.id] = quantity - 1; renderFlavorGrid(); }); const count = document.createElement('span'); count.textContent = quantity; count.setAttribute('aria-label', `${quantity} unidade${quantity !== 1 ? 's' : ''} de ${addOn.name}`); const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar ${addOn.name}`); plus.disabled = unavailable || quantity >= addOn.stock; plus.addEventListener('click', () => { state.boxAddOnCounts[addOn.id] = quantity + 1; renderFlavorGrid(); }); control.append(minus, count, plus); row.append(info, control); ui.list.append(row);
    });
    const selected = selectedBoxAddOns(); const subtotal = selected.reduce((sum, addOn) => sum + addOn.quantity * addOn.price, 0); ui.total.textContent = selected.length ? `Complementos selecionados: ${selected.reduce((sum, addOn) => sum + addOn.quantity, 0)} un. · Total parcial: ${money(subtotal)}` : 'Nenhum complemento selecionado. Você pode adicionar depois em um novo pedido.';
  }
  function beginFlavors(product) { state.flavorProduct = product; state.selectedFlavors = []; state.flavorCounts = {}; state.boxAddOnCounts = {}; state.flavorDistribution = ''; state.serviceMode = isTravelOnlyBox(product) ? 'travel' : ''; state.containerType = ''; state.cakeChoice = ''; const rule = flavorRule(product); $('#flavor-title').textContent = displayName(product.name); $('#flavor-subtitle').textContent = `${product.size ? `${product.size} · ` : ''}${isTravelOnlyBox(product) ? 'Caixa exclusiva para viagem: distribua os sabores e, se quiser, adicione complementos.' : isIceCreamCake(product) ? 'Escolha primeiro como deseja prosseguir com a torta.' : needsContainerChoice(product) ? 'Escolha primeiro o recipiente e depois os sabores.' : rule.label + '.'}`; renderFlavorGrid(); openDialog('flavor-dialog'); }
  function renderFlavorGrid() {
    const product = state.flavorProduct; if (!product) return;
    const rule = flavorRule(product); const grid = $('#flavor-grid'); const status = $('#flavor-status'); const distributionBox = $('#flavor-distribution'); const distributionList = $('#flavor-distribution-list'); const distributionHint = $('#flavor-distribution-hint'); const distributionCounter = $('#flavor-distribution-counter'); const addOnsUi = ensureBoxAddOnsUi(); const travelBox = isTravelOnlyBox(product); const needsContainer = needsContainerChoice(product); const isCake = isIceCreamCake(product); const cakeBox = $('#cake-choice'); cakeBox.hidden = !isCake; $$('[data-cake-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.cakeChoice === state.cakeChoice)); $$('input[name="cake-choice"]').forEach((input) => { input.checked = input.value === state.cakeChoice; }); const containerBox = $('#item-container'); containerBox.hidden = !needsContainer; $$('[data-container-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.containerChoice === state.containerType)); $$('input[name="item-container"]').forEach((input) => { input.checked = input.value === state.containerType; }); if (isCake && !state.cakeChoice) { grid.hidden = true; grid.innerHTML = ''; distributionBox.hidden = true; addOnsUi.section.hidden = true; $('#item-mode').hidden = true; status.textContent = 'Escolha: consultar pronta entrega pelo WhatsApp ou produzir a torta com 48 horas de antecedência.'; status.classList.remove('ready'); $('#confirm-flavors').disabled = true; return; } if (needsContainer && !state.containerType) { grid.hidden = true; grid.innerHTML = ''; distributionBox.hidden = true; addOnsUi.section.hidden = true; $('#item-mode').hidden = true; status.textContent = 'Primeiro escolha se deseja casquinha ou copo.'; status.classList.remove('ready'); $('#confirm-flavors').disabled = true; return; }
    if (rule.distribution) {
      grid.hidden = true; grid.innerHTML = ''; distributionBox.hidden = false; distributionList.innerHTML = '';
      distributionHint.textContent = `Use + e − ao lado de cada sabor até totalizar exatamente ${rule.ballCount} bolas. Você pode repetir o mesmo sabor ou combinar vários.`;
      const distributed = countedFlavorTotal();
      massFlavorOptions().forEach((flavor) => {
        const quantity = Number(state.flavorCounts?.[flavor.code] || 0); const normalized = normalize(flavor.name); const colors = PALETA_SABORES_MASSA[normalized] || ['#94A3B8','#F8FAFC','rgba(148,163,184,.30)'];
        const row = document.createElement('div'); row.className = 'flavor-distribution__row'; row.style.cssText = `--sabor-accent:${colors[0]};--sabor-tint:${colors[1]};`;
        const name = document.createElement('span'); name.className = 'flavor-distribution__name'; name.textContent = flavor.name;
        const control = document.createElement('div'); control.className = 'qty';
        const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${flavor.name}`); minus.disabled = !quantity || flavor.unavailable; minus.addEventListener('click', () => { if (quantity <= 1) delete state.flavorCounts[flavor.code]; else state.flavorCounts[flavor.code] = quantity - 1; renderFlavorGrid(); });
        const count = document.createElement('span'); count.textContent = quantity; count.setAttribute('aria-label', `${quantity} bolas de ${flavor.name}`);
        const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar uma bola de ${flavor.name}`); plus.disabled = flavor.unavailable || distributed >= rule.ballCount; plus.addEventListener('click', () => { state.flavorCounts[flavor.code] = quantity + 1; renderFlavorGrid(); });
        control.append(minus, count, plus); row.append(name, control); distributionList.append(row);
      });
      state.selectedFlavors = selectedFlavorEntries(); state.flavorDistribution = countedFlavorText(); const ready = distributed === rule.ballCount;
      distributionCounter.textContent = ready ? `Distribuição completa: ${distributed} de ${rule.ballCount} bolas.` : `Distribuição informada: ${distributed} de ${rule.ballCount} bolas. Use os controles até fechar a quantidade.`;
      distributionCounter.classList.toggle('is-ready', ready);
      const requiresMode = needsPackagingChoice(product); const modeBox = $('#item-mode'); modeBox.hidden = !(ready && requiresMode); addOnsUi.section.hidden = !(ready && travelBox); if (ready && travelBox) renderBoxAddOns(); $$('[data-mode-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.modeChoice === state.serviceMode)); $$('input[name="item-mode"]').forEach((input) => { input.checked = input.value === state.serviceMode; });
      status.textContent = !ready ? `Escolha as quantidades por sabor até totalizar ${rule.ballCount} bolas.` : (travelBox ? 'Sabores completos. Os complementos são opcionais e a caixa seguirá para viagem.' : (requiresMode && !state.serviceMode ? 'Agora escolha como deseja receber este produto.' : 'Tudo certo! Revise e adicione este produto ao pedido.'));
      status.classList.toggle('ready', ready && (!requiresMode || Boolean(state.serviceMode))); $('#confirm-flavors').disabled = !(ready && (!requiresMode || state.serviceMode)); return;
    }
    distributionBox.hidden = true; addOnsUi.section.hidden = true; grid.hidden = false; grid.innerHTML = '';
    const options = rule.source === 'milkshake' ? (state.data.milkshake?.sabores || []).map((name, i) => ({ code: `MLK-${i + 1}`, name, unavailable: false })) : massFlavorOptions();
    const count = state.selectedFlavors.length; grid.classList.toggle('limite-atingido', count >= rule.max);
    options.forEach((flavor) => {
      const selected = state.selectedFlavors.some((item) => item.code === flavor.code); const normalized = normalize(flavor.name); const novo = rule.source === 'massa' && SABORES_NOVOS.has(normalized);
      const colors = PALETA_SABORES_MASSA[normalized] || ['#94A3B8','#F8FAFC','rgba(148,163,184,.30)'];
      const button = document.createElement('button'); button.className = `flavor-chip sabor-item${novo ? ' sabor-novo' : ''}${flavor.unavailable ? ' is-esgotado' : ''}`; button.type = 'button'; button.style.cssText = `--sabor-accent:${colors[0]};--sabor-tint:${colors[1]};--sabor-glow:${colors[2]};`;
      button.innerHTML = `${novo ? '<span class="sabor-novo-badge" aria-label="Novo sabor">NOVO</span>' : ''}${flavor.unavailable ? '<span class="sabor-esgotado-badge">ESGOTADO</span>' : ''}<span>${escape(flavor.name)}</span>`;
      button.disabled = flavor.unavailable || (!selected && count >= rule.max); button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', () => { const found = state.selectedFlavors.findIndex((item) => item.code === flavor.code); if (found >= 0) state.selectedFlavors.splice(found, 1); else if (state.selectedFlavors.length < rule.max) state.selectedFlavors.push(flavor); renderFlavorGrid(); }); grid.append(button);
    });
    const ready = count >= rule.min && count <= rule.max; const requiresMode = needsPackagingChoice(product); const modeBox = $('#item-mode'); modeBox.hidden = !(ready && requiresMode); $$('[data-mode-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.modeChoice === state.serviceMode)); $$('input[name="item-mode"]').forEach((input) => { input.checked = input.value === state.serviceMode; }); const missing = rule.min - count; const optional = rule.max - count; const cakeLabel = isCake ? (state.cakeChoice === 'producao_48h' ? ' Depois, informe data e horário no mínimo 48 horas à frente.' : ' A pronta entrega será consultada e confirmada manualmente pelo WhatsApp.') : ''; status.textContent = missing > 0 ? `Escolha mais ${missing} sabor${missing !== 1 ? 'es' : ''}.` : (optional > 0 ? `Você pode adicionar mais ${optional} sabor${optional !== 1 ? 'es' : ''} ou continuar com a escolha atual.${cakeLabel}` : (requiresMode && !state.serviceMode ? 'Agora escolha como deseja receber este produto.' : `Tudo certo! Revise e adicione este produto ao pedido.${cakeLabel}`)); status.classList.toggle('ready', ready && (!requiresMode || Boolean(state.serviceMode))); $('#confirm-flavors').disabled = !(ready && (!requiresMode || state.serviceMode) && (!isCake || Boolean(state.cakeChoice)));
  }
  function confirmFlavors() { if (!state.flavorProduct) return; const rule = flavorRule(state.flavorProduct); if (rule.distribution) { state.selectedFlavors = selectedFlavorEntries(); state.flavorDistribution = countedFlavorText(); } const validSelection = rule.distribution ? countedFlavorTotal() === rule.ballCount : state.selectedFlavors.length >= rule.min && state.selectedFlavors.length <= rule.max; if (!validSelection) return; if (isIceCreamCake(state.flavorProduct) && !state.cakeChoice) return; if (needsContainerChoice(state.flavorProduct) && !state.containerType) return; if (needsPackagingChoice(state.flavorProduct) && !state.serviceMode) return; addProduct(state.flavorProduct, state.selectedFlavors.slice(), state.serviceMode, true, state.containerType, state.cakeChoice, state.flavorDistribution, isTravelOnlyBox(state.flavorProduct) ? selectedBoxAddOns() : []); closeDialog('flavor-dialog'); state.flavorProduct = null; state.selectedFlavors = []; state.flavorCounts = {}; state.boxAddOnCounts = {}; state.flavorDistribution = ''; state.serviceMode = ''; state.containerType = ''; state.cakeChoice = ''; }
  function renderCartSummary() { const bar = $('#summary-bar'); const count = totalItems(); bar.classList.toggle('is-visible', count > 0); $('#summary-small').textContent = count ? `${count} item${count !== 1 ? 's' : ''} selecionado${count !== 1 ? 's' : ''}` : 'Seu pedido está vazio'; $('#summary-large').textContent = count ? `Ver pedido · ${money(total())}` : `Ver pedido · ${money(0)}`; }
  function renderCart() {
    const list = $('#cart-list'); list.innerHTML = '';
    if (!state.cart.length) { list.innerHTML = '<div class="empty-state">Seu pedido ainda está vazio. Volte e escolha os produtos que deseja retirar.</div>'; $('#cart-breakdown').innerHTML = `<div><span>Total dos produtos</span><span>${money(0)}</span></div><div><span>Complementos</span><span>${money(0)}</span></div><div><span>Embalagens para viagem</span><span>${money(0)}</span></div>`; $('#cart-total').textContent = money(0); syncPickupDateConstraint(); return; }
    state.cart.forEach((item) => {
      const row = document.createElement('article'); row.className = 'cart-item';
      const flavors = item.flavors?.length ? `Sabores escolhidos: ${item.flavors.map((flavor) => flavor.name || flavor).join(', ')}` : ''; const flavorDistribution = item.flavorDistribution ? `Distribuição das bolas: ${item.flavorDistribution}` : ''; const selectedAddOns = item.boxAddOns?.length ? `Complementos para viagem: ${item.boxAddOns.map((addOn) => `${addOn.quantity} ${addOn.name}`).join(', ')}` : ''; const fixedIngredients = item.fixedIngredients?.length ? `Ingredientes fixos: ${item.fixedIngredients.filter((ingredient) => !/sabores? de sorvete/i.test(ingredient)).join(', ')}` : ''; const includedExtras = item.includedExtras?.length ? `Inclusos: ${item.includedExtras.join(' e ')}` : ''; const container = item.containerType ? `Recipiente: ${item.containerType === 'casquinha' ? 'Casquinha' : 'Copo'}` : ''; const cakeChoice = isIceCreamCake(item) ? `Torta: ${item.cakeChoice === 'producao_48h' ? 'produção com 48 horas' : 'consultar pronta entrega no WhatsApp'}` : '';
      const mode = item.serviceMode === 'travel' ? 'Embalar para viagem' : item.serviceMode === 'store' ? 'Consumir na loja' : '';
      const pricing = [`<span>Produto: ${money(itemBaseTotal(item))}</span>`];
      if (item.boxAddOns?.length) pricing.push(`<span>Complementos para viagem: ${money(itemAddOnTotal(item))}</span>`);
      if (mode) pricing.push(`<span>${mode}: ${item.serviceMode === 'travel' ? `${escape(item.packagingName || 'Embalagem para viagem')} · SKU ${escape(item.packagingSku || 'EMB-VIAGEM')} · ${money(itemPackagingTotal(item))}` : 'sem taxa de embalagem'}</span>`);
      pricing.push(`<strong>Subtotal: ${money(itemTotal(item))}</strong>`);
      row.innerHTML = `<div class="cart-item__head"><div><p class="cart-item__name">${escape(displayName(item.name))}</p><p class="cart-item__meta">${escape([item.sku, item.size, container, flavors, flavorDistribution, selectedAddOns, fixedIngredients, includedExtras, cakeChoice].filter(Boolean).join(' · '))}</p></div><p class="cart-item__value">${money(itemTotal(item))}</p></div><div class="cart-item__pricing">${pricing.join('')}</div>`;
      const bottom = document.createElement('div'); bottom.className = 'cart-item__bottom'; const control = document.createElement('div'); control.className = 'qty';
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${item.name}`); minus.addEventListener('click', () => updateQuantity(item.key, -1));
      const count = document.createElement('span'); count.textContent = item.quantity;
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar mais um ${item.name}`); plus.disabled = item.type === 'picole' && Number.isFinite(item.stock) && item.quantity >= item.stock; plus.addEventListener('click', () => updateQuantity(item.key, 1));
      control.append(minus, count, plus); const remove = document.createElement('button'); remove.className = 'remove'; remove.type = 'button'; remove.textContent = 'Excluir produto'; remove.addEventListener('click', () => removeItem(item.key)); bottom.append(control, remove); row.append(bottom); list.append(row);
    });
    $('#cart-breakdown').innerHTML = `<div><span>Total dos produtos</span><span>${money(totalProducts())}</span></div><div><span>Complementos para viagem</span><span>${money(totalAddOns())}</span></div><div><span>Embalagens para viagem</span><span>${money(totalPackaging())}</span></div>`;
    $('#cart-total').textContent = money(total()); syncPickupDateConstraint();
  }
  function validatePhone(value) { const digits = value.replace(/\D/g, ''); return digits.length >= 10 && digits.startsWith('16'); }
  function validPickupTime(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') && value >= '11:00' && value <= '20:00'; }
  function hasIceCreamCake() { return state.cart.some((item) => isIceCreamCake(item)); }
  function hasCakeProductionLead() { return state.cart.some((item) => isIceCreamCake(item) && item.cakeChoice !== 'pronta_consulta'); }
  function brasiliaParts(date = new Date()) { const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])); return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}`, minutes: Number(values.hour) * 60 + Number(values.minute) }; }
  function brasiliaDateValue(date) { return brasiliaParts(date).date; }
  function commonPickupDeadline() { const deadline = new Date(Date.now() + 60 * 60 * 1000); deadline.setSeconds(0, 0); deadline.setMinutes(Math.ceil(deadline.getMinutes() / 15) * 15); return brasiliaParts(deadline); }
  function validCommonLeadTime(time) { const limit = commonPickupDeadline(); const requestedMinutes = String(time || '').split(':').map(Number); return validPickupTime(time) && (requestedMinutes[0] * 60 + requestedMinutes[1]) >= limit.minutes; }
  function pickupTimeMessage() { const time = $('#pickup-time'); if (!time || hasCakeProductionLead() || !time.value) return ''; if (!validPickupTime(time.value)) return 'Escolha um horário entre 11h00 e 20h00.'; if (!validCommonLeadTime(time.value)) return `Pelo horário de Brasília, escolha a partir de ${commonPickupDeadline().time}. A retirada exige no mínimo 1 hora de antecedência.`; return ''; }
  function syncPickupTimeValidation() { const field = $('#pickup-time-field'); const time = $('#pickup-time'); const error = $('#pickup-time-error'); if (!field || !time || !error) return true; const message = pickupTimeMessage(); field.classList.toggle('is-invalid', Boolean(message)); time.setAttribute('aria-invalid', message ? 'true' : 'false'); error.textContent = message; error.classList.toggle('is-visible', Boolean(message)); return !message; }
  function syncPickupDateConstraint() { const input = $('#pickup-date'); const field = $('#pickup-date-field'); const notice = $('#cake-pickup-rule'); const time = $('#pickup-time'); const timeHelp = $('#pickup-time-help'); if (!input || !field || !notice || !time || !timeHelp) return; const cakeProduction = hasCakeProductionLead(); field.hidden = !cakeProduction; notice.hidden = !cakeProduction; input.required = cakeProduction; if (cakeProduction) { input.min = brasiliaDateValue(new Date(Date.now() + 48 * 60 * 60 * 1000)); time.min = '11:00'; time.disabled = false; timeHelp.textContent = 'Torta em produção: escolha data e horário pelo horário de Brasília; a data precisa estar pelo menos 48 horas à frente.'; } else { input.value = ''; input.min = ''; const deadline = commonPickupDeadline(); if (deadline.minutes <= 20 * 60) { time.min = deadline.time; time.disabled = false; timeHelp.textContent = `Horário de Brasília: escolha a partir de ${deadline.time}. O preparo mínimo é de 1 hora.`; } else { time.value = ''; time.min = '20:00'; time.disabled = true; timeHelp.textContent = 'Hoje não há horário com 1 hora de antecedência. Volte no próximo horário de atendimento.'; } } syncPickupTimeValidation(); }
  function validCakeLeadTime(date, time) { return !hasCakeProductionLead() || Date.parse(`${date}T${time}:00-03:00`) >= Date.now() + 48 * 60 * 60 * 1000; }
  function buildMessage(form) {
    const lines = ['SOLICITAÇÃO DE RETIRADA — Itapolitana Cajuru', '', 'ITENS DO PEDIDO'];
    state.cart.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}${item.size ? ` — ${item.size}` : ''}`); lines.push(`   Código: ${item.sku} · Quantidade: ${item.quantity}`);
      if (item.containerType) lines.push(`   Recipiente: ${item.containerType === 'casquinha' ? 'Casquinha' : 'Copo'}`);
      if (item.flavors?.length) lines.push(`   Sabores: ${item.flavors.map((flavor) => flavor.name || flavor).join(', ')}`);
      if (item.flavorDistribution) lines.push(`   Distribuição das bolas por sabor: ${item.flavorDistribution}`);
      if (item.boxAddOns?.length) lines.push(`   Complementos para viagem: ${item.boxAddOns.map((addOn) => `${addOn.quantity} ${addOn.name} · SKU ${addOn.sku} · ${money(Number(addOn.quantity) * Number(addOn.price))}`).join(' | ')}`);
      if (item.fixedIngredients?.length) lines.push(`   Ingredientes fixos: ${item.fixedIngredients.filter((ingredient) => !/sabores? de sorvete/i.test(ingredient)).join(', ')}`);
      if (item.includedExtras?.length) lines.push(`   Inclusos: ${item.includedExtras.join(' e ')}`);
      if (isIceCreamCake(item)) lines.push(`   Torta: ${item.cakeChoice === 'producao_48h' ? 'produção com antecedência mínima de 48 horas' : 'consultar pronta entrega pelo WhatsApp'}`);
      lines.push(`   Produto: ${money(itemBaseTotal(item))}`);
      if (item.boxAddOns?.length) lines.push(`   Complementos: ${money(itemAddOnTotal(item))}`);
      if (item.serviceMode === 'travel') lines.push(`   Embalar para viagem: ${item.packagingName || 'Embalagem para viagem'} · SKU ${item.packagingSku || 'EMB-VIAGEM'} · ${money(itemPackagingTotal(item))}`);
      if (item.serviceMode === 'store') lines.push('   Consumir na loja: sem taxa de embalagem');
      lines.push(`   Subtotal: ${money(itemTotal(item))}`);
    });
    const schedule = hasCakeProductionLead() ? `Data desejada: ${form.data_retirada}` : 'Retirada: hoje, com antecedência mínima de 1 hora pelo horário de Brasília'; lines.push('', 'RESUMO PRIORITÁRIO — AÇÃO DA SORVETERIA', `Cliente: ${form.nome} · WhatsApp: ${form.telefone}`, schedule, `Horário desejado: ${form.horario} (Brasília)`, `Pagamento: ${form.pagamento}`, 'Status: AGUARDANDO LIGAÇÃO E CONFIRMAÇÃO HUMANA.', 'Cliente marcou o aceite: foi informado sobre ligação, conferência de produtos/sabores/alterações, retirada e pagamento presencial.', 'Sem ligação do cliente ou resposta humana em até 15 minutos: considerar a solicitação CANCELADA.', 'Não separar, elaborar ou iniciar produção antes da conferência por ligação.', '', `Total dos produtos: ${money(totalProducts())}`, `Total de complementos para viagem: ${money(totalAddOns())}`, `Total de embalagens para viagem: ${money(totalPackaging())}`, `Total informado: ${money(total())}`, `Observações adicionais: ${form.observacoes || 'Nenhuma'}`, '', 'ITENS DETALHADOS', ...lines.slice(2), '', 'ACEITE DO CLIENTE', 'Cliente declarou que leu e aceitou a ligação de confirmação, o prazo de 15 minutos e a regra de que mudanças só valem após confirmação humana.'); return lines.join('\n');
  }
  function submitOrder(event) { event.preventDefault(); const error = $('#form-error'); error.classList.remove('is-visible'); if (!retiradaAberta()) { window.ItapHorarioPedidos?.aviso('retirada'); return showFormError('Pedidos para retirada disponíveis das 11h00 às 20h00. Volte nesse horário para montar seu pedido.'); } const form = Object.fromEntries(new FormData(event.currentTarget).entries()); if (!state.cart.length) return showFormError('Escolha pelo menos um produto antes de enviar.'); if (!form.nome?.trim()) return showFormError('Informe o nome de quem vai retirar.'); if (!validatePhone(form.telefone || '')) return showFormError('Informe um WhatsApp com DDD 16, por exemplo: (16) 99999-9999.'); if (!validPickupTime(form.horario)) return showFormError('Escolha um horário de retirada entre 11h00 e 20h00.'); if (hasCakeProductionLead()) { if (!form.data_retirada) return showFormError('Para torta em produção, escolha a data desejada para retirar.'); if (!validCakeLeadTime(form.data_retirada, form.horario)) return showFormError('Tortas em produção precisam de pelo menos 48 horas de antecedência pelo horário de Brasília.'); } else if (!validCommonLeadTime(form.horario)) { syncPickupTimeValidation(); $('#pickup-time')?.focus(); return showFormError(pickupTimeMessage()); } if (!form.aceite) return showFormError('Leia e marque o aceite das regras antes de enviar.'); setOrderStage(3); const text = buildMessage(form); window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); }
  function showFormError(message) { const error = $('#form-error'); error.textContent = message; error.classList.add('is-visible'); error.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  async function init() { try { const response = await fetch('dados/produtos.json?v=20260822-textos-skus'); if (!response.ok) throw new Error('Não foi possível carregar o catálogo.'); state.data = await response.json(); state.catalog = buildCatalog(state.data); $('#loading').remove(); renderCatalog(); renderCartSummary(); setOrderStage(state.cart.length ? 2 : 1); syncPickupDateConstraint(); const sku = new URLSearchParams(location.search).get('sku'); if (sku) { const product = state.catalog.find((item) => item.sku === sku); if (product) { document.getElementById(`sec-${slug(product.category)}`)?.scrollIntoView({ block: 'start' }); announce(`${product.name} está destacado na seção correspondente.`); } } } catch (error) { $('#loading').textContent = 'Não foi possível carregar os produtos agora. Volte ao cardápio e tente novamente.'; console.error(error); } }
  $('#search').addEventListener('input', (event) => { state.query = event.target.value; renderCatalog(); });
  $('#summary-bar').addEventListener('click', () => { renderCart(); openDialog('cart-dialog'); });
  $('#confirm-flavors').addEventListener('click', confirmFlavors);
  $$('input[name="item-mode"]').forEach((input) => input.addEventListener('change', (event) => { state.serviceMode = event.target.value; renderFlavorGrid(); }));
  $$('input[name="item-container"]').forEach((input) => input.addEventListener('change', (event) => { state.containerType = event.target.value; renderFlavorGrid(); }));
  $$('input[name="cake-choice"]').forEach((input) => input.addEventListener('change', (event) => { state.cakeChoice = event.target.value; renderFlavorGrid(); }));
  $('#continue-shopping').addEventListener('click', () => { setOrderStage(1); closeDialog('cart-dialog'); requestAnimationFrame(() => { const target = state.lastCatalogSku ? document.querySelector(`[data-catalog-sku="${state.lastCatalogSku}"]`) : null; const destination = target || $('#catalogo'); destination.scrollIntoView({ behavior: 'smooth', block: 'center' }); target?.querySelector('button')?.focus({ preventScroll: true }); }); });
  $('#pickup-form').addEventListener('submit', submitOrder);
  $('#pickup-time').addEventListener('input', syncPickupTimeValidation);
  $('#pickup-time').addEventListener('change', syncPickupTimeValidation);
  window.addEventListener('itap:horario-pedidos-atualizado', () => { if (state.catalog.length) renderCatalog(); });
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => { if (button.dataset.close === 'popsicle-dialog') state.popsicleGroup = null; closeDialog(button.dataset.close); }));
  init();
}());
