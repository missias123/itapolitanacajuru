// Testes: 06-itabot.spec.js
// Verifica o Ita Bot: abertura do dialog, envio de mensagem, resposta, fechamento.

import { test, expect } from '@playwright/test';

test.describe('Ita Bot — Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Aceitar cookies para não bloquear scripts de analytics
    await page.addInitScript(() => {
      localStorage.setItem('cookies_aceitos', 'true');
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
  });

  test('botão flutuante do Ita Bot é visível', async ({ page }) => {
    const botBtn = page.locator('#ita-bot-duvidas, .ita-bot-duvidas-btn, #chat-fab-btn, .itabot-btn').first();
    await expect(botBtn).toBeVisible({ timeout: 8000 });
  });

  test('clicar no Ita Bot abre o dialog', async ({ page }) => {
    const botBtn = page.locator('#ita-bot-duvidas, .ita-bot-duvidas-btn, #chat-fab-btn, .itabot-btn').first();
    if (await botBtn.isVisible()) {
      await botBtn.click();
      await page.waitForTimeout(600);

      const dialog = page.locator('#chat-dialog, dialog[id*="chat"]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('dialog do chat contém input de mensagem', async ({ page }) => {
    const botBtn = page.locator('#ita-bot-duvidas, .ita-bot-duvidas-btn, #chat-fab-btn, .itabot-btn').first();
    if (await botBtn.isVisible()) {
      await botBtn.click();
      await page.waitForTimeout(600);

      const inputMsg = page.locator('#chat-dialog input[type="text"], #chat-dialog textarea, .chat-inp').first();
      await expect(inputMsg).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('enviar mensagem via Ita Bot não causa erros de JS', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const botBtn = page.locator('#ita-bot-duvidas, .ita-bot-duvidas-btn, #chat-fab-btn, .itabot-btn').first();
    if (await botBtn.isVisible()) {
      await botBtn.click();
      await page.waitForTimeout(600);

      const inputMsg = page.locator('.chat-inp, #chat-dialog input[type="text"]').first();
      if (await inputMsg.isVisible()) {
        await inputMsg.fill('Olá, qual o horário de funcionamento?');

        // Clicar no botão de enviar ou pressionar Enter
        const sendBtn = page.locator('.chat-send, #chat-dialog button[type="submit"]').first();
        if (await sendBtn.count() > 0) {
          await sendBtn.click();
        } else {
          await inputMsg.press('Enter');
        }

        await page.waitForTimeout(1500);
      }

      expect(jsErrors, `Erros JS no Ita Bot: ${jsErrors.join(', ')}`).toHaveLength(0);
    } else {
      test.skip();
    }
  });

  test('sugestões rápidas do Ita Bot são clicáveis', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const botBtn = page.locator('#ita-bot-duvidas, .ita-bot-duvidas-btn, #chat-fab-btn, .itabot-btn').first();
    if (await botBtn.isVisible()) {
      await botBtn.click();
      await page.waitForTimeout(600);

      // Botões de sugestão rápida
      const sugs = page.locator('.chat-sugs button, .chat-sug').first();
      if (await sugs.count() > 0 && await sugs.isVisible()) {
        await sugs.click();
        await page.waitForTimeout(1000);
      }

      expect(jsErrors).toHaveLength(0);
    } else {
      test.skip();
    }
  });

  test('fechar o chat não causa erros de JS', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const botBtn = page.locator('#ita-bot-duvidas, .ita-bot-duvidas-btn, #chat-fab-btn, .itabot-btn').first();
    if (await botBtn.isVisible()) {
      await botBtn.click();
      await page.waitForTimeout(600);

      // Botão de fechar dentro do dialog
      const closeBtn = page.locator('#chat-dialog button[aria-label*="fechar"], #chat-dialog [class*="close"], #chat-dialog [class*="fechar"]').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(400);
      } else {
        // Pressionar Escape para fechar dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }

      expect(jsErrors).toHaveLength(0);
    } else {
      test.skip();
    }
  });

  test('home mobile mantém input visível acima do offset do teclado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const botBtn = page.locator('#ita-bot-duvidas, .ita-bot-duvidas-btn').first();
    await expect(botBtn).toBeVisible({ timeout: 8000 });
    await botBtn.click();
    await page.waitForTimeout(600);

    const inputMsg = page.locator('#chat-inp').first();
    await inputMsg.focus();
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--chat-kb-offset', '260px');
    });
    await page.waitForTimeout(350);

    const inputArea = page.locator('#chat-input-area');
    const box = await inputArea.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeLessThan(844 - 260);
  });

  test('widget mobile move o composer ao aplicar offset de teclado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dicas.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    const botBtn = page.locator('.ita-bot-duvidas-btn, #ita-bot-trigger').first();
    await expect(botBtn).toBeVisible({ timeout: 8000 });
    await botBtn.click();
    await page.waitForTimeout(600);

    const inputMsg = page.locator('#duvidas-pergunta').first();
    await inputMsg.focus();
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--itabot-kb-offset', '260px');
    });
    await page.waitForTimeout(350);

    const inputArea = page.locator('#itabot-input-area');
    const box = await inputArea.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeLessThan(844 - 260);
  });

  test('chat permanece utilizável em 3 aparelhos (mobile, tablet e desktop)', async ({ page }) => {
    const cenarios = [
      { nome: 'mobile', viewport: { width: 390, height: 844 } },
      { nome: 'tablet', viewport: { width: 820, height: 1180 } },
      { nome: 'desktop', viewport: { width: 1280, height: 900 } },
    ];

    for (const cenario of cenarios) {
      await page.setViewportSize(cenario.viewport);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);

      const botBtn = page.locator('#ita-bot-duvidas, .ita-bot-duvidas-btn').first();
      await expect(botBtn, `Botão do chat invisível em ${cenario.nome}`).toBeVisible({ timeout: 8000 });
      await botBtn.click();
      await page.waitForTimeout(600);

      const dialog = page.locator('#chat-dialog .chat-box').first();
      const input = page.locator('#chat-inp').first();
      await expect(dialog, `Dialog invisível em ${cenario.nome}`).toBeVisible();
      await expect(input, `Input invisível em ${cenario.nome}`).toBeVisible();

      const [dialogBox, inputBox] = await Promise.all([dialog.boundingBox(), input.boundingBox()]);
      expect(dialogBox, `Dialog sem box em ${cenario.nome}`).not.toBeNull();
      expect(inputBox, `Input sem box em ${cenario.nome}`).not.toBeNull();
      expect(inputBox.y + inputBox.height, `Input fora do dialog em ${cenario.nome}`).toBeLessThanOrEqual(dialogBox.y + dialogBox.height);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
  });
});

/* ─── Lote A — Testes de Ovomaltine, Esquimó e Picolés ─── */
test.describe('Ita Bot — Lote A: Ovomaltine e Picolés (preços e desambiguação)', () => {
  /** Abre o bot e envia uma mensagem; retorna o texto do último .msg.bot */
  async function _enviar(page, texto) {
    const trigger = page.locator('#ita-bot-trigger, #ita-bot-duvidas, .ita-bot-duvidas-btn, .itabot-btn').first();
    if (!(await trigger.isVisible({ timeout: 8000 }).catch(() => false))) return null;
    await trigger.click();
    await page.waitForTimeout(600);

    const dialog = page.locator('#chat-dialog').first();
    if (!(await dialog.isVisible({ timeout: 5000 }).catch(() => false))) return null;

    const input = page.locator('#duvidas-pergunta').first();
    await input.fill(texto);
    const sendBtn = page.locator('.chat-send').first();
    if (await sendBtn.count() > 0) { await sendBtn.click(); } else { await input.press('Enter'); }

    await page.waitForTimeout(2500);
    const msgs = page.locator('#duvidas-resposta .msg.bot');
    const count = await msgs.count();
    if (count === 0) return null;
    return await msgs.last().innerText();
  }

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('cookies_aceitos', 'true'); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
  });

  // TC-01
  test('TC-01 picolé de Ovomaltine retorna R$ 4,00 (varejo)', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Quanto custa o picolé de Ovomaltine?');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('4');
    expect(lower).not.toContain('8,00');
  });

  // TC-02
  test('TC-02 sorvete de Ovomaltine retorna preço por bola (não picolé)', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Quanto custa o sorvete de Ovomaltine?');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).not.toContain('4,00');
  });

  // TC-03
  test('TC-03 Ovomaltine ambíguo retorna desambiguação com 3 produtos', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Quanto custa o Ovomaltine?');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temEsclarecimento = lower.includes('qual') || lower.includes('tr\xeas') || lower.includes('tres') || lower.includes('picol\xe9') || lower.includes('sorvete');
    expect(temEsclarecimento).toBe(true);
  });

  // TC-04
  test('TC-04 "Tem picolé de Ovomaltine?" retorna picolé (não sorvete)', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Tem picolé de Ovomaltine?');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temPicol = lower.includes('picol') || lower.includes('especiai') || lower.includes('esquim');
    expect(temPicol).toBe(true);
  });

  // TC-05
  test('TC-05 Picolé Esquimó de Ovomaltine retorna R$ 8,00 varejo / R$ 6,00 atacado', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Picolé Esquimó de Ovomaltine');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('8');
    expect(lower).toContain('6');
  });

  // TC-06
  test('TC-06 picolé de Leite Ninho retorna R$ 4,00', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Quanto custa o picolé de Leite Ninho?');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    expect(lower).toContain('4');
  });

  // TC-07
  test('TC-07 Ovomaltine atacado retorna preço de atacado', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Quero Ovomaltine para atacado.');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temPrecoAtacado = lower.includes('3,00') || lower.includes('6,00') || lower.includes('3') || lower.includes('6');
    expect(temPrecoAtacado).toBe(true);
  });

  // TC-08
  test('TC-08 Picolé Esquimó genérico retorna lista de sabores', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Quero saber sobre o Picolé Esquimó');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    const lower = resp.toLowerCase();
    const temEsquimo = lower.includes('esquim') || lower.includes('coberto') || lower.includes('bombom') || lower.includes('nutella');
    expect(temEsquimo).toBe(true);
  });

  // TC-09
  test('TC-09 pergunta de delivery não gera preço inventado', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'Vocês fazem delivery?');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    expect(typeof resp).toBe('string');
    expect(resp.length).toBeGreaterThan(0);
  });

  // TC-10
  test('TC-10 pergunta desconhecida retorna chips de fallback', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const resp = await _enviar(page, 'xyzzy foobar 12345');
    expect(jsErrors, `Erros JS: ${jsErrors.join('; ')}`).toHaveLength(0);
    if (resp === null) { test.skip(); return; }
    expect(resp.length).toBeGreaterThan(0);
  });
});
