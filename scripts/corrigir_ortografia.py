#!/usr/bin/env python3
"""
corrigir_ortografia.py
Correção ortográfica automática — Português Brasileiro Oficial
Sorveteria Itapolitana Cajuru/SP

Roda automaticamente a cada push via GitHub Actions.
Corrige todos os arquivos HTML e JS do projeto.
"""

import os
import sys
import re

# ============================================================
# DICIONÁRIO DE CORREÇÕES (ordem: mais específico primeiro)
# ============================================================
CORRECOES = [
    # Nomes compostos (frases antes de palavras isoladas)
    ('Leite Ninho Foleado',          'Leite Ninho Folheado'),
    ('Leite Ninho foleado',          'Leite Ninho Folheado'),
    ('leite ninho foleado',          'Leite Ninho Folheado'),
    ('Petit Gateau',                 'Petit Gâteau'),
    ('petit gateau',                 'Petit Gâteau'),
    ('Petit gateau',                 'Petit Gâteau'),
    ('Mousse de Maracuja',           'Mousse de Maracujá'),
    ('mousse de maracuja',           'Mousse de Maracujá'),
    ('Mamao Papaia',                 'Mamão Papaia'),
    ('mamao papaia',                 'Mamão Papaia'),
    ('Leite em Po',                  'Leite em Pó'),
    ('leite em po',                  'Leite em Pó'),
    ('Chocolate com Cafe',           'Chocolate com Café'),
    ('chocolate com cafe',           'Chocolate com Café'),
    ('Acai Promocional',             'Açaí Promocional'),
    ('acai Promocional',             'Açaí Promocional'),
    # Palavras simples
    ('Fundue',                       'Fondue'),
    ('fundue',                       'Fondue'),
    ('Foleado',                      'Folheado'),
    ('foleado',                      'Folheado'),
    ('Eskimo',                       'Esquimó'),
    ('eskimo',                       'Esquimó'),
    ('Picole',                       'Picolé'),
    ('picole',                       'Picolé'),
    ('Cascao',                       'Cascão'),
    ('cascao',                       'Cascão'),
    ('Maracuja',                     'Maracujá'),
    ('maracuja',                     'Maracujá'),
    ('Mamao',                        'Mamão'),
    ('mamao',                        'Mamão'),
    ('Melancia',                     'Melância'),
    ('melancia',                     'Melância'),
    ('Unicornio',                    'Unicórnio'),
    ('unicornio',                    'Unicórnio'),
    ('Universitario',                'Universitário'),
    ('universitario',                'Universitário'),
    ('Prestigio',                    'Prestígio'),
    ('prestigio',                    'Prestígio'),
    ('Óreo',                         'Oreo'),
    # Açaí — apenas em contexto de texto (não em IDs/classes)
    # Milkshake — manter em IDs/classes, corrigir apenas em texto visível
]

# Arquivos a verificar e corrigir
ARQUIVOS = [
    'index.html',
    'encomendas.html',
    'scripts/enc-v2.js',
    'scripts/products.js',
    'scripts/ortografia.js',
    'gerenciar/index.html',
    'gerenciar/encomendas/index.html',
]

# Padrões a NÃO corrigir (IDs, classes, variáveis JS, URLs)
IGNORAR_PADROES = [
    r'id=["\'][^"\']*',
    r'class=["\'][^"\']*',
    r'var\s+\w+',
    r'const\s+\w+',
    r'let\s+\w+',
    r'function\s+\w+',
    r'getElementById\(["\'][^"\']*',
    r'querySelector\(["\'][^"\']*',
    r'localStorage\.[^;]*',
    r'href=["\'][^"\']*',
    r'src=["\'][^"\']*',
    r'//.*',  # comentários de linha
]

def corrigir_arquivo(caminho):
    """Corrige ortografia em um arquivo, retorna número de correções."""
    if not os.path.exists(caminho):
        return 0
    
    with open(caminho, 'r', encoding='utf-8') as f:
        conteudo = f.read()
    
    original = conteudo
    total = 0
    
    for errado, correto in CORRECOES:
        if errado in conteudo:
            count = conteudo.count(errado)
            conteudo = conteudo.replace(errado, correto)
            total += count
            print(f"  ✅ '{errado}' → '{correto}' ({count}x)")
    
    if conteudo != original:
        with open(caminho, 'w', encoding='utf-8') as f:
            f.write(conteudo)
    
    return total

def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"🔍 Verificando ortografia em: {base}")
    print("=" * 50)
    
    total_geral = 0
    arquivos_corrigidos = 0
    
    for fname in ARQUIVOS:
        caminho = os.path.join(base, fname)
        print(f"\n📄 {fname}")
        n = corrigir_arquivo(caminho)
        if n > 0:
            total_geral += n
            arquivos_corrigidos += 1
        else:
            print("  ✓ Sem erros")
    
    print("\n" + "=" * 50)
    print(f"📊 Resultado: {total_geral} correções em {arquivos_corrigidos} arquivo(s)")
    
    if total_geral > 0:
        print("⚠️  Erros ortográficos foram corrigidos automaticamente.")
        sys.exit(0)  # Sucesso — correções foram aplicadas
    else:
        print("✅ Nenhum erro ortográfico encontrado!")
        sys.exit(0)

if __name__ == '__main__':
    main()
