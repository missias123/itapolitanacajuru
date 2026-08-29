import { test, expect } from '@playwright/test';

const mobileViewports = [
  { name: 'mobile-small', width: 320, height: 700 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'iphone-large', width: 430, height: 932 },
];

for (const viewport of mobileViewports) {
  test(`ItaBot mantém posição fixa e tamanho estável em ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/index.html?audit=itabot-stability', { waitUntil: 'domcontentloaded' });
    const launcher = page.locator('#itabot-launcher');
    await expect(launcher).toBeVisible({ timeout: 15000 });

    const first = await launcher.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { width: r.width, height: r.height, position: cs.position, pointerEvents: cs.pointerEvents };
    });
    expect(first.position).toBe('fixed');
    expect(first.pointerEvents).toBe('auto');
    expect(first.width).toBe(140);
    expect(first.height).toBe(180);

    await page.waitForTimeout(1800);
    const second = await launcher.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { width: r.width, height: r.height, position: cs.position };
    });
    expect(second.position).toBe('fixed');
    expect(second.width).toBe(first.width);
    expect(second.height).toBe(first.height);

    const collision = await launcher.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const original = el.style.pointerEvents;
      el.style.pointerEvents = 'none';
      const hits = [];
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const x = r.left + r.width * (col + 0.5) / 4;
          const y = r.top + r.height * (row + 0.5) / 4;
          const target = document.elementFromPoint(x, y);
          const control = target?.closest?.('a,button,input,textarea,select,[role="button"]');
          if (control && control !== el) hits.push(control.id || control.className || control.tagName);
        }
      }
      el.style.pointerEvents = original;
      return [...new Set(hits)];
    });
    expect(collision).toEqual([]);

    await launcher.click();
    await expect(page.locator('#chat-dialog.aberto')).toBeVisible();
  });
}
