# 📱 Guia Completo de Setup - Facebook/Instagram API

## 🎯 Visão Geral

Este guia fornece instruções detalhadas para configurar as integrações Facebook e Instagram no sistema Whatize, incluindo todas as 5 fases implementadas.

## 📋 Pré-requisitos

### Contas Necessárias
- [x] Conta Facebook Developer
- [x] Página do Facebook Business
- [x] Conta Instagram Business (opcional)
- [x] Servidor com Node.js e PostgreSQL

### Dados do App Configurado
- **App ID**: `1443021550275833`
- **Access Token**: `c1ef9d5fae9c5f8eb517a5c527acff0a`

## 🚀 Configuração Rápida

### 1. Clonar e Copiar Configurações

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

### 2. Configurações Essenciais

Edite o arquivo `.env` com as seguintes configurações **obrigatórias**:

```bash
# ============================================
# 📱 FACEBOOK/INSTAGRAM API CONFIGURATION
# ============================================

# Credenciais do App Facebook (já configurado)
FACEBOOK_APP_ID=1443021550275833
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_ACCESS_TOKEN=c1ef9d5fae9c5f8eb517a5c527acff0a

# Token de verificação do webhook
VERIFY_TOKEN=whatize_webhook_verify_token_2024

# Configurações da Meta API
META_API_VERSION=v22.0
META_API_BASE_URL=https://graph.facebook.com
```

### 3. Instalação e Primeira Execução

```bash
# Instalar dependências
npm install

# Executar migrações do banco
npm run db:migrate

# Verificar configuração
npm run config:validate

# Iniciar aplicação
npm run dev
```

## 🔧 Configuração Detalhada

### Facebook App Secret

1. Acesse [Facebook Developers](https://developers.facebook.com)
2. Vá em "Meus Apps" → Seu App → "Configurações" → "Básico"
3. Copie o "Chave secreta do app"
4. Adicione no `.env`:

```bash
FACEBOOK_APP_SECRET=sua_chave_secreta_aqui
```

### Configuração de Webhook

1. No Facebook Developers, vá em "Webhooks"
2. Configure a URL: `https://seu-dominio.com/webhooks/facebook`
3. Token de verificação: `whatize_webhook_verify_token_2024`
4. Eventos: `messages`, `messaging_postbacks`, `message_deliveries`

### Instagram Business (Opcional)

Para ativar o Instagram:

```bash
# Habilitar Instagram
INSTAGRAM_API_ENABLED=true

# Configurar credenciais
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
```

## 📊 Configurações de Monitoramento

### Sistema de Alertas

```bash
# Habilitar alertas
FACEBOOK_ALERTS_ENABLED=true

# Configurar email
FACEBOOK_ALERT_EMAIL_ENABLED=true
FACEBOOK_ALERT_EMAIL_TO=admin@empresa.com
FACEBOOK_ALERT_SMTP_HOST=smtp.gmail.com
FACEBOOK_ALERT_SMTP_USER=seu-email@gmail.com
FACEBOOK_ALERT_SMTP_PASS=sua-senha-app
```

### Webhook de Alertas

```bash
# Slack/Discord/Teams
FACEBOOK_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
FACEBOOK_ALERT_WEBHOOK_TOKEN=seu_token_webhook
```

### Configurações de Performance

```bash
# Otimizações recomendadas
FACEBOOK_API_TIMEOUT=30000
FACEBOOK_API_MAX_RETRIES=3
FACEBOOK_CLIENT_CACHE_ENABLED=true
FACEBOOK_TELEMETRY_ENABLED=true
```

## 🛡️ Configurações de Segurança

### Produção (Recomendado)

```bash
# Verificação de assinatura obrigatória
SKIP_WEBHOOK_SIGNATURE=false

# Rate limiting conservador
FACEBOOK_RATE_LIMIT_PER_MINUTE=100

# Logs de segurança
FACEBOOK_LOG_LEVEL=info
FACEBOOK_WEBHOOK_DETAILED_LOGS=false
```

### Desenvolvimento

```bash
# Facilita desenvolvimento local
SKIP_WEBHOOK_SIGNATURE=true
FACEBOOK_DEBUG_MODE=true
FACEBOOK_LOG_LEVEL=debug
```

## 🧪 Configuração de Desenvolvimento

### Ngrok para Testes Locais

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 4035

# Configurar URL do webhook
WEBHOOK_DEV_URL=https://abc123.ngrok.io
```

### Variáveis de Desenvolvimento

```bash
# Ambiente de desenvolvimento
NODE_ENV=development

# URL de desenvolvimento
BACKEND_URL=http://localhost:4035
FRONTEND_URL=http://localhost:3000

# Debug avançado
FACEBOOK_DEBUG_MODE=true
DEBUG_LOGS=true
```

## 📋 Scripts de Validação

### Validar Configuração

```bash
# Executar validação completa
npx ts-node src/scripts/validateConfig.ts

# Testar conexões
npm run test:facebook
npm run test:instagram

# Health check
curl http://localhost:4035/api/facebook-monitoring/health
```

### Testar APIs

```bash
# Testar Facebook API
npx ts-node src/scripts/testFacebookPhase2.ts

# Testar Instagram API
npx ts-node src/scripts/testFacebookPhase3.ts

# Testar Monitoramento
npx ts-node src/scripts/testFacebookPhase4.ts
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. "Missing required environment variables"

**Solução**: Verificar se todas as variáveis obrigatórias estão configuradas:

```bash
FACEBOOK_APP_ID=1443021550275833
FACEBOOK_APP_SECRET=sua_chave_secreta
VERIFY_TOKEN=whatize_webhook_verify_token_2024
```

#### 2. "Webhook signature verification failed"

**Soluções**:
- Em desenvolvimento: `SKIP_WEBHOOK_SIGNATURE=true`
- Em produção: Verificar se `FACEBOOK_APP_SECRET` está correto

#### 3. "Rate limit exceeded"

**Soluções**:
- Diminuir `FACEBOOK_RATE_LIMIT_PER_MINUTE`
- Verificar se há loops de requisições
- Implementar backoff automático (já incluído)

#### 4. "Instagram API not working"

**Verificações**:
1. `INSTAGRAM_API_ENABLED=true`
2. `INSTAGRAM_BUSINESS_ACCOUNT_ID` configurado
3. `INSTAGRAM_ACCESS_TOKEN` válido
4. Conta Instagram Business vinculada ao Facebook

### Logs de Debug

```bash
# Habilitar logs detalhados
FACEBOOK_LOG_LEVEL=debug
FACEBOOK_WEBHOOK_DETAILED_LOGS=true
FACEBOOK_DEBUG_MODE=true

# Verificar logs
tail -f logs/application.log
tail -f logs/facebook-api.log
```

### Health Check Endpoints

```bash
# Verificar saúde geral
GET /api/facebook-monitoring/health

# Verificar configuração
GET /api/facebook-monitoring/configuration

# Dashboard de monitoramento
GET /api/facebook-monitoring/dashboard
```

## 📈 Monitoramento em Produção

### Dashboard de Monitoramento

Acesse: `http://seu-dominio.com/api/facebook-monitoring/dashboard`

**Métricas disponíveis**:
- Taxa de sucesso/erro das APIs
- Tempo médio de resposta
- Cache hit rate
- Alertas ativos
- Uso por empresa

### Alertas Automáticos

O sistema monitora automaticamente:
- Taxa de erro > 5%
- Tempo de resposta > 5 segundos
- Falhas consecutivas > 10
- Health check failures
- Quota usage > 90%

### Exportação de Dados

```bash
# Exportar métricas em CSV
curl "http://localhost:4035/api/facebook-monitoring/metrics?format=csv" > metrics.csv

# Exportar em JSON
curl "http://localhost:4035/api/facebook-monitoring/metrics" > metrics.json
```

## 🎛️ Configurações Avançadas

### Customização de Rate Limiting

```bash
# Por minuto, hora e dia
FACEBOOK_RATE_LIMIT_PER_MINUTE=100
INSTAGRAM_RATE_LIMIT_PER_HOUR=200
INSTAGRAM_RATE_LIMIT_PER_DAY=4800

# Rate limiting rígido para proteção
FACEBOOK_STRICT_RATE_LIMIT_PER_MINUTE=20
```

### Configurações de Cache

```bash
# Cache de clientes API
FACEBOOK_CLIENT_CACHE_ENABLED=true
FACEBOOK_CLIENT_CACHE_TTL=1800  # 30 minutos

# Cache de responses
FACEBOOK_RESPONSE_CACHE_ENABLED=true
FACEBOOK_RESPONSE_CACHE_TTL=300  # 5 minutos
```

### Telemetria e Analytics

```bash
# Coleta de dados
FACEBOOK_TELEMETRY_ENABLED=true
FACEBOOK_TELEMETRY_SAMPLING_RATE=1.0  # 100% das requests

# Retenção de dados
FACEBOOK_TELEMETRY_RETENTION_DAYS=30

# Exportação automática
FACEBOOK_TELEMETRY_EXPORT_ENABLED=true
FACEBOOK_TELEMETRY_EXPORT_INTERVAL=3600000  # 1 hora
```

## ✅ Checklist de Validação

### Configuração Básica
- [ ] App ID configurado: `1443021550275833`
- [ ] App Secret configurado
- [ ] Access Token configurado: `c1ef9d5fae9c5f8eb517a5c527acff0a`
- [ ] Verify Token configurado: `whatize_webhook_verify_token_2024`

### Webhook
- [ ] URL configurada no Facebook: `https://seu-dominio.com/webhooks/facebook`
- [ ] Token de verificação correto
- [ ] Eventos configurados: `messages`, `messaging_postbacks`
- [ ] Teste de webhook funcionando

### Instagram (Opcional)
- [ ] `INSTAGRAM_API_ENABLED=true`
- [ ] Business Account ID configurado
- [ ] Access Token do Instagram configurado
- [ ] Conta Business vinculada ao Facebook

### Monitoramento
- [ ] Logs estruturados funcionando
- [ ] Health checks ativos
- [ ] Dashboard acessível
- [ ] Alertas configurados (email/webhook)

### Segurança
- [ ] Verificação de assinatura ativa (produção)
- [ ] Rate limiting configurado
- [ ] Logs de segurança ativos
- [ ] Variáveis sensíveis protegidas

### Performance
- [ ] Cache habilitado
- [ ] Retry automático configurado
- [ ] Timeout adequado (30s)
- [ ] Telemetria ativa

## 🆘 Suporte

### Logs de Sistema

```bash
# Verificar logs de aplicação
tail -f logs/application.log

# Verificar logs do Facebook
tail -f logs/facebook-api.log

# Verificar logs de erro
tail -f logs/error.log
```

### Comandos de Diagnóstico

```bash
# Verificar configuração
npm run config:validate

# Testar conectividade
npm run test:connectivity

# Gerar relatório de configuração
npm run config:report
```

### Contato

- **Documentação**: Este arquivo
- **Logs**: `/logs/` directory
- **Monitoramento**: `/api/facebook-monitoring/dashboard`
- **Health Check**: `/api/facebook-monitoring/health`

---

## 📝 Notas Importantes

1. **Nunca committar** o arquivo `.env` no Git
2. **Sempre usar HTTPS** em produção
3. **Monitorar** rate limits do Facebook
4. **Manter** logs de auditoria ativos
5. **Testar** webhooks após mudanças

**Status da Configuração**: ✅ Pronto para Produção