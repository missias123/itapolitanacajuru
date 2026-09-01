/* Design: controlador mobile-first do HTML de retirada; dados vêm exclusivamente de dados/produtos.json. */
(function () {
  'use strict';
  const WHATSAPP = '5516996062046';
  const SABORES_NOVOS = new Set(['cheesecake', 'passas ao rum', 'bem casado', 'açaí natureon']);
  const PALETA_SABORES_MASSA = {
    'abacaxi ao vinho':['#F59E0B','#FFFBEB','rgba(245,158,11,.36)'],'abacaxi suíço':['#FACC15','#FEFCE8','rgba(250,204,21,.40)'],'amarena':['#E11D48','#FFF1F2','rgba(225,29,72,.34)'],'ameixa':['#7C3AED','#F5F3FF','rgba(124,58,237,.32)'],'banana com nutella':['#D97706','#FFF7ED','rgba(217,119,6,.32)'],'bem casado':['#C08457','#FFF7ED','rgba(192,132,87,.34)'],'bis e trufa':['#7C3F2C','#FFF7ED','rgba(124,63,44,.34)'],'blue ice':['#38BDF8','#F0F9FF','rgba(56,189,248,.38)'],'cereja trufada':['#BE123C','#FFF1F2','rgba(190,18,60,.34)'],'cheesecake':['#E2A77A','#FFF7ED','rgba(226,167,122,.34)'],'chocolate':['#6B3E26','#FFF7ED','rgba(107,62,38,.36)'],'chocolate com café':['#4B2E25','#F8FAFC','rgba(75,46,37,.36)'],'coco queimado':['#A16207','#FFFBEB','rgba(161,98,7,.34)'],'creme paris':['#D4A017','#FFFBEB','rgba(212,160,23,.34)'],'croquer':['#B45309','#FFF7ED','rgba(180,83,9,.34)'],'doce de leite':['#B7794B','#FFF7ED','rgba(183,121,75,.34)'],'ferrero rocher':['#A16207','#FFFBEB','rgba(161,98,7,.36)'],'flocos':['#64748B','#F8FAFC','rgba(100,116,139,.32)'],'kinder ovo':['#2563EB','#EFF6FF','rgba(37,99,235,.34)'],'leite condensado':['#CBD5E1','#F8FAFC','rgba(148,163,184,.34)'],'leite ninho':['#60A5FA','#EFF6FF','rgba(96,165,250,.38)'],'leite ninho folheado':['#38BDF8','#F0F9FF','rgba(56,189,248,.38)'],'leite ninho com oreo':['#60A5FA','#EFF6FF','rgba(96,165,250,.38)'],'limão':['#84CC16','#F7FEE7','rgba(132,204,22,.34)'],'limão suíço':['#A3E635','#F7FEE7','rgba(163,230,53,.38)'],'menta com chocolate':['#10B981','#ECFDF5','rgba(16,185,129,.34)'],'milho verde':['#EAB308','#FEFCE8','rgba(234,179,8,.36)'],'morango trufado':['#F43F5E','#FFF1F2','rgba(244,63,94,.36)'],'mousse de maracujá':['#F59E0B','#FFFBEB','rgba(245,158,11,.36)'],'mousse de uva':['#A78BFA','#F5F3FF','rgba(167,139,250,.36)'],'nozes':['#8D6E63','#FAF7F5','rgba(141,110,99,.34)'],'nutella':['#7C2D12','#FFF7ED','rgba(124,45,18,.36)'],'ovomaltine':['#B45309','#FFF7ED','rgba(180,83,9,.36)'],'passas ao rum':['#7F1D1D','#FFF1F2','rgba(127,29,29,.36)'],'pistache':['#65A30D','#F7FEE7','rgba(101,163,13,.34)'],'prestígio':['#5B3A29','#FFF7ED','rgba(91,58,41,.36)'],'sensação':['#EC4899','#FDF2F8','rgba(236,72,153,.36)'],'açaí natureon':['#7C3AED','#F5F3FF','rgba(124,58,237,.36)'],'torta de chocolate':['#3B1F0F','#FFF7ED','rgba(59,31,15,.36)']
  };
  const STORAGE_KEY = 'itap_retirada_v1';
  // Regra exclusiva do Peça e retire: o cadastro mestre e Encomendas não são alterados.
  const RETIRADA_SKUS_OCULTOS = new Set(['SOB-009']);
  const BOLO_COPO_CREMES = ['Creme de Leite Ninho', 'Creme de Nutela'];
  const FONDUE_FRUTAS = ['Morango', 'Banana', 'Uva'];
  const FONDUE_CREMES = ['Nutella', 'Creme de Ninho'];
  const FONDUE_GULOSEIMAS = ['Marshmallow', 'Canudinho Wafer'];
  const emptyFondueChoices = () => ({ frutas: {}, cremes: {}, guloseimas: {} });
  const state = { data: null, catalog: [], cart: loadCart(), flavorProduct: null, popsicleGroup: null, selectedFlavors: [], flavorCounts: {}, flavorPreferences: [], activeFlavorPreference: 0, popsiclePreferences: [], activePopsiclePreference: 0, popsicleQuantity: 1, boxAddOnCounts: {}, acaiDoubleChoices: {}, includedCustomizationChoices: {}, serviceMode: '', containerType: '', cakeChoice: '', creamChoice: '', fondueChoices: emptyFondueChoices(), query: '', lastCatalogSku: null, lastCatalogViewport: null, lastFlavorGuideKey: '' };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
  const pad2 = (n) => String(Number(n) || 0).padStart(2, '0');
  const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const ACAI_DOUBLE_ADD_ON_PRICE = 3;
  const escape = (text) => String(text || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const fondueCount = (group) => Object.values(group || {}).reduce((sum, qty) => sum + Math.max(0, Number(qty) || 0), 0);
  const fondueSummary = (group) => Object.entries(group || {}).filter(([, qty]) => Number(qty) > 0).map(([item, qty]) => Number(qty) > 1 ? `${Number(qty)}x ${item}` : item).join(' e ');
  function normalizeCart(items) {
    return (Array.isArray(items) ? items : []).filter((item) => item && !RETIRADA_SKUS_OCULTOS.has(item.sku)).map((item) => {
      const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
      const isTravel = item.serviceMode === 'travel';
      const boxAddOns = Array.isArray(item.boxAddOns) ? item.boxAddOns.filter(Boolean).map((addOn) => ({ ...addOn, quantity: Math.max(0, Math.floor(Number(addOn.quantity) || 0)), price: Number(addOn.price) || 0 })).filter((addOn) => addOn.quantity > 0) : [];
      return { ...item, quantity, price: Number(item.price) || 0, retail: Number(item.retail) || 0, wholesale: Number(item.wholesale) || 0, boxAddOns, packagingSku: isTravel ? item.packagingSku || 'EMB-VIAGEM' : '', packagingName: isTravel ? item.packagingName || 'Embalagem para viagem' : '', packagingFee: isTravel ? (item.packagingIncluded ? 0 : Number(item.packagingFee || 1)) : 0 };
    }).filter((item) => item.quantity > 0);
  }
  function loadCart() { try { return normalizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { return []; } }
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); }
  function announce(message) { $('#live-region').textContent = message; }
  function setOrderStage(stage) { $$('[data-order-step]').forEach((item) => item.classList.toggle('is-current', Number(item.dataset.orderStep) === Number(stage))); }
  function openDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
  function closeDialog(id) { const dialog = document.getElementById(id); if (dialog?.open) dialog.close(); }
  function isShown(element) { return Boolean(element) && !element.hidden && window.getComputedStyle(element).display !== 'none'; }
  function guideTargetElement(key) {
    if (!key) return null;
    const direct = document.getElementById(key);
    if (direct) return direct;
    if (key === 'confirm-flavors') return $('#confirm-flavors');
    return null;
  }
  function firstGuideControl(root) { return root?.matches?.('button, input, textarea') ? root : root?.querySelector?.('input:not([type="hidden"]):not([disabled]), button:not([disabled]), textarea:not([disabled])') || null; }
  function syncFlavorGuide(key, autoScroll = false) {
    if (!key) return;
    const previous = state.lastFlavorGuideKey;
    state.lastFlavorGuideKey = key;
    $$('.guide-next-step', $('#flavor-dialog')).forEach((element) => element.classList.remove('guide-next-step'));
    const target = guideTargetElement(key);
    target?.classList.add('guide-next-step');
    if (!autoScroll || key === previous) return;
    const dialogBody = $('#flavor-dialog .dialog__body');
    if (!target || !dialogBody) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      firstGuideControl(target)?.focus({ preventScroll: true });
    });
  }
  function nextFlavorGuideKey(product, ready) {
    if (!product) return '';
    if (needsAvailabilityChoice(product) && !state.cakeChoice) return 'cake-choice';
    if (needsContainerChoice(product) && !state.containerType) return 'item-container';
    if (!ready) return usesFlavorDistribution(product) ? 'flavor-distribution' : 'flavor-grid';
    if (isBoloCopo(product) && !state.creamChoice && isShown($('#bolo-copo-creme'))) return 'bolo-copo-creme';
    if (isShown($('#milkshake-ovomaltine'))) return 'milkshake-ovomaltine';
    if (isShown($('#box-addons'))) return 'box-addons';
    if (isShown($('#included-customizations'))) return 'included-customizations';
    if (needsPackagingChoice(product) && !state.serviceMode && isShown($('#item-mode'))) return 'item-mode';
    return 'confirm-flavors';
  }
  function nextFlavorGuideText(key, ready, product) {
    if (!ready) return '';
    if (key === 'bolo-copo-creme') return 'Quantidade completa. Agora escolha o creme abaixo.';
    if (key === 'milkshake-ovomaltine') return 'Sabores prontos. Agora escolha se deseja adicionar Ovomaltine abaixo.';
    if (key === 'box-addons') return 'Quantidade completa. Agora escolha os complementos opcionais abaixo.';
    if (key === 'included-customizations') return 'Sabores prontos. Agora personalize o produto abaixo.';
    if (key === 'item-mode') return 'Quantidade completa. Agora escolha como deseja receber este produto.';
    if (key === 'confirm-flavors') return `Tudo certo! Revise e adicione este produto ao pedido.${needsAvailabilityChoice(product) ? ' Depois, informe data e horário no mínimo 48 horas à frente.' : ''}`;
    return '';
  }
  function captureCatalogViewport(sku = state.lastCatalogSku) {
    const target = sku ? document.querySelector(`[data-catalog-sku="${sku}"]`) : null;
    state.lastCatalogViewport = { sku: sku || '', scrollY: window.scrollY, targetOffset: target ? target.getBoundingClientRect().top : null };
  }
  function restoreCatalogViewport() {
    const snapshot = state.lastCatalogViewport; const target = snapshot?.sku ? document.querySelector(`[data-catalog-sku="${snapshot.sku}"]`) : null;
    const fallback = snapshot?.scrollY ?? window.scrollY;
    window.setTimeout(() => requestAnimationFrame(() => {
      const restoredTarget = snapshot?.sku ? document.querySelector(`[data-catalog-sku="${snapshot.sku}"]`) : null;
      const targetY = restoredTarget && Number.isFinite(snapshot?.targetOffset) ? Math.max(0, window.scrollY + restoredTarget.getBoundingClientRect().top - snapshot.targetOffset) : fallback;
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const destination = Math.min(Math.max(0, targetY), maxY);
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
      window.scrollTo({ top: destination, behavior: 'smooth' });
      restoredTarget?.querySelector('button')?.focus({ preventScroll: true });
    }), 120);
  }
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
  function isLargeIceCreamBox(product) { return product?.category === 'Caixas para encomenda'; }
  function fixedFlavorLimit(product) { if (isLargeIceCreamBox(product)) return Number(`${product.name} ${product.size}`.match(/(\d+)\s*sabores?/i)?.[1] || 0) || 2; return 3; }
  function hasFixedThreeFlavorLimit(product) {
    return isIceCreamCake(product) || product.category === 'Tortas por encomenda' || isLargeIceCreamBox(product);
  }
  function usesFlavorDistribution(product) {
    return !hasFixedThreeFlavorLimit(product) && !isBoloCopo(product) && product.category !== 'Milkshake' && productBallCount(product) > 0;
  }
  function needsMassFlavors(product) {
    if (product.fixedAcai) return false;
    if (isIceCreamCake(product)) return true;
    if (fixedScoopCount(product) > 0) return true;
    if (product.category === 'Sorvetes de massa' || product.category === 'Caixas para encomenda' || product.category === 'Tortas por encomenda') return true;
    if (product.category === 'Isopores para viagem') return true;
    return /\b\d+\s*bola/i.test(`${product.name} ${product.size}`) && product.category === 'Sobremesas';
  }
  function isTravelOnlyBox(product) { return product?.category === 'Isopores para viagem' || isLargeIceCreamBox(product); }
  function allowsBoxAddOns(product) { return product?.category === 'Isopores para viagem'; }
  function milkshakeOvomaltineOption() { return { id: 'milkshake_ovomaltine', sku: 'ADIC-MLK-OVO', name: 'Ovomaltine', price: Number(state.data?.milkshake?.adicional_ovomaltine || 3) }; }
  function selectedMilkshakeAddOn(product) { return isTraditionalMilkshake(product) && state.boxAddOnCounts?.milkshake_ovomaltine ? [{ ...milkshakeOvomaltineOption(), quantity: 1 }] : []; }
  function needsPackagingChoice(product) {
    return !isTravelOnlyBox(product) && !product.fixedAcai && product.type !== 'picole' && (needsMassFlavors(product) || product.category === 'Milkshake');
  }
  function needsContainerChoice(product) { return false; }
  function isIceCreamCake(product) { return normalize(product?.name).includes('torta de sorvete'); }
  function needsAvailabilityChoice(product) { return isIceCreamCake(product) || isLargeIceCreamBox(product); }
  function consultationText(product) { return `Olá! Gostaria de consultar disponibilidade pronta para retirada.\n\nProduto: ${product.name}${product.size ? ` — ${product.size}` : ''}\nCódigo: ${product.sku}\n\nPor favor, confirmem disponibilidade, sabores e horário possível para retirar.`; }
  function consultAvailability(product) { if (!product) return; closeDialog('flavor-dialog'); state.flavorProduct = null; state.selectedFlavors = []; state.flavorCounts = {}; state.flavorPreferences = []; state.activeFlavorPreference = 0; window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(consultationText(product))}`, '_blank', 'noopener'); }
  function displayName(name) { return String(name || ''); }
  function flavorRule(product) {
    if (product.category === 'Milkshake') return { source: 'milkshake', min: 1, max: 2, label: 'Escolha 1 sabor ou até 2 sabores para o milkshake' };
    if (isBoloCopo(product)) return { source: 'massa', min: 1, max: 2, label: '2 BOLAS · Escolha até 2 sabores de sorvete' };
    if (hasFixedThreeFlavorLimit(product)) { const limit = fixedFlavorLimit(product); return { source: 'massa', min: limit, max: limit, label: `Escolha ${limit} sabores de sorvete` }; }
    const required = productBallCount(product) || 1;
    if (usesFlavorDistribution(product)) return { source: 'massa', min: required, max: required, ballCount: required, distribution: true, label: `Distribua ${required} bola${required > 1 ? 's' : ''} entre os sabores que quiser` };
    return { source: 'massa', min: required, max: required, label: `Escolha ${required} sabor${required > 1 ? 'es' : ''} de sorvete (${required} bola${required > 1 ? 's' : ''})` };
  }
  function needsFlavorPreferences() { return false; }
  function preferenceCountForPopsicle() { return 1; }
  function preferenceReady(set, rule) { return Array.isArray(set) && set.length >= rule.min && set.length <= rule.max; }
  function preferenceText(preferences = []) { return preferences.map((set, index) => { const flavors = (set || []).map((item) => item.name || item); return flavors.length ? `Opção ${pad2(index + 1)}:\n${flavors.map((f) => `  • ${f}`).join('\n')}` : null; }).filter(Boolean).join('\n'); }
  function productType(category) { return category === 'Picolés' ? 'picole' : 'produto'; }
  function retiradaAberta() { return !window.ItapHorarioPedidos || window.ItapHorarioPedidos.estaAberto('retirada'); }
  function dependsOnAcaiBase(data, key, item) {
    const helper = window.ITAP_CATALOGO_MESTRE?.dependeBaseAcai;
    if (typeof helper === 'function') return helper(data, key || item);
    return String(item?.sku || '').startsWith('ACA-');
  }
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
  function isAcaiBaseUnavailable(data = state.data) {
    const acaiMassaSku = data?.cadastro_skus?.por_chave?.['massas.MAS-039'];
    return Boolean(data?.açaí?.esgotado_base || data?.acai?.esgotado_base || acaiMassaSku?.ativo === false);
  }
  function buildCatalog(data) {
    const records = data.cadastro_skus?.por_chave || {};
    const entriesByKey = Object.entries(records);
    const entries = entriesByKey.map(([, item]) => item);
    const acaiBaseEsgotado = isAcaiBaseUnavailable(data);
    const travelPackagingEntry = entries.find((item) => item.sku === 'EMB-VIAGEM');
    const travelPackagingAvailability = data?.disponibilidade?.embalagens?.['EMB-VIAGEM'];
    const travelPackaging = { sku: 'EMB-VIAGEM', name: travelPackagingEntry?.nome || 'Embalagem para viagem', price: Number(travelPackagingEntry?.preco || 1), available: travelPackagingEntry?.ativo !== false && travelPackagingAvailability?.ativo !== false };
    const picoMeta = new Map();
    Object.entries(data.picolés || {}).forEach(([groupId, group]) => (group.sabores || []).forEach((flavor) => picoMeta.set(flavor.codigo, { groupId, groupName: group.nome, varejo: Number(group.preço_varejo), atacado: Number(group.preço_atacado), stock: Number(flavor.estoque ?? group.estoque ?? 0), unavailable: Boolean(flavor.esgotado || group.esgotado) })));
    return entriesByKey.filter(([, item]) => !RETIRADA_SKUS_OCULTOS.has(item.sku)).map(([key, item]) => {
      const meta = picoMeta.get(item.sku);
      const blockedByAcaiBase = acaiBaseEsgotado && dependsOnAcaiBase(data, key, item);
      const category = item.categoria || 'Outros produtos'; const largeBox = category === 'Caixas para encomenda'; const packagingSku = largeBox ? item.dependencias_embalagem?.[0] : ''; const packagingEntry = packagingSku ? entries.find((entry) => entry.sku === packagingSku) : null; const packagingAvailability = packagingSku ? data?.disponibilidade?.embalagens?.[packagingSku] : null;
      const largeBoxPackaging = packagingSku ? { sku: packagingSku, name: packagingEntry?.nome || packagingAvailability?.nome || packagingSku, price: 0, available: packagingEntry?.ativo !== false && packagingAvailability?.ativo !== false, included: true } : travelPackaging;
      return { id: item.sku, sku: item.sku, category, name: item.nome, size: item.tamanho || '', price: Number(item.preco || 0), active: item.ativo !== false && !blockedByAcaiBase, available: productAvailable(data, item) && !blockedByAcaiBase, type: meta ? 'picole' : productType(category), picole: meta || null, includedExtras: Array.isArray(item.acrescimos_inclusos) ? item.acrescimos_inclusos : [], fixedIngredients: Array.isArray(item.ingredientes) ? item.ingredientes : [], travelPackaging: largeBox ? largeBoxPackaging : travelPackaging, fixedAcai: normalize(category).includes('acai') || normalize(item.nome).includes('acai natureon'), selectable: category !== 'Sabores de massa' && !(category === 'Picolés' && !meta) };
    });
  }
  function preferenceKey(preferences = []) { return (preferences || []).map((set) => (set || []).map((item) => item.code || item).sort().join('+')).join('||'); }
  function cartKey(product, flavors, serviceMode = '', containerType = '', cakeChoice = '', flavorDistribution = '', boxAddOns = [], flavorPreferences = [], includedCustomizations = []) { return `${product.sku}::${(flavors || []).map((item) => `${item.code || item}:${Number(item.quantity) || 1}`).sort().join('|')}::${serviceMode}::${containerType}::${cakeChoice}::${normalize(flavorDistribution).replace(/\s+/g, ' ')}::${(boxAddOns || []).map((item) => `${item.sku || item.id}:${Number(item.quantity) || 0}`).sort().join('|')}::${preferenceKey(flavorPreferences)}::${(includedCustomizations || []).map((item) => normalize(item)).sort().join('|')}`; }
  function currentPopsicleCount() { return state.cart.filter((item) => item.type === 'picole').reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
  function popsicleUnitPrice(item, quantity) { return Number(quantity || 0) >= 100 ? Number(item.wholesale || item.retail || item.price || 0) : Number(item.retail || item.price || 0); }
  function popsicleSummary(pendingProduct = null, pendingQuantity = 0) {
    const quantity = currentPopsicleCount() + Number(pendingQuantity || 0); const wholesale = quantity >= 100;
    const value = state.cart.filter((item) => item.type === 'picole').reduce((sum, item) => sum + Number(item.quantity || 0) * popsicleUnitPrice(item, quantity), 0) + (pendingProduct ? Number(pendingQuantity || 0) * popsicleUnitPrice({ retail: pendingProduct.picole?.varejo, wholesale: pendingProduct.picole?.atacado, price: pendingProduct.price }, quantity) : 0);
    return { quantity, value, wholesale };
  }
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
  function addProduct(product, flavors = [], serviceMode = '', openReview = true, containerType = '', cakeChoice = '', flavorDistribution = '', boxAddOns = [], flavorPreferences = [], includedCustomizations = []) {
    state.lastCatalogSku = product.sku;
    const includedExtras = [...new Set([...(product.includedExtras || []), ...(includedCustomizations || [])])];
    const key = cartKey(product, flavors, serviceMode, containerType, cakeChoice, flavorDistribution, boxAddOns, flavorPreferences, includedExtras);
    const current = state.cart.find((item) => item.key === key);
    const travelPackaging = product.travelPackaging || { sku: 'EMB-VIAGEM', name: 'Embalagem para viagem', price: 1, available: true };
    const item = current || { key, sku: product.sku, name: product.name, size: product.size, category: product.category, type: product.type, price: product.price, flavors, flavorPreferences, flavorDistribution, boxAddOns, includedExtras, fixedIngredients: product.fixedIngredients || [], serviceMode, containerType, cakeChoice, packagingSku: serviceMode === 'travel' ? travelPackaging.sku : '', packagingName: serviceMode === 'travel' ? travelPackaging.name : '', packagingFee: serviceMode === 'travel' ? travelPackaging.price : 0, packagingIncluded: Boolean(serviceMode === 'travel' && travelPackaging.included), quantity: 0, retail: product.picole?.varejo, wholesale: product.picole?.atacado, stock: product.picole?.stock };
    item.quantity += 1;
    setCart(item);
    setOrderStage(2);
    if (openReview) { renderCart(); openDialog('cart-dialog'); }
    announce(`${displayName(product.name)} foi adicionado ao pedido.`); return item;
  }
  function updateQuantity(key, delta) { const current = state.cart.find((item) => item.key === key); if (!current) return; const limit = current.type === 'picole' && Number.isFinite(current.stock) ? current.stock : Infinity; current.quantity = Math.max(0, Math.min(limit, current.quantity + delta)); setCart(current); }
  function removeItem(key) { state.cart = state.cart.filter((item) => item.key !== key); refreshCartUi(); announce('Produto excluído do pedido.'); }
  function isTraditionalMilkshake(product) { return normalize(product?.category) === 'milkshake'; }
  function isAcaiMilkshake(product) { return normalize(product?.category).includes('milk-shake de acai'); }
  function allowsIncludedCustomizations(product) { const name = normalize(product?.name); return name.includes('copo recheado') || name.includes('cestinha'); }
  function isBoloCopo(product) { return product?.sku === 'SOB-004'; }
  function isFondue(product) { return product?.sku === 'SOB-002'; }
  function isAcaiGourmetCup(product) { return String(product?.sku || '').startsWith('ACA-TCG-'); }
  function isAcaiCup(product) { return /^ACA-(?:250|300|400|500|600|700)-\d+$/.test(String(product?.sku || '')) && /^Açaí\s*[—-]\s*\d+\s*ml$/i.test(String(product?.category || '').trim()); }
  function acaiDoubleOptions(product) {
    if (!isAcaiCup(product)) return [];
    return String(product.name || '').split('+').slice(1).map((name, index) => ({ id: `acai-double-${index}`, sku: '', name: name.trim(), price: ACAI_DOUBLE_ADD_ON_PRICE, kind: 'acai-double' })).filter((option) => option.name);
  }
  function selectedAcaiDoubleAddOns(product) {
    return acaiDoubleOptions(product).filter((option) => state.acaiDoubleChoices?.[option.id]).map((option) => ({ ...option, name: `${option.name} em dobro`, quantity: 1 }));
  }
  function ensureAcaiDoubleUi() {
    let section = $('#acai-double-options');
    if (!section) {
      section = document.createElement('section'); section.id = 'acai-double-options'; section.className = 'acai-double-options'; section.hidden = true; section.setAttribute('aria-labelledby', 'acai-double-options-title');
      section.innerHTML = '<p class="acai-double-options__title" id="acai-double-options-title">Complementos do copo em dobro</p><p class="acai-double-options__hint">Marque na frente de cada item se deseja recebê-lo em dobro. Cada item marcado acrescenta R$ 3,00. O preço e o SKU do copo continuam iguais.</p><div class="acai-double-options__list" id="acai-double-options-list"></div><p class="acai-double-options__total" id="acai-double-options-total" aria-live="polite"></p>'; $('#item-mode').before(section);
    }
    return { section, list: $('#acai-double-options-list'), total: $('#acai-double-options-total') };
  }
  function renderAcaiDoubleUi(product) {
    const ui = ensureAcaiDoubleUi(); const options = acaiDoubleOptions(product); ui.section.hidden = !(isAcaiCup(product) && options.length); if (!options.length) return;
    ui.list.innerHTML = '';
    options.forEach((option) => {
      const label = document.createElement('label'); label.className = 'choice acai-double-option';
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = Boolean(state.acaiDoubleChoices?.[option.id]); input.setAttribute('aria-label', `${option.name} em dobro`); input.addEventListener('change', () => { if (input.checked) state.acaiDoubleChoices[option.id] = true; else delete state.acaiDoubleChoices[option.id]; renderAcaiDoubleUi(product); });
      const name = document.createElement('span'); name.className = 'acai-double-option__name'; name.textContent = option.name;
      const price = document.createElement('small'); price.className = 'acai-double-option__price'; price.textContent = `Em dobro (+ ${money(option.price)})`;
      label.append(input, name, price); ui.list.append(label);
    });
    const selected = selectedAcaiDoubleAddOns(product); if (selected.length) { ui.total.innerHTML = `<strong>Itens em dobro:</strong><br>${selected.map((item) => `• ${escape(item.name)}`).join('<br>')}<br><strong>Acréscimo: ${money(selected.reduce((sum, item) => sum + item.price, 0))}</strong>`; } else { ui.total.textContent = 'Nenhum item em dobro selecionado. O preço base e o SKU não mudam.'; }
  }
  function beginAcaiDouble(product) {
    state.flavorProduct = product; state.selectedFlavors = []; state.flavorCounts = {}; state.flavorPreferences = []; state.activeFlavorPreference = 0; state.boxAddOnCounts = {}; state.acaiDoubleChoices = {}; state.includedCustomizationChoices = {}; state.creamChoice = ''; state.fondueChoices = emptyFondueChoices(); state.flavorDistribution = ''; state.serviceMode = ''; state.containerType = ''; state.cakeChoice = '';
    $('#flavor-title').textContent = displayName(product.name); $('#flavor-subtitle').textContent = 'Marque “Em dobro (+ R$ 3,00)” na frente de cada complemento que deseja duplicar. Cada marcação vira um item separado no pedido.';
    $('#flavor-grid').hidden = true; $('#flavor-grid').innerHTML = ''; $('#flavor-distribution').hidden = true; $('#flavor-preferences').hidden = true; $('#item-mode').hidden = true; $('#cake-choice').hidden = true; ensureBoxAddOnsUi().section.hidden = true; ensureIncludedCustomizationsUi().section.hidden = true; ensureBoloCopoCreme().section.hidden = true; ensureFondueUi().section.hidden = true; renderMilkshakeOvomaltine(product, false); renderAcaiDoubleUi(product); $('#flavor-status').textContent = 'Escolha os itens que deseja em dobro ou confirme sem adicionais.'; $('#flavor-status').classList.add('ready'); $('#confirm-flavors').disabled = false; openDialog('flavor-dialog');
  }
  function displayCategory(product) {
    if (isTraditionalMilkshake(product) || isAcaiMilkshake(product)) return 'Milk-shakes';
    if (isTravelOnlyBox(product)) return 'Caixas de sorvete';
    if (normalize(product?.category).includes('acai')) return 'Açaí Natureon';
    if (normalize(product?.category).includes('tacas')) return 'Taças';
    return product.category;
  }
  function productSearchText(product) { return normalize([product.category, displayCategory(product), product.name, product.size, product.sku, product.picole?.groupName].filter(Boolean).join(' ')); }
  function categoryRank(category) {
    const value = normalize(category);
    if (value.includes('sorvetes de massa')) return 0;
    if (value.includes('isopores para viagem') || value.includes('caixas de sorvete')) return .5;
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
    { id: 'caixas', title: 'Caixas de sorvete', hint: '4 a 12 bolas · 5 ou 10 L', matches: (category) => normalize(category).includes('caixas de sorvete') },
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
    if (value.includes('caixas de sorvete')) return { tone: 'caixas', title: 'Caixas de sorvete', point: 'Para viagem · 4 a 12 bolas, 5 L ou 10 L' };
    if (value.includes('acai')) return { tone: 'acai', title: 'Açaí Natureon', point: 'Combinações prontas e Taças Gourmet · adicione direto ao pedido' };
    if (value === 'milk-shakes') return { tone: 'milkshake', title: 'Milk-shakes', point: 'Tradicional: até 2 sabores · Açaí: receita pré-montada' };
    if (value.includes('picoles')) return { tone: 'picoles', title: 'Picolés', point: 'Escolha os sabores conforme o estoque' };
    if (value === 'tacas') return { tone: 'tacas', title: 'Taças', point: 'Ingredientes especiais · escolha sabores quando necessário' };
    if (value.includes('sobremesas')) return { tone: 'sobremesas', title: 'Sobremesas', point: 'Tortas e especiais · confira o prazo quando indicado' };
    return { tone: 'outros', title: category, point: 'Escolha o produto e avance para o pedido' };
  }
  function isPublicOrderProduct(product) {
    const category = normalize(product.category);
    const exclusiveOrderCategories = ['sabores de massa', 'tortas por encomenda', 'acrescimos'];
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
  function productSizeBadge(product) { const balls = productBallCount(product); if (balls) return { type: 'balls', label: `${balls} ${balls === 1 ? 'BOLA' : 'BOLAS'}`, detail: 'Tamanho do pedido' }; const value = String(product.size || '').trim(); if (!value) return null; return { type: 'volume', label: value.toUpperCase(), detail: 'Tamanho do produto' }; }
  function buildProductList(products) {
    const list = document.createElement('div'); list.className = 'product-list'; products.forEach((product, index) => {
      const row = document.createElement('article'); row.className = 'product'; row.dataset.catalogSku = product.sku; const hasFlavor = needsMassFlavors(product) || product.category === 'Milkshake'; const hasAcaiDouble = isAcaiCup(product) && acaiDoubleOptions(product).length > 0;
      const meta = isIceCreamCake(product) ? `Escolha 3 sabores · Retirada com antecedência mínima de 48 horas.` : isFondue(product) ? 'Escolha 2 frutas, 2 cremes e 1 guloseima · Tudo incluído no preço.' : isBoloCopo(product) ? `${flavorRule(product).label} · depois escolha o creme (Leite Ninho ou Nutela).` : hasFlavor ? flavorRule(product).label : hasAcaiDouble ? 'Escolha quais complementos do copo podem ser pedidos em dobro.' : 'Produto pronto para retirada';
      const extras = product.includedExtras?.length ? ` · Inclui ${product.includedExtras.join(' e ')}.` : '';
      const fixedIngredients = product.fixedIngredients?.length ? `<p class="product__ingredients"><strong>Ingredientes fixos:</strong><br>${product.fixedIngredients.filter((item) => !/sabores? de sorvete/i.test(item)).map((i) => `• ${escape(i)}`).join('<br>')}</p>` : '';
      const ballCount = productBallCount(product); const ballRule = usesFlavorDistribution(product) && ballCount ? `<p class="product__ball-rule"><strong>${ballCount} bola${ballCount > 1 ? 's' : ''}:</strong> ${ballCount === 1 ? 'escolha 1 sabor.' : `pode distribuir ${ballCount} bolas entre os sabores que quiser — todas do mesmo sabor ou em sabores diferentes.`}</p>` : '';
      const skuLine = isLargeIceCreamBox(product) ? `<p class="product__sku">SKU: ${escape(product.sku)} · Embalagem ${escape(product.travelPackaging?.sku || '')} incluída</p>` : '';
      const sizeBadge = productSizeBadge(product); const badge = sizeBadge ? `<p class="product__size-badge product__size-badge--${sizeBadge.type}"><span>${escape(sizeBadge.detail)}</span><strong>${escape(sizeBadge.label)}</strong></p>` : '';
      row.innerHTML = `<div>${badge}<p class="product__name"><span class="product__number">${String(index + 1).padStart(2, '0')}</span>${escape(displayName(product.name))}${!product.available ? ' <span class="stock-tag">Esgotado</span>' : ''}</p><p class="product__meta">${escape(meta)}${escape(extras)}</p>${skuLine}${fixedIngredients}${ballRule}<p class="product__price">${money(product.price)}</p></div>`;
      const button = document.createElement('button'); button.className = 'add-btn'; button.type = 'button';       const label = isFondue(product) ? 'Montar Fondue' : isBoloCopo(product) ? 'Escolher sabores e creme' : hasFlavor ? 'Escolher sabores' : hasAcaiDouble ? 'Escolher complementos' : 'Adicionar ao pedido'; applyOrderButtonState(button, label, Boolean(product.selectable && product.available));
      button.addEventListener('click', () => runWhenRetiradaOpen(() => { state.lastCatalogSku = product.sku; captureCatalogViewport(product.sku); if (isFondue(product)) beginFondue(product); else if (hasFlavor) beginFlavors(product); else if (hasAcaiDouble) beginAcaiDouble(product); else addProduct(product); })); row.append(button); list.append(row);
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
    if (section.dataset.sectionTone === 'caixas') {
      const travelBoxes = products.filter((product) => product.category === 'Isopores para viagem'); const largeBoxes = products.filter(isLargeIceCreamBox);
      if (travelBoxes.length) section.append(milkshakeSubgroup('Caixas para viagem', '4 a 12 bolas · distribua os sabores como preferir.', 'traditional'), buildProductList(travelBoxes));
      if (largeBoxes.length) section.append(milkshakeSubgroup('Caixas grandes — 5 e 10 litros', 'Consulte disponibilidade pronta ou encomende com 48 horas de antecedência.', 'acai'), buildProductList(largeBoxes));
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
    const groupOrder = ['frutas_agua', 'leite_sem_recheio', 'leite_com_recheio', 'especiais', 'esquimós', 'esquimos'];
    list.className = 'product-list';
    products.filter((product) => product.picole).forEach((product) => {
      const id = product.picole.groupId;
      if (!byGroup.has(id)) byGroup.set(id, []);
      byGroup.get(id).push(product);
    });
    [...byGroup.entries()].sort(([left], [right]) => {
      const leftIndex = groupOrder.indexOf(left); const rightIndex = groupOrder.indexOf(right);
      return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
    }).forEach(([, groupProducts]) => {
      const group = groupProducts[0].picole;
      const availableFlavors = groupProducts.filter((product) => !product.picole.unavailable && product.picole.stock > 0).length;
      const availabilityText = availableFlavors === 1 ? '1 sabor disponível.' : `${availableFlavors} sabores disponíveis.`;
      const row = document.createElement('article');
      row.className = 'product'; row.dataset.catalogSku = groupProducts[0].sku;
      row.innerHTML = `<div><p class="product__name">${escape(group.groupName)}${availableFlavors ? '' : ' <span class="stock-tag">Esgotado</span>'}</p><p class="product__meta">${availabilityText} Escolha os sabores dentro do botão.</p><p class="product__price">Varejo ${money(group.varejo)} · Atacado ${money(group.atacado)} a partir de 100 unidades</p></div>`;
      const button = document.createElement('button');
      button.className = 'add-btn'; button.type = 'button';
      applyOrderButtonState(button, 'Escolher sabores', Boolean(availableFlavors));
      button.addEventListener('click', () => runWhenRetiradaOpen(() => { state.lastCatalogSku = groupProducts[0].sku; captureCatalogViewport(groupProducts[0].sku); beginPopsicleGroup(groupProducts); }));
      row.append(button); list.append(row);
    });
    section.append(list);
  }
  function beginPopsicleGroup(products) {
    state.popsicleGroup = products.filter((product) => product.available && !product.picole?.unavailable && product.picole?.stock > 0);
    const group = state.popsicleGroup[0]?.picole; const preferenceCount = preferenceCountForPopsicle(state.popsicleGroup);
    state.popsiclePreferences = Array.from({ length: preferenceCount }, () => []); state.activePopsiclePreference = 0; state.popsicleQuantity = 1;
    $('#popsicle-title').textContent = group ? group.groupName : 'Escolha os sabores do picolé';
    $('#popsicle-subtitle').textContent = preferenceCount === 1 ? 'Escolha o sabor do picolé.' : 'Escolha o sabor principal e duas alternativas diferentes. O preço não muda.';
    renderPopsicleDialog(); openDialog('popsicle-dialog');
  }
  function renderPopsicleDialog() {
    const root = $('#popsicle-list'); const products = state.popsicleGroup || []; const preferenceCount = preferenceCountForPopsicle(products); const preferences = state.popsiclePreferences; const tabsBox = $('#popsicle-preferences'); const tabs = $('#popsicle-preferences-tabs'); const quantityBox = $('#popsicle-quantity'); const active = preferences[state.activePopsiclePreference] || []; const usedElsewhere = new Set(preferences.filter((_, index) => index !== state.activePopsiclePreference).flat().map((item) => item.code));
    root.innerHTML = ''; tabs.innerHTML = ''; tabsBox.hidden = preferenceCount === 1;
    if (preferenceCount > 1) preferences.forEach((set, index) => { const tab = document.createElement('button'); tab.type = 'button'; tab.className = `flavor-preference-tab${index === state.activePopsiclePreference ? ' is-active' : ''}${set.length ? ' is-complete' : ''}`; tab.textContent = `Opção ${index + 1}`; tab.setAttribute('aria-selected', String(index === state.activePopsiclePreference)); tab.addEventListener('click', () => { state.activePopsiclePreference = index; renderPopsicleDialog(); }); tabs.append(tab); });
    products.forEach((product) => { const selected = active.some((item) => item.code === product.sku); const unavailable = product.picole.unavailable || product.picole.stock <= 0 || !product.available; const button = document.createElement('button'); button.className = `flavor-chip sabor-item${unavailable ? ' is-esgotado' : ''}`; button.type = 'button'; button.textContent = product.name; button.disabled = unavailable || (!selected && (active.length >= 1 || usedElsewhere.has(product.sku))); button.setAttribute('aria-pressed', String(selected)); button.addEventListener('click', () => { const found = active.findIndex((item) => item.code === product.sku); if (found >= 0) active.splice(found, 1); else if (!usedElsewhere.has(product.sku) && active.length < 1) active.push({ code: product.sku, name: product.name }); state.popsiclePreferences[state.activePopsiclePreference] = active; renderPopsicleDialog(); }); root.append(button); });
    const complete = preferences.every((set) => set.length === 1); const primary = preferences[0]?.[0]; const primaryProduct = products.find((product) => product.sku === primary?.code); const maxQuantity = primaryProduct?.picole?.stock || 0; quantityBox.hidden = !complete; quantityBox.innerHTML = '';
    if (complete) { const label = document.createElement('span'); label.textContent = 'Quantidade desejada'; const control = document.createElement('div'); control.className = 'qty'; const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.disabled = state.popsicleQuantity <= 1; minus.addEventListener('click', () => { state.popsicleQuantity = Math.max(1, state.popsicleQuantity - 1); renderPopsicleDialog(); }); const count = document.createElement('span'); count.textContent = state.popsicleQuantity; const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.disabled = state.popsicleQuantity >= maxQuantity; plus.addEventListener('click', () => { state.popsicleQuantity = Math.min(maxQuantity, state.popsicleQuantity + 1); renderPopsicleDialog(); }); control.append(minus, count, plus); const summary = popsicleSummary(primaryProduct, state.popsicleQuantity); const total = document.createElement('strong'); total.className = 'popsicle-quantity__total'; total.textContent = `Total de picolés: ${summary.quantity} · ${money(summary.value)}${summary.wholesale ? ' · preço de atacado aplicado' : ' · atacado a partir de 100'}`; quantityBox.append(label, control, total); }
    $('#popsicle-status').textContent = complete ? (preferenceCount === 1 ? 'Sabor escolhido. Informe a quantidade para adicionar.' : 'Preferências completas. As Opções 2 e 3 só serão usadas se a primeira não estiver disponível.') : `Escolha ${preferenceCount === 1 ? 'o sabor' : `a Opção ${state.activePopsiclePreference + 1}`}. ${preferences.filter((set) => set.length).length} de ${preferenceCount} opção${preferenceCount > 1 ? 'ões' : ''} preenchida${preferenceCount > 1 ? 's' : ''}.`;
    $('#confirm-popsicle-preferences').disabled = !complete || !primaryProduct || !state.popsicleQuantity;
  }
  function confirmPopsiclePreferences() { const products = state.popsicleGroup || []; const primary = state.popsiclePreferences?.[0]?.[0]; const product = products.find((entry) => entry.sku === primary?.code); if (!product || !state.popsiclePreferences.every((set) => set.length === 1)) return; const item = addProduct(product, [], '', false, '', '', '', [], []); if (state.popsicleQuantity > 1) updateQuantity(item.key, state.popsicleQuantity - 1); closeDialog('popsicle-dialog'); state.popsicleGroup = null; state.popsiclePreferences = []; state.activePopsiclePreference = 0; state.popsicleQuantity = 1; renderCart(); openDialog('cart-dialog'); }
  function flavorDistributionTotal(value) { return (String(value || '').match(/\d+/g) || []).reduce((sum, number) => sum + Number(number), 0); }
  function massFlavorOptions() {
    const acaiBaseUnavailable = isAcaiBaseUnavailable();
    return (state.data.sabores_sorvete || []).map((item) => {
      const isAcaiBaseFlavor = String(item.codigo || '').toUpperCase() === 'MAS-039';
      return { code: item.codigo, name: item.nome, unavailable: Boolean(item.esgotado || state.data.cadastro_skus?.por_chave?.['massas.' + item.codigo]?.ativo === false || (acaiBaseUnavailable && isAcaiBaseFlavor)) };
    });
  }
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
  function ensureMilkshakeOvomaltineUi() {
    let section = $('#milkshake-ovomaltine');
    if (!section) {
      section = document.createElement('section'); section.id = 'milkshake-ovomaltine'; section.className = 'box-addons'; section.hidden = true;
      section.innerHTML = '<p class="box-addons__title">Adicional do milk-shake (opcional)</p><p class="box-addons__hint">Acrescente Ovomaltine por R$ 3,00. Não disponível nos milk-shakes de Açaí Natureon.</p><label class="choice"><input type="checkbox" id="milkshake-ovomaltine-input"> Adicionar Ovomaltine + R$ 3,00</label><p class="box-addons__total" id="milkshake-ovomaltine-total" aria-live="polite"></p>';
      $('#item-mode').before(section);
      $('#milkshake-ovomaltine-input').addEventListener('change', (event) => { if (event.target.checked) state.boxAddOnCounts.milkshake_ovomaltine = 1; else delete state.boxAddOnCounts.milkshake_ovomaltine; renderFlavorGrid(); });
    }
    return { section, input: $('#milkshake-ovomaltine-input'), total: $('#milkshake-ovomaltine-total') };
  }
  function renderMilkshakeOvomaltine(product, ready) {
    const ui = ensureMilkshakeOvomaltineUi(); const eligible = isTraditionalMilkshake(product); ui.section.hidden = !(eligible && ready); if (!eligible || !ready) return;
    const option = milkshakeOvomaltineOption(); const selected = Boolean(state.boxAddOnCounts?.milkshake_ovomaltine); ui.input.checked = selected; ui.total.textContent = selected ? `Ovomaltine selecionado: + ${money(option.price)}.` : 'Nenhum adicional selecionado.';
  }
  function includedCustomizationOptions() {
    return [
      { id: 'cobertura_morango', name: 'Cobertura de morango' },
      { id: 'cobertura_chocolate', name: 'Cobertura de chocolate' },
      { id: 'granulado_chocolate_ao_leite', name: 'Granulado de chocolate ao leite' },
      { id: 'canudinho_wafer', name: 'Canudinho wafer' }
    ];
  }
  function selectedIncludedCustomizations() { const options = new Map(includedCustomizationOptions().map((item) => [item.id, item])); return Object.keys(state.includedCustomizationChoices || {}).filter((id) => state.includedCustomizationChoices[id]).map((id) => options.get(id)?.name).filter(Boolean); }
  function ensureIncludedCustomizationsUi() {
    let section = $('#included-customizations');
    if (!section) {
      section = document.createElement('section'); section.id = 'included-customizations'; section.className = 'box-addons'; section.hidden = true;
      section.innerHTML = '<p class="box-addons__title">Personalize seu produto (opcional)</p><p class="box-addons__hint">Coberturas e complementos incluídos no preço final. Você pode escolher uma cobertura, as duas ou nenhuma.</p><div class="box-addons__list" id="included-customizations-list"></div><p class="box-addons__total" id="included-customizations-total" aria-live="polite"></p>';
      $('#item-mode').before(section);
    }
    return { section, list: $('#included-customizations-list'), total: $('#included-customizations-total') };
  }
  function renderIncludedCustomizations(product, ready) {
    const ui = ensureIncludedCustomizationsUi(); const eligible = allowsIncludedCustomizations(product); ui.section.hidden = !(eligible && ready); if (!eligible || !ready) return;
    ui.list.innerHTML = '';
    includedCustomizationOptions().forEach((option) => {
      const label = document.createElement('label'); label.className = 'choice'; const input = document.createElement('input'); input.type = 'checkbox'; input.checked = Boolean(state.includedCustomizationChoices?.[option.id]); input.addEventListener('change', () => { if (input.checked) state.includedCustomizationChoices[option.id] = true; else delete state.includedCustomizationChoices[option.id]; renderIncludedCustomizations(product, ready); }); const text = document.createElement('span'); text.textContent = option.name; label.append(input, text); ui.list.append(label);
    });
    const selected = selectedIncludedCustomizations(); if (selected.length) { ui.total.innerHTML = `<strong>Incluídos no valor:</strong><br>${selected.map((s) => `• ${escape(s)}`).join('<br>')}`; } else { ui.total.textContent = 'Nenhuma cobertura ou complemento selecionado. O valor do produto não muda.'; }
  }
  function ensureBoloCopoCreme() {
    let section = $('#bolo-copo-creme');
    if (!section) {
      section = document.createElement('section'); section.id = 'bolo-copo-creme'; section.className = 'box-addons'; section.hidden = true; section.setAttribute('aria-labelledby', 'bolo-copo-creme-title');
      section.innerHTML = '<p class="box-addons__title" id="bolo-copo-creme-title">Escolha o creme (incluído no preço)</p><p class="box-addons__hint">Bolo de chocolate com creme — escolha um dos cremes abaixo. A escolha não altera o preço.</p><div class="box-addons__list" id="bolo-copo-creme-list"></div><p class="box-addons__total" id="bolo-copo-creme-total" aria-live="polite"></p>';
      $('#item-mode').before(section);
    }
    return { section, list: $('#bolo-copo-creme-list'), total: $('#bolo-copo-creme-total') };
  }
  function renderBoloCopoCreme(product, flavorsReady) {
    const ui = ensureBoloCopoCreme(); const eligible = isBoloCopo(product); ui.section.hidden = !(eligible && flavorsReady);
    if (!eligible || !flavorsReady) return;
    ui.list.innerHTML = '';
    BOLO_COPO_CREMES.forEach((creme) => {
      const label = document.createElement('label'); label.className = 'choice';
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'bolo-copo-creme'; input.value = creme; input.checked = state.creamChoice === creme;
      input.addEventListener('change', () => { state.creamChoice = creme; renderFlavorGrid(); });
      const text = document.createElement('span'); text.textContent = creme; label.append(input, text); ui.list.append(label);
    });
    ui.total.textContent = state.creamChoice ? `Creme escolhido: ${state.creamChoice} · Incluído no preço base.` : 'Escolha um creme para continuar.';
  }
  function ensureFondueUi() {
    let section = $('#fondue-choices');
    if (!section) {
      section = document.createElement('section'); section.id = 'fondue-choices'; section.className = 'box-addons'; section.hidden = true; section.setAttribute('aria-labelledby', 'fondue-choices-title');
      section.innerHTML = '<p class="box-addons__title" id="fondue-choices-title">Monte seu Fondue (incluído no preço)</p><p class="box-addons__hint">Escolha 2 frutas, 2 cremes e 1 guloseima. Tudo incluído no preço de R$ 25,00.</p><div id="fondue-choices-body"></div><p class="box-addons__total" id="fondue-choices-total" aria-live="polite"></p>';
      $('#item-mode').before(section);
    }
    return { section, body: $('#fondue-choices-body'), total: $('#fondue-choices-total') };
  }
  function renderFondueUi() {
    const ui = ensureFondueUi(); ui.section.hidden = false;
    const body = ui.body; body.innerHTML = '';
    const makeGroup = (title, items, selected, max, key) => {
      const wrap = document.createElement('div'); wrap.className = 'box-addons'; wrap.style.marginBottom = '12px';
      const heading = document.createElement('p'); heading.className = 'box-addons__title'; heading.textContent = `${title} (escolha ${max})`;
      const list = document.createElement('div'); list.className = 'box-addons__list';
      const currentTotal = fondueCount(selected);
      items.forEach((item) => {
        const quantity = Math.max(0, Number(selected[item] || 0));
        const row = document.createElement('div'); row.className = 'box-addon-row';
        const info = document.createElement('div');
        const name = document.createElement('p'); name.className = 'box-addon-row__name'; name.textContent = item;
        const meta = document.createElement('p'); meta.className = 'box-addon-row__meta'; meta.textContent = quantity > 0 ? `${quantity} porção(ões)` : 'Ainda não selecionado';
        info.append(name, meta);
        const control = document.createElement('div'); control.className = 'qty';
        const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${item}`); minus.disabled = quantity <= 0;
        minus.addEventListener('click', () => {
          const next = Math.max(0, quantity - 1);
          if (next > 0) state.fondueChoices[key][item] = next; else delete state.fondueChoices[key][item];
          renderFondueUi();
        });
        const count = document.createElement('span'); count.textContent = String(quantity); count.setAttribute('aria-label', `${quantity} porção(ões) de ${item}`);
        const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar ${item}`); plus.disabled = currentTotal >= max;
        plus.addEventListener('click', () => {
          if (fondueCount(state.fondueChoices[key]) >= max) return;
          state.fondueChoices[key][item] = quantity + 1;
          renderFondueUi();
        });
        control.append(minus, count, plus);
        row.append(info, control);
        list.append(row);
      });
      const count = document.createElement('small'); count.style.display = 'block'; count.style.marginTop = '4px'; count.textContent = `${currentTotal} de ${max} porções escolhidas`;
      wrap.append(heading, list, count); return wrap;
    };
    body.append(makeGroup('Frutas', FONDUE_FRUTAS, state.fondueChoices.frutas, 2, 'frutas'));
    body.append(makeGroup('Cremes', FONDUE_CREMES, state.fondueChoices.cremes, 2, 'cremes'));
    body.append(makeGroup('Guloseima', FONDUE_GULOSEIMAS, state.fondueChoices.guloseimas, 1, 'guloseimas'));
    const frutasCount = fondueCount(state.fondueChoices.frutas);
    const cremesCount = fondueCount(state.fondueChoices.cremes);
    const guloseimasCount = fondueCount(state.fondueChoices.guloseimas);
    const ready = frutasCount === 2 && cremesCount === 2 && guloseimasCount === 1;
    if (ready) { ui.total.innerHTML = `✅ <strong>Pronto!</strong><br>• 🍓 Frutas: ${escape(fondueSummary(state.fondueChoices.frutas))}<br>• 🍫 Cremes: ${escape(fondueSummary(state.fondueChoices.cremes))}<br>• 🍬 Guloseima: ${escape(fondueSummary(state.fondueChoices.guloseimas))}<br><strong>Tudo incluído no R$ 25,00.</strong>`; } else { ui.total.textContent = 'Escolha 2 frutas, 2 cremes e 1 guloseima para confirmar.'; }
    const status = $('#flavor-status'); status.textContent = ready ? 'Tudo certo! Confirme para adicionar o Fondue ao pedido.' : `Faltam: ${frutasCount < 2 ? `${2 - frutasCount} fruta(s)` : ''}${cremesCount < 2 ? `${frutasCount < 2 ? ', ' : ''}${2 - cremesCount} creme(s)` : ''}${guloseimasCount < 1 ? `${(frutasCount < 2 || cremesCount < 2) ? ', ' : ''}1 guloseima` : ''}.`;
    status.classList.toggle('ready', Boolean(ready));
    $('#confirm-flavors').disabled = !ready;
  }
  function beginFondue(product) {
    state.flavorProduct = product; state.selectedFlavors = []; state.flavorCounts = {}; state.flavorPreferences = []; state.activeFlavorPreference = 0; state.boxAddOnCounts = {}; state.acaiDoubleChoices = {}; state.includedCustomizationChoices = {}; state.creamChoice = ''; state.fondueChoices = emptyFondueChoices(); state.flavorDistribution = ''; state.serviceMode = ''; state.containerType = ''; state.cakeChoice = '';
    $('#flavor-title').textContent = 'Fondue de Sorvete'; $('#flavor-subtitle').textContent = 'Escolha 2 frutas, 2 cremes e 1 guloseima para confirmar.';
    $('#flavor-grid').hidden = true; $('#flavor-grid').innerHTML = ''; $('#flavor-distribution').hidden = true; $('#flavor-preferences').hidden = true; $('#item-mode').hidden = true; $('#cake-choice').hidden = true;
    ensureBoxAddOnsUi().section.hidden = true; ensureIncludedCustomizationsUi().section.hidden = true; ensureBoloCopoCreme().section.hidden = true;
    renderMilkshakeOvomaltine(product, false); renderAcaiDoubleUi(product); renderFondueUi(); openDialog('flavor-dialog');
  }
  function confirmFondue() {
    if (!state.flavorProduct || !isFondue(state.flavorProduct)) return;
    const { frutas, cremes, guloseimas } = state.fondueChoices;
    if (fondueCount(frutas) !== 2 || fondueCount(cremes) !== 2 || fondueCount(guloseimas) !== 1) return;
    const includedCustomizations = [`Frutas: ${fondueSummary(frutas)}`, `Cremes: ${fondueSummary(cremes)}`, `Guloseimas: ${fondueSummary(guloseimas)}`];
    addProduct(state.flavorProduct, [], '', true, '', '', '', [], [], includedCustomizations);
    closeDialog('flavor-dialog'); state.flavorProduct = null; state.fondueChoices = emptyFondueChoices(); ensureFondueUi().section.hidden = true;
  }
  function renderBoxAddOns() {
    const ui = ensureBoxAddOnsUi(); ui.list.innerHTML = '';
    boxAddOnOptions().forEach((addOn) => {
      const quantity = Number(state.boxAddOnCounts?.[addOn.id] || 0); const unavailable = addOn.unavailable || addOn.stock <= 0;
      const row = document.createElement('div'); row.className = `box-addon-row${unavailable ? ' is-unavailable' : ''}`;
      const info = document.createElement('div'); const name = document.createElement('p'); name.className = 'box-addon-row__name'; name.textContent = addOn.name; const meta = document.createElement('p'); meta.className = 'box-addon-row__meta'; meta.textContent = unavailable ? 'Indisponível agora.' : `${money(addOn.price)} cada · SKU ${addOn.sku}`; info.append(name, meta);
      const control = document.createElement('div'); control.className = 'qty'; const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${addOn.name}`); minus.disabled = !quantity || unavailable; minus.addEventListener('click', () => { if (quantity <= 1) delete state.boxAddOnCounts[addOn.id]; else state.boxAddOnCounts[addOn.id] = quantity - 1; renderFlavorGrid(); }); const count = document.createElement('span'); count.textContent = pad2(quantity); count.setAttribute('aria-label', `${pad2(quantity)} unidade${quantity !== 1 ? 's' : ''} de ${addOn.name}`); const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar ${addOn.name}`); plus.disabled = unavailable || quantity >= addOn.stock; plus.addEventListener('click', () => { state.boxAddOnCounts[addOn.id] = quantity + 1; renderFlavorGrid(); }); control.append(minus, count, plus); row.append(info, control); ui.list.append(row);
    });
    const selected = selectedBoxAddOns(); const subtotal = selected.reduce((sum, addOn) => sum + addOn.quantity * addOn.price, 0); if (selected.length) { ui.total.innerHTML = `<strong>Complementos selecionados:</strong><br>${selected.map((addOn) => `• ${pad2(addOn.quantity)}x ${escape(addOn.name)} — ${money(Number(addOn.quantity) * Number(addOn.price))}`).join('<br>')}<br><strong>Total parcial: ${money(subtotal)}</strong>`; } else { ui.total.textContent = 'Nenhum complemento selecionado. Você pode adicionar depois em um novo pedido.'; }
  }
  function beginFlavors(product) { state.flavorProduct = product; ensureAcaiDoubleUi().section.hidden = true; state.selectedFlavors = []; state.flavorCounts = {}; state.flavorPreferences = needsFlavorPreferences(product) ? [[], [], []] : []; state.activeFlavorPreference = 0; state.boxAddOnCounts = {}; state.includedCustomizationChoices = {}; state.creamChoice = ''; state.fondueChoices = emptyFondueChoices(); state.flavorDistribution = ''; state.serviceMode = isTravelOnlyBox(product) ? 'travel' : ''; state.containerType = ''; state.cakeChoice = ''; state.lastFlavorGuideKey = needsAvailabilityChoice(product) ? 'cake-choice' : needsContainerChoice(product) ? 'item-container' : usesFlavorDistribution(product) ? 'flavor-distribution' : 'flavor-grid'; ensureBoloCopoCreme().section.hidden = true; ensureFondueUi().section.hidden = true; const rule = flavorRule(product); const sizeBadge = productSizeBadge(product); const travelText = isLargeIceCreamBox(product) ? `Primeiro consulte disponibilidade pronta ou escolha encomendar com 48 horas. Depois, selecione ${rule.label.toLowerCase()}.` : 'Caixa exclusiva para viagem: distribua os sabores e, se quiser, adicione complementos.'; $('#flavor-title').textContent = displayName(product.name); $('#flavor-subtitle').textContent = `${sizeBadge ? `${sizeBadge.label} · ` : ''}${isTravelOnlyBox(product) ? travelText : isIceCreamCake(product) ? 'Primeiro consulte disponibilidade pronta ou escolha encomendar com 48 horas.' : needsFlavorPreferences(product) ? `${rule.label}. Depois informe duas alternativas diferentes.` : needsContainerChoice(product) ? 'Escolha primeiro o recipiente e depois os sabores.' : isBoloCopo(product) ? `${rule.label}. Depois escolha o creme — incluído no preço.` : rule.label + '.'}`; renderFlavorGrid(); openDialog('flavor-dialog'); }
  function renderFlavorGrid() {
    const product = state.flavorProduct; if (!product) return;
    const rule = flavorRule(product); const grid = $('#flavor-grid'); const status = $('#flavor-status'); const preferencesBox = $('#flavor-preferences'); const preferenceTabs = $('#flavor-preferences-tabs'); const distributionBox = $('#flavor-distribution'); const distributionList = $('#flavor-distribution-list'); const distributionHint = $('#flavor-distribution-hint'); const distributionCounter = $('#flavor-distribution-counter');     const addOnsUi = ensureBoxAddOnsUi(); const customizationsUi = ensureIncludedCustomizationsUi(); ensureFondueUi().section.hidden = true; renderMilkshakeOvomaltine(product, false); const travelBox = isTravelOnlyBox(product); const needsContainer = needsContainerChoice(product); const needsChoice = needsAvailabilityChoice(product); const cakeBox = $('#cake-choice'); cakeBox.hidden = !needsChoice; $('#cake-choice-title').textContent = isLargeIceCreamBox(product) ? 'Disponibilidade da caixa grande' : 'Disponibilidade da torta'; $('#cake-choice-hint').textContent = isLargeIceCreamBox(product) ? 'Consulte a disponibilidade pronta pelo WhatsApp ou encomende a caixa com 48 horas de antecedência.' : 'Consulte a disponibilidade pronta pelo WhatsApp ou encomende a torta com 48 horas de antecedência.'; $$('[data-cake-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.cakeChoice === state.cakeChoice)); $$('input[name="cake-choice"]').forEach((input) => { input.checked = input.value === state.cakeChoice; }); const containerBox = $('#item-container'); containerBox.hidden = !needsContainer; $$('[data-container-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.containerChoice === state.containerType)); $$('input[name="item-container"]').forEach((input) => { input.checked = input.value === state.containerType; }); if (needsChoice && !state.cakeChoice) { preferencesBox.hidden = true; grid.hidden = true; grid.innerHTML = ''; distributionBox.hidden = true; addOnsUi.section.hidden = true; customizationsUi.section.hidden = true; $('#item-mode').hidden = true; status.textContent = 'Escolha: consultar disponibilidade no WhatsApp ou encomendar com 48 horas de antecedência.'; status.classList.remove('ready'); $('#confirm-flavors').disabled = true; return; } if (needsContainer && !state.containerType) { preferencesBox.hidden = true; grid.hidden = true; grid.innerHTML = ''; distributionBox.hidden = true; addOnsUi.section.hidden = true; customizationsUi.section.hidden = true; $('#item-mode').hidden = true; status.textContent = 'Escolha o formato oficial do produto.'; status.classList.remove('ready'); $('#confirm-flavors').disabled = true; return; }
    if (needsFlavorPreferences(product)) {
      preferencesBox.hidden = false; preferenceTabs.innerHTML = ''; distributionBox.hidden = true; addOnsUi.section.hidden = true; grid.hidden = false; grid.innerHTML = '';
      state.flavorPreferences = Array.isArray(state.flavorPreferences) && state.flavorPreferences.length === 3 ? state.flavorPreferences : [[], [], []];
      state.flavorPreferences.forEach((set, index) => { const tab = document.createElement('button'); tab.type = 'button'; tab.className = `flavor-preference-tab${index === state.activeFlavorPreference ? ' is-active' : ''}${preferenceReady(set, rule) ? ' is-complete' : ''}`; tab.textContent = `Opção ${index + 1}`; tab.setAttribute('aria-selected', String(index === state.activeFlavorPreference)); tab.addEventListener('click', () => { state.activeFlavorPreference = index; renderFlavorGrid(); }); preferenceTabs.append(tab); });
      const active = state.flavorPreferences[state.activeFlavorPreference] || []; const usedInOtherOptions = new Set(state.flavorPreferences.filter((_, index) => index !== state.activeFlavorPreference).flat().map((item) => item.code));
      grid.classList.toggle('limite-atingido', active.length >= rule.max);
      massFlavorOptions().forEach((flavor) => { const selected = active.some((item) => item.code === flavor.code); const normalized = normalize(flavor.name); const novo = SABORES_NOVOS.has(normalized); const colors = PALETA_SABORES_MASSA[normalized] || ['#94A3B8','#F8FAFC','rgba(148,163,184,.30)']; const button = document.createElement('button'); button.className = `flavor-chip sabor-item${novo ? ' sabor-novo' : ''}${flavor.unavailable ? ' is-esgotado' : ''}`; button.type = 'button'; button.style.cssText = `--sabor-accent:${colors[0]};--sabor-tint:${colors[1]};--sabor-glow:${colors[2]};`; button.innerHTML = `${novo ? '<span class="sabor-novo-badge" aria-label="Novo sabor">NOVO</span>' : ''}${flavor.unavailable ? '<span class="sabor-esgotado-badge">ESGOTADO</span>' : ''}<span>${escape(flavor.name)}</span>`; button.disabled = flavor.unavailable || (!selected && (active.length >= rule.max || usedInOtherOptions.has(flavor.code))); button.setAttribute('aria-pressed', String(selected)); button.addEventListener('click', () => { const next = state.flavorPreferences[state.activeFlavorPreference] || []; const found = next.findIndex((item) => item.code === flavor.code); if (found >= 0) next.splice(found, 1); else if (next.length < rule.max && !usedInOtherOptions.has(flavor.code)) next.push(flavor); state.flavorPreferences[state.activeFlavorPreference] = next; renderFlavorGrid(); }); grid.append(button); });
      const complete = state.flavorPreferences.every((set) => preferenceReady(set, rule)); const completedCount = state.flavorPreferences.filter((set) => preferenceReady(set, rule)).length; const requiresMode = needsPackagingChoice(product); const modeBox = $('#item-mode'); modeBox.hidden = !(complete && requiresMode); $$('[data-mode-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.modeChoice === state.serviceMode)); $$('input[name="item-mode"]').forEach((input) => { input.checked = input.value === state.serviceMode; }); const guideKey = complete ? nextFlavorGuideKey(product, true) : `flavor-preferences-${state.activeFlavorPreference}`; status.textContent = complete ? (guideKey === 'item-mode' ? 'Combinações completas. Agora escolha como deseja receber este produto.' : 'Combinações completas. As alternativas só serão usadas se a primeira opção não estiver disponível.') : `Preencha a Opção ${state.activeFlavorPreference + 1}: escolha ${rule.max} sabor${rule.max !== 1 ? 'es' : ''}. ${completedCount} de 3 combinações completas.`; status.classList.toggle('ready', complete && (!requiresMode || Boolean(state.serviceMode))); $('#confirm-flavors').disabled = !(complete && (!requiresMode || state.serviceMode)); syncFlavorGuide(guideKey, complete); return;
    }
    preferencesBox.hidden = true;
    if (rule.distribution) {
      grid.hidden = true; grid.innerHTML = ''; distributionBox.hidden = false; distributionList.innerHTML = '';
      distributionHint.textContent = `Use + e − ao lado de cada sabor até totalizar exatamente ${rule.ballCount} bolas. Você pode repetir o mesmo sabor ou combinar vários.`;
      const distributed = countedFlavorTotal();
      distributionList.classList.toggle('limite-atingido', distributed >= rule.ballCount);
      massFlavorOptions().forEach((flavor) => {
        const quantity = Number(state.flavorCounts?.[flavor.code] || 0); const normalized = normalize(flavor.name); const colors = PALETA_SABORES_MASSA[normalized] || ['#94A3B8','#F8FAFC','rgba(148,163,184,.30)'];
        const row = document.createElement('div'); row.className = `flavor-distribution__row${quantity > 0 ? ' is-selected' : ''}`; row.style.cssText = `--sabor-accent:${colors[0]};--sabor-tint:${colors[1]};`;
        const name = document.createElement('span'); name.className = 'flavor-distribution__name'; name.textContent = flavor.name;
        const control = document.createElement('div'); control.className = 'qty';
        const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${flavor.name}`); minus.disabled = !quantity || flavor.unavailable; minus.addEventListener('click', () => { if (quantity <= 1) delete state.flavorCounts[flavor.code]; else state.flavorCounts[flavor.code] = quantity - 1; renderFlavorGrid(); });
        const count = document.createElement('span'); count.textContent = pad2(quantity); count.setAttribute('aria-label', `${pad2(quantity)} bolas de ${flavor.name}`);
        const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar uma bola de ${flavor.name}`); plus.disabled = flavor.unavailable || distributed >= rule.ballCount; plus.addEventListener('click', () => { state.flavorCounts[flavor.code] = quantity + 1; renderFlavorGrid(); });
        control.append(minus, count, plus); row.append(name, control); distributionList.append(row);
      });
      state.selectedFlavors = selectedFlavorEntries(); state.flavorDistribution = countedFlavorText(); const ready = distributed === rule.ballCount;
      distributionCounter.textContent = ready ? `Distribuição completa: ${pad2(distributed)} de ${pad2(rule.ballCount)} bolas.` : `Distribuição informada: ${pad2(distributed)} de ${pad2(rule.ballCount)} bolas. Use os controles até fechar a quantidade.`;
      distributionCounter.classList.toggle('is-ready', ready);
      const requiresMode = needsPackagingChoice(product); const modeBox = $('#item-mode'); modeBox.hidden = !(ready && requiresMode); addOnsUi.section.hidden = !(ready && allowsBoxAddOns(product)); if (ready && allowsBoxAddOns(product)) renderBoxAddOns(); renderIncludedCustomizations(product, ready); $$('[data-mode-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.modeChoice === state.serviceMode)); $$('input[name="item-mode"]').forEach((input) => { input.checked = input.value === state.serviceMode; });
      const guideKey = nextFlavorGuideKey(product, ready);
      status.textContent = !ready ? `Escolha as quantidades por sabor até totalizar ${rule.ballCount} bolas.` : nextFlavorGuideText(guideKey, ready, product);
      status.classList.toggle('ready', ready && (!requiresMode || Boolean(state.serviceMode))); $('#confirm-flavors').disabled = !(ready && (!requiresMode || state.serviceMode)); syncFlavorGuide(guideKey, ready); return;
    }
    distributionBox.hidden = true; addOnsUi.section.hidden = true; grid.hidden = false; grid.innerHTML = '';
    const options = rule.source === 'milkshake' ? massFlavorOptions().map((flavor) => ({ ...flavor, code: `MLK-${flavor.code}` })) : massFlavorOptions();
    const count = state.selectedFlavors.length; grid.classList.toggle('limite-atingido', count >= rule.max);
    options.forEach((flavor) => {
      const selected = state.selectedFlavors.some((item) => item.code === flavor.code); const normalized = normalize(flavor.name); const novo = rule.source === 'massa' && SABORES_NOVOS.has(normalized);
      const colors = PALETA_SABORES_MASSA[normalized] || ['#94A3B8','#F8FAFC','rgba(148,163,184,.30)'];
      const button = document.createElement('button'); button.className = `flavor-chip sabor-item${novo ? ' sabor-novo' : ''}${flavor.unavailable ? ' is-esgotado' : ''}`; button.type = 'button'; button.style.cssText = `--sabor-accent:${colors[0]};--sabor-tint:${colors[1]};--sabor-glow:${colors[2]};`;
      button.innerHTML = `${novo ? '<span class="sabor-novo-badge" aria-label="Novo sabor">NOVO</span>' : ''}${flavor.unavailable ? '<span class="sabor-esgotado-badge">ESGOTADO</span>' : ''}<span>${escape(flavor.name)}</span>`;
      button.disabled = flavor.unavailable || (!selected && count >= rule.max); button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', () => { const found = state.selectedFlavors.findIndex((item) => item.code === flavor.code); if (found >= 0) state.selectedFlavors.splice(found, 1); else if (state.selectedFlavors.length < rule.max) state.selectedFlavors.push(flavor); renderFlavorGrid(); }); grid.append(button);
    });
    const ready = count >= rule.min && count <= rule.max; renderMilkshakeOvomaltine(product, ready); renderIncludedCustomizations(product, ready); renderBoloCopoCreme(product, ready); const requiresMode = needsPackagingChoice(product); const modeBox = $('#item-mode'); modeBox.hidden = !(ready && requiresMode); $$('[data-mode-choice]').forEach((choice) => choice.classList.toggle('is-selected', choice.dataset.modeChoice === state.serviceMode)); $$('input[name="item-mode"]').forEach((input) => { input.checked = input.value === state.serviceMode; }); const missing = rule.min - count; const optional = rule.max - count; const guideKey = nextFlavorGuideKey(product, ready); status.textContent = missing > 0 ? `Escolha mais ${missing} sabor${missing !== 1 ? 'es' : ''}.` : (optional > 0 ? `Você pode adicionar mais ${optional} sabor${optional !== 1 ? 'es' : ''} ou continuar com a escolha atual.${needsChoice ? ' Depois, informe data e horário no mínimo 48 horas à frente.' : ''}` : nextFlavorGuideText(guideKey, ready, product)); status.classList.toggle('ready', ready && (!requiresMode || Boolean(state.serviceMode)) && (!isBoloCopo(product) || Boolean(state.creamChoice))); $('#confirm-flavors').disabled = !(ready && (!requiresMode || state.serviceMode) && (!needsChoice || Boolean(state.cakeChoice)) && (!isBoloCopo(product) || Boolean(state.creamChoice))); syncFlavorGuide(guideKey, optional <= 0);
  }
  function confirmFlavors() { if (!state.flavorProduct) return; if (isFondue(state.flavorProduct)) { confirmFondue(); return; } if (isAcaiCup(state.flavorProduct)) { const acaiProduct = state.flavorProduct; addProduct(acaiProduct, [], '', true, '', '', '', selectedAcaiDoubleAddOns(acaiProduct), [], []); closeDialog('flavor-dialog'); state.flavorProduct = null; state.acaiDoubleChoices = {}; return; } const rule = flavorRule(state.flavorProduct); const hasPreferences = needsFlavorPreferences(state.flavorProduct); if (hasPreferences) { if (!state.flavorPreferences.every((set) => preferenceReady(set, rule))) return; state.selectedFlavors = state.flavorPreferences[0].slice(); } else if (rule.distribution) { state.selectedFlavors = selectedFlavorEntries(); state.flavorDistribution = countedFlavorText(); } const validSelection = hasPreferences || (rule.distribution ? countedFlavorTotal() === rule.ballCount : state.selectedFlavors.length >= rule.min && state.selectedFlavors.length <= rule.max); if (!validSelection) return; if (isBoloCopo(state.flavorProduct) && !state.creamChoice) return; if (needsAvailabilityChoice(state.flavorProduct) && !state.cakeChoice) return; if (needsContainerChoice(state.flavorProduct) && !state.containerType) return; if (needsPackagingChoice(state.flavorProduct) && !state.serviceMode) return; const orderAddOns = allowsBoxAddOns(state.flavorProduct) ? selectedBoxAddOns() : selectedMilkshakeAddOn(state.flavorProduct); const includedCustomizations = isBoloCopo(state.flavorProduct) ? (state.creamChoice ? [state.creamChoice] : []) : (allowsIncludedCustomizations(state.flavorProduct) ? selectedIncludedCustomizations() : []); addProduct(state.flavorProduct, state.selectedFlavors.slice(), state.serviceMode, true, state.containerType, state.cakeChoice, state.flavorDistribution, orderAddOns, hasPreferences ? state.flavorPreferences.map((set) => set.slice()) : [], includedCustomizations); closeDialog('flavor-dialog'); state.flavorProduct = null; state.selectedFlavors = []; state.flavorCounts = {}; state.flavorPreferences = []; state.activeFlavorPreference = 0; state.boxAddOnCounts = {}; state.acaiDoubleChoices = {}; state.includedCustomizationChoices = {}; state.creamChoice = ''; state.fondueChoices = emptyFondueChoices(); state.flavorDistribution = ''; state.serviceMode = ''; state.containerType = ''; state.cakeChoice = ''; }
  function renderCartSummary() { const bar = $('#summary-bar'); const count = totalItems(); bar.classList.toggle('is-visible', count > 0); $('#summary-small').textContent = count ? `${count} item${count !== 1 ? 's' : ''} selecionado${count !== 1 ? 's' : ''}` : 'Seu pedido está vazio'; $('#summary-large').textContent = count ? `Ver pedido · ${money(total())}` : `Ver pedido · ${money(0)}`; if (typeof syncGuidedForm === 'function') syncGuidedForm(); }
  function renderCart() {
    const list = $('#cart-list'); list.innerHTML = '';
    if (!state.cart.length) { list.innerHTML = '<div class="empty-state">Seu pedido ainda está vazio. Volte e escolha os produtos que deseja retirar.</div>'; $('#cart-breakdown').innerHTML = `<div><span>Total dos produtos</span><span>${money(0)}</span></div><div><span>Complementos</span><span>${money(0)}</span></div><div><span>Embalagens para viagem</span><span>${money(0)}</span></div>`; $('#cart-total').textContent = money(0); syncPickupDateConstraint(); return; }
    state.cart.forEach((item) => {
      const row = document.createElement('article'); row.className = 'cart-item';
      const fixedIngredientLines = item.fixedIngredients?.length ? ['📌 Ingredientes fixos:', ...item.fixedIngredients.filter((ingredient) => !/sabores? de sorvete/i.test(ingredient)).map((i) => `  • ${i}`)] : []; const includedExtraLines = item.includedExtras?.length ? ['✅ Inclusos:', ...item.includedExtras.map((e) => `  • ${e}`)] : []; const container = item.containerType ? `🍦 Recipiente: ${item.containerType === 'casquinha' ? 'Casquinha' : 'Copo'}` : ''; const cakeChoice = needsAvailabilityChoice(item) ? `⏰ ${isLargeIceCreamBox(item) ? 'Caixa grande' : 'Torta'}: ${item.cakeChoice === 'producao_48h' ? 'encomenda com 48 horas' : 'consultar disponibilidade no WhatsApp'}` : '';
      const flavorLines = item.flavorDistribution
        ? ['🍨 Sabores escolhidos:', ...item.flavorDistribution.split(/\s*\+\s*/).map((part) => { const m = part.trim().match(/^(\d+)\s+(.+)$/); return m ? `  ${pad2(m[1])}x ${m[2]}` : `  ${part.trim()}`; })]
        : item.flavors?.length ? ['🍨 Sabores escolhidos:', ...item.flavors.map((f) => `  01x ${f.name || f}`)] : [];
      const mode = item.serviceMode === 'travel' ? 'Embalar para viagem' : item.serviceMode === 'store' ? 'Consumir na loja' : '';
      const metaFields = [item.sku, item.size, container, ...flavorLines, ...fixedIngredientLines, ...includedExtraLines, cakeChoice].filter(Boolean);
      const addOnLines = item.boxAddOns?.length ? item.boxAddOns.map((addOn) => `<p class="cart-item__meta">➕ ${escape(`${pad2(addOn.quantity)}x ${addOn.name} — ${money(Number(addOn.quantity) * Number(addOn.price))}`)}</p>`).join('') : '';
      const pricing = [`<span>Produto: ${money(itemBaseTotal(item))}</span>`];
      if (item.boxAddOns?.length) {
        pricing.push(`<span>Complementos: ${money(itemAddOnTotal(item))}</span>`);
      }
      if (mode) pricing.push(`<span>${mode}: ${item.serviceMode === 'travel' ? (item.packagingIncluded ? `${escape(item.packagingName || 'Embalagem da caixa')} · SKU ${escape(item.packagingSku || '')} · incluída no valor` : `${escape(item.packagingName || 'Embalagem para viagem')} · SKU ${escape(item.packagingSku || 'EMB-VIAGEM')} · ${money(itemPackagingTotal(item))}`) : 'sem taxa de embalagem'}</span>`);
      row.innerHTML = `<div class="cart-item__head"><div><p class="cart-item__name">${escape(displayName(item.name))}</p>${metaFields.map((f) => { const isIndent = f.startsWith('  '); return `<p class="cart-item__meta${isIndent ? ' cart-item__meta--indent' : ''}">${escape(f.trimStart())}</p>`; }).join('')}${addOnLines}</div><p class="cart-item__value">${money(itemTotal(item))}</p></div><div class="cart-item__pricing">${pricing.join('')}</div>`;
      const bottom = document.createElement('div'); bottom.className = 'cart-item__bottom'; const control = document.createElement('div'); control.className = 'qty';
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir ${item.name}`); minus.addEventListener('click', () => updateQuantity(item.key, -1));
      const count = document.createElement('span'); count.textContent = pad2(item.quantity);
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Adicionar mais um ${item.name}`); plus.disabled = item.type === 'picole' && Number.isFinite(item.stock) && item.quantity >= item.stock; plus.addEventListener('click', () => updateQuantity(item.key, 1));
      control.append(minus, count, plus); const remove = document.createElement('button'); remove.className = 'remove'; remove.type = 'button'; remove.textContent = 'Excluir produto'; remove.addEventListener('click', () => removeItem(item.key)); bottom.append(control, remove); row.append(bottom); list.append(row);
    });
    const popsicles = popsicleSummary(); const popsicleLine = popsicles.quantity ? `<div><span>Picolés: ${popsicles.quantity}${popsicles.wholesale ? ' · atacado' : ' · varejo'}</span><span>${money(popsicles.value)}</span></div>` : ''; $('#cart-breakdown').innerHTML = `<div><span>Total dos produtos</span><span>${money(totalProducts())}</span></div>${popsicleLine}<div><span>Complementos</span><span>${money(totalAddOns())}</span></div><div><span>Embalagens para viagem</span><span>${money(totalPackaging())}</span></div>`;
    $('#cart-total').textContent = money(total()); syncPickupDateConstraint();
  }
  const formFlow = { paymentConfirmed: false, notesContinued: false, visibleStep: 1, ready: false };
  function phoneDigits(value) { return String(value || '').replace(/\D/g, ''); }
  function validatePhone(value) { return /^[0-9]{8,9}$/.test(phoneDigits(value)); }
  function formatPhone(value) { const digits = phoneDigits(value).slice(0, 9); return digits.length > 4 ? `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}` : digits; }
  function phoneForMessage(value) { const digits = phoneDigits(value); return `(16) ${digits.length > 4 ? `${digits.slice(0, digits.length - 4)}-${digits.slice(-4)}` : digits}`; }
  function pickupStepValid() { const time = $('#pickup-time')?.value || ''; if (!validPickupTime(time)) return false; if (hasCakeProductionLead()) return Boolean($('#pickup-date')?.value) && validCakeLeadTime($('#pickup-date').value, time); return validCommonLeadTime(time); }
  function scrollToFormStep(step) { const target = document.querySelector(`[data-form-step="${step}"]`) || $('#final-submit'); requestAnimationFrame(() => { target?.scrollIntoView({ behavior: 'smooth', block: 'center' }); const input = target?.querySelector('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), button:not([disabled])'); input?.focus({ preventScroll: true }); }); }
  function setFormStepState(step, enabled, complete) { const block = document.querySelector(`[data-form-step="${step}"]`); if (!block) return; block.classList.toggle('is-locked', !enabled); block.classList.toggle('is-current', enabled && !complete); block.classList.toggle('is-complete', complete); block.setAttribute('aria-disabled', enabled ? 'false' : 'true'); $$('input, textarea, button', block).forEach((control) => { if (control.type === 'hidden') return; control.disabled = !enabled; }); }
  function syncGuidedForm({ scroll = false } = {}) {
    const nameValid = Boolean($('#client-name')?.value.trim()); const phoneValid = validatePhone($('#client-phone')?.value); const identityValid = nameValid && phoneValid;
    const pickupValid = identityValid && pickupStepValid();
    if (!pickupValid) { formFlow.paymentConfirmed = false; formFlow.notesContinued = false; }
    if (!formFlow.paymentConfirmed) formFlow.notesContinued = false;
    const paymentValid = pickupValid && formFlow.paymentConfirmed;
    const notesValid = paymentValid && formFlow.notesContinued;
    const accepted = notesValid && Boolean($('#accept-rules')?.checked);
    setFormStepState(1, true, identityValid); setFormStepState(2, identityValid, pickupValid); setFormStepState(3, pickupValid, paymentValid); setFormStepState(4, paymentValid, notesValid); setFormStepState(5, notesValid, accepted);
    const visibleStep = !identityValid ? 1 : !pickupValid ? 2 : !paymentValid ? 3 : !notesValid ? 4 : !accepted ? 5 : 6;
    const progressText = !identityValid ? 'Etapa 1 de 5 · informe nome e celular.' : !pickupValid ? 'Etapa 2 de 5 · escolha um horário válido para retirar.' : !paymentValid ? 'Etapa 3 de 5 · confirme o pagamento na loja.' : !notesValid ? 'Etapa 4 de 5 · registre uma observação ou siga para a confirmação.' : !accepted ? 'Etapa 5 de 5 · leia e marque o aceite para liberar o envio.' : 'Tudo certo · sua solicitação está pronta para ser enviada.';
    $('#form-progress').lastElementChild.textContent = progressText;
    const submit = $('#final-submit'); const hint = $('#final-submit-hint'); const formReady = accepted && state.cart.length > 0;
    submit.disabled = !formReady; submit.setAttribute('aria-disabled', formReady ? 'false' : 'true'); submit.classList.toggle('is-ready', formReady); submit.textContent = formReady ? 'Enviar solicitação para confirmação no WhatsApp' : visibleStep === 5 ? 'Marque o aceite para liberar o envio' : 'Preencha as etapas para liberar o envio'; hint.textContent = formReady ? 'Pronto: revise o pedido e envie a solicitação.' : progressText; hint.classList.toggle('is-ready', formReady);
    const accept = $('#accept-wrap'); accept.classList.toggle('is-attention', notesValid && !accepted);
    const previous = formFlow.visibleStep; formFlow.visibleStep = visibleStep; formFlow.ready = formReady;
    if (scroll && visibleStep > previous) scrollToFormStep(visibleStep);
  }
  function validPickupTime(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') && value >= '11:00' && value <= '20:00'; }
  function hasIceCreamCake() { return state.cart.some((item) => isIceCreamCake(item)); }
  function hasCakeProductionLead() { return state.cart.some((item) => needsAvailabilityChoice(item) && item.cakeChoice === 'producao_48h'); }
  function brasiliaParts(date = new Date()) { const values = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])); return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}`, minutes: Number(values.hour) * 60 + Number(values.minute) }; }
  function brasiliaDateValue(date) { return brasiliaParts(date).date; }
  function commonPickupDeadline() { const deadline = new Date(Date.now() + 60 * 60 * 1000); deadline.setSeconds(0, 0); deadline.setMinutes(Math.ceil(deadline.getMinutes() / 15) * 15); return brasiliaParts(deadline); }
  function validCommonLeadTime(time) { const limit = commonPickupDeadline(); const requestedMinutes = String(time || '').split(':').map(Number); return validPickupTime(time) && (requestedMinutes[0] * 60 + requestedMinutes[1]) >= limit.minutes; }
  function pickupTimeMessage() { const time = $('#pickup-time'); if (!time || hasCakeProductionLead() || !time.value) return ''; if (!validPickupTime(time.value)) return 'Escolha um horário entre 11h00 e 20h00 (de segunda a sexta).'; if (!validCommonLeadTime(time.value)) return `Pelo horário de Brasília, escolha a partir de ${commonPickupDeadline().time}. A retirada exige no mínimo 1 hora de antecedência.`; return ''; }
  function syncPickupTimeValidation() { const field = $('#pickup-time-field'); const time = $('#pickup-time'); const error = $('#pickup-time-error'); if (!field || !time || !error) return true; const message = pickupTimeMessage(); field.classList.toggle('is-invalid', Boolean(message)); time.setAttribute('aria-invalid', message ? 'true' : 'false'); error.textContent = message; error.classList.toggle('is-visible', Boolean(message)); return !message; }
  function syncPickupDateConstraint() { const input = $('#pickup-date'); const field = $('#pickup-date-field'); const notice = $('#cake-pickup-rule'); const time = $('#pickup-time'); const timeHelp = $('#pickup-time-help'); if (!input || !field || !notice || !time || !timeHelp) return; const cakeProduction = hasCakeProductionLead(); field.hidden = !cakeProduction; notice.hidden = !cakeProduction; input.required = cakeProduction; if (cakeProduction) { input.min = brasiliaDateValue(new Date(Date.now() + 48 * 60 * 60 * 1000)); time.min = '11:00'; time.disabled = false; timeHelp.textContent = 'Encomenda de torta ou caixa grande: escolha data e horário pelo horário de Brasília; a data precisa estar pelo menos 48 horas à frente.'; } else { input.value = ''; input.min = ''; const deadline = commonPickupDeadline(); if (deadline.minutes <= 20 * 60) { time.min = deadline.time; time.disabled = false; timeHelp.textContent = `Horário de Brasília: escolha a partir de ${deadline.time}. O preparo mínimo é de 1 hora.`; } else { time.value = ''; time.min = '20:00'; time.disabled = true; timeHelp.textContent = 'Hoje não há horário com 1 hora de antecedência. Volte no próximo horário de atendimento.'; } } syncPickupTimeValidation(); }
  function validCakeLeadTime(date, time) { return !hasCakeProductionLead() || Date.parse(`${date}T${time}:00-03:00`) >= Date.now() + 48 * 60 * 60 * 1000; }
  function buildMessage(form) {
    const sep = '━━━━━━━━━━━━━━━━━━━━━';
    const schedule = hasCakeProductionLead()
      ? `Data: ${form.data_retirada}`
      : 'Data: hoje';
    const [h, m] = (form.horario || '00:00').split(':').map(Number);
    const deadlineH = h + 1;
    const deadline = `${String(deadlineH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const lines = [
      `🍦 *PEDIDO DE RETIRADA*`,
      `_Itapolitana Cajuru_`,
      sep,
      ``,
      `👤 *CLIENTE*`,
      `• Nome: ${form.nome}`,
      `• WhatsApp: ${phoneForMessage(form.telefone)}`,
      ``,
      `🕒 *RETIRADA*`,
      `• ${schedule}`,
      `• Horário combinado: ${form.horario} (Brasília)`,
      `• Retirar até: ${deadline} (Brasília)`,
      ``,
      `💳 *PAGAMENTO*`,
      `• ${form.pagamento}`,
      sep,
      ``,
      `🛒 *ITENS*`,
    ];

    state.cart.forEach((item, index) => {
      lines.push(``, `*${pad2(index + 1)}. ${pad2(item.quantity)}x ${item.name}${item.size ? ` — ${item.size}` : ''}${item.sku ? ` (${item.sku})` : ''}*`);
      if (item.containerType) lines.push(`• ${item.containerType === 'casquinha' ? '🍦 Casquinha' : '🥤 Copo'}`);
      if (item.flavorDistribution) { lines.push(`• 🍨 Sabores escolhidos:`); item.flavorDistribution.split(/\s*\+\s*/).forEach((part) => { const m = part.trim().match(/^(\d+)\s+(.+)$/); lines.push(`    ${m ? `${pad2(m[1])}x ${m[2]}` : part.trim()}`); }); } else if (item.flavors?.length) { lines.push(`• 🍨 Sabores escolhidos:`); item.flavors.forEach((f) => lines.push(`    01x ${f.name || f}`)); }
      if (item.fixedIngredients?.length) { lines.push(`• 📌 Ingredientes:`); item.fixedIngredients.filter((i) => !/sabores? de sorvete/i.test(i)).forEach((i) => lines.push(`    • ${i}`)); }
      if (item.includedExtras?.length) { lines.push(`• ✅ Inclusos:`); item.includedExtras.forEach((e) => lines.push(`    • ${e}`)); }
      lines.push(`• 💰 Produto: ${money(itemBaseTotal(item))}`);
      if (item.boxAddOns?.length) {
        item.boxAddOns.forEach((addOn) => {
          const val = money(Number(addOn.quantity) * Number(addOn.price));
          lines.push(`• ➕ ${pad2(addOn.quantity)}x ${addOn.name} — ${val}`);
        });
      }
      if (needsAvailabilityChoice(item)) lines.push(`• ⏰ ${isLargeIceCreamBox(item) ? 'Caixa grande' : 'Torta'}: mín. 48h de antecedência`);
      if (item.serviceMode === 'travel') lines.push(`• 🛍️ Embalagem viagem: ${item.packagingIncluded ? 'incluída' : money(itemPackagingTotal(item))}`);
      if (item.serviceMode === 'store') lines.push(`• 🏠 Consumo na loja`);
      lines.push(`• ✔️ Subtotal: *${money(itemTotal(item))}*`);
    });

    const obs = form.observacoes?.trim();
    lines.push(
      ``,
      sep,
      ``,
      `🧾 *TOTAL A PAGAR: ${money(total())}*`,
    );
    if (obs) lines.push(``, `📝 *Obs.:* ${obs}`);
    lines.push(
      ``,
      sep,
      ``,
      `⚠️ _Pedido sujeito à confirmação da loja._`,
      `_Sem retorno em 15 min, ligue/chame no WhatsApp: (16) 99606-2046_`,
    );
    return lines.join('\n');
  }
  function submitOrder(event) { event.preventDefault(); const error = $('#form-error'); error.classList.remove('is-visible'); syncGuidedForm(); if (!formFlow.ready) return showFormError('Complete as etapas na ordem indicada antes de enviar.'); if (!retiradaAberta()) { window.ItapHorarioPedidos?.aviso('retirada'); return showFormError(window.ItapHorarioPedidos?.textoAviso('retirada') || 'Pedidos pelo site somente de segunda a sexta, das 11h00 às 20h00, exceto sábados, domingos e feriados regionais de Cajuru/SP. Vá até nossa loja e peça pessoalmente.'); } const form = Object.fromEntries(new FormData(event.currentTarget).entries()); if (!state.cart.length) return showFormError('Escolha pelo menos um produto antes de enviar.'); if (!form.nome?.trim()) return showFormError('Informe o nome de quem vai retirar.'); if (!validatePhone(form.telefone || '')) return showFormError('Digite somente o número do celular após o DDD 16.'); if (!validPickupTime(form.horario)) return showFormError('Escolha um horário de retirada entre 11h00 e 20h00 (de segunda a sexta).'); if (hasCakeProductionLead()) { if (!form.data_retirada) return showFormError('Para encomenda de torta ou caixa grande, escolha a data desejada para retirar.'); if (!validCakeLeadTime(form.data_retirada, form.horario)) return showFormError('Encomendas de torta e caixa grande precisam de pelo menos 48 horas de antecedência pelo horário de Brasília.'); } else if (!validCommonLeadTime(form.horario)) { syncPickupTimeValidation(); $('#pickup-time')?.focus(); return showFormError(pickupTimeMessage()); } if (!form.aceite) return showFormError('Leia e marque o aceite das regras antes de enviar.'); setOrderStage(3); const text = buildMessage(form); window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); }
  function showFormError(message) { const error = $('#form-error'); error.textContent = message; error.classList.add('is-visible'); error.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  async function init() { try { const response = await fetch('dados/produtos.json?v=20260822-textos-skus'); if (!response.ok) throw new Error('Não foi possível carregar o catálogo.'); state.data = await response.json(); state.catalog = buildCatalog(state.data); $('#loading').remove(); renderCatalog(); renderCartSummary(); setOrderStage(state.cart.length ? 2 : 1); syncPickupDateConstraint(); syncGuidedForm(); const sku = new URLSearchParams(location.search).get('sku'); if (sku) { const product = state.catalog.find((item) => item.sku === sku); if (product) { document.getElementById(`sec-${slug(product.category)}`)?.scrollIntoView({ block: 'start' }); announce(`${product.name} está destacado na seção correspondente.`); } } } catch (error) { $('#loading').textContent = 'Não foi possível carregar os produtos agora. Volte ao cardápio e tente novamente.'; console.error(error); } }
  $('#search').addEventListener('input', (event) => { state.query = event.target.value; renderCatalog(); });
  $('#summary-bar').addEventListener('click', () => { captureCatalogViewport(); renderCart(); openDialog('cart-dialog'); });
  $('#confirm-flavors').addEventListener('click', confirmFlavors);
  $('#confirm-popsicle-preferences').addEventListener('click', confirmPopsiclePreferences);
  $$('input[name="item-mode"]').forEach((input) => input.addEventListener('change', (event) => { state.serviceMode = event.target.value; renderFlavorGrid(); }));
  $$('input[name="item-container"]').forEach((input) => input.addEventListener('change', (event) => { state.containerType = event.target.value; renderFlavorGrid(); }));
  $$('input[name="cake-choice"]').forEach((input) => input.addEventListener('change', (event) => { const product = state.flavorProduct; if (event.target.value === 'pronta_consulta' && needsAvailabilityChoice(product)) { event.target.checked = false; consultAvailability(product); return; } state.cakeChoice = event.target.value; renderFlavorGrid(); }));
  $('#continue-shopping').addEventListener('click', () => { setOrderStage(1); closeDialog('cart-dialog'); restoreCatalogViewport(); });
  $('#pickup-form').addEventListener('submit', submitOrder);
  $('#client-phone').addEventListener('input', (event) => { event.target.value = formatPhone(event.target.value); syncGuidedForm({ scroll: true }); });
  $('#client-name').addEventListener('input', () => syncGuidedForm({ scroll: true }));
  $('#pickup-time').addEventListener('input', () => { syncPickupTimeValidation(); syncGuidedForm({ scroll: true }); });
  $('#pickup-time').addEventListener('change', () => { syncPickupTimeValidation(); syncGuidedForm({ scroll: true }); });
  $('#pickup-date').addEventListener('change', () => syncGuidedForm({ scroll: true }));
  $('#confirm-payment').addEventListener('click', () => { formFlow.paymentConfirmed = true; syncGuidedForm({ scroll: true }); });
  $('#continue-notes').addEventListener('click', () => { formFlow.notesContinued = true; syncGuidedForm({ scroll: true }); });
  $('#accept-rules').addEventListener('change', () => syncGuidedForm({ scroll: true }));
  window.addEventListener('itap:horario-pedidos-atualizado', () => { if (state.catalog.length) renderCatalog(); });
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => { if (button.dataset.close === 'popsicle-dialog') { state.popsicleGroup = null; state.popsiclePreferences = []; state.activePopsiclePreference = 0; state.popsicleQuantity = 1; } closeDialog(button.dataset.close); }));
  init();
}());
