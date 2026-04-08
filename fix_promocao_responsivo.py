#!/usr/bin/env python3
"""
1. Remove do promocao.html:
   - Botão "🚀 QUERO GANHAR MEU SORVETE"
   - Botão "📋 Ver Regulamento Completo"
   - Modal antigo id="modal-regulamento"
   - Funções JS abrirRegulamento/fecharRegulamento

2. Corrige responsividade nos campos alterados do index.html:
   - .sabores-inline-container (grid de sabores)
   - .btn-voltar-inicio
   - .prod-grid (cards de produtos)
   - .picolé-grid
"""

import re

# ============================================================
# PARTE 1: LIMPAR promocao.html
# ============================================================
print("=== LIMPANDO promocao.html ===")
content = open('promocao.html', encoding='utf-8').read()

original_len = len(content)

# Remover o bloco btn-group (contém os dois botões)
# O padrão é: <div class="btn-group">...(botões)...</div>
# Seguido de fechamento do promo-content
btn_group_pattern = r'<div class="btn-group">[\s\S]*?</div>\s*\n\s*</div>\s*\n\s*</div>'
match = re.search(btn_group_pattern, content)
if match:
    content = content[:match.start()] + '\n</div>\n</div>' + content[match.end():]
    print("✅ Bloco btn-group removido")
else:
    # Tentar remover só os botões individualmente
    # Botão QUERO GANHAR
    content = re.sub(
        r'<button[^>]*>[^<]*🚀[^<]*QUERO GANHAR[^<]*</button>',
        '',
        content,
        flags=re.DOTALL
    )
    # Botão Ver Regulamento
    content = re.sub(
        r'<button[^>]*onclick="abrirRegulamento\(\)"[^>]*>[\s\S]*?</button>',
        '',
        content
    )
    print("✅ Botões individuais removidos")

# Remover modal-regulamento completo
lines = content.split('\n')
new_lines = []
skip = False
depth = 0
for i, line in enumerate(lines):
    if 'modal-overlay' in line and 'modal-regulamento' in line:
        skip = True
        depth = 0
    
    if skip:
        depth += line.count('<div')
        depth -= line.count('</div>')
        if depth <= 0 and i > 0:
            skip = False
        continue
    
    new_lines.append(line)

content = '\n'.join(new_lines)
print("✅ Modal regulamento removido")

# Remover funções JS
content = re.sub(
    r'\s*function abrirRegulamento\(\)\s*\{[^}]*\}',
    '',
    content
)
content = re.sub(
    r'\s*function fecharRegulamento\(e\)\s*\{[\s\S]*?\n  \}',
    '',
    content
)
print("✅ Funções JS removidas")

# Remover div de depoimentos de clientes se existir
content = re.sub(
    r'<div[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>\s*<p[^>]*>Veja o que nossos cl[\s\S]*?</div>\s*</div>',
    '',
    content
)

# Limpar linhas em branco excessivas
content = re.sub(r'\n{3,}', '\n\n', content)

open('promocao.html', 'w', encoding='utf-8').write(content)
new_len = len(content)
print(f"✅ promocao.html salvo ({original_len} → {new_len} chars, -{original_len-new_len} removidos)")

# Verificar
checks = [
    ('QUERO GANHAR', 'Botão QUERO GANHAR'),
    ('Ver Regulamento', 'Botão Ver Regulamento'),
    ('modal-regulamento', 'Modal regulamento'),
    ('abrirRegulamento', 'Função abrirRegulamento'),
]
for term, label in checks:
    found = term in content
    status = "❌ AINDA EXISTE" if found else "✅ REMOVIDO"
    print(f"  {status}: {label}")

# ============================================================
# PARTE 2: CORRIGIR RESPONSIVIDADE no index.html
# ============================================================
print("\n=== CORRIGINDO RESPONSIVIDADE index.html ===")
idx = open('index.html', encoding='utf-8').read()

# CSS responsivo para os novos elementos adicionados
responsive_css = """
/* ===== RESPONSIVIDADE — ELEMENTOS ADICIONADOS ===== */

/* Botão Voltar ao Início do Cardápio */
.btn-voltar-inicio {
  display: block;
  width: calc(100% - 32px);
  max-width: 480px;
  margin: 16px auto 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #FF6B35, #FF4081);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: clamp(13px, 3.5vw, 15px);
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  box-shadow: 0 4px 12px rgba(255,107,53,0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.btn-voltar-inicio:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(255,107,53,0.45);
}
.btn-voltar-inicio:active {
  transform: translateY(0);
}

/* Container de sabores inline */
.sabores-inline-container {
  width: 100%;
  padding: 12px 8px 16px;
  box-sizing: border-box;
}
.sabores-inline-titulo {
  font-size: clamp(14px, 4vw, 18px);
  font-weight: 900;
  text-align: center;
  margin-bottom: 12px;
  color: #1A0A00;
}
.sabores-inline-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 0 4px;
}
.sabor-tag {
  background: #FFF3E0;
  border: 1.5px solid #FF6B35;
  border-radius: 50px;
  padding: 6px 14px;
  font-size: clamp(11px, 3vw, 13px);
  font-weight: 700;
  color: #BF360C;
  white-space: nowrap;
  cursor: default;
}

/* Grid de produtos — responsivo */
.prod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  padding: 12px 8px;
}

@media (max-width: 480px) {
  .prod-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 8px 4px;
  }
  .btn-voltar-inicio {
    width: calc(100% - 16px);
    font-size: 13px;
    padding: 11px 16px;
  }
  .sabores-inline-grid {
    gap: 6px;
  }
  .sabor-tag {
    padding: 5px 10px;
    font-size: 11px;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .prod-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .btn-voltar-inicio {
    max-width: 380px;
  }
}

@media (min-width: 769px) {
  .prod-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .btn-voltar-inicio {
    max-width: 400px;
  }
  .sabores-inline-grid {
    gap: 10px;
  }
}
/* ===== FIM RESPONSIVIDADE ===== */
"""

# Verificar se já existe o CSS responsivo
if 'RESPONSIVIDADE — ELEMENTOS ADICIONADOS' in idx:
    # Substituir o bloco existente
    idx = re.sub(
        r'/\* ===== RESPONSIVIDADE — ELEMENTOS ADICIONADOS ===== \*/[\s\S]*?/\* ===== FIM RESPONSIVIDADE ===== \*/',
        responsive_css.strip(),
        idx
    )
    print("✅ CSS responsivo atualizado")
else:
    # Inserir antes do </style> principal
    # Encontrar o primeiro </style>
    pos = idx.find('</style>')
    if pos > 0:
        idx = idx[:pos] + responsive_css + idx[pos:]
        print("✅ CSS responsivo adicionado")
    else:
        print("⚠️ </style> não encontrado — CSS não adicionado")

open('index.html', 'w', encoding='utf-8').write(idx)
print("✅ index.html salvo com CSS responsivo")

# ============================================================
# PARTE 3: VERIFICAR fidelidade.html
# ============================================================
print("\n=== VERIFICANDO fidelidade.html ===")
fid = open('fidelidade.html', encoding='utf-8').read()
if 'Sorteios Mensais' in fid or 'SORTEIOS MENSAIS' in fid:
    print("⚠️ fidelidade.html ainda tem referência a Sorteios Mensais!")
else:
    print("✅ fidelidade.html OK — sem Sorteios Mensais")

print("\n=== CONCLUÍDO ===")
