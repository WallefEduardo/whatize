#!/bin/bash

echo "📧 CONFIGURAÇÃO RÁPIDA DE EMAILS - SISTEMA WHATIZE"
echo "=================================================="
echo ""

# Verificar se o .env existe
if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo backend/.env não encontrado!"
    exit 1
fi

echo "📋 Status atual das configurações SMTP:"
echo "========================================"
grep -E "^#.*MAIL_|^MAIL_" backend/.env || echo "Nenhuma configuração SMTP encontrada"
echo ""

echo "🎯 OPÇÕES DE CONFIGURAÇÃO:"
echo "========================="
echo "1. Gmail (Recomendado)"
echo "2. Outlook/Hotmail"
echo "3. Configuração manual"
echo "4. Apenas testar configuração atual"
echo "5. Sair"
echo ""

read -p "Escolha uma opção (1-5): " opcao

case $opcao in
    1)
        echo ""
        echo "📧 CONFIGURAÇÃO GMAIL"
        echo "===================="
        echo ""
        echo "⚠️ IMPORTANTE: Antes de continuar, você precisa:"
        echo "1. Ativar autenticação de 2 fatores no Gmail"
        echo "2. Gerar uma senha de app em: https://myaccount.google.com/apppasswords"
        echo ""
        read -p "Já fez isso? (s/n): " confirmacao
        
        if [ "$confirmacao" != "s" ] && [ "$confirmacao" != "S" ]; then
            echo "❌ Configure primeiro a autenticação de 2 fatores e senha de app."
            echo "🔗 Guia: https://support.google.com/accounts/answer/185833"
            exit 1
        fi
        
        echo ""
        read -p "Digite seu email Gmail: " gmail_user
        read -p "Digite a senha de app (16 caracteres): " gmail_pass
        
        # Backup do .env atual
        cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
        
        # Remover configurações SMTP antigas comentadas
        sed -i '/^# MAIL_/d' backend/.env
        
        # Adicionar novas configurações
        echo "" >> backend/.env
        echo "# Configuração SMTP Gmail (Ativado)" >> backend/.env
        echo "MAIL_HOST=smtp.gmail.com" >> backend/.env
        echo "MAIL_PORT=465" >> backend/.env
        echo "MAIL_USER=$gmail_user" >> backend/.env
        echo "MAIL_PASS=$gmail_pass" >> backend/.env
        echo "MAIL_FROM=$gmail_user" >> backend/.env
        
        echo ""
        echo "✅ Configuração Gmail salva!"
        ;;
        
    2)
        echo ""
        echo "📧 CONFIGURAÇÃO OUTLOOK"
        echo "======================"
        echo ""
        read -p "Digite seu email Outlook: " outlook_user
        read -p "Digite sua senha: " outlook_pass
        
        # Backup do .env atual
        cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
        
        # Remover configurações SMTP antigas comentadas
        sed -i '/^# MAIL_/d' backend/.env
        
        # Adicionar novas configurações
        echo "" >> backend/.env
        echo "# Configuração SMTP Outlook (Ativado)" >> backend/.env
        echo "MAIL_HOST=smtp-mail.outlook.com" >> backend/.env
        echo "MAIL_PORT=587" >> backend/.env
        echo "MAIL_USER=$outlook_user" >> backend/.env
        echo "MAIL_PASS=$outlook_pass" >> backend/.env
        echo "MAIL_FROM=$outlook_user" >> backend/.env
        
        echo ""
        echo "✅ Configuração Outlook salva!"
        ;;
        
    3)
        echo ""
        echo "🔧 CONFIGURAÇÃO MANUAL"
        echo "====================="
        echo ""
        read -p "SMTP Host: " smtp_host
        read -p "SMTP Port (465 ou 587): " smtp_port
        read -p "Email/Username: " smtp_user
        read -p "Senha: " smtp_pass
        read -p "Email From: " smtp_from
        
        # Backup do .env atual
        cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
        
        # Remover configurações SMTP antigas comentadas
        sed -i '/^# MAIL_/d' backend/.env
        
        # Adicionar novas configurações
        echo "" >> backend/.env
        echo "# Configuração SMTP Manual (Ativado)" >> backend/.env
        echo "MAIL_HOST=$smtp_host" >> backend/.env
        echo "MAIL_PORT=$smtp_port" >> backend/.env
        echo "MAIL_USER=$smtp_user" >> backend/.env
        echo "MAIL_PASS=$smtp_pass" >> backend/.env
        echo "MAIL_FROM=$smtp_from" >> backend/.env
        
        echo ""
        echo "✅ Configuração manual salva!"
        ;;
        
    4)
        echo ""
        echo "🧪 TESTANDO CONFIGURAÇÃO ATUAL"
        echo "=============================="
        ;;
        
    5)
        echo "👋 Saindo..."
        exit 0
        ;;
        
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "🧪 EXECUTANDO TESTE..."
echo "====================="
echo ""

# Executar teste
if command -v node &> /dev/null; then
    node test-email-alerts.js
else
    echo "❌ Node.js não encontrado!"
    exit 1
fi

echo ""
echo "📊 CONFIGURAÇÕES FINAIS:"
echo "======================="
echo "Email de destino: $(grep ALERT_EMAIL backend/.env | cut -d'=' -f2)"
echo "Servidor: $(grep SERVER_NAME backend/.env | cut -d'=' -f2)"
echo ""

echo "🎯 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Se o teste passou, os emails estão funcionando!"
echo "2. Execute: node monitor-race-conditions-prod.js"
echo "3. Deixe rodando em background para monitoramento contínuo"
echo ""

echo "📚 DOCUMENTAÇÃO COMPLETA:"
echo "========================"
echo "Ver: docsBaileys/CONFIGURACAO_EMAILS_ALERTAS.md"
echo ""

echo "✅ Configuração concluída!" 