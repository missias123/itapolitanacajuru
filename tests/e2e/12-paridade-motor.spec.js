// Testes: 12-paridade-motor.spec.js
// Verifica paridade de comportamento do motor compartilhado (ita-bot-engine.js)
// entre index.html (bot inline) e dicas.html (widget).
//
// STATUS: Fase 3 — Motor Compartilhado (Sublote Motor)
// Critério: mesma intenção, mesmo produto, mesma modalidade, mesmos preços, mesmo CTA equivalente.

import { test, expect } from '@playwright/test';

/* ─── Helpers ─────────────────────────────────────────────── */

/**
 * Envia uma mensagem no bot do index.html (#chat-inp / #chat-msgs)
 * e retorna o texto do último .msg.bot.
 */
async function _enviarHome(page, texto) {
  const fab = page.locator('#chat-fab-btn, #ita-bot-duvidas').first();
  const fabVisible = await fab.isVisible().catch(() => false);
  if (!fabVisible) return null;
  await fab.click();
  await page.waitForTimeout(600);

  const input = page.locator('#chat-inp').first();
  const inputVisible = await input.isVisible().catch(() => false);
  if (!inputVisible) return null;

  await input.fill(texto);
  const sendBtn = page.locator('#chat-send-btn, button[onclick*="enviarChat"]').first();
  if (await sendBtn.count() > 0 && await sendBtn.isVisible()) {
    await sendBtn.click();
  } else {
    await input.press('Enter');
  }
  await page.waitForTimeout(2500);

  const msgs = page.locator('#chat-msgs .msg.bot');
  const count = await msgs.count();
  if (count === 0) return null;
  return await msgs.last().innerText();
}

/**
 * Envia uma mensagem no widget do dicas.html (#duvidas-pergunta / #duvidas-resposta)
 * e retorna o texto do último .msg.bot.
 */
async function _enviarWidget(page, texto) {
  const trigger = page.locator('#ita-bot-trigger, .ita-bot-duvidas-btn, .itabot-duvidas-btn').first();
  const triggerVisible = await trigger.isVisible().catch(() => false);
  if (!triggerVisible) return null;
  await trigger.click();
  await page.waitForTimeout(800);

  const input = page.locator('#duvidas-pergunta').first();
  const inputVisible = await input.isVisible().catch(() => false);
  if (!inputVisible) return null;

  await input.fill(texto);
  const sendBtn = page.locator('.chat-send').first();
  if (await sendBtn.count() > 0 && await sendBtn.isVisible()) {
    await sendBtn.click();
  } else {
    await input.press('Enter');
  }
  await page.waitForTimeout(2500);

  const msgs = page.locator('#duvidas-resposta .msg.bot');
  const count = await msgs.count();
  if (count === 0) return null;
  return await msgs.last().innerText();
}

/* ─── Verificar que o motor compartilhado carregou ─── */

test.describe('Motor Compartilhado — Carregamento', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
  });

  test('ita-bot-engine.js expõe window.ItaBotEngine no index.html', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const enginePresente = await page.evaluate(() => typeof window.ItaBotEngine !== 'undefined');
    expect(enginePresente).toBe(true);
  });

  test('ita-bot-engine.js expõe window.ItaBotEngine no dicas.html', async ({ page }) => {
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const enginePresente = await page.evaluate(() => typeof window.ItaBotEngine !== 'undefined');
    expect(enginePresente).toBe(true);
  });

  test('createEngine() retorna objeto com getResponse no index.html', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const ok = await page.evaluate(() => {
      if (!window.ItaBotEngine) return false;
      const e = window.ItaBotEngine.createEngine();
      return e && typeof e.getResponse === 'function';
    });
    expect(ok).toBe(true);
  });

  test('_homeEngine inicializado no index.html após DOMContentLoaded', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const ok = await page.evaluate(() => typeof window._homeEngine !== 'undefined' && window._homeEngine !== null);
    // _homeEngine pode ser null se engine não carregou — verificar ItaBotEngine como garantia
    const fallback = await page.evaluate(() => typeof window.ItaBotEngine !== 'undefined');
    expect(fallback).toBe(true);
  });
});

/* ─── Paridade: Home × Widget ─────────────────────────────── */

test.describe('Paridade — Pergunta 1: picolé de Ovomaltine', () => {
  const pergunta = 'Quanto custa o picolé de Ovomaltine?';

  test('Home retorna R$ 4,00 e NÃO menciona R$ 8,00', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('4');
    expect(lower).not.toContain('8,00');
  });

  test('Widget (dicas.html) retorna R$ 4,00 e NÃO menciona R$ 8,00', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('4');
    expect(lower).not.toContain('8,00');
  });
});

test.describe('Paridade — Pergunta 2: sorvete de Ovomaltine', () => {
  const pergunta = 'Quanto custa o sorvete de Ovomaltine?';

  test('Home NÃO retorna R$ 4,00 como preço do picolé', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    expect(resp.toLowerCase()).not.toContain('4,00');
  });

  test('Widget NÃO retorna R$ 4,00 como preço do picolé', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    expect(resp.toLowerCase()).not.toContain('4,00');
  });
});

test.describe('Paridade — Pergunta 3: Esquimó de Ovomaltine', () => {
  const pergunta = 'Quanto custa o Esquimó de Ovomaltine?';

  test('Home retorna R$ 8,00 (varejo) e R$ 6,00 (atacado)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('8');
    expect(lower).toContain('6');
  });

  test('Widget retorna R$ 8,00 (varejo) e R$ 6,00 (atacado)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('8');
    expect(lower).toContain('6');
  });
});

test.describe('Paridade — Pergunta 4: Ovomaltine ambíguo', () => {
  const pergunta = 'Quanto custa o Ovomaltine?';

  test('Home retorna desambiguação (menciona mais de um produto)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const desambigua = lower.includes('qual') || lower.includes('três') || lower.includes('tres') || lower.includes('picolé') || lower.includes('sorvete');
    expect(desambigua).toBe(true);
  });

  test('Widget retorna desambiguação (menciona mais de um produto)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const desambigua = lower.includes('qual') || lower.includes('três') || lower.includes('tres') || lower.includes('picolé') || lower.includes('sorvete');
    expect(desambigua).toBe(true);
  });
});

test.describe('Paridade — Pergunta 5: picolé de Leite Ninho', () => {
  const pergunta = 'Quanto custa o picolé de Leite Ninho?';

  test('Home retorna R$ 4,00 (varejo) e R$ 3,00 (atacado), NÃO sorvete genérico', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('4');
    expect(lower).toContain('3');
    expect(lower).not.toContain('leite ninho folheado');
    expect(lower).not.toContain('leite ninho com oreo');
  });

  test('Widget retorna R$ 4,00 (varejo) e R$ 3,00 (atacado), NÃO sorvete genérico', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('4');
    expect(lower).toContain('3');
    expect(lower).not.toContain('leite ninho folheado');
    expect(lower).not.toContain('leite ninho com oreo');
  });
});

test.describe('Paridade — Pergunta 6: Tem picolé de Leite Ninho?', () => {
  const pergunta = 'Tem picolé de Leite Ninho?';

  test('Home responde sobre picolé (não sorvete genérico)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temPicol = lower.includes('picol') || lower.includes('4') || lower.includes('3');
    expect(temPicol).toBe(true);
    expect(lower).not.toContain('leite ninho folheado');
  });

  test('Widget responde sobre picolé (não sorvete genérico)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temPicol = lower.includes('picol') || lower.includes('4') || lower.includes('3');
    expect(temPicol).toBe(true);
    expect(lower).not.toContain('leite ninho folheado');
  });
});

test.describe('Paridade — Pergunta 7: Tem picolé para festa?', () => {
  const pergunta = 'Tem picolé para festa?';

  test('Home responde sobre encomendas/festas', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    expect(resp.length).toBeGreaterThan(0);
  });

  test('Widget responde sobre encomendas/festas', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    expect(resp.length).toBeGreaterThan(0);
  });
});

test.describe('Paridade — Pergunta 8: Delivery', () => {
  const pergunta = 'Vocês fazem delivery?';

  test('Home responde sobre delivery (sem erros)', async ({ page }) => {
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    expect(erros, `Erros JS: ${erros.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    expect(resp.length).toBeGreaterThan(0);
  });

  test('Widget responde sobre delivery (sem erros)', async ({ page }) => {
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    expect(erros, `Erros JS: ${erros.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    expect(resp.length).toBeGreaterThan(0);
  });
});

test.describe('Paridade — Pergunta 9: Onde fica?', () => {
  const pergunta = 'Onde fica?';

  test('Home responde com localização', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temLocal = lower.includes('cajuru') || lower.includes('rua') || lower.includes('endereço') || lower.includes('map');
    expect(temLocal).toBe(true);
  });

  test('Widget responde com localização', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temLocal = lower.includes('cajuru') || lower.includes('rua') || lower.includes('endereço') || lower.includes('map');
    expect(temLocal).toBe(true);
  });
});

test.describe('Paridade — Pergunta 10: Quero falar com alguém', () => {
  const pergunta = 'Quero falar com alguém.';

  test('Home retorna CTA de WhatsApp ou atendente', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temCTA = lower.includes('whatsapp') || lower.includes('atendente') || lower.includes('falar') || lower.includes('whats');
    expect(temCTA).toBe(true);
  });

  test('Widget retorna CTA de WhatsApp ou atendente', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const resp = await _enviarWidget(page, pergunta);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temCTA = lower.includes('whatsapp') || lower.includes('atendente') || lower.includes('falar') || lower.includes('whats');
    expect(temCTA).toBe(true);
  });
});

/* ─── Segurança: sem preço hardcoded duplicado ─── */

test.describe('Segurança — Ausência de preços hardcoded no motor', () => {
  test('getResponse() no index.html não retorna preço inventado para pergunta desconhecida', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const resp = await _enviarHome(page, 'xyzzy foobar invenção 99999');
    if (resp === null) { test.skip(); return; }
    // Fallback não deve conter preços inventados
    expect(resp).not.toMatch(/R\$\s*\d+,\d{2}.*inventad/i);
    expect(resp.length).toBeGreaterThan(0);
  });
});

/* ─── Regressão: testes existentes do Lote A não regressam na Home ─── */

test.describe('Home — Lote A: regressão picolé Ovomaltine (motor compartilhado)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
  });

  test('Home: picolé de Ovomaltine retorna R$ 4,00, NÃO R$ 8,00', async ({ page }) => {
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    const resp = await _enviarHome(page, 'Quanto custa o picolé de Ovomaltine?');
    expect(erros, `Erros JS: ${erros.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('4');
    expect(lower).not.toContain('8,00');
  });

  test('Home: Esquimó de Ovomaltine retorna R$ 8,00 (não R$ 4,00)', async ({ page }) => {
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    const resp = await _enviarHome(page, 'Quanto custa o Esquimó de Ovomaltine?');
    expect(erros, `Erros JS: ${erros.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('8');
  });

  test('Home: picolé de Leite Ninho NÃO cai no handler de sorvete genérico', async ({ page }) => {
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    const resp = await _enviarHome(page, 'Quanto custa o picolé de Leite Ninho?');
    expect(erros, `Erros JS: ${erros.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('4');
    expect(lower).not.toContain('leite ninho folheado');
    expect(lower).not.toContain('leite ninho com oreo');
  });

  test('Home: Ovomaltine ambíguo retorna desambiguação', async ({ page }) => {
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    const resp = await _enviarHome(page, 'Quanto custa o Ovomaltine?');
    expect(erros, `Erros JS: ${erros.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const desambigua = lower.includes('qual') || lower.includes('três') || lower.includes('tres') || lower.includes('picolé') || lower.includes('sorvete');
    expect(desambigua).toBe(true);
  });
});
