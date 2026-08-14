
// Relógio digital removido
// Widget clima removido

// === HORÁRIO DINÂMICO ===
function atualizarStatusHorário() {
  const statusTexto = document.getElementById('horário-status-texto');
  const statusDot = document.querySelector('.status-dot');
  if (!statusTexto || !statusDot) return;

  const agora = new Date();
  const diaSemana = agora.getDay(); // 0 = Domingo, 1 = Segunda...
  const horaAtual = agora.getHours() + agora.getMinutes() / 60;

  let aberto = false;
  let fechaEm = '';

  // Horários dinâmicos via config.json
  const hAbre = window.ITAP_HORA_ABRE !== undefined ? window.ITAP_HORA_ABRE : 10;
  const hFecha = window.ITAP_HORA_FECHA !== undefined ? window.ITAP_HORA_FECHA : 22;
  if (horaAtual >= hAbre && horaAtual < hFecha) {
    aberto = true;
    fechaEm = `Fecha às ${hFecha}h`;
  } else {
    fechaEm = `Abre às ${hAbre}h`;
  }

  if (aberto) {
    statusTexto.textContent = `Aberto agora - ${fechaEm}`;
    statusTexto.style.color = '#4CAF50'; // Verde claro para fundo escuro
    statusDot.style.backgroundColor = '#4CAF50';
  } else {
    statusTexto.textContent = `Fechado - ${fechaEm}`;
    statusTexto.style.color = '#FF5252'; // Vermelho claro para fundo escuro
    statusDot.style.backgroundColor = '#FF5252';
    statusDot.style.animation = 'none';
  }
}

// [atualizarStatusHorário fundida no DOMContentLoaded principal]
