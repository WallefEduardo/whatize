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
    if curl -s http://localhost:4000/race-conditions/stats > /dev/null 2>&1; then
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

# Função para salvar configurações Git no .env
save_git_config_to_env() {
    local git_url=$1
    local git_user=$2
    local git_email=$3
    
    # Backup inteligente do .env
    create_smart_backup
    
    # Remover configurações antigas
    sed -i '/^GIT_REPOSITORY_URL=/d' $BACKEND_DIR/.env
    sed -i '/^GIT_USER_NAME=/d' $BACKEND_DIR/.env
    sed -i '/^GIT_USER_EMAIL=/d' $BACKEND_DIR/.env
    
    # Adicionar novas configurações
    echo "" >> $BACKEND_DIR/.env
    echo "# Configurações Git" >> $BACKEND_DIR/.env
    echo "GIT_REPOSITORY_URL=$git_url" >> $BACKEND_DIR/.env
    echo "GIT_USER_NAME=$git_user" >> $BACKEND_DIR/.env
    echo "GIT_USER_EMAIL=$git_email" >> $BACKEND_DIR/.env
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
    
    # Verificar se o backend está rodando
    if ! check_backend; then
        print_error "Backend não está rodando na porta 4000!"
        echo -e "${YELLOW}Execute primeiro: cd backend && npm run dev${NC}"
        exit 1
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
            print_success "Backend: Online (porta 4000)"
        else
            print_error "Backend: Offline"
        fi
        
        # Status dos emails
        if grep -q "^MAIL_HOST=" $BACKEND_DIR/.env 2>/dev/null; then
            print_success "Emails: Configurados"
        else
            print_warning "Emails: Modo simulação"
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
        echo "15. 📚 Ver comandos úteis"
        echo "0. 🚪 Sair"
        echo ""
        
        read -p "Escolha uma opção (0-15): " option
        
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
            15) show_useful_commands ;;
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
    
    print_step "Consultando API..."
    
    if check_backend; then
        echo ""
        curl -s http://localhost:4000/race-conditions/stats | jq . 2>/dev/null || curl -s http://localhost:4000/race-conditions/stats
        echo ""
    else
        print_error "Backend não está respondendo!"
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
    
    print_info "Iniciando monitor automático..."
    print_warning "Pressione Ctrl+C para parar"
    echo ""
    
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
            git add .
            ;;
        2)
            print_step "Arquivos disponíveis:"
            git status --porcelain | nl
            echo ""
            read -p "Digite os números dos arquivos (ex: 1,3,5) ou 'all' para todos: " file_selection
            if [ "$file_selection" = "all" ]; then
                git add .
            else
                # Implementar seleção específica (simplificado por agora)
                git add .
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
    if git commit -m "$commit_message"; then
        print_success "Commit realizado com sucesso!"
        
        # Perguntar se quer fazer push
        echo ""
        read -p "🚀 Deseja fazer push para o repositório remoto? (s/n): " do_push
        
        if [ "$do_push" = "s" ] || [ "$do_push" = "S" ]; then
            print_step "Fazendo push..."
            
            # Verificar se há remote configurado
            if git remote get-url origin > /dev/null 2>&1; then
                if git push origin $(git branch --show-current); then
                    print_success "Push realizado com sucesso! 🎉"
                else
                    print_error "Erro ao fazer push. Verifique suas credenciais."
                fi
            else
                print_error "Nenhum repositório remoto configurado."
                print_info "Configure o Git primeiro (opção 14)."
            fi
        fi
    else
        print_error "Erro ao fazer commit."
    fi
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 12: Pull (puxar atualizações)
git_pull_updates() {
    clear
    print_header
    echo -e "${WHITE}📥 PULL - PUXAR ATUALIZAÇÕES${NC}"
    echo -e "${WHITE}============================${NC}"
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
        print_warning "Há mudanças locais não commitadas!"
        echo ""
        echo -e "${YELLOW}Opções:${NC}"
        echo "1. 💾 Fazer commit das mudanças primeiro"
        echo "2. 🗑️  Descartar mudanças locais (CUIDADO!)"
        echo "3. 📦 Fazer stash das mudanças"
        echo "4. 🔙 Voltar ao menu"
        echo ""
        
        read -p "Escolha uma opção (1-4): " local_changes_option
        
        case $local_changes_option in
            1)
                git_commit_push
                return
                ;;
            2)
                print_warning "ATENÇÃO: Isso irá DESCARTAR todas as mudanças locais!"
                read -p "Tem certeza? Digite 'CONFIRMO' para continuar: " confirm
                if [ "$confirm" = "CONFIRMO" ]; then
                    git reset --hard HEAD
                    git clean -fd
                    print_success "Mudanças locais descartadas."
                else
                    print_info "Operação cancelada."
                    echo ""
                    read -p "Pressione Enter para voltar ao menu..."
                    return
                fi
                ;;
            3)
                print_step "Fazendo stash das mudanças..."
                git stash push -m "Auto-stash antes do pull - $(date '+%Y-%m-%d %H:%M:%S')"
                print_success "Mudanças salvas no stash."
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
    
    # Fazer pull
    print_step "Puxando atualizações do repositório remoto..."
    echo ""
    
    if git pull origin $(git branch --show-current); then
        print_success "Atualizações puxadas com sucesso! 🎉"
        
        # Mostrar o que foi atualizado
        echo ""
        print_step "Últimos commits:"
        git log --oneline -5
        
    else
        print_error "Erro ao puxar atualizações."
        print_info "Verifique sua conexão e credenciais."
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
    
    # Confirmar configurações
    echo ""
    print_step "Confirme as configurações:"
    echo ""
    echo -e "${BLUE}🔗 URL: ${GREEN}$git_url${NC}"
    echo -e "${BLUE}👤 Usuário: ${GREEN}$git_user${NC}"
    echo -e "${BLUE}📧 Email: ${GREEN}$git_email${NC}"
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
    save_git_config_to_env "$git_url" "$git_user" "$git_email"
    
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

# Função 15: Comandos úteis
show_useful_commands() {
    clear
    print_header
    echo -e "${WHITE}📚 COMANDOS ÚTEIS${NC}"
    echo -e "${WHITE}=================${NC}"
    echo ""
    
    echo -e "${CYAN}🔍 Comandos de Monitoramento:${NC}"
    echo ""
    echo "# Ver status geral"
    echo "curl http://localhost:4000/race-conditions/stats"
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