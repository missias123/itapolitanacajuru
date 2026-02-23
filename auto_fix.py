#!/usr/bin/env python3
"""
AUTO-FIX SYSTEM — Sorveteria Itapolitana
Sistema de verificação e correção automática de erros do site.
Executa sem intervenção humana: detecta → corrige → publica.
"""

import os, re, subprocess, json
from pathlib import Path
from datetime import datetime

REPO = Path('/tmp/itapolitanacajuru')
RELATORIO = []
CORRECOES = 0

def log(tipo, msg):
    icon = {'OK':'✅','ERRO':'❌','FIX':'🔧','INFO':'ℹ️'}.get(tipo,'•')
    linha = f"{icon} [{tipo}] {msg}"
    print(linha)
    RELATORIO.append(linha)

def ler(path):
    return Path(path).read_text(encoding='utf-8')

def gravar(path, content):
    Path(path).write_text(content, encoding='utf-8')

def corrigir(path, old, new, descricao):
    global CORRECOES
    c = ler(path)
    if old in c:
        gravar(path, c.replace(old, new))
        log('FIX', f"{Path(path).name}: {descricao}")
        CORRECOES += 1
        return True
    return False

# ─────────────────────────────────────────────
# 1. VERIFICAR IMAGENS REFERENCIADAS
# ─────────────────────────────────────────────
def verificar_imagens():
    log('INFO', '── Verificando imagens referenciadas ──')
    html_files = list(REPO.glob('*.html')) + list(REPO.glob('**/*.html'))
    imgs_existentes = set(str(p.relative_to(REPO)) for p in REPO.glob('images/*'))
    
    for hf in html_files:
        content = ler(hf)
        refs = re.findall(r'(?:src|href)=["\']([^"\']*\.(?:jpg|jpeg|png|gif|webp|svg))["\']', content)
        for ref in refs:
            # Normalizar path
            if ref.startswith('http') or ref.startswith('//'):
                continue
            ref_clean = ref.lstrip('./')
            if ref_clean not in imgs_existentes and not (REPO / ref_clean).exists():
                log('ERRO', f"{hf.name}: imagem não encontrada → {ref}")
            else:
                log('OK', f"{hf.name}: imagem OK → {ref}")

# ─────────────────────────────────────────────
# 2. VERIFICAR SCRIPTS REFERENCIADOS
# ─────────────────────────────────────────────
def verificar_scripts():
    log('INFO', '── Verificando scripts referenciados ──')
    html_files = list(REPO.glob('*.html')) + list(REPO.glob('**/*.html'))
    
    for hf in html_files:
        content = ler(hf)
        refs = re.findall(r'<script[^>]+src=["\']([^"\']+\.js)["\']', content)
        for ref in refs:
            if ref.startswith('http') or ref.startswith('//'):
                continue
            # Resolver path relativo ao HTML
            base = hf.parent
            script_path = (base / ref).resolve()
            if not script_path.exists():
                log('ERRO', f"{hf.name}: script não encontrado → {ref}")
            else:
                log('OK', f"{hf.name}: script OK → {ref}")

# ─────────────────────────────────────────────
# 3. VERIFICAR ESTRUTURA HTML BÁSICA
# ─────────────────────────────────────────────
def verificar_html():
    log('INFO', '── Verificando estrutura HTML ──')
    html_files = list(REPO.glob('*.html')) + list(REPO.glob('**/*.html'))
    
    for hf in html_files:
        content = ler(hf)
        
        # Verificar DOCTYPE
        if '<!DOCTYPE html>' not in content and '<!doctype html>' not in content:
            log('ERRO', f"{hf.name}: falta DOCTYPE")
            corrigir(str(hf), '<html', '<!DOCTYPE html>\n<html', 'DOCTYPE adicionado')
        else:
            log('OK', f"{hf.name}: DOCTYPE presente")
        
        # Verificar meta charset
        if 'charset' not in content.lower():
            log('ERRO', f"{hf.name}: falta meta charset")
        else:
            log('OK', f"{hf.name}: charset presente")
        
        # Verificar meta viewport
        if 'viewport' not in content:
            log('ERRO', f"{hf.name}: falta meta viewport")
        else:
            log('OK', f"{hf.name}: viewport presente")
        
        # Verificar title
        if '<title>' not in content:
            log('ERRO', f"{hf.name}: falta <title>")
        else:
            log('OK', f"{hf.name}: title presente")
        
        # Verificar tags abertas sem fechar (básico)
        opens = len(re.findall(r'<script(?:\s[^>]*)?>(?!</script>)', content))
        closes = len(re.findall(r'</script>', content))
        if opens != closes:
            log('ERRO', f"{hf.name}: {opens} <script> vs {closes} </script> — possível tag não fechada")
        else:
            log('OK', f"{hf.name}: tags <script> balanceadas ({opens})")
        
        # Verificar código JS solto fora de tags script
        # Padrão: texto que parece JS fora de <script>
        # Remover conteúdo de scripts e verificar se há código JS no body
        body_sem_scripts = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
        body_sem_scripts = re.sub(r'<style[^>]*>.*?</style>', '', body_sem_scripts, flags=re.DOTALL)
        if 'function ' in body_sem_scripts and 'onclick' not in body_sem_scripts[:100]:
            # Verificar se é realmente código solto e não está em atributos
            js_solto = re.findall(r'(?<!["\'])function\s+\w+\s*\(', body_sem_scripts)
            if js_solto:
                log('ERRO', f"{hf.name}: possível código JS solto fora de <script>: {js_solto[:2]}")
            else:
                log('OK', f"{hf.name}: sem código JS solto detectado")
        else:
            log('OK', f"{hf.name}: sem código JS solto detectado")

# ─────────────────────────────────────────────
# 4. CORREÇÕES AUTOMÁTICAS ESPECÍFICAS
# ─────────────────────────────────────────────
def aplicar_correcoes():
    log('INFO', '── Aplicando correções automáticas ──')
    
    enc = str(REPO / 'encomendas.html')
    enc_js = str(REPO / 'scripts/enc-v2.js')
    idx = str(REPO / 'index.html')
    
    # 4.1 Links externos sem rel=noopener
    for hf in list(REPO.glob('*.html')) + list(REPO.glob('**/*.html')):
        content = ler(str(hf))
        # Encontrar target="_blank" sem rel=noopener
        pattern = r'(target="_blank"(?!\s*rel=))'
        matches = re.findall(pattern, content)
        if matches:
            new_content = re.sub(
                r'target="_blank"(?!\s*rel=)',
                'target="_blank" rel="noopener noreferrer"',
                content
            )
            gravar(str(hf), new_content)
            log('FIX', f"{hf.name}: adicionado rel=noopener em {len(matches)} links")
            global CORRECOES
            CORRECOES += len(matches)
    
    # 4.2 Imagens sem loading=lazy
    for hf in list(REPO.glob('*.html')) + list(REPO.glob('**/*.html')):
        content = ler(str(hf))
        # Imagens sem loading (exceto logo/above-fold)
        imgs_sem_lazy = re.findall(r'<img(?![^>]*loading=)[^>]*(?:igreja|banner|footer)[^>]*>', content, re.IGNORECASE)
        if imgs_sem_lazy:
            new_content = re.sub(
                r'(<img)(?![^>]*loading=)([^>]*(?:igreja|banner|footer)[^>]*>)',
                r'\1 loading="lazy"\2',
                content,
                flags=re.IGNORECASE
            )
            if new_content != content:
                gravar(str(hf), new_content)
                log('FIX', f"{hf.name}: loading=lazy adicionado em imagens de rodapé/banner")
                CORRECOES += 1
    
    # 4.3 Botões sem type (risco de submit)
    for hf in list(REPO.glob('*.html')) + list(REPO.glob('**/*.html')):
        content = ler(str(hf))
        btns_sem_type = re.findall(r'<button(?![^>]*type=)[^>]*>', content)
        if btns_sem_type:
            new_content = re.sub(
                r'<button(?![^>]*type=)([^>]*)>',
                r'<button type="button"\1>',
                content
            )
            if new_content != content:
                gravar(str(hf), new_content)
                log('FIX', f"{hf.name}: type='button' adicionado em {len(btns_sem_type)} botões")
                CORRECOES += len(btns_sem_type)
    
    # 4.4 Inputs de texto sem autocomplete
    for hf in [enc]:
        if not Path(hf).exists():
            continue
        content = ler(hf)
        # Input nome sem autocomplete
        if 'id="cliente-nome"' in content and 'autocomplete="name"' not in content:
            content = content.replace(
                'id="cliente-nome"',
                'id="cliente-nome" autocomplete="name"'
            )
            gravar(hf, content)
            log('FIX', f"{Path(hf).name}: autocomplete=name adicionado no campo nome")
            CORRECOES += 1
    
    # 4.5 Verificar e corrigir font-size nos inputs (evitar zoom iOS)
    for hf in list(REPO.glob('*.html')) + list(REPO.glob('**/*.html')):
        content = ler(str(hf))
        # Verificar se há inputs sem font-size: 16px no CSS
        if 'input' in content and 'font-size: 16px' not in content and 'font-size:16px' not in content:
            # Adicionar regra CSS para inputs se não existir
            if '<style>' in content or '<style ' in content:
                # Verificar se já tem a regra
                if 'input[type=' not in content or 'font-size' not in content:
                    style_fix = '\n    /* iOS zoom fix */\n    input, select, textarea { font-size: 16px !important; }\n'
                    new_content = re.sub(
                        r'(</style>)',
                        style_fix + r'\1',
                        content,
                        count=1
                    )
                    if new_content != content:
                        gravar(str(hf), new_content)
                        log('FIX', f"{hf.name}: font-size:16px adicionado nos inputs (fix zoom iOS)")
                        CORRECOES += 1

# ─────────────────────────────────────────────
# 5. VERIFICAR LINKS INTERNOS
# ─────────────────────────────────────────────
def verificar_links_internos():
    log('INFO', '── Verificando links internos ──')
    html_files = list(REPO.glob('*.html')) + list(REPO.glob('**/*.html'))
    
    for hf in html_files:
        content = ler(hf)
        refs = re.findall(r'href=["\']([^"\'#?]+\.html)["\']', content)
        for ref in refs:
            if ref.startswith('http'):
                continue
            base = hf.parent
            target = (base / ref).resolve()
            if not target.exists():
                log('ERRO', f"{hf.name}: link interno quebrado → {ref}")
            else:
                log('OK', f"{hf.name}: link OK → {ref}")

# ─────────────────────────────────────────────
# 6. VERIFICAR MANIFEST E SEO
# ─────────────────────────────────────────────
def verificar_seo():
    log('INFO', '── Verificando SEO e manifest ──')
    
    # manifest.json
    manifest = REPO / 'manifest.json'
    if manifest.exists():
        try:
            data = json.loads(ler(str(manifest)))
            log('OK', f"manifest.json válido: {data.get('name','?')}")
        except:
            log('ERRO', 'manifest.json inválido (JSON malformado)')
    else:
        log('ERRO', 'manifest.json não encontrado')
    
    # robots.txt
    robots = REPO / 'robots.txt'
    if robots.exists():
        log('OK', 'robots.txt presente')
    else:
        log('ERRO', 'robots.txt não encontrado')
    
    # sitemap.xml
    sitemap = REPO / 'sitemap.xml'
    if sitemap.exists():
        log('OK', 'sitemap.xml presente')
    else:
        log('ERRO', 'sitemap.xml não encontrado')
    
    # CNAME
    cname = REPO / 'CNAME'
    if cname.exists():
        log('OK', f"CNAME presente: {ler(str(cname)).strip()}")
    else:
        log('ERRO', 'CNAME não encontrado')

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    print("\n" + "="*60)
    print("🔍 AUTO-FIX SYSTEM — Sorveteria Itapolitana")
    print(f"📅 {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("="*60 + "\n")
    
    verificar_html()
    verificar_imagens()
    verificar_scripts()
    verificar_links_internos()
    verificar_seo()
    aplicar_correcoes()
    
    print("\n" + "="*60)
    print(f"📊 RESULTADO: {CORRECOES} correções aplicadas automaticamente")
    erros = [r for r in RELATORIO if '[ERRO]' in r]
    fixes = [r for r in RELATORIO if '[FIX]' in r]
    print(f"❌ Erros detectados: {len(erros)}")
    print(f"🔧 Correções aplicadas: {len(fixes)}")
    print("="*60)
    
    # Salvar relatório
    relatorio_path = REPO / 'auto_fix_report.md'
    with open(str(relatorio_path), 'w', encoding='utf-8') as f:
        f.write(f"# Relatório Auto-Fix — {datetime.now().strftime('%d/%m/%Y %H:%M')}\n\n")
        f.write(f"**Correções aplicadas:** {CORRECOES}\n\n")
        f.write("## Detalhes\n\n```\n")
        f.write('\n'.join(RELATORIO))
        f.write("\n```\n")
    
    print(f"\n📄 Relatório salvo em: auto_fix_report.md")
    
    # Git commit e push automático se houve correções
    if CORRECOES > 0:
        print("\n🚀 Publicando correções no GitHub...")
        os.chdir(str(REPO))
        subprocess.run(['git', 'add', '-A'], check=True)
        subprocess.run(['git', 'commit', '-m', f'auto-fix: {CORRECOES} correções automáticas ({datetime.now().strftime("%d/%m/%Y %H:%M")})'], check=True)
        result = subprocess.run(['git', 'push', 'origin', 'main'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Publicado no GitHub com sucesso!")
        else:
            print(f"❌ Erro no push: {result.stderr}")
    else:
        print("\n✅ Nenhuma correção necessária — site limpo!")

if __name__ == '__main__':
    main()
