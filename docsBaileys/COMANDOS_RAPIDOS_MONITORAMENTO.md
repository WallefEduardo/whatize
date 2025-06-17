# ⚡ Comandos Rápidos - Monitoramento Race Conditions

## 🔥 **COMANDOS DIÁRIOS (Cole no terminal)**

### **1. Status Geral (MAIS IMPORTANTE)**
```bash
curl http://localhost:4000/race-conditions/stats
```

### **2. Quantos Erros Hoje?**
```bash
grep "$(date +%d/%m/%Y)" backend/logs/race_conditions.log | grep "CONSTRAINT_ERROR" | wc -l
```

### **3. Teste Rápido**
```bash
node test-race-conditions-dev.js
```

### **4. Testar Emails (Se configurado)**
```bash
node test-email-alerts.js
```

## 🚨 **SE HOUVER PROBLEMAS**

### **Ver Últimos Erros**
```bash
tail -20 backend/logs/race_conditions.log
```

### **Monitorar em Tempo Real**
```bash
tail -f backend/logs/race_conditions.log
```

### **Contatos Problemáticos**
```bash
grep "CONSTRAINT_ERROR" backend/logs/race_conditions.log | grep -o '"contact":"[^"]*"' | sort | uniq -c | sort -nr | head -5
```

## 🔧 **MANUTENÇÃO SEMANAL**

### **Limpar Logs Antigos**
```bash
curl -X DELETE http://localhost:4000/race-conditions/logs?days=7
```

### **Verificar Tamanho dos Logs**
```bash
ls -lh backend/logs/race_conditions.log
```

## 📧 **CONFIGURAR ALERTAS (Uma vez só)**

### **Configuração Automática**
```bash
# Script interativo para configurar emails
./setup-email-alerts.sh
```

### **Ou Editar .env Manualmente**
```bash
# Configurar SMTP no arquivo .env:
MAIL_HOST=smtp.gmail.com
MAIL_USER=seu-email@gmail.com
MAIL_PASS=sua-senha-de-app
MAIL_FROM=seu-email@gmail.com
MAIL_PORT=465

# Email de destino e servidor
ALERT_EMAIL=seu-email@empresa.com
SERVER_NAME=servidor-producao
```

### **Iniciar Monitor Automático**
```bash
# Desenvolvimento
node monitor-race-conditions.js &

# Produção
pm2 start monitor-race-conditions-prod.js --name "race-monitor"
```

## 📊 **INTERPRETAÇÃO DOS RESULTADOS**

### **Status API - O que significa:**
- `"totalErrors": 0` = ✅ Sem problemas
- `"todayErrors": 0` = ✅ Dia tranquilo
- `"hitRate": "95%"` = ✅ Cache funcionando bem
- `"hitRate": "20%"` = ⚠️ Cache com problemas

### **Logs - O que procurar:**
- `CONSTRAINT_ERROR` = 🚨 Erro de constraint única
- `SUCCESS_AFTER_RETRY` = ✅ Sistema se recuperou
- `MUTEX_WAIT` = ⏳ Sistema esperando (normal)

## 🎯 **RESUMO: Use Estes 3 Comandos Diariamente**

```bash
# 1. Status geral
curl http://localhost:4000/race-conditions/stats

# 2. Erros de hoje
grep "$(date +%d/%m/%Y)" backend/logs/race_conditions.log | grep "CONSTRAINT_ERROR" | wc -l

# 3. Se resultado > 0, investigar:
tail -20 backend/logs/race_conditions.log
```

**🎉 Se os 3 comandos mostrarem tudo OK, seu sistema está funcionando perfeitamente!** 