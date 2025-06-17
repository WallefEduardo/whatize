# Whatize - Sistema de Atendimento Multi-Canal

## 📋 Sobre o Projeto

O **Whatize** é uma plataforma completa de atendimento ao cliente multi-canal, focada principalmente em integração com WhatsApp, mas também suportando outras plataformas como Facebook/Instagram. O sistema oferece funcionalidades avançadas de CRM, chatbots, campanhas de marketing, relatórios e muito mais.

## 🏗️ Arquitetura do Sistema

O projeto é dividido em duas aplicações principais:

### Backend (Node.js/TypeScript)
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL (com Sequelize ORM)
- **Cache/Filas**: Redis com Bull Queue
- **WebSocket**: Socket.IO para comunicação em tempo real

### Frontend (React)
- **Framework**: React 16.13.1
- **UI Library**: Material-UI v4 e v5 (híbrido)
- **Linguagem**: JavaScript/TypeScript
- **Estado**: Context API + Zustand
- **Roteamento**: React Router DOM v5

## 🚀 Principais Funcionalidades

### 💬 Comunicação Multi-Canal
- **WhatsApp Business API** (Baileys)
- **Facebook/Instagram** integração
- **Chat interno** do sistema
- **API de mensagens** para integrações externas

### 🤖 Automação e Chatbots
- **Flow Builder** - Construtor visual de fluxos
- **Chatbots inteligentes** com IA
- **Integração OpenAI** para respostas automáticas
- **Typebot** para automações avançadas

### 📊 Gestão de Atendimento
- **Sistema de tickets** com status e prioridades
- **Filas de atendimento** organizadas
- **Tags e categorização** de conversas
- **Notas internas** nos tickets
- **Transferência entre atendentes**

### 👥 Gestão de Contatos e CRM
- **Base de contatos** completa
- **Listas de contatos** segmentadas
- **Campos customizados** para contatos
- **Histórico completo** de interações
- **Carteira de contatos** por usuário

### 📈 Campanhas e Marketing
- **Campanhas em massa** via WhatsApp
- **Agendamento de mensagens**
- **Relatórios de entrega** e engajamento
- **Funil de vendas** (Kanban)
- **Configurações avançadas** de campanha

### 📊 Relatórios e Analytics
- **Dashboard executivo** com métricas
- **Relatórios de atendimento**
- **Estatísticas de campanhas**
- **Análise de performance** dos atendentes
- **Exportação de dados** (Excel/CSV)

### 🏢 Multi-Empresa (SaaS)
- **Sistema multi-tenant**
- **Planos e assinaturas**
- **Faturamento integrado** (Gerencianet)
- **Configurações por empresa**
- **Limites personalizáveis**

## 🛠️ Tecnologias Utilizadas

### Backend
```json
{
  "core": [
    "Node.js 20",
    "TypeScript 4.9.5",
    "Express.js 4.17.3",
    "Sequelize 5.22.3 (ORM)",
    "PostgreSQL"
  ],
  "whatsapp": [
    "@whiskeysockets/baileys 6.7.16",
    "qrcode-terminal",
    "puppeteer"
  ],
  "ai_integrations": [
    "openai 4.24.7",
    "@google-cloud/dialogflow 5.9.0",
    "microsoft-cognitiveservices-speech-sdk"
  ],
  "queues_cache": [
    "bull 3.11.0",
    "redis",
    "node-cache"
  ],
  "media_processing": [
    "ffmpeg-static",
    "fluent-ffmpeg",
    "jimp",
    "file-type"
  ],
  "communication": [
    "socket.io 4.7.4",
    "nodemailer",
    "axios"
  ],
  "security": [
    "jsonwebtoken",
    "bcryptjs",
    "helmet",
    "cors"
  ],
  "payments": [
    "sdk-node-apis-efi (Gerencianet)"
  ]
}
```

### Frontend
```json
{
  "core": [
    "React 16.13.1",
    "React Router DOM 5.2.0",
    "TypeScript 5.7.3"
  ],
  "ui_components": [
    "@material-ui/core 4.12.3",
    "@mui/material 5.10.13",
    "react-bootstrap 2.7.0",
    "styled-components"
  ],
  "charts_visualization": [
    "chart.js 3.9.1",
    "react-chartjs-2",
    "recharts"
  ],
  "communication": [
    "socket.io-client 4.7.4",
    "axios"
  ],
  "media_handling": [
    "react-webcam",
    "react-audio-player",
    "react-player",
    "compressorjs"
  ],
  "utilities": [
    "formik (formulários)",
    "yup (validação)",
    "date-fns (datas)",
    "lodash (utilitários)",
    "uuid"
  ]
}
```

## 📁 Estrutura do Projeto

```
whatize/
├── backend/                 # API Backend
│   ├── src/
│   │   ├── controllers/     # Controladores das rotas
│   │   ├── services/        # Lógica de negócio
│   │   ├── models/          # Modelos do banco de dados
│   │   ├── routes/          # Definição das rotas
│   │   ├── database/        # Migrations e configurações DB
│   │   ├── libs/            # Bibliotecas customizadas
│   │   ├── queues/          # Processamento de filas
│   │   ├── utils/           # Utilitários
│   │   └── config/          # Configurações
│   ├── public/              # Arquivos estáticos
│   ├── private/             # Arquivos privados
│   └── certs/               # Certificados
│
├── frontend/                # Interface React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Serviços de API
│   │   ├── context/         # Contextos React
│   │   ├── hooks/           # Hooks customizados
│   │   ├── utils/           # Utilitários
│   │   ├── assets/          # Imagens e recursos
│   │   └── styles/          # Estilos globais
│   └── public/              # Arquivos públicos
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js 20+
- PostgreSQL 12+
- Redis 6+
- Docker (opcional)

### Variáveis de Ambiente

#### Backend (.env)
```env
# Servidor
BACKEND_URL=https://api.seudominio.com  # URL da API (produção) ou http://localhost:4000 (desenvolvimento)
FRONTEND_URL=https://seudominio.com
PORT=4000

# Banco de Dados
DB_HOST=localhost
DB_DIALECT=postgres
DB_PORT=5432
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=whatize

# Autenticação
JWT_SECRET=seu_jwt_secret
JWT_REFRESH_SECRET=seu_refresh_secret

# Redis
REDIS_URI=redis://127.0.0.1:6379

# OpenAI
OPENAI_API_KEY=sua_chave_openai

# Facebook/Instagram
FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret

# Email
MAIL_HOST=seu_smtp_host
MAIL_USER=seu_email
MAIL_PASS=sua_senha_email
MAIL_PORT=587

# Pagamentos (Gerencianet)
GERENCIANET_CLIENT_ID=seu_client_id
GERENCIANET_CLIENT_SECRET=seu_client_secret
```

### Instalação

#### Usando Docker (Recomendado)
```bash
# Clone o repositório
git clone <url-do-repositorio>
cd whatize

# Execute com Docker Compose
docker-compose up -d
```

#### Instalação Manual

##### Backend
```bash
cd backend
npm install
npm run build
npm run db:migrate
npm start
```

##### Frontend
```bash
cd frontend
npm install
npm run build
npm start
```

## 🔄 Scripts Disponíveis

### Backend
- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm start` - Iniciar em produção
- `npm run db:migrate` - Executar migrations
- `npm test` - Executar testes

### Frontend
- `npm start` - Desenvolvimento
- `npm run build` - Build para produção
- `npm test` - Executar testes

## 🌐 APIs e Integrações

### APIs Principais
- `/api/auth` - Autenticação e autorização
- `/api/contacts` - Gestão de contatos
- `/api/tickets` - Sistema de tickets
- `/api/messages` - Envio e recebimento de mensagens
- `/api/campaigns` - Campanhas de marketing
- `/api/whatsapp` - Integração WhatsApp
- `/api/reports` - Relatórios e estatísticas

### Integrações Externas
- **WhatsApp Business API** (Baileys)
- **OpenAI GPT** para IA conversacional
- **Google Dialogflow** para chatbots
- **Facebook Graph API** para Instagram/Facebook
- **Gerencianet** para pagamentos PIX
- **Microsoft Speech Services** para áudio

## 📊 Monitoramento e Logs

- **Winston** para logging estruturado
- **Sentry** para monitoramento de erros
- **Bull Board** para monitoramento de filas
- **Pino** para logs de performance

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- Criptografia bcrypt para senhas
- Helmet.js para headers de segurança
- CORS configurado adequadamente
- Rate limiting implementado
- Validação de dados com Yup

## 📱 Funcionalidades Mobile

- Interface responsiva
- PWA (Progressive Web App)
- Notificações push
- Suporte a touch gestures
- Otimização para dispositivos móveis

## 🚀 Deploy e Produção

### Docker
O projeto inclui Dockerfiles otimizados para produção:
- Multi-stage builds
- Otimização de imagem
- Health checks
- Graceful shutdown

### Nginx
Configuração incluída para proxy reverso e servir arquivos estáticos.

## 📈 Performance

- Compressão HTTP habilitada
- Cache Redis implementado
- Lazy loading de componentes
- Otimização de imagens
- Bundle splitting no frontend

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato através dos canais oficiais do Whatize.

---

**Versão Atual**: 2.2.2v-26

**Última Atualização**: 2024 