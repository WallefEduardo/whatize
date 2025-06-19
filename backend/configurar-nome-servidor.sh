#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏷️  CONFIGURADOR DE NOME DO SERVIDOR${NC}"
echo "=================================="
echo ""

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    exit 1
fi

# Mostrar nome atual
current_name=$(grep "^SERVER_NAME=" .env 2>/dev/null | cut -d'=' -f2)
if [ -z "$current_name" ]; then
    current_name="TalkZap Server (padrão)"
fi

echo -e "${CYAN}📋 Nome atual do servidor:${NC} $current_name"
echo ""

echo -e "${YELLOW}💡 Exemplos de nomes personalizados:${NC}"
echo "• TalkZap Produção - Empresa ABC"
echo "• ZMaxSys - Servidor Principal"
echo "• TalkZap Dev - Ambiente Teste"
echo "• WhatsApp Server - Filial SP"
echo ""

read -p "🖊️  Digite o novo nome do servidor: " new_name

if [ -z "$new_name" ]; then
    echo -e "${RED}❌ Nome não pode estar vazio!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔄 Configurando novo nome...${NC}"

# Verificar se já existe a linha SERVER_NAME
if grep -q "^SERVER_NAME=" .env; then
    # Substituir linha existente
    sed -i "s/^SERVER_NAME=.*/SERVER_NAME=$new_name/" .env
    echo -e "${GREEN}✅ Nome atualizado com sucesso!${NC}"
else
    # Adicionar nova linha
    echo "SERVER_NAME=$new_name" >> .env
    echo -e "${GREEN}✅ Nome configurado com sucesso!${NC}"
fi

echo ""
echo -e "${CYAN}📧 Novo nome nos alertas:${NC} $new_name"
echo ""

# Perguntar se quer reiniciar o monitor
echo -e "${YELLOW}🔄 Para aplicar as mudanças, é necessário reiniciar o monitor.${NC}"
read -p "Deseja reiniciar o monitor agora? (s/n): " restart_monitor

if [ "$restart_monitor" = "s" ] || [ "$restart_monitor" = "S" ]; then
    echo ""
    echo -e "${BLUE}🔄 Reiniciando monitor...${NC}"
    
    # Parar monitor atual
    if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
        kill $(pgrep -f "monitor-race-conditions-prod.js") 2>/dev/null
        sleep 2
        echo -e "${YELLOW}🛑 Monitor anterior parado${NC}"
    fi
    
    # Iniciar novo monitor
    setsid nohup node monitoring/services/monitor-race-conditions-prod.js > logs/monitor-production.log 2>&1 &
    disown
    
    sleep 3
    
    if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
        echo -e "${GREEN}✅ Monitor reiniciado com sucesso!${NC}"
        echo -e "PID: ${GREEN}$(pgrep -f "monitor-race-conditions-prod.js")${NC}"
    else
        echo -e "${RED}❌ Erro ao reiniciar monitor${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Lembre-se de reiniciar o monitor depois!${NC}"
    echo -e "Comando: ${CYAN}./restart-monitor-with-optimized-alerts.sh${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Configuração concluída!${NC}"
echo ""
echo -e "${BLUE}💡 Próximos alertas aparecerão como:${NC}"
echo -e "   📧 Assunto: 🚨 ALERTA: [TIPO] - $new_name" 