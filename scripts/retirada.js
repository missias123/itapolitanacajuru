/* Design: controlador mobile-first do HTML de retirada; dados vêm exclusivamente de dados/produtos.json. */
(function () {
  'use strict';
  const WHATSAPP = '5516996062046';
  const SABORES_NOVOS = new Set(['cheesecake', 'passas ao rum', 'bem casado']);
  const PALETA_SABORES_MASSA = {
    'abacaxi ao vinho':['#F59E0B','#FFFBEB','rgba(245,158,11,.36)'],'abacaxi suíço':['#FACC15','#FEFCE8','rgba(250,204,21,.40)'],'amarena':['#E11D48','#FFF1F2','rgba(225,29,72,.34)'],'ameixa':['#7C3AED','#F5F3FF','rgba(124,58,237,.32)'],'banana com nutella':['#D97706','#FFF7ED','rgba(217,119,6,.32)'],'bem casado':['#C08457','#FFF7ED','rgba(192,132,87,.34)'],'bis e trufa':['#7C3F2C','#FFF7ED','rgba(124,63,44,.34)'],'blue ice':['#38BDF8','#F0F9FF','rgba(56,189,248,.38)'],'cereja trufada':['#BE123C','#FFF1F2','rgba(190,18,60,.34)'],'cheesecake':['#E2A77A','#FFF7ED','rgba(226,167,122,.34)'],'chocolate belga':['#6B3E26','#FFF7ED','rgba(107,62,38,.36)'],'chocolate com café':['#4B2E25','#F8FAFC','rgba(75,46,37,.36)'],'coco queimado':['#A16207','#FFFBEB','rgba(161,98,7,.34)'],'creme paris':['#D4A017','#FFFBEB','rgba(212,160,23,.34)'],'croquer':['#B45309','#FFF7ED','rgba(180,83,9,.34)'],'doce de leite':['#B7794B','#FFF7ED','rgba(183,121,75,.34)'],'ferrero rocher':['#A16207','#FFFBEB','rgba(161,98,7,.36)'],'flocos':['#64748B','#F8FAFC','rgba(100,116,139,.32)'],'kinder ovo':['#2563EB','#EFF6FF','rgba(37,99,235,.34)'],'leite condensado':['#CBD5E1','#F8FAFC','rgba(148,163,184,.34)'],'leite ninho':['#60A5FA','#EFF6FF','rgba(96,165,250,.38)'],'leite ninho folheado':['#38BDF8','#F0F9FF','rgba(56,189,248,.38)'],'leite ninho com oreo':['#60A5FA','#EFF6FF','rgba(96,165,250,.38)'],'leite ninho trufado':['#3B82F6','#EFF6FF','rgba(59,130,246,.38)'],'limão':['#84CC16','#F7FEE7','rgba(132,204,22,.34)'],'limão suíço':['#A3E635','#F7FEE7','rgba(163,230,53,.38)'],'menta com chocolate':['#10B981','#ECFDF5','rgba(16,185,129,.34)'],'milho verde':['#EAB308','#FEFCE8','rgba(234,179,8,.36)'],'morango trufado':['#F43F5E','#FFF1F2','rgba(244,63,94,.36)'],'mousse de maracujá':['#F59E0B','#FFFBEB','rgba(245,158,11,.36)'],'mousse de uva':['#A78BFA','#F5F3FF','rgba(167,139,250,.36)'],'nozes':['#8D6E63','#FAF7F5','rgba(141,110,99,.34)'],'nutella':['#7C2D12','#FFF7ED','rgba(124,45,18,.36)'],'ovomaltine':['#B45309','#FFF7ED','rgba(180,83,9,.36)'],'passas ao rum':['#7F1D1D','#FFF1F2','rgba(127,29,29,.36)'],'pistache':['#65A30D','#F7FEE7','rgba(101,163,13,.34)'],'prestígio':['#5B3A29','#FFF7ED','rgba(91,58,41,.36)'],'sensação':['#EC4899','#FDF2F8','rgba(236,72,153,.36)']
  };
  const STORAGE_KEY = 'itap_retirada_v1';
  const state = { data: null, catalog: [], cart: loadCart(), flavorProduct: null, popsicleGroup: null, selectedFlavors: [], serviceMode: '', containerType: '', query: '', lastCatalogSku: null };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
  const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const escape = (text) => String(text || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  function normalizeCart(items) {
    return (Array.isArray(items) ? items : []).filter(Boolean).map((item) => {
      const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
      const isTravel = item.serviceMode === 'travel';
      return { ...item, quantity, price: Number(item.price) || 0, retail: Number(item.retail) || 0, wholesale: Number(item.wholesale) || 0, packagingSku: isTravel ? item.packagingSku || 'EMB-VIAGEM' : '', packagingName: isTravel ? item.packagingName || 'Embalagem para viagem' : '', packagingFee: isTravel ? Number(item.packagingFee || 1) : 0 };
    }).filter((item) => item.quantity > 0);
  }
  function loadCart() { try { return normalizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { return []; } }
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); }
  function announce(message) { $('#live-region').textContent = message; }
  function openDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
  function closeDialog(id) { const dialog = document.getElementById(id); if (dialog?.open) dialog.close(); }
  function needsMassFlavors(product) {
    if (product.fixedAcai) return false;
    if (isIceCreamCake(product)) return true;
    if (product.category === 'Sorvetes de massa' || product.category === 'Caixas para encomenda' || product.category === 'Tortas por encomenda') return true;
    if (product.category === 'Isopores para viagem') return true;
    return /\b\d+\s*bola/i.test(`${product.name} ${product.size}`) && product.category === 'Sobremesas';
  }
  function needsPackagingChoice(product) {
    return !product.fixedAcai && product.type !== 'picole' && (needsMassFlavors(product) || product.category === 'Milkshake');
  }
  function needsContainerChoice(product) { return normalize(product?.name).includes('casquinha/copo'); }
  function isIceCreamCake(product) { return normalize(product?.name).includes('torta de sorvete'); }
  function displayName(name) { return String(name || '').replace(/Casquinha\/copo/gi, 'Casquinha ou copo'); }
  function flavorRule(product) {
    if (product.category === 'Milkshake') return { source: 'milkshake', min: 1, max: 2, label: 'Escolha 1 sabor ou até 2 sabores para o milkshake' };
    const match = `${product.name} ${product.size}`.match(/(\d+)\s*(?:Bolas?|Sabores?)/i);
    const required = isIceCreamCake(product) || product.category === 'Tortas por encomenda' ? 3 : match ? Number(match[1]) : 1;
    return { source: 'massa', min: required, max: required, label: `Escolha ${required} sabor${required > 1 ? 'es' : ''} de massa` };
  }
  function productType(category) { return category === 'Picolés' ? 'picole' : 'produto'; }
  function retiradaAberta() { return !window.ItapHorarioPedidos || window.ItapHorarioPedidos.estaAberto('retirada'); }
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
    return entries.map((item) => {
      const meta = picoMeta.get(item.sku);
      const category = item.categoria || 'Outros produtos';
      return { id: item.sku, sku: item.sku, category, name: item.nome, size: item.tamanho || '', price: Number(item.preco || 0), active: item.ativo !== false, available: productAvailable(data, item), type: meta ? 'picole' : productType(category), picole: meta || null, includedExtras: Array.isArray(item.acrescimos_inclusos) ? item.acrescimos_inclusos : [], travelPackaging, fixedAcai: normalize(category).includes('acai') || normalize(item.nome).includes('acai natureon'), selectable: category !== 'Sabores de massa' && !(category === 'Picolés' && !meta) };
    });
  }
  function cartKey(product, flavors, serviceMode = '', containerType = '') { return `${product.sku}::${(flavors || []).map((item) => item.code || item).sort().join('|')}::${serviceMode}::${containerType}`; }
  function currentPopsicleCount() { return state.cart.filter((item) => item.type === 'picole').reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
  function priceFor(item) { if (item.type === 'picole') return currentPopsicleCount() >= 100 ? item.wholesale : item.retail; return item.price; }
  function itemBaseTotal(item) { return Number(item.quantity || 0) * priceFor(item); }
  function itemPackagingTotal(item) { return Number(item.quantity || 0) * Number(item.packagingFee || 0); }
  function itemTotal(item) { return itemBaseTotal(item) + itemPackagingTotal(item); }
  function total() { return state.cart.reduce((sum, item) => sum + itemTotal(item), 0); }
  function totalProducts() { return state.cart.reduce((sum, item) => sum + itemBaseTotal(item), 0); }
  function totalPackaging() { return state.cart.reduce((sum, item) => sum + itemPackagingTotal(item), 0); }
  function totalItems() { return state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
  function refreshCartUi() {
    state.cart = normalizeCart(state.cart);
    saveCart();
    renderCartSummary();
    if (state.catalog.length) renderCatalog();
    if ($('#cart-dialog')?.open) renderCart();
  }
  function setCart(item) { const index = state.cart.findIndex((entry) => entry.key === item.key); if (index >= 0) state.cart[index] = item; else state.cart.push(item); refreshCartUi(); }
  function addProduct(product, flavors = [], serviceMode = '', openReview = true, containerType = '') {
    state.lastCatalogSku = product.sku;
    const key = cartKey(product, flavors, serviceMode, containerType);
    const current = state.cart.find((item) => item.key === key);
    const travelPackaging = product.travelPackaging || { sku: 'EMB-VIAGEM', name: 'Embalagem para viagem', price: 1, available: true };
    const item = current || { key, sku: product.sku, name: product.name, size: product.size, category: product.category, type: product.type, price: product.price, flavors, includedExtras: product.includedExtras || [], serviceMode, containerType, packagingSku: serviceMode === 'travel' ? travelPackaging.sku : '', packagingName: serviceMode === 'travel' ? travelPackaging.name : '', packagingFee: serviceMode === 'travel' ? travelPackaging.price : 0, quantity: 0, retail: product.picole?.varejo, wholesale: product.picole?.atacado, stock: product.picole?.stock };
    item.quantity += 1;
    setCart(item);
    if (openReview) { renderCart(); openDialog('cart-dialog'); }
    announce(`${displayName(product.name)} foi adicionado ao pedido.`);
  }
  function updateQuantity(key, delta) { const current = state.cart.find((item) => item.key === key); if (!current) return; const limit = current.type === 'picole' && Number.isFinite(current.stock) ? current.stock : Infinity; current.quantity = Math.max(0, Math.min(limit, current.quantity + delta)); setCart(current); }
  function removeItem(key) { state.cart = state.cart.filter((item) => item.key !== key); refreshCartUi(); announce('Produto excluído do pedido.'); }
  function productSearchText(product) { return normalize([product.category, product.name, product.size, product.sku, product.picole?.groupName].filter(Boolean).join(' ')); }
  function categoryRank(category) {
    const value = normalize(category);
    if (value.includes('sorvetes de massa')) return 0;
    if (value.includes('acai')) return 1;
    if (value.includes('picoles')) return 2;
    if (value === 'milkshake') return 3;
    if (value.includes('tacas tradicionais')) return 4;
    if (value.includes('tacas premium')) return 5;
    if (value.includes('sobremesas')) return 6;
    return 99;
  }
  function categoryOrder(categories) { return [...categories].sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b, 'pt-BR')); }
  function isPublicOrderProduct(product) {
    const category = normalize(product.category);
    const exclusiveOrderCategories = ['sabores de massa', 'caixas para encomenda', 'isopores para viagem', 'tortas por encomenda', 'acrescimos'];
    return product.selectable && !exclusiveOrderCategories.some((item) => category.includes(item));
  }
  function renderCatalog() {
    const root = $('#catalog'); const query = normalize(state.query); const grouped = new Map();
    state.catalog.filter(isPublicOrderProduct).filter((product) => !query || productSearchText(product).includes(query)).forEach((product) => { if (!grouped.has(product.category)) grouped.set(product.category, []); grouped.get(product.category).push(product); });
    root.innerHTML = ''; $('#section-nav').innerHTML = '';
    if (!grouped.size) { root.innerHTML = '<div class="empty-state">Não encontramos produto com esse nome ou código. Tente buscar outro termo.</div>'; return; }
    categoryOrder(grouped.keys()).forEach((category) => {
      const products = grouped.get(category); const section = document.createElement('section'); section.className = 'catalog-section'; section.id = `sec-${slug(category)}`;
      const head = document.createElement('div'); head.className = 'catalog-section__head'; head.innerHTML = `<h2>${escape(category)}</h2><p>${category === 'Picolés' ? 'Escolha o tipo e depois o sabor do picolé.' : `${products.length} produto${products.length !== 1 ? 's' : ''} para pedir.`}</p>`; section.append(head);
      const nav = document.createElement('button'); nav.type = 'button'; nav.textContent = category; nav.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth', block: 'start' })); $('#section-nav').append(nav);
      if (category === 'Picolés') renderPopsicles(products, section); else renderProducts(products, section);
      root.append(section);
    });
  }
  function slug(value) { return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function renderProducts(products, section) {
    const list = document.createElement('div'); list.className = 'product-list'; products.forEach((product, index) => {
      const row = document.createElement('article'); row.className = 'product'; row.dataset.catalogSku = product.sku; const hasFlavor = needsMassFlavors(product) || product.category === 'Milkshake';
      const meta = isIceCreamCake(product) ? `${product.size || 'Torta de sorvete'} · Escolha 3 sabores · Retirada com antecedência mínima de 48 horas.` : product.size ? product.size : hasFlavor ? flavorRule(product).label : 'Produto pronto para retirada';
      const extras = product.includedExtras?.length ? ` · Inclui ${product.includedExtras.join(' e ')}.` : '';
      row.innerHTML = `<div><p class="product__name"><span class="product__number">${String(index + 1).padStart(2, '0')}</span>${escape(displayName(product.name))}${!product.available ? ' <span class="stock-tag">Esgotado</span>' : ''}</p><p class="product__meta">${escape(meta)}${escape(extras)}${needsContainerChoice(product) ? ' · Primeiro escolha casquinha ou copo.' : ''}</p><p class="product__price">${money(product.price)}</p></div>`;
      const button = document.createElement('button'); button.className = 'add-btn'; button.type = 'button'; button.textContent = !product.available ? 'Esgotado' : needsContainerChoice(product) ? 'Escolher recipiente' : hasFlavor ? 'Escolher sabores' : 'Adicionar ao pedido'; button.disabled = !product.selectable || !product.available || !retiradaAberta();
      button.addEventListener('click', () => { state.lastCatalogSku = product.sku; hasFlavor ? beginFlavors(product) : addProduct(product); }); row.append(button); list.append(row);
    }); section.append(list);
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
      button.textContent = availableFlavors ? 'Escolher sabores' : 'Esgotado';
      button.disabled = !availableFlavors || !retiradaAberta();
      button.addEventListener('click', () => { state.lastCatalogSku = groupProducts[0].sku; beginPopsicleGroup(groupProducts); });
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
  function beginFlavors(product) { state.flavorProduct = product; state.selectedFlavors = []; state.serviceMode = ''; state.containerType = ''; const rule = flavorRule(product); $('#flavor-title').textContent = displayName(product.name); $('#flavor-subtitle').textContent = `${product.size ? `${product.size} · ` : ''}${needsContainerChoice(product) ? 'Escolha primeiro o recipiente e depois os sabores.' : rule.label + '.'}`; renderFlavorGrid(); openDialog('flavor-dialog'); }
  function renderFlavorGrid() {
    const product = state.flavorProduct; if (!product) return;
    const rule = flavorRule(product); const grid = $('#flavor-grid'); const status = $('#flavor-status'); const needsContainer = needsContainerChoice(product); const containerBox = $('#item-container'); containerBox.hidden = !needsContainer; $$('[data-container-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.containerChoice === state.containerType)); $$('input[name="item-container"]').forEach((input) => { input.checked = input.value === state.containerType; }); if (needsContainer && !state.containerType) { grid.hidden = true; grid.innerHTML = ''; $('#item-mode').hidden = true; status.textContent = 'Primeiro escolha se deseja casquinha ou copo.'; status.classList.remove('ready'); $('#confirm-flavors').disabled = true; return; } grid.hidden = false; grid.innerHTML = '';
    const options = rule.source === 'milkshake' ? (state.data.milkshake?.sabores || []).map((name, i) => ({ code: `MLK-${i + 1}`, name, unavailable: false })) : (state.data.sabores_sorvete || []).map((item) => ({ code: item.codigo, name: item.nome, unavailable: Boolean(item.esgotado || state.data.cadastro_skus?.por_chave?.['massas.' + item.codigo]?.ativo === false) }));
    const count = state.selectedFlavors.length; grid.classList.toggle('limite-atingido', count >= rule.max);
    options.forEach((flavor) => {
      const selected = state.selectedFlavors.some((item) => item.code === flavor.code); const normalized = normalize(flavor.name); const novo = rule.source === 'massa' && SABORES_NOVOS.has(normalized);
      const colors = PALETA_SABORES_MASSA[normalized] || ['#94A3B8','#F8FAFC','rgba(148,163,184,.30)'];
      const button = document.createElement('button'); button.className = `flavor-chip sabor-item${novo ? ' sabor-novo' : ''}${flavor.unavailable ? ' is-esgotado' : ''}`; button.type = 'button'; button.style.cssText = `--sabor-accent:${colors[0]};--sabor-tint:${colors[1]};--sabor-glow:${colors[2]};`;
      button.innerHTML = `${novo ? '<span class="sabor-novo-badge" aria-label="Novo sabor">NOVO</span>' : ''}${flavor.unavailable ? '<span class="sabor-esgotado-badge">ESGOTADO</span>' : ''}<span>${escape(flavor.name)}</span>`;
      button.disabled = flavor.unavailable || (!selected && count >= rule.max); button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', () => { const found = state.selectedFlavors.findIndex((item) => item.code === flavor.code); if (found >= 0) state.selectedFlavors.splice(found, 1); else if (state.selectedFlavors.length < rule.max) state.selectedFlavors.push(flavor); renderFlavorGrid(); }); grid.append(button);
    });
    const ready = count >= rule.min && count <= rule.max; const requiresMode = needsPackagingChoice(product); const modeBox = $('#item-mode'); modeBox.hidden = !(ready && requiresMode); $$('[data-mode-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.modeChoice === state.serviceMode)); $$('input[name="item-mode"]').forEach((input) => { input.checked = input.value === state.serviceMode; }); const missing = rule.min - count; const optional = rule.max - count; status.textContent = missing > 0 ? `Escolha mais ${missing} sabor${missing !== 1 ? 'es' : ''}.` : (optional > 0 ? `Você pode adicionar mais ${optional} sabor${optional !== 1 ? 'es' : ''} ou continuar com a escolha atual.` : (requiresMode && !state.serviceMode ? 'Agora escolha como deseja receber este produto.' : 'Tudo certo! Revise e adicione este produto ao pedido.')); status.classList.toggle('ready', ready && (!requiresMode || Boolean(state.serviceMode))); $('#confirm-flavors').disabled = !(ready && (!requiresMode || state.serviceMode));
  }
  function confirmFlavors() { if (!state.flavorProduct) return; const rule = flavorRule(state.flavorProduct); if (state.selectedFlavors.length < rule.min || state.selectedFlavors.length > rule.max) return; if (needsContainerChoice(state.flavorProduct) && !state.containerType) return; if (needsPackagingChoice(state.flavorProduct) && !state.serviceMode) return; addProduct(state.flavorProduct, state.selectedFlavors.slice(), state.serviceMode, true, state.containerType); closeDialog('flavor-dialog'); state.flavorProduct = null; state.serviceMode = ''; state.containerType = ''; }
  function renderCartSummary() { const bar = $('#summary-bar'); const count = totalItems(); bar.classList.toggle('is-visible', count > 0); $('#summary-small').textContent = count ? `${count} item${count !== 1 ? 's' : ''} selecionado${count !== 1 ? 's' : ''}` : 'Seu pedido está vazio'; $('#summary-large').textContent = count ? `Ver pedido · ${money(total())}` : `Ver pedido · ${money(0)}`; }
  function renderCart() {
    const list = $('#cart-list'); list.innerHTML = '';
    if (!state.cart.length) { list.innerHTML = '<div class="empty-state">Seu pedido ainda está vazio. Volte e escolha os produtos que deseja retirar.</div>'; $('#cart-breakdown').innerHTML = `<div><span>Total dos produtos</span><span>${money(0)}</span></div><div><span>Embalagens para viagem</span><span>${money(0)}</span></div>`; $('#cart-total').textContent = money(0); syncPickupDateConstraint(); return; }
    state.cart.forEach((item) => {
      const row = document.createElement('article'); row.className = 'cart-item';
      const flavors = item.flavors?.length ? `Sabores: ${item.flavors.map((flavor) => flavor.name || flavor).join(', ')}` : ''; const includedExtras = item.includedExtras?.length ? `Inclusos: ${item.includedExtras.join(' e ')}` : ''; const container = item.containerType ? `Recipiente: ${item.containerType === 'casquinha' ? 'Casquinha' : 'Copo'}` : '';
      const mode = item.serviceMode === 'travel' ? 'Embalar para viagem' : item.serviceMode === 'store' ? 'Consumir na loja' : '';
      const pricing = [`<span>Produto: ${money(itemBaseTotal(item))}</span>`];
      if (mode) pricing.push(`<span>${mode}: ${item.serviceMode === 'travel' ? `${escape(item.packagingName || 'Embalagem para viagem')} · SKU ${escape(item.packagingSku || 'EMB-VIAGEM')} · ${money(itemPackagingTotal(item))}` : 'sem taxa de embalagem'}</span>`);
      pricing.push(`<strong>Subtotal: ${money(itemTotal(item))}</strong>`);
      row.innerHTML = `<div class="cart-item__head"><div><p class="cart-item__name">${escape(displayName(item.name))}</p><p class="cart-item__meta">${escape([item.sku, item.size, container, flavors, includedExtras].filter(Boolean).join(' · '))}</p></div><p class="cart-item__value">${money(itemTotal(item))}</p></div><div class="cart-item__pricing">${pricing.join('')}</div>`;
      const bottom = document.createElement('div'); bottom.className = 'cart-item__bottom'; const control = document.createElement('div'); control.className = 'qty';
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${item.name}`); minus.addEventListener('click', () => updateQuantity(item.key, -1));
      const count = document.createElement('span'); count.textContent = item.quantity;
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar mais um ${item.name}`); plus.disabled = item.type === 'picole' && Number.isFinite(item.stock) && item.quantity >= item.stock; plus.addEventListener('click', () => updateQuantity(item.key, 1));
      control.append(minus, count, plus); const remove = document.createElement('button'); remove.className = 'remove'; remove.type = 'button'; remove.textContent = 'Excluir produto'; remove.addEventListener('click', () => removeItem(item.key)); bottom.append(control, remove); row.append(bottom); list.append(row);
    });
    $('#cart-breakdown').innerHTML = `<div><span>Total dos produtos</span><span>${money(totalProducts())}</span></div><div><span>Embalagens para viagem</span><span>${money(totalPackaging())}</span></div>`;
    $('#cart-total').textContent = money(total()); syncPickupDateConstraint();
  }
  function validatePhone(value) { const digits = value.replace(/\D/g, ''); return digits.length >= 10 && digits.startsWith('16'); }
  function validPickupTime(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') && value >= '11:00' && value <= '20:00'; }
  function hasIceCreamCake() { return state.cart.some((item) => isIceCreamCake(item)); }
  function localDateValue(date) { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }
  function syncPickupDateConstraint() { const input = $('#pickup-date'); const notice = $('#cake-pickup-rule'); if (!input || !notice) return; const min = hasIceCreamCake() ? new Date(Date.now() + 48 * 60 * 60 * 1000) : new Date(); input.min = localDateValue(min); notice.hidden = !hasIceCreamCake(); }
  function validCakeLeadTime(date, time) { return !hasIceCreamCake() || new Date(`${date}T${time}:00`).getTime() >= Date.now() + 48 * 60 * 60 * 1000; }
  function buildMessage(form) {
    const lines = ['SOLICITAÇÃO DE RETIRADA — Itapolitana Cajuru', '', 'ITENS DO PEDIDO'];
    state.cart.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}${item.size ? ` — ${item.size}` : ''}`); lines.push(`   Código: ${item.sku} · Quantidade: ${item.quantity}`);
      if (item.containerType) lines.push(`   Recipiente: ${item.containerType === 'casquinha' ? 'Casquinha' : 'Copo'}`);
      if (item.flavors?.length) lines.push(`   Sabores: ${item.flavors.map((flavor) => flavor.name || flavor).join(', ')}`);
      if (item.includedExtras?.length) lines.push(`   Inclusos: ${item.includedExtras.join(' e ')}`);
      lines.push(`   Produto: ${money(itemBaseTotal(item))}`);
      if (item.serviceMode === 'travel') lines.push(`   Embalar para viagem: ${item.packagingName || 'Embalagem para viagem'} · SKU ${item.packagingSku || 'EMB-VIAGEM'} · ${money(itemPackagingTotal(item))}`);
      if (item.serviceMode === 'store') lines.push('   Consumir na loja: sem taxa de embalagem');
      lines.push(`   Subtotal: ${money(itemTotal(item))}`);
    });
    lines.push('', `Total dos produtos: ${money(totalProducts())}`, `Total de embalagens para viagem: ${money(totalPackaging())}`, `Total informado: ${money(total())}`, '', `Nome para retirada: ${form.nome}`, `WhatsApp: ${form.telefone}`, `Data desejada: ${form.data_retirada}`, `Horário desejado: ${form.horario}`, `Pagamento: ${form.pagamento}`, `Observações: ${form.observacoes || 'Nenhuma'}`, '', 'AVISOS IMPORTANTES', '• Este pedido é apenas uma solicitação; nenhum produto será elaborado ou separado automaticamente.', '• A sorveteria confirma manualmente no WhatsApp a disponibilidade dos produtos e a execução do pedido antes de iniciar a produção.', '• Sem confirmação em até 15 minutos: falha técnica; solicitação cancelada e produto não será elaborado.', '• Tortas de sorvete exigem retirada com antecedência mínima de 48 horas.', '• Após confirmação, o preparo pode levar até 1 hora.', '• Em Pix, a produção começa somente após a confirmação do pagamento.', '', 'ACEITE DO CLIENTE', 'Declaro que li, compreendi e aceito as regras acima.'); return lines.join('\n');
  }
  function submitOrder(event) { event.preventDefault(); const error = $('#form-error'); error.classList.remove('is-visible'); if (!retiradaAberta()) { window.ItapHorarioPedidos?.aviso('retirada'); return showFormError('Pedidos para retirada disponíveis das 11h00 às 20h00. Volte nesse horário para montar seu pedido.'); } const form = Object.fromEntries(new FormData(event.currentTarget).entries()); if (!state.cart.length) return showFormError('Escolha pelo menos um produto antes de enviar.'); if (!form.nome?.trim()) return showFormError('Informe o nome de quem vai retirar.'); if (!validatePhone(form.telefone || '')) return showFormError('Informe um WhatsApp com DDD 16, por exemplo: (16) 99999-9999.'); if (!form.data_retirada) return showFormError('Escolha a data desejada para retirar o pedido.'); if (!validPickupTime(form.horario)) return showFormError('Escolha um horário de retirada entre 11h00 e 20h00.'); if (!validCakeLeadTime(form.data_retirada, form.horario)) return showFormError('Tortas de sorvete precisam ser retiradas com antecedência mínima de 48 horas. Escolha outra data e horário.'); if (!form.pagamento) return showFormError('Escolha como deseja pagar.'); if (!form.aceite) return showFormError('Leia e marque o aceite das regras antes de enviar.'); const text = buildMessage(form); window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); }
  function showFormError(message) { const error = $('#form-error'); error.textContent = message; error.classList.add('is-visible'); error.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  async function init() { try { const response = await fetch('dados/produtos.json?v=20260821-estoque50'); if (!response.ok) throw new Error('Não foi possível carregar o catálogo.'); state.data = await response.json(); state.catalog = buildCatalog(state.data); $('#loading').remove(); renderCatalog(); renderCartSummary(); syncPickupDateConstraint(); const sku = new URLSearchParams(location.search).get('sku'); if (sku) { const product = state.catalog.find((item) => item.sku === sku); if (product) { document.getElementById(`sec-${slug(product.category)}`)?.scrollIntoView({ block: 'start' }); announce(`${product.name} está destacado na seção correspondente.`); } } } catch (error) { $('#loading').textContent = 'Não foi possível carregar os produtos agora. Volte ao cardápio e tente novamente.'; console.error(error); } }
  $('#search').addEventListener('input', (event) => { state.query = event.target.value; renderCatalog(); });
  $('#summary-bar').addEventListener('click', () => { renderCart(); openDialog('cart-dialog'); });
  $('#confirm-flavors').addEventListener('click', confirmFlavors);
  $$('input[name="item-mode"]').forEach((input) => input.addEventListener('change', (event) => { state.serviceMode = event.target.value; renderFlavorGrid(); }));
  $$('input[name="item-container"]').forEach((input) => input.addEventListener('change', (event) => { state.containerType = event.target.value; renderFlavorGrid(); }));
  $('#continue-shopping').addEventListener('click', () => { closeDialog('cart-dialog'); requestAnimationFrame(() => { const target = state.lastCatalogSku ? document.querySelector(`[data-catalog-sku="${state.lastCatalogSku}"]`) : null; const destination = target || $('#catalogo'); destination.scrollIntoView({ behavior: 'smooth', block: 'center' }); target?.querySelector('button')?.focus({ preventScroll: true }); }); });
  $('#pickup-form').addEventListener('submit', submitOrder);
  window.addEventListener('itap:horario-pedidos-atualizado', () => { if (state.catalog.length) renderCatalog(); });
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => { if (button.dataset.close === 'popsicle-dialog') state.popsicleGroup = null; closeDialog(button.dataset.close); }));
  init();
}());
