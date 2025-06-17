# 📊 Guia de Monitoramento - Race Conditions

## 🎯 **Resumo Executivo**

O sistema de monitoramento funciona **automaticamente** tanto em desenvolvimento quanto em produção. Você **NÃO precisa ficar de olho 24h** - o sistema salva tudo em arquivos e pode enviar alertas automáticos.

## ⚡ **COMANDOS ESSENCIAIS - Use Estes Diariamente**

### **🔍 Verificação Rápida (30 segundos)**
```bash
# 1. Status geral do sistema
curl http://localhost:4000/race-conditions/stats

# 2. Quantos erros hoje?
grep "$(date +%d/%m/%Y)" backend/logs/race_conditions.log | grep "CONSTRAINT_ERROR" | wc -l

# 3. Sistema funcionando?
node test-race-conditions-dev.js
```

### **🚨 Se Houver Problemas**
```bash
# Ver últimos erros
tail -20 backend/logs/race_conditions.log

# Monitorar em tempo real
tail -f backend/logs/race_conditions.log
```

### **📧 Configurar Alertas (Uma vez só)**
```bash
# Editar .env e descomentar:
# ALERT_EMAIL=seu-email@empresa.com
# ALERT_WEBHOOK=sua-url-do-slack
```

## 📁 **Onde os Erros São Salvos**

### **Arquivo Principal de Logs**
```bash
backend/logs/race_conditions.log
```

### **Formato dos Logs**
```json
{
  "timestamp": "16/06/2025 13:15:30.123",
  "type": "CONSTRAINT_ERROR",
  "contact": "5571999999999@company1",
  "whatsappId": 15,
  "error": "SequelizeUniqueConstraintError: number_companyid_unique",
  "retryCount": 2,
  "duration": "150ms"
}
```

### **Tipos de Logs Capturados**
- 🚨 **CONSTRAINT_ERROR**: Erros de constraint única
- ⏳ **MUTEX_WAIT**: Tempo de espera do mutex
- 🔄 **RETRY_ATTEMPT**: Tentativas de retry
- ✅ **SUCCESS_AFTER_RETRY**: Sucesso após retry
- 📝 **CONTACT_CREATION**: Criação/atualização de contatos
- 📡 **BAILEYS_EVENT**: Eventos do Baileys

## 🔧 **Comandos Mais Frequentes para Monitoramento**

### **📊 COMANDOS DIÁRIOS (Use estes com mais frequência)**

#### **1. Verificar Status Geral (MAIS IMPORTANTE)**
```bash
# Desenvolvimento
curl http://localhost:4000/race-conditions/stats

# Produção (se tiver autenticação)
curl -H "Authorization: Bearer SEU_TOKEN" https://seu-dominio.com/race-conditions/stats
```
**Use:** Diariamente ou quando suspeitar de problemas

#### **2. Ver Logs em Tempo Real**
```bash
tail -f backend/logs/race_conditions.log
```
**Use:** Quando há problemas ou para acompanhar atividade

#### **3. Teste Rápido do Sistema**
```bash
node test-race-conditions-dev.js
```
**Use:** Após mudanças no código ou semanalmente

### **🚨 COMANDOS PARA INVESTIGAÇÃO DE PROBLEMAS**

#### **4. Contar Erros de Hoje**
```bash
grep "$(date +%d/%m/%Y)" backend/logs/race_conditions.log | grep "CONSTRAINT_ERROR" | wc -l
```
**Use:** Quando suspeitar de muitos erros

#### **5. Ver Últimos 10 Erros**
```bash
grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | tail -10
```
**Use:** Para investigar problemas específicos

#### **6. Verificar Contatos Problemáticos**
```bash
grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | grep -o '"contact":"[^"]*"' | sort | uniq -c | sort -nr | head -5
```
**Use:** Para identificar contatos que causam mais problemas

### **🔄 COMANDOS DE MANUTENÇÃO (Semanais/Mensais)**

#### **7. Limpar Logs Antigos**
```bash
curl -X DELETE http://localhost:4000/race-conditions/logs?days=7
```
**Use:** Mensalmente para manter logs organizados

#### **8. Verificar Tamanho dos Logs**
```bash
ls -lh backend/logs/race_conditions.log
```
**Use:** Semanalmente para controlar espaço em disco

### **🤖 COMANDOS DE MONITORAMENTO AUTOMÁTICO**

#### **9. Monitor Contínuo (Desenvolvimento)**
```bash
node monitor-race-conditions.js
```
**Use:** Deixar rodando em background durante desenvolvimento

#### **10. Monitor Contínuo (Produção)**
```bash
# Iniciar com PM2 (recomendado)
pm2 start monitor-race-conditions-prod.js --name "race-monitor"

# Ou em background simples
nohup node monitor-race-conditions-prod.js > monitor.log 2>&1 &
```
**Use:** Sempre em produção para monitoramento 24/7

## 🚀 **Deploy em Produção**

### **1. Subir o Código**
```bash
# Fazer deploy do código com as correções
git add .
git commit -m "feat: sistema de monitoramento race conditions"
git push origin main

# No servidor de produção
git pull origin main
npm install
```

### **2. Configurar Variáveis de Ambiente**
```bash
# No servidor de produção, adicionar ao .env:
NODE_ENV=production
BACKEND_URL=https://seu-dominio.com
ALERT_EMAIL=admin@empresa.com
ALERT_WEBHOOK=https://hooks.slack.com/services/...
SERVER_NAME=servidor-producao
```

### **3. Iniciar Monitor Automático**
```bash
# Opção 1: Rodar em background
nohup node monitor-race-conditions-prod.js > monitor.log 2>&1 &

# Opção 2: Com PM2 (recomendado)
pm2 start monitor-race-conditions-prod.js --name "race-condition-monitor"
pm2 save
pm2 startup
```

## 📈 **Dashboard de Monitoramento**

### **API Endpoints Disponíveis**
```bash
GET /race-conditions/stats          # Estatísticas gerais
DELETE /race-conditions/cache/:id   # Limpar cache
DELETE /race-conditions/logs        # Limpar logs antigos
POST /race-conditions/cache/preload # Pré-carregar cache
```

### **Exemplo de Resposta da API**
```json
{
  "timestamp": "2025-06-16T16:15:30.123Z",
  "raceConditions": {
    "totalErrors": 0,
    "todayErrors": 0,
    "lastError": null
  },
  "contactCache": {
    "keys": 150,
    "hits": 1250,
    "misses": 45,
    "hitRate": "96.5%",
    "memoryUsage": "25.3 MB"
  },
  "system": {
    "uptime": 3600,
    "memoryUsage": {
      "rss": "180.5 MB",
      "heapUsed": "120.3 MB",
      "heapTotal": "150.8 MB"
    }
  }
}
```

## 🚨 **Sistema de Alertas Automáticos**

### **Alertas Configurados**
- **HIGH_ERROR_RATE**: Mais de 5 erros por hora
- **LOW_CACHE_PERFORMANCE**: Taxa de cache abaixo de 20%
- **HIGH_MEMORY_USAGE**: Uso de memória acima de 500MB
- **BACKEND_DOWN**: Backend não está respondendo

### **📧 Configurar Notificações de Alerta**

#### **ALERT_EMAIL - Notificações por Email**
```bash
# No arquivo .env, descomente e configure:
ALERT_EMAIL=seu-email@empresa.com
```
**O que é:** O email que vai receber alertas quando há problemas
**Quando usar:** Configure com seu email ou da equipe de TI
**Exemplo:** `ALERT_EMAIL=admin@whatize.com`

#### **ALERT_WEBHOOK - Notificações Slack/Discord**
```bash
# No arquivo .env, descomente e configure:
ALERT_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```
**O que é:** URL do webhook para enviar alertas para Slack, Discord ou Teams
**Como obter:**
- **Slack:** Apps → Incoming Webhooks → Add to Slack
- **Discord:** Server Settings → Integrations → Webhooks → New Webhook
- **Teams:** Connectors → Incoming Webhook

#### **SERVER_NAME - Identificação do Servidor**
```bash
# No arquivo .env, descomente e configure:
SERVER_NAME=servidor-producao-whatize
```
**O que é:** Nome para identificar qual servidor enviou o alerta
**Exemplo:** `SERVER_NAME=producao-sp` ou `SERVER_NAME=desenvolvimento`

## 📊 **Análise de Logs**

### **Comandos Úteis para Análise**
```bash
# Ver últimos 50 erros
tail -n 50 backend/logs/race_conditions.log

# Contar erros por tipo
grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | wc -l

# Ver erros de hoje
grep "$(date +%d/%m/%Y)" backend/logs/race_conditions.log

# Ver contatos com mais problemas
grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | grep -o '"contact":"[^"]*"' | sort | uniq -c | sort -nr

# Ver empresas com mais problemas
grep "company" backend/logs/race_conditions.log | grep -o 'company[0-9]*' | sort | uniq -c | sort -nr
```

### **Limpeza Automática de Logs**
```bash
# Limpar logs antigos (manter últimos 7 dias)
curl -X DELETE http://localhost:4000/race-conditions/logs?days=7

# Ou via script
node -e "
const fs = require('fs');
const path = require('path');
const logFile = 'backend/logs/race_conditions.log';
if (fs.existsSync(logFile)) {
  const stats = fs.statSync(logFile);
  console.log('Tamanho do log:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
}
"
```

## 🔍 **Troubleshooting**

### **Problema: API não responde**
```bash
# Verificar se backend está rodando
curl http://localhost:4000/race-conditions/stats

# Se retornar erro de autenticação em produção:
curl -H "Authorization: Bearer SEU_TOKEN" https://seu-dominio.com/race-conditions/stats
```

### **Problema: Logs não são criados**
```bash
# Verificar permissões da pasta
ls -la backend/logs/

# Criar pasta se não existir
mkdir -p backend/logs
chmod 755 backend/logs
```

### **Problema: Monitor não inicia**
```bash
# Verificar dependências
npm list axios

# Instalar se necessário
npm install axios

# Verificar se backend está respondendo
node -e "
const axios = require('axios');
axios.get('http://localhost:4000/race-conditions/stats')
  .then(r => console.log('✅ Backend OK'))
  .catch(e => console.log('❌ Backend não responde:', e.message));
"
```

## 📋 **Checklist de Deploy**

### **Desenvolvimento ✅**
- [x] API funcionando em `http://localhost:4000/race-conditions/stats`
- [x] Logs sendo salvos em `backend/logs/race_conditions.log`
- [x] Monitor de desenvolvimento funcionando
- [x] Testes passando

### **Produção**
- [ ] Código deployado no servidor
- [ ] Variáveis de ambiente configuradas
- [ ] Monitor de produção iniciado
- [ ] Alertas configurados (email/webhook)
- [ ] Logs sendo gerados
- [ ] API respondendo com autenticação

## 🎯 **Resumo: Você NÃO Precisa Ficar de Olho 24h**

### **O Sistema Funciona Automaticamente:**
1. **Logs Automáticos**: Todos os erros são salvos em `backend/logs/race_conditions.log`
2. **Monitor Contínuo**: Script roda em background verificando a cada 30 segundos
3. **Alertas Automáticos**: Notificações por email/Slack quando há problemas
4. **API de Consulta**: Você pode verificar estatísticas quando quiser

### **Quando Verificar Manualmente:**
- **Semanalmente**: Rodar `curl http://localhost:4000/race-conditions/stats`
- **Após Problemas**: Verificar logs com `tail -f backend/logs/race_conditions.log`
- **Manutenção**: Limpar logs antigos mensalmente

### **O Sistema Te Avisa Quando Há Problemas:**
- 🚨 Mais de 5 erros por hora → Alerta automático
- 📧 Email/Slack configurado → Notificação imediata
- 📁 Logs salvos → Histórico completo para análise

**🎉 Resultado: Sistema robusto, monitorado e que funciona sozinho!** 