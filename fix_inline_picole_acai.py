"""
Converte abrirPicolé e abrirComplementos para exibição inline dentro do accordion.
Usa a mesma técnica de mostrarSaboresInline já implementada.
"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 1: Adicionar funções JS inline para picolé e complementos
# ──────────────────────────────────────────────────────────────────────────────

js_picole_acai = """
// ── PICOLÉ INLINE ────────────────────────────────────────────────────────────
function abrirPicoléInline(key, nome, el) {
  // Sobe até o acc-body
  var accBody = el.closest('.acc-body') || el.closest('[id$="-body"]');
  if (!accBody) { abrirPicolé(key, nome, el); return; }

  var sabs = produtos && produtos.picolés && produtos.picolés[key] ? produtos.picolés[key].sabores : [];
  var chips = sabs.length > 0 ? sabs : ['Consulte na loja'];
  mostrarSaboresInline(accBody, '🍭 Sabores – ' + nome, 'Sabores disponíveis para este tipo de picolé', chips);
}

// ── COMPLEMENTOS DO AÇAÍ INLINE ──────────────────────────────────────────────
function abrirComplementosInline(el) {
  var accBody = el.closest('.acc-body') || el.closest('[id$="-body"]');
  if (!accBody) { abrirComplementos(el); return; }

  var acc = accBody.closest('.acc');
  var accId = acc ? acc.id : null;
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
  }

  html += '<button type="button" class="btn-voltar-nivel" onclick="voltarNivel(this)">← Voltar</button>';
  html += '</div>';
  accBody.innerHTML = html;
}
"""

# Inserir antes do último </script>
if 'abrirPicoléInline' not in content:
    last_script = content.rfind('</script>')
    if last_script != -1:
        content = content[:last_script] + js_picole_acai + '\n' + content[last_script:]
        print('OK funções picolé/açaí inline adicionadas')
    else:
        print('ERRO: </script> não encontrado')
else:
    print('Funções já existem')

# ──────────────────────────────────────────────────────────────────────────────
# PASSO 2: Substituir chamadas nos innerHTML das funções render
# ──────────────────────────────────────────────────────────────────────────────

# Picolé: substituir abrirPicolé( por abrirPicoléInline( nos innerHTML dinâmicos
old_picole = "onclick=\"event.stopPropagation();abrirPicolé('"
new_picole = "onclick=\"event.stopPropagation();abrirPicoléInline('"

count_picole = content.count(old_picole)
if count_picole > 0:
    content = content.replace(old_picole, new_picole)
    print(f'OK picolé substituído ({count_picole} ocorrências)')
else:
    # Tentar com bytes UTF-8
    print('Tentando com encoding alternativo para picolé...')
    old_b = "onclick=\"event.stopPropagation();abrirPicol\u00e9('".encode('utf-8')
    new_b = "onclick=\"event.stopPropagation();abrirPicol\u00e9Inline('".encode('utf-8')
    content_b = content.encode('utf-8')
    if old_b in content_b:
        content_b = content_b.replace(old_b, new_b)
        content = content_b.decode('utf-8')
        print('OK picolé substituído via bytes')
    else:
        print('NÃO encontrado: abrirPicolé no innerHTML')

# Complementos do açaí: substituir abrirComplementos(this) por abrirComplementosInline(this)
old_comp = 'onclick="abrirComplementos(this)"'
new_comp = 'onclick="abrirComplementosInline(this)"'
count_comp = content.count(old_comp)
if count_comp > 0:
    content = content.replace(old_comp, new_comp)
    print(f'OK complementos substituído ({count_comp} ocorrências)')
else:
    print('NÃO encontrado: abrirComplementos(this)')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('\nOK index.html salvo')
