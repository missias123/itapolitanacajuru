import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Passo 1: Substituir todos os botões Voltar para usar uma função global voltarCardapio(accId)
# O onclick atual é: toggleAcc('acc-XXX');document.getElementById('acc-XXX').scrollIntoView(...)
# O novo onclick será: voltarCardapio('acc-XXX')
# Usando aspas escapadas com \' dentro do innerHTML

# Padrão exato que aparece no arquivo (com \' escapado)
old_patterns = [
    ("toggleAcc(\\'acc-sorvetes\\');document.getElementById(\\'acc-sorvetes\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-sorvetes\\')"),
    ("toggleAcc(\\'acc-milk\\');document.getElementById(\\'acc-milk\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-milk\\')"),
    ("toggleAcc(\\'acc-tacas\\');document.getElementById(\\'acc-tacas\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-tacas\\')"),
    ("toggleAcc(\\'acc-tacas-p\\');document.getElementById(\\'acc-tacas-p\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-tacas-p\\')"),
    ("toggleAcc(\\'acc-a\\u00e7a\\u00ed-promo\\');document.getElementById(\\'acc-a\\u00e7a\\u00ed-promo\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-a\\u00e7a\\u00ed-promo\\')"),
    ("toggleAcc(\\'acc-a\\u00e7a\\u00ed\\');document.getElementById(\\'acc-a\\u00e7a\\u00ed\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-a\\u00e7a\\u00ed\\')"),
    ("toggleAcc(\\'acc-picol\\u00e9s\\');document.getElementById(\\'acc-picol\\u00e9s\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-picol\\u00e9s\\')"),
    ("toggleAcc(\\'acc-iso\\');document.getElementById(\\'acc-iso\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-iso\\')"),
    ("toggleAcc(\\'acc-sobremesas\\');document.getElementById(\\'acc-sobremesas\\').scrollIntoView({behavior:\\'smooth\\',block:\\'start\\'})", "voltarCardapio(\\'acc-sobremesas\\')"),
]

count = 0
for old, new in old_patterns:
    if old in content:
        content = content.replace(old, new, 1)
        count += 1
        print(f'OK substituido: {old[:40]}...')
    else:
        print(f'NAO ENCONTRADO: {old[:40]}...')

print(f'\nTotal substituido: {count}/9')

# Passo 2: Adicionar a funcao global voltarCardapio() antes de function toggleAcc
func_voltar = """// Volta ao topo do cardapio SEM fechar o accordion
function voltarCardapio(accId) {
  var el = document.getElementById('card\\u00e1pio');
  if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
}
"""

if 'function voltarCardapio' not in content:
    content = content.replace('function toggleAcc(id) {', func_voltar + 'function toggleAcc(id) {', 1)
    print('OK funcao voltarCardapio adicionada')
else:
    print('funcao voltarCardapio ja existe')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK index.html salvo')
