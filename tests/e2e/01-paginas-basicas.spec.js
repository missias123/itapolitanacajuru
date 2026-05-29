// Testes: 01-paginas-basicas.spec.js
// Verifica que as páginas principais carregam sem erros de JS no console
// e que elementos essenciais estão presentes.

import { test, expect } from '@playwright/test';

const PAGES = [
  { name: 'Home',        path: '/',                selector: '.brand, [data-testid="logo"], h1' },
  { name: 'Fidelidade',  path: '/', selector: 'h1, .fid-titulo, #fid-celular' },
  { name: 'Promoções',   path: '/promocao.html',   selector: 'h1, .promo-titulo, main' },
  { name: 'Encomendas',  path: '/encomendas.html', selector: 'h1, form, .enc-form' },
];

for (const { name, path, selector } of PAGES) {
  test(`[${name}] carrega sem erros de JS no console`, async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto(path, { waitUntil: 'domcontentloaded' });

    // Aguarda um pouco para scripts inline executarem
    await page.waitForTimeout(1500);

    expect(jsErrors, `Erros JS encontrados em ${path}: ${jsErrors.join(', ')}`).toHaveLength(0);
  });

  test(`[${name}] elementos principais aparecem`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Ao menos um dos seletores deve estar visível
    const el = page.locator(selector).first();
    await expect(el).toBeVisible({ timeout: 6000 });
  });
}

test('[Home] título da página está correto', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Itapolitana|Sorveteria|Cajuru/i);
});

test('[Home] manifest.json está acessível', async ({ page }) => {
  const resp = await page.goto('/manifest.json');
  expect(resp?.status()).toBe(200);
  const body = await resp?.text();
  const json = JSON.parse(body ?? '{}');
  expect(json.name).toBeTruthy();
  expect(json.icons?.length).toBeGreaterThan(0);
});
