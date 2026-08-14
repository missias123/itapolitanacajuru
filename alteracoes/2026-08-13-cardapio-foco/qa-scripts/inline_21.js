
function reabrirCookieBanner() {
  localStorage.removeItem('cookies_aceitos');
  document.getElementById('cookie-banner').style.display = 'block';
}
function checkCookies() {
  if (!localStorage.getItem('cookies_aceitos')) {
    document.getElementById('cookie-banner').style.display = 'block';
  }
}
function aceitarCookies() {
  localStorage.setItem('cookies_aceitos', 'true');
  document.getElementById('cookie-banner').style.display = 'none';
  if(typeof gtag === 'function') {
    gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    });
  }
}
function recusarCookies() {
  localStorage.setItem('cookies_aceitos', 'false');
  document.getElementById('cookie-banner').style.display = 'none';
  if(typeof gtag === 'function') {
    gtag('consent', 'update', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied'
    });
  }
}
document.addEventListener('DOMContentLoaded', checkCookies);
