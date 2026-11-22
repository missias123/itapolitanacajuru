(function () {
  'use strict';

  var PLAYER_ID = 'itap-home-music-player';
  var AUDIO_PATH = '/media/audio/itapolitana-trilha-20261122.mpeg';
  var HOME_PATHS = { '/': true, '/index.html': true };
  var EDGE_GAP = 10;
  var ATTRS_TO_WATCH = ['class', 'style', 'open', 'hidden', 'aria-hidden'];
  var BLOCKER_SELECTOR = [
    'button',
    'a[href]',
    'input',
    'textarea',
    'select',
    '[role="button"]',
    'header',
    'nav',
    'footer',
    '[data-itabot-obstacle="true"]',
    '#cookie-banner',
    '#chat-dialog',
    '#itabot-launcher',
    '.itabot-wrap',
    '.toast-notif.ativo',
    '#nav-cardapio-fixo',
    '.fab-whatsapp',
    '.promo-fab',
    '.menu-categorias-cardapio',
    'dialog[open]',
    '.modal-overlay[style*="display: block"]',
    '.modal-overlay[style*="display:flex"]'
  ].join(',');

  function normalizePath(pathname) {
    if (!pathname) return '/';
    var normalized = pathname.replace(/\/+/g, '/');
    if (normalized.length > 1 && normalized.endsWith('/')) return normalized.slice(0, -1);
    return normalized;
  }

  if (!HOME_PATHS[normalizePath(window.location.pathname)]) return;
  if (window.self !== window.top || document.getElementById(PLAYER_ID)) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  function init() {
    if (!document.body || document.getElementById(PLAYER_ID)) return;

    var root = document.createElement('div');
    root.id = PLAYER_ID;
    root.className = 'itap-home-music-player is-hidden';
    root.setAttribute('data-itabot-obstacle', 'true');
    root.setAttribute('aria-hidden', 'true');

    var button = document.createElement('button');
    button.className = 'itap-home-music-player__toggle';
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Tocar música da Itapolitana');
    button.disabled = true;

    var icon = document.createElement('span');
    icon.className = 'itap-home-music-player__icon';
    icon.textContent = '♫';
    icon.setAttribute('aria-hidden', 'true');

    var label = document.createElement('span');
    label.className = 'itap-home-music-player__label';
    label.textContent = 'Música';

    var live = document.createElement('span');
    live.className = 'itap-home-music-player__live';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');

    var audio = document.createElement('audio');
    audio.preload = 'none';
    audio.setAttribute('aria-hidden', 'true');
    audio.tabIndex = -1;

    button.appendChild(icon);
    button.appendChild(label);
    button.appendChild(live);
    root.appendChild(button);
    root.appendChild(audio);
    document.body.appendChild(root);

    var state = 'idle';
    var placementPending = false;
    var lastPlacementTs = 0;

    function isElementVisible(element) {
      if (!(element instanceof HTMLElement)) return false;
      if (element.hidden) return false;
      var style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (parseFloat(style.opacity || '1') < 0.08) return false;
      var rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function getViewport() {
      if (window.visualViewport) {
        return {
          width: Math.max(0, Math.round(window.visualViewport.width)),
          height: Math.max(0, Math.round(window.visualViewport.height))
        };
      }
      return { width: window.innerWidth, height: window.innerHeight };
    }

    function collectBlockers() {
      var blockers = [];
      var elements = document.querySelectorAll(BLOCKER_SELECTOR);
      for (var i = 0; i < elements.length; i += 1) {
        var element = elements[i];
        if (element === root || root.contains(element) || element.contains(root)) continue;
        if (!isElementVisible(element)) continue;

        var style = window.getComputedStyle(element);
        if (style.pointerEvents === 'none') continue;

        var rect = element.getBoundingClientRect();
        blockers.push({ left: rect.left - 8, top: rect.top - 8, right: rect.right + 8, bottom: rect.bottom + 8 });
      }
      return blockers;
    }

    function getBottomInset() {
      var elements = document.querySelectorAll('#cookie-banner,.menu-categorias-cardapio,#nav-cardapio-fixo,#itabot-launcher,.itabot-wrap,.fab-whatsapp,.promo-fab,.toast-notif.ativo');
      var viewport = getViewport();
      var inset = 0;

      for (var i = 0; i < elements.length; i += 1) {
        var element = elements[i];
        if (!isElementVisible(element)) continue;
        var rect = element.getBoundingClientRect();
        if (rect.top >= viewport.height) continue;
        if (rect.bottom < viewport.height - 4) continue;
        if (rect.width < viewport.width * 0.2) continue;
        inset = Math.max(inset, viewport.height - rect.top + 8);
      }

      return inset;
    }

    function findOpenPosition() {
      var viewport = getViewport();
      var rect = button.getBoundingClientRect();
      var width = rect.width || 96;
      var height = rect.height || 44;
      var bottomInset = getBottomInset();
      var rightX = Math.max(EDGE_GAP, viewport.width - width - EDGE_GAP);
      var bottomY = Math.max(EDGE_GAP, viewport.height - height - EDGE_GAP - bottomInset);
      var midX = Math.max(EDGE_GAP, Math.round((viewport.width - width) / 2));
      var midY = Math.max(EDGE_GAP, Math.round((viewport.height - height) / 2));

      var candidates = [
        { left: EDGE_GAP, top: bottomY },
        { left: rightX, top: bottomY },
        { left: EDGE_GAP, top: EDGE_GAP },
        { left: rightX, top: EDGE_GAP },
        { left: midX, top: EDGE_GAP },
        { left: midX, top: bottomY },
        { left: EDGE_GAP, top: midY },
        { left: rightX, top: midY }
      ];

      var blockers = collectBlockers();
      for (var i = 0; i < candidates.length; i += 1) {
        var candidate = candidates[i];
        if (candidate.left + width > viewport.width || candidate.top + height > viewport.height) continue;

        var collides = blockers.some(function (blocker) {
          return candidate.left < blocker.right &&
            candidate.left + width > blocker.left &&
            candidate.top < blocker.bottom &&
            candidate.top + height > blocker.top;
        });

        if (!collides) return { left: candidate.left, top: candidate.top, forced: false };
      }

      return null;
    }

    function updateAppearance() {
      var isPlaying = state === 'playing';
      var isError = state === 'error';
      var isBlocked = state === 'blocked';

      if (isPlaying) {
        icon.textContent = 'Ⅱ';
        label.textContent = 'Pausar';
        button.setAttribute('aria-label', 'Pausar música da Itapolitana');
        button.setAttribute('aria-pressed', 'true');
        live.textContent = 'Música em reprodução';
      } else if (isError) {
        icon.textContent = '♫';
        label.textContent = 'Erro: tocar';
        button.setAttribute('aria-label', 'Falha ao reproduzir música. Toque para tentar novamente');
        button.setAttribute('aria-pressed', 'false');
        live.textContent = 'Não foi possível reproduzir a música. Toque em música para tentar novamente.';
      } else if (isBlocked) {
        icon.textContent = '♫';
        label.textContent = 'Música';
        button.setAttribute('aria-label', 'Música pausada para não cobrir botões. Toque para tocar novamente');
        button.setAttribute('aria-pressed', 'false');
        live.textContent = 'Música pausada automaticamente para não cobrir outros controles.';
      } else {
        icon.textContent = '♫';
        label.textContent = 'Música';
        button.setAttribute('aria-label', 'Tocar música da Itapolitana');
        button.setAttribute('aria-pressed', 'false');
        live.textContent = '';
      }

      root.classList.toggle('is-playing', isPlaying);
      root.classList.toggle('is-error', isError);
      root.classList.toggle('is-blocked', isBlocked);
    }

    function setState(nextState) {
      state = nextState;
      updateAppearance();
      schedulePlacement(nextState === 'playing' ? 'play' : 'state');
    }

    function pauseForSafety() {
      if (state !== 'playing') return;
      state = 'safety-pausing';
      try {
        audio.pause();
      } catch (error) {
        // Sem fallback adicional: ao falhar, mantém fluxo de layout e evita sobreposição.
      }
      setState('blocked');
    }

    function applyPlacement() {
      var position = findOpenPosition();
      if (!position) {
        if (state === 'playing') {
          pauseForSafety();
        }
        if (!button.disabled) button.disabled = true;
        if (!root.classList.contains('is-hidden')) root.classList.add('is-hidden');
        if (root.classList.contains('is-forced')) root.classList.remove('is-forced');
        if (root.getAttribute('aria-hidden') !== 'true') root.setAttribute('aria-hidden', 'true');
        return;
      }

      if (button.disabled) button.disabled = false;
      if (root.classList.contains('is-hidden')) root.classList.remove('is-hidden');
      if (root.classList.contains('is-forced')) root.classList.remove('is-forced');
      if (root.getAttribute('aria-hidden') !== 'false') root.setAttribute('aria-hidden', 'false');
      var left = Math.round(position.left) + 'px';
      var top = Math.round(position.top) + 'px';
      if (root.style.left !== left) root.style.left = left;
      if (root.style.top !== top) root.style.top = top;
    }

    function schedulePlacement(reason) {
      if (placementPending) return;
      placementPending = true;
      var now = Date.now();
      var delay = reason === 'mutation' && now - lastPlacementTs < 180 ? 180 : 0;

      window.setTimeout(function () {
        window.requestAnimationFrame(function () {
          placementPending = false;
          lastPlacementTs = Date.now();
          applyPlacement();
        });
      }, delay);
    }

    function resetSourceForRetry() {
      var noSource = !audio.getAttribute('src');
      var hasPlaybackError = Boolean(audio.error);
      var noNetworkSource = typeof audio.networkState === 'number' &&
        audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;
      var shouldReset = noSource || hasPlaybackError || state === 'error' || state === 'blocked' || noNetworkSource;

      if (!shouldReset) return;

      audio.removeAttribute('src');
      audio.load();
      audio.src = AUDIO_PATH;
      audio.load();
      audio.currentTime = 0;
    }

    function attemptPlay() {
      resetSourceForRetry();
      if (!audio.src) audio.src = AUDIO_PATH;

      try {
        var playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            setState('error');
            applyPlacement();
          });
        }
      } catch (error) {
        setState('error');
        applyPlacement();
      }
    }

    button.addEventListener('click', function () {
      if (state === 'playing') {
        audio.pause();
        setState('idle');
        return;
      }
      attemptPlay();
    });

    audio.addEventListener('play', function () {
      setState('playing');
    });

    audio.addEventListener('pause', function () {
      if (state === 'safety-pausing') return;
      if (state !== 'error') setState('idle');
    });

    audio.addEventListener('ended', function () {
      setState('idle');
    });

    audio.addEventListener('error', function () {
      setState('error');
      applyPlacement();
    });

    window.addEventListener('resize', function () { schedulePlacement('viewport'); }, { passive: true });
    window.addEventListener('orientationchange', function () { schedulePlacement('viewport'); }, { passive: true });
    window.addEventListener('scroll', function () { schedulePlacement('scroll'); }, { passive: true });
    document.addEventListener('click', function () { schedulePlacement('interaction'); }, true);
    document.addEventListener('focusin', function () { schedulePlacement('interaction'); }, true);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { schedulePlacement('viewport'); }, { passive: true });
      window.visualViewport.addEventListener('scroll', function () { schedulePlacement('viewport'); }, { passive: true });
    }

    if (window.MutationObserver) {
      var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i += 1) {
          var mutation = mutations[i];
          if (root.contains(mutation.target)) continue;

          if (mutation.type === 'attributes') {
            if (!ATTRS_TO_WATCH.includes(mutation.attributeName || '')) continue;
            schedulePlacement('mutation');
            break;
          }

          if (mutation.type === 'childList') {
            var externalChange = false;

            for (var addIdx = 0; addIdx < mutation.addedNodes.length; addIdx += 1) {
              var added = mutation.addedNodes[addIdx];
              if (added !== root && !(added instanceof HTMLElement && root.contains(added))) {
                externalChange = true;
                break;
              }
            }

            if (!externalChange) {
              for (var rmIdx = 0; rmIdx < mutation.removedNodes.length; rmIdx += 1) {
                var removed = mutation.removedNodes[rmIdx];
                if (removed !== root && !(removed instanceof HTMLElement && root.contains(removed))) {
                  externalChange = true;
                  break;
                }
              }
            }

            if (externalChange) {
              schedulePlacement('mutation');
              break;
            }
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ATTRS_TO_WATCH
      });
    }

    setState('idle');
    schedulePlacement('initial');
  }
})();
