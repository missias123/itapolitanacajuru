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
      // Simula teclado virtual: reduz --itabot-panel-h (como visualViewport faz em produção)
      // e ajusta --itabot-kb-offset para scroll das mensagens.
      document.documentElement.style.setProperty('--itabot-kb-offset', '260px');
      document.documentElement.style.setProperty('--itabot-panel-h', '584px'); // 844 - 260
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
