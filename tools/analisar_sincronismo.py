#!/usr/bin/env python3
"""
ANÁLISE COMPLETA: Sincronismo Admin↔Site, Fluxo, Instruções e Responsividade
Sorveteria Itapolitana Cajuru
"""
import re, json
from pathlib import Path
from collections import defaultdict

BASE = Path('/home/ubuntu/itapolitanacajuru')

def ler(nome):
    return (BASE / nome).read_text(encoding='utf-8')

admin   = ler('admin-painel.html')
index   = ler('index.html')
promo   = ler('promocao.html')
fidel   = ler('fidelidade.html')
encom   = ler('encomendas.html')
loader  = (BASE / 'scripts' / 'site-loader.js').read_text(encoding='utf-8') if (BASE/'scripts'/'site-loader.js').exists() else ''

site_all = index + promo + fidel + encom + loader

relatorio = {}

# ══════════════════════════════════════════════════════════════════════════════
# 1. SINCRONISMO ADMIN ↔ SITE (localStorage)
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("  1. SINCRONISMO ADMIN ↔ SITE (localStorage)")
print("="*70)

# Chaves que o admin salva via localStorage.setItem
admin_set = re.findall(r"localStorage\.setItem\(['\"]([^'\"]+)['\"]", admin)
# Chaves que o site lê via localStorage.getItem
site_get  = re.findall(r"localStorage\.getItem\(['\"]([^'\"]+)['\"]", site_all)

admin_set_uniq = sorted(set(admin_set))
site_get_uniq  = sorted(set(site_get))

sinc_ok   = []
sinc_falta = []  # admin salva mas site não lê
sinc_extra = []  # site lê mas admin não salva

for k in admin_set_uniq:
    if k in site_get_uniq:
        sinc_ok.append(k)
    else:
        sinc_falta.append(k)

for k in site_get_uniq:
    if k not in admin_set_uniq:
        sinc_extra.append(k)

relatorio['sincronismo'] = {
    'admin_salva': admin_set_uniq,
    'site_le': site_get_uniq,
    'sincronizados': sinc_ok,
    'admin_salva_mas_site_nao_le': sinc_falta,
    'site_le_mas_admin_nao_salva': sinc_extra,
}

print(f"\n  Chaves salvas pelo Admin   : {len(admin_set_uniq)}")
print(f"  Chaves lidas pelo Site     : {len(site_get_uniq)}")
print(f"  ✅ Sincronizadas           : {len(sinc_ok)}")
for k in sinc_ok:
    print(f"     ✓ {k}")

if sinc_falta:
    print(f"\n  ❌ Admin salva mas Site NÃO lê ({len(sinc_falta)}):")
    for k in sinc_falta:
        print(f"     ✗ {k}")

if sinc_extra:
    print(f"\n  ⚠️  Site lê mas Admin NÃO salva ({len(sinc_extra)}):")
    for k in sinc_extra:
        print(f"     ? {k}")

# ══════════════════════════════════════════════════════════════════════════════
# 2. FLUXO DAS SEÇÕES DO ADMIN
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("  2. FLUXO DAS SEÇÕES DO ADMIN")
print("="*70)

# Seções do admin
secoes = re.findall(r'id=["\']sec-([^"\']+)["\']', admin)
# Funções salvar por seção
salvar_fns = re.findall(r'function\s+(salvar\w+|ajustar\w+|gerar\w+|exportar\w+|copiar\w+)\s*\(', admin)
# Botões de salvar
botoes_salvar = re.findall(r'onclick=["\'][^"\']*?(salvar\w+|ajustar\w+|gerar\w+)\([^)]*\)', admin)

print(f"\n  Seções detectadas ({len(secoes)}):")
for s in secoes:
    # Verifica se tem botão salvar associado
    tem_salvar = any(s.lower().replace('-','') in fn.lower() for fn in salvar_fns)
    status = "✅" if tem_salvar else "⚠️ sem salvar()"
    print(f"     {status} sec-{s}")

print(f"\n  Funções de salvar definidas ({len(salvar_fns)}):")
for fn in sorted(set(salvar_fns)):
    # Verifica se é chamada em algum botão
    chamada = fn in botoes_salvar or any(fn in b for b in botoes_salvar)
    status = "✅" if chamada else "⚠️ não chamada em botão"
    print(f"     {status} {fn}()")

# ══════════════════════════════════════════════════════════════════════════════
# 3. INSTRUÇÕES DE PREENCHIMENTO DOS CAMPOS
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("  3. INSTRUÇÕES DE PREENCHIMENTO DOS CAMPOS DO ADMIN")
print("="*70)

# Extrai todos os campos com seus labels e placeholders
campos_admin = re.findall(
    r'<div class="campo-edit">(.*?)</div>\s*(?=<div class="campo-edit"|<div class="btn-row"|<div class="seção-título")',
    admin, re.DOTALL)

sem_label = 0
sem_placeholder = 0
sem_hint = 0
total_campos = 0

# Analisa inputs/textareas do admin
inputs = re.findall(
    r'(<(?:input|textarea|select)[^>]*>)',
    admin)

campos_detalhes = []
for inp in inputs:
    if 'type="hidden"' in inp or 'type="submit"' in inp:
        continue
    total_campos += 1
    iid = re.search(r'\bid=["\']([^"\']+)["\']', inp)
    iph = re.search(r'placeholder=["\']([^"\']+)["\']', inp)
    iid_val = iid.group(1) if iid else '(sem id)'
    iph_val = iph.group(1) if iph else None

    # Verifica se tem label antes (procura no HTML próximo)
    campos_detalhes.append({
        'id': iid_val,
        'placeholder': iph_val,
        'tem_placeholder': iph_val is not None,
    })
    if not iph_val:
        sem_placeholder += 1

# Conta hints
hints = len(re.findall(r'class=["\']hint["\']', admin))
labels = len(re.findall(r'<label\b', admin))

print(f"\n  Total de campos (input/textarea/select): {total_campos}")
print(f"  Labels (<label>)                        : {labels}")
print(f"  Hints (.hint)                           : {hints}")
print(f"  Campos com placeholder                  : {total_campos - sem_placeholder}")
print(f"  Campos SEM placeholder                  : {sem_placeholder}")

# Lista campos sem placeholder
print(f"\n  Campos sem placeholder ({sem_placeholder}):")
for c in campos_detalhes:
    if not c['tem_placeholder']:
        print(f"     ⚠️  #{c['id']}")

# ══════════════════════════════════════════════════════════════════════════════
# 4. RESPONSIVIDADE — MEDIA QUERIES NOS 3 APARELHOS
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("  4. RESPONSIVIDADE — MEDIA QUERIES NOS 3 APARELHOS")
print("="*70)

arquivos_check = {
    'index.html': index,
    'promocao.html': promo,
    'fidelidade.html': fidel,
    'encomendas.html': encom,
    'admin-painel.html': admin,
}

for fname, html in arquivos_check.items():
    mqs = re.findall(r'@media[^{]+\{', html)
    # Detecta breakpoints
    widths = re.findall(r'(?:max|min)-width:\s*(\d+)px', html)
    widths_int = sorted(set(int(w) for w in widths))

    tem_celular = any(w <= 480 for w in widths_int)
    tem_tablet  = any(481 <= w <= 768 for w in widths_int)
    tem_desktop = any(w >= 769 for w in widths_int)

    viewport = 'width=device-width' in html

    status_cel = "✅" if tem_celular else "❌"
    status_tab = "✅" if tem_tablet  else "❌"
    status_des = "✅" if tem_desktop else "❌"
    status_vp  = "✅" if viewport    else "❌"

    print(f"\n  {fname}:")
    print(f"     {status_vp} viewport meta tag")
    print(f"     {status_cel} Celular  (≤480px)  — breakpoints: {[w for w in widths_int if w <= 480]}")
    print(f"     {status_tab} Tablet   (481-768px) — breakpoints: {[w for w in widths_int if 481<=w<=768]}")
    print(f"     {status_des} Desktop  (≥769px)  — breakpoints: {[w for w in widths_int if w >= 769]}")
    print(f"     Total media queries: {len(mqs)}")

# ══════════════════════════════════════════════════════════════════════════════
# RESUMO FINAL
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("  RESUMO FINAL")
print("="*70)
print(f"  Sincronismo: {len(sinc_ok)}/{len(admin_set_uniq)} chaves OK | {len(sinc_falta)} faltando no site")
print(f"  Campos admin: {total_campos} total | {sem_placeholder} sem placeholder")
print(f"  Responsividade: verificar detalhes acima")
print("="*70)
