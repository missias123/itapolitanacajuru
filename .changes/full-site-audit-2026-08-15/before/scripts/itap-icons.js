/**
 * ITAP ICONS — Sistema de Iconografia Vetorial
 * Sorveteria Itapolitana Cajuru
 *
 * Uma biblioteca única, leve e responsiva. Os símbolos representam apenas
 * categorias e produtos que já existem no site.
 */
(function () {
  'use strict';

  const svgSprite = `
    <svg id="itap-icon-sprite" xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
      <symbol id="icon-home" viewBox="0 0 24 24">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M9 22V12h6v10"/>
      </symbol>
      <symbol id="icon-promo" viewBox="0 0 24 24">
        <path d="M20 12V8H6a2 2 0 1 1 0-4h12v4"/>
        <path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/>
        <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
      </symbol>
      <symbol id="icon-box" viewBox="0 0 24 24">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>
      </symbol>
      <symbol id="icon-cake" viewBox="0 0 24 24">
        <path d="M3 20h18v-8l-9-4-9 4v8Z" fill="currentColor"/>
        <path d="M3 16h18M3 13h18" stroke="white" stroke-width="1" opacity=".45"/>
        <path d="M3 12c2 2 4-2 6 2s4-2 6 2 4-2 6 2V9L12 5 3 9v3Z" fill="currentColor" opacity=".72"/>
      </symbol>
      <symbol id="icon-popsicle" viewBox="0 0 24 24">
        <path d="M5 8c0-4 3-5 7-5s7 1 7 5v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z" fill="currentColor"/>
        <path d="M11 18h2v4a1 1 0 0 1-2 0v-4Z" fill="currentColor" opacity=".8"/>
        <path d="M8 6c1.5-1 4.5-1 6 0" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>
      </symbol>
      <symbol id="icon-acai" viewBox="0 0 24 24">
        <path d="M2 12c0 6 4 10 10 10s10-4 10-10H2Z" fill="currentColor"/>
        <path d="M7 12c0-5 2-8 5-8s5 3 5 8" fill="currentColor" opacity=".9"/>
        <circle cx="9" cy="7" r="1" fill="white" opacity=".65"/>
        <circle cx="15" cy="8" r="1" fill="white" opacity=".65"/>
        <circle cx="12" cy="6" r=".8" fill="white" opacity=".65"/>
      </symbol>
      <symbol id="icon-scoop" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="6" fill="currentColor"/>
        <path d="M6 14c0 3 3 6 6 6s6-3 6-6H6Z" fill="currentColor" opacity=".7"/>
        <path d="M9 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="white" opacity=".4"/>
      </symbol>
      <symbol id="icon-milkshake" viewBox="0 0 24 24">
        <path d="M7 22h10l1.5-14h-13L7 22Z" fill="currentColor"/>
        <path d="M5.5 8c0-3 3-5 6.5-5s6.5 2 6.5 5H5.5Z" fill="currentColor" opacity=".78"/>
        <path d="M14 2l1 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-drop" viewBox="0 0 24 24">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/>
      </symbol>
      <symbol id="icon-star" viewBox="0 0 24 24">
        <path d="m12 3 1.912 5.885h6.188l-5.005 3.637 1.912 5.885-5.005-3.637-5.005 3.637 1.912-5.885-5.005-3.637h6.188L12 3Z"/>
      </symbol>
      <symbol id="icon-snowflake" viewBox="0 0 24 24">
        <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1"/>
        <path d="m9 5 3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3"/>
      </symbol>
      <symbol id="icon-chocolate" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
      </symbol>
      <symbol id="icon-truck" viewBox="0 0 24 24">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18h2M21 18h1a1 1 0 0 0 1-1v-6l-4-4h-5"/>
        <circle cx="7" cy="18" r="2"/><circle cx="19" cy="18" r="2"/>
      </symbol>
      <symbol id="icon-info" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
      </symbol>
      <symbol id="icon-tag" viewBox="0 0 24 24">
        <path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L3.4 13.4a2 2 0 0 1 0-2.8V4h6.6a2 2 0 0 1 1.4.6l9.2 8.8a2 2 0 0 1 0 0Z"/>
        <circle cx="7.5" cy="7.5" r="1"/>
      </symbol>
      <symbol id="icon-clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
      </symbol>
      <symbol id="icon-pin" viewBox="0 0 24 24">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/>
        <circle cx="12" cy="10" r="2.5"/>
      </symbol>
      <symbol id="icon-price" viewBox="0 0 24 24">
        <path d="M12 3v18M16 7.5c-.7-1-2-1.5-4-1.5-2.2 0-4 1.1-4 3s1.5 2.8 4 3.3 4 1.3 4 3.2-1.7 3-4 3-3.6-.7-4.5-2"/>
      </symbol>
      <symbol id="icon-chevron" viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6"/>
      </symbol>
    </svg>
  `;

  function mountSprite() {
    if (!document.body || document.getElementById('itap-icon-sprite')) return;
    document.body.insertAdjacentHTML('afterbegin', svgSprite);
  }

  if (document.body) mountSprite();
  else document.addEventListener('DOMContentLoaded', mountSprite, { once: true });

  window.ItapIcon = function (id, colorClass) {
    const safeId = String(id || 'info').replace(/[^a-z0-9-]/gi, '');
    const classes = ['bento-icon-container', colorClass || ''].filter(Boolean).join(' ');
    return `<span class="${classes}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><use href="#icon-${safeId}" xlink:href="#icon-${safeId}"></use></svg></span>`;
  };
})();
