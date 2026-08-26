/* Feedback global de toque — sem alterar a ação original do controle. */
(function () {
  'use strict';
  if (window.__itapTouchFeedbackInstalled) return;
  window.__itapTouchFeedbackInstalled = true;

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
    return node.closest('button, a, [role="button"], summary, input[type="button"], input[type="submit"], input[type="reset"]');
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

  document.addEventListener('pointerup', function (event) {
    var control = controlFromEvent(event);
    if (!control || isDisabled(control) || !isTouchPointer(event)) return;
    if (!reduceMotion && navigator && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(10); } catch (_) {}
    }
    pulseVisual(control);
  }, { capture: true, passive: true });

  var style = document.createElement('style');
  style.textContent = '.itap-touch-feedback-active{filter:brightness(.92);transform:scale(.985)!important;}';
  document.head.appendChild(style);
}());
