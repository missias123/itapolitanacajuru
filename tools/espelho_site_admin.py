#!/usr/bin/env python3
"""
ESPELHO SITE ↔ ADMIN — Mapeamento campo por campo
Sorveteria Itapolitana Cajuru
"""
import re, json
from pathlib import Path

BASE = Path('/home/ubuntu/itapolitanacajuru')

def ler(nome):
    p = BASE / nome
    return p.read_text(encoding='utf-8') if p.exists() else ''

admin  = ler('admin-painel.html')
index  = ler('index.html')
promo  = ler('promocao.html')
fidel  = ler('fidelidade.html')
encom  = ler('encomendas.html')
loader = ler('scripts/site-loader.js')
products = ler('scripts/products.js')
enc_v2   = ler('scripts/enc-v2.js')

site_all = index + promo + fidel + encom + loader + products + enc_v2

# ── Chaves localStorage salvas pelo admin ─────────────────────────────────────
admin_setitem = re.findall(r"localStorage\.setItem\(['\"]([^'\"]+)['\"]", admin)
# ── Chaves localStorage lidas pelo site ──────────────────────────────────────
site_getitem  = re.findall(r"localStorage\.getItem\(['\"]([^'\"]+)['\"]", site_all)

admin_keys = sorted(set(admin_setitem))
site_keys  = sorted(set(site_getitem))

# ── Mapeamento de cada seção do site ─────────────────────────────────────────
# Extraindo textos editáveis do site (data-key, data-admin, id com prefixo conhecido)
site_data_keys = re.findall(r'data-key=["\']([^"\']+)["\']', site_all)
site_data_admin = re.findall(r'data-admin=["\']([^"\']+)["\']', site_all)

print("=" * 72)
print("  ESPELHO SITE ↔ ADMIN — ANÁLISE COMPLETA")
print("  Sorveteria Itapolitana Cajuru")
print("=" * 72)

# ── 1. CHAVES localStorage ────────────────────────────────────────────────────
print("\n┌─────────────────────────────────────────────────────────────────────┐")
print("│  CHAVES localStorage: ADMIN salva → SITE lê                        │")
print("└─────────────────────────────────────────────────────────────────────┘")

sinc   = [k for k in admin_keys if k in site_keys]
falta  = [k for k in admin_keys if k not in site_keys]
extra  = [k for k in site_keys  if k not in admin_keys]

print(f"\n  ✅ SINCRONIZADAS ({len(sinc)}):")
for k in sinc:
    print(f"     ✓ {k}")

print(f"\n  ❌ ADMIN SALVA MAS SITE NÃO LÊ ({len(falta)}) — DADOS PERDIDOS:")
for k in falta:
    print(f"     ✗ {k}")

print(f"\n  ⚠️  SITE LÊ MAS ADMIN NÃO SALVA ({len(extra)}) — CAMPO SEM EDIÇÃO:")
for k in extra:
    print(f"     ? {k}")

# ── 2. CONTEÚDOS EDITÁVEIS DO SITE ───────────────────────────────────────────
print("\n┌─────────────────────────────────────────────────────────────────────┐")
print("│  CONTEÚDOS DO SITE — O QUE EXISTE E SE ADMIN PODE EDITAR           │")
print("└─────────────────────────────────────────────────────────────────────┘")

# Mapeamento manual baseado no conteúdo real do site
mapa_site = {
    "index.html": {
        "Hero / Cabeçalho": {
            "Título principal": ("home-titulo", "home_titulo"),
            "Subtítulo": ("home-subtitulo", "home_subtitulo"),
            "Descrição": ("home-descricao", "home_descricao"),
            "Badge promoção": ("home-badge", "home_badge"),
            "Botão CTA WhatsApp": ("home-cta-whats", "home_cta_whats"),
        },
        "Barra de navegação": {
            "Btn Cardápio": ("home-nav-cardapio", "home_nav"),
            "Btn Encomendas": ("home-nav-encomendas", "home_nav"),
            "Btn Fidelidade": ("home-nav-fidelidade", "home_nav"),
            "Btn Promoção": ("home-nav-promocao", "home_nav"),
        },
        "Cardápio — Sorvetes de Massa": {
            "Sabores (lista)": ("sabores_sorvete", "sabores_sorvete"),
            "Preços": ("preco_sorvete", "preco_sorvete"),
            "Disponibilidade": ("sabores_sorvete", "sabores_sorvete"),
        },
        "Cardápio — Açaí": {
            "Tamanhos e preços": ("preco_acai", "preco_acai"),
            "Complementos": ("complementos_acai", "complementos_acai"),
        },
        "Cardápio — Milk-shake": {
            "Sabores e preços": ("preco_milk", "preco_milk"),
        },
        "Cardápio — Sorvete Gourmet": {
            "Sabores e preços": ("preco_gourmet", "preco_gourmet"),
        },
        "Cardápio — Sobremesas": {
            "Itens e preços": ("preco_sobremesas", "preco_sobremesas"),
        },
        "4 Cards de Encomendas (abaixo cardápio)": {
            "Sorvetes em Caixa": ("enc_caixas", "enc_caixas"),
            "Tortas": ("enc_tortas", "enc_tortas"),
            "Picolés": ("enc_picoles", "enc_picoles"),
            "Complementos": ("enc_complementos", "enc_complementos"),
        },
        "Fale Conosco": {
            "WhatsApp": ("fc-whatsapp", "fc_whatsapp"),
            "Endereço": ("fc-endereco", "fc_endereco"),
            "Horário": ("fc-horario", "fc_horario"),
            "E-mail": ("fc-email", "fc_email"),
        },
        "Depoimentos": {
            "Lista de depoimentos": ("depoimentos", "depoimentos"),
        },
        "Footer": {
            "Copyright": ("cfg-footer-copy", "cfg_footer"),
            "Horário rodapé": ("cfg-footer-horario", "cfg_footer"),
        },
    },
    "promocao.html": {
        "Promoção Ativa": {
            "Título": ("promo-titulo", "promo_titulo"),
            "Descrição": ("promo-descricao", "promo_descricao"),
            "Imagem": ("promo-img", "promo_img"),
            "Link": ("promo-link", "promo_link"),
            "Data fim": ("promo-datafim", "promo_datafim"),
        },
        "Sorteio Mensal": {
            "Status (aberto/fechado)": ("sort-status", "sort_status"),
            "Prêmio": ("sort-premio", "sort_premio"),
            "Data próximo": ("sort-data-prox", "sort_data_prox"),
            "Vencedor": ("sort-vencedor", "sort_vencedor"),
        },
    },
    "fidelidade.html": {
        "Clube de Fidelidade": {
            "Título": ("fid-titulo", "fid_titulo"),
            "Descrição": ("fid-descricao", "fid_descricao"),
            "Pts Milk-shake": ("fid-pts-milk", "fid_pts_milk"),
            "Pts Caixa": ("fid-pts-caixa", "fid_pts_caixa"),
            "Prêmio Milk nome": ("fid-premio-milk-nome", "fid_premio"),
            "Prêmio Caixa nome": ("fid-premio-caixa-nome", "fid_premio"),
        },
    },
    "encomendas.html": {
        "Caixas de Sorvete": {
            "Caixa 5L 2 sabores — preço": ("cx5l_2s_preco", "estoque_caixas"),
            "Caixa 5L 3 sabores — preço": ("cx5l_3s_preco", "estoque_caixas"),
            "Caixa 10L 2 sabores — preço": ("cx10l_2s_preco", "estoque_caixas"),
            "Caixa 10L 3 sabores — preço": ("cx10l_3s_preco", "estoque_caixas"),
            "Estoque caixas": ("estoque_caixas", "estoque_caixas"),
        },
        "Tortas de Sorvete": {
            "Preço torta": ("torta1_preco", "estoque_enc"),
            "Estoque torta": ("torta1_estoque", "estoque_enc"),
        },
        "Picolés": {
            "Estoque por sabor": ("estoque_picoles", "estoque_picoles"),
            "Preços por categoria": ("precos_picoles", "precos_picoles"),
        },
        "Acréscimos": {
            "Estoque acréscimos": ("estoque_acrescimos", "estoque_acrescimos"),
        },
    },
}

# Verifica cada campo
total = 0
ok = 0
faltando_admin = []

for pagina, secoes in mapa_site.items():
    print(f"\n  📄 {pagina.upper()}")
    for secao, campos in secoes.items():
        print(f"\n    📌 {secao}:")
        for campo, (site_id, admin_key) in campos.items():
            total += 1
            # Verifica se o admin tem esse campo (id ou localStorage key)
            tem_no_admin = (
                f'id="{admin_key}"' in admin or
                f"id='{admin_key}'" in admin or
                admin_key in admin_keys or
                admin_key.replace('_', '-') in admin or
                any(admin_key in k for k in admin_keys)
            )
            # Verifica se o site tem esse campo
            tem_no_site = (
                f'id="{site_id}"' in site_all or
                f"id='{site_id}'" in site_all or
                site_id in site_keys or
                site_id.replace('_', '-') in site_all or
                any(site_id in k for k in site_keys)
            )
            if tem_no_admin and tem_no_site:
                ok += 1
                print(f"       ✅ {campo}")
            elif tem_no_site and not tem_no_admin:
                faltando_admin.append(f"{pagina} → {secao} → {campo}")
                print(f"       ❌ {campo} — EXISTE NO SITE MAS NÃO NO ADMIN")
            elif tem_no_admin and not tem_no_site:
                print(f"       ⚠️  {campo} — ADMIN TEM MAS SITE NÃO USA")
            else:
                print(f"       🔍 {campo} — VERIFICAR MANUALMENTE")

# ── RESUMO ────────────────────────────────────────────────────────────────────
print("\n" + "=" * 72)
print("  RESUMO FINAL")
print("=" * 72)
print(f"  Total de campos mapeados  : {total}")
print(f"  ✅ Sincronizados          : {ok}")
print(f"  ❌ Faltam no admin        : {len(faltando_admin)}")
print(f"\n  Chaves localStorage:")
print(f"     Admin salva  : {len(admin_keys)}")
print(f"     Site lê      : {len(site_keys)}")
print(f"     Sincronizadas: {len(sinc)}")
print(f"     Perdidas     : {len(falta)}")
print(f"     Sem edição   : {len(extra)}")

if faltando_admin:
    print(f"\n  ❌ CAMPOS QUE FALTAM NO ADMIN:")
    for f in faltando_admin:
        print(f"     • {f}")

print("=" * 72)
