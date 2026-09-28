/* Feedback global de toque — sem alterar a ação original do controle. */
(function () {
  'use strict';
  if (window.__itapTouchFeedbackInstalled) return;
  window.__itapTouchFeedbackInstalled = true;
  var CONTROL_SELECTOR = 'button, a[href], [role="button"], summary, input[type="button"], input[type="submit"], input[type="reset"]';

  var reduceMotion = false;
  try {
    var media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion = Boolean(media.matches);
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', function (event) { reduceMotion = Boolean(event.matches); });
    }
  } catch (_) {}

  function isTouchPointer(event) {
    return event && (event.pointerType === 'touch' || event.pointerType === 'pen');
  }

  function controlFromEvent(event) {
    var node = event && event.target;
    if (!node || node.nodeType !== 1) return null;
    return node.closest(CONTROL_SELECTOR);
  }

  function isDisabled(control) {
    return Boolean(control && (control.disabled || control.getAttribute('aria-disabled') === 'true'));
  }

  function pulseVisual(control) {
    if (!control || reduceMotion) return;
    control.classList.remove('itap-touch-feedback-active');
    void control.offsetWidth;
    control.classList.add('itap-touch-feedback-active');
    window.setTimeout(function () { control.classList.remove('itap-touch-feedback-active'); }, 140);
  }

  var GLOBAL_ERROR_EVENT_NAME = 'itapGlobalErrorGuard';
  var MAX_REPORTED_ERRORS = 20;
  var globalErrorCount = 0;

  function normalizeErrorMessage(value) {
    if (!value) return 'Erro inesperado no site';
    if (typeof value === 'string') return value.slice(0, 260);
    if (value && typeof value.message === 'string') return value.message.slice(0, 260);
    try { return String(value).slice(0, 260); } catch (_) { return 'Erro inesperado no site'; }
  }

  function isIgnorableError(message) {
    var lower = String(message || '').toLowerCase();
    return lower.indexOf('resizeobserver loop') >= 0 || lower.indexOf('script error') >= 0;
  }

  function ensureErrorBanner() {
    var banner = document.getElementById('itap-error-guard-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'itap-error-guard-banner';
      banner.className = 'itap-error-guard-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      banner.setAttribute('aria-hidden', 'true');
      banner.textContent = '⚠️ Proteção de estabilidade ativa: detectamos um erro e preservamos o funcionamento do site.';
      (document.body || document.documentElement).appendChild(banner);
    }
    banner.classList.remove('itap-error-guard-hidden');
    banner.setAttribute('aria-hidden', 'false');
    window.clearTimeout(banner.__itapHideTimer || 0);
    banner.__itapHideTimer = window.setTimeout(function () {
      banner.classList.add('itap-error-guard-hidden');
      banner.setAttribute('aria-hidden', 'true');
    }, 6000);
  }

  function reportGlobalError(detail) {
    globalErrorCount += 1;
    if (globalErrorCount > MAX_REPORTED_ERRORS) return;
    try {
      window.__itapLastGlobalError = detail;
      document.dispatchEvent(new CustomEvent(GLOBAL_ERROR_EVENT_NAME, { detail: detail }));
    } catch (_) {}
    ensureErrorBanner();
  }

  window.addEventListener('error', function (event) {
    var target = event && event.target;
    var resourceError = Boolean(target && target !== window);
    var message = normalizeErrorMessage(event && event.message ? event.message : (resourceError ? 'Falha ao carregar recurso crítico' : 'Erro inesperado no site'));
    if (isIgnorableError(message)) return;
    reportGlobalError({
      type: resourceError ? 'resource' : 'runtime',
      message: message,
      file: normalizeErrorMessage(event && event.filename ? event.filename : (target && target.src) || ''),
      line: Number(event && event.lineno) || 0,
      column: Number(event && event.colno) || 0,
      timestamp: Date.now()
    });
  }, true);

  window.addEventListener('unhandledrejection', function (event) {
    var message = normalizeErrorMessage(event && event.reason);
    if (isIgnorableError(message)) return;
    reportGlobalError({
      type: 'unhandledrejection',
      message: message,
      timestamp: Date.now()
    });
  });

  document.addEventListener('pointerup', function (event) {
    var control = controlFromEvent(event);
    if (!control || isDisabled(control) || !isTouchPointer(event)) return;
    if (!reduceMotion && navigator && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(10); } catch (_) {}
    }
    pulseVisual(control);
  }, { capture: true, passive: true });

  var style = document.createElement('style');
  style.textContent =
    '.itap-touch-feedback-active{filter:brightness(.92);transform:scale(.985)!important;}' +
    ':where(button,a[href],[role="button"],summary,input[type="button"],input[type="submit"],input[type="reset"]){touch-action:manipulation;}' +
    ':where(button,a[href],[role="button"],summary) > :where(svg,use,span,small,strong,em,b,i){pointer-events:none;}' +
    '.itap-error-guard-banner{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;padding:10px 12px;border-radius:10px;background:#fff4e5;color:#7a3f00;font:600 13px/1.35 system-ui,-apple-system,sans-serif;box-shadow:0 6px 16px rgba(0,0,0,.18);pointer-events:none;opacity:1;transition:opacity .28s ease;}' +
    '.itap-error-guard-hidden{opacity:0;}';
  document.head.appendChild(style);
}());
