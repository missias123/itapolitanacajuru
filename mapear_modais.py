import re

content = open('index.html').read()
lines = content.split('\n')

print('=== MODAIS (modal-overlay) ===')
for i, line in enumerate(lines, 1):
    if 'modal-overlay' in line and 'id=' in line:
        m = re.search(r'id="([\w-]+)"', line)
        if m:
            print(f'  Linha {i}: id={m.group(1)}')

print()
print('=== ACCORDIONS (acc-content / vc-container) ===')
for i, line in enumerate(lines, 1):
    if ('acc-content' in line or 'vc-container' in line) and 'id=' in line:
        m = re.search(r'id="([\w-]+)"', line)
        if m:
            print(f'  Linha {i}: id={m.group(1)}')

print()
print('=== BOTOES FECHAR EXISTENTES ===')
for i, line in enumerate(lines, 1):
    low = line.lower()
    if 'fechar' in low and ('btn' in low or 'button' in low or 'onclick' in low):
        print(f'  Linha {i}: {line.strip()[:120]}')

print()
print('=== BOTOES VOLTAR EXISTENTES ===')
for i, line in enumerate(lines, 1):
    low = line.lower()
    if 'voltar' in low and ('btn' in low or 'button' in low or 'onclick' in low):
        print(f'  Linha {i}: {line.strip()[:120]}')
