#!/usr/bin/env python3
# fix_admin_cardapio.py
# Adiciona no Admin:
# 1. Seção "Cardápio — Títulos e Subtítulos" com campos editáveis para cada accordion
# 2. Controle de estoque para Caixas de Sorvete 5L e 10L
# 3. Sincronismo automático com o site

import re

with open('admin-painel.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. NOVA SEÇÃO: Cardápio — Títulos e Subtítulos ──────────────────────────
NOVA_SECAO_CARDAPIO = '''
    <!-- CARDÁPIO TÍTULOS -->
    <div class="seção" id="sec-cardapio-titulos">
      <div class="card">
        <div class="card-header">
          <h2>🍦 Cardápio — Títulos e Subtítulos</h2>
          <button class="btn btn-salvar" onclick="salvarTitulosCardapio()">💾 Salvar Títulos</button>
        </div>
        <div style="background:#f3e5f5;border-left:4px solid #7b1fa2;padding:12px 16px;border-radius:8px;margin:0 0 12px;font-size:.82rem">
          🍦 <strong>Sincronismo:</strong> Cada campo aqui corresponde exatamente ao título e subtítulo visível no accordion do cardápio do site. Salvar atualiza o site imediatamente.
        </div>
        <div class="card-body">

          <div class="seção-título" style="background:linear-gradient(135deg,#7B1FA2,#E040FB,#FF4081);color:#fff;padding:10px 14px;border-radius:8px;margin-bottom:12px">🍦 Sorvetes de Massa</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-sorvetes-titulo" maxlength="60" placeholder="Sorvetes de Massa"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-sorvetes-sub" maxlength="100" placeholder="Cremoso, gelado, irresistível · 35 sabores pra você escolher"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#FF6F00,#FF8F00,#FFA000);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🍭 Picolés</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-picoles-titulo" maxlength="60" placeholder="Picolés"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-picoles-sub" maxlength="100" placeholder="Refrescante e gostoso · Fruta, Leite, Recheado, Ninho, Esquimó"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#4A148C,#7B1FA2,#E040FB);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🔥 Açaí em Promoção</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-acai-promo-titulo" maxlength="60" placeholder="🔥 Açaí em Promoção"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-acai-promo-sub" maxlength="100" placeholder="Aproveite agora! 8 combos irresistíveis · 400ml a 700ml"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#311B92,#512DA8,#7C4DFF);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🫐 Açaí tipo artesanal</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-acai-titulo" maxlength="60" placeholder="Açaí tipo artesanal"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-acai-sub" maxlength="100" placeholder="Do jeito que você ama · Monte o seu · 300ml a 600ml"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#0277BD,#0288D1,#00ACC1);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🥤 Milkshakes</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-milk-titulo" maxlength="60" placeholder="Milkshakes"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-milk-sub" maxlength="100" placeholder="Cremoso e gelado · Tradicional e Top · 35 sabores"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#AD1457,#E91E63,#F48FB1);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🍨 Taças Tradicionais</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-tacas-titulo" maxlength="60" placeholder="Taças"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-tacas-sub" maxlength="100" placeholder="Uma experiência única · Colegial, Sundae, Banana Split e mais"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#BF360C,#E64A19,#FF6D00);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">👑 Taças Premium</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-tacas-p-titulo" maxlength="60" placeholder="Taças Premium (Taças Sujas)"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-tacas-p-sub" maxlength="100" placeholder="O melhor da sorveteria · Prestígio, Kit Kat, Unicórnio e mais"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#00695C,#00897B,#26A69A);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🧊 Isopores de Viagem</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-iso-titulo" maxlength="60" placeholder="Isopores de Viagem"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-iso-sub" maxlength="100" placeholder="Leve o prazer para casa · 4 tamanhos disponíveis"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#1A237E,#283593,#3949AB);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🍰 Sobremesas Geladas</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-sobremesas-titulo" maxlength="60" placeholder="Sobremesas Geladas"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-sobremesas-sub" maxlength="100" placeholder="Momentos especiais merecem isso · Fondue, Petit Gâteau, Brownie e mais"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#6A1B9A,#8E24AA,#AB47BC);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">📦 Sorvetes em Caixa 5 e 10 Litros</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-caixas-titulo" maxlength="60" placeholder="Sorvetes em Caixa 5 e 10 Litros"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-caixas-sub" maxlength="100" placeholder="Ideal para festas e eventos · 2 ou 3 sabores à escolha"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#B71C1C,#C62828,#E53935);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🎂 Tortas de Sorvete</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-torta-titulo" maxlength="60" placeholder="Tortas de Sorvete"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-torta-sub" maxlength="100" placeholder="Faça a festa! 3 sabores · Encomende com 3 dias de antecedência"/></div>

          <div class="seção-título" style="background:linear-gradient(135deg,#E65100,#F57C00,#FFB300);color:#fff;padding:10px 14px;border-radius:8px;margin:16px 0 12px">🍭 Picolés para Encomenda</div>
          <div class="campo-edit"><label>Título</label><input type="text" id="acc-enc-picoles-titulo" maxlength="60" placeholder="Picolés para Encomenda"/></div>
          <div class="campo-edit"><label>Subtítulo</label><input type="text" id="acc-enc-picoles-sub" maxlength="100" placeholder="Preço especial de atacado · 5 tipos · Mín. 100 unidades"/></div>

          <div class="btn-row"><button class="btn btn-salvar" onclick="salvarTitulosCardapio()">💾 Salvar Títulos do Cardápio</button></div>
        </div>
      </div>
    </div>
'''

# ── 2. NOVA SEÇÃO: Estoque de Caixas de Sorvete ─────────────────────────────
NOVA_SECAO_CAIXAS = '''
    <!-- ESTOQUE CAIXAS -->
    <div class="seção" id="sec-estoque-caixas">
      <div class="card">
        <div class="card-header">
          <h2>📦 Estoque — Caixas de Sorvete 5L e 10L</h2>
          <button class="btn btn-salvar" onclick="salvarEstoqueCaixas()">💾 Salvar Estoque</button>
        </div>
        <div style="background:#e8f5e9;border-left:4px solid #2e7d32;padding:12px 16px;border-radius:8px;margin:0 0 12px;font-size:.82rem">
          📦 <strong>Regra:</strong> Quando o estoque chegar a zero, o produto aparece com tarja <strong>ESGOTADO</strong> no cardápio e fica bloqueado nas encomendas. Atualiza o site imediatamente ao salvar.
        </div>
        <div class="card-body">
          <div class="seção-título">📦 Caixas de 5 Litros</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div class="campo-edit">
              <label>5L — 2 Sabores (Estoque)</label>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="btn" style="padding:6px 12px;font-size:18px" onclick="ajustarEstoqueCaixa('caixa_5l_2s',-1)">−</button>
                <input type="number" id="caixa_5l_2s" min="0" max="999" value="0" style="width:80px;text-align:center;font-size:1.2rem;font-weight:800"/>
                <button class="btn btn-verde" style="padding:6px 12px;font-size:18px" onclick="ajustarEstoqueCaixa('caixa_5l_2s',1)">+</button>
              </div>
              <div id="status_caixa_5l_2s" style="margin-top:4px;font-weight:700;color:#e53935">ESGOTADO</div>
            </div>
            <div class="campo-edit">
              <label>5L — 3 Sabores (Estoque)</label>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="btn" style="padding:6px 12px;font-size:18px" onclick="ajustarEstoqueCaixa('caixa_5l_3s',-1)">−</button>
                <input type="number" id="caixa_5l_3s" min="0" max="999" value="0" style="width:80px;text-align:center;font-size:1.2rem;font-weight:800"/>
                <button class="btn btn-verde" style="padding:6px 12px;font-size:18px" onclick="ajustarEstoqueCaixa('caixa_5l_3s',1)">+</button>
              </div>
              <div id="status_caixa_5l_3s" style="margin-top:4px;font-weight:700;color:#e53935">ESGOTADO</div>
            </div>
          </div>
          <div class="seção-título">📦 Caixas de 10 Litros</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="campo-edit">
              <label>10L — 2 Sabores (Estoque)</label>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="btn" style="padding:6px 12px;font-size:18px" onclick="ajustarEstoqueCaixa('caixa_10l_2s',-1)">−</button>
                <input type="number" id="caixa_10l_2s" min="0" max="999" value="0" style="width:80px;text-align:center;font-size:1.2rem;font-weight:800"/>
                <button class="btn btn-verde" style="padding:6px 12px;font-size:18px" onclick="ajustarEstoqueCaixa('caixa_10l_2s',1)">+</button>
              </div>
              <div id="status_caixa_10l_2s" style="margin-top:4px;font-weight:700;color:#e53935">ESGOTADO</div>
            </div>
            <div class="campo-edit">
              <label>10L — 3 Sabores (Estoque)</label>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="btn" style="padding:6px 12px;font-size:18px" onclick="ajustarEstoqueCaixa('caixa_10l_3s',-1)">−</button>
                <input type="number" id="caixa_10l_3s" min="0" max="999" value="0" style="width:80px;text-align:center;font-size:1.2rem;font-weight:800"/>
                <button class="btn btn-verde" style="padding:6px 12px;font-size:18px" onclick="ajustarEstoqueCaixa('caixa_10l_3s',1)">+</button>
              </div>
              <div id="status_caixa_10l_3s" style="margin-top:4px;font-weight:700;color:#e53935">ESGOTADO</div>
            </div>
          </div>
          <div class="btn-row" style="margin-top:16px"><button class="btn btn-salvar" onclick="salvarEstoqueCaixas()">💾 Salvar Estoque de Caixas</button></div>
        </div>
      </div>
    </div>
'''

# ── 3. FUNÇÕES JS para salvarTitulosCardapio e salvarEstoqueCaixas ───────────
JS_FUNCOES = '''
// ── TÍTULOS DO CARDÁPIO ──────────────────────────────────────────────────────
function carregarTitulosCardapio() {
  var cfg = JSON.parse(localStorage.getItem('cfg_titulos_cardapio') || '{}');
  var campos = [
    ['acc-sorvetes-titulo','Sorvetes de Massa'],
    ['acc-sorvetes-sub','Cremoso, gelado, irresistível · 35 sabores pra você escolher'],
    ['acc-picoles-titulo','Picolés'],
    ['acc-picoles-sub','Refrescante e gostoso · Fruta, Leite, Recheado, Ninho, Esquimó'],
    ['acc-acai-promo-titulo','🔥 Açaí em Promoção'],
    ['acc-acai-promo-sub','Aproveite agora! 8 combos irresistíveis · 400ml a 700ml'],
    ['acc-acai-titulo','Açaí tipo artesanal'],
    ['acc-acai-sub','Do jeito que você ama · Monte o seu · 300ml a 600ml'],
    ['acc-milk-titulo','Milkshakes'],
    ['acc-milk-sub','Cremoso e gelado · Tradicional e Top · 35 sabores'],
    ['acc-tacas-titulo','Taças'],
    ['acc-tacas-sub','Uma experiência única · Colegial, Sundae, Banana Split e mais'],
    ['acc-tacas-p-titulo','Taças Premium (Taças Sujas)'],
    ['acc-tacas-p-sub','O melhor da sorveteria · Prestígio, Kit Kat, Unicórnio e mais'],
    ['acc-iso-titulo','Isopores de Viagem'],
    ['acc-iso-sub','Leve o prazer para casa · 4 tamanhos disponíveis'],
    ['acc-sobremesas-titulo','Sobremesas Geladas'],
    ['acc-sobremesas-sub','Momentos especiais merecem isso · Fondue, Petit Gâteau, Brownie e mais'],
    ['acc-caixas-titulo','Sorvetes em Caixa 5 e 10 Litros'],
    ['acc-caixas-sub','Ideal para festas e eventos · 2 ou 3 sabores à escolha'],
    ['acc-torta-titulo','Tortas de Sorvete'],
    ['acc-torta-sub','Faça a festa! 3 sabores · Encomende com 3 dias de antecedência'],
    ['acc-enc-picoles-titulo','Picolés para Encomenda'],
    ['acc-enc-picoles-sub','Preço especial de atacado · 5 tipos · Mín. 100 unidades']
  ];
  campos.forEach(function(c) {
    var el = document.getElementById(c[0]);
    if (el) el.value = cfg[c[0]] || c[1];
  });
}

function salvarTitulosCardapio() {
  var campos = ['acc-sorvetes-titulo','acc-sorvetes-sub','acc-picoles-titulo','acc-picoles-sub',
    'acc-acai-promo-titulo','acc-acai-promo-sub','acc-acai-titulo','acc-acai-sub',
    'acc-milk-titulo','acc-milk-sub','acc-tacas-titulo','acc-tacas-sub',
    'acc-tacas-p-titulo','acc-tacas-p-sub','acc-iso-titulo','acc-iso-sub',
    'acc-sobremesas-titulo','acc-sobremesas-sub','acc-caixas-titulo','acc-caixas-sub',
    'acc-torta-titulo','acc-torta-sub','acc-enc-picoles-titulo','acc-enc-picoles-sub'];
  var cfg = {};
  campos.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) cfg[id] = el.value.trim();
  });
  localStorage.setItem('cfg_titulos_cardapio', JSON.stringify(cfg));
  mostrarToast('✅ Títulos do cardápio salvos! O site será atualizado ao recarregar.');
}

// ── ESTOQUE CAIXAS ───────────────────────────────────────────────────────────
function carregarEstoqueCaixas() {
  var est = JSON.parse(localStorage.getItem('estoque_caixas') || '{}');
  ['caixa_5l_2s','caixa_5l_3s','caixa_10l_2s','caixa_10l_3s'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.value = est[id] !== undefined ? est[id] : 0;
      atualizarStatusCaixa(id, parseInt(el.value));
    }
  });
}

function ajustarEstoqueCaixa(id, delta) {
  var el = document.getElementById(id);
  if (!el) return;
  var v = Math.max(0, Math.min(999, parseInt(el.value || 0) + delta));
  el.value = v;
  atualizarStatusCaixa(id, v);
}

function atualizarStatusCaixa(id, v) {
  var st = document.getElementById('status_' + id);
  if (!st) return;
  if (v === 0) {
    st.textContent = '🔴 ESGOTADO';
    st.style.color = '#e53935';
  } else {
    st.textContent = '🟢 Disponível — ' + v + ' unidade(s)';
    st.style.color = '#2e7d32';
  }
}

function salvarEstoqueCaixas() {
  var est = {};
  ['caixa_5l_2s','caixa_5l_3s','caixa_10l_2s','caixa_10l_3s'].forEach(function(id) {
    var el = document.getElementById(id);
    est[id] = el ? parseInt(el.value || 0) : 0;
  });
  localStorage.setItem('estoque_caixas', JSON.stringify(est));
  mostrarToast('✅ Estoque de caixas salvo! O site reflete imediatamente.');
}
'''

# ── 4. BOTÕES DE NAVEGAÇÃO no menu lateral ───────────────────────────────────
# Adicionar os novos itens no menu de navegação do admin
NAV_CARDAPIO_TITULOS = '<li class="nav-item" onclick="irPara(\'sec-cardapio-titulos\')">🏷️ Títulos do Cardápio</li>'
NAV_ESTOQUE_CAIXAS = '<li class="nav-item" onclick="irPara(\'sec-estoque-caixas\')">📦 Estoque Caixas 5L/10L</li>'

# Inserir as novas seções antes do fechamento do main
if 'id="sec-cardapio-titulos"' not in html:
    # Inserir antes de <!-- ENCOMENDAS -->
    html = html.replace('    <!-- ENCOMENDAS -->', NOVA_SECAO_CARDAPIO + '\n    <!-- ENCOMENDAS -->', 1)
    print('OK seção Títulos do Cardápio inserida')
else:
    print('SKIP seção Títulos do Cardápio já existe')

if 'id="sec-estoque-caixas"' not in html:
    # Inserir antes de <!-- ENCOMENDAS -->
    html = html.replace('    <!-- ENCOMENDAS -->', NOVA_SECAO_CAIXAS + '\n    <!-- ENCOMENDAS -->', 1)
    print('OK seção Estoque Caixas inserida')
else:
    print('SKIP seção Estoque Caixas já existe')

# Inserir funções JS antes do </script> final
if 'salvarTitulosCardapio' not in html:
    html = html.replace('</script>\n</body>', JS_FUNCOES + '\n</script>\n</body>', 1)
    if 'salvarTitulosCardapio' not in html:
        # Tenta outra posição
        html = html.replace('</script>', JS_FUNCOES + '\n</script>', 1)
    print('OK funções JS inseridas')
else:
    print('SKIP funções JS já existem')

# Inserir itens no menu lateral
if 'sec-cardapio-titulos' not in html:
    html = html.replace(
        "onclick=\"irPara('sec-sabores')\">🍦 Sabores",
        "onclick=\"irPara('sec-cardapio-titulos')\">🏷️ Títulos do Cardápio</li>\n      <li class=\"nav-item\" onclick=\"irPara('sec-sabores')\">🍦 Sabores"
    )
    print('OK item menu Títulos do Cardápio inserido')

if 'sec-estoque-caixas' not in html:
    html = html.replace(
        "onclick=\"irPara('sec-estoque')\">📦 Estoque",
        "onclick=\"irPara('sec-estoque-caixas')\">📦 Estoque Caixas 5L/10L</li>\n      <li class=\"nav-item\" onclick=\"irPara('sec-estoque')\">📦 Estoque"
    )
    print('OK item menu Estoque Caixas inserido')

# Adicionar carregarTitulosCardapio e carregarEstoqueCaixas no carregarAdmin
if 'carregarTitulosCardapio()' not in html:
    html = html.replace(
        'carregarEstoque();',
        'carregarEstoque();\n  carregarTitulosCardapio();\n  carregarEstoqueCaixas();'
    )
    print('OK carregarTitulosCardapio e carregarEstoqueCaixas adicionados ao carregarAdmin')

with open('admin-painel.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('OK admin-painel.html salvo')
