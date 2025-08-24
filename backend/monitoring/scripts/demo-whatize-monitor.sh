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

print_header() {
    clear
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

# Demo do menu principal
demo_menu() {
    print_header
    echo -e "${WHITE}🎛️  PAINEL DE MONITORAMENTO${NC}"
    echo -e "${WHITE}===========================${NC}"
    echo ""
    
    # Status simulado
    print_success "Backend: Online (porta 4000)"
    print_warning "Emails: Modo simulação"
    
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
    
    echo -e "${GREEN}🎉 DEMO: Este é o menu principal que aparecerá!${NC}"
    echo -e "${BLUE}   O usuário digita o número da opção desejada.${NC}"
    echo ""
}

# Demo da configuração de emails
demo_email_setup() {
    print_header
    echo -e "${WHITE}🔧 CONFIGURAÇÃO DE EMAILS PARA ALERTAS${NC}"
    echo -e "${WHITE}=======================================${NC}"
    echo ""
    
    print_info "Vamos configurar o sistema de emails para receber alertas automáticos."
    echo ""
    
    echo -e "${YELLOW}📧 ESCOLHA SEU PROVEDOR DE EMAIL:${NC}"
    echo "1. Gmail (Recomendado)"
    echo "2. Outlook/Hotmail"
    echo "3. Outro provedor"
    echo "4. Pular configuração de emails"
    echo ""
    
    echo -e "${GREEN}🎉 DEMO: Aqui o usuário escolheria o provedor!${NC}"
    echo -e "${BLUE}   Se escolher Gmail, o script guiará passo a passo.${NC}"
    echo ""
}

# Demo da configuração Gmail
demo_gmail_setup() {
    print_header
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
    
    echo -e "${GREEN}🎉 DEMO: O script explicaria como configurar!${NC}"
    echo -e "${BLUE}   Depois pediria: Digite seu email Gmail:${NC}"
    echo -e "${BLUE}   E depois: Digite a senha de app (16 caracteres):${NC}"
    echo ""
}

# Demo do status do sistema
demo_system_status() {
    print_header
    echo -e "${WHITE}📊 STATUS GERAL DO SISTEMA${NC}"
    echo -e "${WHITE}===========================${NC}"
    echo ""
    
    print_step "Consultando API..."
    echo ""
    
    # Simular resposta da API
    echo -e "${GREEN}{"
    echo "  \"raceConditions\": {"
    echo "    \"totalErrors\": 0,"
    echo "    \"todayErrors\": 0,"
    echo "    \"lastError\": null"
    echo "  },"
    echo "  \"contactCache\": {"
    echo "    \"hitRate\": \"95%\","
    echo "    \"totalRequests\": 1250"
    echo "  },"
    echo "  \"system\": {"
    echo "    \"uptime\": 3600,"
    echo "    \"memoryUsage\": {"
    echo "      \"heapUsed\": \"116.55 MB\""
    echo "    }"
    echo "  }"
    echo "}${NC}"
    echo ""
    
    echo -e "${GREEN}🎉 DEMO: Assim apareceria o status real!${NC}"
    echo ""
}

# Demo principal
main_demo() {
    echo -e "${CYAN}🚀 DEMONSTRAÇÃO DO WHATIZE MONITOR${NC}"
    echo -e "${CYAN}===================================${NC}"
    echo ""
    
    print_info "Esta é uma demonstração de como funcionará o script completo!"
    echo ""
    
    echo "Pressione Enter para ver cada tela..."
    read
    
    # Menu principal
    demo_menu
    read
    
    # Configuração de emails
    demo_email_setup
    read
    
    # Configuração Gmail
    demo_gmail_setup
    read
    
    # Status do sistema
    demo_system_status
    read
    
    # Finalização
    print_header
    echo -e "${WHITE}🎯 RESUMO DO QUE O SCRIPT FAZ:${NC}"
    echo -e "${WHITE}=============================${NC}"
    echo ""
    
    print_success "1. Verifica se o backend está rodando"
    print_success "2. Configura emails passo a passo (Gmail, Outlook, etc.)"
    print_success "3. Testa a configuração automaticamente"
    print_success "4. Oferece menu interativo com 10 opções"
    print_success "5. Monitora logs em tempo real"
    print_success "6. Mostra estatísticas detalhadas"
    print_success "7. Limpa logs antigos"
    print_success "8. Executa monitor automático"
    
    echo ""
    echo -e "${CYAN}📋 COMO USAR O SCRIPT REAL:${NC}"
    echo ""
    echo -e "${YELLOW}./whatize-monitor.sh${NC}  # Executa o script completo"
    echo ""
    
    echo -e "${GREEN}🎉 O script está pronto para uso em produção!${NC}"
    echo -e "${BLUE}   Ele guiará o usuário em cada etapa automaticamente.${NC}"
    echo ""
}

# Executar demo
main_demo 