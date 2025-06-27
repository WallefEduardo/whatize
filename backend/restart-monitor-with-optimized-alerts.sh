#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 REINICIANDO MONITOR COM ALERTAS OTIMIZADOS${NC}"
echo "============================================="
echo ""

# Parar monitor atual se estiver rodando
if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
    echo -e "${YELLOW}🛑 Parando monitor atual...${NC}"
    kill $(pgrep -f "monitor-race-conditions-prod.js") 2>/dev/null
    sleep 3
    echo -e "${GREEN}✅ Monitor parado!${NC}"
else
    echo -e "${BLUE}ℹ️  Nenhum monitor rodando${NC}"
fi

echo ""
echo -e "${BLUE}🔧 CONFIGURAÇÕES OTIMIZADAS:${NC}"
echo "• ⏰ Cooldown entre alertas: 30 minutos"
echo "• 🚨 Race conditions: alerta só com +10 erros (era 5)"
echo "• 💾 Cache baixo: alerta só com <5% E +50 operações"
echo "• 🖥️ Memória alta: alerta só com +750MB (era 500MB)"
echo ""

# Garantir que estamos no diretório correto
cd "$(dirname "$0")"

# Criar diretório de logs
mkdir -p logs

echo -e "${BLUE}🚀 Iniciando monitor otimizado...${NC}"
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
    echo -e "${YELLOW}💡 Agora você receberá MUITO MENOS emails!${NC}"
    echo -e "${YELLOW}   Apenas alertas realmente importantes.${NC}"
    echo ""
    echo -e "${BLUE}📧 Tipos de alertas que ainda serão enviados:${NC}"
    echo "• 🚨 Race conditions: apenas com +10 erros/dia"
    echo "• 💾 Cache baixo: apenas se <5% E muitas operações"
    echo "• 🖥️ Memória alta: apenas se +750MB"
    echo "• 🔴 Backend offline: sempre (crítico)"
else
    echo -e "${RED}❌ Falha ao iniciar monitor!${NC}"
    echo ""
    echo "Verifique os logs em: logs/monitor-production.log"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Monitor otimizado ativo!${NC}"
echo ""
echo -e "${BLUE}💡 DICAS:${NC}"
echo "• Para ver logs em tempo real: tail -f logs/monitor-production.log"
echo "• Para parar o monitor: kill $(pgrep -f "monitor-race-conditions-prod.js")"
echo "• Os alertas agora têm cooldown de 30 minutos entre envios" 