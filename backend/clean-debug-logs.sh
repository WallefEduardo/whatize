#!/bin/bash

# Script para limpar logs de debug de desenvolvimento
# Remove console.log que não devem estar em produção

echo "🧹 LIMPANDO LOGS DE DEBUG DE DESENVOLVIMENTO"
echo "============================================="
echo ""

# Contador de arquivos modificados
count=0

# Função para processar arquivos
clean_debug_logs() {
    local file="$1"
    local original_size=$(wc -l < "$file")
    
    # Backup do arquivo original
    cp "$file" "${file}.backup"
    
    # Remove linhas específicas de debug
    sed -i '/console\.log.*\[DEBUG\]/d' "$file"
    sed -i '/console\.info.*📊.*Contact Cache Stats/d' "$file"
    sed -i '/console\.debug.*📡.*BAILEYS EVENT/d' "$file"
    sed -i '/console\.info.*📝.*CONTACT.*CREATE\|UPDATE/d' "$file"
    sed -i '/console\.log.*🔐.*\[DEBUG\]/d' "$file"
    sed -i '/console\.log.*🌐.*\[DEBUG\]/d' "$file"
    
    local new_size=$(wc -l < "$file")
    local lines_removed=$((original_size - new_size))
    
    if [ $lines_removed -gt 0 ]; then
        echo "✅ $file: $lines_removed linhas de debug removidas"
        ((count++))
        rm "${file}.backup"
    else
        echo "ℹ️  $file: nenhum log de debug encontrado"
        mv "${file}.backup" "$file"
    fi
}

echo "🔍 Procurando logs de debug em arquivos TypeScript..."
echo ""

# Processa arquivos específicos que sabemos que têm logs de debug
if [ -f "src/middleware/isAuth.ts" ]; then
    clean_debug_logs "src/middleware/isAuth.ts"
fi

if [ -f "src/app.ts" ]; then
    clean_debug_logs "src/app.ts"
fi

if [ -f "src/utils/raceConditionLogger.ts" ]; then
    clean_debug_logs "src/utils/raceConditionLogger.ts"
fi

if [ -f "src/libs/contactCache.ts" ]; then
    clean_debug_logs "src/libs/contactCache.ts"
fi

# Procura outros arquivos com logs de debug
echo ""
echo "🔍 Procurando outros arquivos com logs de debug..."

find src -name "*.ts" -type f | while read -r file; do
    if grep -q -E "console\.(log|info|debug).*(\[DEBUG\]|📊|📡|📝|🔐|🌐)" "$file"; then
        clean_debug_logs "$file"
    fi
done

echo ""
echo "📊 RESUMO:"
echo "=========="
echo "Arquivos processados: $count"
echo ""

if [ $count -gt 0 ]; then
    echo "✅ Logs de debug removidos com sucesso!"
    echo ""
    echo "💡 PRÓXIMOS PASSOS:"
    echo "1. Teste o sistema para garantir que tudo funciona"
    echo "2. Faça commit das mudanças: git add . && git commit -m 'Remove debug logs'"
    echo "3. Em desenvolvimento, use o sistema de debug condicional:"
    echo "   import { debug, auth, request } from '../utils/debugLogger';"
else
    echo "ℹ️  Nenhum log de debug encontrado para remover"
fi

echo ""
echo "🎯 SISTEMA DE LOGS AGORA:"
echo "========================"
echo "• ✅ Produção: Logs limpos e performáticos"
echo "• ✅ Desenvolvimento: Use debugLogger.ts para logs condicionais"
echo "• ✅ Erros críticos: Sempre logados (console.error)"
echo "• ✅ Warnings: Sempre logados (console.warn)" 