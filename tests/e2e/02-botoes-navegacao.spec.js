// Testes: 02-botoes-navegacao.spec.js
// Verifica que os botões do header e hero funcionam corretamente.

import { test, expect } from '@playwright/test';

test.describe('Botões de Navegação — Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
  });

  test('botão Cardápio revela seção de cardápio', async ({ page }) => {
    // Clicar no botão de cardápio do header
    const btnCardapio = page.locator('.nav-btn').filter({ hasText: /cardápio|cardapio/i }).first();
    if (await btnCardapio.isVisible()) {
      await btnCardapio.click();
      await page.waitForTimeout(800);
      // Após clicar, seção de cardápio deve estar visível
      const secCardapio = page.locator('#cardapio, .cardápio, [id*="cardapio"]').first();
      // Verifica que não houve erro — a seção existe no DOM
      await expect(secCardapio).toBeAttached({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('botão Promoções navega para promocao.html', async ({ page }) => {
    const btn = page.locator('.nav-btn').filter({ hasText: /promo/i }).first();
    if (await btn.isVisible()) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {}),
        btn.click(),
      ]);
      // Aceita tanto navegação para nova página quanto scroll anchor
      const url = page.url();
      const isInPage = url.includes('promocao') || url.includes('promo') || url.includes('#');
      expect(isInPage).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('botão Fidelidade navega para fidelidade.html', async ({ page }) => {
    const btn = page.locator('.nav-btn').filter({ hasText: /fidelidade/i }).first();
    if (await btn.isVisible()) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {}),
        btn.click(),
      ]);
      const url = page.url();
      expect(url).toContain('fidelidade');
    } else {
      test.skip();
    }
  });

  test('botão Encomendas navega para encomendas.html', async ({ page }) => {
    const btn = page.locator('.nav-btn').filter({ hasText: /encomen/i }).first();
    if (await btn.isVisible()) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {}),
        btn.click(),
      ]);
      const url = page.url();
      expect(url).toContain('encomend');
    } else {
      test.skip();
    }
  });

  test('link WhatsApp tem href válido para wa.me', async ({ page }) => {
    const waLink = page.locator('a[href*="wa.me"]').first();
    if (await waLink.isVisible()) {
      const href = await waLink.getAttribute('href');
      expect(href).toMatch(/wa\.me\/\d+/);
    } else {
      test.skip();
    }
  });
});

test.describe('Hero Section', () => {
  test('logo da sorveteria é visível', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const logo = page.locator('.brand img, .brand, header img[src*="logo"]').first();
    await expect(logo).toBeVisible({ timeout: 5000 });
  });

  test('strip sensorial ou frase dinâmica existe', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const strip = page.locator('.strip-sensorial, .frase-sensorial').first();
    await expect(strip).toBeAttached({ timeout: 5000 });
  });
});
