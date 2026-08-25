import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  '/',
  '/encomendas.html',
  '/promocao.html',
  '/dicas.html',
  '/sobre.html',
  '/carrossel.html',
  '/offline.html',
  '/retirada.html',
  '/politica-privacidade.html',
  '/admin-painel.html',
  '/admin-catalogo.html',
  '/admin-picole.html',
];

async function boot(page, url = '/') {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
  return { response, pageErrors };
}

test.describe('Auditoria semanal — rotas e carregamento', () => {
  for (const url of PUBLIC_PAGES) {
    test(`${url} responde e não gera pageerror`, async ({ page }) => {
      const { response, pageErrors } = await boot(page, url);
      expect(response, `sem resposta para ${url}`).not.toBeNull();
      expect(response.status(), `HTTP inválido para ${url}`).toBe(200);
      expect(pageErrors, `pageerror em ${url}`).toEqual([]);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Auditoria semanal — cabeçalho e responsividade', () => {
  test('mede 360/390/430/768/1280px sem overflow; mobile segue 1+2×2, 54–60px, gap 8–10px e borda de 2px', async ({ browser }) => {
    const viewports = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 900 },
    ];
    const failures = [];

    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const { response, pageErrors } = await boot(page, 'http://localhost:8080/');
      if (!response || response.status() !== 200) failures.push(`${viewport.width}px: HTTP inválido`);
      if (pageErrors.length) failures.push(`${viewport.width}px: pageerror ${pageErrors.join('; ')}`);

      const report = await page.evaluate(() => {
        const container = document.querySelector('.itap-nav-container');
        const buttons = container ? [...container.querySelectorAll('.itap-nav-btn')] : [];
        const rects = buttons.map((button) => {
          const r = button.getBoundingClientRect();
          const s = getComputedStyle(button);
          return { x: r.x, y: r.y, width: r.width, height: r.height, border: s.border, text: (button.innerText || '').trim() };
        });
        return {
          count: buttons.length,
          container: container ? {
            display: getComputedStyle(container).display,
            gap: parseFloat(getComputedStyle(container).gap) || 0,
          } : null,
          rects,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          clientWidth: document.documentElement.clientWidth,
        };
      });

      if (!report.container) {
        failures.push(`${viewport.width}px: container ausente`);
      } else {
        if (report.count !== 5) failures.push(`${viewport.width}px: ${report.count} botões em vez de 5`);
        if (report.scrollWidth > report.clientWidth + 1) failures.push(`${viewport.width}px: overflow ${report.scrollWidth}/${report.clientWidth}`);
        if (viewport.width <= 600) {
          if (report.container.display !== 'grid') failures.push(`${viewport.width}px: display ${report.container.display} em vez de grid`);
          if (report.container.gap < 8 || report.container.gap > 10) failures.push(`${viewport.width}px: gap ${report.container.gap}px fora de 8–10px`);
          if (!report.rects.every((r) => r.height >= 54 && r.height <= 60)) failures.push(`${viewport.width}px: altura fora de 54–60px (${report.rects.map((r) => r.height).join(', ')})`);
          if (!report.rects.every((r) => r.border.includes('2px'))) failures.push(`${viewport.width}px: borda sem 2px`);
          const feedback = report.rects.find((r) => r.text.includes('FEEDBACK'));
          const rest = report.rects.filter((r) => r !== feedback);
          if (!feedback) failures.push(`${viewport.width}px: Feedback ausente`);
          else {
            if (!(feedback.width > Math.max(...rest.map((r) => r.width)))) failures.push(`${viewport.width}px: Feedback não ocupa linha completa`);
            if (new Set(rest.map((r) => r.y)).size !== 2) failures.push(`${viewport.width}px: demais botões não formam duas linhas`);
            if (new Set(rest.map((r) => r.x)).size !== 2) failures.push(`${viewport.width}px: demais botões não formam duas colunas`);
          }
        }
      }
      await context.close();
    }

    expect(failures, 'falhas dimensionais do cabeçalho').toEqual([]);
  });
});

test.describe('Auditoria semanal — ItaBot', () => {
  test('tem um launcher único, fixo, acessível e abre Dúvidas no clique normal', async ({ page }) => {
    await boot(page, '/');
    const launcher = page.locator('#itabot-launcher');
    await expect(launcher).toHaveCount(1);
    await expect(launcher).toBeVisible();
    const style = await launcher.evaluate((element) => {
      const computed = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        position: computed.position,
        width: rect.width,
        height: rect.height,
        ariaHidden: element.getAttribute('aria-hidden'),
        label: (element.innerText || element.getAttribute('aria-label') || '').trim(),
      };
    });
    expect(style.position).toBe('fixed');
    expect(style.width).toBeGreaterThan(80);
    expect(style.height).toBeGreaterThan(80);
    expect(style.ariaHidden).not.toBe('true');
    expect(style.label.toUpperCase()).toContain('DÚVIDAS');

    await launcher.click();
    await expect(page.locator('#chat-dialog')).toBeVisible();
    await expect(page.locator('#itabot-whatsapp-form')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('não permanece sobre o rodapé quando chega ao fim da página', async ({ page }) => {
    await boot(page, '/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(450);
    const result = await page.evaluate(() => {
      const launcher = document.querySelector('#itabot-launcher');
      const footer = document.querySelector('footer');
      if (!launcher || !footer) return { intersects: false };
      const lr = launcher.getBoundingClientRect();
      const fr = footer.getBoundingClientRect();
      const visible = getComputedStyle(launcher).display !== 'none' && getComputedStyle(launcher).visibility !== 'hidden' && lr.width > 0 && lr.height > 0;
      return { intersects: visible && lr.bottom > fr.top && lr.top < fr.bottom && lr.right > fr.left && lr.left < fr.right };
    });
    expect(result.intersects).toBeFalsy();
  });
});
