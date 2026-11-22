import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.AUDIT_PORT || 8176);
const base = `http://127.0.0.1:${port}`;
const reportPath = path.join(root, 'test-results', 'music-player-behavior-audit.json');

const browserPathCandidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
].filter(Boolean);

async function resolveExecutablePath() {
  for (const candidate of browserPathCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch (_) {}
  }
  throw new Error('Nenhum navegador compatível encontrado para Puppeteer.');
}

function waitForChildExit(child) {
  if (!child || child.exitCode !== null || child.killed) return Promise.resolve();
  return new Promise((resolve) => child.once('exit', resolve));
}

const server = spawn(process.execPath, ['tests/local-static-server.mjs'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString();
});

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (serverOutput.includes('STATIC_SERVER_READY')) return;
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  throw new Error(`Servidor local não iniciou: ${serverOutput}`);
}

async function withPage(browser, viewport, fn) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

function intersects(a, b) {
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return x > 0 && y > 0;
}

const report = {
  generatedAt: new Date().toISOString(),
  base,
  checks: {},
};

let browser;
try {
  await waitForServer();
  const executablePath = await resolveExecutablePath();
  browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1) Sem requisição de áudio antes do clique + play/pause real
  const mediaCheck = await withPage(
    browser,
    { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
    async (page) => {
      const audioRequests = [];
      page.on('request', (request) => {
        if (request.url().includes('/media/audio/itapolitana-trilha-20261122.mpeg')) {
          audioRequests.push(request.url());
        }
      });

      await page.goto(`${base}/index.html?music-player-behavior=media`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('#itap-music-player-toggle', { timeout: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const beforeClickRequests = audioRequests.length;
      assert.equal(beforeClickRequests, 0, 'não deve haver download do áudio antes do clique');

      await page.click('#itap-music-player-toggle');
      await page.waitForFunction(() => document.querySelector('#itap-music-player-toggle')?.textContent?.includes('Pausar música'), { timeout: 15000 });
      const requestsAfterPlay = audioRequests.length;
      assert.ok(requestsAfterPlay >= 1, 'deve requisitar áudio após clique em tocar');

      await page.click('#itap-music-player-toggle');
      await page.waitForFunction(() => document.querySelector('#itap-music-player-toggle')?.textContent?.includes('Ouça nossa música'), { timeout: 10000 });
      const statusText = await page.$eval('#itap-music-player-status', (el) => el.textContent.trim());
      assert.match(statusText, /Pausado\./, 'status deve anunciar pausa');

      return { beforeClickRequests, requestsAfterPlay, statusText };
    }
  );
  report.checks.mediaFlow = mediaCheck;

  // 2) Erro/retry funcional
  const retryCheck = await withPage(
    browser,
    { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
    async (page) => {
      await page.evaluateOnNewDocument(() => {
        const originalPlay = HTMLMediaElement.prototype.play;
        let firstFailure = true;
        HTMLMediaElement.prototype.play = function (...args) {
          var src = (this.currentSrc || this.src || '').toString();
          if (firstFailure && src.includes('/media/audio/itapolitana-trilha-20261122.mpeg')) {
            firstFailure = false;
            return Promise.reject(new DOMException('Simulated playback failure', 'NotSupportedError'));
          }
          return originalPlay.apply(this, args);
        };
      });

      await page.goto(`${base}/index.html?music-player-behavior=retry`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('#itap-music-player-toggle', { timeout: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 800));

      await page.click('#itap-music-player-toggle');
      await page.waitForFunction(() => {
        const text = document.querySelector('#itap-music-player-status')?.textContent || '';
        return text.includes('Não foi possível') || text.includes('Erro ao carregar');
      }, { timeout: 10000 });

      const errorStatus = await page.$eval('#itap-music-player-status', (el) => el.textContent.trim());
      assert.match(errorStatus, /(Não foi possível|Erro ao carregar)/, 'deve exibir erro de reprodução');

      await page.click('#itap-music-player-toggle');
      await page.waitForFunction(() => document.querySelector('#itap-music-player-toggle')?.textContent?.includes('Pausar música'), { timeout: 15000 });

      const recoveredStatus = await page.$eval('#itap-music-player-status', (el) => el.textContent.trim());
      assert.match(recoveredStatus, /Tocando agora\./, 'retry deve recuperar reprodução');

      return { simulatedError: true, errorStatus, recoveredStatus };
    }
  );
  report.checks.retryFlow = retryCheck;

  // 3) Layout e sobreposição em mobile/desktop
  const layoutCases = [
    { name: 'mobile-index', path: 'index.html', viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
    { name: 'mobile-encomendas', path: 'encomendas.html', viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
    { name: 'mobile-admin-painel', path: 'admin-painel.html', viewport: { width: 320, height: 700, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
    { name: 'mobile-admin-catalogo', path: 'admin-catalogo.html', viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
    { name: 'mobile-retirada', path: 'retirada.html', viewport: { width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
    { name: 'mobile-privacidade', path: 'politica-privacidade.html', viewport: { width: 320, height: 700, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
    { name: 'desktop-index', path: 'index.html', viewport: { width: 1280, height: 800, isMobile: false, hasTouch: false, deviceScaleFactor: 1 } },
    { name: 'desktop-encomendas', path: 'encomendas.html', viewport: { width: 1280, height: 800, isMobile: false, hasTouch: false, deviceScaleFactor: 1 } },
  ];
  const layoutResults = [];

  for (const layoutCase of layoutCases) {
      const pageResult = await withPage(browser, layoutCase.viewport, async (page) => {
        await page.goto(`${base}/${layoutCase.path}?music-player-behavior=layout-${layoutCase.name}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('#itap-music-player', { timeout: 10000 });
        await page.evaluate(() => {
          const banner = document.getElementById('cookie-banner');
          if (banner) {
            banner.style.display = 'block';
            document.body.classList.add('cookie-banner-open');
          }
          if (window.location.pathname.endsWith('/encomendas.html') || window.location.pathname.endsWith('encomendas.html')) {
            window.carrinho = [{
              id: 'teste-layout',
              tipo: 'Teste',
              nome: 'Item teste',
              preco: 10,
              quantidade: 1,
              precoUnit: 10,
              sabores: [],
              isPicole: false,
              isAcrescimo: false,
            }];
            if (typeof window.atualizarCarrinhoFixo === 'function') window.atualizarCarrinhoFixo();
          }
        });
        await new Promise((resolve) => setTimeout(resolve, 1600));

        const data = await page.evaluate(() => {
          const player = document.getElementById('itap-music-player');
          const playerButton = document.getElementById('itap-music-player-toggle');
          const selectors = ['#cookie-banner', '#itabot-launcher', '#btn-carrinho-fixo', '#btn-carrinho', '[data-order-window]'];
          const playerRect = player?.getBoundingClientRect();

          const controls = selectors.flatMap((selector) => {
            return Array.from(document.querySelectorAll(selector)).map((el) => {
              const s = getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              const visible = s.display !== 'none' && s.visibility !== 'hidden' && s.pointerEvents !== 'none' && rect.width > 2 && rect.height > 2;
              return {
                selector,
                visible,
                rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
              };
            });
          });

          const btnStyle = playerButton ? getComputedStyle(playerButton) : null;

          return {
            playerRect: playerRect ? { left: playerRect.left, top: playerRect.top, right: playerRect.right, bottom: playerRect.bottom, width: playerRect.width, height: playerRect.height } : null,
            controls,
            buttonFontSizePx: btnStyle ? Number.parseFloat(btnStyle.fontSize) : 0,
            statusFontSizePx: Number.parseFloat(getComputedStyle(document.getElementById('itap-music-player-status')).fontSize),
          };
        });

        assert.ok(data.playerRect, 'player deve existir no layout');
        assert.ok(data.buttonFontSizePx >= 13, 'botão deve ter texto legível no celular/desktop');
        assert.ok(data.statusFontSizePx >= 13, 'status deve ter texto legível');

        const overlaps = [];
        for (const control of data.controls) {
          if (!control.visible) continue;
          if (intersects(data.playerRect, control.rect)) {
            overlaps.push(control.selector);
          }
        }

        assert.deepEqual(overlaps, [], `player não deve sobrepor controles importantes (${layoutCase.name})`);
        return { case: layoutCase.name, overlaps, playerRect: data.playerRect };
      });
      layoutResults.push(pageResult);
  }

  report.checks.layout = layoutResults;

  // 4) Sanidade de loop/mutações contínuas e custo de posicionamento
  const stabilityCheck = await withPage(
    browser,
    { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
    async (page) => {
      await page.goto(`${base}/index.html?music-player-behavior=stability`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('#itap-music-player', { timeout: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 800));

      const data = await page.evaluate(async () => {
        var player = document.getElementById('itap-music-player');
        var styleMutations = 0;
        var classMutations = 0;
        var observer = new MutationObserver(function (mutations) {
          for (var i = 0; i < mutations.length; i += 1) {
            var target = mutations[i].target;
            if (target === player || (target && target.closest && target.closest('#itap-music-player'))) {
              if (mutations[i].attributeName === 'style') styleMutations += 1;
              if (mutations[i].attributeName === 'class') classMutations += 1;
            }
          }
        });
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'open'],
        });

        await new Promise((resolve) => setTimeout(resolve, 2200));
        var styleDuringIdle = styleMutations;
        var classDuringIdle = classMutations;

        var dispatchStarted = performance.now();
        for (var i = 0; i < 25; i += 1) {
          window.dispatchEvent(new Event('resize'));
          window.dispatchEvent(new Event('scroll'));
        }
        var dispatchElapsed = performance.now() - dispatchStarted;
        await new Promise((resolve) => setTimeout(resolve, 600));
        var styleAfterBurst = styleMutations;
        var classAfterBurst = classMutations;
        observer.disconnect();

        return {
          styleDuringIdle,
          classDuringIdle,
          styleAfterBurst,
          classAfterBurst,
          burstElapsedMs: Number(dispatchElapsed.toFixed(2)),
          burstAverageMs: Number((dispatchElapsed / 25).toFixed(2)),
        };
      });

      assert.ok(data.styleDuringIdle <= 4, `player não deve gerar mutações contínuas de estilo em idle (style=${data.styleDuringIdle})`);
      assert.ok(data.classDuringIdle <= 2, `player não deve alternar classes continuamente em idle (class=${data.classDuringIdle})`);
      assert.ok(data.styleAfterBurst <= 40, `player deve manter reflows controlados sob eventos (style=${data.styleAfterBurst})`);
      assert.ok(data.burstAverageMs < 12, `applySafePlacement deve ser leve (média=${data.burstAverageMs}ms)`);

      return data;
    }
  );
  report.checks.stability = stabilityCheck;

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ok: true, reportPath, checks: report.checks }, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await waitForChildExit(server);
}
