#!/usr/bin/env python3
"""
Remove do promocao.html:
1. Botão "🚀 QUERO GANHAR MEU SORVETE" (linha ~212-215)
2. Botão "📋 Ver Regulamento Completo" (linha ~216-218)
3. O div btn-group que continha esses botões (linha ~212-219)
4. O modal-overlay id="modal-regulamento" (linhas 231-289)
5. As funções JS abrirRegulamento() e fecharRegulamento() (linhas ~345-355)
6. A div de depoimentos/clientes (linha ~225-230) se for desnecessária

Mantém:
- Cabeçalho da promoção (título, descrição)
- Countdown timer
- Fluxo de 4 passos
- Formulário de cadastro
- Regulamento inline (se existir)
"""

content = open('promocao.html', encoding='utf-8').read()

import re

# 1. Remover o bloco btn-group que contém os dois botões
# Padrão: <div class="btn-group">...botões...</div>
content = re.sub(
    r'<div class="btn-group">.*?</div>\s*</div>',
    '</div>',
    content,
    flags=re.DOTALL
)

# 2. Remover o modal-overlay id="modal-regulamento" completo
content = re.sub(
    r'<div class="modal-overlay" id="modal-regulamento".*?</div>\s*</div>\s*</div>',
    '',
    content,
    flags=re.DOTALL
)

# 3. Remover funções JS abrirRegulamento e fecharRegulamento
content = re.sub(
    r'function abrirRegulamento\(\).*?}\s*function fecharRegulamento\(e\).*?}',
    '',
    content,
    flags=re.DOTALL
)

# 4. Remover div de depoimentos/clientes (linha ~225-230) se existir
content = re.sub(
    r'<div[^>]*>.*?Veja o que nossos cl.*?</div>\s*</div>',
    '',
    content,
    flags=re.DOTALL
)

# 5. Remover função irParaSeção se não for mais usada
if 'irParaSeção' not in content or content.count('irParaSeção') <= 1:
    content = re.sub(
        r'function irParaSeção\(.*?\).*?}',
        '',
        content,
        flags=re.DOTALL
    )

# Limpar linhas em branco excessivas
content = re.sub(r'\n{3,}', '\n\n', content)

open('promocao.html', 'w', encoding='utf-8').write(content)
print("✅ promocao.html limpo com sucesso!")

# Verificar o que ficou
lines = open('promocao.html', encoding='utf-8').readlines()
print(f"Total de linhas: {len(lines)}")

# Confirmar que os elementos foram removidos
checks = [
    ('QUERO GANHAR', 'Botão QUERO GANHAR'),
    ('Ver Regulamento', 'Botão Ver Regulamento'),
    ('modal-regulamento', 'Modal regulamento'),
    ('abrirRegulamento', 'Função abrirRegulamento'),
]
for term, label in checks:
    found = any(term in l for l in lines)
    status = "❌ AINDA EXISTE" if found else "✅ REMOVIDO"
    print(f"{status}: {label}")
