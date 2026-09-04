import { test, expect } from '@playwright/test';

const CART_SEED = JSON.stringify([{
  key: 'stepper-seed',
  sku: 'SVM-COPO-02',
  name: 'Copo',
  size: '2 Bolas',
  category: 'Sorvetes de massa',
  type: 'produto',
  price: 10,
  flavors: [{ name: 'Abacaxi Suíço' }, { name: 'Amarena' }],
  flavorPreferences: [],
  flavorDistribution: '',
  boxAddOns: [],
  includedExtras: [],
  fixedIngredients: [],
  serviceMode: 'travel',
  containerType: '',
  cakeChoice: '',
  packagingSku: 'EMB-VIAGEM',
  packagingName: 'Embalagem para viagem',
  packagingFee: 1,
  packagingIncluded: false,
  quantity: 1
}]);

test.describe('Retirada - fluxo inline do formulário', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((seed) => {
      const RealDate = Date;
      const fixedNow = new RealDate('2026-09-03T15:00:00-03:00').valueOf();
      class MockDate extends RealDate {
        constructor(...args) {
          super(args.length ? args[0] : fixedNow);
        }
        static now() { return fixedNow; }
      }
      window.Date = MockDate;
      window.localStorage.setItem('itap_retirada_v1', seed);
    }, CART_SEED);
    await page.goto('/retirada.html?demo-retirada=aberta', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: /ver pedido/i }).click();
    await expect(page.locator('#cart-dialog')).toHaveAttribute('open', '');
  });

  test('remove o erro travado ao concluir as etapas e envia o pedido', async ({ page }) => {
    await page.locator('#pickup-form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await expect(page.locator('#form-error')).toContainText('Complete as etapas na ordem indicada antes de enviar.');

    await page.getByLabel(/Nome completo de quem vai retirar/i).fill('Teste Retirada');
    await page.getByLabel(/WhatsApp de quem vai retirar/i).fill('99999-9999');
    await page.getByRole('button', { name: /Aumentar 1 minuto/i }).click();
    await page.getByRole('button', { name: /Confirmar pagamento na loja/i }).click();
    await page.getByRole('button', { name: /Continuar para confirmação/i }).click();
    await page.getByLabel(/Estou ciente/i).check();

    await expect(page.locator('#final-submit')).toBeEnabled();
    await expect(page.locator('#form-error')).not.toHaveClass(/is-visible/);
    await expect.poll(async () => page.locator('#form-error').textContent()).toBe('');

    await page.evaluate(() => {
      window.__capturedWhatsApp = '';
      window.open = (url) => { window.__capturedWhatsApp = String(url); return null; };
      window.ItapHorarioPedidos = { estaAberto: () => true, aviso: () => {}, textoAviso: () => '' };
    });
    await page.locator('#pickup-form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    await expect.poll(async () => page.evaluate(() => window.__capturedWhatsApp || '')).toContain('https://wa.me/');
  });
});
