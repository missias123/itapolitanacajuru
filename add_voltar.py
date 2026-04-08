#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Adiciona botão Voltar ao Início nas funções render do cardápio."""

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── renderAçaíPromo ──────────────────────────────────────────────────────────
OLD1 = '''function renderAçaíPromo(){
  const b=document.getElementById('açaí-promo-body');if(!b)return;b.innerHTML='';
  if(produtos&&produtos.açaí_promoção){
    produtos.açaí_promoção.forEach((p,i)=>{
      const d=document.createElement('div');d.className='açaí-item';
      d.innerHTML=`<div class="açaí-row"><span class="açaí-nome">🛖 ${p.nome}</span><span class="açaí-preço">R$ ${p.preço.toFixed(2).replace('.',',')}</span></div><div class="açaí-desc">${p.desc}</div>`;
      b.appendChild(d);
    });
  }
}'''
NEW1 = '''function renderAçaíPromo(){
  const b=document.getElementById('açaí-promo-body');if(!b)return;b.innerHTML='';
  if(produtos&&produtos.açaí_promoção){
    produtos.açaí_promoção.forEach((p,i)=>{
      const d=document.createElement('div');d.className='açaí-item';
      d.innerHTML=`<div class="açaí-row"><span class="açaí-nome">🛖 ${p.nome}</span><span class="açaí-preço">R$ ${p.preço.toFixed(2).replace('.',',')}</span></div><div class="açaí-desc">${p.desc}</div>`;
      b.appendChild(d);
    });
  }
  const vb=document.createElement('div');vb.style='padding:4px 0 2px';
  vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="toggleAcc(\'acc-açaí-promo\');window.scrollTo({top:document.getElementById(\'acc-açaí-promo\').offsetTop-80,behavior:\'smooth\'})">← Voltar ao Início do Cardápio</button>';
  b.appendChild(vb);
}'''

# ── renderAçaí ───────────────────────────────────────────────────────────────
OLD2 = '''function renderAçaí(){
  const b=document.getElementById('açaí-body');b.innerHTML='';
  if(produtos&&produtos.açaí&&produtos.açaí.copos){
    Object.entries(produtos.açaí.copos).forEach(([tam,preço])=>{
      const d=document.createElement('div');d.className='açaí-item';
      d.innerHTML=`<div class="açaí-row"><span class="açaí-nome">🫐 Monte o Seu ${tam}</span><span class="açaí-preço">R$ ${preço.toFixed(2).replace('.',',')}</span></div><div class="açaí-desc">Todos ingredientes extras</div><div class="btn-row-grid"><button type="button" class="btn-comp" onclick="abrirComplementos(this)">🍓 Ver Ingredientes</button></div>`;
      b.appendChild(d);
    });
  }
}'''
NEW2 = '''function renderAçaí(){
  const b=document.getElementById('açaí-body');b.innerHTML='';
  if(produtos&&produtos.açaí&&produtos.açaí.copos){
    Object.entries(produtos.açaí.copos).forEach(([tam,preço])=>{
      const d=document.createElement('div');d.className='açaí-item';
      d.innerHTML=`<div class="açaí-row"><span class="açaí-nome">🫐 Monte o Seu ${tam}</span><span class="açaí-preço">R$ ${preço.toFixed(2).replace('.',',')}</span></div><div class="açaí-desc">Todos ingredientes extras</div><div class="btn-row-grid"><button type="button" class="btn-comp" onclick="abrirComplementos(this)">🍓 Ver Ingredientes</button></div>`;
      b.appendChild(d);
    });
  }
  const vb=document.createElement('div');vb.style='padding:4px 0 2px';
  vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="toggleAcc(\'acc-açaí\');window.scrollTo({top:document.getElementById(\'acc-açaí\').offsetTop-80,behavior:\'smooth\'})">← Voltar ao Início do Cardápio</button>';
  b.appendChild(vb);
}'''

# ── renderIso ────────────────────────────────────────────────────────────────
OLD3 = '''    b.appendChild(btn);
  }
}
function renderSobremesas(){'''
NEW3 = '''    b.appendChild(btn);
  }
  // Botão Voltar ao Início — Isopores
  const vbi=document.createElement('div');vbi.style='padding:4px 0 2px';
  vbi.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="toggleAcc(\'acc-iso\');window.scrollTo({top:document.getElementById(\'acc-iso\').offsetTop-80,behavior:\'smooth\'})">← Voltar ao Início do Cardápio</button>';
  b.appendChild(vbi);
}
function renderSobremesas(){'''

# ── renderSobremesas ─────────────────────────────────────────────────────────
OLD4 = '''    b.appendChild(btn);
  }
}
function getSaboresDisponíveis(){'''
NEW4 = '''    b.appendChild(btn);
  }
  // Botão Voltar ao Início — Sobremesas
  const vbs=document.createElement('div');vbs.style='padding:4px 0 2px';
  vbs.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="toggleAcc(\'acc-sobremesas\');window.scrollTo({top:document.getElementById(\'acc-sobremesas\').offsetTop-80,behavior:\'smooth\'})">← Voltar ao Início do Cardápio</button>';
  b.appendChild(vbs);
}
function getSaboresDisponíveis(){'''

# ── renderPicolés ────────────────────────────────────────────────────────────
OLD5 = '''    b.appendChild(grid);
  }
}
function getSaboresDisponíveis(){'''
NEW5 = '''    b.appendChild(grid);
  }
  // Botão Voltar ao Início — Picolés
  const vbpic=document.createElement('div');vbpic.style='padding:4px 0 2px';
  vbpic.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="toggleAcc(\'acc-picolés\');window.scrollTo({top:document.getElementById(\'acc-picolés\').offsetTop-80,behavior:\'smooth\'})">← Voltar ao Início do Cardápio</button>';
  b.appendChild(vbpic);
}
function getSaboresDisponíveis(){'''

changes = [
    (OLD1, NEW1, 'renderAçaíPromo'),
    (OLD2, NEW2, 'renderAçaí'),
]

for old, new, name in changes:
    if old in html:
        html = html.replace(old, new, 1)
        print(f'✅ {name} — botão Voltar adicionado')
    else:
        print(f'⚠️  {name} — padrão não encontrado')

# renderIso e renderSobremesas — usar marcadores mais específicos
# Encontrar o padrão correto para renderIso
import re

# renderIso: adicionar após o segundo b.appendChild(btn)
# Encontrar a função renderIso completa
iso_match = re.search(r'(function renderIso\(\)\{.*?b\.appendChild\(btn\);\s*\}\s*\})', html, re.DOTALL)
if iso_match:
    old_iso = iso_match.group(1)
    new_iso = old_iso.rstrip('}') + '''
  // Botão Voltar ao Início — Isopores
  const vbi=document.createElement('div');vbi.style='padding:4px 0 2px';
  vbi.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="toggleAcc(\'acc-iso\');window.scrollTo({top:document.getElementById(\'acc-iso\').offsetTop-80,behavior:\'smooth\'})">← Voltar ao Início do Cardápio</button>';
  b.appendChild(vbi);
}'''
    html = html.replace(old_iso, new_iso, 1)
    print('✅ renderIso — botão Voltar adicionado')
else:
    print('⚠️  renderIso — padrão não encontrado')

# renderSobremesas: adicionar após o segundo b.appendChild(btn)
sob_match = re.search(r'(function renderSobremesas\(\)\{.*?b\.appendChild\(btn\);\s*\}\s*\})', html, re.DOTALL)
if sob_match:
    old_sob = sob_match.group(1)
    new_sob = old_sob.rstrip('}') + '''
  // Botão Voltar ao Início — Sobremesas
  const vbs=document.createElement('div');vbs.style='padding:4px 0 2px';
  vbs.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="toggleAcc(\'acc-sobremesas\');window.scrollTo({top:document.getElementById(\'acc-sobremesas\').offsetTop-80,behavior:\'smooth\'})">← Voltar ao Início do Cardápio</button>';
  b.appendChild(vbs);
}'''
    html = html.replace(old_sob, new_sob, 1)
    print('✅ renderSobremesas — botão Voltar adicionado')
else:
    print('⚠️  renderSobremesas — padrão não encontrado')

# renderPicolés: adicionar após b.appendChild(grid)
pic_match = re.search(r'(function renderPicol\u00e9s\(\)\{.*?b\.appendChild\(grid\);\s*\}\s*\})', html, re.DOTALL)
if pic_match:
    old_pic = pic_match.group(1)
    new_pic = old_pic.rstrip('}') + '''
  // Botão Voltar ao Início — Picolés
  const vbpic=document.createElement('div');vbpic.style='padding:4px 0 2px';
  vbpic.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="toggleAcc(\'acc-picolés\');window.scrollTo({top:document.getElementById(\'acc-picolés\').offsetTop-80,behavior:\'smooth\'})">← Voltar ao Início do Cardápio</button>';
  b.appendChild(vbpic);
}'''
    html = html.replace(old_pic, new_pic, 1)
    print('✅ renderPicolés — botão Voltar adicionado')
else:
    print('⚠️  renderPicolés — padrão não encontrado')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('\n✅ index.html atualizado com sucesso!')
