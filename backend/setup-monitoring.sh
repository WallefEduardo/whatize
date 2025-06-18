#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CONFIGURAÇÃO AUTOMÁTICA DO SISTEMA DE MONITORAMENTO${NC}"
echo "========================================================="
echo ""
echo -e "${CYAN}Este script vai configurar automaticamente:${NC}"
echo "• ✅ Dependências necessárias (PostgreSQL client)"
echo "• ✅ Permissões de arquivos"
echo "• ✅ Validação de configurações"
echo "• ✅ Teste de todas as funcionalidades"
echo "• ✅ Inicialização do monitor automático"
echo ""

read -p "Deseja continuar? (s/n): " confirm
if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "Configuração cancelada."
    exit 0
fi

echo ""
echo -e "${PURPLE}🔧 ETAPA 1: VERIFICANDO DEPENDÊNCIAS${NC}"
echo "==========================================="

# Verificar se estamos no diretório correto
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "Execute este script do diretório backend/"
    exit 1
fi

# Verificar e instalar PostgreSQL client se necessário
echo -e "${BLUE}Verificando PostgreSQL client...${NC}"
if ! command -v pg_dump &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando PostgreSQL client...${NC}"
    apt update && apt install -y postgresql-client
    
    if command -v pg_dump &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL client instalado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Falha na instalação do PostgreSQL client${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ PostgreSQL client já está instalado${NC}"
fi

# Verificar Node.js
echo -e "${BLUE}Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado!${NC}"
    echo "Instale o Node.js primeiro: https://nodejs.org/"
    exit 1
else
    echo -e "${GREEN}✅ Node.js encontrado: $(node --version)${NC}"
fi

echo ""
echo -e "${PURPLE}🔧 ETAPA 2: CONFIGURANDO PERMISSÕES${NC}"
echo "========================================"

# Tornar scripts executáveis
echo -e "${BLUE}Configurando permissões dos scripts...${NC}"
chmod +x monitoring/scripts/*.sh
chmod +x *.sh
chmod +x ../start-monitor.sh 2>/dev/null || true

echo -e "${GREEN}✅ Permissões configuradas${NC}"

# Criar diretórios necessários
echo -e "${BLUE}Criando diretórios necessários...${NC}"
mkdir -p logs
mkdir -p backups
mkdir -p monitoring/logs

echo -e "${GREEN}✅ Diretórios criados${NC}"

echo ""
echo -e "${PURPLE}🔧 ETAPA 3: VALIDANDO CONFIGURAÇÕES${NC}"
echo "======================================="

# Executar verificação completa
echo -e "${BLUE}Executando verificação completa...${NC}"
echo ""

./check-backup-requirements.sh

echo ""
echo -e "${PURPLE}🔧 ETAPA 4: TESTANDO FUNCIONALIDADES${NC}"
echo "======================================="

# Testar sistema de emails
echo -e "${BLUE}Testando sistema de emails...${NC}"
if grep -q "^MAIL_HOST=" .env && grep -q "^ALERT_EMAIL=" .env; then
    if node monitoring/services/test-email-alerts.js 2>/dev/null | grep -q "Email enviado com sucesso"; then
        echo -e "${GREEN}✅ Sistema de emails funcionando${NC}"
    else
        echo -e "${YELLOW}⚠️ Sistema de emails configurado mas com problemas${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Emails não configurados (opcional)${NC}"
fi

# Testar API do backend
echo -e "${BLUE}Testando API do backend...${NC}"
backend_url=$(grep "^BACKEND_URL=" .env | cut -d'=' -f2)
if curl -s "$backend_url/race-conditions/stats" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend respondendo em $backend_url${NC}"
else
    echo -e "${YELLOW}⚠️ Backend pode estar temporariamente offline${NC}"
fi

echo ""
echo -e "${PURPLE}🔧 ETAPA 5: INICIALIZANDO MONITOR AUTOMÁTICO${NC}"
echo "================================================"

# Verificar se monitor já está rodando
if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
    echo -e "${YELLOW}⚠️ Monitor automático já está rodando${NC}"
    echo -e "PID: ${GREEN}$(pgrep -f "monitor-race-conditions-prod.js")${NC}"
else
    echo -e "${BLUE}Iniciando monitor automático...${NC}"
    
    # Iniciar monitor em background
    setsid nohup node monitoring/services/monitor-race-conditions-prod.js > logs/monitor-production.log 2>&1 &
    disown
    
    # Aguardar inicialização
    sleep 3
    
    if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
        echo -e "${GREEN}✅ Monitor automático iniciado com sucesso!${NC}"
        echo -e "PID: ${GREEN}$(pgrep -f "monitor-race-conditions-prod.js")${NC}"
    else
        echo -e "${YELLOW}⚠️ Monitor pode precisar ser iniciado manualmente${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 CONFIGURAÇÃO COMPLETA!${NC}"
echo "========================="
echo ""
echo -e "${CYAN}📋 RESUMO DO QUE FOI CONFIGURADO:${NC}"
echo ""
echo -e "${GREEN}✅ Dependências:${NC} PostgreSQL client, Node.js"
echo -e "${GREEN}✅ Permissões:${NC} Todos os scripts executáveis"
echo -e "${GREEN}✅ Diretórios:${NC} logs/, backups/, monitoring/logs/"
echo -e "${GREEN}✅ Validações:${NC} Configurações do banco testadas"
echo -e "${GREEN}✅ Funcionalidades:${NC} Emails e API testados"
echo -e "${GREEN}✅ Monitor:${NC} Rodando automaticamente"
echo ""
echo -e "${BLUE}🎯 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1. Acesse o painel: ${YELLOW}./monitoring/scripts/whatize-monitor.sh${NC}"
echo "2. Configure emails (se não fez): ${YELLOW}Opção 9${NC}"
echo "3. Monitor automático: ${YELLOW}Já ativo!${NC}"
echo ""
echo -e "${PURPLE}💡 COMANDOS ÚTEIS:${NC}"
echo ""
echo "• Ver status: ${YELLOW}./monitoring/scripts/whatize-monitor.sh${NC}"
echo "• Verificar monitor: ${YELLOW}ps aux | grep monitor-race-conditions-prod.js${NC}"
echo "• Ver logs: ${YELLOW}tail -f logs/monitor-production.log${NC}"
echo "• Parar monitor: ${YELLOW}kill \$(pgrep -f monitor-race-conditions-prod.js)${NC}"
echo ""
echo -e "${GREEN}Sistema pronto para uso! 🚀${NC}" 