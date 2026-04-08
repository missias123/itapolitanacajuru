#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Adiciona botão ← Voltar ao Início do Cardápio em todas as funções render."""

import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

def btn_voltar(acc_id):
    return (
        f"  const _vb=document.createElement('div');_vb.style='padding:6px 0 2px';\n"
        f"  _vb.innerHTML='<button type=\"button\" class=\"btn-voltar-inicio\" "
        f"onclick=\"toggleAcc(\\'{acc_id}\\');document.getElementById(\\'{acc_id}\\').scrollIntoView({{behavior:\\'smooth\\',block:\\'start\\'}})\">← Voltar ao Início do Cardápio</button>';\n"
    )

count = 0

# ── renderSorvetes ───────────────────────────────────────────────────────────
m = re.search(r'(function renderSorvetes\(\)\{.*?g\.appendChild\(c\);\s*\}\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-sorvetes') + '  g.parentElement.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderSorvetes')
else: print('⚠️  renderSorvetes')

# ── renderMilk ───────────────────────────────────────────────────────────────
m = re.search(r'(function renderMilk\(\)\{.*?g\.appendChild\(c\);\s*\}\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-milk') + '  g.parentElement.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderMilk')
else: print('⚠️  renderMilk')

# ── renderTacas ──────────────────────────────────────────────────────────────
m = re.search(r'(function renderTacas\(\)\{.*?g\.appendChild\(c\);\s*\}\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-tacas') + '  g.parentElement.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderTacas')
else: print('⚠️  renderTacas')

# ── renderTacasP ─────────────────────────────────────────────────────────────
m = re.search(r'(function renderTacasP\(\)\{.*?g\.appendChild\(c\);\s*\}\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-tacas-p') + '  g.parentElement.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderTacasP')
else: print('⚠️  renderTacasP')

# ── renderAçaíPromo ──────────────────────────────────────────────────────────
m = re.search(r'(function renderA\u00e7a\u00edPromo\(\)\{.*?b\.appendChild\(d\);\s*\}\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-açaí-promo') + '  b.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderAçaíPromo')
else: print('⚠️  renderAçaíPromo')

# ── renderAçaí ───────────────────────────────────────────────────────────────
m = re.search(r'(function renderA\u00e7a\u00ed\(\)\{.*?b\.appendChild\(d\);\s*\}\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-açaí') + '  b.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderAçaí')
else: print('⚠️  renderAçaí')

# ── renderPicolés ────────────────────────────────────────────────────────────
m = re.search(r'(function renderPicol\u00e9s\(\)\{.*?b\.appendChild\(grid\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-picolés') + '  b.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderPicolés')
else: print('⚠️  renderPicolés')

# ── renderIso ────────────────────────────────────────────────────────────────
m = re.search(r'(function renderIso\(\)\{.*?b\.appendChild\(btn\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-iso') + '  b.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderIso')
else: print('⚠️  renderIso')

# ── renderSobremesas ─────────────────────────────────────────────────────────
m = re.search(r'(function renderSobremesas\(\)\{.*?b\.appendChild\(btn\);\s*\}\s*\})', html, re.DOTALL)
if m:
    old = m.group(1)
    new = old.rstrip('}') + '\n' + btn_voltar('acc-sobremesas') + '  b.appendChild(_vb);\n}'
    html = html.replace(old, new, 1); count += 1; print('✅ renderSobremesas')
else: print('⚠️  renderSobremesas')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f'\n✅ {count}/9 funções atualizadas. index.html salvo!')
