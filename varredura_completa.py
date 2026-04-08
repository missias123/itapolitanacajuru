#!/usr/bin/env python3
# =============================================================================
# VARREDURA PROFISSIONAL — Sorveteria Itapolitana Cajuru
# Compara site vs admin, detecta duplicados, códigos soltos, falta de sincronismo
# Padrão: iFood / Shopify / Nubank
# =============================================================================
import re
from collections import defaultdict

# ---- Carregar arquivos ----
with open('index.html', encoding='utf-8') as f:
    site = f.read()
with open('admin-painel.html', encoding='utf-8') as f:
    admin = f.read()
with open('scripts/enc-v2.js', encoding='utf-8') as f:
    enc = f.read()

site_lines  = site.split('\n')
admin_lines = admin.split('\n')

relatorio = []
problemas = []
ok_list   = []

def sec(titulo):
    relatorio.append('\n' + '='*70)
    relatorio.append(f'  {titulo}')
    relatorio.append('='*70)

def prob(msg):
    problemas.append(f'  ❌ {msg}')
    relatorio.append(f'  ❌ {msg}')

def ok(msg):
    ok_list.append(f'  ✅ {msg}')
    relatorio.append(f'  ✅ {msg}')

def info(msg):
    relatorio.append(f'  ℹ️  {msg}')

# =============================================================================
# 1. BLOCOS <script> SOLTOS
# =============================================================================
sec('1. BLOCOS <script> SOLTOS NO SITE (index.html)')
scripts_site = [(i+1, l.strip()) for i, l in enumerate(site_lines) if '<script' in l and 'src=' not in l and 'application/ld' not in l]
info(f'Total de blocos <script> inline encontrados: {len(scripts_site)}')
for ln, txt in scripts_site:
    relatorio.append(f'     Linha {ln}: {txt[:80]}')

sec('2. BLOCOS <script> SOLTOS NO ADMIN (admin-painel.html)')
scripts_admin = [(i+1, l.strip()) for i, l in enumerate(admin_lines) if '<script' in l and 'src=' not in l and 'application/ld' not in l]
info(f'Total de blocos <script> inline encontrados: {len(scripts_admin)}')
for ln, txt in scripts_admin:
    relatorio.append(f'     Linha {ln}: {txt[:80]}')
if len(scripts_admin) > 1:
    prob(f'Admin tem {len(scripts_admin)} blocos <script> — deveria ter apenas 1. Blocos extras são códigos soltos.')
else:
    ok('Admin tem apenas 1 bloco <script> — correto.')

# =============================================================================
# 2. FUNÇÕES DUPLICADAS
# =============================================================================
sec('3. FUNÇÕES DUPLICADAS NO SITE (index.html)')
funcs_site = re.findall(r'(?:^|\n)\s*(?:async\s+)?function\s+(\w+)\s*\(', site)
contagem_site = defaultdict(int)
for f in funcs_site:
    contagem_site[f] += 1
dups_site = {f: c for f, c in contagem_site.items() if c > 1}
if dups_site:
    for f, c in sorted(dups_site.items()):
        prob(f'Função "{f}" declarada {c}x no site — DUPLICADA')
else:
    ok('Nenhuma função duplicada no site.')

sec('4. FUNÇÕES DUPLICADAS NO ADMIN (admin-painel.html)')
funcs_admin = re.findall(r'(?:^|\n)\s*(?:async\s+)?function\s+(\w+)\s*\(', admin)
contagem_admin = defaultdict(int)
for f in funcs_admin:
    contagem_admin[f] += 1
dups_admin = {f: c for f, c in contagem_admin.items() if c > 1}
if dups_admin:
    for f, c in sorted(dups_admin.items()):
        prob(f'Função "{f}" declarada {c}x no admin — DUPLICADA')
else:
    ok('Nenhuma função duplicada no admin.')

# =============================================================================
# 3. VARIÁVEIS GLOBAIS DUPLICADAS
# =============================================================================
sec('5. VARIÁVEIS GLOBAIS DUPLICADAS NO SITE')
vars_site = re.findall(r'(?:^|\n)\s*(?:var|let|const)\s+(\w+)\s*[=;]', site)
contagem_vars = defaultdict(int)
for v in vars_site:
    contagem_vars[v] += 1
dups_vars = {v: c for v, c in contagem_vars.items() if c > 1}
if dups_vars:
    for v, c in sorted(dups_vars.items()):
        prob(f'Variável "{v}" declarada {c}x no site — DUPLICADA')
else:
    ok('Nenhuma variável global duplicada no site.')

# =============================================================================
# 4. IDs DUPLICADOS NO HTML
# =============================================================================
sec('6. IDs HTML DUPLICADOS NO SITE (excluindo templates JS)')
ids_site = re.findall(r'\bid=["\']([^"\'${}]+)["\']', site)
contagem_ids = defaultdict(int)
for id_ in ids_site:
    if '$' not in id_ and '{' not in id_:
        contagem_ids[id_] += 1
dups_ids = {i: c for i, c in contagem_ids.items() if c > 1}
if dups_ids:
    for i, c in sorted(dups_ids.items()):
        prob(f'ID "{i}" aparece {c}x no site — DUPLICADO')
else:
    ok('Nenhum ID HTML duplicado no site.')

sec('7. IDs HTML DUPLICADOS NO ADMIN (excluindo templates JS)')
ids_admin = re.findall(r'\bid=["\']([^"\'${}]+)["\']', admin)
contagem_ids_admin = defaultdict(int)
for id_ in ids_admin:
    if '$' not in id_ and '{' not in id_:
        contagem_ids_admin[id_] += 1
dups_ids_admin = {i: c for i, c in contagem_ids_admin.items() if c > 1}
if dups_ids_admin:
    for i, c in sorted(dups_ids_admin.items()):
        prob(f'ID "{i}" aparece {c}x no admin — DUPLICADO')
else:
    ok('Nenhum ID HTML duplicado no admin.')

# =============================================================================
# 5. SINCRONISMO: ELEMENTOS DO SITE vs CAMPOS DO ADMIN
# =============================================================================
sec('8. SINCRONISMO — ELEMENTOS EDITÁVEIS DO SITE vs CAMPOS DO ADMIN')

# Elementos editáveis do site (IDs que o aplicarConfig deve aplicar)
elementos_site = {
    'hero-título':        'Título principal do hero',
    'hero-descrição':     'Descrição do hero',
    'hero-badge':         'Badge/etiqueta do hero',
    'strip-sensorial':    'Faixa sensorial (strip)',
    'brand-name':         'Nome da marca no header',
    'brand-sub':          'Subtítulo da marca',
    'footer-copy':        'Texto de copyright do rodapé',
    'footer-horário':     'Horário no rodapé',
    'nav-promo-btn':      'Botão Promoção na navegação',
    'nav-dicas-btn':      'Botão Dicas na navegação',
    'nav-fidelidade-btn': 'Botão Fidelidade na navegação',
    'hero-cta-whats':     'Botão WhatsApp do hero',
    'info-endereco':      'Endereço nos info-cards',
    'info-horario':       'Horário nos info-cards',
    'info-whats':         'WhatsApp nos info-cards',
    'info-insta':         'Instagram nos info-cards',
}

# Verificar se o site tem esses IDs
for elem_id, descricao in elementos_site.items():
    if f'id="{elem_id}"' in site or f"id='{elem_id}'" in site:
        # Verificar se aplicarConfig aplica esse elemento
        if elem_id in site and ('getElementById' in site or 'querySelector' in site):
            ok(f'Site tem #{elem_id} ({descricao})')
        else:
            prob(f'Site tem #{elem_id} mas aplicarConfig pode não aplicar ({descricao})')
    else:
        prob(f'Site NÃO tem #{elem_id} — elemento "{descricao}" não encontrado')

# Verificar se o admin tem campos para esses elementos
sec('9. CAMPOS DO ADMIN PARA CADA ELEMENTO DO SITE')
campos_admin_esperados = {
    'hero_titulo':        'Título do hero',
    'hero_desc':          'Descrição do hero',
    'hero_badge':         'Badge do hero',
    'strip_texto':        'Texto da faixa sensorial',
    'brand_name':         'Nome da marca',
    'brand_sub':          'Subtítulo da marca',
    'footer_copy':        'Copyright do rodapé',
    'hora_abre':          'Horário de abertura',
    'hora_fecha':         'Horário de fechamento',
    'whats_numero':       'Número do WhatsApp',
    'insta_usuario':      'Usuário do Instagram',
    'endereco_texto':     'Endereço completo',
}

for campo_id, descricao in campos_admin_esperados.items():
    if f'id="{campo_id}"' in admin or f"id='{campo_id}'" in admin:
        ok(f'Admin tem campo #{campo_id} ({descricao})')
    else:
        prob(f'Admin NÃO tem campo #{campo_id} — "{descricao}" não editável')

# =============================================================================
# 6. VERIFICAR SE SITE LÊ DO produtos.json (não do GIST)
# =============================================================================
sec('10. FONTE DE DADOS — GIST vs produtos.json')
if 'GIST' in site:
    prob('Site ainda referencia GIST — deve usar dados/produtos.json')
else:
    ok('Site não usa GIST — usa dados/produtos.json ✅')

if 'GIST' in enc:
    prob('enc-v2.js ainda referencia GIST — deve usar dados/produtos.json')
else:
    ok('enc-v2.js não usa GIST — usa dados/produtos.json ✅')

if 'GIST' in admin:
    prob('Admin ainda referencia GIST')
else:
    ok('Admin não usa GIST ✅')

# =============================================================================
# 7. VERIFICAR aplicarConfig() NO SITE
# =============================================================================
sec('11. FUNÇÃO aplicarConfig() NO SITE')
if 'function aplicarConfig' in site or 'async function aplicarConfig' in site:
    ok('Função aplicarConfig() encontrada no site ✅')
    # Verificar quais elementos ela aplica
    match = re.search(r'(?:async\s+)?function\s+aplicarConfig\s*\([^)]*\)\s*\{(.*?)(?=\n(?:async\s+)?function\s|\n</script>)', site, re.DOTALL)
    if match:
        corpo = match.group(1)
        for elem_id in elementos_site:
            if elem_id in corpo:
                ok(f'  aplicarConfig aplica #{elem_id}')
            else:
                prob(f'  aplicarConfig NÃO aplica #{elem_id} — elemento não sincronizado!')
else:
    prob('Função aplicarConfig() NÃO encontrada no site — sincronismo não implementado!')

# =============================================================================
# 8. VERIFICAR DOMContentLoaded MÚLTIPLOS
# =============================================================================
sec('12. DOMContentLoaded MÚLTIPLOS')
dom_site = site.count("DOMContentLoaded")
dom_admin = admin.count("DOMContentLoaded")
if dom_site > 1:
    prob(f'Site tem {dom_site} DOMContentLoaded — podem conflitar')
else:
    ok(f'Site tem {dom_site} DOMContentLoaded — correto')
if dom_admin > 1:
    prob(f'Admin tem {dom_admin} DOMContentLoaded — podem conflitar')
else:
    ok(f'Admin tem {dom_admin} DOMContentLoaded — correto')

# =============================================================================
# 9. VERIFICAR SCROLL INDEVIDO
# =============================================================================
sec('13. SCROLL INDEVIDO NOS BOTÕES')
scroll_site = [(i+1, l.strip()) for i, l in enumerate(site_lines) if 'scrollTo' in l or 'scrollIntoView' in l]
for ln, txt in scroll_site:
    if '_liberarPagina' in site_lines[max(0,ln-5):ln+5] or 'scrollTop' in txt:
        ok(f'  Linha {ln}: scroll necessário (restaurar posição ou chat)')
    else:
        info(f'  Linha {ln}: {txt[:80]}')

# =============================================================================
# 10. RESUMO FINAL
# =============================================================================
sec('RESUMO FINAL')
relatorio.append(f'\n  Total de problemas encontrados: {len(problemas)}')
relatorio.append(f'  Total de itens OK: {len(ok_list)}')

if problemas:
    relatorio.append('\n  PROBLEMAS A CORRIGIR:')
    for p in problemas:
        relatorio.append(p)
else:
    relatorio.append('\n  ✅ TUDO OK — site e admin sincronizados e sem duplicados!')

# Salvar relatório
with open('relatorio_varredura.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(relatorio))

print('\n'.join(relatorio))
print(f'\n\nRelatório salvo em: relatorio_varredura.txt')
