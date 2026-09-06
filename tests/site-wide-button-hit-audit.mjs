/**
 * site-wide-button-hit-audit.mjs
 *
 * Auditoria de hit-test de botões em todo o site Itapolitana Cajuru.
 * Cobre todas as páginas públicas em múltiplos viewports.
 * Detecta elementos a interceptar cliques (elementFromPoint).
 *
 * Uso:
 *   AUDIT_BASE=http://127.0.0.1:8135 node tests/site-wide-button-hit-audit.mjs
 *
 * Saída:
 *   /tmp/itapolitana-site-wide-hit-audit.json  (ou AUDIT_OUT=caminho)
 *
 * Apenas leitura — não envia pedidos, pagamentos nem mensagens reais.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const base = process.env.AUDIT_BASE || 'http://127.0.0.1:8135';
const out = process.env.AUDIT_OUT || '/tmp/itapolitana-site-wide-hit-audit.json';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ACTIVE_ROOT_PAGES = [
  '404.html',
  'admin-catalogo.html',
  'admin-painel.html',
  'admin-picole.html',
  'cardapio-acai-natureon.html',
  'carrossel.html',
  'dicas.html',
  'encomendas.html',
  'index.html',
  'offline.html',
  'politica-privacidade.html',
  'promocao.html',
  'retirada.html',
  'sobre.html',
];

const VIEWPORTS = [
  { name: 'iphone-se',      width: 320, height: 700,  isMobile: true  },
  { name: 'iphone',         width: 390, height: 844,  isMobile: true  },
  { name: 'android-large',  width: 430, height: 932,  isMobile: true  },
  { name: 'tablet',         width: 768, height: 1024, isMobile: true  },
  { name: 'desktop-hd',     width: 1280, height: 800, isMobile: false },
  { name: 'desktop-fhd',    width: 1440, height: 900, isMobile: false },
];

async function listHtmlPages() {
  const pages = [];
  for (const page of ACTIVE_ROOT_PAGES) {
    try {
      await fs.access(path.join(root, page));
      pages.push(page);
    } catch (error) {
      if (error && error.code !== 'ENOENT') throw error;
    }
  }

  const adminIndex = path.join(root, 'admin', 'index.html');
  try {
    await fs.access(adminIndex);
    pages.push('admin/index.html');
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }

  return pages;
}

// Seletor amplo de candidatos a botão
const BUTTON_SELECTOR =
  'button, [role="button"], input[type="button"], input[type="submit"],' +
  ' input[type="reset"], a[href], summary, label[for],' +
  ' .btn, .categoria-header, .modal-close, [data-action]';

// ── helpers de avaliação no browser ────────────────────────────────────────

/** Recolhe informação dos overlays fixos/sticky/z-index alto. */
const OVERLAY_SCAN_FN = () => {
  const results = [];
  const all = document.querySelectorAll('*');
  for (const el of all) {
    const s = getComputedStyle(el);
    const pos = s.position;
    const zi = parseInt(s.zIndex, 10) || 0;
    const pe = s.pointerEvents;
    const vis = s.visibility;
    const disp = s.display;
    if (disp === 'none') continue;
    const isFixed = pos === 'fixed';
    const isSticky = pos === 'sticky';
    const isHighZ = zi > 100;
    const hasPointerAuto = pe === 'auto' || pe === 'all';
    if (!isFixed && !isSticky && !isHighZ) continue;
    const r = el.getBoundingClientRect();
    results.push({
      tag: el.tagName,
      id: el.id || null,
      classList: typeof el.className === 'string' ? el.className.split(' ').filter(Boolean) : [],
      position: pos,
      zIndex: zi,
      pointerEvents: pe,
      visibility: vis,
      display: disp,
      left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height,
      hasPointerAuto,
      isFixed, isSticky, isHighZ,
    });
  }
  return results;
};

/**
 * Avalia todos os botões candidatos na página com o algoritmo de 5 pontos.
 * Retorna { passed, partiallyBlocked, blocked, coveredByModal,
 *           skippedHidden, skippedCollapsed, skippedZeroArea }.
 */
const BUTTON_SCAN_FN = (selector) => {
  function isActiveModalInterceptor(el) {
    if (!el) return false;
    let cur = el;
    while (cur && cur !== document.body) {
      const s = getComputedStyle(cur);
      const cls = typeof cur.className === 'string' ? cur.className : '';
      const zi = parseInt(s.zIndex, 10) || 0;
      if ((cls.includes('modal') || cur.getAttribute('role') === 'dialog') && s.display !== 'none' && zi > 1000) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  const candidates = [...document.querySelectorAll(selector)];
  const passed = [];
  const partiallyBlocked = [];
  const blocked = [];
  const coveredByModal = [];
  const skippedHidden = [];
  const skippedCollapsed = [];
  const skippedZeroArea = [];
  const skippedInline = [];

  for (const el of candidates) {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();

    // Filtros legítimos
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) {
      skippedHidden.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60) });
      continue;
    }
    // Padrão sr-only e elementos de área quase-zero (1×1 px)
    if (r.width < 2 || r.height < 2) {
      skippedZeroArea.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60), w: r.width, h: r.height });
      continue;
    }
    // Elementos com display:inline são links de texto em fluxo — a sua bbox é a união
    // de todos os line boxes, não a área visual real. Não são botões standalone.
    if (s.display === 'inline') {
      skippedInline.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60) });
      continue;
    }
    // Dentro de acordeão fechado
    let ancestor = el.parentElement;
    let inCollapsed = false;
    while (ancestor && ancestor !== document.body) {
      if (ancestor.getAttribute('aria-expanded') === 'false') { inCollapsed = true; break; }
      const as = getComputedStyle(ancestor);
      if (as.display === 'none' || as.visibility === 'hidden') { inCollapsed = true; break; }
      ancestor = ancestor.parentElement;
    }
    if (inCollapsed) {
      skippedCollapsed.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60) });
      continue;
    }

    // 5 pontos de teste (nunca fora do viewport)
    const margin = 4;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const vw = innerWidth, vh = innerHeight;
    const cx = clamp(r.left + r.width / 2, margin, vw - margin);
    const cy = clamp(r.top + r.height / 2, margin, vh - margin);
    const qx1 = clamp(r.left + r.width * 0.25, margin, vw - margin);
    const qy1 = clamp(r.top + r.height * 0.25, margin, vh - margin);
    const qx2 = clamp(r.left + r.width * 0.75, margin, vw - margin);
    const qy2 = clamp(r.top + r.height * 0.25, margin, vh - margin);
    const qx3 = clamp(r.left + r.width * 0.25, margin, vw - margin);
    const qy3 = clamp(r.top + r.height * 0.75, margin, vh - margin);
    const qx4 = clamp(r.left + r.width * 0.75, margin, vw - margin);
    const qy4 = clamp(r.top + r.height * 0.75, margin, vh - margin);
    const testPoints = [[cx, cy], [qx1, qy1], [qx2, qy2], [qx3, qy3], [qx4, qy4]];

    // Verificar se o botão está (pelo menos parcialmente) no viewport
    const inViewport = r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    if (!inViewport) {
      skippedCollapsed.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60), reason: 'out-of-viewport' });
      continue;
    }

    const pointResults = testPoints.map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      const isOk = hit === el || el.contains(hit);
      let interceptor = null;
      if (!isOk && hit) {
        const hs = getComputedStyle(hit);
        // Subir cadeia de ancestrais até body
        const chain = [];
        let cur = hit;
        while (cur && cur !== document.body) {
          const cs = getComputedStyle(cur);
          chain.push({ tag: cur.tagName, id: cur.id || null, classList: typeof cur.className === 'string' ? cur.className.split(' ').filter(Boolean) : [] });
          cur = cur.parentElement;
        }
        interceptor = {
          tag: hit.tagName,
          id: hit.id || null,
          classList: typeof hit.className === 'string' ? hit.className.split(' ').filter(Boolean) : [],
          position: hs.position,
          zIndex: hs.zIndex,
          pointerEvents: hs.pointerEvents,
          visibility: hs.visibility,
          opacity: hs.opacity,
          transform: hs.transform,
          ancestorChain: chain,
        };
      }
      return { x, y, hit: isOk, interceptor };
    });

    const hitCount = pointResults.filter(p => p.hit).length;
    const item = {
      tag: el.tagName,
      id: el.id || null,
      text: (el.textContent || el.value || '').trim().slice(0, 80),
      classList: typeof el.className === 'string' ? el.className.split(' ').filter(Boolean) : [],
      disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
      bbox: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      minTouchTarget: r.width >= 44 && r.height >= 44,
      hitCount,
      points: pointResults,
      position: s.position,
      zIndex: s.zIndex,
      pointerEvents: s.pointerEvents,
    };

    if (hitCount >= 3) passed.push(item);
    else if (hitCount >= 1) partiallyBlocked.push(item);
    else {
      // Distinguir bloqueado por modal aberto (correcto) vs. bloqueio real.
      // Localizar o elemento que intercepta o primeiro ponto bloqueado.
      const firstBlockedPoint = pointResults.find(p => !p.hit);
      const interceptEl = firstBlockedPoint
        ? (firstBlockedPoint.interceptor?.id
          ? document.getElementById(firstBlockedPoint.interceptor.id)
          : document.elementFromPoint(firstBlockedPoint.x, firstBlockedPoint.y))
        : null;
      if (interceptEl && isActiveModalInterceptor(interceptEl)) {
        coveredByModal.push(item);
      } else {
        blocked.push(item);
      }
    }
  }

  return { passed, partiallyBlocked, blocked, coveredByModal, skippedHidden, skippedCollapsed, skippedZeroArea, skippedInline };
};

// ── função principal ────────────────────────────────────────────────────────

async function auditPage(page, pageFile, viewport, stateLabel, extraSetup) {
  const url = `${base}/${pageFile}?site-wide-hit-audit=20260829`;
  let navigationError = null;
  const jsErrors = [];
  page.removeAllListeners('pageerror');
  page.on('pageerror', e => jsErrors.push(String(e?.stack || e)));

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } catch (e) {
    navigationError = String(e?.message || e);
  }
  await new Promise(r => setTimeout(r, 600));

  if (extraSetup) await extraSetup(page);

  // scrollIntoViewIfNeeded já feito no browser para cada botão individual
  const scanResult = await page.evaluate(BUTTON_SCAN_FN, BUTTON_SELECTOR);
  const overlays = await page.evaluate(OVERLAY_SCAN_FN);

  return {
    page: pageFile,
    state: stateLabel,
    viewport: `${viewport.width}x${viewport.height}`,
    viewportName: viewport.name,
    navigationError,
    jsErrors,
    overlays,
    ...scanResult,
  };
}

// ── estados especiais de encomendas.html ─────────────────────────────────────

const encomendaStates = [
  {
    label: 'initial',
    setup: async (page) => {
      // Estado inicial — sem interações
    },
  },
  {
    label: 'picoles-accordion-open',
    setup: async (page) => {
      await page.evaluate(() => {
        const hdr = document.querySelector('.categoria--picoles .categoria-header, [data-categoria="picoles"] .categoria-header');
        if (hdr) hdr.click();
      });
      await new Promise(r => setTimeout(r, 400));
    },
  },
  {
    label: 'picoles-modal-open',
    setup: async (page) => {
      await page.evaluate(() => {
        const hdr = document.querySelector('.categoria--picoles .categoria-header, [data-categoria="picoles"] .categoria-header');
        if (hdr) hdr.click();
      });
      await new Promise(r => setTimeout(r, 400));
      await page.evaluate(() => {
        const btn = document.querySelector('.btn-sabores--picoles, [data-modal-target*="picole"], .btn-montar-lote');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
    },
  },
  {
    label: 'picoles-modal-closed-accordion-open',
    setup: async (page) => {
      // Abrir, fechar modal e manter acordeão aberto
      await page.evaluate(() => {
        const hdr = document.querySelector('.categoria--picoles .categoria-header, [data-categoria="picoles"] .categoria-header');
        if (hdr) hdr.click();
      });
      await new Promise(r => setTimeout(r, 300));
      await page.evaluate(() => {
        const btn = document.querySelector('.btn-sabores--picoles, [data-modal-target*="picole"], .btn-montar-lote');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 400));
      // Fechar pelo botão ✕ com onclick="window.fecharModal('modal-picoles')"
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('#modal-picoles button')];
        const closeBtn = btns.find(b => {
          const onclick = b.getAttribute('onclick') || '';
          const txt = b.textContent.trim();
          return onclick.includes('fecharModal') || txt === '✕' || txt === '×';
        });
        if (closeBtn) closeBtn.click();
      });
      await new Promise(r => setTimeout(r, 500));
    },
  },
  {
    label: 'cart-open',
    setup: async (page) => {
      await page.evaluate(() => {
        const cartBtn = document.querySelector('#btn-carrinho, .btn-carrinho, [data-action="abrir-carrinho"]');
        if (cartBtn) cartBtn.click();
      });
      await new Promise(r => setTimeout(r, 400));
    },
  },
  {
    label: 'sorvete-caixa-open',
    setup: async (page) => {
      await page.evaluate(() => {
        const hdr = document.querySelector('.categoria--sorvete-caixa .categoria-header, [data-categoria="sorvete-caixa"] .categoria-header');
        if (hdr) hdr.click();
      });
      await new Promise(r => setTimeout(r, 400));
    },
  },
  {
    label: 'tortas-open',
    setup: async (page) => {
      await page.evaluate(() => {
        const hdr = document.querySelector('.categoria--tortas .categoria-header, [data-categoria="tortas"] .categoria-header');
        if (hdr) hdr.click();
      });
      await new Promise(r => setTimeout(r, 400));
    },
  },
  {
    label: 'acrescimos-open',
    setup: async (page) => {
      await page.evaluate(() => {
        const hdr = document.querySelector('.categoria--acrescimos .categoria-header, [data-categoria="acrescimos"] .categoria-header');
        if (hdr) hdr.click();
      });
      await new Promise(r => setTimeout(r, 400));
    },
  },
];

// ── executar auditoria ───────────────────────────────────────────────────────

const PUBLIC_PAGES = await listHtmlPages();

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
const allResults = [];

for (const viewport of VIEWPORTS) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
  });

  for (const pageFile of PUBLIC_PAGES) {
    if (pageFile === 'encomendas.html') {
      // Múltiplos estados para encomendas
      for (const state of encomendaStates) {
        const result = await auditPage(page, pageFile, viewport, state.label, state.setup);
        allResults.push(result);
      }
    } else {
      const result = await auditPage(page, pageFile, viewport, 'initial', null);
      allResults.push(result);
    }
  }
}

await browser.close();

// ── agregar sumário ──────────────────────────────────────────────────────────

const allButtons = allResults.flatMap(r => [
  ...r.passed.map(b => ({ ...b, _page: r.page, _state: r.state, _viewport: r.viewport, _status: 'passed' })),
  ...r.partiallyBlocked.map(b => ({ ...b, _page: r.page, _state: r.state, _viewport: r.viewport, _status: 'partiallyBlocked' })),
  ...r.blocked.map(b => ({ ...b, _page: r.page, _state: r.state, _viewport: r.viewport, _status: 'blocked' })),
  ...(r.coveredByModal || []).map(b => ({ ...b, _page: r.page, _state: r.state, _viewport: r.viewport, _status: 'coveredByModal' })),
]);

const skippedHiddenTotal = allResults.reduce((s, r) => s + r.skippedHidden.length, 0);
const skippedCollapsedTotal = allResults.reduce((s, r) => s + r.skippedCollapsed.length, 0);
const skippedZeroAreaTotal = allResults.reduce((s, r) => s + r.skippedZeroArea.length, 0);
const skippedInlineTotal = allResults.reduce((s, r) => s + (r.skippedInline?.length || 0), 0);

const byPage = PUBLIC_PAGES.map(p => {
  const pageResults = allResults.filter(r => r.page === p);
  const pageBtns = allButtons.filter(b => b._page === p);
  return {
    page: p,
    states: [...new Set(pageResults.map(r => r.state))],
    passed: pageBtns.filter(b => b._status === 'passed').length,
    partiallyBlocked: pageBtns.filter(b => b._status === 'partiallyBlocked').length,
    blocked: pageBtns.filter(b => b._status === 'blocked').length,
    coveredByModal: pageBtns.filter(b => b._status === 'coveredByModal').length,
    navigationErrors: pageResults.filter(r => r.navigationError).length,
    jsErrors: pageResults.reduce((s, r) => s + r.jsErrors.length, 0),
  };
});

const byViewport = VIEWPORTS.map(vp => {
  const label = `${vp.width}x${vp.height}`;
  const vpBtns = allButtons.filter(b => b._viewport === label);
  return {
    viewport: label,
    name: vp.name,
    passed: vpBtns.filter(b => b._status === 'passed').length,
    partiallyBlocked: vpBtns.filter(b => b._status === 'partiallyBlocked').length,
    blocked: vpBtns.filter(b => b._status === 'blocked').length,
    coveredByModal: vpBtns.filter(b => b._status === 'coveredByModal').length,
  };
});

// Detalhes dos bloqueados para diagnóstico
const blockedDetails = allButtons.filter(b => b._status === 'blocked').map(b => ({
  page: b._page, state: b._state, viewport: b._viewport,
  tag: b.tag, id: b.id, text: b.text, classList: b.classList,
  bbox: b.bbox, minTouchTarget: b.minTouchTarget,
  firstInterceptor: b.points.find(p => !p.hit && p.interceptor)?.interceptor || null,
}));

const partialDetails = allButtons.filter(b => b._status === 'partiallyBlocked').map(b => ({
  page: b._page, state: b._state, viewport: b._viewport,
  tag: b.tag, id: b.id, text: b.text, classList: b.classList,
  bbox: b.bbox, hitCount: b.hitCount,
  firstInterceptor: b.points.find(p => !p.hit && p.interceptor)?.interceptor || null,
}));

const summary = {
  totalButtons: allButtons.length,
  passed: allButtons.filter(b => b._status === 'passed').length,
  partiallyBlocked: allButtons.filter(b => b._status === 'partiallyBlocked').length,
  blocked: allButtons.filter(b => b._status === 'blocked').length,
  coveredByModal: allButtons.filter(b => b._status === 'coveredByModal').length,
  skippedHidden: skippedHiddenTotal,
  skippedCollapsed: skippedCollapsedTotal,
  skippedZeroArea: skippedZeroAreaTotal,
  skippedInline: skippedInlineTotal,
  byPage,
  byViewport,
  blockedDetails,
  partialDetails,
};

const payload = {
  generatedAt: new Date().toISOString(),
  base,
  readOnly: true,
  noSubmissions: true,
  summary,
  results: allResults,
};

await fs.writeFile(out, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ out, summary: { ...summary, blockedDetails: undefined, partialDetails: undefined } }, null, 2));
if (summary.blocked > 0) {
  console.error(`\n❌ ${summary.blocked} botões BLOQUEADOS encontrados. Ver: ${out}`);
  process.exitCode = 1;
} else {
  console.log(`\n✅ Nenhum botão completamente bloqueado. ${summary.partiallyBlocked} parcialmente bloqueados. Ver: ${out}`);
}
