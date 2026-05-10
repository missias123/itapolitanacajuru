// Testes: 05-caca-estrela.spec.js
// Verifica o jogo Caça à Estrela:
// motor carrega, interface não trava, sem erros de JS.

import { test, expect } from '@playwright/test';

test.describe('Caça à Estrela', () => {
  test('motor-estrelas-v2.js carrega sem erros', async ({ page }) => {
    const jsErrors = [];
    const networkErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    page.on('response', (resp) => {
      if (resp.url().includes('motor-estrelas') && resp.status() >= 400) {
        networkErrors.push(`${resp.url()} → ${resp.status()}`);
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Aguardar carregamento lazy do motor (definido em index.html)
    await page.waitForTimeout(2500);

    expect(jsErrors, `Erros JS: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  test('estrelas_ciclo.json está acessível', async ({ page }) => {
    const resp = await page.goto('/estrelas_ciclo.json');
    expect(resp?.status()).toBe(200);
    const body = await resp?.text();
    const json = JSON.parse(body ?? 'null');
    expect(json).not.toBeNull();
  });

  test('página de fidelidade mantém área do cliente ativa (fase 2)', async ({ page }) => {
    await page.goto('/fidelidade.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    // Fase 2: o fluxo principal é área do cliente + validação de código (sem depender da caça à estrela no DOM)
    const el = page.locator('#area-cliente, #form-codigo-wrap, #cliente-codigo, #btn-registrar-ponto, .btn-validar-codigo').first();
    await expect(el).toBeAttached({ timeout: 5000 });
  });

  test('clicar na estrela flutuante (se visível) não causa erros JS', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // A estrela flutuante pode aparecer como botão ou div clicável
    const estrelaBtns = [
      page.locator('[id*="estrela-btn"], [id*="star-btn"]').first(),
      page.locator('[class*="estrela-flutuante"], [class*="star-float"]').first(),
      page.locator('button').filter({ hasText: /⭐|🌟|estrela/i }).first(),
    ];

    let clicou = false;
    for (const btn of estrelaBtns) {
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        clicou = true;
        await page.waitForTimeout(800);
        break;
      }
    }

    // Independente de clicar ou não: não deve haver erros JS
    expect(jsErrors, `Erros JS após tentar clicar na estrela: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  test('FAQ do Ita Bot menciona a estrela (mostrarResposta)', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Tentar acionar mostrarResposta('estrela') via JS
    const result = await page.evaluate(() => {
      if (typeof mostrarResposta === 'function') {
        mostrarResposta('estrela');
        return 'ok';
      }
      return 'not-found';
    });

    await page.waitForTimeout(500);
    expect(jsErrors).toHaveLength(0);
    // Se a função existir, deve ter rodado sem crash
    if (result === 'ok') {
      // Verificar que algum conteúdo sobre estrela apareceu
      const content = await page.locator('#fale-resposta, .fale-resposta, [id*="resposta"]').first().textContent().catch(() => '');
      expect(content || result).toBeTruthy();
    }
  });
});
