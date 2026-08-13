# Relatório Técnico: Correção do Teclado Virtual no Chat Mobile (Ita Bot)

Este documento detalha a causa técnica, a solução implementada e os critérios de validação para o comportamento do assistente virtual (Ita Bot) em dispositivos móveis (Android e iOS).

---

## 1. Causa Técnica do Problema
Em navegadores mobile (Chrome, Safari, Firefox), ao tocar em um campo de texto (`<input>`), o sistema operacional exibe o teclado virtual. Tradicionais implementações baseadas em `position: fixed; height: 100%` ou `100vh` calculam a altura com base na viewport inteira da janela (ignorando a presença do teclado). Como resultado:
- O teclado sobrepõe o rodapé do chat.
- O campo de digitação e o botão de envio ficam ocultos atrás do teclado.
- O usuário perde a visibilidade da última mensagem enviada/recebida.

---

## 2. Solução Aplicada
Para resolver o problema sem prejudicar a experiência em computadores desktop, aplicamos os seguintes conceitos avançados de engenharia de front-end:

1. **Unidades Dinâmicas de Viewport (`dvh`)**:
   - A altura máxima do painel do chat foi ajustada para `max-height: 100dvh` (Dynamic Viewport Height), que se recalcula automaticamente quando a área visível diminui.
2. **API `window.visualViewport`**:
   - Adicionamos um listener em tempo real para `visualViewport.resize` e `visualViewport.scroll`.
   - A diferença entre a altura total da janela (`window.innerHeight`) e a altura visual disponível (`viewport.height`) define a altura exata do teclado virtual (`--keyboard-height`).
3. **Classe Dinâmica `.keyboard-open`**:
   - Quando o teclado é detectado (altura > 80px), a classe `.keyboard-open` ajusta a altura máxima do painel para subtrair exatamente a altura do teclado: `calc(100dvh - var(--keyboard-height))`.
4. **Scroll Automático Inteligente (`scrollIntoView`)**:
   - Ao focar no campo de texto (`focus`), o input é suavemente rolado para dentro da área visível sem causar saltos ou zoom indesejado no iOS (garantindo `font-size: 16px` no input).
5. **Preservação do Desktop**:
   - Através de media queries (`@min-width: 601px`), o comportamento em desktops permanece idêntico ao original (janela centralizada e flutuante).

---

## 3. Trechos de Código Principais

### CSS Responsivo e Viewport Height
```css
.chat-box {
  width: 100%;
  max-width: 460px;
  height: 100%;
  max-height: 100dvh;
  background: #fff;
  border-radius: 28px 28px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (min-width: 601px) {
  #chat-dialog { align-items: center; justify-content: center; }
  .chat-box { width: 95%; height: 90%; max-height: 800px; border-radius: 28px; position: relative; bottom: auto; margin: auto; }
}

#chat-dialog.keyboard-open .chat-box {
  height: calc(100dvh - var(--keyboard-height, 0px)) !important;
  max-height: calc(100dvh - var(--keyboard-height, 0px)) !important;
}

.chat-msgs {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  -webkit-overflow-scrolling: touch;
}

.chat-inp {
  font-size: 16px !important; /* Previne zoom automático no iOS */
}
```

### Lógica JavaScript (`VisualViewport`)
```javascript
if (window.visualViewport) {
  var viewport = window.visualViewport;
  var chatDialog = div;
  var inputEl = document.getElementById('itabot-input');

  function updateChatViewport() {
    var keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty('--keyboard-height', keyboardHeight + 'px');

    if (keyboardHeight > 80) {
      chatDialog.classList.add('keyboard-open');
      requestAnimationFrame(function () {
        if (inputEl && document.activeElement === inputEl) {
          inputEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
      });
    } else {
      chatDialog.classList.remove('keyboard-open');
    }
  }

  viewport.addEventListener('resize', updateChatViewport);
  viewport.addEventListener('scroll', updateChatViewport);
  window.addEventListener('resize', updateChatViewport);

  if (inputEl) {
    inputEl.addEventListener('focus', function () {
      setTimeout(updateChatViewport, 250);
      setTimeout(function () {
        inputEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }, 350);
    });
  }
}
```

---

## 4. Critérios de Aceitação Validados
- [x] No celular, ao tocar no campo de mensagem, o teclado virtual **não cobre** o campo de digitação.
- [x] O botão de envio permanece visível e acessível.
- [x] A última mensagem da conversa continua visível.
- [x] O painel se ajusta dinamicamente à área útil real da tela.
- [x] Sem rolagem horizontal ou saltos indesejados.
- [x] No iPhone, o input não dispara zoom automático (fonte >= 16px).
- [x] Na versão desktop, o comportamento e layout originais foram integralmente preservados.
