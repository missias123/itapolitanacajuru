#!/usr/bin/env python3
"""
Mapeador completo de duplicações no admin-painel.html
Detecta: textos duplicados, labels, IDs, funções JS, blocos CSS, seções
"""
import re
from collections import Counter, defaultdict

with open('admin-painel.html', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.splitlines()

print("=" * 70)
print("MAPEAMENTO COMPLETO DE DUPLICAÇÕES — admin-painel.html")
print("=" * 70)

# ── 1. FUNÇÕES JAVASCRIPT DUPLICADAS ──────────────────────────────────
print("\n📌 1. FUNÇÕES JAVASCRIPT DUPLICADAS:")
fn_pattern = re.compile(r'^\s*(?:async\s+)?function\s+(\w+)\s*\(', re.MULTILINE)
fn_matches = [(m.group(1), m.start()) for m in fn_pattern.finditer(content)]
fn_counter = Counter(name for name, _ in fn_matches)
fn_dupes = {name: [] for name, count in fn_counter.items() if count > 1}
for name, pos in fn_matches:
    if name in fn_dupes:
        line_num = content[:pos].count('\n') + 1
        fn_dupes[name].append(line_num)
if fn_dupes:
    for name, lns in sorted(fn_dupes.items()):
        print(f"  ⚠️  função '{name}' aparece {len(lns)}x nas linhas: {lns}")
else:
    print("  ✅ Nenhuma função duplicada")

# ── 2. IDs HTML DUPLICADOS (excluindo templates JS) ───────────────────
print("\n📌 2. IDs HTML DUPLICADOS (excluindo templates JS):")
id_pattern = re.compile(r'id="([^"${}]+)"')
id_matches = defaultdict(list)
for i, line in enumerate(lines, 1):
    for m in id_pattern.finditer(line):
        id_val = m.group(1)
        # Ignorar IDs que são claramente templates dinâmicos
        if any(c in id_val for c in ["'", "+", "$", "{", "\\", "pic_", "sab_", "acr_", "status_", "wrap_"]):
            continue
        id_matches[id_val].append(i)
dupes_ids = {k: v for k, v in id_matches.items() if len(v) > 1}
if dupes_ids:
    for id_val, lns in sorted(dupes_ids.items()):
        print(f"  ⚠️  id='{id_val}' aparece {len(lns)}x nas linhas: {lns}")
else:
    print("  ✅ Nenhum ID duplicado")

# ── 3. TEXTOS VISÍVEIS DUPLICADOS (labels, títulos, hints) ────────────
print("\n📌 3. TEXTOS VISÍVEIS DUPLICADOS (labels, títulos, hints):")
text_pattern = re.compile(r'<(?:label|div class="(?:seção-título|hint|card-header|campo-label)"|h[1-6]|p)[^>]*>([^<]{10,})<')
text_matches = defaultdict(list)
for i, line in enumerate(lines, 1):
    for m in text_pattern.finditer(line):
        txt = m.group(1).strip()
        # Ignorar textos muito genéricos
        if txt and len(txt) > 8 and txt not in ['...', 'R$', 'Salvar', 'Cancelar']:
            text_matches[txt].append(i)
dupes_texts = {k: v for k, v in text_matches.items() if len(v) > 1}
if dupes_texts:
    for txt, lns in sorted(dupes_texts.items()):
        print(f"  ⚠️  Texto '{txt[:60]}' aparece {len(lns)}x nas linhas: {lns}")
else:
    print("  ✅ Nenhum texto visível duplicado")

# ── 4. LABELS DUPLICADOS ──────────────────────────────────────────────
print("\n📌 4. LABELS DUPLICADOS:")
label_pattern = re.compile(r'<label[^>]*>([^<]{5,})</label>')
label_matches = defaultdict(list)
for i, line in enumerate(lines, 1):
    for m in label_pattern.finditer(line):
        txt = m.group(1).strip()
        if txt and not any(c in txt for c in ['$', '{', 'input', 'checkbox']):
            label_matches[txt].append(i)
dupes_labels = {k: v for k, v in label_matches.items() if len(v) > 1}
if dupes_labels:
    for txt, lns in sorted(dupes_labels.items()):
        print(f"  ⚠️  Label '{txt[:60]}' aparece {len(lns)}x nas linhas: {lns}")
else:
    print("  ✅ Nenhum label duplicado")

# ── 5. SEÇÕES DUPLICADAS (id="sec-*") ────────────────────────────────
print("\n📌 5. SEÇÕES DUPLICADAS (id='sec-*'):")
sec_pattern = re.compile(r'id="(sec-[^"]+)"')
sec_matches = defaultdict(list)
for i, line in enumerate(lines, 1):
    for m in sec_pattern.finditer(line):
        sec_matches[m.group(1)].append(i)
dupes_secs = {k: v for k, v in sec_matches.items() if len(v) > 1}
if dupes_secs:
    for sec, lns in sorted(dupes_secs.items()):
        print(f"  ⚠️  Seção '{sec}' aparece {len(lns)}x nas linhas: {lns}")
else:
    print("  ✅ Nenhuma seção duplicada")

# ── 6. BLOCOS <script> MÚLTIPLOS ─────────────────────────────────────
print("\n📌 6. BLOCOS <script> MÚLTIPLOS:")
script_opens = [i+1 for i, l in enumerate(lines) if re.search(r'<script\b', l)]
script_closes = [i+1 for i, l in enumerate(lines) if '</script>' in l]
print(f"  Aberturas <script>: {len(script_opens)} nas linhas: {script_opens}")
print(f"  Fechamentos </script>: {len(script_closes)} nas linhas: {script_closes}")
if len(script_opens) > 2:
    print(f"  ⚠️  Múltiplos blocos script detectados — ideal: 1 ou 2 (1 externo + 1 inline)")
else:
    print("  ✅ Quantidade de blocos script OK")

# ── 7. PLACEHOLDERS DUPLICADOS ───────────────────────────────────────
print("\n📌 7. PLACEHOLDERS DUPLICADOS:")
ph_pattern = re.compile(r'placeholder="([^"]{8,})"')
ph_matches = defaultdict(list)
for i, line in enumerate(lines, 1):
    for m in ph_pattern.finditer(line):
        ph_matches[m.group(1)].append(i)
dupes_ph = {k: v for k, v in ph_matches.items() if len(v) > 1}
if dupes_ph:
    for txt, lns in sorted(dupes_ph.items()):
        print(f"  ⚠️  Placeholder '{txt[:60]}' aparece {len(lns)}x nas linhas: {lns}")
else:
    print("  ✅ Nenhum placeholder duplicado")

# ── 8. ONCLICK DUPLICADOS (mesmo handler em múltiplos botões) ─────────
print("\n📌 8. ONCLICK DUPLICADOS (mesmo handler em múltiplos botões):")
onclick_pattern = re.compile(r'onclick="([^"]+)"')
onclick_matches = defaultdict(list)
for i, line in enumerate(lines, 1):
    for m in onclick_pattern.finditer(line):
        val = m.group(1).strip()
        onclick_matches[val].append(i)
dupes_onclick = {k: v for k, v in onclick_matches.items() if len(v) > 1 and 'toggle' not in k.lower()}
if dupes_onclick:
    for val, lns in sorted(dupes_onclick.items()):
        print(f"  ⚠️  onclick='{val[:60]}' aparece {len(lns)}x nas linhas: {lns}")
else:
    print("  ✅ Nenhum onclick duplicado problemático")

print("\n" + "=" * 70)
print("FIM DO MAPEAMENTO")
print("=" * 70)
