/* Design: controlador mobile-first do HTML de retirada; dados vêm exclusivamente de dados/produtos.json. */
(function () {
  'use strict';
  const WHATSAPP = '5516996062046';
  const SABORES_NOVOS = new Set(['cheesecake', 'passas ao rum', 'bem casado']);
  const PALETA_SABORES_MASSA = {
    'abacaxi ao vinho':['#F59E0B','#FFFBEB','rgba(245,158,11,.36)'],'abacaxi suíço':['#FACC15','#FEFCE8','rgba(250,204,21,.40)'],'amarena':['#E11D48','#FFF1F2','rgba(225,29,72,.34)'],'ameixa':['#7C3AED','#F5F3FF','rgba(124,58,237,.32)'],'banana com nutella':['#D97706','#FFF7ED','rgba(217,119,6,.32)'],'bem casado':['#C08457','#FFF7ED','rgba(192,132,87,.34)'],'bis e trufa':['#7C3F2C','#FFF7ED','rgba(124,63,44,.34)'],'blue ice':['#38BDF8','#F0F9FF','rgba(56,189,248,.38)'],'cereja trufada':['#BE123C','#FFF1F2','rgba(190,18,60,.34)'],'cheesecake':['#E2A77A','#FFF7ED','rgba(226,167,122,.34)'],'chocolate belga':['#6B3E26','#FFF7ED','rgba(107,62,38,.36)'],'chocolate com café':['#4B2E25','#F8FAFC','rgba(75,46,37,.36)'],'coco queimado':['#A16207','#FFFBEB','rgba(161,98,7,.34)'],'creme paris':['#D4A017','#FFFBEB','rgba(212,160,23,.34)'],'croquer':['#B45309','#FFF7ED','rgba(180,83,9,.34)'],'doce de leite':['#B7794B','#FFF7ED','rgba(183,121,75,.34)'],'ferrero rocher':['#A16207','#FFFBEB','rgba(161,98,7,.36)'],'flocos':['#64748B','#F8FAFC','rgba(100,116,139,.32)'],'kinder ovo':['#2563EB','#EFF6FF','rgba(37,99,235,.34)'],'leite condensado':['#CBD5E1','#F8FAFC','rgba(148,163,184,.34)'],'leite ninho':['#60A5FA','#EFF6FF','rgba(96,165,250,.38)'],'leite ninho folheado':['#38BDF8','#F0F9FF','rgba(56,189,248,.38)'],'leite ninho com oreo':['#60A5FA','#EFF6FF','rgba(96,165,250,.38)'],'leite ninho trufado':['#3B82F6','#EFF6FF','rgba(59,130,246,.38)'],'limão':['#84CC16','#F7FEE7','rgba(132,204,22,.34)'],'limão suíço':['#A3E635','#F7FEE7','rgba(163,230,53,.38)'],'menta com chocolate':['#10B981','#ECFDF5','rgba(16,185,129,.34)'],'milho verde':['#EAB308','#FEFCE8','rgba(234,179,8,.36)'],'morango trufado':['#F43F5E','#FFF1F2','rgba(244,63,94,.36)'],'mousse de maracujá':['#F59E0B','#FFFBEB','rgba(245,158,11,.36)'],'mousse de uva':['#A78BFA','#F5F3FF','rgba(167,139,250,.36)'],'nozes':['#8D6E63','#FAF7F5','rgba(141,110,99,.34)'],'nutella':['#7C2D12','#FFF7ED','rgba(124,45,18,.36)'],'ovomaltine':['#B45309','#FFF7ED','rgba(180,83,9,.36)'],'passas ao rum':['#7F1D1D','#FFF1F2','rgba(127,29,29,.36)'],'pistache':['#65A30D','#F7FEE7','rgba(101,163,13,.34)'],'prestígio':['#5B3A29','#FFF7ED','rgba(91,58,41,.36)'],'sensação':['#EC4899','#FDF2F8','rgba(236,72,153,.36)']
  };
  const STORAGE_KEY = 'itap_retirada_v1';
  const state = { data: null, catalog: [], cart: loadCart(), flavorProduct: null, selectedFlavors: [], serviceMode: '', query: '' };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
  const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const escape = (text) => String(text || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  function loadCart() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(saved) ? saved : []; } catch { return []; } }
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); }
  function announce(message) { $('#live-region').textContent = message; }
  function openDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
  function closeDialog(id) { const dialog = document.getElementById(id); if (dialog?.open) dialog.close(); }
  function needsMassFlavors(product) {
    if (product.fixedAcai) return false;
    if (product.category === 'Sorvetes de massa' || product.category === 'Caixas para encomenda' || product.category === 'Tortas por encomenda') return true;
    if (product.category === 'Isopores para viagem') return true;
    return /\b\d+\s*bola/i.test(`${product.name} ${product.size}`) && product.category === 'Sobremesas';
  }
  function needsPackagingChoice(product) {
    return !product.fixedAcai && product.type !== 'picole' && (needsMassFlavors(product) || product.category === 'Milkshake');
  }
  function flavorRule(product) {
    if (product.category === 'Milkshake') return { source: 'milkshake', required: 1, label: 'Escolha 1 sabor para o milkshake' };
    const match = `${product.name} ${product.size}`.match(/(\d+)\s*(?:Bolas?|Sabores?)/i);
    const required = match ? Number(match[1]) : product.category === 'Tortas por encomenda' ? 3 : 1;
    return { source: 'massa', required, label: `Escolha ${required} sabor${required > 1 ? 'es' : ''} de massa` };
  }
  function productType(category) { return category === 'Picolés' ? 'picole' : 'produto'; }
  function retiradaAberta() { return !window.ItapHorarioPedidos || window.ItapHorarioPedidos.estaAberto('retirada'); }
  function buildCatalog(data) {
    const entries = Object.values(data.cadastro_skus?.por_chave || {}).filter((item) => item.ativo !== false);
    const picoMeta = new Map();
    Object.entries(data.picolés || {}).forEach(([groupId, group]) => (group.sabores || []).forEach((flavor) => picoMeta.set(flavor.codigo, { groupId, groupName: group.nome, varejo: Number(group.preço_varejo), atacado: Number(group.preço_atacado), stock: Number(flavor.estoque ?? group.estoque ?? 0), unavailable: Boolean(flavor.esgotado || group.esgotado) })));
    return entries.map((item) => {
      const meta = picoMeta.get(item.sku);
      const category = item.categoria || 'Outros produtos';
      return { id: item.sku, sku: item.sku, category, name: item.nome, size: item.tamanho || '', price: Number(item.preco || 0), active: item.ativo !== false, type: meta ? 'picole' : productType(category), picole: meta || null, fixedAcai: normalize(category).includes('acai') || normalize(item.nome).includes('acai natureon'), selectable: category !== 'Sabores de massa' && !(category === 'Picolés' && !meta) };
    });
  }
  function cartKey(product, flavors, serviceMode = '') { return `${product.sku}::${(flavors || []).map((item) => item.code || item).sort().join('|')}::${serviceMode}`; }
  function currentPopsicleCount() { return state.cart.filter((item) => item.type === 'picole').reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
  function priceFor(item) { if (item.type === 'picole') return currentPopsicleCount() >= 100 ? item.wholesale : item.retail; return item.price; }
  function itemBaseTotal(item) { return Number(item.quantity || 0) * priceFor(item); }
  function itemPackagingTotal(item) { return Number(item.quantity || 0) * Number(item.packagingFee || 0); }
  function itemTotal(item) { return itemBaseTotal(item) + itemPackagingTotal(item); }
  function total() { return state.cart.reduce((sum, item) => sum + itemTotal(item), 0); }
  function totalProducts() { return state.cart.reduce((sum, item) => sum + itemBaseTotal(item), 0); }
  function totalPackaging() { return state.cart.reduce((sum, item) => sum + itemPackagingTotal(item), 0); }
  function totalItems() { return state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
  function setCart(item) { const index = state.cart.findIndex((entry) => entry.key === item.key); if (index >= 0) state.cart[index] = item; else state.cart.push(item); state.cart = state.cart.filter((entry) => entry.quantity > 0); saveCart(); renderCartSummary(); renderCatalog(); }
  function addProduct(product, flavors = [], serviceMode = '', openReview = true) {
    const key = cartKey(product, flavors, serviceMode);
    const current = state.cart.find((item) => item.key === key);
    const item = current || { key, sku: product.sku, name: product.name, size: product.size, category: product.category, type: product.type, price: product.price, flavors, serviceMode, packagingFee: serviceMode === 'travel' ? 1 : 0, quantity: 0, retail: product.picole?.varejo, wholesale: product.picole?.atacado, stock: product.picole?.stock };
    item.quantity += 1;
    setCart(item);
    if (openReview) { renderCart(); openDialog('cart-dialog'); }
    announce(`${product.name} foi adicionado ao pedido.`);
  }
  function updateQuantity(key, delta) { const current = state.cart.find((item) => item.key === key); if (!current) return; const limit = current.type === 'picole' && Number.isFinite(current.stock) ? current.stock : Infinity; current.quantity = Math.max(0, Math.min(limit, current.quantity + delta)); setCart(current); }
  function removeItem(key) { state.cart = state.cart.filter((item) => item.key !== key); saveCart(); renderCartSummary(); renderCatalog(); renderCart(); announce('Produto excluído do pedido.'); }
  function productSearchText(product) { return normalize([product.category, product.name, product.size, product.sku, product.picole?.groupName].filter(Boolean).join(' ')); }
  function categoryRank(category) {
    const value = normalize(category);
    if (value.includes('sorvetes de massa')) return 0;
    if (value.includes('sabores de massa')) return 1;
    if (value.includes('picoles')) return 2;
    if (value.includes('milk') && value.includes('acai')) return 4;
    if (value.includes('acai')) return 3;
    if (value === 'milkshake') return 5;
    if (value.includes('tacas tradicionais')) return 6;
    if (value.includes('tacas premium')) return 7;
    if (value.includes('isopores')) return 8;
    if (value.includes('sobremesas')) return 9;
    if (value.includes('caixas')) return 10;
    if (value.includes('tortas')) return 11;
    if (value.includes('acrescimos')) return 12;
    return 99;
  }
  function categoryOrder(categories) { return [...categories].sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b, 'pt-BR')); }
  function renderCatalog() {
    const root = $('#catalog'); const query = normalize(state.query); const grouped = new Map();
    state.catalog.filter((product) => !query || productSearchText(product).includes(query)).forEach((product) => { if (!grouped.has(product.category)) grouped.set(product.category, []); grouped.get(product.category).push(product); });
    root.innerHTML = ''; $('#section-nav').innerHTML = '';
    if (!grouped.size) { root.innerHTML = '<div class="empty-state">Não encontramos produto com esse nome ou código. Tente buscar outro termo.</div>'; return; }
    categoryOrder(grouped.keys()).forEach((category) => {
      const products = grouped.get(category); const section = document.createElement('section'); section.className = 'catalog-section'; section.id = `sec-${slug(category)}`;
      const head = document.createElement('div'); head.className = 'catalog-section__head'; head.innerHTML = `<h2>${escape(category)}</h2><p>${category === 'Sabores de massa' ? '38 sabores que aparecem ao escolher produtos de massa.' : `${products.length} item${products.length !== 1 ? 's' : ''} na lista oficial.`}</p>`; section.append(head);
      const nav = document.createElement('button'); nav.type = 'button'; nav.textContent = category; nav.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth', block: 'start' })); $('#section-nav').append(nav);
      if (category === 'Picolés') renderPopsicles(products, section); else if (category === 'Sabores de massa') renderMassFlavorReference(products, section); else renderProducts(products, section);
      root.append(section);
    });
  }
  function slug(value) { return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function renderProducts(products, section) {
    const list = document.createElement('div'); list.className = 'product-list'; products.forEach((product, index) => {
      const row = document.createElement('article'); row.className = 'product'; const hasFlavor = needsMassFlavors(product) || product.category === 'Milkshake';
      const meta = product.size ? product.size : hasFlavor ? flavorRule(product).label : 'Produto pronto para retirada';
      row.innerHTML = `<div><p class="product__name"><span class="product__number">${String(index + 1).padStart(2, '0')}</span>${escape(product.name)}</p><p class="product__meta">${escape(meta)}</p><span class="product__sku">${escape(product.sku)}</span><p class="product__price">${money(product.price)}</p></div>`;
      const button = document.createElement('button'); button.className = 'add-btn'; button.type = 'button'; button.textContent = hasFlavor ? 'Escolher' : 'Adicionar'; button.disabled = !product.selectable || !retiradaAberta();
      button.addEventListener('click', () => hasFlavor ? beginFlavors(product) : addProduct(product)); row.append(button); list.append(row);
    }); section.append(list);
  }
  function renderMassFlavorReference(products, section) { const info = document.createElement('div'); info.className = 'flavor-info'; info.textContent = 'Estes 38 sabores são escolhidos dentro dos produtos que permitem sabores de massa. Toque em “Escolher” em casquinhas, copos, caixas, tortas, isopores ou sobremesas com bola.'; section.append(info); const list = document.createElement('div'); list.className = 'product-list'; products.forEach((product, index) => { const row = document.createElement('div'); row.className = 'product'; row.innerHTML = `<div><p class="product__name"><span class="product__number">${String(index + 1).padStart(2, '0')}</span>${escape(product.name)}</p><span class="product__sku">${escape(product.sku)}</span></div><span class="product__meta">Sabor de massa</span>`; list.append(row); }); section.append(list); }
  function renderPopsicles(products, section) {
    const grid = document.createElement('div'); grid.className = 'popsicle-grid'; const byGroup = new Map(); const base = [];
    products.forEach((product) => { if (product.picole) { const id = product.picole.groupId; if (!byGroup.has(id)) byGroup.set(id, []); byGroup.get(id).push(product); } else base.push(product); });
    base.forEach((product) => { const row = document.createElement('div'); row.className = 'base-row'; row.innerHTML = `<strong>${escape(product.name)}</strong> · Escolha um sabor correspondente abaixo.`; grid.append(row); });
    byGroup.forEach((list, id) => { const group = list[0].picole; const holder = document.createElement('section'); holder.className = 'popsicle-group'; holder.innerHTML = `<div class="popsicle-group__head"><h3 class="popsicle-group__title">${escape(group.groupName)}</h3><p class="popsicle-group__price">Varejo ${money(group.varejo)} · Atacado ${money(group.atacado)} a partir de 100 picolés no pedido</p></div>`; list.forEach((product) => { const item = state.cart.find((entry) => entry.sku === product.sku); const qty = item?.quantity || 0; const unavailable = product.picole.unavailable || product.picole.stock <= 0; const row = document.createElement('div'); row.className = `popsicle-row${unavailable ? ' is-unavailable' : ''}`; row.innerHTML = `<div><p class="product__name">${escape(product.name)} ${unavailable ? '<span class="stock-tag">Esgotado</span>' : ''}</p><span class="product__sku">${escape(product.sku)}</span></div>`; const control = document.createElement('div'); control.className = 'qty'; const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${product.name}`); minus.disabled = !qty || !retiradaAberta(); minus.addEventListener('click', () => item && updateQuantity(item.key, -1)); const count = document.createElement('span'); count.textContent = qty; const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar ${product.name}`); plus.disabled = unavailable || qty >= product.picole.stock || !retiradaAberta(); plus.addEventListener('click', () => { const current = state.cart.find((entry) => entry.sku === product.sku); if (current) updateQuantity(current.key, 1); else addProduct(product, [], '', false); }); control.append(minus, count, plus); row.append(control); holder.append(row); }); grid.append(holder); }); section.append(grid);
  }
  function beginFlavors(product) { state.flavorProduct = product; state.selectedFlavors = []; state.serviceMode = ''; const rule = flavorRule(product); $('#flavor-title').textContent = product.name; $('#flavor-subtitle').textContent = `${product.size ? `${product.size} · ` : ''}${rule.label}.`; renderFlavorGrid(); openDialog('flavor-dialog'); }
  function renderFlavorGrid() {
    const product = state.flavorProduct; if (!product) return;
    const rule = flavorRule(product); const grid = $('#flavor-grid'); grid.innerHTML = '';
    const options = rule.source === 'milkshake' ? (state.data.milkshake?.sabores || []).map((name, i) => ({ code: `MLK-${i + 1}`, name, unavailable: false })) : (state.data.sabores_sorvete || []).map((item) => ({ code: item.codigo, name: item.nome, unavailable: Boolean(item.esgotado) }));
    const count = state.selectedFlavors.length; grid.classList.toggle('limite-atingido', count >= rule.required);
    options.forEach((flavor) => {
      const selected = state.selectedFlavors.some((item) => item.code === flavor.code); const normalized = normalize(flavor.name); const novo = rule.source === 'massa' && SABORES_NOVOS.has(normalized);
      const colors = PALETA_SABORES_MASSA[normalized] || ['#94A3B8','#F8FAFC','rgba(148,163,184,.30)'];
      const button = document.createElement('button'); button.className = `flavor-chip sabor-item${novo ? ' sabor-novo' : ''}${flavor.unavailable ? ' is-esgotado' : ''}`; button.type = 'button'; button.style.cssText = `--sabor-accent:${colors[0]};--sabor-tint:${colors[1]};--sabor-glow:${colors[2]};`;
      button.innerHTML = `${novo ? '<span class="sabor-novo-badge" aria-label="Novo sabor">NOVO</span>' : ''}${flavor.unavailable ? '<span class="sabor-esgotado-badge">ESGOTADO</span>' : ''}<span>${escape(flavor.name)}</span>`;
      button.disabled = flavor.unavailable || (!selected && count >= rule.required); button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', () => { const found = state.selectedFlavors.findIndex((item) => item.code === flavor.code); if (found >= 0) state.selectedFlavors.splice(found, 1); else if (state.selectedFlavors.length < rule.required) state.selectedFlavors.push(flavor); renderFlavorGrid(); }); grid.append(button);
    });
    const status = $('#flavor-status'); const ready = count === rule.required; const requiresMode = needsPackagingChoice(product); const modeBox = $('#item-mode'); modeBox.hidden = !(ready && requiresMode); $$('[data-mode-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.modeChoice === state.serviceMode)); $$('input[name="item-mode"]').forEach((input) => { input.checked = input.value === state.serviceMode; }); status.textContent = ready ? (requiresMode && !state.serviceMode ? 'Agora escolha consumir na loja ou embalar para viagem.' : 'Tudo certo! Pode confirmar o produto.') : `Faltam ${rule.required - count} sabor${rule.required - count !== 1 ? 'es' : ''}.`; status.classList.toggle('ready', ready && (!requiresMode || Boolean(state.serviceMode))); $('#confirm-flavors').disabled = !(ready && (!requiresMode || state.serviceMode));
  }
  function confirmFlavors() { if (!state.flavorProduct) return; if (needsPackagingChoice(state.flavorProduct) && !state.serviceMode) return; addProduct(state.flavorProduct, state.selectedFlavors.slice(), state.serviceMode); closeDialog('flavor-dialog'); state.flavorProduct = null; state.serviceMode = ''; }
  function renderCartSummary() { const bar = $('#summary-bar'); const count = totalItems(); bar.classList.toggle('is-visible', count > 0); if (count) { $('#summary-small').textContent = `${count} item${count !== 1 ? 's' : ''} selecionado${count !== 1 ? 's' : ''}`; $('#summary-large').textContent = `Ver pedido · ${money(total())}`; } }
  function renderCart() {
    const list = $('#cart-list'); list.innerHTML = '';
    if (!state.cart.length) { list.innerHTML = '<div class="empty-state">Seu pedido ainda está vazio. Volte e escolha os produtos que deseja retirar.</div>'; $('#cart-breakdown').innerHTML = ''; return; }
    state.cart.forEach((item) => {
      const row = document.createElement('article'); row.className = 'cart-item';
      const flavors = item.flavors?.length ? `Sabores: ${item.flavors.map((flavor) => flavor.name || flavor).join(', ')}` : '';
      const mode = item.serviceMode === 'travel' ? 'Embalar para viagem' : item.serviceMode === 'store' ? 'Consumir na loja' : '';
      const pricing = [`<span>Produto: ${money(itemBaseTotal(item))}</span>`];
      if (mode) pricing.push(`<span>${mode}: ${item.serviceMode === 'travel' ? `embalagem ${money(itemPackagingTotal(item))}` : 'sem taxa de embalagem'}</span>`);
      pricing.push(`<strong>Subtotal: ${money(itemTotal(item))}</strong>`);
      row.innerHTML = `<div class="cart-item__head"><div><p class="cart-item__name">${escape(item.name)}</p><p class="cart-item__meta">${escape([item.sku, item.size, flavors].filter(Boolean).join(' · '))}</p></div><p class="cart-item__value">${money(itemTotal(item))}</p></div><div class="cart-item__pricing">${pricing.join('')}</div>`;
      const bottom = document.createElement('div'); bottom.className = 'cart-item__bottom'; const control = document.createElement('div'); control.className = 'qty';
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${item.name}`); minus.addEventListener('click', () => updateQuantity(item.key, -1));
      const count = document.createElement('span'); count.textContent = item.quantity;
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar mais um ${item.name}`); plus.disabled = item.type === 'picole' && Number.isFinite(item.stock) && item.quantity >= item.stock; plus.addEventListener('click', () => updateQuantity(item.key, 1));
      control.append(minus, count, plus); const remove = document.createElement('button'); remove.className = 'remove'; remove.type = 'button'; remove.textContent = 'Excluir produto'; remove.addEventListener('click', () => removeItem(item.key)); bottom.append(control, remove); row.append(bottom); list.append(row);
    });
    $('#cart-breakdown').innerHTML = `<div><span>Total dos produtos</span><span>${money(totalProducts())}</span></div><div><span>Embalagens para viagem</span><span>${money(totalPackaging())}</span></div>`;
    $('#cart-total').textContent = money(total());
  }
  function validatePhone(value) { const digits = value.replace(/\D/g, ''); return digits.length >= 10 && digits.startsWith('16'); }
  function validPickupTime(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') && value >= '11:00' && value <= '20:00'; }
  function buildMessage(form) {
    const lines = ['SOLICITAÇÃO DE RETIRADA — Itapolitana Cajuru', '', 'ITENS DO PEDIDO'];
    state.cart.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}${item.size ? ` — ${item.size}` : ''}`); lines.push(`   Código: ${item.sku} · Quantidade: ${item.quantity}`);
      if (item.flavors?.length) lines.push(`   Sabores: ${item.flavors.map((flavor) => flavor.name || flavor).join(', ')}`);
      lines.push(`   Produto: ${money(itemBaseTotal(item))}`);
      if (item.serviceMode === 'travel') lines.push(`   Embalar para viagem: embalagem ${money(itemPackagingTotal(item))}`);
      if (item.serviceMode === 'store') lines.push('   Consumir na loja: sem taxa de embalagem');
      lines.push(`   Subtotal: ${money(itemTotal(item))}`);
    });
    lines.push('', `Total dos produtos: ${money(totalProducts())}`, `Total de embalagens para viagem: ${money(totalPackaging())}`, `Total informado: ${money(total())}`, '', `Nome para retirada: ${form.nome}`, `WhatsApp: ${form.telefone}`, `Horário desejado: ${form.horario}`, `Pagamento: ${form.pagamento}`, `Observações: ${form.observacoes || 'Nenhuma'}`, '', 'AVISOS IMPORTANTES', '• Este pedido é apenas uma solicitação; nenhum produto será elaborado automaticamente.', '• Sabores, itens e observações dependem de disponibilidade e serão confirmados pela sorveteria no WhatsApp.', '• Sem confirmação em até 15 minutos: falha técnica; solicitação cancelada e produto não será elaborado.', '• Após confirmação, o preparo pode levar até 1 hora.', '• Em Pix, a produção começa somente após a confirmação do pagamento.', '', 'ACEITE DO CLIENTE', 'Declaro que li, compreendi e aceito as regras acima.'); return lines.join('\n');
  }
  function submitOrder(event) { event.preventDefault(); const error = $('#form-error'); error.classList.remove('is-visible'); if (!retiradaAberta()) { window.ItapHorarioPedidos?.aviso('retirada'); return showFormError('Pedidos para retirada disponíveis das 11h00 às 20h00. Volte nesse horário para montar seu pedido.'); } const form = Object.fromEntries(new FormData(event.currentTarget).entries()); if (!state.cart.length) return showFormError('Escolha pelo menos um produto antes de enviar.'); if (!form.nome?.trim()) return showFormError('Informe o nome de quem vai retirar.'); if (!validatePhone(form.telefone || '')) return showFormError('Informe um WhatsApp com DDD 16, por exemplo: (16) 99999-9999.'); if (!validPickupTime(form.horario)) return showFormError('Escolha um horário de retirada entre 11h00 e 20h00.'); if (!form.pagamento) return showFormError('Escolha como deseja pagar.'); if (!form.aceite) return showFormError('Leia e marque o aceite das regras antes de enviar.'); const text = buildMessage(form); window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); }
  function showFormError(message) { const error = $('#form-error'); error.textContent = message; error.classList.add('is-visible'); error.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  async function init() { try { const response = await fetch('dados/produtos.json?v=20260821'); if (!response.ok) throw new Error('Não foi possível carregar o catálogo.'); state.data = await response.json(); state.catalog = buildCatalog(state.data); $('#loading').remove(); renderCatalog(); renderCartSummary(); const sku = new URLSearchParams(location.search).get('sku'); if (sku) { const product = state.catalog.find((item) => item.sku === sku); if (product) { document.getElementById(`sec-${slug(product.category)}`)?.scrollIntoView({ block: 'start' }); announce(`${product.name} está destacado na seção correspondente.`); } } } catch (error) { $('#loading').textContent = 'Não foi possível carregar os produtos agora. Volte ao cardápio e tente novamente.'; console.error(error); } }
  $('#search').addEventListener('input', (event) => { state.query = event.target.value; renderCatalog(); });
  $('#summary-bar').addEventListener('click', () => { renderCart(); openDialog('cart-dialog'); });
  $('#confirm-flavors').addEventListener('click', confirmFlavors);
  $$('input[name="item-mode"]').forEach((input) => input.addEventListener('change', (event) => { state.serviceMode = event.target.value; renderFlavorGrid(); }));
  $('#continue-shopping').addEventListener('click', () => { closeDialog('cart-dialog'); $('#catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#pickup-form').addEventListener('submit', submitOrder);
  window.addEventListener('itap:horario-pedidos-atualizado', () => { if (state.catalog.length) renderCatalog(); });
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => closeDialog(button.dataset.close)));
  init();
}());
