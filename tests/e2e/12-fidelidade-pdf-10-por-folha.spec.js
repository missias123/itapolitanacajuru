import { test, expect } from '@playwright/test';
import fs from 'node:fs';

async function obterSenhaAdmin(request) {
  const authResp = await request.get('/dados/auth.json');
  expect(authResp.ok()).toBeTruthy();
  const auth = await authResp.json();
  return String(auth.senhaAdmin || '');
}

function criarLoteComCodigos(total = 100) {
  const codigos = Array.from({ length: total }, (_, i) => `ITA-TEST-${String(i + 1).padStart(3, '0')}`);
  return { loteNum: 999, inicio: 1, fim: total, codigos };
}

function contarPaginasHeuristica(pdfBuffer) {
  const text = pdfBuffer.toString('latin1');
  const page = (text.match(/\/Type\s*\/Page\b/g) || []).length;
  const pages = (text.match(/\/Type\s*\/Pages\b/g) || []).length;
  return Math.max(0, page - pages);
}

test.describe('Fidelidade — PDF 10/A4 (100 códigos)', () => {
  test.use({ acceptDownloads: true });

  test('gera 100 etiquetas em 10 folhas (2×5, 101,6×50,8mm)', async ({ page, request }, testInfo) => {
    const senhaAdmin = await obterSenhaAdmin(request);
    const lote = criarLoteComCodigos(100);

    await page.addInitScript((loteObj) => {
      localStorage.setItem('fid_lote_admin', JSON.stringify(loteObj));
    }, lote);

    await page.goto('/admin-painel.html', { waitUntil: 'domcontentloaded' });
    await page.fill('#inp-senha', senhaAdmin);
    await page.click('button:has-text("Entrar no Admin")');
    await expect(page.locator('#admin-app')).toBeVisible({ timeout: 15000 });

    await page.click('#nav-btn-fidelidade');

    const waitDownload = page.waitForEvent('download', { timeout: 20000 }).then((d) => ({ kind: 'download', download: d }));
    const waitPopup = page.waitForEvent('popup', { timeout: 20000 }).then((p) => ({ kind: 'popup', popup: p }));

    await page.click('button:has-text("Gerar PDF (100 códigos")');
    const result = await Promise.race([waitDownload, waitPopup]);

    if (result.kind === 'download') {
      const outPath = testInfo.outputPath('etiquetas-10-por-folha.pdf');
      await result.download.saveAs(outPath);
      const pdf = fs.readFileSync(outPath);
      const pages = contarPaginasHeuristica(pdf);
      expect(pages).toBe(10);
    } else {
      const popup = result.popup;
      await popup.waitForLoadState('domcontentloaded');
      const folhas = await popup.locator('section.folha').count();
      expect(folhas).toBe(10);

      const metaText = await popup.locator('.barra .meta').innerText();
      expect(metaText).toContain('100 códigos');
      expect(metaText).toMatch(/10\s+folha/);
      expect(metaText).toContain('2×5');
      expect(metaText).toMatch(/101\.6×50\.8\s*mm/);
      await popup.close().catch(() => {});
    }
  });
});

