# 📧 Configuração de Emails para Alertas - Sistema Whatize

## 📋 **Resumo da Situação Atual**

✅ **O que já está funcionando:**
- Sistema de monitoramento de race conditions implementado
- Alertas sendo detectados e logados
- Email de destino configurado: `wallefeduardo@gmail.com`
- Sistema funcionando em **modo simulação**

⚠️ **O que precisa ser configurado:**
- Configurações SMTP para envio real de emails
- Credenciais do servidor de email (Gmail recomendado)

## 🚀 **Configuração Rápida (Gmail)**

### **Passo 1: Preparar sua conta Gmail**

1. **Ativar Autenticação de 2 Fatores:**
   - Acesse: https://myaccount.google.com/security
   - Ative a "Verificação em duas etapas"

2. **Gerar Senha de App:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" → "Outro (nome personalizado)"
   - Digite: "Whatize Alertas"
   - **COPIE A SENHA GERADA** (16 caracteres)

### **Passo 2: Configurar o .env**

Edite o arquivo `backend/.env` e descomente/configure:

```bash
# Configuração do SMTP (ATIVAR PARA EMAILS REAIS)
MAIL_HOST=smtp.gmail.com
MAIL_USER=wallefeduardo@gmail.com
MAIL_PASS=sua-senha-de-app-de-16-caracteres
MAIL_FROM=wallefeduardo@gmail.com
MAIL_PORT=465

# Email para receber alertas (já configurado)
ALERT_EMAIL=wallefeduardo@gmail.com
SERVER_NAME=servidor-producao
```

### **Passo 3: Testar a Configuração**

```bash
# Testar sistema de emails
node test-email-alerts.js

# Se funcionou, testar monitor completo
node monitor-race-conditions-prod.js
```

## 🔧 **Configuração Detalhada**

### **Opção 1: Gmail (Recomendado)**
```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=wallefeduardo@gmail.com
MAIL_PASS=abcd efgh ijkl mnop  # Senha de app (16 caracteres)
MAIL_FROM=wallefeduardo@gmail.com
```

### **Opção 2: Outlook/Hotmail**
```bash
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USER=seu-email@outlook.com
MAIL_PASS=sua-senha-normal
MAIL_FROM=seu-email@outlook.com
```

### **Opção 3: Servidor SMTP Personalizado**
```bash
MAIL_HOST=mail.seudominio.com
MAIL_PORT=465
MAIL_USER=alertas@seudominio.com
MAIL_PASS=sua-senha
MAIL_FROM=alertas@seudominio.com
```

## 🧪 **Testando a Configuração**

### **Teste Básico**
```bash
node test-email-alerts.js
```

**Resultado Esperado:**
```
✅ Configuração SMTP carregada com sucesso
✅ Conexão SMTP testada com sucesso
✅ Email enviado com sucesso para: wallefeduardo@gmail.com
   Message ID: <id-da-mensagem>
✅ TESTE CONCLUÍDO COM SUCESSO!
```

### **Teste com Monitor Real**
```bash
# Executar por 1 minuto para testar
timeout 60 node monitor-race-conditions-prod.js
```

## 📨 **Exemplo de Email de Alerta**

Quando configurado, você receberá emails como este:

**Assunto:** 🚨 ALERTA: HIGH_ERROR_RATE - servidor-producao

**Conteúdo:**
```
🚨 ALERTA DO SISTEMA WHATIZE

Detalhes do Alerta:
Tipo: HIGH_ERROR_RATE
Servidor: servidor-producao
Mensagem: 8 erros detectados hoje
Data/Hora: 16/06/2025, 13:30:45

Ações Recomendadas:
- Verificar status: curl http://localhost:4000/race-conditions/stats
- Ver logs: tail -f backend/logs/race_conditions.log
- Investigar erros: grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | tail -10
```

## 🚨 **Tipos de Alertas Enviados**

1. **HIGH_ERROR_RATE** - Mais de 5 erros por hora
2. **LOW_CACHE_PERFORMANCE** - Taxa de cache abaixo de 20%
3. **HIGH_MEMORY_USAGE** - Uso de memória acima de 500MB
4. **BACKEND_DOWN** - Backend não está respondendo

## 🔍 **Troubleshooting**

### **Erro: "Invalid login"**
- Verifique se a autenticação de 2 fatores está ativa
- Confirme se está usando a senha de app, não a senha normal
- Teste com outro email se necessário

### **Erro: "Connection timeout"**
- Verifique sua conexão com a internet
- Teste com MAIL_PORT=587 em vez de 465
- Verifique se o firewall não está bloqueando

### **Email não chega**
- Verifique a pasta de spam
- Confirme se o MAIL_FROM está correto
- Teste enviando para outro email

### **Modo Simulação Permanente**
```bash
# Verificar se todas as variáveis estão configuradas
grep -E "MAIL_|ALERT_" backend/.env

# Deve mostrar:
# MAIL_HOST=smtp.gmail.com
# MAIL_USER=wallefeduardo@gmail.com
# MAIL_PASS=sua-senha-de-app
# MAIL_FROM=wallefeduardo@gmail.com
# MAIL_PORT=465
# ALERT_EMAIL=wallefeduardo@gmail.com
```

## 📊 **Monitoramento Contínuo**

### **Executar Monitor em Background**
```bash
# Desenvolvimento
nohup node monitor-race-conditions-prod.js > monitor.log 2>&1 &

# Produção (com PM2)
pm2 start monitor-race-conditions-prod.js --name "race-monitor"
pm2 logs race-monitor
```

### **Verificar Status dos Alertas**
```bash
# Ver alertas enviados
tail -f alerts.log

# Contar alertas do dia
grep "$(date +%Y-%m-%d)" alerts.log | wc -l

# Ver últimos alertas
tail -5 alerts.log | jq .
```

## 🎯 **Próximos Passos**

1. **Configure o Gmail** seguindo o Passo 1 e 2
2. **Teste** com `node test-email-alerts.js`
3. **Execute o monitor** por alguns minutos
4. **Verifique** se recebeu o email de teste
5. **Deixe rodando** em background para monitoramento contínuo

## 📞 **Suporte**

Se tiver problemas:
1. Execute `node test-email-alerts.js` e copie a saída
2. Verifique o arquivo `backend/.env` (sem mostrar senhas)
3. Teste com outro provedor de email se necessário

---

**Status Atual:** ⚠️ Modo Simulação (SMTP não configurado)
**Objetivo:** ✅ Emails reais funcionando
**Tempo Estimado:** 10-15 minutos 