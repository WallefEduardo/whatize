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

## 🔧 **Detecção Automática de Porta**

O sistema **detecta automaticamente** a porta do backend do arquivo `.env`:

### **Como Funciona:**
1. **Lê a variável `PORT`** do arquivo `backend/.env`
2. **Atualiza automaticamente** a variável `BACKEND_URL` no `.env`
3. **Usa porta 4000** como fallback se não encontrar configuração
4. **Todos os serviços** (monitor, emails, testes) usam a porta correta

### **Configuração no .env:**
```bash
# O sistema detecta automaticamente esta porta
PORT=4000

# Esta variável é atualizada automaticamente pelo monitor
BACKEND_URL=http://localhost:4000
```

### **Mudança de Porta:**
```bash
# Para usar porta diferente, apenas altere no .env:
PORT=3001

# O monitor detectará automaticamente e atualizará:
# BACKEND_URL=http://localhost:3001
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

### **🔧 Sistema Git Integrado**
- 📤 **Commit e Push**: Adiciona, commita e envia código automaticamente
- 📥 **Pull Inteligente**: Puxa atualizações com opções de conflito
- 📊 **Status Completo**: Informações detalhadas do repositório
- ⚙️ **Configuração Automática**: Setup de credenciais e repositório
- 🔐 **Credenciais Seguras**: Armazena tokens no .env
- 🔄 **Backup Automático**: Backup do .env antes de mudanças

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

## 🔧 **Configuração Git**

### **Variáveis do .env para Git**
```bash
# Configurações Git (adicionadas automaticamente pelo painel)
GIT_USERNAME=seu-usuario-github
GIT_TOKEN=ghp_seu_personal_access_token_aqui
```

### **Como Configurar Git pelo Painel:**

1. **Acesse a Opção 14** no painel principal
2. **Configure o repositório remoto:**
   ```bash
   https://github.com/usuario/repositorio.git
   ```
3. **Configure usuário e email:**
   ```bash
   Nome: Seu Nome
   Email: seu-email@exemplo.com
   ```
4. **Configure credenciais GitHub:**
   - Username: seu-usuario-github
   - Token: Personal Access Token do GitHub

### **📥 Pull Inteligente (Opção 12)**

O sistema de pull foi configurado para **SEMPRE SOBRESCREVER** arquivos locais com a versão do Git:

**Comportamento:**
- ✅ **Detecta mudanças locais** não commitadas
- ⚠️ **Oferece opções** antes de sobrescrever:
  1. **Commit primeiro** (salva suas mudanças)
  2. **Descartar mudanças** (sobrescreve com Git)
  3. **Fazer stash** (salva temporariamente)
  4. **Cancelar operação**

**Para sobrescrever SEMPRE:**
- Escolha opção **2** quando perguntado
- Digite `CONFIRMO` para confirmar
- Sistema fará `git reset --hard origin/main`

### **📤 Commit e Push (Opção 11)**

**Processo automático:**
1. Adiciona todos os arquivos (`git add .`)
2. Cria commit com timestamp
3. Configura credenciais automaticamente
4. Faz push para origin/main
5. Trata conflitos automaticamente

### **🔐 Personal Access Token GitHub**

**Como gerar:**
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione escopo: `repo` (acesso completo ao repositório)
4. Copie o token gerado
5. Cole no painel (Opção 14)

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
# Ver status geral (porta detectada automaticamente)
curl $(grep "^BACKEND_URL=" backend/.env | cut -d'=' -f2)/race-conditions/stats

# Ou use a porta específica do .env
PORT=$(grep "^PORT=" backend/.env | cut -d'=' -f2)
curl http://localhost:$PORT/race-conditions/stats

# Testar emails
node monitoring/services/test-email-alerts.js

# Monitor automático (usa BACKEND_URL do .env)
node monitoring/services/monitor-race-conditions-prod.js

# Ver logs em tempo real
tail -f ../backend/logs/race_conditions.log

# Contar erros de hoje
grep "$(date +%d/%m/%Y)" ../backend/logs/race_conditions.log | grep "CONSTRAINT_ERROR" | wc -l

# Ver apenas problemas críticos
grep -E "CONSTRAINT_ERROR|HIGH_MEMORY|LOW_CACHE" ../backend/logs/race_conditions.log

# Comandos Git úteis
git status                    # Ver status
git log --oneline -10        # Últimos 10 commits
git pull origin main         # Puxar atualizações
git push origin main         # Enviar código
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
grep -E "MAIL_|ALERT_|GIT_" ../backend/.env
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

### **Git não funciona**
1. Verifique se o repositório está configurado (Opção 13)
2. Configure credenciais (Opção 14)
3. Para GitHub, use Personal Access Token, não senha

### **Logs não aparecem**
1. Execute algumas operações no sistema
2. Verifique se o backend está processando mensagens
3. Logs ficam em: `../backend/logs/race_conditions.log`

### **Erro "ENOENT" nos logs**
```bash
# Criar diretório de logs se não existir
mkdir -p ../backend/logs
touch ../backend/logs/race_conditions.log
```

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
4. Use as opções Git integradas (11-14) para versionamento

---

**Versão:** 2.0  
**Última Atualização:** Junho 2025  
**Compatibilidade:** Baileys v6.7.16+  
**Git:** Integração completa com GitHub/GitLab