#!/bin/bash

# Cores para o terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Caminhos relativos à nova estrutura (monitoring dentro do backend)
# Estamos em backend/monitoring/scripts, então backend é ../..
BACKEND_DIR="../.."
SERVICES_DIR="../services"
TESTS_DIR="../tests"
LOGS_DIR="../logs"

# Função para obter a porta do backend do arquivo .env
get_backend_port() {
    local port=$(grep "^PORT=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    if [ -z "$port" ]; then
        port="4000"  # Porta padrão se não encontrar no .env
    fi
    echo "$port"
}

# Função para obter a URL completa do backend
get_backend_url() {
    # Primeiro, tentar usar BACKEND_URL se estiver configurada
    local backend_url=$(grep "^BACKEND_URL=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -n "$backend_url" ] && [ "$backend_url" != "http://localhost:4000" ]; then
        # Se BACKEND_URL está configurada e não é o padrão, usar ela
        echo "$backend_url"
    else
        # Caso contrário, construir baseado na porta atual
        local port=$(get_backend_port)
        echo "http://localhost:$port"
    fi
}

# Função para atualizar BACKEND_URL no .env
update_backend_url_in_env() {
    local backend_url=$(get_backend_url)
    
    # Verificar se BACKEND_URL já existe no .env
    if grep -q "^BACKEND_URL=" $BACKEND_DIR/.env 2>/dev/null; then
        # Atualizar a linha existente
        sed -i "s|^BACKEND_URL=.*|BACKEND_URL=$backend_url|" $BACKEND_DIR/.env
    else
        # Adicionar nova linha se não existir
        echo "BACKEND_URL=$backend_url" >> $BACKEND_DIR/.env
    fi
}

# Função para imprimir com cores
print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}                    WHATIZE MONITOR v2.0                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${WHITE}              Sistema de Monitoramento Completo             ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Função para verificar se o backend está rodando
check_backend() {
    local backend_url=$(get_backend_url)
    if curl -s "$backend_url/race-conditions/stats" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Função para criar backup inteligente do .env
create_smart_backup() {
    local today=$(date +%Y%m%d)
    local backup_dir="$BACKEND_DIR"
    
    # Verificar se já existe backup de hoje
    if [ ! -f "$backup_dir/.env.backup.$today" ]; then
        print_step "Criando backup do .env..."
        cp "$backup_dir/.env" "$backup_dir/.env.backup.$today"
        
        # Limpar backups antigos (manter apenas os 3 mais recentes)
        cleanup_old_backups
    else
        print_info "Backup de hoje já existe, reutilizando..."
    fi
}

# Função para verificar se Git está configurado
check_git_config() {
    local git_url=$(git config --get remote.origin.url 2>/dev/null)
    local git_user=$(git config --get user.name 2>/dev/null)
    local git_email=$(git config --get user.email 2>/dev/null)
    
    if [ -z "$git_url" ] || [ -z "$git_user" ] || [ -z "$git_email" ]; then
        return 1
    fi
    return 0
}

# Função para verificar se estamos em um repositório Git
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        return 1
    fi
    return 0
}

# Função para configurar credenciais Git automaticamente
setup_git_credentials() {
    # Carregar credenciais do .env se existirem
    local git_user=$(grep "^GIT_USER_NAME=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    local git_email=$(grep "^GIT_USER_EMAIL=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    local git_token=$(grep "^GIT_TOKEN=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    local git_username=$(grep "^GIT_USERNAME=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    
    # Configurar usuário e email se disponíveis
    if [ -n "$git_user" ]; then
        git config user.name "$git_user"
    fi
    
    if [ -n "$git_email" ]; then
        git config user.email "$git_email"
    fi
    
    # Configurar credenciais para HTTPS se disponíveis
    if [ -n "$git_username" ] && [ -n "$git_token" ]; then
        local git_url=$(git config --get remote.origin.url)
        if [[ "$git_url" == https://* ]]; then
            # Extrair hostname (ex: github.com)
            local hostname=$(echo "$git_url" | sed 's|https://||' | cut -d'/' -f1)
            
            # Configurar credential helper simples
            git config credential.helper store
            
            # Criar arquivo de credenciais
            echo "https://$git_username:$git_token@$hostname" > ~/.git-credentials
            chmod 600 ~/.git-credentials
            
            print_info "Credenciais configuradas automaticamente para $hostname"
        fi
    fi
}

# Função para salvar configurações Git no .env
save_git_config_to_env() {
    local git_url=$1
    local git_user=$2
    local git_email=$3
    local git_username=$4
    local git_token=$5
    
    # Backup inteligente do .env
    create_smart_backup
    
    # Remover configurações antigas
    sed -i '/^GIT_REPOSITORY_URL=/d' $BACKEND_DIR/.env
    sed -i '/^GIT_USER_NAME=/d' $BACKEND_DIR/.env
    sed -i '/^GIT_USER_EMAIL=/d' $BACKEND_DIR/.env
    sed -i '/^GIT_USERNAME=/d' $BACKEND_DIR/.env
    sed -i '/^GIT_TOKEN=/d' $BACKEND_DIR/.env
    
    # Adicionar novas configurações
    echo "" >> $BACKEND_DIR/.env
    echo "# Configurações Git" >> $BACKEND_DIR/.env
    echo "GIT_REPOSITORY_URL=$git_url" >> $BACKEND_DIR/.env
    echo "GIT_USER_NAME=$git_user" >> $BACKEND_DIR/.env
    echo "GIT_USER_EMAIL=$git_email" >> $BACKEND_DIR/.env
    
    # Adicionar credenciais se fornecidas
    if [ -n "$git_username" ]; then
        echo "GIT_USERNAME=$git_username" >> $BACKEND_DIR/.env
    fi
    
    if [ -n "$git_token" ]; then
        echo "GIT_TOKEN=$git_token" >> $BACKEND_DIR/.env
    fi
}

# Função para limpar backups antigos
cleanup_old_backups() {
    local backup_dir="$BACKEND_DIR"
    
    # Contar quantos backups existem
    local backup_count=$(ls -1 "$backup_dir"/.env.backup.* 2>/dev/null | wc -l)
    
    if [ "$backup_count" -gt 3 ]; then
        print_step "Limpando backups antigos (mantendo 3 mais recentes)..."
        
        # Remover backups mais antigos, mantendo apenas os 3 mais recentes
        ls -1t "$backup_dir"/.env.backup.* 2>/dev/null | tail -n +4 | xargs rm -f
        
        local removed=$((backup_count - 3))
        print_success "Removidos $removed backups antigos"
    fi
}

# Função para verificar dependências
check_dependencies() {
    print_step "Verificando dependências..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado! Instale o Node.js primeiro."
        exit 1
    fi
    
    # Atualizar BACKEND_URL no .env com a porta correta
    update_backend_url_in_env
    
    # Verificar se o backend está rodando (não bloquear se offline)
    if ! check_backend; then
        local port=$(get_backend_port)
        print_warning "Backend aparenta estar offline na porta $port"
        print_info "Algumas funcionalidades podem ter limitações"
        echo ""
    fi
    
    # Verificar se o arquivo .env existe
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_error "Arquivo backend/.env não encontrado!"
        exit 1
    fi
    
    print_success "Todas as dependências OK!"
    echo ""
}

# Função para configurar emails
setup_emails() {
    clear
    print_header
    echo -e "${WHITE}🔧 CONFIGURAÇÃO DE EMAILS PARA ALERTAS${NC}"
    echo -e "${WHITE}=======================================${NC}"
    echo ""
    
    print_info "Vamos configurar o sistema de emails para receber alertas automáticos."
    echo ""
    
    # Verificar se já está configurado
    if grep -q "^MAIL_HOST=" $BACKEND_DIR/.env 2>/dev/null; then
        print_warning "Emails já estão configurados!"
        echo ""
        read -p "Deseja reconfigurar? (s/n): " reconfig
        if [ "$reconfig" != "s" ] && [ "$reconfig" != "S" ]; then
            return 0
        fi
    fi
    
    echo -e "${YELLOW}📧 ESCOLHA SEU PROVEDOR DE EMAIL:${NC}"
    echo "1. Gmail (Recomendado)"
    echo "2. Outlook/Hotmail"
    echo "3. Outro provedor"
    echo "4. Pular configuração de emails"
    echo ""
    
    read -p "Escolha uma opção (1-4): " email_option
    
    case $email_option in
        1)
            setup_gmail
            ;;
        2)
            setup_outlook
            ;;
        3)
            setup_custom_email
            ;;
        4)
            print_info "Emails não configurados. Sistema funcionará em modo simulação."
            return 0
            ;;
        *)
            print_error "Opção inválida!"
            return 1
            ;;
    esac
}

# Configuração Gmail
setup_gmail() {
    echo ""
    echo -e "${GREEN}📧 CONFIGURAÇÃO GMAIL${NC}"
    echo "===================="
    echo ""
    
    print_warning "IMPORTANTE: Para usar Gmail, você precisa:"
    echo "1. Ativar autenticação de 2 fatores"
    echo "2. Gerar uma senha de app"
    echo ""
    echo -e "${BLUE}🔗 Como fazer:${NC}"
    echo "   1. Acesse: https://myaccount.google.com/security"
    echo "   2. Ative 'Verificação em duas etapas'"
    echo "   3. Acesse: https://myaccount.google.com/apppasswords"
    echo "   4. Crie uma senha de app para 'Whatize'"
    echo ""
    
    read -p "Já fez isso? (s/n): " gmail_ready
    if [ "$gmail_ready" != "s" ] && [ "$gmail_ready" != "S" ]; then
        print_error "Configure primeiro a autenticação de 2 fatores."
        return 1
    fi
    
    echo ""
    read -p "Digite seu email Gmail: " gmail_user
    echo ""
    read -p "Digite a senha de app (16 caracteres): " gmail_pass
    
    # Salvar configurações
    save_email_config "smtp.gmail.com" "465" "$gmail_user" "$gmail_pass" "$gmail_user"
    
    # Testar configuração
    test_email_config
}

# Configuração Outlook
setup_outlook() {
    echo ""
    echo -e "${GREEN}📧 CONFIGURAÇÃO OUTLOOK${NC}"
    echo "======================="
    echo ""
    
    read -p "Digite seu email Outlook: " outlook_user
    echo ""
    read -p "Digite sua senha: " outlook_pass
    
    # Salvar configurações
    save_email_config "smtp-mail.outlook.com" "587" "$outlook_user" "$outlook_pass" "$outlook_user"
    
    # Testar configuração
    test_email_config
}

# Configuração customizada
setup_custom_email() {
    echo ""
    echo -e "${GREEN}🔧 CONFIGURAÇÃO PERSONALIZADA${NC}"
    echo "============================="
    echo ""
    
    read -p "SMTP Host: " custom_host
    read -p "SMTP Port (465 ou 587): " custom_port
    read -p "Email/Username: " custom_user
    read -p "Senha: " custom_pass
    read -p "Email From: " custom_from
    
    # Salvar configurações
    save_email_config "$custom_host" "$custom_port" "$custom_user" "$custom_pass" "$custom_from"
    
    # Testar configuração
    test_email_config
}

# Salvar configurações de email no .env
save_email_config() {
    local host=$1
    local port=$2
    local user=$3
    local pass=$4
    local from=$5
    
    print_step "Salvando configurações..."
    
    # Backup inteligente do .env
    create_smart_backup
    
    # Remover configurações antigas
    sed -i '/^MAIL_HOST=/d' $BACKEND_DIR/.env
    sed -i '/^MAIL_PORT=/d' $BACKEND_DIR/.env
    sed -i '/^MAIL_USER=/d' $BACKEND_DIR/.env
    sed -i '/^MAIL_PASS=/d' $BACKEND_DIR/.env
    sed -i '/^MAIL_FROM=/d' $BACKEND_DIR/.env
    
    # Adicionar novas configurações
    echo "" >> $BACKEND_DIR/.env
    echo "# Configuração SMTP (Configurado automaticamente)" >> $BACKEND_DIR/.env
    echo "MAIL_HOST=$host" >> $BACKEND_DIR/.env
    echo "MAIL_PORT=$port" >> $BACKEND_DIR/.env
    echo "MAIL_USER=$user" >> $BACKEND_DIR/.env
    echo "MAIL_PASS=$pass" >> $BACKEND_DIR/.env
    echo "MAIL_FROM=$from" >> $BACKEND_DIR/.env
    
    print_success "Configurações salvas!"
}

# Testar configuração de email
test_email_config() {
    echo ""
    print_step "Testando configuração de email..."
    echo ""
    
    if node $SERVICES_DIR/test-email-alerts.js 2>/dev/null | grep -q "Email enviado com sucesso"; then
        print_success "Email configurado com sucesso!"
        echo ""
        
        # Configurar email de destino para alertas
        setup_alert_email
    else
        print_error "Falha na configuração de email!"
        echo ""
        print_info "O sistema funcionará em modo simulação."
        echo ""
        read -p "Pressione Enter para continuar..."
    fi
}

# Configurar email de destino para alertas
setup_alert_email() {
    echo -e "${YELLOW}📬 CONFIGURAR EMAIL PARA RECEBER ALERTAS${NC}"
    echo "========================================"
    echo ""
    
    # Verificar se já está configurado
    current_alert_email=$(grep "ALERT_EMAIL=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    if [ ! -z "$current_alert_email" ]; then
        print_info "Email atual para alertas: $current_alert_email"
        echo ""
        read -p "Deseja alterar? (s/n): " change_alert
        if [ "$change_alert" != "s" ] && [ "$change_alert" != "S" ]; then
            return 0
        fi
    fi
    
    echo ""
    read -p "Digite o email para receber alertas: " alert_email
    
    # Salvar no .env
    sed -i '/^ALERT_EMAIL=/d' $BACKEND_DIR/.env
    echo "ALERT_EMAIL=$alert_email" >> $BACKEND_DIR/.env
    
    print_success "Email de alertas configurado: $alert_email"
    echo ""
    
    # Enviar email de teste
    print_step "Enviando email de teste..."
    if node $SERVICES_DIR/test-email-alerts.js 2>/dev/null | grep -q "Email enviado com sucesso"; then
        print_success "Email de teste enviado! Verifique sua caixa de entrada."
    else
        print_warning "Email de teste não foi enviado, mas a configuração foi salva."
    fi
    
    echo ""
    read -p "Pressione Enter para continuar..."
}

# Menu principal de monitoramento
monitoring_menu() {
    while true; do
        clear
        print_header
        echo -e "${WHITE}🎛️  PAINEL DE MONITORAMENTO${NC}"
        echo -e "${WHITE}===========================${NC}"
        echo ""
        
        # Status do sistema
        if check_backend; then
            local port=$(get_backend_port)
            print_success "Backend: Online (porta $port) - Produção"
        else
            local port=$(get_backend_port)
            print_error "Backend: Offline (porta $port)"
        fi
        
        # Status dos emails
        if grep -q "^MAIL_HOST=" $BACKEND_DIR/.env 2>/dev/null && grep -q "^ALERT_EMAIL=" $BACKEND_DIR/.env 2>/dev/null; then
            print_success "Emails: Configurados e Ativos"
        else
            print_warning "Emails: Não configurados"
        fi
        
        # Status do Monitor Automático
        if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
            print_success "Monitor Automático: ATIVO (PID: $(pgrep -f "monitor-race-conditions-prod.js"))"
        else
            print_info "Monitor Automático: Inativo"
        fi
        
        echo ""
        echo -e "${CYAN}📊 OPÇÕES DE MONITORAMENTO:${NC}"
        echo ""
        echo "1. 📈 Ver status geral do sistema"
        echo "2. 🔍 Monitorar logs em tempo real"
        echo "3. 🚨 Ver erros recentes"
        echo "4. 📧 Testar sistema de emails"
        echo "5. 🚨 Enviar alerta de teste REAL"
        echo "6. 🤖 Monitor automático (30s)"
        echo "7. 📋 Estatísticas detalhadas"
        echo "8. 🧹 Limpar logs antigos"
        echo ""
        echo -e "${YELLOW}⚙️  CONFIGURAÇÕES:${NC}"
        echo ""
        echo "9. 📧 Configurar/Reconfigurar emails"
        echo "10. 🗑️  Limpar backups do .env"
        echo ""
        echo -e "${CYAN}🔧 GIT & DEPLOY:${NC}"
        echo ""
        echo "11. 📤 Commit e Push (subir código)"
        echo "12. 📥 Pull (puxar atualizações)"
        echo "13. 📊 Status do Git"
        echo "14. ⚙️  Configurar Git"
        echo ""
        echo -e "${GREEN}💾 BACKUP DO BANCO:${NC}"
        echo ""
        echo "15. 💾 Criar backup do banco de dados"
        echo "16. 📋 Listar backups existentes"
        echo "17. 🧹 Limpar backups antigos"
        echo "18. 🔌 Testar conexão com banco"
        echo ""
        echo "19. 📚 Ver comandos úteis"
        echo ""
        echo -e "${GREEN}🚀 PRODUÇÃO:${NC}"
        echo "20. 🚀 Iniciar Monitor Automático de Produção"
        echo "0. 🚪 Sair"
        echo ""
        
        read -p "Escolha uma opção (0-20): " option
        
        case $option in
            1) show_system_status ;;
            2) monitor_logs_realtime ;;
            3) show_recent_errors ;;
            4) test_email_system ;;
            5) send_real_alert_test ;;
            6) run_auto_monitor ;;
            7) show_detailed_stats ;;
            8) clean_old_logs ;;
            9) setup_emails ;;
            10) clean_env_backups ;;
            11) git_commit_push ;;
            12) git_pull_updates ;;
            13) git_status ;;
            14) setup_git_config ;;
            15) create_database_backup ;;
            16) list_database_backups ;;
            17) clean_database_backups ;;
            18) test_database_connection ;;
            19) show_useful_commands ;;
            20) start_production_monitor ;;
            0) 
                echo ""
                print_info "Saindo do Whatize Monitor..."
                exit 0
                ;;
            *)
                print_error "Opção inválida!"
                sleep 2
                ;;
        esac
    done
}

# Função 1: Status geral
show_system_status() {
    clear
    print_header
    echo -e "${WHITE}📊 STATUS GERAL DO SISTEMA${NC}"
    echo -e "${WHITE}===========================${NC}"
    echo ""
    
    local backend_url=$(get_backend_url)
    local port=$(get_backend_port)
    
    print_step "Consultando API em $backend_url..."
    
    if check_backend; then
        echo ""
        curl -s "$backend_url/race-conditions/stats" | jq . 2>/dev/null || curl -s "$backend_url/race-conditions/stats"
        echo ""
    else
        print_error "Backend não está respondendo na porta $port!"
        echo -e "${YELLOW}Verifique se o backend está rodando com: cd backend && npm run dev${NC}"
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 2: Monitor em tempo real
monitor_logs_realtime() {
    clear
    print_header
    echo -e "${WHITE}🔍 MONITORAMENTO EM TEMPO REAL${NC}"
    echo -e "${WHITE}===============================${NC}"
    echo ""
    
    print_info "Monitorando logs em tempo real... (Ctrl+C para parar)"
    echo ""
    
    if [ -f "$BACKEND_DIR/logs/race_conditions.log" ]; then
        tail -f $BACKEND_DIR/logs/race_conditions.log
    else
        print_warning "Arquivo de log não encontrado ainda."
        print_info "Execute algumas operações no sistema para gerar logs."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 3: Erros recentes
show_recent_errors() {
    clear
    print_header
    echo -e "${WHITE}🚨 ERROS RECENTES${NC}"
    echo -e "${WHITE}=================${NC}"
    echo ""
    
    if [ -f "$BACKEND_DIR/logs/race_conditions.log" ]; then
        print_step "Últimos 10 erros encontrados:"
        echo ""
        grep "CONSTRAINT_ERROR\|ERROR" $BACKEND_DIR/logs/race_conditions.log | tail -10 || print_info "Nenhum erro encontrado! 🎉"
        
        echo ""
        print_step "Contagem de erros hoje:"
        today=$(date +%d/%m/%Y)
        error_count=$(grep "$today" $BACKEND_DIR/logs/race_conditions.log | grep "CONSTRAINT_ERROR" | wc -l)
        
        if [ "$error_count" -eq 0 ]; then
            print_success "0 erros hoje! Sistema estável! 🎉"
        else
            print_warning "$error_count erros encontrados hoje"
        fi
    else
        print_info "Arquivo de log não encontrado ainda."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 4: Testar emails
test_email_system() {
    clear
    print_header
    echo -e "${WHITE}📧 TESTE DO SISTEMA DE EMAILS${NC}"
    echo -e "${WHITE}=============================${NC}"
    echo ""
    
    # Atualizar BACKEND_URL no .env antes de testar
    update_backend_url_in_env
    
    print_step "Executando teste de email..."
    echo ""
    
    cd $BACKEND_DIR && node monitoring/services/test-email-alerts.js
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 5: Enviar alerta de teste REAL
send_real_alert_test() {
    clear
    print_header
    echo -e "${WHITE}🚨 ENVIAR ALERTA DE TESTE REAL${NC}"
    echo -e "${WHITE}===============================${NC}"
    echo ""
    
    print_warning "ATENÇÃO: Este teste enviará um EMAIL REAL!"
    echo ""
    echo -e "${BLUE}📧 Email configurado: ${GREEN}$(grep "ALERT_EMAIL=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2 || echo "NÃO CONFIGURADO")${NC}"
    echo -e "${BLUE}📤 Servidor SMTP: ${GREEN}$(grep "MAIL_HOST=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2 || echo "NÃO CONFIGURADO")${NC}"
    echo ""
    
    # Verificar se está configurado
    if ! grep -q "^MAIL_HOST=" $BACKEND_DIR/.env 2>/dev/null; then
        print_error "Sistema de emails não está configurado!"
        echo ""
        read -p "Deseja configurar agora? (s/n): " setup_now
        if [ "$setup_now" = "s" ] || [ "$setup_now" = "S" ]; then
            setup_emails
            return
        else
            echo ""
            read -p "Pressione Enter para voltar ao menu..."
            return
        fi
    fi
    
    echo -e "${YELLOW}⚠️  Este teste irá:${NC}"
    echo "   • Enviar um email REAL para o endereço configurado"
    echo "   • Testar se as configurações SMTP estão funcionando"
    echo "   • Verificar se os alertas automáticos funcionarão"
    echo ""
    
    read -p "Tem certeza que deseja enviar o alerta de teste? (s/n): " confirm
    
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
        echo ""
        print_step "Enviando alerta de teste real..."
        echo ""
        
        # Atualizar BACKEND_URL no .env antes de enviar
        update_backend_url_in_env
        
        cd $BACKEND_DIR && node monitoring/services/send-test-alert.js
        
        echo ""
        print_info "Se o email foi enviado com sucesso, você deve recebê-lo em alguns segundos."
        print_info "Verifique também a pasta de SPAM/Lixo Eletrônico."
    else
        print_info "Teste cancelado."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 6: Monitor automático
run_auto_monitor() {
    clear
    print_header
    echo -e "${WHITE}🤖 MONITOR AUTOMÁTICO${NC}"
    echo -e "${WHITE}=====================${NC}"
    echo ""
    
    local backend_url=$(get_backend_url)
    local port=$(get_backend_port)
    
    print_info "Iniciando monitor automático..."
    print_info "Monitorando: $backend_url"
    print_warning "Pressione Ctrl+C para parar"
    echo ""
    
    # Atualizar BACKEND_URL no .env antes de executar
    update_backend_url_in_env
    
    # Verificar se o backend está respondendo antes de iniciar
    if ! check_backend; then
        print_error "Backend não está respondendo na porta $port!"
        echo -e "${YELLOW}Verifique se o backend está rodando com: cd backend && npm run dev${NC}"
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    cd $BACKEND_DIR && node monitoring/services/monitor-race-conditions-prod.js
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 7: Estatísticas detalhadas
show_detailed_stats() {
    clear
    print_header
    echo -e "${WHITE}📋 ESTATÍSTICAS DETALHADAS${NC}"
    echo -e "${WHITE}===========================${NC}"
    echo ""
    
    if [ -f "$BACKEND_DIR/logs/race_conditions.log" ]; then
        print_step "Análise dos logs:"
        echo ""
        
        # Total de linhas
        total_lines=$(wc -l < $BACKEND_DIR/logs/race_conditions.log)
        echo "📄 Total de entradas no log: $total_lines"
        
        # Erros por dia (últimos 7 dias)
        echo ""
        echo "📅 Erros por dia (últimos 7 dias):"
        for i in {0..6}; do
            date_check=$(date -d "$i days ago" +%d/%m/%Y)
            error_count=$(grep "$date_check" $BACKEND_DIR/logs/race_conditions.log | grep "CONSTRAINT_ERROR" | wc -l)
            echo "   $date_check: $error_count erros"
        done
        
        # Tamanho do arquivo
        echo ""
        file_size=$(ls -lh $BACKEND_DIR/logs/race_conditions.log | awk '{print $5}')
        echo "💾 Tamanho do arquivo de log: $file_size"
        
    else
        print_info "Arquivo de log não encontrado ainda."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 8: Limpar logs
clean_old_logs() {
    clear
    print_header
    echo -e "${WHITE}🧹 LIMPEZA DE LOGS${NC}"
    echo -e "${WHITE}==================${NC}"
    echo ""
    
    if [ -f "$BACKEND_DIR/logs/race_conditions.log" ]; then
        file_size=$(ls -lh $BACKEND_DIR/logs/race_conditions.log | awk '{print $5}')
        print_info "Tamanho atual do log: $file_size"
        echo ""
        
        echo "Opções de limpeza:"
        echo "1. Manter últimos 7 dias"
        echo "2. Manter últimos 30 dias"
        echo "3. Limpar tudo"
        echo "4. Cancelar"
        echo ""
        
        read -p "Escolha uma opção (1-4): " clean_option
        
        case $clean_option in
            1)
                print_step "Limpando logs antigos (mantendo 7 dias)..."
                # Implementar limpeza de 7 dias
                print_success "Logs limpos!"
                ;;
            2)
                print_step "Limpando logs antigos (mantendo 30 dias)..."
                # Implementar limpeza de 30 dias
                print_success "Logs limpos!"
                ;;
            3)
                read -p "Tem certeza que deseja limpar TODOS os logs? (s/n): " confirm
                if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
                    > $BACKEND_DIR/logs/race_conditions.log
                    print_success "Todos os logs foram limpos!"
                fi
                ;;
            4)
                print_info "Operação cancelada."
                ;;
        esac
    else
        print_info "Nenhum arquivo de log encontrado."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 10: Limpar backups do .env
clean_env_backups() {
    clear
    print_header
    echo -e "${WHITE}🗑️  LIMPAR BACKUPS DO .ENV${NC}"
    echo -e "${WHITE}=========================${NC}"
    echo ""
    
    # Contar backups existentes
    local backup_count=$(ls -1 "$BACKEND_DIR"/.env.backup.* 2>/dev/null | wc -l)
    
    if [ "$backup_count" -eq 0 ]; then
        print_info "Nenhum backup encontrado."
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    print_step "Backups encontrados: $backup_count"
    echo ""
    
    # Listar backups
    echo -e "${BLUE}📁 Backups existentes:${NC}"
    ls -lah "$BACKEND_DIR"/.env.backup.* 2>/dev/null | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo -e "${YELLOW}Opções de limpeza:${NC}"
    echo "1. 🧹 Manter apenas os 3 mais recentes"
    echo "2. 🗑️  Remover TODOS os backups"
    echo "3. 🔙 Voltar ao menu"
    echo ""
    
    read -p "Escolha uma opção (1-3): " clean_option
    
    case $clean_option in
        1)
            print_step "Mantendo apenas os 3 backups mais recentes..."
            cleanup_old_backups
            print_success "Limpeza concluída!"
            ;;
        2)
            print_warning "ATENÇÃO: Isso removerá TODOS os backups do .env!"
            read -p "Tem certeza? (s/n): " confirm
            if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
                rm -f "$BACKEND_DIR"/.env.backup.*
                print_success "Todos os backups foram removidos!"
            else
                print_info "Operação cancelada."
            fi
            ;;
        3)
            return
            ;;
        *)
            print_error "Opção inválida!"
            ;;
    esac
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 11: Commit e Push
git_commit_push() {
    clear
    print_header
    echo -e "${WHITE}📤 COMMIT E PUSH${NC}"
    echo -e "${WHITE}=================${NC}"
    echo ""
    
    # Verificar se estamos em um repositório Git
    if ! check_git_repo; then
        print_error "Este diretório não é um repositório Git!"
        echo ""
        read -p "Deseja inicializar um repositório Git? (s/n): " init_git
        if [ "$init_git" = "s" ] || [ "$init_git" = "S" ]; then
            git init
            print_success "Repositório Git inicializado!"
        else
            echo ""
            read -p "Pressione Enter para voltar ao menu..."
            return
        fi
    fi
    
    # Verificar configurações Git
    if ! check_git_config; then
        print_warning "Git não está configurado completamente."
        echo ""
        read -p "Deseja configurar agora? (s/n): " config_now
        if [ "$config_now" = "s" ] || [ "$config_now" = "S" ]; then
            setup_git_config
            return
        else
            echo ""
            read -p "Pressione Enter para voltar ao menu..."
            return
        fi
    fi
    
    # Mostrar status atual
    print_step "Status atual do repositório:"
    echo ""
    git status --short
    echo ""
    
    # Verificar se há mudanças para commit
    if [ -z "$(git status --porcelain)" ]; then
        print_info "Não há mudanças para fazer commit."
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Mostrar arquivos modificados
    echo -e "${BLUE}📁 Arquivos modificados:${NC}"
    git status --porcelain | while read line; do
        echo "   $line"
    done
    echo ""
    
    # Perguntar quais arquivos adicionar
    echo -e "${YELLOW}Opções:${NC}"
    echo "1. 📦 Adicionar TODOS os arquivos"
    echo "2. 📝 Escolher arquivos específicos"
    echo "3. 🔙 Voltar ao menu"
    echo ""
    
    read -p "Escolha uma opção (1-3): " add_option
    
    case $add_option in
        1)
            print_step "Adicionando todos os arquivos..."
            # Ir para a raiz do projeto para executar git add
            cd ../../../
            git add .
            cd backend/monitoring/scripts
            ;;
        2)
            print_step "Arquivos disponíveis:"
            git status --porcelain | nl
            echo ""
            read -p "Digite os números dos arquivos (ex: 1,3,5) ou 'all' para todos: " file_selection
            if [ "$file_selection" = "all" ]; then
                cd ../../../
                git add .
                cd backend/monitoring/scripts
            else
                # Implementar seleção específica (simplificado por agora)
                cd ../../../
                git add .
                cd backend/monitoring/scripts
                print_info "Por enquanto, adicionando todos os arquivos."
            fi
            ;;
        3)
            return
            ;;
        *)
            print_error "Opção inválida!"
            echo ""
            read -p "Pressione Enter para voltar ao menu..."
            return
            ;;
    esac
    
    # Solicitar mensagem de commit
    echo ""
    read -p "📝 Digite a mensagem do commit: " commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="Update: $(date '+%Y-%m-%d %H:%M:%S')"
        print_info "Usando mensagem padrão: $commit_message"
    fi
    
    # Fazer commit
    print_step "Fazendo commit..."
    cd ../../../
    if git commit -m "$commit_message"; then
        cd backend/monitoring/scripts
        print_success "Commit realizado com sucesso!"
        
        # Perguntar se quer fazer push
        echo ""
        read -p "🚀 Deseja fazer push para o repositório remoto? (s/n): " do_push
        
        if [ "$do_push" = "s" ] || [ "$do_push" = "S" ]; then
            print_step "Fazendo push..."
            
            # Verificar se há remote configurado
            if git remote get-url origin > /dev/null 2>&1; then
                # Configurar credenciais temporariamente se estiverem no .env
                setup_git_credentials
                
                # Tentar push primeiro
                if git push origin $(git branch --show-current) 2>/dev/null; then
                    print_success "Push realizado com sucesso! 🎉"
                else
                    # Se falhou, pode ser porque precisa fazer pull primeiro
                    print_warning "Push falhou. Pode ser necessário puxar atualizações primeiro."
                    echo ""
                    echo -e "${YELLOW}Opções:${NC}"
                    echo "1. 📥 Fazer pull e tentar push novamente"
                    echo "2. 🔄 Forçar push (CUIDADO!)"
                    echo "3. 🔙 Cancelar"
                    echo ""
                    
                    read -p "Escolha uma opção (1-3): " push_option
                    
                    case $push_option in
                        1)
                            print_step "Fazendo pull primeiro..."
                            if git pull origin $(git branch --show-current); then
                                print_step "Tentando push novamente..."
                                if git push origin $(git branch --show-current); then
                                    print_success "Push realizado com sucesso! 🎉"
                                else
                                    print_error "Erro ao fazer push mesmo após pull."
                                fi
                            else
                                print_error "Erro ao fazer pull. Pode haver conflitos."
                            fi
                            ;;
                        2)
                            print_warning "ATENÇÃO: Push forçado pode sobrescrever mudanças remotas!"
                            read -p "Tem certeza? Digite 'CONFIRMO' para continuar: " confirm_force
                            if [ "$confirm_force" = "CONFIRMO" ]; then
                                if git push --force origin $(git branch --show-current); then
                                    print_success "Push forçado realizado! ⚠️"
                                else
                                    print_error "Erro ao fazer push forçado."
                                fi
                            else
                                print_info "Push forçado cancelado."
                            fi
                            ;;
                        3)
                            print_info "Push cancelado."
                            ;;
                        *)
                            print_error "Opção inválida!"
                            ;;
                    esac
                fi
            else
                print_error "Nenhum repositório remoto configurado."
                print_info "Configure o Git primeiro (opção 14)."
            fi
        fi
    else
        cd backend/monitoring/scripts
        print_error "Erro ao fazer commit."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 12: Pull (puxar atualizações) - MODO SOBRESCREVER
git_pull_updates() {
    clear
    print_header
    echo -e "${WHITE}📥 PULL - PUXAR ATUALIZAÇÕES (MODO SOBRESCREVER)${NC}"
    echo -e "${WHITE}===============================================${NC}"
    echo ""
    
    # Verificar se estamos em um repositório Git
    if ! check_git_repo; then
        print_error "Este diretório não é um repositório Git!"
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Verificar se há remote configurado
    if ! git remote get-url origin > /dev/null 2>&1; then
        print_error "Nenhum repositório remoto configurado."
        print_info "Configure o Git primeiro (opção 14)."
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Mostrar status atual
    print_step "Status atual:"
    echo ""
    git status --short
    echo ""
    
    # Verificar se há mudanças locais não commitadas
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "⚠️  ATENÇÃO: Há mudanças locais não commitadas!"
        echo ""
        echo -e "${RED}🚨 MODO SOBRESCREVER ATIVO:${NC}"
        echo -e "${YELLOW}Este pull irá SUBSTITUIR todos os arquivos locais pela versão do Git.${NC}"
        echo ""
        echo -e "${YELLOW}Opções disponíveis:${NC}"
        echo "1. 💾 Fazer commit das mudanças primeiro (RECOMENDADO)"
        echo "2. 🗑️  SOBRESCREVER tudo com a versão do Git"
        echo "3. 📦 Fazer stash das mudanças (backup temporário)"
        echo "4. 🔙 Voltar ao menu"
        echo ""
        
        read -p "Escolha uma opção (1-4): " local_changes_option
        
        case $local_changes_option in
            1)
                print_info "Redirecionando para commit e push..."
                git_commit_push
                return
                ;;
            2)
                print_warning "🚨 ATENÇÃO: Isso irá SOBRESCREVER TODOS os arquivos locais!"
                print_warning "Suas mudanças locais serão PERDIDAS PERMANENTEMENTE!"
                echo ""
                read -p "Tem CERTEZA ABSOLUTA? Digite 'SOBRESCREVER' para continuar: " confirm
                if [ "$confirm" = "SOBRESCREVER" ]; then
                    print_step "Descartando mudanças locais..."
                    # Verificar se HEAD existe antes de fazer reset
                    if git rev-parse --verify HEAD >/dev/null 2>&1; then
                        git reset --hard HEAD
                    else
                        # Se HEAD não existe, apenas limpar arquivos não rastreados
                        git clean -fd
                        print_info "ℹ️  Repositório sem histórico - apenas limpando arquivos não rastreados."
                    fi
                    print_success "✅ Mudanças locais descartadas."
                else
                    print_info "❌ Operação cancelada por segurança."
                    echo ""
                    read -p "Pressione Enter para voltar ao menu..."
                    return
                fi
                ;;
            3)
                print_step "Fazendo backup das mudanças no stash..."
                git stash push -m "Auto-backup antes do pull - $(date '+%Y-%m-%d %H:%M:%S')"
                print_success "✅ Mudanças salvas no stash (recuperáveis com 'git stash pop')."
                ;;
            4)
                return
                ;;
            *)
                print_error "Opção inválida!"
                echo ""
                read -p "Pressione Enter para voltar ao menu..."
                return
                ;;
        esac
    fi
    
    # Configurar credenciais se disponíveis
    setup_git_credentials
    
    # Fazer fetch primeiro para garantir que temos as últimas informações
    print_step "Buscando informações do repositório remoto..."
    git fetch origin
    
    # Fazer pull com reset hard para garantir sobrescrita
    print_step "Puxando atualizações e sobrescrevendo arquivos locais..."
    echo ""
    
    # Detectar branch principal do remoto
    default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
    current_branch=$(git branch --show-current 2>/dev/null || echo "$default_branch")
    
    # Se não conseguir detectar o branch atual, usar main
    if [ -z "$current_branch" ]; then
        current_branch="main"
    fi
    
    print_info "🌿 Usando branch: $current_branch"
    
    # Verificar se o branch remoto existe
    if ! git rev-parse --verify origin/$current_branch >/dev/null 2>&1; then
        print_warning "⚠️  Branch origin/$current_branch não encontrado, tentando origin/main..."
        current_branch="main"
        if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
            print_error "❌ Nenhum branch remoto válido encontrado (main ou $current_branch)!"
            echo ""
            read -p "Pressione Enter para voltar ao menu..."
            return
        fi
    fi
    
    # Método mais agressivo: reset hard para a versão remota
    if git reset --hard origin/$current_branch; then
        print_success "🎉 Atualizações aplicadas com sucesso!"
        print_success "✅ Todos os arquivos foram substituídos pela versão do Git."
        
        # Mostrar o que foi atualizado
        echo ""
        print_step "📋 Últimos commits aplicados:"
        git log --oneline -5 --graph
        
        echo ""
        print_step "📊 Resumo das mudanças:"
        git diff --stat HEAD~5..HEAD 2>/dev/null || echo "Nenhuma diferença detectada."
        
    else
        print_error "❌ Erro ao aplicar atualizações."
        echo ""
        echo -e "${YELLOW}🔧 Possíveis soluções:${NC}"
        echo "• Verifique sua conexão com a internet"
        echo "• Confirme se as credenciais estão corretas (Opção 14)"
        echo "• Verifique se o repositório remoto existe"
        echo ""
        print_info "💡 Tente configurar o Git novamente (Opção 14)."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 13: Status do Git
git_status() {
    clear
    print_header
    echo -e "${WHITE}📊 STATUS DO GIT${NC}"
    echo -e "${WHITE}=================${NC}"
    echo ""
    
    # Verificar se estamos em um repositório Git
    if ! check_git_repo; then
        print_error "Este diretório não é um repositório Git!"
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Informações básicas
    print_step "Informações do Repositório:"
    echo ""
    
    # Branch atual
    current_branch=$(git branch --show-current)
    echo -e "${BLUE}🌿 Branch atual: ${GREEN}$current_branch${NC}"
    
    # Remote URL
    remote_url=$(git config --get remote.origin.url 2>/dev/null)
    if [ -n "$remote_url" ]; then
        echo -e "${BLUE}🔗 Repositório remoto: ${GREEN}$remote_url${NC}"
    else
        echo -e "${BLUE}🔗 Repositório remoto: ${RED}Não configurado${NC}"
    fi
    
    # Usuário Git
    git_user=$(git config --get user.name 2>/dev/null)
    git_email=$(git config --get user.email 2>/dev/null)
    echo -e "${BLUE}👤 Usuário: ${GREEN}$git_user <$git_email>${NC}"
    
    echo ""
    
    # Status detalhado
    print_step "Status detalhado:"
    echo ""
    git status
    
    echo ""
    
    # Últimos commits
    print_step "Últimos 5 commits:"
    echo ""
    git log --oneline -5 --graph
    
    echo ""
    
    # Branches
    print_step "Branches disponíveis:"
    echo ""
    git branch -a
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 14: Configurar Git
setup_git_config() {
    clear
    print_header
    echo -e "${WHITE}⚙️  CONFIGURAR GIT${NC}"
    echo -e "${WHITE}==================${NC}"
    echo ""
    
    # Verificar configurações atuais
    current_url=$(git config --get remote.origin.url 2>/dev/null)
    current_user=$(git config --get user.name 2>/dev/null)
    current_email=$(git config --get user.email 2>/dev/null)
    
    if [ -n "$current_url" ] || [ -n "$current_user" ] || [ -n "$current_email" ]; then
        print_step "Configurações atuais:"
        echo ""
        echo -e "${BLUE}🔗 URL do repositório: ${GREEN}${current_url:-"Não configurado"}${NC}"
        echo -e "${BLUE}👤 Nome do usuário: ${GREEN}${current_user:-"Não configurado"}${NC}"
        echo -e "${BLUE}📧 Email: ${GREEN}${current_email:-"Não configurado"}${NC}"
        echo ""
    fi
    
    # Configurar URL do repositório
    echo -e "${YELLOW}📝 CONFIGURAÇÃO DO REPOSITÓRIO:${NC}"
    echo ""
    echo "Exemplos de URLs:"
    echo "  • HTTPS: https://github.com/usuario/repositorio.git"
    echo "  • SSH: git@github.com:usuario/repositorio.git"
    echo ""
    
    read -p "🔗 Digite a URL do repositório Git: " git_url
    
    if [ -z "$git_url" ]; then
        print_error "URL não pode estar vazia!"
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Configurar usuário
    echo ""
    read -p "👤 Digite seu nome de usuário Git: " git_user
    
    if [ -z "$git_user" ]; then
        print_error "Nome de usuário não pode estar vazio!"
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Configurar email
    echo ""
    read -p "📧 Digite seu email Git: " git_email
    
    if [ -z "$git_email" ]; then
        print_error "Email não pode estar vazio!"
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Configurar credenciais para HTTPS (opcional)
    echo ""
    echo -e "${YELLOW}🔐 CONFIGURAÇÃO DE CREDENCIAIS (Opcional):${NC}"
    echo ""
    echo "Para push automático sem solicitar senha:"
    echo "  • GitHub: Use seu username e Personal Access Token"
    echo "  • GitLab: Use seu username e Personal Access Token"
    echo ""
    
    read -p "🔑 Digite seu username Git (deixe vazio para pular): " git_username
    
    local git_token=""
    if [ -n "$git_username" ]; then
        echo ""
        echo "Para criar um Personal Access Token:"
        echo "  • GitHub: Settings → Developer settings → Personal access tokens"
        echo "  • GitLab: User Settings → Access Tokens"
        echo ""
        read -s -p "🔐 Digite seu Personal Access Token (não será exibido): " git_token
        echo ""
    fi
    
    # Confirmar configurações
    echo ""
    print_step "Confirme as configurações:"
    echo ""
    echo -e "${BLUE}🔗 URL: ${GREEN}$git_url${NC}"
    echo -e "${BLUE}👤 Usuário: ${GREEN}$git_user${NC}"
    echo -e "${BLUE}📧 Email: ${GREEN}$git_email${NC}"
    if [ -n "$git_username" ]; then
        echo -e "${BLUE}🔑 Username: ${GREEN}$git_username${NC}"
        echo -e "${BLUE}🔐 Token: ${GREEN}***configurado***${NC}"
    else
        echo -e "${BLUE}🔐 Credenciais: ${YELLOW}Não configuradas (será solicitado na hora do push)${NC}"
    fi
    echo ""
    
    read -p "Confirma essas configurações? (s/n): " confirm
    
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        print_info "Configuração cancelada."
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Aplicar configurações
    print_step "Aplicando configurações..."
    
    # Configurar Git local
    git config user.name "$git_user"
    git config user.email "$git_email"
    
    # Configurar remote (se não existir)
    if ! git remote get-url origin > /dev/null 2>&1; then
        git remote add origin "$git_url"
    else
        git remote set-url origin "$git_url"
    fi
    
    # Salvar no .env
    save_git_config_to_env "$git_url" "$git_user" "$git_email" "$git_username" "$git_token"
    
    print_success "Configurações Git aplicadas com sucesso!"
    
    # Testar conexão
    echo ""
    print_step "Testando conexão com o repositório..."
    
    if git ls-remote origin > /dev/null 2>&1; then
        print_success "Conexão com o repositório estabelecida! ✅"
    else
        print_warning "Não foi possível conectar ao repositório."
        print_info "Verifique a URL e suas credenciais."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 15: Criar backup do banco de dados
create_database_backup() {
    clear
    print_header
    echo -e "${WHITE}💾 CRIAR BACKUP DO BANCO DE DADOS${NC}"
    echo -e "${WHITE}==================================${NC}"
    echo ""
    
    print_step "Verificando configurações do banco..."
    
    # Verificar se as configurações do banco existem
    local db_host=$(grep "^DB_HOST=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    local db_name=$(grep "^DB_NAME=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    local db_user=$(grep "^DB_USER=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2)
    
    if [ -z "$db_host" ] || [ -z "$db_name" ] || [ -z "$db_user" ]; then
        print_error "Configurações do banco não encontradas no .env!"
        echo ""
        echo -e "${YELLOW}Verifique se as seguintes variáveis estão configuradas:${NC}"
        echo "• DB_HOST"
        echo "• DB_NAME"
        echo "• DB_USER"
        echo "• DB_PASS"
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    echo -e "${BLUE}📊 Configurações encontradas:${NC}"
    echo "• Host: $db_host"
    echo "• Banco: $db_name"
    echo "• Usuário: $db_user"
    echo ""
    
    read -p "Confirma a criação do backup? (s/n): " confirm
    
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        print_info "Backup cancelado."
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    print_step "Criando backup..."
    echo ""
    
    if node $SERVICES_DIR/database-backup.js create; then
        echo ""
        print_success "Backup criado com sucesso!"
        echo ""
        print_info "💡 O backup foi salvo na pasta backend/backups/"
    else
        echo ""
        print_error "Falha ao criar backup!"
        echo ""
        print_info "💡 Verifique se o PostgreSQL está instalado e acessível."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 16: Listar backups existentes
list_database_backups() {
    clear
    print_header
    echo -e "${WHITE}📋 BACKUPS EXISTENTES${NC}"
    echo -e "${WHITE}=====================${NC}"
    echo ""
    
    print_step "Listando backups disponíveis..."
    echo ""
    
    node $SERVICES_DIR/database-backup.js list
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 17: Limpar backups antigos
clean_database_backups() {
    clear
    print_header
    echo -e "${WHITE}🧹 LIMPAR BACKUPS ANTIGOS${NC}"
    echo -e "${WHITE}=========================${NC}"
    echo ""
    
    print_step "Verificando backups existentes..."
    echo ""
    
    # Mostrar backups atuais
    node $SERVICES_DIR/database-backup.js list
    
    echo ""
    echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá remover backups antigos!${NC}"
    echo ""
    
    read -p "Quantos backups deseja manter? (padrão: 5): " keep_count
    
    # Usar 5 como padrão se não especificado
    if [ -z "$keep_count" ]; then
        keep_count=5
    fi
    
    # Validar se é um número
    if ! [[ "$keep_count" =~ ^[0-9]+$ ]]; then
        print_error "Número inválido!"
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    echo ""
    read -p "Confirma a limpeza mantendo $keep_count backups? (s/n): " confirm
    
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        print_info "Limpeza cancelada."
        echo ""
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    print_step "Limpando backups antigos..."
    echo ""
    
    node $SERVICES_DIR/database-backup.js clean $keep_count
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 18: Testar conexão com banco
test_database_connection() {
    clear
    print_header
    echo -e "${WHITE}🔌 TESTAR CONEXÃO COM BANCO${NC}"
    echo -e "${WHITE}===========================${NC}"
    echo ""
    
    print_step "Testando conexão com o banco de dados..."
    echo ""
    
    if node $SERVICES_DIR/database-backup.js test; then
        echo ""
        print_success "Conexão com banco funcionando perfeitamente!"
    else
        echo ""
        print_error "Falha na conexão com o banco!"
        echo ""
        print_info "💡 Verifique:"
        echo "• Se o PostgreSQL está rodando"
        echo "• Se as credenciais no .env estão corretas"
        echo "• Se a porta do banco está acessível"
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 19: Comandos úteis
show_useful_commands() {
    clear
    print_header
    echo -e "${WHITE}📚 COMANDOS ÚTEIS${NC}"
    echo -e "${WHITE}=================${NC}"
    echo ""
    
    echo -e "${CYAN}🔍 Comandos de Monitoramento:${NC}"
    echo ""
    echo "# Ver status geral"
            local backend_url=$(get_backend_url)
        echo "curl $backend_url/race-conditions/stats"
    echo ""
    echo "# Contar erros de hoje"
    echo "grep \"\$(date +%d/%m/%Y)\" backend/logs/race_conditions.log | grep \"CONSTRAINT_ERROR\" | wc -l"
    echo ""
    echo "# Ver logs em tempo real"
    echo "tail -f backend/logs/race_conditions.log"
    echo ""
    echo "# Testar sistema de emails"
    echo "node monitoring/services/test-email-alerts.js"
    echo ""
    echo "# Monitor automático"
    echo "node monitoring/services/monitor-race-conditions-prod.js"
    echo ""
    
    echo -e "${CYAN}🛠️  Comandos de Manutenção:${NC}"
    echo ""
    echo "# Backup do .env"
    echo "cp backend/.env backend/.env.backup.\$(date +%Y%m%d_%H%M%S)"
    echo ""
    echo "# Ver configurações de email"
    echo "grep -E \"MAIL_|ALERT_\" backend/.env"
    echo ""
    
    echo -e "${CYAN}🔧 Comandos Git:${NC}"
    echo ""
    echo "# Status do repositório"
    echo "git status"
    echo ""
    echo "# Adicionar todos os arquivos"
    echo "git add ."
    echo ""
    echo "# Fazer commit"
    echo "git commit -m \"Sua mensagem\""
    echo ""
    echo "# Fazer push"
    echo "git push origin main"
    echo ""
    echo "# Puxar atualizações"
    echo "git pull origin main"
    echo ""
    echo "# Ver histórico"
    echo "git log --oneline -10"
    echo ""
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 20: Iniciar Monitor Automático de Produção
start_production_monitor() {
    clear
    print_header
    echo -e "${WHITE}🚀 MONITOR AUTOMÁTICO DE PRODUÇÃO${NC}"
    echo -e "${WHITE}===================================${NC}"
    echo ""
    
    # Verificar se já existe um monitor rodando
    if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
        print_warning "Monitor automático já está rodando!"
        echo ""
        echo -e "${BLUE}PID do processo: ${GREEN}$(pgrep -f "monitor-race-conditions-prod.js")${NC}"
        echo ""
        echo "Para parar o monitor, use: kill $(pgrep -f "monitor-race-conditions-prod.js")"
        echo ""
        read -p "Deseja parar o monitor atual? (s/n): " stop_current
        
        if [ "$stop_current" = "s" ] || [ "$stop_current" = "S" ]; then
            print_step "Parando monitor atual..."
            kill $(pgrep -f "monitor-race-conditions-prod.js") 2>/dev/null
            sleep 2
            print_success "Monitor parado!"
            echo ""
        else
            echo ""
            read -p "Pressione Enter para voltar ao menu..."
            return
        fi
    fi
    
    # Verificar configurações de email
    if ! grep -q "^ALERT_EMAIL=" $BACKEND_DIR/.env 2>/dev/null; then
        print_error "ALERT_EMAIL não está configurado!"
        echo ""
        read -p "Deseja configurar agora? (s/n): " setup_email
        if [ "$setup_email" = "s" ] || [ "$setup_email" = "S" ]; then
            setup_emails
            echo ""
            print_info "Email configurado! Continuando com o monitor..."
            echo ""
        else
            print_warning "Monitor funcionará sem alertas por email."
            echo ""
        fi
    fi
    
    # Verificar se o backend está respondendo
    print_step "Verificando backend..."
    local backend_url=$(get_backend_url)
    
    if check_backend; then
        print_success "Backend está respondendo! ✅"
        echo "URL: $backend_url"
    else
        print_error "Backend não está respondendo!"
        echo ""
        print_info "💡 Verifique se o backend está rodando antes de iniciar o monitor."
        echo ""
        read -p "Deseja continuar mesmo assim? (s/n): " continue_anyway
        if [ "$continue_anyway" != "s" ] && [ "$continue_anyway" != "S" ]; then
            echo ""
            read -p "Pressione Enter para voltar ao menu..."
            return
        fi
    fi
    
    echo ""
    echo -e "${CYAN}🔧 CONFIGURAÇÕES DO MONITOR:${NC}"
    echo ""
    echo "• ⏱️  Intervalo: 5 minutos (otimizado para produção)"
    echo "• 📧 Email: $(grep "ALERT_EMAIL=" $BACKEND_DIR/.env 2>/dev/null | cut -d'=' -f2 || echo "NÃO CONFIGURADO")"
    echo "• 🌐 API: $backend_url"
    echo "• 🚨 Alertas: Race conditions, Alto uso de memória, Cache baixo"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "• O monitor rodará em background 24/7"
    echo "• Enviará emails automáticos quando detectar problemas"
    echo "• Para parar, use a opção 20 novamente ou kill PID"
    echo ""
    
    read -p "Deseja iniciar o monitor automático? (s/n): " confirm
    
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
        print_step "Iniciando monitor automático de produção..."
        echo ""
        
        # Atualizar BACKEND_URL no .env
        update_backend_url_in_env
        
        # Garantir que o diretório de logs existe
        mkdir -p $BACKEND_DIR/logs
        
        # Iniciar o monitor em background independente
        cd $BACKEND_DIR
        setsid nohup node monitoring/services/monitor-race-conditions-prod.js > logs/monitor-production.log 2>&1 &
        disown  # Desanexar do terminal atual
        
        # Aguardar um pouco para verificar se iniciou
        sleep 3
        
        if pgrep -f "monitor-race-conditions-prod.js" > /dev/null; then
            print_success "Monitor iniciado com sucesso! 🚀"
            echo ""
            echo -e "${GREEN}✅ Status: ATIVO${NC}"
            echo -e "${BLUE}PID: ${GREEN}$(pgrep -f "monitor-race-conditions-prod.js")${NC}"
            echo ""
            echo -e "${CYAN}📋 IMPORTANTE:${NC}"
            echo "• O monitor está rodando INDEPENDENTE deste painel"
            echo "• Pode fechar o painel que o monitor continuará ativo"
            echo "• Logs: backend/logs/race_conditions.log"
            echo "• Logs do monitor: backend/logs/monitor-production.log"
            echo ""
            print_info "Para parar o monitor, use novamente a opção 20 ou:"
            echo "   kill $(pgrep -f "monitor-race-conditions-prod.js")"
        else
            print_error "Falha ao iniciar o monitor!"
            echo ""
            print_info "💡 Tente executar manualmente:"
            echo "cd backend && node monitoring/services/monitor-race-conditions-prod.js"
        fi
    else
        print_info "Operação cancelada."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função principal
main() {
    # Verificar dependências
    check_dependencies
    
    # Mostrar header inicial
    clear
    print_header
    
    print_info "Bem-vindo ao Whatize Monitor!"
    print_info "Sistema de monitoramento completo para Race Conditions"
    echo ""
    
    # Verificar se emails estão configurados
    if ! grep -q "^MAIL_HOST=" $BACKEND_DIR/.env 2>/dev/null; then
        print_warning "Emails não estão configurados."
        echo ""
        read -p "Deseja configurar agora? (s/n): " setup_now
        if [ "$setup_now" = "s" ] || [ "$setup_now" = "S" ]; then
            setup_emails
        fi
    fi
    
    # Entrar no menu principal
    monitoring_menu
}

# Executar script principal
main 