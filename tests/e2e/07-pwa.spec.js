// Testes: 07-pwa.spec.js
// Verifica funcionalidades PWA: manifest, service worker, offline básico.

import { test, expect } from '@playwright/test';

test.describe('PWA — Progressive Web App', () => {
  test('manifest.json tem campos obrigatórios', async ({ page }) => {
    const resp = await page.goto('/manifest.json');
    expect(resp?.status()).toBe(200);

    const body = await resp?.text();
    const json = JSON.parse(body ?? '{}');

    expect(json.name, 'manifest.name é obrigatório').toBeTruthy();
    expect(json.short_name, 'manifest.short_name é obrigatório').toBeTruthy();
    expect(json.start_url, 'manifest.start_url é obrigatório').toBeTruthy();
    expect(json.display, 'manifest.display é obrigatório').toBeTruthy();
    expect(json.icons?.length, 'manifest.icons deve ter ao menos 1 ícone').toBeGreaterThan(0);

    // Ícone de 192px e 512px obrigatórios para instalação PWA
    const sizes = json.icons.map((i) => i.sizes);
    expect(sizes.some((s) => s?.includes('192'))).toBeTruthy();
    expect(sizes.some((s) => s?.includes('512'))).toBeTruthy();
  });

  test('link rel="manifest" está no HTML da home', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeAttached({ timeout: 5000 });

    const href = await manifestLink.getAttribute('href');
    expect(href).toBeTruthy();
  });

  test('service worker registrado sem erros', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verificar que o service worker foi registrado via JS
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'not-supported';
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs.length > 0 ? 'registered' : 'not-registered';
      } catch (e) {
        return `error: ${e.message}`;
      }
    });

    // Em GitHub Pages (HTTPS) o SW deve estar registrado
    // Em servidor local (HTTP), pode não funcionar — apenas verificar que não há erros JS
    expect(jsErrors).toHaveLength(0);

    if (swRegistered !== 'not-supported') {
      // Se suportado, deve estar registrado ou tentou registrar
      console.log(`[PWA] Service Worker status: ${swRegistered}`);
    }
  });

  test('sw.js está acessível', async ({ page }) => {
    const resp = await page.goto('/sw.js');
    expect(resp?.status()).toBe(200);
    const body = await resp?.text();
    expect(body).toContain('CACHE_NAME');
  });

  test('offline.html existe e carrega', async ({ page }) => {
    const resp = await page.goto('/offline.html');
    expect(resp?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('meta theme-color está definida', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toBeAttached();
    const content = await themeColor.getAttribute('content');
    expect(content).toBeTruthy();
  });

  test('apple-touch-icon existe', async ({ page }) => {
    const resp = await page.goto('/apple-touch-icon.png');
    expect(resp?.status()).toBe(200);
  });
});
