#!/usr/bin/env python3
"""
AUDITORIA TÉCNICA PROFISSIONAL — Sorveteria Itapolitana Cajuru
Detecta: IDs duplicados, funções definidas mas não chamadas,
funções chamadas mas não definidas, scripts com erro de sintaxe,
tags HTML não fechadas, blocos CSS duplicados.
"""
import re, subprocess, json
from pathlib import Path
from collections import Counter

BASE = Path('/home/ubuntu/itapolitanacajuru')
ARQUIVOS = ['index.html', 'promocao.html', 'fidelidade.html',
            'encomendas.html', 'admin-painel.html']

relatorio = {}

for fname in ARQUIVOS:
    fpath = BASE / fname
    if not fpath.exists():
        continue
    html = fpath.read_text(encoding='utf-8')
    erros = []
    avisos = []

    # ── 1. IDs DUPLICADOS ────────────────────────────────────────────────────
    todos_ids = re.findall(r'\bid=["\']([^"\']+)["\']', html)
    contagem = Counter(todos_ids)
    # Ignora IDs dinâmicos (templates JS como ${id}, prefixos genéricos acr_, pic_)
    ids_dinamicos = {'${id}', 'acr_', 'pic_'}
    dups = {k: v for k, v in contagem.items() if v > 1 and k not in ids_dinamicos}
    if dups:
        for idd, cnt in sorted(dups.items()):
            erros.append(f"ID DUPLICADO: #{idd} aparece {cnt}x")

    # ── 2. SINTAXE JS ────────────────────────────────────────────────────────
    scripts = re.findall(
        r'<script(?![^>]*type=["\']application/ld\+json["\'])(?![^>]*src=)[^>]*>(.*?)</script>',
        html, re.DOTALL)
    for i, s in enumerate(scripts):
        if len(s.strip()) < 30:
            continue
        tmp = BASE / f'tools/_tmp_chk_{fname}_{i}.js'
        tmp.write_text(s, encoding='utf-8')
        r = subprocess.run(['node', '--check', str(tmp)],
                           capture_output=True, text=True)
        tmp.unlink(missing_ok=True)
        if r.returncode != 0:
            msg = r.stderr.strip().split('\n')[0][:120]
            erros.append(f"ERRO JS script#{i}: {msg}")

    # ── 3. FUNÇÕES DEFINIDAS vs CHAMADAS ────────────────────────────────────
    # Junta todo o JS inline
    js_total = '\n'.join(scripts)
    definidas = set(re.findall(r'function\s+(\w+)\s*\(', js_total))
    chamadas  = set(re.findall(r'\b(\w+)\s*\(', js_total))
    # Funções chamadas via onclick/onchange no HTML
    chamadas_html = set(re.findall(
        r'on(?:click|change|input|submit|focus|blur)=["\'][^"\']*?(\w+)\s*\(', html))
    todas_chamadas = chamadas | chamadas_html

    # Funções definidas mas nunca chamadas (exceto padrões comuns)
    ignorar = {'function','if','for','while','switch','catch','return',
               'new','typeof','instanceof','void','delete','throw',
               'setTimeout','setInterval','Promise','fetch','console',
               'Object','Array','Math','JSON','Date','String','Number',
               'Boolean','parseInt','parseFloat','encodeURIComponent',
               'decodeURIComponent','document','window','navigator',
               'localStorage','sessionStorage','addEventListener',
               'removeEventListener','querySelector','querySelectorAll',
               'getElementById','getElementsByClassName','closest',
               'scrollIntoView','scrollTo','open','close','alert',
               'confirm','prompt','log','error','warn','info',
               'push','pop','shift','unshift','splice','slice','map',
               'filter','reduce','forEach','find','findIndex','some',
               'every','includes','indexOf','join','split','replace',
               'trim','toLowerCase','toUpperCase','toString','valueOf',
               'hasOwnProperty','keys','values','entries','assign',
               'freeze','create','defineProperty','getOwnPropertyNames',
               'floor','ceil','round','abs','max','min','random','pow',
               'sqrt','PI','E','stringify','parse','now','getTime',
               'getFullYear','getMonth','getDate','getHours','getMinutes',
               'getSeconds','setFullYear','setMonth','setDate',
               'toLocaleDateString','toLocaleTimeString','toISOString',
               'charCodeAt','fromCharCode','padStart','padEnd','repeat',
               'startsWith','endsWith','match','test','exec','search',
               'sort','reverse','flat','flatMap','fill','copyWithin',
               'encodeURI','decodeURI','isNaN','isFinite','NaN',
               'undefined','null','true','false','Infinity',
               'tick','calcularPróximoFim','irParaSeção',
               'DOMContentLoaded','load','resize','scroll','click',
               'change','input','submit','focus','blur','keydown',
               'keyup','keypress','mousedown','mouseup','mousemove',
               'touchstart','touchend','touchmove'}

    mortas = definidas - todas_chamadas - ignorar
    for fn in sorted(mortas):
        if len(fn) > 3:  # ignora nomes muito curtos
            avisos.append(f"FUNÇÃO SEM USO APARENTE: {fn}()")

    # Funções chamadas no HTML mas não definidas no JS inline
    # (podem estar em scripts externos — apenas avisa)
    externas_possiveis = chamadas_html - definidas - ignorar
    for fn in sorted(externas_possiveis):
        if len(fn) > 3:
            avisos.append(f"FUNÇÃO CHAMADA NO HTML SEM DEFINIÇÃO LOCAL: {fn}()")

    # ── 4. TAGS NÃO FECHADAS (verificação básica) ───────────────────────────
    tags_abrir  = len(re.findall(r'<div\b', html))
    tags_fechar = len(re.findall(r'</div>', html))
    diff = tags_abrir - tags_fechar
    if diff != 0:
        erros.append(f"TAGS DESBALANCEADAS: {tags_abrir} <div> vs {tags_fechar} </div> (diff={diff:+d})")

    # ── 5. BLOCOS CSS DUPLICADOS ─────────────────────────────────────────────
    seletores = re.findall(r'([.#][\w-]+(?:\s*,\s*[.#][\w-]+)*)\s*\{', html)
    cnt_sel = Counter(seletores)
    for sel, cnt in cnt_sel.items():
        if cnt > 1 and len(sel) > 2:
            avisos.append(f"SELETOR CSS DUPLICADO: '{sel}' definido {cnt}x")

    relatorio[fname] = {
        "erros": erros,
        "avisos": avisos[:20],  # limita avisos para não poluir
        "total_erros": len(erros),
        "total_avisos": len(avisos),
        "ids_duplicados": list(dups.keys()),
    }

# ── Salva JSON ────────────────────────────────────────────────────────────────
out = BASE / 'tools' / 'relatorio_auditoria_profissional.json'
out.write_text(json.dumps(relatorio, ensure_ascii=False, indent=2), encoding='utf-8')

# ── Imprime relatório ─────────────────────────────────────────────────────────
print("\n" + "="*70)
print("  AUDITORIA TÉCNICA PROFISSIONAL — SORVETERIA ITAPOLITANA CAJURU")
print("="*70)

total_erros_geral = 0
total_avisos_geral = 0

for fname, dados in relatorio.items():
    ne = dados['total_erros']
    na = dados['total_avisos']
    total_erros_geral += ne
    total_avisos_geral += na
    status = "✅ OK" if ne == 0 else f"❌ {ne} ERRO(S)"
    print(f"\n{'─'*60}")
    print(f"  {fname.upper():<35} {status}")
    print(f"{'─'*60}")
    if dados['erros']:
        for e in dados['erros']:
            print(f"  🔴 {e}")
    if dados['avisos']:
        for a in dados['avisos'][:10]:
            print(f"  🟡 {a}")
        if na > 10:
            print(f"  🟡 ... e mais {na-10} avisos (ver JSON)")
    if ne == 0 and na == 0:
        print("  Nenhum problema encontrado.")

print(f"\n{'='*70}")
print(f"  RESUMO FINAL")
print(f"  Erros críticos : {total_erros_geral}")
print(f"  Avisos         : {total_avisos_geral}")
if total_erros_geral == 0:
    print("  ✅ SITE PRONTO PARA PUBLICAÇÃO")
else:
    print("  ❌ CORRIGIR ANTES DE PUBLICAR")
print("="*70)
print(f"\nRelatório JSON salvo em: {out}")
