#!/usr/bin/env python3
import re, subprocess
from pathlib import Path

BASE = Path('/home/ubuntu/itapolitanacajuru')
arquivos = ['index.html','promocao.html','fidelidade.html','encomendas.html','admin-painel.html']
todos_ok = True

for fname in arquivos:
    html = (BASE/fname).read_text(encoding='utf-8')
    # Extrai scripts inline (excluindo JSON-LD e externos)
    scripts = re.findall(
        r'<script(?![^>]*application/ld\+json)(?![^>]*\bsrc=)[^>]*>(.*?)</script>',
        html, re.DOTALL)
    erros = []
    for i, s in enumerate(scripts):
        if len(s.strip()) < 30:
            continue
        tmp = BASE / f'tools/_val_{fname}_{i}.js'
        tmp.write_text(s, encoding='utf-8')
        r = subprocess.run(['node', '--check', str(tmp)],
                           capture_output=True, text=True)
        tmp.unlink(missing_ok=True)
        if r.returncode != 0:
            erros.append(r.stderr.strip().split('\n')[0][:100])
    if erros:
        todos_ok = False
        print(f'ERRO {fname}: {erros}')
    else:
        print(f'OK   {fname}: JS sem erros')

print()
if todos_ok:
    print('RESULTADO: TODOS OK - PRONTO PARA PUBLICAR')
else:
    print('RESULTADO: CORRIGIR ERROS ANTES DE PUBLICAR')
