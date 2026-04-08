"""
1. Adiciona IDs fixos nos acc-body que não têm ID
2. Cria CARDAPIO_MAP no JS — tabela mestre com nomes, preços e sabores
3. Reescreve _getAccBody para usar CARDAPIO_MAP
4. Adiciona sincronizarCardapioMap() chamada após qualquer salvar no Admin
"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 1: Adicionar IDs fixos nos acc-body sem ID
# ──────────────────────────────────────────────────────────────────────────────

replacements_html = [
    # acc-sorvetes
    ('<div class="acc" id="acc-sorvetes">\n<div class="acc-header" role="button" tabindex="0" aria-expanded="false" aria-controls="acc-sorvetes-body"',
     '<div class="acc" id="acc-sorvetes">\n<div class="acc-header" role="button" tabindex="0" aria-expanded="false" aria-controls="acc-sorvetes-body"'),
]

# Adicionar id="sorvetes-body" no acc-body de sorvetes (linha 1341)
old_sorvetes = '<div class="acc" id="acc-sorvetes">\n<div class="acc-header" role="button" tabindex="0" aria-expanded="false" aria-controls="acc-sorvetes-body" onclick="toggleAcc(\'acc-sorvetes\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleAcc(\'acc-sorvetes\');}"></'
# Usar abordagem mais simples: substituir padrão específico

# Substituições diretas por linha
lines = content.split('\n')
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    # acc-sorvetes: adicionar id="sorvetes-body" no acc-body seguinte
    if '<div class="acc" id="acc-sorvetes">' in line:
        new_lines.append(line)
        i += 1
        # Próximas linhas até encontrar <div class="acc-body">
        while i < len(lines):
            if lines[i].strip() == '<div class="acc-body">':
                new_lines.append('<div class="acc-body" id="sorvetes-body">')
                i += 1
                break
            new_lines.append(lines[i])
            i += 1
    # acc-milk: adicionar id="milk-body"
    elif '<div class="acc" id="acc-milk">' in line:
        new_lines.append(line)
        i += 1
        while i < len(lines):
            if lines[i].strip() == '<div class="acc-body">':
                new_lines.append('<div class="acc-body" id="milk-body">')
                i += 1
                break
            new_lines.append(lines[i])
            i += 1
    # acc-tacas: adicionar id="tacas-body"
    elif '<div class="acc" id="acc-tacas">' in line:
        new_lines.append(line)
        i += 1
        while i < len(lines):
            if lines[i].strip() == '<div class="acc-body">':
                new_lines.append('<div class="acc-body" id="tacas-body">')
                i += 1
                break
            new_lines.append(lines[i])
            i += 1
    # acc-tacas-p: adicionar id="tacas-p-body"
    elif '<div class="acc" id="acc-tacas-p">' in line:
        new_lines.append(line)
        i += 1
        while i < len(lines):
            if lines[i].strip() == '<div class="acc-body">':
                new_lines.append('<div class="acc-body" id="tacas-p-body">')
                i += 1
                break
            new_lines.append(lines[i])
            i += 1
    else:
        new_lines.append(line)
        i += 1

content = '\n'.join(new_lines)
print('OK IDs adicionados nos acc-body')

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 2: Criar CARDAPIO_MAP e sincronizarCardapioMap no JS
# ──────────────────────────────────────────────────────────────────────────────

cardapio_map_js = """
// ═══════════════════════════════════════════════════════════════════════════
// CARDAPIO_MAP — Tabela Mestre do Cardápio
// Sincronizada automaticamente com dados/produtos.json via Admin
// Estrutura: accId → { bodyId, titulo, tipo, getSabores() }
// ═══════════════════════════════════════════════════════════════════════════

var CARDAPIO_MAP = {};

function sincronizarCardapioMap() {
  CARDAPIO_MAP = {
    'acc-sorvetes': {
      bodyId: 'sorvetes-body',
      titulo: function() { var s = getSaboresDisponíveis(); return '🍦 ' + s.length + ' Sabores de Sorvete'; },
      sub: 'Informe o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() { return getSaboresDisponíveis(); }
    },
    'acc-milk': {
      bodyId: 'milk-body',
      titulo: function() { var s = getSaboresDisponíveis(); return '🥤 Milkshakes – ' + s.length + ' Sabores'; },
      sub: 'Informe o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() { return getSaboresDisponíveis(); }
    },
    'acc-tacas': {
      bodyId: 'tacas-body',
      titulo: function() {
        var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
        return '🍨 Taças – ' + Object.keys(t).length + ' Opções';
      },
      sub: 'Informe a taça desejada ao fazer seu pedido na loja',
      getSabores: function() {
        var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
        return Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
      }
    },
    'acc-tacas-p': {
      bodyId: 'tacas-p-body',
      titulo: function() {
        var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
        return '👑 Taças Premium – ' + Object.keys(t).length + ' Opções';
      },
      sub: 'Informe a taça desejada ao fazer seu pedido na loja',
      getSabores: function() {
        var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
        return Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
      }
    },
    'acc-açaí-promo': {
      bodyId: 'açaí-promo-body',
      titulo: function() { return '🫐 Açaí Promoção'; },
      sub: 'Escolha a opção desejada ao fazer seu pedido na loja',
      getSabores: function() {
        var p = produtos && produtos.acai_promocao ? produtos.acai_promocao : [];
        return p.map(function(a) { return a.nome + ' – ' + a.desc + ' – R$ ' + a.preco.toFixed(2).replace('.',','); });
      }
    },
    'acc-açaí': {
      bodyId: 'açaí-body',
      titulo: function() { return '🫐 Monte o Seu Açaí'; },
      sub: 'Escolha os ingredientes ao fazer seu pedido na loja',
      getSabores: function() {
        var copos = produtos && produtos.acai && produtos.acai.copos ? produtos.acai.copos : {};
        return Object.entries(copos).map(function(e) { return 'Copo ' + e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
      }
    },
    'acc-picolés': {
      bodyId: 'picolés-body',
      titulo: function() { return '🍭 Picolés'; },
      sub: 'Sabores disponíveis para este tipo de picolé',
      getSabores: function() { return getSaboresDisponíveis(); }
    },
    'acc-iso': {
      bodyId: 'iso-body',
      titulo: function() { return '🧊 Isopores de Viagem'; },
      sub: 'Informe o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() { return getSaboresDisponíveis(); }
    },
    'acc-sobremesas': {
      bodyId: 'sobremesas-body',
      titulo: function() { return '🍰 Sobremesas'; },
      sub: 'Informe a sobremesa desejada ao fazer seu pedido na loja',
      getSabores: function() {
        var s = produtos && produtos.sobremesas ? produtos.sobremesas : {};
        return Object.entries(s).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
      }
    }
  };
}

// Obtém o acc-body correto usando CARDAPIO_MAP ou closest
function _getAccBody(el, bodyIdHint) {
  // 1. Tenta closest direto
  var found = el.closest ? el.closest('.acc-body') : null;
  if (found) return found;
  // 2. Sobe manualmente até 10 níveis
  var cur = el.parentElement;
  for (var i = 0; i < 10; i++) {
    if (!cur) break;
    if (cur.classList && cur.classList.contains('acc-body')) return cur;
    cur = cur.parentElement;
  }
  // 3. Usa bodyIdHint ou CARDAPIO_MAP
  if (bodyIdHint) return document.getElementById(bodyIdHint);
  // 4. Tenta encontrar pelo acc pai
  var acc = el.closest ? el.closest('.acc') : null;
  if (acc && CARDAPIO_MAP[acc.id]) return document.getElementById(CARDAPIO_MAP[acc.id].bodyId);
  return null;
}
"""

# Remover o _accBodyMap antigo e inserir o novo CARDAPIO_MAP
old_map_start = '// Mapa de ID do acc-body para cada accordion do cardápio'
old_map_end = '// Obtém o acc-body correto: primeiro tenta closest, depois sobe manualmente'

start_idx = content.find(old_map_start)
end_idx = content.find(old_map_end)

if start_idx != -1 and end_idx != -1:
    # Encontrar o fim da função _getAccBody antiga
    brace_count = 0
    found_first = False
    func_end = end_idx
    for i in range(end_idx, min(end_idx + 1500, len(content))):
        if content[i] == '{':
            brace_count += 1
            found_first = True
        elif content[i] == '}':
            brace_count -= 1
            if found_first and brace_count == 0:
                func_end = i + 1
                break
    content = content[:start_idx] + cardapio_map_js + '\n' + content[func_end:]
    print('OK CARDAPIO_MAP inserido')
else:
    # Inserir antes do bloco de funções inline
    inline_start = content.find('// Mostra sabores/itens inline dentro do acc-body')
    if inline_start != -1:
        content = content[:inline_start] + cardapio_map_js + '\n' + content[inline_start:]
        print('OK CARDAPIO_MAP inserido antes das funções inline')
    else:
        last_script = content.rfind('</script>')
        content = content[:last_script] + cardapio_map_js + '\n' + content[last_script:]
        print('OK CARDAPIO_MAP inserido antes de </script>')

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 3: Atualizar abrirSaboresInline, abrirMilkshakeSaboresInline,
#          abrirTacasTradicionaisInline, abrirTacasSujasInline, abrirPicoléInline
#          para usar CARDAPIO_MAP
# ──────────────────────────────────────────────────────────────────────────────

new_inline_funcs = """
// ── FUNÇÕES INLINE — usam CARDAPIO_MAP para localizar o container correto ────

function abrirSaboresInline(tipo, titulo, el) {
  var bodyId = tipo === 'sorvetes' ? 'sorvetes-body' :
               tipo === 'milkshakes' ? 'milk-body' :
               tipo === 'iso' ? 'iso-body' :
               tipo === 'sobremesas' ? 'sobremesas-body' : null;
  var accBody = _getAccBody(el, bodyId);
  if (!accBody) return;
  var sabores = getSaboresDisponíveis();
  mostrarSaboresInline(accBody, titulo, 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
}

function abrirMilkshakeSaboresInline(el) {
  var accBody = _getAccBody(el, 'milk-body');
  if (!accBody) return;
  var sabores = getSaboresDisponíveis();
  mostrarSaboresInline(accBody, '🥤 Milkshakes – ' + sabores.length + ' Sabores', 'Informe o sabor desejado ao fazer seu pedido na loja', sabores);
}

function abrirTacasTradicionaisInline(el) {
  var accBody = _getAccBody(el, 'tacas-body');
  if (!accBody) return;
  var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
  var chips = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  mostrarSaboresInline(accBody, '🍨 Taças – ' + chips.length + ' Opções', 'Informe a taça desejada ao fazer seu pedido na loja', chips);
}

function abrirTacasSujasInline(el) {
  var accBody = _getAccBody(el, 'tacas-p-body');
  if (!accBody) return;
  var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
  var chips = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  mostrarSaboresInline(accBody, '👑 Taças Premium – ' + chips.length + ' Opções', 'Informe a taça desejada ao fazer seu pedido na loja', chips);
}

function abrirPicoléInline(key, nome, el) {
  var accBody = _getAccBody(el, 'picolés-body');
  if (!accBody) return;
  var sabs = produtos && produtos.picolés && produtos.picolés[key] && produtos.picolés[key].sabores ? produtos.picolés[key].sabores : [];
  var chips = sabs.length > 0 ? sabs : getSaboresDisponíveis();
  mostrarSaboresInline(accBody, '🍭 Sabores – ' + nome, 'Sabores disponíveis para este tipo de picolé', chips);
}

function abrirComplementosInline(el) {
  var accBody = _getAccBody(el, 'açaí-body');
  if (!accBody) accBody = _getAccBody(el, 'açaí-promo-body');
  if (!accBody) return;

  var acc = accBody.closest ? accBody.closest('.acc') : null;
  var accId = acc ? acc.id : accBody.id;
  if (accId) _nivelAnterior[accId] = accBody.innerHTML;

  var labelComp = {frutas:'🍓 Frutas', cremes:'🍯 Cremes', guloseimas:'🍬 Guloseimas', chocolates:'🍫 Chocolates'};
  var html = '<div class="sabores-inline">';
  html += '<div class="sabores-inline-titulo">🫐 Ingredientes do Açaí</div>';
  html += '<div class="sabores-inline-sub">Escolha os ingredientes ao fazer seu pedido na loja</div>';

  if (produtos && produtos.acai && produtos.acai.complementos) {
    Object.entries(produtos.acai.complementos).forEach(function(entry) {
      var k = entry[0], info = entry[1];
      var getNome = function(i) { return typeof i === 'object' && i !== null ? i.nome : i; };
      var isEsg = function(i) { return typeof i === 'object' && i !== null && (i.esgotado || i.estoque <= 0); };
      html += '<div style="margin-bottom:12px">';
      html += '<div style="font-size:13px;font-weight:900;color:#7B2D8B;margin-bottom:6px;">' + (labelComp[k] || k) + ' <span style="font-size:11px;color:#9333EA;font-weight:700">+ R$ ' + info.preco.toFixed(2).replace('.',',') + ' cada</span></div>';
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

# Substituir o bloco de funções inline antigas
old_inline_start = '// ── FUNÇÕES INLINE — usam CARDAPIO_MAP para localizar o container correto ────'
old_inline_start2 = '// ── SORVETES / MILKSHAKES / ISOPORES / SOBREMESAS → 35 sabores ──────────────'

start_inline = content.find(old_inline_start)
if start_inline == -1:
    start_inline = content.find(old_inline_start2)

if start_inline != -1:
    # Encontrar o fim do bloco abrirComplementosInline
    comp_start = content.find('function abrirComplementosInline', start_inline)
    if comp_start != -1:
        brace_count = 0
        found_first = False
        end_comp = comp_start
        for i in range(comp_start, min(comp_start + 3000, len(content))):
            if content[i] == '{':
                brace_count += 1
                found_first = True
            elif content[i] == '}':
                brace_count -= 1
                if found_first and brace_count == 0:
                    end_comp = i + 1
                    break
        content = content[:start_inline] + new_inline_funcs + '\n' + content[end_comp:]
        print('OK funções inline substituídas')
    else:
        print('AVISO: abrirComplementosInline não encontrada')
else:
    # Inserir antes de </script>
    last_script = content.rfind('</script>')
    content = content[:last_script] + new_inline_funcs + '\n' + content[last_script:]
    print('OK funções inline inseridas antes de </script>')

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 4: Chamar sincronizarCardapioMap() após carregarProdutos
# ──────────────────────────────────────────────────────────────────────────────

# Encontrar onde produtos é carregado e adicionar sincronizarCardapioMap()
old_render_call = 'renderTudo();'
new_render_call = 'renderTudo(); sincronizarCardapioMap();'

if old_render_call in content and new_render_call not in content:
    content = content.replace(old_render_call, new_render_call, 1)
    print('OK sincronizarCardapioMap() adicionado após renderTudo()')
else:
    print('AVISO: renderTudo() não encontrado ou já tem sincronizarCardapioMap()')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('\nOK index.html salvo')

# Verificações
import subprocess
checks = [
    ('sorvetes-body', 'ID sorvetes-body'),
    ('milk-body', 'ID milk-body'),
    ('tacas-body', 'ID tacas-body'),
    ('tacas-p-body', 'ID tacas-p-body'),
    ('CARDAPIO_MAP', 'CARDAPIO_MAP'),
    ('sincronizarCardapioMap', 'sincronizarCardapioMap'),
    ('_getAccBody', '_getAccBody'),
]
for term, label in checks:
    r = subprocess.run(['grep', '-c', term, 'index.html'], capture_output=True, text=True)
    print(f'  {label}: {r.stdout.strip()} ocorrências')
