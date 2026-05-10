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
});
