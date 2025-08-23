#!/bin/bash

# Script para renomear arquivos .js para .jsx na pasta pages
echo "🔄 Renomeando arquivos .js para .jsx na pasta src/pages..."

# Contador de arquivos renomeados
count=0

# Encontrar e renomear todos os arquivos .js na pasta pages
find src/pages -name "*.js" -type f | while read file; do
    # Obter o novo nome com extensão .jsx
    new_file="${file%%.js}.jsx"
    
    # Renomear o arquivo
    mv "$file" "$new_file"
    
    echo "✅ Renomeado: $file → $new_file"
    ((count++))
done

echo "🎉 Concluído! Arquivos renomeados na pasta pages."

# Atualizar imports que referenciam arquivos da pasta pages
echo "🔄 Atualizando imports que referenciam arquivos da pasta pages..."

# Encontrar e atualizar imports
find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | xargs grep -l "from.*pages.*\.js" | while read file; do
    # Substituir .js por .jsx nos imports de pages
    sed -i 's/from \(.*pages.*\)\.js/from \1.jsx/g' "$file"
    echo "✅ Atualizado imports em: $file"
done

echo "🎉 Todos os arquivos da pasta pages foram convertidos para .jsx!"
echo "📋 Execute: npm run build para testar"