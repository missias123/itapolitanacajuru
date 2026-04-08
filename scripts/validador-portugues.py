#!/usr/bin/env python3
"""
=============================================================
VALIDADOR AUTOMÁTICO DE PORTUGUÊS — SORVETERIA ITAPOLITANA
=============================================================
Regra: ZERO erros de português no site e no Admin.
Roda automaticamente antes de cada publicação (git commit).

Como usar:
  python3 scripts/validador-portugues.py          # verifica e corrige
  python3 scripts/validador-portugues.py --check  # só verifica, não corrige

Integração com git (pre-commit hook):
  Instalado automaticamente em .git/hooks/pre-commit
=============================================================
"""

import re
import sys
import json
from pathlib import Path

BASE = Path(__file__).parent.parent

# ============================================================
# DICIONÁRIO OFICIAL DE TERMOS DO SITE
# Regra: estas são as únicas formas corretas aceitas
# ============================================================
DICIONARIO_OFICIAL = {
    # Produtos principais
    'Picolé': ['Picolee', 'Picolée', 'Picoléé', 'Picoléés', 'Picolees', 'Picolées'],
    'picolé': ['picolee', 'picolée', 'picoléé', 'picoléés', 'picolees', 'picolées'],
    'Picolés': ['Picolées', 'Picoléés', 'Picolees'],
    'picolés': ['picolées', 'picoléés', 'picolees'],
    'Sorvete': ['Sorvéte', 'Sorvête'],
    'sorvete': ['sorvéte', 'sorvête'],
    'Sorvetes': ['Sorvétes', 'Sorvêtes'],
    'sorvetes': ['sorvétes', 'sorvêtes'],
    'Milkshake': ['Mílkshake', 'Milkshàke'],
    'milkshake': ['mílkshake', 'milkshàke'],
    'Milkshakes': ['Mílkshakes', 'Milkshàkes'],
    'milkshakes': ['mílkshakes', 'milkshàkes'],
    'Açaí': ['Açaíí', 'Acai', 'Açai'],
    'açaí': ['açaíí', 'acai', 'açai'],
    'Isopores': ['Isopçãores', 'Isopóres', 'Isopôres'],
    'isopores': ['isopçãores', 'isopóres', 'isopôres'],
    'Isopor': ['Isopçãor', 'Isopór', 'Isopôr'],
    'isopor': ['isopçãor', 'isopór', 'isopôr'],
    'Brownie': ['Browníe', 'Browniê'],
    'brownie': ['browníe', 'browniê'],
    'Fondue': ['Fóndue', 'Fondúe'],
    'fondue': ['fóndue', 'fondúe'],
    'Wafer': ['Wáfer', 'Wâfer'],
    'wafer': ['wáfer', 'wâfer'],
    'Chantilly': ['Chantílly', 'Chantíly'],
    'chantilly': ['chantílly', 'chantíly'],
    'Granulado': ['Granuládo', 'Granulàdo'],
    'granulado': ['granuládo', 'granulàdo'],
    'Casquinha': ['Cásquinha', 'Casquínha'],
    'casquinha': ['cásquinha', 'casquínha'],
    'Casquinhas': ['Cásquinhas', 'Casquínhas'],
    'casquinhas': ['cásquinhas', 'casquínhas'],
    'Cestinha': ['Céstinha', 'Cestínha'],
    'cestinha': ['céstinha', 'cestínha'],
    'Cestinhas': ['Céstinhas', 'Cestínhas'],
    'cestinhas': ['céstinhas', 'cestínhas'],
    'Cascão': ['Cáscao', 'Cascáo'],
    'cascão': ['cáscao', 'cascáo'],
    'Leite': ['Léite', 'Lêite'],
    'leite': ['léite', 'lêite'],
    'Ninho': ['Nínho', 'Nîho'],
    'ninho': ['nínho', 'nîho'],
    'Chocolate': ['Chócolate', 'Chocoláte'],
    'chocolate': ['chócolate', 'chocoláte'],
    'Chocolates': ['Chócolates', 'Chocolátes'],
    'chocolates': ['chócolates', 'chocolátes'],
    'Cobertura': ['Cóbertura', 'Cobertúra'],
    'cobertura': ['cóbertura', 'cobertúra'],
    'Coberturas': ['Cóberturas', 'Cobertúras'],
    'coberturas': ['cóberturas', 'cobertúras'],
    'Calda': ['Cálda', 'Caldâ'],
    'calda': ['cálda', 'caldâ'],
    'Caldas': ['Cáldas', 'Caldâs'],
    'caldas': ['cáldas', 'caldâs'],
    'Recheio': ['Récheio', 'Recheío'],
    'recheio': ['récheio', 'recheío'],
    'Recheios': ['Récheios', 'Recheíos'],
    'recheios': ['récheios', 'recheíos'],
    'Fruta': ['Frúta', 'Frûta'],
    'fruta': ['frúta', 'frûta'],
    'Frutas': ['Frútas', 'Frûtas'],
    'frutas': ['frútas', 'frûtas'],
    'Cremoso': ['Crémoso', 'Cremóso'],
    'cremoso': ['crémoso', 'cremóso'],
    'Gelado': ['Gélado', 'Gelàdo'],
    'gelado': ['gélado', 'gelàdo'],
    'Gelados': ['Gélados', 'Gelàdos'],
    'gelados': ['gélados', 'gelàdos'],
    'Sobremesa': ['Sóbremesa', 'Sobremêsa'],
    'sobremesa': ['sóbremesa', 'sobremêsa'],
    'Sobremesas': ['Sóbremesas', 'Sobremêsas'],
    'sobremesas': ['sóbremesas', 'sobremêsas'],
    'Complemento': ['Cómplemento', 'Complementô'],
    'complemento': ['cómplemento', 'complementô'],
    'Complementos': ['Cómplementos', 'Complementôs'],
    'complementos': ['cómplementos', 'complementôs'],
    'Artesanal': ['Artésanal', 'Artezanal'],
    'artesanal': ['artésanal', 'artezanal'],
    # Interface e navegação
    'atendimento': ['aténdimento', 'atendimênto'],
    'Atendimento': ['Aténdimento', 'Atendimênto'],
    'categoria': ['catégoria', 'categória'],
    'Categoria': ['Catégoria', 'Categória'],
    'categorias': ['catégorias', 'categórias'],
    'Categorias': ['Catégorias', 'Categórias'],
    'especial': ['éspecial', 'espécial'],
    'Especial': ['Éspecial', 'Espécial'],
    'especiais': ['éspeciais', 'espéciais'],
    'Especiais': ['Éspeciais', 'Espéciais'],
    'exclusivo': ['éxclusivo', 'exclusívo'],
    'Exclusivo': ['Éxclusivo', 'Exclusívo'],
    'novidade': ['nóvidade', 'novídade'],
    'Novidade': ['Nóvidade', 'Novídade'],
    'novidades': ['nóvidades', 'novídades'],
    'Novidades': ['Nóvidades', 'Novídades'],
    'salvar': ['Sálvar', 'sálvar'],
    'Salvar': ['Sálvar'],
    'cancelar': ['Cáncelar', 'cáncelar'],
    'Cancelar': ['Cáncelar'],
    'excluir': ['Éxcluir', 'éxcluir'],
    'Excluir': ['Éxcluir'],
    'adicionar': ['Ádicionár', 'ádicionár'],
    'Adicionar': ['Ádicionár'],
    'remover': ['Rémover', 'rémover'],
    'Remover': ['Rémover'],
    'gerar': ['Gérár', 'gérár'],
    'Gerar': ['Gérár'],
    'copiar': ['Cópiár', 'cópiár'],
    'Copiar': ['Cópiár'],
    'entrar': ['Éntrar', 'éntrar'],
    'Entrar': ['Éntrar'],
    'sair': ['Sáir', 'sáir'],
    'Sair': ['Sáir'],
    'painel': ['Páinel', 'páinel'],
    'Painel': ['Páinel'],
    'resumo': ['Résumо', 'résumо'],
    'Resumo': ['Résumо'],
    'total': ['Tótal', 'tótal'],
    'Total': ['Tótal'],
    'valor': ['Válor', 'válor'],
    'Valor': ['Válor'],
    'valores': ['Válores', 'válores'],
    'Valores': ['Válores'],
    'atacado': ['Átacado', 'átacado'],
    'Atacado': ['Átacado'],
    'varejo': ['Várejo', 'várejo'],
    'Varejo': ['Várejo'],
    'estoque': ['Éstoque', 'éstoque'],
    'Estoque': ['Éstoque'],
    'quantidade': ['Quántidade', 'quántidade'],
    'Quantidade': ['Quántidade'],
    'opcional': ['Ópcional', 'ópcional'],
    'Opcional': ['Ópcional'],
    'exemplo': ['Éxemplo', 'éxemplo'],
    'Exemplo': ['Éxemplo'],
    'aviso': ['Áviso', 'áviso'],
    'Aviso': ['Áviso'],
    'erro': ['Érro', 'érro'],
    'Erro': ['Érro'],
    'sucesso': ['Súcesso', 'súcesso'],
    'Sucesso': ['Súcesso'],
    'carregando': ['Cárregando', 'cárregando'],
    'Carregando': ['Cárregando'],
    'aguarde': ['Águarde', 'águarde'],
    'Aguarde': ['Águarde'],
    'confirmar': ['Cónfirmar', 'cónfirmar'],
    'Confirmar': ['Cónfirmar'],
    'pagamento': ['Págamento', 'págamento'],
    'Pagamento': ['Págamento'],
    'antecipado': ['Ántecipado', 'ántecipado'],
    'Antecipado': ['Ántecipado'],
    'entrega': ['Éntrega', 'éntrega'],
    'Entrega': ['Éntrega'],
    'retirada': ['Rétirada', 'rétirada'],
    'Retirada': ['Rétirada'],
    'senha': ['Sénha', 'sénha'],
    'Senha': ['Sénha'],
    'unidade': ['Únidade', 'únidade'],
    'Unidade': ['Únidade'],
    'unidades': ['Únidades', 'únidades'],
    'Unidades': ['Únidades'],
    'bola': ['Bóla', 'bóla'],
    'Bola': ['Bóla'],
    'bolas': ['Bólas', 'bólas'],
    'Bolas': ['Bólas'],
    'litro': ['Lítrо', 'lítrо'],
    'Litro': ['Lítrо'],
    'litros': ['Lítrоs', 'lítrоs'],
    'Litros': ['Lítrоs'],
    # Cidades
    'Cajuru': ['Cájuru'],
    'cajuru': ['cájuru'],
    'Ribeirão': ['Ribéirao', 'Ribeirao'],
    'ribeirão': ['ribéirao', 'ribeirao'],
    'Esperança': ['Éspéranca', 'Esperanca'],
    'esperança': ['éspéranca', 'esperanca'],
    'Coqueiros': ['Cóqueiros', 'cóqueiros'],
    'coqueiros': ['cóqueiros'],
    # Palavras corrompidas por substituição indevida
    'natureza': ['nãotureza'],
    'Natureza': ['Nãotureza'],
    'natural': ['nãotural'],
    'Natural': ['Nãotural'],
    'naturais': ['nãoturais'],
    'Naturais': ['Nãoturais'],
    'nacional': ['nãocional'],
    'Nacional': ['Nãocional'],
    'familiar': ['fámiliar'],
    'Familiar': ['Fámiliar'],
    'família': ['fámilia'],
    'Família': ['Fámilia'],
    # ── ERROS DE CSS/JS COM ACENTOS INDEVIDOS ──────────────────
    # Estes erros corrompem o funcionamento do site e do Admin
    'grid-template-columns': ['grid-templaté-columns', 'grid-templàte-columns'],
    'grid-template-rows': ['grid-templaté-rows', 'grid-templàte-rows'],
    'translateY': ['translatéY', 'translàteY'],
    'translateX': ['translatéX', 'translàteX'],
    'translate(': ['translaté(', 'translàte('],
    'rotate(': ['rotaté(', 'rotàte('],
    'isolate': ['isolaté', 'isolàte'],
    'createElement': ['creatéElement', 'creàteElement'],
    'Date.now()': ['Daté.now()', 'Dàte.now()'],
    'new Date()': ['new Daté()', 'new Dàte()'],
    'new Date(': ['new Daté(', 'new Dàte('],
    '.getDate()': ['.getDaté()', '.getDàte()'],
    'foundingDate': ['foundingDaté', 'foundingDàte'],
}

# ============================================================
# ARQUIVOS A VALIDAR
# ============================================================
ARQUIVOS = [
    'index.html',
    'admin-painel.html',
    'encomendas.html',
    'fidelidade.html',
    'promocao.html',
    'scripts/enc-v2.js',
    'scripts/products.js',
    'scripts/site-loader.js',
]

# Padrões que NÃO devem ser substituídos (chaves de JSON/JS)
PROTEGIDOS = [
    # Chaves do JSON produtos.json em inglês
    "'acai'", '"acai"', "p['acai']", 'p["acai"]', "dados['acai']", 'dados["acai"]',
    "'acai_promocao'", '"acai_promocao"', "p['acai_promocao']", 'p["acai_promocao"]',
    "'picoles'", '"picoles"', "p['picoles']", 'p["picoles"]', "dados['picoles']", 'dados["picoles"]',
    'p.picoles', 'dados.picoles', 'p.acai', 'dados.acai',
    'acai_promocao', 'acai.copos', 'acai.complementos',
    # Variáveis internas do admin
    '_acaiKey', '_acaiComps', '_acaiExist', 'acaiKey', 'acaiComps', 'acaiExist',
    # Comentários com acai
    "// 'acai'", "// 'acai_promocao'", '// acai', '// acai_promocao',
    # ASCII encoding
    'fromCharCode(97,99,97,105)', "+'_promocao'",
]

def proteger_contexto(content):
    """Substitui temporariamente padrões protegidos por placeholders."""
    placeholders = {}
    for i, padrao in enumerate(PROTEGIDOS):
        if padrao in content:
            ph = f'__PROTEGIDO_{i}__'
            placeholders[ph] = padrao
            content = content.replace(padrao, ph)
    return content, placeholders

def restaurar_contexto(content, placeholders):
    """Restaura os placeholders para os padrões originais."""
    for ph, original in placeholders.items():
        content = content.replace(ph, original)
    return content

def validar_e_corrigir(apenas_verificar=False):
    """Valida e corrige erros de português em todos os arquivos do site."""
    total_erros = 0
    total_corrigidos = 0
    relatorio = []

    for fname in ARQUIVOS:
        path = BASE / fname
        if not path.exists():
            continue

        content = path.read_text(encoding='utf-8')
        original = content
        erros_arquivo = []

        # Proteger chaves de JSON/JS antes de substituir
        content_protegido, placeholders = proteger_contexto(content)

        for correto, errados in DICIONARIO_OFICIAL.items():
            for errado in errados:
                if errado in content_protegido:
                    ocorrencias = content_protegido.count(errado)
                    erros_arquivo.append({
                        'errado': errado,
                        'correto': correto,
                        'ocorrencias': ocorrencias
                    })
                    if not apenas_verificar:
                        content_protegido = content_protegido.replace(errado, correto)
                    total_erros += ocorrencias

        # Restaurar padrões protegidos
        if not apenas_verificar:
            content = restaurar_contexto(content_protegido, placeholders)

        if erros_arquivo:
            relatorio.append({
                'arquivo': fname,
                'erros': erros_arquivo
            })
            if not apenas_verificar and content != original:
                path.write_text(content, encoding='utf-8')
                total_corrigidos += len(erros_arquivo)

    return total_erros, total_corrigidos, relatorio


def main():
    apenas_verificar = '--check' in sys.argv

    print('=' * 60)
    print('VALIDADOR DE PORTUGUÊS — SORVETERIA ITAPOLITANA')
    print('=' * 60)

    if apenas_verificar:
        print('Modo: VERIFICAÇÃO (sem correção automática)\n')
    else:
        print('Modo: VERIFICAÇÃO + CORREÇÃO AUTOMÁTICA\n')

    total_erros, total_corrigidos, relatorio = validar_e_corrigir(apenas_verificar)

    if not relatorio:
        print('✅ PERFEITO! Nenhum erro de português encontrado.')
        print('   O site e o Admin estão em conformidade com a língua portuguesa.')
        sys.exit(0)
    else:
        print(f'{"⚠️  ERROS ENCONTRADOS" if apenas_verificar else "🔧 ERROS CORRIGIDOS AUTOMATICAMENTE"}:\n')
        for item in relatorio:
            print(f'  📄 {item["arquivo"]}:')
            for e in item['erros']:
                status = '❌' if apenas_verificar else '✅'
                print(f'     {status} "{e["errado"]}" → "{e["correto"]}" ({e["ocorrencias"]}x)')
        
        print(f'\n{"Total de erros" if apenas_verificar else "Total corrigido"}: {total_erros} ocorrências em {len(relatorio)} arquivo(s)')

        if apenas_verificar:
            print('\n❌ PUBLICAÇÃO BLOQUEADA — corrija os erros antes de publicar.')
            print('   Execute sem --check para corrigir automaticamente:')
            print('   python3 scripts/validador-portugues.py')
            sys.exit(1)
        else:
            print('\n✅ Todos os erros foram corrigidos automaticamente!')
            print('   O site está em conformidade com a língua portuguesa.')
            sys.exit(0)


if __name__ == '__main__':
    main()
