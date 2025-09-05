#!/bin/bash

# Script de Deploy - Correção de Race Conditions Baileys v6.7.16 (DESENVOLVIMENTO)
# Autor: Claude AI Assistant
# Data: Janeiro 2024

set -e  # Para em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "=================================================="
echo "🔧 DEPLOY DEV - CORREÇÃO RACE CONDITIONS BAILEYS"
echo "=================================================="
echo -e "${NC}"

# Verificações iniciais
log "Iniciando verificações pré-deploy para desenvolvimento..."

# Verifica se está no diretório correto
if [ ! -f "backend/package.json" ]; then
    error "Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Verifica se Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verifica se npm está instalado
if ! command -v npm &> /dev/null; then
    error "npm não encontrado. Instale o npm primeiro."
    exit 1
fi

# Verifica se o backend está rodando
BACKEND_PID=$(lsof -ti:8080 2>/dev/null || echo "")
if [ ! -z "$BACKEND_PID" ]; then
    warn "Backend está rodando na porta 8080 (PID: $BACKEND_PID)"
    info "Parando o processo atual..."
    kill $BACKEND_PID 2>/dev/null || true
    sleep 3
fi

# Backup dos arquivos originais
log "Criando backup dos arquivos originais..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Lista de arquivos que serão modificados
MODIFIED_FILES=(
    "backend/src/services/ContactServices/CreateOrUpdateContactService.ts"
    "backend/src/services/WbotServices/wbotMessageListener.ts"
    "backend/src/routes/index.ts"
)

for file in "${MODIFIED_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        log "Backup criado: $file"
    fi
done

# Instala dependências
log "Instalando dependências..."
cd backend
npm install async-mutex
if [ $? -eq 0 ]; then
    log "Dependência async-mutex instalada com sucesso"
else
    error "Falha ao instalar async-mutex"
    exit 1
fi
cd ..

# Verifica se os arquivos novos existem
log "Verificando arquivos implementados..."
NEW_FILES=(
    "backend/src/utils/raceConditionLogger.ts"
    "backend/src/libs/contactCache.ts"
    "backend/src/controllers/RaceConditionController.ts"
    "backend/src/routes/raceConditionRoutes.ts"
)

for file in "${NEW_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "✅ Arquivo encontrado: $file"
    else
        error "❌ Arquivo não encontrado: $file"
        echo "Execute primeiro a implementação completa dos arquivos"
        exit 1
    fi
done

# Verifica sintaxe TypeScript
log "Verificando sintaxe TypeScript..."
cd backend
if npm run build --silent; then
    log "✅ Sintaxe TypeScript válida"
else
    error "❌ Erros de sintaxe TypeScript encontrados"
    echo "Corrija os erros antes de continuar"
    exit 1
fi
cd ..

# Cria diretório de logs se não existir
log "Criando diretório de logs..."
mkdir -p backend/logs
chmod 755 backend/logs

# Cria scripts de teste adaptados para desenvolvimento
log "Criando scripts de teste para desenvolvimento..."

# Script de teste adaptado
cat > "test-race-conditions-dev.js" << 'EOF'
const axios = require('axios');

// Configuração do teste para desenvolvimento
const BASE_URL = 'http://localhost:8080';
const COMPANY_ID = 1;

// Função para verificar se o backend está rodando
async function checkBackend() {
  try {
    await axios.get(`${BASE_URL}/race-conditions/stats`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Função para verificar estatísticas
async function checkStats() {
  try {
    console.log('\n📊 Verificando estatísticas do sistema...');
    
    const response = await axios.get(`${BASE_URL}/race-conditions/stats`);
    const stats = response.data;
    
    console.log('📈 Estatísticas de Race Conditions:');
    console.log(`   - Total de erros: ${stats.raceConditions.totalErrors}`);
    console.log(`   - Erros hoje: ${stats.raceConditions.todayErrors}`);
    console.log(`   - Último erro: ${stats.raceConditions.lastError || 'Nenhum'}`);
    
    console.log('\n💾 Estatísticas do Cache:');
    console.log(`   - Chaves em cache: ${stats.contactCache.keys}`);
    console.log(`   - Taxa de acerto: ${stats.contactCache.hitRate}`);
    console.log(`   - Hits: ${stats.contactCache.hits}`);
    console.log(`   - Misses: ${stats.contactCache.misses}`);
    
    console.log('\n🖥️ Sistema:');
    console.log(`   - Uptime: ${Math.floor(stats.system.uptime / 60)} minutos`);
    console.log(`   - Memória heap: ${stats.system.memoryUsage.heapUsed}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao verificar estatísticas:', error.message);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🔧 TESTE DE RACE CONDITIONS - DESENVOLVIMENTO');
  console.log('==============================================\n');
  
  // Verifica se o backend está rodando
  const isRunning = await checkBackend();
  if (!isRunning) {
    console.error('❌ Backend não está rodando!');
    console.log('💡 Para iniciar o backend:');
    console.log('   cd backend && npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Backend está rodando!');
  
  // Verifica estatísticas
  await checkStats();
  
  console.log('\n🎉 Teste concluído!');
  console.log('\n💡 Para monitoramento contínuo:');
  console.log('   - Logs: tail -f backend/logs/race_conditions.log');
  console.log('   - Stats: curl http://localhost:8080/race-conditions/stats');
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro:', error.message);
    process.exit(1);
  });
}
EOF

chmod +x test-race-conditions-dev.js

# Resumo final
echo -e "${GREEN}"
echo "=================================================="
echo "✅ DEPLOY DEV CONCLUÍDO COM SUCESSO!"
echo "=================================================="
echo -e "${NC}"

echo "📋 RESUMO:"
echo "• Backup criado em: $BACKUP_DIR"
echo "• Dependência async-mutex instalada"
echo "• Arquivos verificados e validados"
echo "• Scripts de teste criados"
echo ""

echo "🚀 PRÓXIMOS PASSOS:"
echo "1. Iniciar backend: cd backend && npm run dev"
echo "2. Em outro terminal, testar: node test-race-conditions-dev.js"
echo "3. Verificar logs: tail -f backend/logs/race_conditions.log"
echo "4. Testar API: curl http://localhost:8080/race-conditions/stats"
echo ""

echo "📊 MONITORAMENTO:"
echo "• Logs de race conditions: backend/logs/race_conditions.log"
echo "• Estatísticas: GET /race-conditions/stats"
echo "• Documentação: docsBaileys/RACE_CONDITIONS_README.md"
echo ""

echo "🔄 ROLLBACK (se necessário):"
echo "• Restaurar backup: cp $BACKUP_DIR/* backend/src/..."
echo "• Remover dependência: cd backend && npm uninstall async-mutex"
echo ""

log "Deploy para desenvolvimento finalizado!"

# Salva informações do deploy
cat > "deploy-dev-info-$(date +%Y%m%d-%H%M%S).txt" << EOF
Deploy Race Conditions Fix - DESENVOLVIMENTO
============================================
Data: $(date)
Backup: $BACKUP_DIR
Status: Sucesso
Versão: 1.0.0

Arquivos Modificados:
$(printf '%s\n' "${MODIFIED_FILES[@]}")

Arquivos Novos:
$(printf '%s\n' "${NEW_FILES[@]}")

Comandos para Desenvolvimento:
- Iniciar backend: cd backend && npm run dev
- Testar sistema: node test-race-conditions-dev.js
- Ver logs: tail -f backend/logs/race_conditions.log
- Estatísticas: curl http://localhost:8080/race-conditions/stats
EOF

log "Informações do deploy salvas em deploy-dev-info-*.txt"

echo ""
echo "🎯 AGORA EXECUTE:"
echo "   cd backend && npm run dev"
echo ""
echo "Em outro terminal:"
echo "   node test-race-conditions-dev.js" 