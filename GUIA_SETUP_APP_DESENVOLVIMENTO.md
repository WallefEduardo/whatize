# 🚀 GUIA COMPLETO: Setup App Facebook/Instagram para Desenvolvimento

## 📋 PRÉ-REQUISITOS

### ✅ **O que você precisa ter**:
1. **Conta Facebook pessoal** ativa e verificada
2. **Página do Facebook** criada (para testes)
3. **Instagram Business Account** (opcional, para testes Instagram)
4. **Domínio HTTPS** ou **ngrok** para webhook local
5. **Acesso ao Facebook Business Manager** (recomendado)

---

## 🔧 **PASSO 1: CRIAR FACEBOOK APP**

### 1.1 Acessar Facebook for Developers
1. Acesse: [developers.facebook.com](https://developers.facebook.com)
2. Faça login com sua conta Facebook
3. Clique em **"Meus Apps"** no topo direito
4. Clique em **"Criar App"**

### 1.2 Configurar o App
1. **Tipo de App**: Selecione **"Outro"**
2. **Caso de uso**: Selecione **"Empresa"**
3. **Informações do App**:
   ```
   Nome do App: Whatize Development
   Email de contato: seu-email@exemplo.com
   ```
4. Clique em **"Criar App"**

### 1.3 Configurações Básicas
1. Vá para **"Configurações"** → **"Básico"**
2. Anote o **App ID** e **App Secret** (você precisará deles)
3. Em **"Domínios do App"**, adicione:
   ```
   localhost
   seu-dominio-ngrok.ngrok.io (se usar ngrok)
   ```

---

## 📱 **PASSO 2: CONFIGURAR MESSENGER**

### 2.1 Adicionar Produto Messenger
1. No painel do app, clique em **"+ Adicionar Produto"**
2. Encontre **"Messenger"** e clique em **"Configurar"**

### 2.2 Gerar Page Access Token
1. Em **"Tokens de Acesso"**:
   - Selecione sua página do Facebook
   - Clique em **"Gerar Token"**
   - **IMPORTANTE**: Copie e salve este token (você só verá uma vez)

### 2.3 Configurar Webhooks
1. Em **"Webhooks"**:
   ```
   URL do callback: https://seu-dominio.ngrok.io/webhook
   Token de verificação: whatize_webhook_2025 (escolha um token seguro)
   ```

2. **Campos de assinatura** (marque todos):
   - ✅ messages
   - ✅ messaging_postbacks  
   - ✅ messaging_optins
   - ✅ message_deliveries
   - ✅ message_reads
   - ✅ messaging_payments
   - ✅ messaging_pre_checkouts
   - ✅ messaging_checkout_updates
   - ✅ messaging_account_linking
   - ✅ messaging_referrals

3. Clique em **"Verificar e Salvar"**

### 2.4 Subscrever Página ao Webhook
1. Ainda em **"Webhooks"**
2. Selecione sua página
3. Clique em **"Subscrever"**

---

## 📸 **PASSO 3: CONFIGURAR INSTAGRAM (OPCIONAL)**

### 3.1 Pré-requisitos Instagram
1. **Instagram Business Account** conectado à sua página Facebook
2. Verificar se a conta é **Business** (não Creator)

### 3.2 Adicionar Produto Instagram
1. No painel do app, clique em **"+ Adicionar Produto"**
2. Encontre **"Instagram"** e clique em **"Configurar"**

### 3.3 Configurar Instagram API
1. Em **"Instagram Basic Display"**:
   - Adicione sua conta Instagram Business
   - Gere o Access Token para Instagram

2. **Webhook para Instagram**:
   ```
   URL: https://seu-dominio.ngrok.io/webhook
   Verificar Token: whatize_webhook_2025 (mesmo do Messenger)
   ```

---

## 🔧 **PASSO 4: CONFIGURAR WEBHOOK LOCAL**

### 4.1 Instalar ngrok (para desenvolvimento local)
```bash
# Opção 1: npm (recomendado)
npm install -g ngrok

# Opção 2: Baixar de ngrok.com
# Download: https://ngrok.com/download
```

### 4.2 Configurar ngrok
```bash
# 1. Registrar conta gratuita em ngrok.com
# 2. Obter authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN

# 3. Expor porta do seu backend (geralmente 4035)
ngrok http 4035
```

### 4.3 Resultado do ngrok
```bash
# Você verá algo assim:
Session Status      online
Account            seu-email@exemplo.com
Version            3.0.0
Region             United States (us)
Forwarding         https://abc123.ngrok.io -> http://localhost:4035
```

**IMPORTANTE**: Use a URL `https://abc123.ngrok.io/webhook` no Facebook

---

## ⚙️ **PASSO 5: ATUALIZAR CONFIGURAÇÕES DO WHATIZE**

### 5.1 Atualizar .env
```bash
# Facebook/Instagram API Configuration
FACEBOOK_APP_ID=sua_app_id_aqui
FACEBOOK_APP_SECRET=sua_app_secret_aqui
VERIFY_TOKEN=whatize_webhook_2025

# URLs para desenvolvimento
BACKEND_URL=https://abc123.ngrok.io
FRONTEND_URL=http://localhost:3000

# Tokens específicos
FACEBOOK_PAGE_TOKEN=sua_page_access_token_aqui
INSTAGRAM_ACCESS_TOKEN=sua_instagram_token_aqui
```

### 5.2 Verificar WebhookController
Certifique-se que o VERIFY_TOKEN no código bate com o configurado:

```typescript
// backend/src/controllers/WebHookController.ts
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "whatize_webhook_2025";
```

---

## 🧪 **PASSO 6: TESTAR A CONFIGURAÇÃO**

### 6.1 Testar Webhook
1. Inicie seu backend: `npm run dev`
2. Inicie ngrok: `ngrok http 4035`
3. Acesse no navegador: `https://abc123.ngrok.io/webhook`
4. Deve retornar: `{"message": "Forbidden"}` (isso é normal)

### 6.2 Testar Verificação do Webhook
Facebook fará uma requisição GET para verificar:
```
GET https://abc123.ngrok.io/webhook?hub.mode=subscribe&hub.challenge=123456&hub.verify_token=whatize_webhook_2025
```

### 6.3 Enviar Mensagem de Teste
1. **Via Messenger**:
   - Acesse sua página Facebook
   - Envie uma mensagem para a página
   - Verifique se o webhook recebe a mensagem

2. **Via Instagram**:
   - Acesse sua conta Instagram Business
   - Envie uma DM para sua própria conta
   - Verifique se o webhook processa

---

## 🔍 **PASSO 7: DEBUG E MONITORAMENTO**

### 7.1 Logs para Monitorar
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: ngrok
ngrok http 4035

# Terminal 3: Logs em tempo real
tail -f backend/logs/race_conditions.log
```

### 7.2 Ferramentas de Debug Facebook
1. **Graph API Explorer**: [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. **Webhook Tester**: [developers.facebook.com/tools/webhooks](https://developers.facebook.com/tools/webhooks)

### 7.3 Comandos úteis para debug
```bash
# Testar webhook manualmente
curl -X POST https://abc123.ngrok.io/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "PAGE_ID",
      "messaging": [{
        "sender": {"id": "USER_ID"},
        "recipient": {"id": "PAGE_ID"},
        "message": {"text": "teste"}
      }]
    }]
  }'
```

---

## ✅ **VERIFICAÇÃO FINAL**

### Checklist de Funcionamento:
- [ ] **App Facebook criado** e configurado
- [ ] **Messenger configurado** com tokens
- [ ] **Webhook configurado** e verificado  
- [ ] **ngrok rodando** e expondo porta
- [ ] **Backend recebendo webhooks**
- [ ] **Mensagens sendo processadas**
- [ ] **Logs funcionando** corretamente

### Para Instagram (se configurado):
- [ ] **Instagram Business conectado**
- [ ] **Instagram API configurada**
- [ ] **DMs sendo recebidas**

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### ❌ **"Webhook URL is not reachable"**
**Causa**: ngrok não está rodando ou URL incorreta
**Solução**: 
```bash
# Reiniciar ngrok
ngrok http 4035
# Atualizar URL no Facebook
```

### ❌ **"Challenge verification failed"**
**Causa**: VERIFY_TOKEN não confere
**Solução**: Verificar se o token no .env é igual ao do Facebook

### ❌ **"Page not found"**
**Causa**: Página não está conectada ao app
**Solução**: 
1. Ir em Messenger → Configurações
2. Subscrever página ao webhook novamente

### ❌ **"Invalid access token"**
**Causa**: Page Access Token expirado
**Solução**: Gerar novo token na configuração do Messenger

### ❌ **"App not approved for production"**
**Causa**: App em modo desenvolvimento
**Solução**: Para testes, adicione usuários em "Funções" → "Testadores"

---

## 📞 **PRÓXIMOS PASSOS APÓS CONFIGURAÇÃO**

### 1. **Testar Cenários Básicos**
- Envio/recebimento de mensagens de texto
- Envio de imagens e arquivos
- Mensagens citadas (replies)
- Múltiplas conversas simultâneas

### 2. **Implementar Melhorias de Segurança**
- Verificação de assinatura webhook
- Rate limiting
- Logs detalhados

### 3. **Testes de Integração**
- Chatbots e fluxos
- Sistema de filas
- LGPD compliance

---

## 📚 **RECURSOS ÚTEIS**

### Documentação Oficial:
- [Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [Instagram Messaging API](https://developers.facebook.com/docs/instagram-api)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)

### Ferramentas:
- [ngrok Documentation](https://ngrok.com/docs)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)
- [Webhook Debugger](https://developers.facebook.com/tools/webhooks)

---

**🎉 CONFIGURAÇÃO COMPLETA!**

Após seguir todos esses passos, você terá um ambiente de desenvolvimento completo para testar as integrações Facebook/Instagram do Whatize.

**📝 Próximo passo**: Implementar as correções de segurança identificadas no roadmap principal.