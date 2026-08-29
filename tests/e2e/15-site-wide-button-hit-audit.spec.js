/**
 * 15-site-wide-button-hit-audit.spec.js
 *
 * Spec Playwright — Auditoria de hit-test de botões em todo o site.
 * Detecta elementos a interceptar cliques usando elementFromPoint.
 *
 * Categorias de resultado por botão:
 *   passed            — ≥3/5 pontos recebidos pelo botão ou descendente
 *   partiallyBlocked  — 1-2/5 pontos bloqueados por elemento não-modal
 *   blocked           — 0/5 pontos (nenhum acertou o botão); causa real
 *   coveredByModal    — 0/5 pontos mas interceptado por um modal aberto
 *                       (comportamento correcto — não é bug)
 *   skippedHidden     — display:none / visibility:hidden / opacity:0
 *   skippedZeroArea   — bbox width < 2 || height < 2 (incl. sr-only 1×1)
 *   skippedCollapsed  — dentro de acordeão fechado ou fora do viewport
 *
 * Falha apenas se houver botões na categoria `blocked`.
 * `coveredByModal` é registado mas não falha o teste.
 *
 * Integra no suite existente (baseURL: http://localhost:8080 via playwright.config.js).
 * Gera relatório JSON em docs/relatorios/site-wide-button-hit-audit.json.
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';

// Caminho absoluto a partir da raiz do repositório (um nível acima do diretório tests/)
const REPORT_DIR = path.resolve(process.cwd(), '../docs/relatorios');
const REPORT_FILE = path.join(REPORT_DIR, 'site-wide-button-hit-audit.json');

// Seletor amplo de candidatos a botão
const BUTTON_SELECTOR =
  'button, [role="button"], input[type="button"], input[type="submit"],' +
  ' input[type="reset"], a[href], summary, label[for],' +
  ' .btn, .categoria-header, .modal-close, [data-action]';

/** Viewports adicionais não cobertos pelo playwright.config.js */
const EXTRA_VIEWPORTS = [
  { name: 'iphone-se',     width: 320,  height: 700  },
  { name: 'android-large', width: 430,  height: 932  },
  { name: 'desktop-fhd',   width: 1440, height: 900  },
];

/** Páginas públicas (excluindo admin) */
const PUBLIC_PAGES = [
  '/',
  '/encomendas.html',
  '/retirada.html',
  '/promocao.html',
  '/sobre.html',
  '/dicas.html',
  '/carrossel.html',
  '/cardapio-acai-natureon.html',
  '/politica-privacidade.html',
];

// ── lógica de avaliação executada no contexto do browser ───────────────────

/**
 * Executa o scan de hit-test em todos os botões candidatos.
 * Retorna { passed, partiallyBlocked, blocked, coveredByModal,
 *           skippedHidden, skippedCollapsed, skippedZeroArea, skippedInline }.
 */
async function scanButtons(page, selector) {
  return page.evaluate((sel) => {
    /**
     * Detecta se um elemento interceptor pertence a um modal aberto.
     * Considera: ancestral com class "modal" E position:fixed E z-index alto.
     */
    function isActiveModalInterceptor(el) {
      if (!el) return false;
      let cur = el;
      while (cur && cur !== document.body) {
        const s = getComputedStyle(cur);
        const cls = typeof cur.className === 'string' ? cur.className : '';
        const zi = parseInt(s.zIndex, 10) || 0;
        if (
          (cls.includes('modal') || cur.getAttribute('role') === 'dialog') &&
          s.display !== 'none' &&
          zi > 1000
        ) return true;
        cur = cur.parentElement;
      }
      return false;
    }

    const candidates = [...document.querySelectorAll(sel)];
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

      // Filtros legítimos — oculto por CSS
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) {
        skippedHidden.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60) });
        continue;
      }
      // Filtro de área quase-zero — inclui padrão sr-only (1×1 px)
      if (r.width < 2 || r.height < 2) {
        skippedZeroArea.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60), w: r.width, h: r.height });
        continue;
      }
      // Elementos com display:inline são links de texto em fluxo — bbox não reflecte
      // a área visual real; não são botões standalone. Registar em bucket próprio.
      if (s.display === 'inline') {
        skippedInline.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60) });
        continue;
      }

      // Verificar se está dentro de acordeão fechado ou ancestral oculto
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

      // Verificar se está no viewport
      const inViewport = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      if (!inViewport) {
        skippedCollapsed.push({ tag: el.tagName, id: el.id || null, text: (el.textContent || '').trim().slice(0, 60), reason: 'out-of-viewport' });
        continue;
      }

      // 5 pontos de hit-test (clamped ao viewport)
      const margin = 4;
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const vw = innerWidth, vh = innerHeight;
      const testPoints = [
        [clamp(r.left + r.width  * 0.50, margin, vw - margin), clamp(r.top + r.height * 0.50, margin, vh - margin)],
        [clamp(r.left + r.width  * 0.25, margin, vw - margin), clamp(r.top + r.height * 0.25, margin, vh - margin)],
        [clamp(r.left + r.width  * 0.75, margin, vw - margin), clamp(r.top + r.height * 0.25, margin, vh - margin)],
        [clamp(r.left + r.width  * 0.25, margin, vw - margin), clamp(r.top + r.height * 0.75, margin, vh - margin)],
        [clamp(r.left + r.width  * 0.75, margin, vw - margin), clamp(r.top + r.height * 0.75, margin, vh - margin)],
      ];

      const pointResults = testPoints.map(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        const isOk = hit === el || el.contains(hit);
        let interceptor = null;
        if (!isOk && hit) {
          const hs = getComputedStyle(hit);
          const chain = [];
          let cur = hit;
          while (cur && cur !== document.body) {
            chain.push({ tag: cur.tagName, id: cur.id || null, cls: typeof cur.className === 'string' ? cur.className.split(' ').filter(Boolean).slice(0, 4) : [] });
            cur = cur.parentElement;
          }
          interceptor = {
            tag: hit.tagName, id: hit.id || null,
            cls: typeof hit.className === 'string' ? hit.className.split(' ').filter(Boolean).slice(0, 6) : [],
            position: hs.position, zIndex: hs.zIndex, pointerEvents: hs.pointerEvents,
            visibility: hs.visibility, opacity: hs.opacity, transform: hs.transform,
            ancestorChain: chain,
          };
        }
        return { x, y, hit: isOk, interceptor };
      });

      const hitCount = pointResults.filter(p => p.hit).length;
      const item = {
        tag: el.tagName, id: el.id || null,
        text: (el.textContent || el.value || '').trim().slice(0, 80),
        cls: typeof el.className === 'string' ? el.className.split(' ').filter(Boolean).slice(0, 6) : [],
        disabled: el.disabled || el.getAttribute('aria-disabled') === 'true',
        bbox: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
        minTouchTarget: r.width >= 44 && r.height >= 44,
        hitCount,
        points: pointResults,
      };

      if (hitCount >= 3) {
        passed.push(item);
      } else if (hitCount >= 1) {
        partiallyBlocked.push(item);
      } else {
        // Distinguir bloqueado por modal aberto (correcto) vs. bloqueio real
        const firstInterceptor = pointResults.find(p => !p.hit && p.interceptor)?.interceptor;
        if (firstInterceptor && isActiveModalInterceptor(
          // Reconstituir o elemento a partir dos dados registados
          (() => {
            // Tenta localizar pelo id se disponível
            if (firstInterceptor.id) return document.getElementById(firstInterceptor.id);
            // Fallback: verificar pelo elementFromPoint novamente
            return document.elementFromPoint(testPoints[0][0], testPoints[0][1]);
          })()
        )) {
          coveredByModal.push({ ...item, interceptor: firstInterceptor });
        } else {
          blocked.push({ ...item, interceptor: firstInterceptor });
        }
      }
    }

    return { passed, partiallyBlocked, blocked, coveredByModal, skippedHidden, skippedCollapsed, skippedZeroArea, skippedInline };
  }, selector);
}

/** Varre overlays fixos/sticky/z-index alto. */
async function scanOverlays(page) {
  return page.evaluate(() => {
    const results = [];
    for (const el of document.querySelectorAll('*')) {
      const s = getComputedStyle(el);
      if (s.display === 'none') continue;
      const pos = s.position;
      const zi = parseInt(s.zIndex, 10) || 0;
      if (pos !== 'fixed' && pos !== 'sticky' && zi <= 100) continue;
      const r = el.getBoundingClientRect();
      results.push({
        tag: el.tagName, id: el.id || null,
        cls: typeof el.className === 'string' ? el.className.split(' ').filter(Boolean).slice(0, 6) : [],
        position: pos, zIndex: zi,
        pointerEvents: s.pointerEvents, visibility: s.visibility,
        left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      });
    }
    return results;
  });
}

// ── helper: abrir uma página e esperar estabilizar ──────────────────────────

async function gotoPage(page, url) {
  let navError = null;
  try {
    await page.goto(url + '?site-wide-hit-audit=20260829', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(600);
  } catch (e) {
    navError = String(e?.message || e);
  }
  return navError;
}

// ── dados do relatório global ───────────────────────────────────────────────

const auditReport = {
  generatedAt: null,
  readOnly: true,
  noSubmissions: true,
  results: [],
};

// ── testes ──────────────────────────────────────────────────────────────────

test.describe('Hit-test de botões — páginas públicas (estado inicial)', () => {
  for (const pagePath of PUBLIC_PAGES) {
    test(`${pagePath || '/index.html'} — estado inicial`, async ({ page }) => {
      const navError = await gotoPage(page, pagePath);
      if (navError) test.skip(true, `Navegação falhou: ${navError}`);

      const scan = await scanButtons(page, BUTTON_SELECTOR);
      const overlays = await scanOverlays(page);

      const baseURL = page.context().browser()?.wsEndpoint?.toString() || '';
      const vp = page.viewportSize();
      auditReport.results.push({
        page: pagePath, state: 'initial',
        viewport: vp ? `${vp.width}x${vp.height}` : 'default',
        ...scan, overlays,
      });

      const blockedList = scan.blocked.map(b => `[${b.tag}] "${b.text}" — interceptado por: ${b.points.find(p => !p.hit && p.interceptor)?.interceptor?.tag ?? 'desconhecido'}`);
      expect(scan.blocked, `Botões bloqueados em ${pagePath}:\n${blockedList.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Hit-test de botões — encomendas.html (múltiplos estados)', () => {
  test('encomendas — picolés acordeão aberto', async ({ page }) => {
    await gotoPage(page, '/encomendas.html');
    await page.evaluate(() => {
      const hdr = document.querySelector('.categoria--picoles .categoria-header, [data-categoria="picoles"] .categoria-header');
      if (hdr) hdr.click();
    });
    await page.waitForTimeout(400);

    const scan = await scanButtons(page, BUTTON_SELECTOR);
    const overlays = await scanOverlays(page);
    const vp = page.viewportSize();
    auditReport.results.push({ page: '/encomendas.html', state: 'picoles-accordion-open', viewport: vp ? `${vp.width}x${vp.height}` : 'default', ...scan, overlays });

    const blockedList = scan.blocked.map(b => `[${b.tag}] "${b.text}"`);
    expect(scan.blocked, `Botões bloqueados (picolés aberto):\n${blockedList.join('\n')}`).toHaveLength(0);
  });

  test('encomendas — modal picolés aberto', async ({ page }) => {
    await gotoPage(page, '/encomendas.html');
    await page.evaluate(() => {
      const hdr = document.querySelector('.categoria--picoles .categoria-header, [data-categoria="picoles"] .categoria-header');
      if (hdr) hdr.click();
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const btn = document.querySelector('.btn-sabores--picoles, [data-modal-target*="picole"], .btn-montar-lote');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    const scan = await scanButtons(page, BUTTON_SELECTOR);
    const overlays = await scanOverlays(page);
    const vp = page.viewportSize();
    auditReport.results.push({ page: '/encomendas.html', state: 'picoles-modal-open', viewport: vp ? `${vp.width}x${vp.height}` : 'default', ...scan, overlays });

    const blockedList = scan.blocked.map(b => `[${b.tag}] "${b.text}"`);
    expect(scan.blocked, `Botões bloqueados (modal picolés aberto):\n${blockedList.join('\n')}`).toHaveLength(0);
  });

  test('encomendas — modal picolés fechado (residual)', async ({ page }) => {
    await gotoPage(page, '/encomendas.html');
    // Abrir e fechar o modal — selector correcto para botão com onclick="window.fecharModal(...)"
    await page.evaluate(() => {
      const hdr = document.querySelector('.categoria--picoles .categoria-header, [data-categoria="picoles"] .categoria-header');
      if (hdr) hdr.click();
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const btn = document.querySelector('.btn-sabores--picoles, [data-modal-target*="picole"], .btn-montar-lote');
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);
    // Fechar o modal pelo botão ✕ que usa onclick="window.fecharModal('modal-picoles')"
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('#modal-picoles button')];
      const closeBtn = btns.find(b => {
        const onclick = b.getAttribute('onclick') || '';
        const txt = b.textContent.trim();
        return onclick.includes('fecharModal') || txt === '✕' || txt === '×';
      });
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(500);

    const scan = await scanButtons(page, BUTTON_SELECTOR);
    const overlays = await scanOverlays(page);
    const vp = page.viewportSize();
    auditReport.results.push({ page: '/encomendas.html', state: 'picoles-modal-closed-residual', viewport: vp ? `${vp.width}x${vp.height}` : 'default', ...scan, overlays });

    const blockedList = scan.blocked.map(b => `[${b.tag}] "${b.text}"`);
    expect(scan.blocked, `Botões bloqueados (modal fechado — overlay residual?):\n${blockedList.join('\n')}`).toHaveLength(0);
  });

  test('encomendas — carrinho aberto', async ({ page }) => {
    await gotoPage(page, '/encomendas.html');
    await page.evaluate(() => {
      const cartBtn = document.querySelector('#btn-carrinho, .btn-carrinho, [data-action="abrir-carrinho"]');
      if (cartBtn) cartBtn.click();
    });
    await page.waitForTimeout(400);

    const scan = await scanButtons(page, BUTTON_SELECTOR);
    const overlays = await scanOverlays(page);
    const vp = page.viewportSize();
    auditReport.results.push({ page: '/encomendas.html', state: 'cart-open', viewport: vp ? `${vp.width}x${vp.height}` : 'default', ...scan, overlays });

    const blockedList = scan.blocked.map(b => `[${b.tag}] "${b.text}"`);
    expect(scan.blocked, `Botões bloqueados (carrinho aberto):\n${blockedList.join('\n')}`).toHaveLength(0);
  });

  for (const { categoria, label } of [
    { categoria: 'sorvete-caixa', label: 'sorvete-caixa-open' },
    { categoria: 'tortas',        label: 'tortas-open'        },
    { categoria: 'acrescimos',    label: 'acrescimos-open'    },
  ]) {
    test(`encomendas — ${label}`, async ({ page }) => {
      await gotoPage(page, '/encomendas.html');
      await page.evaluate((cat) => {
        const hdr = document.querySelector(`.categoria--${cat} .categoria-header, [data-categoria="${cat}"] .categoria-header`);
        if (hdr) hdr.click();
      }, categoria);
      await page.waitForTimeout(400);

      const scan = await scanButtons(page, BUTTON_SELECTOR);
      const overlays = await scanOverlays(page);
      const vp = page.viewportSize();
      auditReport.results.push({ page: '/encomendas.html', state: label, viewport: vp ? `${vp.width}x${vp.height}` : 'default', ...scan, overlays });

      const blockedList = scan.blocked.map(b => `[${b.tag}] "${b.text}"`);
      expect(scan.blocked, `Botões bloqueados (${label}):\n${blockedList.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Hit-test de botões — viewports extra', () => {
  for (const vp of EXTRA_VIEWPORTS) {
    for (const pagePath of ['/encomendas.html', '/retirada.html', '/index.html']) {
      test(`${pagePath} @ ${vp.width}x${vp.height} (${vp.name})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const navError = await gotoPage(page, pagePath);
        if (navError) test.skip(true, `Navegação falhou: ${navError}`);

        const scan = await scanButtons(page, BUTTON_SELECTOR);
        const overlays = await scanOverlays(page);
        auditReport.results.push({ page: pagePath, state: 'initial', viewport: `${vp.width}x${vp.height}`, viewportName: vp.name, ...scan, overlays });

        const blockedList = scan.blocked.map(b => `[${b.tag}] "${b.text}"`);
        expect(scan.blocked, `Botões bloqueados em ${pagePath} @ ${vp.name}:\n${blockedList.join('\n')}`).toHaveLength(0);
      });
    }
  }
});

// ── gravar relatório após todos os testes ───────────────────────────────────

test.afterAll(async () => {
  auditReport.generatedAt = new Date().toISOString();

  const allPassed        = auditReport.results.flatMap(r => r.passed || []);
  const allPartial       = auditReport.results.flatMap(r => r.partiallyBlocked || []);
  const allBlocked       = auditReport.results.flatMap(r => r.blocked || []);
  const allCoveredModal  = auditReport.results.flatMap(r => r.coveredByModal || []);
  const allHidden        = auditReport.results.flatMap(r => r.skippedHidden || []);
  const allCollapsed     = auditReport.results.flatMap(r => r.skippedCollapsed || []);
  const allZeroArea      = auditReport.results.flatMap(r => r.skippedZeroArea || []);
  const allInline        = auditReport.results.flatMap(r => r.skippedInline || []);

  const byPage = PUBLIC_PAGES.map(p => {
    const pageResults = auditReport.results.filter(r => r.page === p || r.page === `/${p}` || r.page === p.replace(/^\//, ''));
    return {
      page: p,
      passed: pageResults.reduce((s, r) => s + (r.passed?.length || 0), 0),
      partiallyBlocked: pageResults.reduce((s, r) => s + (r.partiallyBlocked?.length || 0), 0),
      blocked: pageResults.reduce((s, r) => s + (r.blocked?.length || 0), 0),
      coveredByModal: pageResults.reduce((s, r) => s + (r.coveredByModal?.length || 0), 0),
    };
  });

  auditReport.summary = {
    totalButtons: allPassed.length + allPartial.length + allBlocked.length + allCoveredModal.length,
    passed: allPassed.length,
    partiallyBlocked: allPartial.length,
    blocked: allBlocked.length,
    coveredByModal: allCoveredModal.length,
    skippedHidden: allHidden.length,
    skippedCollapsed: allCollapsed.length,
    skippedZeroArea: allZeroArea.length,
    skippedInline: allInline.length,
    byPage,
    blockedDetails: auditReport.results.flatMap(r =>
      (r.blocked || []).map(b => ({
        page: r.page, state: r.state, viewport: r.viewport,
        tag: b.tag, id: b.id, text: b.text,
        interceptor: b.interceptor || null,
      }))
    ),
    coveredByModalDetails: auditReport.results.flatMap(r =>
      (r.coveredByModal || []).map(b => ({
        page: r.page, state: r.state, viewport: r.viewport,
        tag: b.tag, id: b.id, text: b.text,
      }))
    ),
  };

  try {
    await fs.mkdir(REPORT_DIR, { recursive: true });
    await fs.writeFile(REPORT_FILE, JSON.stringify(auditReport, null, 2) + '\n');
    console.log(`\n📄 Relatório gravado: ${REPORT_FILE}`);
  } catch (e) {
    console.warn(`Aviso: não foi possível gravar relatório — ${e?.message}`);
  }
});
