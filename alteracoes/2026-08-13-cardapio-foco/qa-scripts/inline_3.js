
  // Bloqueia acesso pelo domínio antigo (.site) e redireciona para o oficial
  (function() {
    if (window.location.hostname.includes('itapolitanacajuru.site')) {
      document.documentElement.innerHTML = '<div style="font-family:sans-serif;text-align:center;padding:50px"><h1>Acesso Negado</h1><p>Este domínio (.site) está desatualizado e foi desativado.</p><p>Use o site oficial: <a href="https://itapolitanacajuru.com.br" style="color:#1565C0;font-weight:bold">itapolitanacajuru.com.br</a></p></div>';
      window.stop();
    }
  })();
