#!/bin/bash
# 🛡️ INSTALADOR DO GUARDIÃO ITAPOLITANA
# Execute este script UMA VEZ para ativar a proteção local

echo "🛡️ Instalando Guardião Itapolitana..."

# Copiar o hook para o diretório .git/hooks
cp .github/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Guardião instalado com sucesso!"
echo "   A partir de agora, todo commit será verificado automaticamente."
echo "   Site protegido: https://itapolitanacajuru.com.br"
