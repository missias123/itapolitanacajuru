"""
Reescreve todas as funções inline do cardápio para usar document.getElementById
com o ID fixo do container, garantindo que os sabores apareçam DENTRO do accordion.
"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ──────────────────────────────────────────────────────────────────────────────
# NOVAS FUNÇÕES INLINE — usam getElementById com ID fixo
# ──────────────────────────────────────────────────────────────────────────────

novas_funcoes = """
// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA INLINE — NAVEGAÇÃO ESTÁTICA EM 3 NÍVEIS (sem modal, sem scroll)
// Regra: ao clicar em qualquer botão do cardápio, a página NÃO se move.
// Botão ← Voltar retorna ao nível anterior dentro do mesmo accordion.
// ═══════════════════════════════════════════════════════════════════════════

// Mapa de ID do acc-body para cada accordion do cardápio
var _accBodyMap = {
  'sorvetes':       'sorvetes-body',
  'milkshakes':     'milkshakes-body',
  'tacas':          'tacas-body',
  'tacas-premium':  'tacas-premium-body',
  'acai-promo':     'açaí-promo-body',
  'acai':           'açaí-body',
  'picoles':        'picolés-body',
  'iso':            'iso-body',
  'sobremesas':     'sobremesas-body'
};

// Obtém o acc-body correto: primeiro tenta closest, depois sobe manualmente
function _getAccBody(el, bodyId) {
  // 1. Tenta closest direto
  var found = el.closest('.acc-body');
  if (found) return found;
  // 2. Sobe manualmente até 8 níveis
  var cur = el.parentElement;
  for (var i = 0; i < 8; i++) {
    if (!cur) break;
    if (cur.classList && cur.classList.contains('acc-body')) return cur;
    cur = cur.parentElement;
  }
  // 3. Usa getElementById com ID fixo
  if (bodyId) return document.getElementById(bodyId);
  return null;
}

// Mostra sabores/itens inline dentro do acc-body (substitui o conteúdo atual)
function mostrarSaboresInline(accBodyEl, titulo, sub, chips) {
  if (!accBodyEl) return;
  var accId = accBodyEl.closest && accBodyEl.closest('.acc') ? accBodyEl.closest('.acc').id : accBodyEl.id;
  if (accId) _nivelAnterior[accId] = accBodyEl.innerHTML;

  var chipsHtml = chips.map(function(s) {
    return '<span class="chip-inline">' + s + '</span>';
  }).join('');

  accBodyEl.innerHTML =
    '<div class="sabores-inline">' +
      '<div class="sabores-inline-titulo">' + titulo + '</div>' +
      '<div class="sabores-inline-sub">' + sub + '</div>' +
      '<div class="chips-inline">' + chipsHtml + '</div>' +
      '<button type="button" class="btn-voltar-nivel" onclick="voltarNivel(this)">← Voltar</button>' +
    '</div>';
}

function voltarNivel(btn) {
  var accBody = btn.closest('.acc-body');
  if (!accBody) {
    var cur = btn.parentElement;
    for (var i = 0; i < 8; i++) {
      if (!cur) break;
      if (cur.classList && cur.classList.contains('acc-body')) { accBody = cur; break; }
      cur = cur.parentElement;
    }
  }
  if (!accBody) return;
  var acc = accBody.closest ? accBody.closest('.acc') : null;
  var accId = acc ? acc.id : accBody.id;
  if (accId && _nivelAnterior[accId]) {
    accBody.innerHTML = _nivelAnterior[accId];
    delete _nivelAnterior[accId];
  }
}

// ── SORVETES / MILKSHAKES / ISOPORES / SOBREMESAS → 35 sabores ──────────────
function abrirSaboresInline(tipo, titulo, el) {
  var bodyId = tipo === 'sorvetes' ? 'sorvetes-body' :
               tipo === 'milkshakes' ? 'milkshakes-body' :
               tipo === 'iso' ? 'iso-body' :
               tipo === 'sobremesas' ? 'sobremesas-body' : null;
  var accBody = _getAccBody(el, bodyId);
  if (!accBody) { abrirSabores(tipo, titulo, el); return; }
  var sabores = getSaboresDisponíveis();
  mostrarSaboresInline(accBody, titulo, 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
}

function abrirMilkshakeSaboresInline(el) {
  var accBody = _getAccBody(el, 'milkshakes-body');
  if (!accBody) { abrirMilkshakeSabores(el); return; }
  var sabores = getSaboresDisponíveis();
  mostrarSaboresInline(accBody, '🥤 Milkshakes – ' + sabores.length + ' Sabores', 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
}

// ── TAÇAS TRADICIONAIS → nomes e preços das taças ───────────────────────────
function abrirTacasTradicionaisInline(el) {
  var accBody = _getAccBody(el, 'tacas-body');
  if (!accBody) { abrirTacasTradicionais(el); return; }
  var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
  var chips = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  mostrarSaboresInline(accBody, '🍨 Taças – ' + chips.length + ' Opções', 'Informe a taça desejada ao fazer seu pedido na loja', chips);
}

// ── TAÇAS PREMIUM → nomes e preços das taças premium ────────────────────────
function abrirTacasSujasInline(el) {
  var accBody = _getAccBody(el, 'tacas-premium-body');
  if (!accBody) { abrirTacasSujas(el); return; }
  var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
  var chips = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  mostrarSaboresInline(accBody, '👑 Taças Premium – ' + chips.length + ' Opções', 'Informe a taça desejada ao fazer seu pedido na loja', chips);
}

// ── PICOLÉS → sabores específicos por tipo ───────────────────────────────────
function abrirPicoléInline(key, nome, el) {
  var accBody = _getAccBody(el, 'picolés-body');
  if (!accBody) { abrirPicolé(key, nome, el); return; }
  var sabs = produtos && produtos.picolés && produtos.picolés[key] && produtos.picolés[key].sabores ? produtos.picolés[key].sabores : [];
  var chips = sabs.length > 0 ? sabs : getSaboresDisponíveis();
  var titulo = '🍭 Sabores – ' + nome;
  mostrarSaboresInline(accBody, titulo, 'Sabores disponíveis para este tipo de picolé', chips);
}

// ── COMPLEMENTOS DO AÇAÍ → ingredientes inline ───────────────────────────────
function abrirComplementosInline(el) {
  var accBody = _getAccBody(el, 'açaí-body') || _getAccBody(el, 'açaí-promo-body');
  if (!accBody) { abrirComplementos(el); return; }

  var acc = accBody.closest ? accBody.closest('.acc') : null;
  var accId = acc ? acc.id : accBody.id;
  if (accId) _nivelAnterior[accId] = accBody.innerHTML;

  var labelComp = {frutas:'🍓 Frutas', cremes:'🍯 Cremes', guloseimas:'🍬 Guloseimas', chocolates:'🍫 Chocolates'};
  var html = '<div class="sabores-inline">';
  html += '<div class="sabores-inline-titulo">🫐 Ingredientes do Açaí</div>';
  html += '<div class="sabores-inline-sub">Escolha os ingredientes ao fazer seu pedido na loja</div>';

  if (produtos && produtos.açaí && produtos.açaí.complementos) {
    Object.entries(produtos.açaí.complementos).forEach(function(entry) {
      var k = entry[0], info = entry[1];
      var getNome = function(i) { return typeof i === 'object' && i !== null ? i.nome : i; };
      var isEsg = function(i) { return typeof i === 'object' && i !== null && (i.esgotado || i.estoque <= 0); };
      html += '<div style="margin-bottom:12px">';
      html += '<div style="font-size:13px;font-weight:900;color:#7B2D8B;margin-bottom:6px;">' + (labelComp[k] || k) + ' <span style="font-size:11px;color:#9333EA;font-weight:700">+ R$ ' + info.preço.toFixed(2).replace('.',',') + ' cada</span></div>';
      html += '<div class="chips-inline">';
      info.itens.forEach(function(i) {
        var esg = isEsg(i);
        html += '<span class="chip-inline" style="' + (esg ? 'opacity:.45;text-decoration:line-through;' : '') + '">' + getNome(i) + (esg ? ' ✕' : '') + '</span>';
      });
      html += '</div></div>';
    });
  } else {
    html += '<div style="text-align:center;color:#555;padding:12px">Consulte os ingredientes disponíveis na loja</div>';
  }

  html += '<button type="button" class="btn-voltar-nivel" onclick="voltarNivel(this)">← Voltar</button>';
  html += '</div>';
  accBody.innerHTML = html;
}
"""

# ──────────────────────────────────────────────────────────────────────────────
# Remover as versões antigas dessas funções e inserir as novas
# ──────────────────────────────────────────────────────────────────────────────

import re

# Marcadores de início e fim do bloco antigo
START_MARKER = '// ── PICOLÉ INLINE ──'
END_MARKER_AFTER = 'function abrirComplementosInline'

# Encontrar onde começa o bloco de funções inline antigas
# Vamos remover tudo entre "function mostrarSaboresInline" e o fim do bloco abrirComplementosInline
# e substituir pelo novo bloco completo

# Encontrar a posição do início do bloco inline antigo
start_idx = content.find('function mostrarSaboresInline(accBodyEl')
if start_idx == -1:
    start_idx = content.find('// ── PICOLÉ INLINE')
    
# Encontrar o fim do bloco abrirComplementosInline (a função termina com '}')
# Vamos encontrar o fim da função abrirComplementosInline
end_search = content.find('function abrirComplementosInline', start_idx)
if end_search != -1:
    # Encontrar o fechamento desta função
    brace_count = 0
    end_idx = end_search
    found_first = False
    for i in range(end_search, min(end_search + 3000, len(content))):
        if content[i] == '{':
            brace_count += 1
            found_first = True
        elif content[i] == '}':
            brace_count -= 1
            if found_first and brace_count == 0:
                end_idx = i + 1
                break
    
    if start_idx != -1 and end_idx > start_idx:
        content = content[:start_idx] + novas_funcoes + '\n' + content[end_idx:]
        print(f'OK bloco inline substituído (linhas {start_idx}-{end_idx})')
    else:
        print('ERRO: não encontrou o fim do bloco')
else:
    # Inserir antes do último </script>
    last_script = content.rfind('</script>')
    if last_script != -1:
        content = content[:last_script] + novas_funcoes + '\n' + content[last_script:]
        print('OK funções inseridas antes de </script>')
    else:
        print('ERRO: </script> não encontrado')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK index.html salvo')

# Verificar
import subprocess
result = subprocess.run(['grep', '-c', '_getAccBody', 'index.html'], capture_output=True, text=True)
print(f'Ocorrências de _getAccBody: {result.stdout.strip()}')
result2 = subprocess.run(['grep', '-c', 'abrirPicoléInline', 'index.html'], capture_output=True, text=True)
print(f'Ocorrências de abrirPicoléInline: {result2.stdout.strip()}')
