"""
Corrige abrirTacasTradicionaisInline, abrirTacasSujasInline, e as funções de
Isopores e Sobremesas para mostrar PREÇOS + 35 SABORES juntos.
"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Nova versão das funções que mostram preços + 35 sabores
new_funcs = """
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
  var opcoes = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  var sabores = getSaboresDisponíveis();
  // Mostra: seção de opções de taças + seção dos 35 sabores
  mostrarDuasSecoes(accBody,
    '🍨 Taças – ' + opcoes.length + ' Opções', 'Escolha a taça desejada ao fazer seu pedido na loja', opcoes,
    '🍦 ' + sabores.length + ' Sabores Disponíveis', 'Informe o sabor desejado ao fazer seu pedido na loja', sabores
  );
}

function abrirTacasSujasInline(el) {
  var accBody = _getAccBody(el, 'tacas-p-body');
  if (!accBody) return;
  var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
  var opcoes = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
  var sabores = getSaboresDisponíveis();
  mostrarDuasSecoes(accBody,
    '👑 Taças Premium – ' + opcoes.length + ' Opções', 'Escolha a taça desejada ao fazer seu pedido na loja', opcoes,
    '🍦 ' + sabores.length + ' Sabores Disponíveis', 'Informe o sabor desejado ao fazer seu pedido na loja', sabores
  );
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

// Mostra duas seções (opções + sabores) dentro do acc-body
function mostrarDuasSecoes(accBodyEl, titulo1, sub1, chips1, titulo2, sub2, chips2) {
  if (!accBodyEl) return;
  var acc = accBodyEl.closest && accBodyEl.closest('.acc') ? accBodyEl.closest('.acc') : null;
  var accId = acc ? acc.id : accBodyEl.id;
  if (accId) _nivelAnterior[accId] = accBodyEl.innerHTML;

  var chips1Html = chips1.map(function(s) { return '<span class="chip-inline">' + s + '</span>'; }).join('');
  var chips2Html = chips2.map(function(s) { return '<span class="chip-inline">' + s + '</span>'; }).join('');

  accBodyEl.innerHTML =
    '<div class="sabores-inline">' +
      '<div class="sabores-inline-titulo">' + titulo1 + '</div>' +
      '<div class="sabores-inline-sub">' + sub1 + '</div>' +
      '<div class="chips-inline">' + chips1Html + '</div>' +
      '<div style="height:1px;background:linear-gradient(90deg,transparent,#E040FB,transparent);margin:14px 0"></div>' +
      '<div class="sabores-inline-titulo">' + titulo2 + '</div>' +
      '<div class="sabores-inline-sub">' + sub2 + '</div>' +
      '<div class="chips-inline">' + chips2Html + '</div>' +
      '<button type="button" class="btn-voltar-nivel" onclick="voltarNivel(this)">← Voltar</button>' +
    '</div>';
}
"""

# Substituir o bloco de funções inline
old_start = '// ── FUNÇÕES INLINE — usam CARDAPIO_MAP para localizar o container correto ────'
start_idx = content.find(old_start)

if start_idx != -1:
    # Encontrar o fim do bloco (última função: abrirComplementosInline)
    comp_start = content.find('function abrirComplementosInline', start_idx)
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
        content = content[:start_idx] + new_funcs + '\n' + content[end_comp:]
        print('OK funções inline substituídas com mostrarDuasSecoes')
    else:
        print('ERRO: abrirComplementosInline não encontrada')
else:
    print('ERRO: marcador de início não encontrado')

# Também atualizar o CARDAPIO_MAP para taças mostrarem preços + sabores
old_tacas_map = """    'acc-tacas': {
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
    },"""

new_tacas_map = """    'acc-tacas': {
      bodyId: 'tacas-body',
      titulo: function() {
        var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
        return '🍨 Taças – ' + Object.keys(t).length + ' Opções + 35 Sabores';
      },
      sub: 'Escolha a taça e o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() {
        var t = produtos && produtos.tacas && produtos.tacas.tradicionais ? produtos.tacas.tradicionais : {};
        var opcoes = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
        return opcoes.concat(['───────────────']).concat(getSaboresDisponíveis());
      }
    },"""

if old_tacas_map in content:
    content = content.replace(old_tacas_map, new_tacas_map)
    print('OK CARDAPIO_MAP taças atualizado')

old_tacas_p_map = """    'acc-tacas-p': {
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
    },"""

new_tacas_p_map = """    'acc-tacas-p': {
      bodyId: 'tacas-p-body',
      titulo: function() {
        var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
        return '👑 Taças Premium – ' + Object.keys(t).length + ' Opções + 35 Sabores';
      },
      sub: 'Escolha a taça e o sabor desejado ao fazer seu pedido na loja',
      getSabores: function() {
        var t = produtos && produtos.tacas && produtos.tacas.sujas ? produtos.tacas.sujas : {};
        var opcoes = Object.entries(t).map(function(e) { return e[0] + ' – R$ ' + e[1].toFixed(2).replace('.',','); });
        return opcoes.concat(['───────────────']).concat(getSaboresDisponíveis());
      }
    },"""

if old_tacas_p_map in content:
    content = content.replace(old_tacas_p_map, new_tacas_p_map)
    print('OK CARDAPIO_MAP taças premium atualizado')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK index.html salvo')

import subprocess
r = subprocess.run(['grep', '-c', 'mostrarDuasSecoes', 'index.html'], capture_output=True, text=True)
print(f'mostrarDuasSecoes: {r.stdout.strip()} ocorrências')
