(function () {
  'use strict';

  var PLAYER_ID = 'itap-music-player';
  var STATUS_ID = 'itap-music-player-status';
  var BUTTON_ID = 'itap-music-player-toggle';
  var AUDIO_PATH = '/media/audio/itapolitana-trilha-20261122.mpeg';

  if (document.getElementById(PLAYER_ID)) return;

  var style = document.createElement('style');
  style.textContent = [
    '.itap-music-player{position:fixed;left:16px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:900;display:flex;align-items:center;gap:10px;max-width:min(320px,calc(100vw - 32px));padding:8px 10px;border-radius:14px;border:1px solid rgba(251,209,0,.45);background:rgba(15,15,15,.93);backdrop-filter:blur(6px);box-shadow:0 10px 26px rgba(0,0,0,.35);font-family:Inter,Roboto,Arial,sans-serif;color:#fff;pointer-events:none}',
    '.itap-music-player__text{min-width:0;display:flex;flex-direction:column;gap:2px;pointer-events:none}',
    '.itap-music-player__title{font-size:14px;font-weight:700;line-height:1.3}',
    '.itap-music-player__status{font-size:13px;line-height:1.3;color:#f4eec4}',
    '.itap-music-player__toggle{border:0;border-radius:999px;padding:9px 12px;background:#fbd100;color:#1f1f1f;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;min-height:42px;pointer-events:auto}',
    '.itap-music-player__toggle:hover,.itap-music-player__toggle:focus-visible{background:#ffe046;outline:2px solid #fff;outline-offset:2px}',
    '.itap-music-player--error .itap-music-player__status{color:#ffd1d1}',
    '@media (max-width:900px){.itap-music-player{bottom:calc(94px + env(safe-area-inset-bottom));left:12px;max-width:min(260px,calc(100vw - 24px))}}'
  ].join('');
  document.head.appendChild(style);

  var root = document.createElement('section');
  root.id = PLAYER_ID;
  root.className = 'itap-music-player';
  root.setAttribute('aria-label', 'Player de música da Itapolitana Cajuru');

  var button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.className = 'itap-music-player__toggle';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-describedby', STATUS_ID);
  button.textContent = '▶ Ouça nossa música';

  var textWrap = document.createElement('div');
  textWrap.className = 'itap-music-player__text';

  var title = document.createElement('strong');
  title.className = 'itap-music-player__title';
  title.textContent = 'Trilha da Itapolitana';

  var status = document.createElement('span');
  status.id = STATUS_ID;
  status.className = 'itap-music-player__status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Pronto para tocar.';

  var audio = document.createElement('audio');
  audio.preload = 'none';

  textWrap.appendChild(title);
  textWrap.appendChild(status);
  root.appendChild(button);
  root.appendChild(textWrap);
  root.appendChild(audio);
  document.body.appendChild(root);

  var sourceLoaded = false;
  var hadPlaybackError = false;
  var layoutRaf = 0;
  var lastPlacement = { left: null, right: null, bottom: null };

  function isVisibleBlocker(el) {
    if (!el || el === root || (el.closest && el.closest('#' + PLAYER_ID))) return false;
    var cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') return false;
    if (parseFloat(cs.opacity || '1') <= 0.08) return false;
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
    var rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  function gatherBlockers() {
    var selectors = [
      '#cookie-banner',
      '#itabot-launcher',
      '#btn-carrinho-fixo',
      '#btn-carrinho',
      '.btn-carrinho-fixo',
      '.itap-pwa-banner',
      '.itap-net-toast',
      '.fab-whatsapp',
      '.promo-fab',
      '[data-itabot-obstacle="true"]',
      '[data-order-window]',
      '[data-itabot-open]'
    ];
    var map = new Set();
    var blockers = [];

    selectors.forEach(function (selector) {
      var nodes = document.querySelectorAll(selector);
      for (var i = 0; i < nodes.length; i += 1) {
        if (isVisibleBlocker(nodes[i]) && !map.has(nodes[i])) {
          map.add(nodes[i]);
          blockers.push(nodes[i].getBoundingClientRect());
        }
      }
    });

    return blockers;
  }

  function overlapArea(a, b) {
    var x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    var y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return x * y;
  }

  function gatherInteractiveRects() {
    var selectors = 'button, a[href], input[type="button"], input[type="submit"], [role="button"], .section-choice, .categoria-header';
    var elements = document.querySelectorAll(selectors);
    var rects = [];
    for (var i = 0; i < elements.length; i += 1) {
      var el = elements[i];
      if (!el || el === button || el === root || (el.closest && el.closest('#' + PLAYER_ID))) continue;
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue;
      if (parseFloat(cs.opacity || '1') <= 0.08) continue;
      var rect = el.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) continue;
      if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) continue;
      rects.push(rect);
    }
    return rects;
  }

  function setStyleIfChanged(prop, value) {
    if (root.style[prop] === value) return false;
    root.style[prop] = value;
    return true;
  }

  function applySafePlacement() {
    if (!document.body) return;
    var blockers = gatherBlockers().concat(gatherInteractiveRects());
    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var mobile = vw <= 900;
    var baseBottom = mobile ? 94 : 18;
    var sideGap = mobile ? 10 : 16;

    var rect = root.getBoundingClientRect();
    var preferredWidth = mobile ? 260 : 320;
    var width = rect.width || Math.min(preferredWidth, vw - sideGap * 2);
    var height = rect.height || 68;

    var requiredBottom = baseBottom;
    for (var i = 0; i < blockers.length; i += 1) {
      var blocker = blockers[i];
      var isBottomBar = blocker.bottom >= vh - 2 && blocker.height >= 28;
      if (isBottomBar) {
        requiredBottom = Math.max(requiredBottom, vh - blocker.top + 10);
      }
    }

    var availableWidth = Math.max(0, vw - width - sideGap * 2);
    var leftX = sideGap;
    var rightX = sideGap + availableWidth;
    var middleX = sideGap + Math.max(0, Math.round(availableWidth / 2));
    var topY = Math.max(8, mobile ? 70 : 30);

    function candidateScore(x, preferredY) {
      var startY = Math.max(8, preferredY);
      var best = { score: Number.POSITIVE_INFINITY, y: startY };

      for (var y = startY; y >= 8; y -= 10) {
        var candidate = { left: x, top: y, right: x + width, bottom: y + height };
        var score = 0;
        for (var k = 0; k < blockers.length; k += 1) {
          score += overlapArea(candidate, blockers[k]);
        }
        if (score < best.score) best = { score: score, y: y };
        if (score === 0) return best;
      }
      return best;
    }

    var bottomY = Math.max(8, vh - requiredBottom - height);
    var options = [
      { align: 'left', x: leftX, result: candidateScore(leftX, bottomY) },
      { align: 'right', x: rightX, result: candidateScore(rightX, bottomY) },
      { align: 'right', x: rightX, result: candidateScore(rightX, topY) },
      { align: 'left', x: leftX, result: candidateScore(leftX, topY) },
      { align: 'left', x: middleX, result: candidateScore(middleX, topY) }
    ];

    var selectedOption = options[0];
    for (var optionIndex = 1; optionIndex < options.length; optionIndex += 1) {
      if (options[optionIndex].result.score < selectedOption.result.score) selectedOption = options[optionIndex];
    }

    var useRight = selectedOption.align === 'right';
    var selected = selectedOption.result;
    var nextBottom = Math.max(8, vh - (selected.y + height)) + 'px';
    var nextLeft = useRight ? 'auto' : Math.round(selectedOption.x) + 'px';
    var nextRight = useRight ? Math.round(vw - selectedOption.x - width) + 'px' : 'auto';

    setStyleIfChanged('bottom', nextBottom);
    setStyleIfChanged('left', nextLeft);
    setStyleIfChanged('right', nextRight);
    lastPlacement.left = nextLeft;
    lastPlacement.right = nextRight;
    lastPlacement.bottom = nextBottom;
  }

  function scheduleSafePlacement() {
    if (layoutRaf) return;
    layoutRaf = window.requestAnimationFrame(function () {
      layoutRaf = 0;
      applySafePlacement();
    });
  }

  function updateIdleState() {
    root.classList.remove('itap-music-player--error');
    button.textContent = audio.paused ? '▶ Ouça nossa música' : '⏸ Pausar música';
    button.setAttribute('aria-pressed', String(!audio.paused));
    status.textContent = audio.paused ? 'Pausado.' : 'Tocando agora.';
  }

  function showError(message) {
    hadPlaybackError = true;
    root.classList.add('itap-music-player--error');
    status.textContent = message || 'Não foi possível reproduzir o áudio agora.';
    button.textContent = '▶ Ouça nossa música';
    button.setAttribute('aria-pressed', 'false');
  }

  function resetSourceForRetry() {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    sourceLoaded = false;
  }

  function ensureSource() {
    if (sourceLoaded) return;
    audio.src = AUDIO_PATH;
    sourceLoaded = true;
  }

  button.addEventListener('click', function () {
    if (!audio.paused) {
      audio.pause();
      updateIdleState();
      return;
    }

    if (hadPlaybackError) {
      resetSourceForRetry();
      hadPlaybackError = false;
    }

    ensureSource();
    var playAttempt = audio.play();

    if (playAttempt && typeof playAttempt.then === 'function') {
      playAttempt
        .then(function () {
          hadPlaybackError = false;
          updateIdleState();
        })
        .catch(function () {
          showError('Não foi possível tocar. Toque novamente para tentar.');
        });
    } else {
      hadPlaybackError = false;
      updateIdleState();
    }
  });

  audio.addEventListener('play', updateIdleState);
  audio.addEventListener('pause', updateIdleState);
  audio.addEventListener('ended', function () {
    audio.currentTime = 0;
    updateIdleState();
    status.textContent = 'Faixa finalizada.';
  });
  audio.addEventListener('error', function () {
    showError('Erro ao carregar o áudio. Verifique sua conexão e tente novamente.');
  });

  window.addEventListener('resize', scheduleSafePlacement, { passive: true });
  window.addEventListener('orientationchange', scheduleSafePlacement, { passive: true });
  if (window.ResizeObserver && document.body) {
    new ResizeObserver(scheduleSafePlacement).observe(document.body);
  }
  if (window.MutationObserver && document.body) {
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i += 1) {
        var target = mutations[i].target;
        if (target === root || (target && target.closest && target.closest('#' + PLAYER_ID))) continue;
        scheduleSafePlacement();
        return;
      }
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'aria-hidden', 'open']
    });
  }
  window.addEventListener('scroll', scheduleSafePlacement, { passive: true });
  window.setInterval(scheduleSafePlacement, 12000);
  scheduleSafePlacement();
})();
