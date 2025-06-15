#!/bin/bash

# Script para gerenciar o ambiente de desenvolvimento Docker do Whatize
# Uso: ./docker-dev.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir ajuda
show_help() {
    echo -e "${BLUE}=== Whatize Docker Development Manager ===${NC}"
    echo ""
    echo "Comandos disponíveis:"
    echo -e "  ${GREEN}start${NC}     - Iniciar containers (PostgreSQL + Redis)"
    echo -e "  ${GREEN}stop${NC}      - Parar containers"
    echo -e "  ${GREEN}restart${NC}   - Reiniciar containers"
    echo -e "  ${GREEN}status${NC}    - Ver status dos containers"
    echo -e "  ${GREEN}logs${NC}      - Ver logs dos containers"
    echo -e "  ${GREEN}clean${NC}     - Parar e remover containers + volumes"
    echo -e "  ${GREEN}reset${NC}     - Reset completo (clean + rebuild)"
    echo -e "  ${GREEN}db${NC}        - Conectar ao PostgreSQL"
    echo -e "  ${GREEN}redis${NC}     - Conectar ao Redis"
    echo -e "  ${GREEN}migrate${NC}   - Executar migrations do backend"
    echo -e "  ${GREEN}help${NC}      - Exibir esta ajuda"
    echo ""
}

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker não está rodando. Por favor, inicie o Docker primeiro.${NC}"
        exit 1
    fi
}

# Função para verificar se os containers estão rodando
check_containers() {
    if ! docker-compose ps | grep -q "Up"; then
        echo -e "${YELLOW}⚠️  Containers não estão rodando. Execute './docker-dev.sh start' primeiro.${NC}"
        return 1
    fi
    return 0
}

# Iniciar containers
start_containers() {
    echo -e "${BLUE}🚀 Iniciando containers do Whatize...${NC}"
    docker-compose up -d
    
    echo -e "${YELLOW}⏳ Aguardando containers ficarem prontos...${NC}"
    sleep 5
    
    # Verificar se os containers estão saudáveis
    echo -e "${BLUE}📊 Verificando status dos containers...${NC}"
    docker-compose ps
    
    echo ""
    echo -e "${GREEN}✅ Containers iniciados com sucesso!${NC}"
    echo -e "${BLUE}📝 Informações de conexão:${NC}"
    echo -e "  PostgreSQL: ${GREEN}localhost:55433${NC}"
    echo -e "  Redis: ${GREEN}localhost:56380${NC}"
    echo -e "  Usuário DB: ${GREEN}whatize${NC}"
    echo -e "  Banco: ${GREEN}whatize${NC}"
}

# Parar containers
stop_containers() {
    echo -e "${YELLOW}🛑 Parando containers...${NC}"
    docker-compose stop
    echo -e "${GREEN}✅ Containers parados.${NC}"
}

# Reiniciar containers
restart_containers() {
    echo -e "${BLUE}🔄 Reiniciando containers...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Containers reiniciados.${NC}"
}

# Ver status
show_status() {
    echo -e "${BLUE}📊 Status dos containers:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}💾 Uso de volumes:${NC}"
    docker volume ls | grep whatize
}

# Ver logs
show_logs() {
    echo -e "${BLUE}📋 Logs dos containers:${NC}"
    docker-compose logs -f --tail=50
}

# Limpeza completa
clean_all() {
    echo -e "${YELLOW}🧹 Limpando containers e volumes...${NC}"
    read -p "Tem certeza? Isso irá remover TODOS os dados! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        docker volume prune -f
        echo -e "${GREEN}✅ Limpeza concluída.${NC}"
    else
        echo -e "${BLUE}ℹ️  Operação cancelada.${NC}"
    fi
}

# Reset completo
reset_all() {
    echo -e "${YELLOW}🔄 Reset completo do ambiente...${NC}"
    clean_all
    echo -e "${BLUE}🏗️  Reconstruindo containers...${NC}"
    docker-compose build --no-cache
    start_containers
}

# Conectar ao PostgreSQL
connect_db() {
    if check_containers; then
        echo -e "${BLUE}🐘 Conectando ao PostgreSQL...${NC}"
        docker exec -it whatizeDev_db psql -U whatize -d whatize
    fi
}

# Conectar ao Redis
connect_redis() {
    if check_containers; then
        echo -e "${BLUE}🔴 Conectando ao Redis...${NC}"
        echo -e "${YELLOW}Senha: ZdG387FShYsm0SaaSoRlSAAsme09a754s1DHMSsIdS=${NC}"
        docker exec -it whatizeDev_redis redis-cli -a ZdG387FShYsm0SaaSoRlSAAsme09a754s1DHMSsIdS=
    fi
}

# Executar migrations
run_migrations() {
    if check_containers; then
        echo -e "${BLUE}🗃️  Executando migrations...${NC}"
        cd backend
        npm run db:migrate
        cd ..
        echo -e "${GREEN}✅ Migrations executadas.${NC}"
    fi
}

# Verificar Docker
check_docker

# Processar comando
case "${1:-help}" in
    start)
        start_containers
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_all
        ;;
    reset)
        reset_all
        ;;
    db)
        connect_db
        ;;
    redis)
        connect_redis
        ;;
    migrate)
        run_migrations
        ;;
    help|*)
        show_help
        ;;
esac 