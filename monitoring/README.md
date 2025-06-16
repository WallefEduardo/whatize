# 🎛️ Whatize Monitor v2.0

Sistema completo de monitoramento para Race Conditions no Whatize.

## 📁 Estrutura Organizada

```
monitoring/
├── scripts/                   # Scripts executáveis
│   ├── whatize-monitor.sh    # 🎛️ Painel principal
│   ├── setup-email-alerts.sh # 📧 Configuração de emails
│   └── demo-whatize-monitor.sh # 🎬 Demonstração
├── services/                  # Serviços Node.js
│   ├── emailSender.js        # 📧 Sistema de envio de emails
│   ├── monitor-race-conditions-prod.js # 🤖 Monitor automático
│   └── test-email-alerts.js  # 🧪 Teste de emails
├── tests/                     # Scripts de teste
│   └── test-race-conditions-dev.js # 🧪 Testes de desenvolvimento
├── logs/                      # Logs específicos do monitor
│   └── alerts.log            # 📝 Log de alertas
└── README.md                  # 📚 Esta documentação
```

## 🚀 Como Usar

### **Método 1: Script de Inicialização (Recomendado)**
```bash
# Da raiz do projeto Whatize
./start-monitor.sh
```

### **Método 2: Execução Direta**
```bash
# Entrar na pasta de scripts
cd monitoring/scripts

# Executar o monitor principal
./whatize-monitor.sh
```

## 🎯 Funcionalidades

### **Painel Principal (whatize-monitor.sh)**
- ✅ Interface colorida e intuitiva
- 📊 Status em tempo real do sistema
- 📧 Configuração automática de emails
- 🔍 Monitoramento de logs
- 🚨 Visualização de erros
- 📋 Estatísticas detalhadas
- 🧹 Limpeza de logs

### **Sistema de Emails**
- 📧 Suporte a Gmail, Outlook e provedores personalizados
- 🤖 Alertas automáticos por email
- 🧪 Teste de configuração
- 🔄 Modo simulação quando SMTP não configurado

### **Monitor Automático**
- 🤖 Monitoramento contínuo (30s)
- 📊 Métricas em tempo real
- 🚨 Alertas automáticos
- 📈 Análise de performance

## 📧 Configuração de Emails

### **Gmail (Recomendado)**
1. Ative autenticação de 2 fatores
2. Gere uma senha de app: https://myaccount.google.com/apppasswords
3. Use a senha de app no MAIL_PASS

### **Outlook**
1. Use seu email e senha normais
2. Pode precisar ativar "Aplicativos menos seguros"

### **Configuração Manual no .env**
```bash
# Configurações SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=seu-email@gmail.com
MAIL_PASS=sua-senha-de-app
MAIL_FROM=seu-email@gmail.com

# Email para receber alertas
ALERT_EMAIL=admin@empresa.com
```

## 🔧 Comandos Úteis

```bash
# Ver status geral
curl http://localhost:4000/race-conditions/stats

# Testar emails
node monitoring/services/test-email-alerts.js

# Monitor automático
node monitoring/services/monitor-race-conditions-prod.js

# Ver logs em tempo real
tail -f ../backend/logs/race_conditions.log

# Contar erros de hoje
grep "$(date +%d/%m/%Y)" ../backend/logs/race_conditions.log | grep "CONSTRAINT_ERROR" | wc -l
```

## 🛠️ Manutenção

### **Backup do .env**
```bash
cp ../backend/.env ../backend/.env.backup.$(date +%Y%m%d_%H%M%S)
```

### **Limpeza de Logs**
```bash
# Limpar logs antigos (manter 7 dias)
find ../backend/logs/ -name "*.log" -mtime +7 -delete

# Limpar tudo
> ../backend/logs/race_conditions.log
```

### **Verificar Configurações**
```bash
grep -E "MAIL_|ALERT_" ../backend/.env
```

## 🚨 Solução de Problemas

### **Backend não responde**
```bash
# Verificar se está rodando
curl http://localhost:4000/race-conditions/stats

# Iniciar backend
cd ../backend && npm run dev
```

### **Emails não funcionam**
1. Verifique configurações SMTP no .env
2. Teste com: `node services/test-email-alerts.js`
3. Para Gmail, use senha de app, não senha normal

### **Logs não aparecem**
1. Execute algumas operações no sistema
2. Verifique se o backend está processando mensagens
3. Logs ficam em: `../backend/logs/race_conditions.log`

## 📊 Métricas Monitoradas

- **Erros de Constraint**: `SequelizeUniqueConstraintError`
- **Performance do Cache**: Taxa de hit/miss
- **Uso de Memória**: Consumo do processo Node.js
- **Uptime**: Tempo de funcionamento
- **Conexões WhatsApp**: Status das conexões

## 🎯 Alertas Automáticos

O sistema envia alertas por email quando:
- ❌ Mais de 5 erros por hora
- 📉 Taxa de cache abaixo de 50%
- 💾 Uso de memória acima de 500MB
- 🔄 Sistema reinicia

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs em `../backend/logs/`
2. Execute o teste de emails
3. Consulte a documentação em `../docsBaileys/`

---

**Versão:** 2.0  
**Última Atualização:** Janeiro 2024  
**Compatibilidade:** Baileys v6.7.16+