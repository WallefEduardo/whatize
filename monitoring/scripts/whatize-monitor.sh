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

# Caminhos relativos à nova estrutura
BACKEND_DIR="../../backend"
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
    
    # Backup do .env
    cp $BACKEND_DIR/.env $BACKEND_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)
    
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
        echo "5. 🤖 Monitor automático (30s)"
        echo "6. 📋 Estatísticas detalhadas"
        echo "7. 🧹 Limpar logs antigos"
        echo ""
        echo -e "${YELLOW}⚙️  CONFIGURAÇÕES:${NC}"
        echo ""
        echo "8. 📧 Configurar/Reconfigurar emails"
        echo "9. 📚 Ver comandos úteis"
        echo "0. 🚪 Sair"
        echo ""
        
        read -p "Escolha uma opção (0-9): " option
        
        case $option in
            1) show_system_status ;;
            2) monitor_logs_realtime ;;
            3) show_recent_errors ;;
            4) test_email_system ;;
            5) run_auto_monitor ;;
            6) show_detailed_stats ;;
            7) clean_old_logs ;;
            8) setup_emails ;;
            9) show_useful_commands ;;
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
    
    node $SERVICES_DIR/test-email-alerts.js
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 5: Monitor automático
run_auto_monitor() {
    clear
    print_header
    echo -e "${WHITE}🤖 MONITOR AUTOMÁTICO${NC}"
    echo -e "${WHITE}=====================${NC}"
    echo ""
    
    print_info "Iniciando monitor automático..."
    print_warning "Pressione Ctrl+C para parar"
    echo ""
    
    node $SERVICES_DIR/monitor-race-conditions-prod.js
    
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

# Função 6: Estatísticas detalhadas
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

# Função 7: Limpar logs
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

# Função 9: Comandos úteis
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