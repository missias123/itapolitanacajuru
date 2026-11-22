import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';

const base = process.env.AUDIT_BASE || 'http://127.0.0.1:8135';

const viewports = [
  { name: 'mobile-small-portrait', width: 320, height: 640, isMobile: true, hasTouch: true },
  { name: 'mobile-small-landscape', width: 640, height: 320, isMobile: true, hasTouch: true },
  { name: 'mobile-portrait', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'mobile-landscape', width: 844, height: 390, isMobile: true, hasTouch: true },
  { name: 'tablet-portrait', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'tablet-landscape', width: 1024, height: 768, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1366, height: 768, isMobile: false, hasTouch: false }
];

function intersects(a, b) {
  if (!a || !b) return false;
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

const browser = await puppeteer.launch({ headless: true });

const page = await browser.newPage();
const results = [];

for (const viewport of viewports) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    deviceScaleFactor: 1
  });

  await page.goto(`${base}/index.html?audit-home-music-player=compact-pill`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('#itap-home-music-player', { timeout: 15000 });

  const baseline = await page.evaluate(() => {
    const player = document.getElementById('itap-home-music-player');
    const button = player?.querySelector('.itap-home-music-player__toggle');
    const icon = player?.querySelector('.itap-home-music-player__icon');
    const label = player?.querySelector('.itap-home-music-player__label');
    const audio = player?.querySelector('audio');

    const buttonRect = button?.getBoundingClientRect();
    const iconSize = icon ? window.getComputedStyle(icon).fontSize : '';

    return {
      playerCount: document.querySelectorAll('#itap-home-music-player').length,
      hasPlayer: Boolean(player),
      paused: audio ? audio.paused : null,
      srcBeforePlay: audio?.getAttribute('src') || '',
      buttonDisabled: button ? button.disabled : null,
      buttonRect: buttonRect ? { left: buttonRect.left, top: buttonRect.top, right: buttonRect.right, bottom: buttonRect.bottom, width: buttonRect.width, height: buttonRect.height } : null,
      buttonText: label?.textContent?.trim() || '',
      iconText: icon?.textContent?.trim() || '',
      iconSize,
      ariaLabel: button?.getAttribute('aria-label') || '',
      hasRetryPanel: Boolean(document.querySelector('.itap-home-music-player__status, .itap-home-music-player__retry'))
    };
  });

  assert.equal(baseline.hasPlayer, true, `${viewport.name}: player ausente na home`);
  assert.equal(baseline.playerCount, 1, `${viewport.name}: player duplicado no documento principal`);
  assert.equal(baseline.paused, true, `${viewport.name}: autoplay detectado`);
  assert.equal(baseline.srcBeforePlay, '', `${viewport.name}: src deveria iniciar vazio`);
  assert.equal(baseline.buttonText, 'Música', `${viewport.name}: texto inicial incorreto`);
  assert.equal(baseline.iconText, '♫', `${viewport.name}: ícone inicial incorreto`);
  assert.equal(baseline.hasRetryPanel, false, `${viewport.name}: painel grande indevido detectado`);
  assert.ok((baseline.buttonRect?.height || 0) >= 44, `${viewport.name}: área de toque abaixo de 44px`);
  assert.ok((baseline.buttonRect?.left ?? -1) >= 0 && (baseline.buttonRect?.top ?? -1) >= 0, `${viewport.name}: botão fora do viewport`);
  assert.ok((baseline.buttonRect?.right ?? Number.MAX_SAFE_INTEGER) <= viewport.width + 0.5, `${viewport.name}: botão fora do limite horizontal`);
  assert.ok((baseline.buttonRect?.bottom ?? Number.MAX_SAFE_INTEGER) <= viewport.height + 0.5, `${viewport.name}: botão fora do limite vertical`);

  const iframe = await page.$('#itp-crs-iframe');
  assert.ok(iframe, `${viewport.name}: iframe carrossel não encontrado`);
  const frame = await iframe.contentFrame();
  assert.ok(frame, `${viewport.name}: sem acesso ao frame`);
  const inIframeCount = await frame.evaluate(() => document.querySelectorAll('#itap-home-music-player').length);
  assert.equal(inIframeCount, 0, `${viewport.name}: player indevido no iframe`);

  await page.evaluate(() => {
    const blocker = document.createElement('div');
    blocker.id = 'audit-full-blocker';
    blocker.setAttribute('data-itabot-obstacle', 'true');
    blocker.style.position = 'fixed';
    blocker.style.inset = '0';
    blocker.style.zIndex = '100';
    blocker.style.pointerEvents = 'auto';
    blocker.style.background = 'rgba(0,0,0,0.01)';
    document.body.appendChild(blocker);
  });
  await page.waitForTimeout(350);

  const hiddenBlocked = await page.evaluate(() => {
    const player = document.getElementById('itap-home-music-player');
    return {
      ariaHidden: player?.getAttribute('aria-hidden') || '',
      isHiddenClass: player?.classList.contains('is-hidden') || false
    };
  });
  assert.equal(hiddenBlocked.ariaHidden, 'true', `${viewport.name}: deveria ocultar quando parado e sem espaço`);
  assert.equal(hiddenBlocked.isHiddenClass, true, `${viewport.name}: classe de ocultação ausente`);

  await page.evaluate(() => document.getElementById('audit-full-blocker')?.remove());
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    const audio = document.querySelector('#itap-home-music-player audio');
    if (!audio || audio.__itapAuditPatched) return;

    audio.__itapAuditPatched = true;

    const originalPlay = audio.play.bind(audio);
    const originalPause = audio.pause.bind(audio);

    audio.play = function () {
      if (this.dataset.auditFailPlay === '1') {
        this.dispatchEvent(new Event('error'));
        return Promise.reject(new Error('forced-play-failure'));
      }
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    };

    audio.pause = function () {
      this.dispatchEvent(new Event('pause'));
      return originalPause();
    };

    audio.__restore = () => {
      audio.play = originalPlay;
      audio.pause = originalPause;
    };
  });

  await page.evaluate(() => {
    const audio = document.querySelector('#itap-home-music-player audio');
    if (audio) audio.dataset.auditFailPlay = '1';
  });
  await page.click('#itap-home-music-player .itap-home-music-player__toggle');
  await page.waitForTimeout(220);

  const failureState = await page.evaluate(() => {
    const player = document.getElementById('itap-home-music-player');
    const button = player?.querySelector('.itap-home-music-player__toggle');
    const label = player?.querySelector('.itap-home-music-player__label');
    return {
      text: label?.textContent?.trim() || '',
      ariaLabel: button?.getAttribute('aria-label') || '',
      isError: player?.classList.contains('is-error') || false,
      playerCount: document.querySelectorAll('#itap-home-music-player').length
    };
  });

  assert.equal(failureState.text, 'Erro: tocar', `${viewport.name}: erro visível não aplicado`);
  assert.equal(failureState.isError, true, `${viewport.name}: classe de erro não aplicada`);
  assert.ok(/tentar novamente/i.test(failureState.ariaLabel), `${viewport.name}: aria de retry não aplicada`);
  assert.equal(failureState.playerCount, 1, `${viewport.name}: duplicou após erro`);

  await page.evaluate(() => {
    const audio = document.querySelector('#itap-home-music-player audio');
    if (audio) audio.dataset.auditFailPlay = '0';
  });
  await page.click('#itap-home-music-player .itap-home-music-player__toggle');
  await page.waitForTimeout(220);

  const playingState = await page.evaluate(() => {
    const player = document.getElementById('itap-home-music-player');
    const button = player?.querySelector('.itap-home-music-player__toggle');
    const label = player?.querySelector('.itap-home-music-player__label');
    return {
      text: label?.textContent?.trim() || '',
      ariaPressed: button?.getAttribute('aria-pressed') || '',
      isPlaying: player?.classList.contains('is-playing') || false,
      ariaHidden: player?.getAttribute('aria-hidden') || ''
    };
  });

  assert.equal(playingState.text, 'Pausar', `${viewport.name}: texto de reprodução incorreto`);
  assert.equal(playingState.ariaPressed, 'true', `${viewport.name}: aria-pressed deveria ser true tocando`);
  assert.equal(playingState.isPlaying, true, `${viewport.name}: classe is-playing ausente`);
  assert.equal(playingState.ariaHidden, 'false', `${viewport.name}: player não visível durante reprodução`);

  await page.click('#itap-home-music-player .itap-home-music-player__toggle');
  await page.waitForTimeout(160);

  const pausedAgain = await page.evaluate(() => {
    const player = document.getElementById('itap-home-music-player');
    const label = player?.querySelector('.itap-home-music-player__label');
    return {
      text: label?.textContent?.trim() || '',
      count: document.querySelectorAll('#itap-home-music-player').length,
      error: player?.classList.contains('is-error') || false
    };
  });
  assert.equal(pausedAgain.text, 'Música', `${viewport.name}: texto após pausa incorreto`);
  assert.equal(pausedAgain.count, 1, `${viewport.name}: duplicou após pausa`);
  assert.equal(pausedAgain.error, false, `${viewport.name}: estado erro persistiu indevidamente`);

  const overlap = await page.evaluate(() => {
    const player = document.querySelector('#itap-home-music-player .itap-home-music-player__toggle')?.getBoundingClientRect();
    const cookie = document.getElementById('cookie-banner');
    const itabot = document.getElementById('itabot-launcher');
    const menu = document.getElementById('menu-categorias-cardapio');
    const cookieRect = cookie && getComputedStyle(cookie).display !== 'none' ? cookie.getBoundingClientRect() : null;
    const itabotRect = itabot && getComputedStyle(itabot).display !== 'none' ? itabot.getBoundingClientRect() : null;
    const menuRect = menu && getComputedStyle(menu).display !== 'none' ? menu.getBoundingClientRect() : null;
    return {
      player: player ? player.toJSON() : null,
      cookie: cookieRect ? cookieRect.toJSON() : null,
      itabot: itabotRect ? itabotRect.toJSON() : null,
      menu: menuRect ? menuRect.toJSON() : null
    };
  });

  results.push({
    viewport: viewport.name,
    buttonHeight: Math.round(baseline.buttonRect?.height || 0),
    buttonWidth: Math.round(baseline.buttonRect?.width || 0),
    iconSize: baseline.iconSize,
    overlaps: {
      cookie: intersects(overlap.player, overlap.cookie),
      itabot: intersects(overlap.player, overlap.itabot),
      menu: intersects(overlap.player, overlap.menu)
    }
  });
}

await page.goto(`${base}/carrossel.html?audit-home-music-player=compact-pill`, { waitUntil: 'domcontentloaded', timeout: 60000 });
const standaloneCarouselPlayerCount = await page.evaluate(() => document.querySelectorAll('#itap-home-music-player').length);
assert.equal(standaloneCarouselPlayerCount, 0, 'carrossel isolado não pode ter player');

const swSource = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
assert.ok(swSource.includes("url.pathname === '/media/audio/itapolitana-trilha-20261122.mpeg'"), 'SW sem regra de áudio dedicada');
assert.ok(swSource.includes("new Response('Áudio indisponível sem conexão.'"), 'SW sem fallback de erro de áudio');

await browser.close();

console.log(JSON.stringify({
  summary: {
    base,
    checkedViewports: results.map(r => r.viewport),
    singlePlayerOnHome: true,
    noPlayerInIframeAndCarousel: true,
    touchHeights: results.map(r => ({ viewport: r.viewport, height: r.buttonHeight, width: r.buttonWidth, iconSize: r.iconSize })),
    overlaps: results.map(r => ({ viewport: r.viewport, ...r.overlaps }))
  },
  results
}, null, 2));
