#!/bin/bash

echo "🎯 VALIDAÇÃO FINAL COMPLETA - FASE 6"
echo "$(date): Iniciando validação final da migração" >> logs/migration/phases.log

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VALIDATION_FAILED=0

# Função para validar
validate() {
    local test_name="$1"
    local command="$2"
    local required="$3"
    
    echo -n "Validando $test_name... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        echo "$(date): $test_name - OK" >> logs/migration/phases.log
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ FALHOU${NC}"
            echo "$(date): $test_name - FALHOU (CRÍTICO)" >> logs/migration/phases.log
            VALIDATION_FAILED=1
        else
            echo -e "${YELLOW}⚠️ AVISO${NC}"
            echo "$(date): $test_name - AVISO" >> logs/migration/phases.log
        fi
        return 1
    fi
}

echo "🔍 Executando validações finais..."
echo ""

# 1. Validações Críticas
echo "📋 Validações Críticas:"
validate "Build de produção" "npm run build" true
validate "Vite funcionando" "npx vite --version" true
validate "Node modules OK" "test -d node_modules" true

echo ""

# 2. Validações de Dependências
echo "📦 Validações de Dependências:"
validate "React 18 instalado" "npm list react 2>/dev/null | grep -q '18\.'" true
validate "TanStack Query v5" "npm list @tanstack/react-query 2>/dev/null | grep -q '5\.'" true
validate "Framer Motion" "npm list framer-motion >/dev/null 2>&1" false
validate "React Hot Toast" "npm list react-hot-toast >/dev/null 2>&1" false

echo ""

# 3. Validações de Estrutura
echo "🏗️ Validações de Estrutura:"
validate "Vite config existe" "test -f vite.config.ts" true
validate "Package.json OK" "test -f package.json" true
validate "Src directory" "test -d src" true
validate "Logs de migração" "test -d logs/migration" true

echo ""

# 4. Validações de Performance
echo "⚡ Validações de Performance:"
validate "Build directory" "test -d build" false
validate "Index.html existe" "test -f build/index.html" false

echo ""

# 5. Validações de Funcionalidade
echo "🎯 Validações de Funcionalidade:"
validate "Componentes existem" "test -d src/components" true
validate "Pages existem" "test -d src/pages" true
validate "Services existem" "test -d src/services" true
validate "Utils existem" "test -d src/utils" true

echo ""

# 6. Validações de Arquivos Críticos
echo "📁 Validações de Arquivos Críticos:"
validate "App.js existe" "test -f src/App.js" true
validate "Index.jsx existe" "test -f src/index.jsx" true
validate "Logger existe" "test -f src/utils/logger.js" true

echo ""

# Resultado final
echo "=========================================="
if [ $VALIDATION_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 VALIDAÇÃO FASE 6 COMPLETA COM SUCESSO!${NC}"
    echo -e "${GREEN}✅ Todas as validações críticas passaram${NC}"
    echo -e "${GREEN}📋 Auditoria de 215 arquivos concluída${NC}"
    echo -e "${GREEN}🚀 Pronto para Fase 7 - Migração de APIs${NC}"
    echo "$(date): VALIDAÇÃO FASE 6 - SUCESSO COMPLETO" >> logs/migration/phases.log
else
    echo -e "${RED}❌ VALIDAÇÃO FALHOU${NC}"
    echo -e "${RED}⚠️ Corrija os problemas críticos antes da Fase 7${NC}"
    echo "$(date): VALIDAÇÃO FASE 6 - FALHAS CRÍTICAS" >> logs/migration/phases.log
fi
echo "=========================================="

# Mostrar próximos passos
if [ $VALIDATION_FAILED -eq 0 ]; then
    echo ""
    echo "📋 Próximos Passos - FASE 7:"
    echo "1. Executar Fase 7A - Infraestrutura Core (24 arquivos críticos)"
    echo "2. Executar Fase 7B - Componentes Principais (39 arquivos)"
    echo "3. Executar Fase 7C - Flow Builder (24 arquivos complexos)"
    echo "4. Executar Fase 7D - Finalização (128 arquivos restantes)"
    echo "5. Validação final e deploy em produção"
    echo ""
    echo "📊 RESUMO DA AUDITORIA:"
    echo "- 215 arquivos identificados para migração"
    echo "- Material-UI v4 → MUI v5: 215 arquivos"
    echo "- react-toastify → React Hot Toast: 104 arquivos"
    echo "- Formik → React Hook Form: 47 arquivos"
    echo "- makeStyles → styled/sx: 163 arquivos"
    echo ""
    echo "⏱️ ESTIMATIVA FASE 7: 4 semanas (350 horas)"
fi

exit $VALIDATION_FAILED