#!/usr/bin/bash
# ============================================================
# converte-imagens.sh — Sorveteria Itapolitana Cajuru
# Converte TODA imagem PNG/JPG/JPEG para WebP automaticamente
# Atualiza referências nos HTMLs e JSs do projeto
# Uso: ./converte-imagens.sh [--force]
# ============================================================
set -euo pipefail

PROJETO_DIR="$(cd "$(dirname "$0")" && pwd)"
QUALIDADE=82
FORCE=false

for arg in "$@"; do
  case $arg in
    --force) FORCE=true ;;
  esac
done

echo "============================================================"
echo "  Conversor WebP — Sorveteria Itapolitana Cajuru"
echo "============================================================"
echo "Diretório: ${PROJETO_DIR}"
echo "Qualidade WebP: ${QUALIDADE}%"
$FORCE && echo "Modo: FORÇAR reconversão de todas as imagens"
echo ""

# Verificar dependência cwebp
if ! command -v cwebp &>/dev/null; then
  echo "ERRO: cwebp não encontrado. Instale com: sudo apt-get install webp"
  exit 1
fi

CONVERTIDAS=0
JA_EXISTIA=0
ERROS=0

# ── 1. Converter todas as imagens PNG/JPG/JPEG para WebP ──────────────────────
echo "[1/2] Convertendo imagens para WebP..."
echo ""

while IFS= read -r -d '' img; do
  base="${img%.*}"
  webp="${base}.webp"

  # Ignorar arquivos de backup
  case "$img" in *bak*|*backup*|*".min."*) continue ;; esac

  if [ -f "$webp" ] && [ "$FORCE" = false ]; then
    echo "  ⏭  $(basename "$img") → já existe WebP ($(du -sh "$webp" | cut -f1))"
    JA_EXISTIA=$((JA_EXISTIA + 1))
    continue
  fi

  if cwebp -q "$QUALIDADE" "$img" -o "$webp" 2>/dev/null; then
    echo "  ✅ $(basename "$img"): $(du -sh "$img" | cut -f1) → $(du -sh "$webp" | cut -f1)"
    CONVERTIDAS=$((CONVERTIDAS + 1))
  else
    echo "  ❌ Erro ao converter: $(basename "$img")"
    ERROS=$((ERROS + 1))
  fi
done < <(find "${PROJETO_DIR}/images" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) -print0 2>/dev/null)

# ── 2. Atualizar referências nos HTMLs e JSs ──────────────────────────────────
echo ""
echo "[2/2] Atualizando referências nos arquivos HTML e JS..."
echo ""

ARQUIVOS_ATUALIZADOS=0

while IFS= read -r -d '' arq; do
  # Ignorar arquivos de backup e minificados
  case "$arq" in *bak*|*backup*|*".min."*) continue ;; esac

  # Verificar se há referências PNG/JPG/JPEG
  if grep -qi 'images/[^"'\'' ]*\.\(png\|jpg\|jpeg\)' "$arq" 2>/dev/null; then
    sed -i \
      -e 's|images/\([^"'\'' ]*\)\.png|images/\1.webp|gI' \
      -e 's|images/\([^"'\'' ]*\)\.jpg|images/\1.webp|gI' \
      -e 's|images/\([^"'\'' ]*\)\.jpeg|images/\1.webp|gI' \
      "$arq" 2>/dev/null || true
    echo "  ✅ $(basename "$arq"): referências atualizadas para WebP"
    ARQUIVOS_ATUALIZADOS=$((ARQUIVOS_ATUALIZADOS + 1))
  fi
done < <(find "$PROJETO_DIR" -maxdepth 2 -type f \( -iname "*.html" -o -iname "*.js" -o -iname "*.css" \) -print0 2>/dev/null)

# ── Resumo final ───────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  ✅ Imagens convertidas:    ${CONVERTIDAS}"
echo "  ⏭  Já existiam WebP:       ${JA_EXISTIA}"
[ "$ERROS" -gt 0 ] && echo "  ❌ Erros:                  ${ERROS}"
echo "  📝 Arquivos atualizados:  ${ARQUIVOS_ATUALIZADOS}"
echo "============================================================"

exit 0
