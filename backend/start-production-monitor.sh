#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 INICIADOR DO MONITOR AUTOMÁTICO DE PRODUÇÃO${NC}"
echo "=============================================="
echo ""

# Verificar se já está rodando
if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
    echo -e "${YELLOW}⚠️ Monitor já está rodando!${NC}"
    echo -e "PID: ${GREEN}$(pgrep -f "monitor-race-conditions-prod.js")${NC}"
    echo ""
    read -p "Deseja parar o monitor atual? (s/n): " stop_current
    
    if [ "$stop_current" = "s" ] || [ "$stop_current" = "S" ]; then
        echo -e "${BLUE}Parando monitor atual...${NC}"
        kill $(pgrep -f "monitor-race-conditions-prod.js") 2>/dev/null
        sleep 2
        echo -e "${GREEN}✅ Monitor parado!${NC}"
    else
        echo "Operação cancelada."
        exit 0
    fi
fi

# Garantir que estamos no diretório correto
cd "$(dirname "$0")"

# Criar diretório de logs
mkdir -p logs

echo -e "${BLUE}Iniciando monitor automático...${NC}"
echo ""

# Iniciar monitor em background independente
setsid nohup node monitoring/services/monitor-race-conditions-prod.js > logs/monitor-production.log 2>&1 &
disown

# Aguardar inicialização
sleep 3

# Verificar se iniciou
if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
    echo -e "${GREEN}✅ Monitor iniciado com sucesso!${NC}"
    echo ""
    echo -e "PID: ${GREEN}$(pgrep -f "monitor-race-conditions-prod.js")${NC}"
    echo "Logs: logs/monitor-production.log"
    echo ""
    echo -e "${YELLOW}💡 O monitor agora roda independente e enviará alertas automáticos${NC}"
    echo "Para parar: kill $(pgrep -f "monitor-race-conditions-prod.js")"
else
    echo -e "${RED}❌ Falha ao iniciar monitor!${NC}"
    echo ""
    echo "Verifique os logs em: logs/monitor-production.log"
    exit 1
fi

echo ""
echo "Monitor ativo! 🎉" 