# 🏷️ Como Personalizar o Nome do Servidor nos Alertas

## 🎯 **Personalização Rápida**

### **Opção 1: Script Interativo (Recomendado)**
```bash
cd backend
./configurar-nome-servidor.sh
```

### **Opção 2: Editar .env Manualmente**
```bash
# No arquivo .env, altere a linha:
SERVER_NAME=Seu Nome Personalizado Aqui
```

---

## 💡 **Exemplos de Nomes Personalizados**

### **Para Produção:**
- `TalkZap Produção - ZMaxSys`
- `WhatsApp Server - Empresa ABC`
- `Servidor Principal - Filial SP`

### **Para Desenvolvimento:**
- `TalkZap DEV - Testes`
- `Ambiente Desenvolvimento`
- `Server Teste - Dev Team`

### **Para Múltiplos Servidores:**
- `TalkZap Prod - Server 01`
- `TalkZap Prod - Server 02`
- `TalkZap Backup - Server 03`

---

## 📧 **Como Aparece nos Emails**

### **ANTES:**
```
Assunto: 🚨 ALERTA: LOW_CACHE_PERFORMANCE - TalkZap Server
```

### **DEPOIS:**
```
Assunto: 🚨 ALERTA: LOW_CACHE_PERFORMANCE - TalkZap Produção - ZMaxSys
```

---

## 🔄 **Aplicar Mudanças**

Após alterar o nome, você precisa **reiniciar o monitor**:

```bash
# Opção 1: Script automatizado
./restart-monitor-with-optimized-alerts.sh

# Opção 2: Manual
kill $(pgrep -f "monitor-race-conditions-prod.js")
nohup node monitoring/services/monitor-race-conditions-prod.js > logs/monitor-production.log 2>&1 &
```

---

## ✅ **Configuração Atual**

```bash
# Ver nome atual configurado:
grep "^SERVER_NAME=" .env

# Ver se monitor está rodando:
pgrep -f "monitor-race-conditions-prod.js"
```

---

## 🚨 **Status dos Alertas**

Observo que você ainda está recebendo alguns alertas. Vamos verificar se as otimizações estão ativas:

1. **Execute para personalizar o nome:**
   ```bash
   ./configurar-nome-servidor.sh
   ```

2. **Execute para aplicar otimizações:**
   ```bash
   ./restart-monitor-with-optimized-alerts.sh
   ```

3. **Verifique os logs:**
   ```bash
   tail -f logs/monitor-production.log
   ```

---

## 🎉 **Resultado Final**

- ✅ Nome personalizado nos emails
- ✅ Alertas otimizados (menos spam)
- ✅ Fácil identificação do servidor
- ✅ Configuração persistente 