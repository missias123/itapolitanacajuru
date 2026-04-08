"""
Implementa navegação inline em 3 níveis no cardápio:
- Nível 1: Lista de accordions
- Nível 2: Cards de preço dentro do accordion (conteúdo original)
- Nível 3: Sabores/detalhes inline (substitui o conteúdo do acc-body temporariamente)

Botão Voltar em cada nível retorna ao nível anterior SEM mover a página.
"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 1: Adicionar CSS para o painel inline de sabores
# ──────────────────────────────────────────────────────────────────────────────

css_inline = """
/* ── PAINEL INLINE DE SABORES (Nível 3) ── */
.sabores-inline{padding:4px 0 8px;animation:slideDown .2s ease}
.sabores-inline-titulo{font-size:16px;font-weight:900;color:#7B2D8B;margin-bottom:6px;padding-bottom:6px;border-bottom:2px solid #F3E8FF}
.sabores-inline-sub{font-size:12px;color:#9333EA;margin-bottom:12px;font-weight:600}
.chips-inline{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.chip-inline{background:#FFF0F9;border:1.5px solid #F9A8D4;border-radius:50px;padding:6px 14px;font-size:13px;font-weight:700;color:#BE185D;cursor:default;transition:background .15s}
.chip-inline:hover{background:#FCE7F3}
.btn-voltar-nivel{display:inline-flex;align-items:center;gap:6px;margin:8px 0 4px;padding:10px 20px;min-height:44px;background:linear-gradient(135deg,#7B2D8B,#9333EA);color:#fff;border:none;border-radius:50px;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 3px 12px rgba(123,45,139,.3);transition:all .2s}
.btn-voltar-nivel:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(123,45,139,.4)}
"""

# Inserir o CSS antes do fechamento do </style>
if '.sabores-inline' not in content:
    content = content.replace('</style>', css_inline + '</style>', 1)
    print('OK CSS inline adicionado')
else:
    print('CSS inline já existe')

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 2: Adicionar função JS mostrarSaboresInline e voltarNivel
# ──────────────────────────────────────────────────────────────────────────────

js_inline = """
// ── NAVEGAÇÃO INLINE EM 3 NÍVEIS ─────────────────────────────────────────────
// Guarda o HTML original do acc-body para restaurar ao clicar Voltar
var _nivelAnterior = {};

function mostrarSaboresInline(accBodyEl, titulo, sub, chips) {
  // Salva o conteúdo atual do acc-body (Nível 2)
  var accId = accBodyEl.closest('.acc') ? accBodyEl.closest('.acc').id : null;
  if (accId) _nivelAnterior[accId] = accBodyEl.innerHTML;

  // Monta o HTML do Nível 3 (sabores inline)
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
  var accBody = btn.closest('.acc-body') || btn.closest('.acc-body-inner') || btn.parentElement.parentElement;
  var acc = accBody ? accBody.closest('.acc') : null;
  var accId = acc ? acc.id : null;
  if (accId && _nivelAnterior[accId]) {
    accBody.innerHTML = _nivelAnterior[accId];
    delete _nivelAnterior[accId];
  }
}

// ── Substitui abrirSabores para usar inline ──────────────────────────────────
function abrirSaboresInline(tipo, titulo, el) {
  var accBody = el.closest('.acc-body');
  if (!accBody) { abrirSabores(tipo, titulo, el); return; }
  var sabores = getSaboresDisponíveis();
  mostrarSaboresInline(accBody, titulo, 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
}

function abrirMilkshakeSaboresInline(el) {
  var accBody = el.closest('.acc-body');
  if (!accBody) { abrirMilkshakeSabores(el); return; }
  var sabores = getSaboresDisponíveis();
  var titulo = '🥤 Milkshakes – ' + (sabores.length || 36) + ' Sabores';
  mostrarSaboresInline(accBody, titulo, 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
}

function abrirTacasTradicionaisInline(el) {
  var accBody = el.closest('.acc-body');
  if (!accBody) { abrirTacasTradicionais(el); return; }
  var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
  var chips = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  mostrarSaboresInline(accBody, '🍨 Taças – ' + chips.length + ' Opções', 'Informe a taça desejada ao fazer seu pedido na loja', chips);
}

function abrirTacasSujasInline(el) {
  var accBody = el.closest('.acc-body');
  if (!accBody) { abrirTacasSujas(el); return; }
  var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
  var chips = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  mostrarSaboresInline(accBody, '👑 Taças Premium – ' + chips.length + ' Opções', 'Informe a taça desejada ao fazer seu pedido na loja', chips);
}
"""

# Inserir as funções JS antes do fechamento do </script> principal
# Encontrar o último </script>
if 'mostrarSaboresInline' not in content:
    # Inserir antes do último </script>
    last_script = content.rfind('</script>')
    if last_script != -1:
        content = content[:last_script] + js_inline + '\n' + content[last_script:]
        print('OK funções JS inline adicionadas')
    else:
        print('ERRO: </script> não encontrado')
else:
    print('Funções inline já existem')

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 3: Substituir os onclick dos botões de sabores para usar as funções inline
# ──────────────────────────────────────────────────────────────────────────────

replacements = [
    # Sorvetes — btn-sabores no HTML estático
    ("onclick=\"abrirSabores('sorvetes','🍦 35 Sabores de Sorvete',this)\"",
     "onclick=\"abrirSaboresInline('sorvetes','🍦 35 Sabores de Sorvete',this)\""),
    # Milkshake
    ("onclick=\"abrirMilkshakeSabores(this)\"",
     "onclick=\"abrirMilkshakeSaboresInline(this)\""),
    # Taças Tradicionais
    ("onclick=\"abrirTacasTradicionais(this)\"",
     "onclick=\"abrirTacasTradicionaisInline(this)\""),
    # Taças Premium/Sujas
    ("onclick=\"abrirTacasSujas(this)\"",
     "onclick=\"abrirTacasSujasInline(this)\""),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f'OK substituído: {old[:50]}')
    else:
        print(f'NÃO encontrado: {old[:50]}')

# Também substituir no isopore (renderIso usa abrirSabores inline)
old_iso = "onclick=\"abrirSabores('sorvetes','🧊 Sabores para Isopore',this)\""
new_iso = "onclick=\"abrirSaboresInline('sorvetes','🧊 Sabores para Isopore',this)\""
if old_iso in content:
    content = content.replace(old_iso, new_iso)
    print('OK isopore substituído')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('\nOK index.html salvo com navegação inline')
