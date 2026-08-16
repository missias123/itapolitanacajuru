
/* Controles de acesso resilientes: independentes de onclick inline e seguros contra submit acidental. */
(function () {
  function configurarAcesso() {
    const senha = document.getElementById('inp-senha');
    const token = document.getElementById('inp-github-token');
    const olhoSenha = document.getElementById('eye-btn');
    const olhoToken = document.getElementById('eye-btn-token');
    const entrarBtn = document.getElementById('btn-entrar-admin');
    if (!senha || !token || !olhoSenha || !olhoToken || !entrarBtn) return;

    const alternar = (campo, botao, nome) => {
      const visivel = campo.type === 'password';
      campo.type = visivel ? 'text' : 'password';
      botao.setAttribute('aria-pressed', String(visivel));
      botao.setAttribute('aria-label', `${visivel ? 'Ocultar' : 'Mostrar'} ${nome}`);
      campo.focus({ preventScroll: true });
    };

    olhoSenha.addEventListener('click', (event) => {
      event.preventDefault();
      alternar(senha, olhoSenha, 'senha');
    });
    olhoToken.addEventListener('click', (event) => {
      event.preventDefault();
      alternar(token, olhoToken, 'token GitHub');
    });
    const submeter = (event) => {
      event.preventDefault();
      if (typeof window.entrar === 'function') window.entrar();
    };
    entrarBtn.addEventListener('click', submeter);
    senha.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submeter(event);
    });
    token.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submeter(event);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarAcesso, { once: true });
  } else {
    configurarAcesso();
  }
})();
