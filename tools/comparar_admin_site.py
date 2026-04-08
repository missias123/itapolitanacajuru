#!/usr/bin/env python3
"""
Comparador Admin ↔ Site — Sorveteria Itapolitana Cajuru
Mapeia todos os campos editáveis do admin e verifica se existem no site.
"""
import re, json
from pathlib import Path

BASE = Path('/home/ubuntu/itapolitanacajuru')

# ── Lê todos os arquivos ──────────────────────────────────────────────────────
def ler(nome):
    return (BASE / nome).read_text(encoding='utf-8')

admin   = ler('admin-painel.html')
index   = ler('index.html')
promo   = ler('promocao.html')
fidel   = ler('fidelidade.html')
encom   = ler('encomendas.html')
site_all = index + promo + fidel + encom

# ── Extrai IDs do admin ───────────────────────────────────────────────────────
# Campos de input/textarea/select com id=
admin_ids = re.findall(r'(?:input|textarea|select)[^>]*\bid=["\']([^"\']+)["\']', admin)
# Funções JS chamadas via onclick no admin
admin_fns = re.findall(r'onclick=["\'][^"\']*?(\w+)\([^)]*\)', admin)
# IDs de elementos que o admin manipula via JS (getElementById)
admin_getel = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", admin)

# ── Extrai IDs do site ────────────────────────────────────────────────────────
site_ids    = re.findall(r'\bid=["\']([^"\']+)["\']', site_all)
site_fns    = re.findall(r'function\s+(\w+)\s*\(', site_all)
site_getel  = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", site_all)

# ── Agrupa por seção do admin ─────────────────────────────────────────────────
# Detecta seções pelo padrão id="sec-..."
secoes_admin = re.findall(r'id=["\']sec-([^"\']+)["\']', admin)

# ── Monta mapeamento detalhado ────────────────────────────────────────────────
resultado = {
    "secoes_admin": secoes_admin,
    "campos": [],
    "funcoes": [],
    "resumo": {}
}

# Campos (inputs/textarea/select)
ok_campos = 0
falta_site = []
for cid in sorted(set(admin_ids)):
    presente = cid in site_ids or cid in site_getel
    resultado["campos"].append({
        "id": cid,
        "no_admin": True,
        "no_site": presente,
        "status": "OK" if presente else "FALTA NO SITE"
    })
    if presente:
        ok_campos += 1
    else:
        falta_site.append(cid)

# Funções JS do admin que devem existir no site
fns_admin_set = set(admin_fns)
ok_fns = 0
falta_fns = []
for fn in sorted(fns_admin_set):
    presente = fn in site_fns
    resultado["funcoes"].append({
        "funcao": fn,
        "no_admin": True,
        "no_site": presente,
        "status": "OK" if presente else "FALTA NO SITE"
    })
    if presente:
        ok_fns += 1
    else:
        falta_fns.append(fn)

# IDs que o admin manipula via getElementById mas não existem no site
getel_falta = []
for gid in sorted(set(admin_getel)):
    if gid not in site_ids and gid not in site_getel:
        getel_falta.append(gid)

resultado["resumo"] = {
    "total_campos_admin": len(set(admin_ids)),
    "campos_ok": ok_campos,
    "campos_faltando_no_site": len(falta_site),
    "lista_campos_faltando": falta_site,
    "total_funcoes_admin": len(fns_admin_set),
    "funcoes_ok": ok_fns,
    "funcoes_faltando_no_site": len(falta_fns),
    "lista_funcoes_faltando": falta_fns,
    "ids_getel_faltando_no_site": getel_falta[:30],
    "secoes_admin": secoes_admin,
}

# Salva JSON
out = BASE / 'tools' / 'relatorio_comparacao.json'
out.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"JSON salvo em {out}")

# ── Imprime relatório legível ─────────────────────────────────────────────────
r = resultado["resumo"]
print("\n" + "="*70)
print("  RELATÓRIO DE ESPELHAMENTO — ADMIN ↔ SITE")
print("  Sorveteria Itapolitana Cajuru")
print("="*70)

print(f"\n📋 SEÇÕES DO ADMIN ({len(secoes_admin)}):")
for s in secoes_admin:
    print(f"   • sec-{s}")

print(f"\n🔢 CAMPOS EDITÁVEIS (inputs/textarea/select):")
print(f"   Total no Admin  : {r['total_campos_admin']}")
print(f"   ✅ OK no Site   : {r['campos_ok']}")
print(f"   ❌ Faltam no Site: {r['campos_faltando_no_site']}")
if falta_site:
    print(f"\n   IDs que FALTAM no site:")
    for c in falta_site:
        print(f"     ✗ {c}")

print(f"\n⚙️  FUNÇÕES JS (onclick no Admin):")
print(f"   Total no Admin  : {r['total_funcoes_admin']}")
print(f"   ✅ OK no Site   : {r['funcoes_ok']}")
print(f"   ❌ Faltam no Site: {r['funcoes_faltando_no_site']}")
if falta_fns:
    print(f"\n   Funções que FALTAM no site:")
    for f in falta_fns:
        print(f"     ✗ {f}()")

if getel_falta:
    print(f"\n🔍 IDs manipulados pelo Admin via JS mas AUSENTES no site ({len(getel_falta)}):")
    for g in getel_falta[:20]:
        print(f"     ✗ #{g}")

pct_campos = round(ok_campos/max(r['total_campos_admin'],1)*100)
pct_fns    = round(ok_fns/max(r['total_funcoes_admin'],1)*100)
print(f"\n📊 SCORE GERAL:")
print(f"   Campos espelhados : {pct_campos}%")
print(f"   Funções espelhadas: {pct_fns}%")
print("="*70)
