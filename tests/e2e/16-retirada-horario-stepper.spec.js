import { test, expect } from '@playwright/test';

test.describe('Retirada - horário por setas', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const RealDate = Date;
      const fixedNow = new RealDate('2026-09-03T15:00:00-03:00').valueOf();
      class MockDate extends RealDate {
        constructor(...args) {
          super(args.length ? args[0] : fixedNow);
        }
        static now() { return fixedNow; }
      }
      window.Date = MockDate;
    });
    await page.goto('/retirada.html?demo-retirada=aberta', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.getByLabel(/Nome completo de quem vai retirar/i).fill('Teste Retirada');
    await page.getByLabel(/WhatsApp de quem vai retirar/i).fill('99999-9999');
  });

  test('ajusta hora e minuto sem digitação livre', async ({ page }) => {
    const timeInput = page.locator('#pickup-time');
    await expect(timeInput).toHaveAttribute('readonly', '');
    await expect(timeInput).toHaveValue('16:00');

    await page.getByRole('button', { name: /Aumentar 1 minuto/i }).click();
    await expect(timeInput).toHaveValue('16:01');
    await expect(page.locator('#pickup-time-minute')).toHaveText('01');

    await page.getByRole('button', { name: /Aumentar 1 hora/i }).click();
    await expect(timeInput).toHaveValue('17:01');
    await expect(page.locator('#pickup-time-hour')).toHaveText('17');
  });

  test('respeita 1 hora de antecedência e permite subir até a faixa das 21h com minutos', async ({ page }) => {
    const timeInput = page.locator('#pickup-time');
    await page.addInitScript(() => {
      const RealDate = Date;
      const fixedNow = new RealDate('2026-09-03T14:43:00-03:00').valueOf();
      class MockDate extends RealDate {
        constructor(...args) {
          super(args.length ? args[0] : fixedNow);
        }
        static now() { return fixedNow; }
      }
      window.Date = MockDate;
    });
    await page.goto('/retirada.html?demo-retirada=aberta', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.getByLabel(/Nome completo de quem vai retirar/i).fill('Teste Retirada');
    await page.getByLabel(/WhatsApp de quem vai retirar/i).fill('99999-9999');

    await expect(timeInput).toHaveValue('15:43');
    await page.getByRole('button', { name: /Aumentar 1 hora/i }).click();
    await expect(timeInput).toHaveValue('16:43');

    for (let i = 0; i < 5; i += 1) await page.getByRole('button', { name: /Aumentar 1 hora/i }).click();
    await expect(timeInput).toHaveValue('21:43');
    await expect(page.getByRole('button', { name: /Aumentar 1 hora/i })).toBeDisabled();

    await page.getByRole('button', { name: /Aumentar 1 minuto/i }).click();
    await expect(timeInput).toHaveValue('21:44');
    await page.getByRole('button', { name: /Aumentar 1 minuto/i }).click();
    await expect(timeInput).toHaveValue('21:45');
  });
});
