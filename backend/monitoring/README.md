# 🎛️ Whatize Monitor v2.0

Sistema **especializado** de monitoramento para problemas críticos no Whatize.

## 🎯 **Foco do Sistema**
Este monitor foi criado especificamente para detectar e alertar sobre **problemas que causam instabilidade**, como:
- Race conditions que geram erros de constraint única
- Problemas de performance que afetam o sistema
- Uso excessivo de recursos
- Reinicializações automáticas

**NÃO é um monitor geral** - ele ignora erros normais de operação e foca apenas no que realmente importa para a estabilidade.

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

## ⚙️ Configuração de Limites

O sistema usa os seguintes limites para detectar problemas críticos:

```javascript
// Limites configurados no monitor
const LIMITS = {
  MAX_ERRORS_PER_HOUR: 5,        // Race conditions por hora
  MIN_CACHE_PERFORMANCE: 50,     // Taxa mínima de cache (%)
  MAX_MEMORY_USAGE: 500,         // Uso máximo de memória (MB)
  MONITOR_INTERVAL: 30000        // Intervalo de verificação (30s)
};
```

### **Personalizar Limites**
Para ajustar os limites, edite o arquivo:
```bash
nano monitoring/services/monitor-race-conditions-prod.js
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

# Ver apenas problemas críticos
grep -E "CONSTRAINT_ERROR|HIGH_MEMORY|LOW_CACHE" ../backend/logs/race_conditions.log
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

### **🚨 PROBLEMAS CRÍTICOS (Monitorados)**
- **Race Conditions**: `SequelizeUniqueConstraintError` (constraint `number_companyid_unique`)
- **Performance Crítica**: Taxa de cache abaixo de 50%
- **Uso Excessivo de Memória**: Consumo acima de 500MB
- **Reinicializações**: Quando o sistema reinicia
- **Falhas de Conexão**: Desconexões críticas do WhatsApp

### **ℹ️ ERROS NORMAIS (NÃO Monitorados)**
- Erros de validação de usuário
- Timeouts de rede ocasionais  
- Erros de autenticação
- Warnings do sistema
- Logs informativos

> **Objetivo**: Monitorar apenas problemas que causam instabilidade ou reinicializações do sistema.

## 🎯 Alertas Automáticos

O sistema envia alertas por email **APENAS** quando detecta problemas críticos:
- 🚨 **Race Conditions**: Mais de 5 erros de constraint por hora
- 📉 **Performance**: Taxa de cache abaixo de 50%
- 💾 **Memória**: Uso acima de 500MB
- 🔄 **Reinicialização**: Sistema reinicia automaticamente
- 📱 **WhatsApp**: Falhas críticas de conexão

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs em `../backend/logs/`
2. Execute o teste de emails
3. Consulte a documentação em `../docsBaileys/`

---

**Versão:** 2.0  
**Última Atualização:** Janeiro 2024  
**Compatibilidade:** Baileys v6.7.16+