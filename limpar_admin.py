#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Limpar duplicatas do admin-painel.html
Mantém apenas a PRIMEIRA ocorrência de cada ID
Remove blocos duplicados completos
"""

import re
from collections import Counter, OrderedDict
from bs4 import BeautifulSoup

# ── Ler arquivo ──────────────────────────────────────────────────────
with open('admin-painel.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ── Mapear IDs ───────────────────────────────────────────────────────
ids = re.findall(r'id=["\']([^"\']+)["\']', content)
counter = Counter(ids)
dups = {k: v for k, v in counter.items() if v > 1}

print('=== ANÁLISE DO ADMIN-PAINEL.HTML ===')
print(f'Total de linhas: {content.count(chr(10))}')
print(f'Total de IDs encontrados: {len(ids)}')
print(f'IDs únicos: {len(counter)}')
print(f'IDs DUPLICADOS: {len(dups)}')
print()

if dups:
    print('IDs duplicados encontrados:')
    for id_, count in sorted(dups.items(), key=lambda x: -x[1]):
        print(f'  {count}x  {id_}')
else:
    print('Nenhum ID duplicado encontrado.')

print()
print('=== FIM DA ANÁLISE ===')
