#!/bin/bash
# scripts/validate-phase3.sh

echo "🎨 VALIDAÇÃO FASE 3 - Sistema de Design"
echo "$(date): Iniciando validação Fase 3" >> logs/migration/phases.log

# 1. Verificar se build ainda funciona
echo "1. Testando build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build - OK"
    echo "$(date): Build Fase 3 - OK" >> logs/migration/phases.log
else
    echo "❌ Build - FALHOU"
    echo "$(date): Build Fase 3 - FALHOU" >> logs/migration/phases.log
    exit 1
fi

# 2. Verificar se MUI v7 está instalado
echo "2. Verificando MUI v7..."
MUI_VERSION=$(npm list @mui/material --depth=0 | grep @mui/material@)
if echo "$MUI_VERSION" | grep -q "7\."; then
    echo "✅ MUI v7 instalado: $MUI_VERSION"
    echo "$(date): MUI v7 - OK" >> logs/migration/phases.log
else
    echo "❌ MUI v7 não detectado: $MUI_VERSION"
    echo "$(date): MUI v7 - PROBLEMA" >> logs/migration/phases.log
fi

# 3. Verificar se Tailwind está configurado
echo "3. Verificando Tailwind..."
if [ -f "tailwind.config.js" ]; then
    echo "✅ Tailwind configurado"
    echo "$(date): Tailwind - OK" >> logs/migration/phases.log
else
    echo "❌ Tailwind não configurado"
    echo "$(date): Tailwind - FALHOU" >> logs/migration/phases.log
fi

# 4. Verificar se Shadcn/UI está instalado
echo "4. Verificando Shadcn/UI..."
if [ -f "components.json" ]; then
    echo "✅ Shadcn/UI configurado"
    echo "$(date): Shadcn/UI - OK" >> logs/migration/phases.log
else
    echo "❌ Shadcn/UI não configurado"
    echo "$(date): Shadcn/UI - PROBLEMA" >> logs/migration/phases.log
fi

# 5. Verificar coexistência Material-UI v4 + MUI v7
echo "5. Verificando coexistência Material-UI v4..."
if npm list @material-ui/core 2>/dev/null | grep -q "@material-ui/core"; then
    echo "✅ Material-UI v4 mantido para compatibilidade"
    echo "$(date): Material-UI v4 - PRESERVADO" >> logs/migration/phases.log
else
    echo "❌ Material-UI v4 foi removido prematuramente"
    echo "$(date): Material-UI v4 - REMOVIDO ACIDENTALMENTE" >> logs/migration/phases.log
fi

# 6. Verificar se tema foi criado
echo "6. Verificando tema..."
if [ -f "src/theme/mui-theme.ts" ]; then
    echo "✅ Tema MUI configurado"
    echo "$(date): Tema - OK" >> logs/migration/phases.log
else
    echo "❌ Tema não encontrado"
    echo "$(date): Tema - FALHOU" >> logs/migration/phases.log
fi

echo "✅ VALIDAÇÃO FASE 3 CONCLUÍDA"
echo "$(date): Validação Fase 3 - CONCLUÍDA" >> logs/migration/phases.log