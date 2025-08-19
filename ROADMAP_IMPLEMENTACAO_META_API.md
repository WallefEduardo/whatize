# 🚀 ROADMAP COMPLETO: Implementação da API Oficial WhatsApp Meta

## 📊 ANÁLISE TÉCNICA REALIZADA

### 🔍 Estudo da Documentação Oficial Meta WhatsApp Business API

#### Recursos Identificados da API Oficial:
- **WhatsApp Business Platform**: Plataforma oficial para empresas alcançarem clientes
- **WhatsApp Cloud API**: API hospedada nos servidores da Meta (sem necessidade de servidor próprio)
- **Business Management API**: Gerenciamento de ativos empresariais (WABAs, templates, etc.)
- **Webhook Configuration**: Sistema oficial de notificações em tempo real
- **Autenticação**: OAuth 2.0 com tokens de acesso
- **Modelo de Cobrança 2024-2025**: 
  - A partir de 1º nov 2024: conversas iniciadas por usuários são gratuitas
  - A partir de 1º abr 2025: cobrança por mensagem ao invés de por conversa

#### Requisitos Técnicos Identificados:
- **Facebook Business Manager**: Obrigatório para obter acesso à API
- **Número Dedicado**: Não pode estar associado a conta pessoal
- **Webhook HTTPS**: Endpoint seguro para receber notificações
- **Aprovação Meta**: Processo de verificação empresarial necessário
- **Templates de Mensagem**: Aprovação prévia para mensagens proativas

### 🏗️ Análise da Estrutura Atual do Sistema Whatize

#### Backend - Arquitetura Identificada:
```
📁 backend/src/
├── models/
│   ├── Whatsapp.ts ✅ (possui campo 'provider')
│   ├── Baileys.ts ✅ (específico para Baileys)
│   └── Company.ts ✅ (multi-tenant)
├── services/
│   ├── BaileysServices/ ✅ (serviços específicos Baileys)
│   ├── WbotServices/ ✅ (serviços WhatsApp Bot)
│   └── WhatsappService/ ✅ (serviços gerais)
├── libs/
│   └── wbot.ts ✅ (inicialização Baileys)
└── controllers/
    └── WhatsAppController.ts ✅ (endpoints existentes)
```

#### Frontend - Estrutura Identificada:
```
📁 frontend/src/components/
├── WhatsAppModal/ ✅ (modal configuração)
└── QueueSelect/ ✅ (seleção de filas)
```

#### Campos Existentes no Modelo Whatsapp:
- `provider: string` ✅ (defaultValue: "stable")
- `tokenMeta: string` ✅ (já preparado para Meta)
- `facebookUserId: string` ✅
- `facebookUserToken: string` ✅
- `facebookPageUserId: string` ✅
- `channel: string` ✅ (distingue WhatsApp de outros canais)

### 🔄 Mapeamento das Diferenças Entre APIs

| Aspecto | Baileys | Meta API Oficial |
|---------|---------|------------------|
| **Conexão** | WebSocket direto | HTTP REST + Webhook |
| **Autenticação** | QR Code/Pairing | OAuth 2.0 + Tokens |
| **Estabilidade** | Instável, quebra com atualizações WA | Estável, suporte oficial |
| **Custo** | Gratuito | Pago (por conversa/mensagem) |
| **Aprovação** | Não requer | Requer aprovação Meta Business |
| **Webhook** | Implementação própria | Sistema oficial |
| **Media** | Download direto | URLs temporárias |
| **Templates** | Texto livre | Templates aprovados para proativo |
| **Rate Limits** | Não oficiais | Limites oficiais definidos |
| **Compliance** | Viola ToS WhatsApp | Oficial e compliant |

## 🎯 ROADMAP DE IMPLEMENTAÇÃO DETALHADO

### FASE 1: PREPARAÇÃO DA INFRAESTRUTURA DE DADOS
**Prioridade: ALTA | Tempo Estimado: 3-5 dias**

#### 1.1 Backend - Expansão do Modelo Whatsapp ✨
```typescript
// Adicionar ao backend/src/models/Whatsapp.ts
@Column metaAccessToken: string;
@Column metaPhoneNumberId: string; 
@Column metaBusinessAccountId: string;
@Column metaAppId: string;
@Column metaAppSecret: string;
@Column metaWebhookVerifyToken: string;
@Column metaApiVersion: string;
@Column metaWebhookUrl: string;
@Default('v18.0') metaApiVersion: string;
```

#### 1.2 Backend - Migration de Banco de Dados 📊
```typescript
// backend/src/database/migrations/[timestamp]-add-meta-api-fields.ts
export = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Whatsapps', 'metaAccessToken', {
        type: Sequelize.TEXT,
        allowNull: true
      }),
      queryInterface.addColumn('Whatsapps', 'metaPhoneNumberId', {
        type: Sequelize.STRING,
        allowNull: true
      }),
      // ... outros campos
    ]);
  }
};
```

#### 1.3 Backend - Configurações de Ambiente 🔧
```bash
# Adicionar ao .env
META_API_BASE_URL=https://graph.facebook.com
META_API_VERSION=v18.0
META_WEBHOOK_VERIFY_TOKEN=seu_token_unico_aqui
META_WEBHOOK_BASE_URL=https://seudominio.com
```

### FASE 2: IMPLEMENTAÇÃO DOS SERVIÇOS META API
**Prioridade: ALTA | Tempo Estimado: 7-10 dias**

#### 2.1 Backend - Serviços Base Meta API 🔨

##### 2.1.1 Classe Base Meta API
```typescript
// backend/src/services/MetaApiServices/MetaApiService.ts
export class MetaApiService {
  private baseUrl: string;
  private apiVersion: string;
  private accessToken: string;

  constructor(whatsapp: Whatsapp) {
    this.baseUrl = process.env.META_API_BASE_URL;
    this.apiVersion = whatsapp.metaApiVersion || 'v18.0';
    this.accessToken = whatsapp.metaAccessToken;
  }

  async makeRequest(endpoint: string, method: 'GET' | 'POST', data?: any) {
    // Implementação das requisições HTTP
  }

  async sendMessage(to: string, message: any) {
    // Implementação envio de mensagem
  }
}
```

##### 2.1.2 Envio de Mensagens
```typescript
// backend/src/services/MetaApiServices/SendMetaMessage.ts
export interface MetaMessageRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  text?: { body: string };
  image?: { link: string; caption?: string };
  // ... outros tipos
}

export const SendMetaMessage = async (
  whatsapp: Whatsapp, 
  messageData: MetaMessageRequest
) => {
  const metaApi = new MetaApiService(whatsapp);
  return await metaApi.sendMessage(messageData.to, messageData);
};
```

##### 2.1.3 Processador de Webhook
```typescript
// backend/src/services/MetaApiServices/MetaWebhookProcessor.ts
export class MetaWebhookProcessor {
  async processIncomingMessage(webhookData: any, whatsapp: Whatsapp) {
    // Converter formato Meta para formato interno
    // Criar/atualizar contato
    // Criar/atualizar ticket  
    // Criar mensagem
    // Emitir eventos Socket.IO
  }

  async processStatusUpdate(webhookData: any, whatsapp: Whatsapp) {
    // Processar status de entrega, leitura, etc.
  }
}
```

#### 2.2 Backend - Integração com Sistema Existente 🔗

##### 2.2.1 Factory Pattern para Providers
```typescript
// backend/src/services/MessageProviders/IMessageProvider.ts
export interface IMessageProvider {
  sendTextMessage(to: string, text: string): Promise<any>;
  sendMediaMessage(to: string, media: any): Promise<any>;
  getConnectionStatus(): Promise<string>;
}

// backend/src/services/MessageProviders/BaileysProvider.ts
export class BaileysProvider implements IMessageProvider {
  // Implementação para Baileys existente
}

// backend/src/services/MessageProviders/MetaProvider.ts  
export class MetaProvider implements IMessageProvider {
  // Implementação para Meta API
}

// backend/src/services/MessageProviders/ProviderFactory.ts
export class ProviderFactory {
  static create(whatsapp: Whatsapp): IMessageProvider {
    switch(whatsapp.provider) {
      case 'meta': return new MetaProvider(whatsapp);
      case 'baileys': 
      default: return new BaileysProvider(whatsapp);
    }
  }
}
```

##### 2.2.2 Adaptação dos Serviços Existentes
```typescript
// Modificar backend/src/services/WbotServices/SendWhatsAppMessage.ts
const SendWhatsAppMessage = async ({ body, ticket, quotedMsg }: Request) => {
  const whatsapp = await ShowWhatsAppService(ticket.whatsappId);
  const provider = ProviderFactory.create(whatsapp);
  
  if (whatsapp.provider === 'meta') {
    return await provider.sendTextMessage(ticket.contact.number, body);
  } else {
    // Lógica existente Baileys
  }
};
```

### FASE 3: SISTEMA DE WEBHOOK E ENDPOINTS
**Prioridade: ALTA | Tempo Estimado: 4-6 dias**

#### 3.1 Backend - Controller de Webhook 📨
```typescript
// backend/src/controllers/MetaWebhookController.ts
export const webhookVerification = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
};

export const webhookReceiver = async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'];
  
  // Validar assinatura
  if (!validateSignature(req.body, signature)) {
    return res.status(401).send('Unauthorized');
  }

  // Processar webhook
  const processor = new MetaWebhookProcessor();
  await processor.process(req.body);
  
  res.status(200).send('OK');
};
```

#### 3.2 Backend - Rotas de Webhook 🛣️
```typescript
// backend/src/routes/metaWebhookRoutes.ts
import { Router } from 'express';
import * as MetaWebhookController from '../controllers/MetaWebhookController';

const metaWebhookRoutes = Router();

metaWebhookRoutes.get('/webhook', MetaWebhookController.webhookVerification);
metaWebhookRoutes.post('/webhook', MetaWebhookController.webhookReceiver);

export default metaWebhookRoutes;
```

### FASE 4: INTERFACE DE USUÁRIO (FRONTEND)
**Prioridade: MÉDIA | Tempo Estimado: 5-7 dias**

#### 4.1 Frontend - Seletor de Provider 🎛️
```jsx
// frontend/src/components/ProviderSelector/index.js
const ProviderSelector = ({ value, onChange, disabled }) => {
  return (
    <FormControl fullWidth>
      <InputLabel>Tipo de API</InputLabel>
      <Select value={value} onChange={onChange} disabled={disabled}>
        <MenuItem value="baileys">
          <Box display="flex" alignItems="center">
            <Avatar src="/baileys-logo.png" sx={{ width: 24, height: 24, mr: 1 }} />
            Baileys (Gratuito)
          </Box>
        </MenuItem>
        <MenuItem value="meta">
          <Box display="flex" alignItems="center">
            <Avatar src="/meta-logo.png" sx={{ width: 24, height: 24, mr: 1 }} />
            Meta API Oficial (Pago)
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
};
```

#### 4.2 Frontend - Formulário Meta API ⚙️
```jsx
// frontend/src/components/MetaApiConfigForm/index.js
const MetaApiConfigForm = ({ whatsapp, setWhatsapp }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Access Token"
          value={whatsapp.metaAccessToken}
          onChange={(e) => setWhatsapp({...whatsapp, metaAccessToken: e.target.value})}
          type="password"
          fullWidth
          helperText="Token de acesso da Meta API"
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Phone Number ID" 
          value={whatsapp.metaPhoneNumberId}
          onChange={(e) => setWhatsapp({...whatsapp, metaPhoneNumberId: e.target.value})}
          fullWidth
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          label="Business Account ID"
          value={whatsapp.metaBusinessAccountId} 
          onChange={(e) => setWhatsapp({...whatsapp, metaBusinessAccountId: e.target.value})}
          fullWidth
        />
      </Grid>
    </Grid>
  );
};
```

#### 4.3 Frontend - Atualização WhatsAppModal 🔧
```jsx
// Modificar frontend/src/components/WhatsAppModal/index.js
const WhatsAppModal = ({ open, onClose, whatsAppId }) => {
  // Estado existente + novos campos Meta
  const [whatsApp, setWhatsApp] = useState({
    ...initialState,
    provider: "baileys", // Padrão
    metaAccessToken: "",
    metaPhoneNumberId: "",
    // ... outros campos Meta
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Configurações Básicas" />
          <Tab label="Configurações API" />
          <Tab label="Mensagens" />
        </Tabs>
        
        <TabPanel value={tabValue} index={1}>
          <ProviderSelector
            value={whatsApp.provider}
            onChange={(e) => setWhatsApp({...whatsApp, provider: e.target.value})}
          />
          
          {whatsApp.provider === 'meta' && (
            <MetaApiConfigForm whatsapp={whatsApp} setWhatsapp={setWhatsApp} />
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};
```

### FASE 5: SISTEMA DE VALIDAÇÃO E SEGURANÇA
**Prioridade: ALTA | Tempo Estimado: 3-4 dias**

#### 5.1 Backend - Validação de Conexão Meta 🔐
```typescript
// backend/src/services/MetaApiServices/ValidateMetaConnection.ts
export const ValidateMetaConnection = async (whatsapp: Whatsapp) => {
  try {
    const metaApi = new MetaApiService(whatsapp);
    
    // Validar token de acesso
    const profileResponse = await metaApi.makeRequest(
      `/${whatsapp.metaPhoneNumberId}`, 
      'GET'
    );
    
    if (!profileResponse.data) {
      throw new AppError('Token de acesso inválido');
    }

    // Validar webhook
    const webhookStatus = await metaApi.validateWebhook();
    if (!webhookStatus.isValid) {
      throw new AppError('Webhook não configurado corretamente');
    }

    return { 
      isValid: true, 
      phoneNumber: profileResponse.data.display_phone_number 
    };
  } catch (error) {
    throw new AppError(`Erro na validação Meta API: ${error.message}`);
  }
};
```

#### 5.2 Backend - Segurança do Webhook 🛡️
```typescript
// backend/src/helpers/MetaWebhookSecurity.ts
import crypto from 'crypto';

export const validateWebhookSignature = (payload: string, signature: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.META_APP_SECRET)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  );
};

export const rateLimitWebhook = (req: Request): boolean => {
  // Implementar rate limiting para webhook
  const clientIp = req.ip;
  // Lógica de rate limiting
  return true;
};
```

### FASE 6: MIGRAÇÃO E COMPATIBILIDADE
**Prioridade: MÉDIA | Tempo Estimado: 4-5 dias**

#### 6.1 Backend - Serviço de Migração 🔄
```typescript
// backend/src/services/MigrationServices/MigrateToMetaApiService.ts
export const MigrateToMetaApiService = async (whatsappId: number, metaConfig: any) => {
  const whatsapp = await Whatsapp.findByPk(whatsappId);
  
  // 1. Validar configuração Meta
  const validation = await ValidateMetaConnection({
    ...whatsapp.toJSON(),
    ...metaConfig
  });
  
  // 2. Atualizar WhatsApp com configurações Meta
  await whatsapp.update({
    provider: 'meta',
    status: 'CONNECTED',
    ...metaConfig
  });
  
  // 3. Migrar dados de sessão se necessário
  // 4. Atualizar tickets ativos
  // 5. Notificar sistema
  
  return { success: true, whatsapp };
};
```

#### 6.2 Backend - Manutenção de Compatibilidade 🔧
```typescript
// backend/src/services/CompatibilityServices/EnsureBackwardCompatibility.ts
export const EnsureBackwardCompatibility = async () => {
  // Garantir que Whatsapps sem provider definido usem Baileys
  await Whatsapp.update(
    { provider: 'baileys' },
    { where: { provider: { [Op.is]: null } } }
  );
  
  // Outras verificações de compatibilidade
};
```

### FASE 7: MONITORAMENTO E LOGS
**Prioridade: MÉDIA | Tempo Estimado: 2-3 dias**

#### 7.1 Backend - Sistema de Logs Específico 📊
```typescript
// backend/src/utils/metaApiLogger.ts
export const metaApiLogger = pino({
  name: 'meta-api',
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});

export const logMetaApiRequest = (endpoint: string, method: string, status: number) => {
  metaApiLogger.info({
    type: 'meta_api_request',
    endpoint,
    method, 
    status,
    timestamp: new Date().toISOString()
  });
};
```

#### 7.2 Backend - Métricas e Monitoramento 📈
```typescript
// backend/src/services/MetaApiServices/MetaApiMetrics.ts
export class MetaApiMetrics {
  static async recordMessageSent(whatsappId: number, messageType: string) {
    // Registrar métrica de mensagem enviada
  }
  
  static async recordWebhookReceived(whatsappId: number, eventType: string) {
    // Registrar métrica de webhook recebido  
  }
  
  static async getUsageReport(companyId: number, startDate: Date, endDate: Date) {
    // Gerar relatório de uso da Meta API
  }
}
```

### FASE 8: TESTES E QUALIDADE
**Prioridade: ALTA | Tempo Estimado: 5-7 dias**

#### 8.1 Backend - Testes Unitários 🧪
```typescript
// backend/__tests__/services/MetaApiServices/MetaApiService.spec.ts
describe('MetaApiService', () => {
  let metaApiService: MetaApiService;
  let mockWhatsapp: Whatsapp;

  beforeEach(() => {
    mockWhatsapp = {
      metaAccessToken: 'test_token',
      metaPhoneNumberId: '123456789',
      metaApiVersion: 'v18.0'
    } as Whatsapp;
    
    metaApiService = new MetaApiService(mockWhatsapp);
  });

  it('should send text message successfully', async () => {
    // Mock HTTP request
    const mockResponse = { data: { id: 'msg_123' } };
    jest.spyOn(metaApiService, 'makeRequest').mockResolvedValue(mockResponse);
    
    const result = await metaApiService.sendMessage('5511999999999', {
      messaging_product: 'whatsapp',
      to: '5511999999999', 
      type: 'text',
      text: { body: 'Test message' }
    });
    
    expect(result.data.id).toBe('msg_123');
  });
});
```

#### 8.2 Backend - Testes de Integração 🔗
```typescript
// backend/__tests__/integration/MetaApiIntegration.spec.ts
describe('Meta API Integration', () => {
  it('should handle complete message flow', async () => {
    // 1. Criar WhatsApp com provider Meta
    // 2. Enviar mensagem via Meta API
    // 3. Simular webhook de resposta
    // 4. Verificar criação de ticket e mensagem
    // 5. Validar eventos Socket.IO
  });
});
```

### FASE 9: DOCUMENTAÇÃO E DEPLOY
**Prioridade: MÉDIA | Tempo Estimado: 3-4 dias**

#### 9.1 Documentação Técnica 📚
```markdown
# Meta API Integration Guide

## Configuração Inicial
1. Criar Facebook Business Manager
2. Configurar WhatsApp Business Account
3. Obter tokens de acesso
4. Configurar webhook

## Variáveis de Ambiente
```env
META_API_BASE_URL=https://graph.facebook.com
META_API_VERSION=v18.0
META_WEBHOOK_VERIFY_TOKEN=seu_token_aqui
```

## Comandos de Migração
```bash
npm run db:migrate
npm run meta:setup
```
```

#### 9.2 Atualização CLAUDE.md 📝
```markdown
# Adições ao CLAUDE.md

## Meta API Commands
- `npm run meta:validate-token` - Validar token Meta API
- `npm run meta:setup-webhook` - Configurar webhook
- `npm run meta:migrate-whatsapp [id]` - Migrar WhatsApp para Meta API

## Testing Meta API
```bash
NODE_ENV=test npx jest __tests__/services/MetaApiServices --no-coverage
NODE_ENV=test npx jest __tests__/integration/MetaApiIntegration.spec.ts --no-coverage --verbose
```
```

## 🚦 CRONOGRAMA DE IMPLEMENTAÇÃO

### Sprint 1 (Semana 1-2): Fundação
- [ ] Fase 1: Preparação da Infraestrutura de Dados
- [ ] Fase 2: Implementação dos Serviços Meta API (Base)

### Sprint 2 (Semana 3-4): Core Features  
- [ ] Fase 2: Implementação dos Serviços Meta API (Completo)
- [ ] Fase 3: Sistema de Webhook e Endpoints

### Sprint 3 (Semana 5-6): Interface
- [ ] Fase 4: Interface de Usuário (Frontend)
- [ ] Fase 5: Sistema de Validação e Segurança

### Sprint 4 (Semana 7-8): Estabilização
- [ ] Fase 6: Migração e Compatibilidade  
- [ ] Fase 7: Monitoramento e Logs
- [ ] Fase 8: Testes e Qualidade

### Sprint 5 (Semana 9): Deploy
- [ ] Fase 9: Documentação e Deploy
- [ ] Testes finais e homologação

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### Riscos Identificados:
1. **Aprovação Meta Business**: Processo pode demorar semanas
2. **Custos Operacionais**: Meta API tem custos por uso
3. **Rate Limits**: Limitações de taxa da Meta API
4. **Webhook Downtime**: Necessário alta disponibilidade

### Mitigações:
1. **Ambiente de Teste**: Usar Meta Test Environment primeiro
2. **Monitoramento**: Alertas para rate limits e falhas
3. **Fallback**: Manter Baileys como backup
4. **Documentação**: Guias detalhados para configuração

### Critérios de Sucesso:
- ✅ Envio e recebimento de mensagens via Meta API
- ✅ Compatibilidade total com sistema existente Baileys  
- ✅ Interface intuitiva para escolha de provider
- ✅ Webhook funcionando corretamente
- ✅ Logs e monitoramento implementados
- ✅ Testes com cobertura > 80%

## 📞 PRÓXIMOS PASSOS IMEDIATOS

1. **Aprovação do Roadmap**: Validar escopo, cronograma e recursos
2. **Setup Ambiente Meta**: Criar Facebook Business Manager para testes
3. **Definição de Prioridades**: Confirmar ordem das fases
4. **Alocação de Recursos**: Definir desenvolvedores responsáveis
5. **Início da Implementação**: Começar pela Fase 1

---

**Documento gerado em**: {{ new Date().toLocaleDateString('pt-BR') }}
**Responsável pela análise**: Claude Code Assistant
**Status**: Aguardando aprovação para implementação