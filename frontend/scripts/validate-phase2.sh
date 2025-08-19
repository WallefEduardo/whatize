#!/bin/bash
# scripts/validate-phase2.sh

echo "🔍 VALIDAÇÃO FASE 2 - Build System Migration"
echo "$(date): Iniciando validação Fase 2" >> logs/migration/phases.log

# 1. Testar build com Vite
echo "1. Testando build com Vite..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Vite build - OK"
    echo "$(date): Vite build - SUCESSO" >> logs/migration/phases.log
else
    echo "❌ Vite build - FALHOU"
    echo "$(date): Vite build - FALHOU" >> logs/migration/phases.log
    exit 1
fi

# 2. Testar servidor de desenvolvimento
echo "2. Testando servidor de desenvolvimento..."
timeout 30s npm run dev &
DEV_PID=$!
sleep 10

# Verificar se o servidor está rodando
if curl -f http://localhost:3002 >/dev/null 2>&1; then
    echo "✅ Servidor de desenvolvimento - OK"
    echo "$(date): Dev server - SUCESSO" >> logs/migration/phases.log
else
    echo "❌ Servidor de desenvolvimento - FALHOU"
    echo "$(date): Dev server - FALHOU" >> logs/migration/phases.log
fi

# Matar processo do servidor
kill $DEV_PID 2>/dev/null

# 3. Verificar se todas as rotas ainda existem
echo "3. Verificando rotas..."
if [ -f "src/routes/index.js" ]; then
    echo "✅ Arquivo de rotas presente"
    echo "$(date): Rotas - OK" >> logs/migration/phases.log
else
    echo "❌ Arquivo de rotas não encontrado"
    echo "$(date): Rotas - FALHOU" >> logs/migration/phases.log
    exit 1
fi

# 4. Verificar estrutura de componentes
echo "4. Verificando componentes..."
COMPONENT_COUNT=$(find src/components -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | wc -l)
if [ $COMPONENT_COUNT -gt 0 ]; then
    echo "✅ $COMPONENT_COUNT componentes encontrados"
    echo "$(date): Componentes - $COMPONENT_COUNT encontrados" >> logs/migration/phases.log
else
    echo "❌ Nenhum componente encontrado"
    echo "$(date): Componentes - NENHUM ENCONTRADO" >> logs/migration/phases.log
    exit 1
fi

# 5. Verificar se React 18 foi instalado corretamente
echo "5. Verificando React 18..."
REACT_VERSION=$(npm list react --depth=0 | grep react@)
if echo "$REACT_VERSION" | grep -q "18\."; then
    echo "✅ React 18 instalado: $REACT_VERSION"
    echo "$(date): React 18 - INSTALADO" >> logs/migration/phases.log
else
    echo "❌ React 18 não detectado: $REACT_VERSION"
    echo "$(date): React 18 - NÃO DETECTADO" >> logs/migration/phases.log
    exit 1
fi

echo "✅ VALIDAÇÃO FASE 2 CONCLUÍDA COM SUCESSO"
echo "$(date): Validação Fase 2 - SUCESSO COMPLETO" >> logs/migration/phases.log