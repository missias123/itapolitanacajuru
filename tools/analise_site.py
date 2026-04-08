#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════
#  FERRAMENTA DE ANÁLISE TÉCNICA — Sorveteria Itapolitana Cajuru
#  Padrão: Google Lighthouse + W3C Validator + ESLint
#  Verifica: JS, HTML, CSS, links, responsividade, acessibilidade, SEO
# ═══════════════════════════════════════════════════════════════════════

import os, re, json, subprocess, sys
from bs4 import BeautifulSoup
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARQUIVOS_PRINCIPAIS = ['index.html', 'fidelidade.html', 'promocao.html',
                       'encomendas.html', 'dicas.html', 'admin-painel.html']

CORES = {
    'ERRO':    '\033[91m✗ ERRO\033[0m',
    'AVISO':   '\033[93m⚠ AVISO\033[0m',
    'OK':      '\033[92m✓ OK\033[0m',
    'INFO':    '\033[96mℹ INFO\033[0m',
    'TITULO':  '\033[1;95m',
    'RESET':   '\033[0m',
    'BOLD':    '\033[1m',
}

erros   = []
avisos  = []
oks     = []

def erro(arquivo, linha, msg):
    erros.append({'arquivo': arquivo, 'linha': linha, 'msg': msg})
    print(f"  {CORES['ERRO']}  [{arquivo}:{linha}] {msg}")

def aviso(arquivo, linha, msg):
    avisos.append({'arquivo': arquivo, 'linha': linha, 'msg': msg})
    print(f"  {CORES['AVISO']} [{arquivo}:{linha}] {msg}")

def ok(msg):
    oks.append(msg)
    print(f"  {CORES['OK']}    {msg}")

def titulo(msg):
    print(f"\n{CORES['TITULO']}{'═'*60}\n  {msg}\n{'═'*60}{CORES['RESET']}")

# ─────────────────────────────────────────────────────────────────────
# 1. VERIFICAÇÃO DE SINTAXE JAVASCRIPT (via Node.js)
# ─────────────────────────────────────────────────────────────────────
def verificar_js_inline(arquivo, conteudo, soup):
    titulo(f"JS INLINE — {arquivo}")
    scripts = soup.find_all('script', src=False)
    for i, script in enumerate(scripts):
        if not script.string:
            continue
        js = script.string
        # Salvar em arquivo temp e verificar com node
        tmp = f'/tmp/script_check_{i}.js'
        with open(tmp, 'w', encoding='utf-8') as f:
            f.write(js)
        result = subprocess.run(
            ['node', '--check', tmp],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            err_msg = result.stderr.strip().split('\n')[0]
            # Encontrar linha do erro
            match = re.search(r':(\d+)', err_msg)
            linha_err = int(match.group(1)) if match else 0
            # Encontrar contexto
            linhas_js = js.split('\n')
            contexto = linhas_js[linha_err-1].strip()[:80] if linha_err > 0 and linha_err <= len(linhas_js) else ''
            erro(arquivo, f"script#{i} linha {linha_err}", f"Sintaxe JS: {err_msg.split('/')[-1]} | '{contexto}'")
        else:
            ok(f"Script inline #{i} ({len(js)} chars) — sem erros de sintaxe")

# ─────────────────────────────────────────────────────────────────────
# 2. VERIFICAÇÃO DE SCRIPTS EXTERNOS
# ─────────────────────────────────────────────────────────────────────
def verificar_scripts_externos(arquivo, soup):
    titulo(f"SCRIPTS EXTERNOS — {arquivo}")
    scripts = soup.find_all('script', src=True)
    for s in scripts:
        src = s.get('src', '')
        if src.startswith('http') or src.startswith('//'):
            ok(f"Script externo: {src[:60]}")
        else:
            caminho = os.path.join(BASE, src.lstrip('/'))
            if os.path.exists(caminho):
                # Verificar sintaxe
                result = subprocess.run(['node', '--check', caminho], capture_output=True, text=True)
                if result.returncode != 0:
                    err_msg = result.stderr.strip().split('\n')[0]
                    erro(arquivo, src, f"Sintaxe JS em {src}: {err_msg}")
                else:
                    ok(f"Script local {src} — sem erros")
            else:
                erro(arquivo, src, f"Arquivo JS não encontrado: {src}")

# ─────────────────────────────────────────────────────────────────────
# 3. VERIFICAÇÃO DE LINKS INTERNOS
# ─────────────────────────────────────────────────────────────────────
def verificar_links(arquivo, soup):
    titulo(f"LINKS INTERNOS — {arquivo}")
    links = soup.find_all(['a', 'link'], href=True)
    for link in links:
        href = link.get('href', '')
        if not href or href.startswith('#') or href.startswith('http') or href.startswith('//') or href.startswith('mailto') or href.startswith('tel') or href.startswith('javascript'):
            continue
        # Link interno
        caminho_base = href.split('#')[0].split('?')[0]
        if not caminho_base:
            continue
        caminho_completo = os.path.join(BASE, caminho_base.lstrip('/'))
        if not os.path.exists(caminho_completo):
            erro(arquivo, href, f"Link quebrado: '{href}' — arquivo não encontrado")
        else:
            ok(f"Link OK: {href}")

# ─────────────────────────────────────────────────────────────────────
# 4. VERIFICAÇÃO DE IMAGENS
# ─────────────────────────────────────────────────────────────────────
def verificar_imagens(arquivo, soup):
    titulo(f"IMAGENS — {arquivo}")
    imgs = soup.find_all('img')
    sem_alt = 0
    quebradas = 0
    for img in imgs:
        src = img.get('src', '')
        alt = img.get('alt', '')
        if not alt:
            sem_alt += 1
        if src and not src.startswith('http') and not src.startswith('data:') and not src.startswith('//'):
            caminho = os.path.join(BASE, src.lstrip('/'))
            if not os.path.exists(caminho):
                aviso(arquivo, src, f"Imagem não encontrada: {src}")
                quebradas += 1
    if sem_alt > 0:
        aviso(arquivo, 'imgs', f"{sem_alt} imagens sem atributo alt (acessibilidade/SEO)")
    else:
        ok("Todas as imagens têm atributo alt")
    if quebradas == 0:
        ok("Nenhuma imagem local quebrada")

# ─────────────────────────────────────────────────────────────────────
# 5. VERIFICAÇÃO DE META TAGS SEO
# ─────────────────────────────────────────────────────────────────────
def verificar_seo(arquivo, soup):
    titulo(f"SEO & META TAGS — {arquivo}")
    # Title
    title = soup.find('title')
    if not title or not title.string:
        erro(arquivo, 'head', "Tag <title> ausente ou vazia")
    elif len(title.string) > 70:
        aviso(arquivo, 'title', f"Title muito longo ({len(title.string)} chars, ideal ≤60)")
    else:
        ok(f"Title: '{title.string[:60]}'")
    # Meta description
    desc = soup.find('meta', attrs={'name': 'description'})
    if not desc:
        erro(arquivo, 'head', "Meta description ausente")
    else:
        content = desc.get('content', '')
        if len(content) < 50:
            aviso(arquivo, 'meta', f"Meta description muito curta ({len(content)} chars)")
        else:
            ok(f"Meta description OK ({len(content)} chars)")
    # Viewport
    vp = soup.find('meta', attrs={'name': 'viewport'})
    if not vp:
        erro(arquivo, 'head', "Meta viewport ausente — site não responsivo!")
    else:
        ok("Meta viewport presente")
    # H1
    h1s = soup.find_all('h1')
    if len(h1s) == 0:
        aviso(arquivo, 'body', "Nenhum H1 encontrado (importante para SEO)")
    elif len(h1s) > 1:
        aviso(arquivo, 'body', f"{len(h1s)} H1s encontrados (ideal: apenas 1)")
    else:
        ok(f"H1 único: '{h1s[0].get_text()[:50]}'")

# ─────────────────────────────────────────────────────────────────────
# 6. VERIFICAÇÃO DE RESPONSIVIDADE CSS
# ─────────────────────────────────────────────────────────────────────
def verificar_responsividade(arquivo, conteudo):
    titulo(f"RESPONSIVIDADE — {arquivo}")
    # Verificar media queries
    mqs = re.findall(r'@media[^{]+\{', conteudo)
    celular = any('480' in mq or '375' in mq or '320' in mq for mq in mqs)
    tablet  = any('768' in mq or '600' in mq or '767' in mq for mq in mqs)
    desktop = any('1024' in mq or '1200' in mq or '900' in mq for mq in mqs)
    if celular:
        ok("Media query para celular (≤480px) presente")
    else:
        aviso(arquivo, 'css', "Sem media query específica para celular (≤480px)")
    if tablet:
        ok("Media query para tablet (≤768px) presente")
    else:
        aviso(arquivo, 'css', "Sem media query específica para tablet (≤768px)")
    if desktop:
        ok("Media query para desktop (≥1024px) presente")
    else:
        aviso(arquivo, 'css', "Sem media query para desktop (≥1024px)")
    # Verificar font-size fixo em px (deve usar clamp/rem/vw)
    fixed_fonts = re.findall(r'font-size\s*:\s*(\d+)px', conteudo)
    if len(fixed_fonts) > 20:
        aviso(arquivo, 'css', f"{len(fixed_fonts)} font-sizes fixos em px (preferir clamp/rem/vw)")
    # Verificar overflow-x
    if 'overflow-x:hidden' in conteudo.replace(' ', '') or 'overflow-x: hidden' in conteudo:
        ok("overflow-x:hidden presente (evita scroll horizontal)")
    else:
        aviso(arquivo, 'css', "overflow-x:hidden ausente (pode causar scroll horizontal no mobile)")

# ─────────────────────────────────────────────────────────────────────
# 7. VERIFICAÇÃO DE ACCORDIONS (específico para o cardápio)
# ─────────────────────────────────────────────────────────────────────
def verificar_accordions(arquivo, conteudo, soup):
    if arquivo != 'index.html':
        return
    titulo(f"ACCORDIONS DO CARDÁPIO — {arquivo}")
    # Encontrar todos os acc-body
    acc_bodies = soup.find_all(class_='acc-body')
    for body in acc_bodies:
        bid = body.get('id', '(sem id)')
        conteudo_interno = body.get_text(strip=True)
        filhos = [c for c in body.children if str(c).strip()]
        if not filhos and not conteudo_interno:
            erro(arquivo, bid, f"acc-body '{bid}' está VAZIO — container sem conteúdo!")
        else:
            ok(f"acc-body '{bid}' tem conteúdo ({len(filhos)} elementos)")
    # Verificar se toggleAcc está definida
    if 'function toggleAcc' in conteudo:
        ok("função toggleAcc() definida")
    else:
        erro(arquivo, 'js', "função toggleAcc() NÃO encontrada!")
    # Verificar aspas sem escape em innerHTML com onclick
    problemas = re.findall(r"innerHTML\s*=\s*'[^']*onclick=\"[^\"]*\('[^'\\][^']*'\)[^\"]*\"[^']*'", conteudo)
    if problemas:
        for p in problemas:
            erro(arquivo, 'js', f"Aspas simples sem escape em innerHTML+onclick: {p[:80]}")
    else:
        ok("Nenhum problema de aspas em innerHTML+onclick")

# ─────────────────────────────────────────────────────────────────────
# 8. VERIFICAÇÃO DE FORMULÁRIOS
# ─────────────────────────────────────────────────────────────────────
def verificar_formularios(arquivo, soup):
    titulo(f"FORMULÁRIOS — {arquivo}")
    forms = soup.find_all('form')
    if not forms:
        ok("Nenhum formulário HTML (usa JS direto — OK)")
        return
    for i, form in enumerate(forms):
        inputs = form.find_all('input')
        for inp in inputs:
            if inp.get('type') not in ['hidden', 'submit', 'button', 'checkbox', 'radio']:
                if not inp.get('placeholder') and not inp.get('aria-label'):
                    aviso(arquivo, f"form#{i}", f"Input sem placeholder/aria-label: {inp}")

# ─────────────────────────────────────────────────────────────────────
# 9. VERIFICAÇÃO DE PERFORMANCE
# ─────────────────────────────────────────────────────────────────────
def verificar_performance(arquivo, conteudo, soup):
    titulo(f"PERFORMANCE — {arquivo}")
    # Tamanho do arquivo
    tamanho_kb = len(conteudo.encode('utf-8')) / 1024
    if tamanho_kb > 500:
        aviso(arquivo, 'size', f"Arquivo grande: {tamanho_kb:.0f}KB (ideal <200KB)")
    else:
        ok(f"Tamanho do arquivo: {tamanho_kb:.0f}KB")
    # Scripts bloqueantes no head
    head = soup.find('head')
    if head:
        scripts_head = head.find_all('script', src=True)
        bloqueantes = [s for s in scripts_head if not s.get('async') and not s.get('defer')]
        if bloqueantes:
            aviso(arquivo, 'head', f"{len(bloqueantes)} script(s) bloqueante(s) no <head> sem async/defer")
        else:
            ok("Nenhum script bloqueante no <head>")
    # Imagens sem lazy loading
    imgs = soup.find_all('img')
    sem_lazy = [img for img in imgs if not img.get('loading')]
    if sem_lazy:
        aviso(arquivo, 'imgs', f"{len(sem_lazy)} imagens sem loading='lazy'")
    else:
        ok("Todas as imagens têm lazy loading")

# ─────────────────────────────────────────────────────────────────────
# EXECUTAR ANÁLISE
# ─────────────────────────────────────────────────────────────────────
def analisar_arquivo(nome):
    caminho = os.path.join(BASE, nome)
    if not os.path.exists(caminho):
        print(f"\n⚠ Arquivo não encontrado: {nome}")
        return
    print(f"\n{'█'*60}")
    print(f"  ANALISANDO: {nome}")
    print(f"{'█'*60}")
    with open(caminho, 'r', encoding='utf-8', errors='replace') as f:
        conteudo = f.read()
    soup = BeautifulSoup(conteudo, 'html.parser')
    verificar_js_inline(nome, conteudo, soup)
    verificar_scripts_externos(nome, soup)
    verificar_links(nome, soup)
    verificar_imagens(nome, soup)
    verificar_seo(nome, soup)
    verificar_responsividade(nome, conteudo)
    verificar_accordions(nome, conteudo, soup)
    verificar_formularios(nome, soup)
    verificar_performance(nome, conteudo, soup)

# ─────────────────────────────────────────────────────────────────────
# RELATÓRIO FINAL
# ─────────────────────────────────────────────────────────────────────
def relatorio_final():
    print(f"\n\n{'═'*60}")
    print(f"  RELATÓRIO FINAL — AUDITORIA TÉCNICA")
    print(f"{'═'*60}")
    print(f"\n  {CORES['BOLD']}ERROS CRÍTICOS ({len(erros)}){CORES['RESET']}")
    for e in erros:
        print(f"    \033[91m✗\033[0m [{e['arquivo']}:{e['linha']}] {e['msg']}")
    print(f"\n  {CORES['BOLD']}AVISOS ({len(avisos)}){CORES['RESET']}")
    for a in avisos:
        print(f"    \033[93m⚠\033[0m [{a['arquivo']}:{a['linha']}] {a['msg']}")
    print(f"\n  {CORES['BOLD']}APROVADOS ({len(oks)}){CORES['RESET']}")
    # Calcular nota
    total = len(erros) + len(avisos) + len(oks)
    nota = max(0, 100 - (len(erros) * 10) - (len(avisos) * 2))
    cor_nota = '\033[92m' if nota >= 80 else '\033[93m' if nota >= 60 else '\033[91m'
    print(f"\n  {'═'*40}")
    print(f"  {CORES['BOLD']}NOTA DO SITE: {cor_nota}{nota}/100{CORES['RESET']}")
    print(f"  Erros: {len(erros)} | Avisos: {len(avisos)} | OK: {len(oks)}")
    print(f"  {'═'*40}\n")
    # Salvar relatório JSON
    relatorio = {
        'nota': nota,
        'erros': erros,
        'avisos': avisos,
        'total_ok': len(oks)
    }
    with open(os.path.join(BASE, 'tools/relatorio_auditoria.json'), 'w', encoding='utf-8') as f:
        json.dump(relatorio, f, ensure_ascii=False, indent=2)
    print(f"  Relatório salvo em: tools/relatorio_auditoria.json\n")

# ─────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    arquivos = sys.argv[1:] if len(sys.argv) > 1 else ARQUIVOS_PRINCIPAIS
    print(f"\n{'═'*60}")
    print(f"  FERRAMENTA DE AUDITORIA TÉCNICA — ITAPOLITANA CAJURU")
    print(f"  Padrão: Google Lighthouse + W3C + ESLint")
    print(f"{'═'*60}")
    for arq in arquivos:
        analisar_arquivo(arq)
    relatorio_final()
