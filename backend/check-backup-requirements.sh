#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 VERIFICAÇÃO DE REQUISITOS PARA BACKUP${NC}"
echo "=========================================="
echo ""

# Verificar se pg_dump está instalado
if command -v pg_dump &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL client está instalado${NC}"
    echo -e "   Versão: $(pg_dump --version)"
else
    echo -e "${RED}❌ PostgreSQL client NÃO está instalado${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para instalar:${NC}"
    echo "   sudo apt update"
    echo "   sudo apt install -y postgresql-client"
    echo ""
    
    read -p "Deseja instalar agora? (s/n): " install_now
    if [ "$install_now" = "s" ] || [ "$install_now" = "S" ]; then
        echo ""
        echo -e "${BLUE}Instalando PostgreSQL client...${NC}"
        apt update && apt install -y postgresql-client
        
        if command -v pg_dump &> /dev/null; then
            echo -e "${GREEN}✅ PostgreSQL client instalado com sucesso!${NC}"
        else
            echo -e "${RED}❌ Falha na instalação${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️ Backup não funcionará sem PostgreSQL client${NC}"
        exit 1
    fi
fi

echo ""

# Verificar configurações no .env
echo -e "${BLUE}🔍 Verificando configurações do banco...${NC}"

cd "$(dirname "$0")"

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
    
    # Verificar variáveis necessárias
    missing_vars=()
    
    if ! grep -q "^DB_HOST=" .env; then missing_vars+=("DB_HOST"); fi
    if ! grep -q "^DB_PORT=" .env; then missing_vars+=("DB_PORT"); fi
    if ! grep -q "^DB_USER=" .env; then missing_vars+=("DB_USER"); fi
    if ! grep -q "^DB_PASS=" .env; then missing_vars+=("DB_PASS"); fi
    if ! grep -q "^DB_NAME=" .env; then missing_vars+=("DB_NAME"); fi
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ Todas as variáveis de banco estão configuradas${NC}"
        
        # Mostrar configurações
        echo ""
        echo -e "${BLUE}📋 Configurações atuais:${NC}"
        echo "   Host: $(grep "^DB_HOST=" .env | cut -d'=' -f2)"
        echo "   Port: $(grep "^DB_PORT=" .env | cut -d'=' -f2)"
        echo "   User: $(grep "^DB_USER=" .env | cut -d'=' -f2)"
        echo "   Database: $(grep "^DB_NAME=" .env | cut -d'=' -f2)"
        
    else
        echo -e "${RED}❌ Variáveis faltando no .env:${NC}"
        for var in "${missing_vars[@]}"; do
            echo "   - $var"
        done
        exit 1
    fi
else
    echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
    exit 1
fi

echo ""

# Testar conexão
echo -e "${BLUE}🔌 Testando conexão com o banco...${NC}"

if node monitoring/services/database-backup.js test 2>/dev/null; then
    echo -e "${GREEN}✅ Conexão com banco OK!${NC}"
else
    echo -e "${RED}❌ Erro na conexão com banco${NC}"
    echo ""
    echo -e "${YELLOW}💡 Possíveis problemas:${NC}"
    echo "   • PostgreSQL não está rodando"
    echo "   • Credenciais incorretas"
    echo "   • Porta ou host incorretos"
    echo "   • Firewall bloqueando conexão"
    echo ""
    echo -e "${BLUE}Para testar manualmente:${NC}"
    echo "   node monitoring/services/database-backup.js test"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Todos os requisitos estão OK!${NC}"
echo -e "${BLUE}Agora você pode fazer backups pelo painel${NC}" 