# AUDITORIA COMPLETA - FASE 7: MIGRAÇÃO DE APIs ANTIGAS

## Resumo Executivo

Esta auditoria identificou **215 arquivos** que ainda utilizam APIs antigas no projeto frontend Whatize. A migração dessas APIs é crítica para a finalização da modernização do projeto.

## APIs Antigas Identificadas

### 1. Material-UI v4 (@material-ui/*)
- **Arquivos encontrados**: 215 arquivos
- **Impacto**: CRÍTICO - Afeta 100% dos componentes
- **Status**: Migração massiva necessária

### 2. React-Toastify (react-toastify)
- **Arquivos encontrados**: 104 arquivos
- **Impacto**: ALTO - Sistema de notificações global
- **Status**: Substituição por react-hot-toast necessária

### 3. Formik (formik)
- **Arquivos encontrados**: 47 arquivos
- **Impacto**: MÉDIO - Formulários e validações
- **Status**: Migração para React Hook Form necessária

### 4. makeStyles (@material-ui/core/styles)
- **Arquivos encontrados**: 163 arquivos
- **Impacto**: ALTO - Sistema de estilos MUI v4
- **Status**: Migração para styled() ou sx prop necessária

### 5. React Query v3 (react-query)
- **Arquivos encontrados**: 5 arquivos
- **Impacto**: BAIXO - Já tem wrapper de compatibilidade
- **Status**: Migração parcialmente implementada

## Categorização por Prioridade

### PRIORIDADE ALTA (Crítica)

#### Páginas Principais (16 arquivos)
```
- /src/App.js - Material-UI v4, react-toastify
- /src/pages/Dashboard/index.js - Material-UI v4, makeStyles
- /src/pages/Tickets/index.js - Material-UI v4, makeStyles
- /src/pages/TicketsCustom/index.js - Material-UI v4, makeStyles
- /src/pages/TicketsAdvanced/index.js - Material-UI v4, makeStyles
- /src/pages/Connections/index.js - Material-UI v4, makeStyles, react-toastify
- /src/pages/Users/index.js - Material-UI v4, makeStyles, react-toastify
- /src/pages/Settings/index.js - Material-UI v4, makeStyles, react-toastify
- /src/pages/Kanban/index.js - Material-UI v4, makeStyles, react-toastify
- /src/pages/Login/index.js - MIGRADO (MUI v5)
- /src/pages/Contacts/index.js - Material-UI v4, makeStyles, react-toastify
- /src/pages/Queues/index.js - Material-UI v4, makeStyles, react-toastify
- /src/pages/Companies/index.js - Material-UI v4, makeStyles, react-toastify
- /src/pages/Reports/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/pages/Tags/index.js - Material-UI v4, makeStyles, react-toastify
- /src/layout/index.js - Material-UI v4, makeStyles
```

**Complexidade**: ALTA
**Motivo**: Componentes core da aplicação com uso intensivo de todas as APIs antigas

#### Componentes de Sistema (8 arquivos)
```
- /src/components/Ticket/index.js - Material-UI v4, makeStyles
- /src/components/MessageInput/index.js - Material-UI v4, makeStyles, react-toastify
- /src/components/TicketHeader/index.js - Material-UI v4, makeStyles
- /src/components/TicketInfo/index.js - Material-UI v4, makeStyles, react-toastify
- /src/components/ContactDrawer/index.js - Material-UI v4, makeStyles, react-toastify
- /src/components/TicketsManagerTabs/index.js - Material-UI v4, makeStyles
- /src/components/MainHeader/index.js - Material-UI v4, makeStyles
- /src/errors/toastError.js - react-toastify (função crítica de error handling)
```

**Complexidade**: ALTA
**Motivo**: Componentes fundamentais com lógica complexa

### PRIORIDADE MÉDIA (Importante)

#### Modais e Dialogs (39 arquivos)
```
- /src/components/UserModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/ContactModal/index.js - Material-UI v4, makeStyles, Formik
- /src/components/QueueModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/TagModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/WhatsAppModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/WhatsAppModalAdmin/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/CampaignModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/MessageModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/AnnouncementModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/ConfirmationModal/index.js - Material-UI v4, makeStyles
- /src/components/QrcodeModal/index.js - Material-UI v4, makeStyles
- /src/components/FileModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/PromptModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/ContactListDialog/index.js - Material-UI v4, makeStyles, Formik
- /src/components/ContactNotesDialog/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/ContactNotesEditModal/index.js - Material-UI v4, makeStyles
- /src/components/ContactSendModal/index.js - Material-UI v4, makeStyles, react-toastify
- /src/components/ContactListItemModal/index.js - Material-UI v4, makeStyles, Formik
- /src/components/ContactTagListModal/index.js - Material-UI v4, makeStyles
- /src/components/ForwardMessageModal/index.js - Material-UI v4, makeStyles
- /src/components/NewTicketModal/index.js - Material-UI v4, makeStyles, react-toastify
- /src/components/QuickMessageDialog/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/ScheduleModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/TagTicketModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/TicketMessagesDialog/index.js - Material-UI v4, makeStyles, react-toastify
- /src/components/TransferTicketModalCustom/index.js - Material-UI v4, makeStyles
- /src/components/WebhookModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/ShowTicketLogModal/index.js - Material-UI v4, makeStyles
- /src/components/ShowTicketOpenModal/index.js - Material-UI v4, makeStyles
- /src/components/SubscriptionModal/index.js - Material-UI v4, makeStyles
- /src/components/InformationModal/index.js - Material-UI v4, makeStyles
- /src/components/ColorBoxModal/index.js - Material-UI v4, makeStyles
- /src/components/ProgressModal/index.js - Material-UI v4, makeStyles
- /src/components/AudioModal/index.js - Material-UI v4, makeStyles
- /src/components/CameraModal/index.js - Material-UI v4, makeStyles
- /src/components/AutoLoginModal/index.js - Material-UI v4, makeStyles
- /src/components/AcceptTicketWithoutQueueModal/index.js - Material-UI v4, makeStyles, Formik
- /src/components/CategoryModal/index.js - Material-UI v4, makeStyles
- /src/components/QueueIntegrationModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
```

**Complexidade**: MÉDIA
**Motivo**: Componentes isolados com funcionalidades específicas

#### Flow Builder (12 arquivos)
```
- /src/components/FlowBuilderModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderAddAudioModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderAddImgModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderAddTextModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderAddTicketModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderAddVideoModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderConditionModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderIntervalModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderMenuModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderRandomizerModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/components/FlowBuilderSingleBlockModal/index.js - Material-UI v4, makeStyles, react-toastify, Formik
- /src/pages/FlowBuilder/index.js - Material-UI v4, makeStyles
```

**Complexidade**: MÉDIA
**Motivo**: Funcionalidade específica do Flow Builder

### PRIORIDADE BAIXA (Menos crítica)

#### Componentes Utilitários (78 arquivos)
```
- /src/components/FormFields/* (4 arquivos) - Material-UI v4, Formik
- /src/components/Dashboard/* (2 arquivos) - Material-UI v4, makeStyles
- /src/components/Settings/* (2 arquivos) - Material-UI v4, makeStyles, react-toastify
- /src/components/CheckoutPage/* (8 arquivos) - Material-UI v4, makeStyles, Formik
- Filtros, Selects, e componentes menores (62 arquivos)
```

**Complexidade**: SIMPLES
**Motivo**: Componentes pequenos com funcionalidades específicas

#### Hooks e Utilitários (10 arquivos)
```
- /src/hooks/useQuery.js - react-query (JÁ COM WRAPPER)
- /src/hooks/useMutation.js - react-query (JÁ COM WRAPPER)
- /src/hooks/migration/* (2 arquivos) - Helpers de migração
- /src/config/query-config.js - react-query (JÁ MIGRADO)
- Outros utilitários (5 arquivos)
```

**Complexidade**: SIMPLES
**Motivo**: React Query já tem wrapper de compatibilidade

## Análise de Complexidade por API

### 1. Material-UI v4 → MUI v5
**Complexidade**: ALTA
**Motivos**:
- Mudanças nos imports (`@material-ui/core` → `@mui/material`)
- Sistema de temas alterado
- Props e componentes descontinuados
- makeStyles descontinuado

**Estratégia**:
- Usar codemod do MUI para migração automática inicial
- Revisão manual obrigatória para componentes complexos
- Migração gradual por componente

### 2. makeStyles → styled() ou sx
**Complexidade**: ALTA
**Motivos**:
- 163 arquivos afetados
- Refatoração completa do sistema de estilos
- Possível quebra de layouts existentes

**Estratégia**:
- Priorizar migração para sx prop (mais simples)
- styled() apenas para casos complexos
- Testes visuais obrigatórios

### 3. react-toastify → react-hot-toast
**Complexidade**: MÉDIA
**Motivos**:
- 104 arquivos afetados
- API diferente entre bibliotecas
- toastError.js precisa ser reescrito

**Estratégia**:
- Criar wrapper de compatibilidade
- Migração gradual por componente
- Atualizar toastError.js primeiro

### 4. Formik → React Hook Form
**Complexidade**: MÉDIA
**Motivos**:
- 47 arquivos afetados
- API completamente diferente
- Validações Yup precisam ser adaptadas

**Estratégia**:
- Manter Yup para validações
- Criar componentes FormFields compatíveis
- Migração por formulário

### 5. React Query v3 → TanStack Query v5
**Complexidade**: BAIXA
**Motivos**:
- Apenas 5 arquivos
- Wrapper de compatibilidade já implementado
- Migração quase completa

**Estratégia**:
- Finalizar migração dos 5 arquivos restantes
- Remover wrappers de compatibilidade

## Estimativa de Esforço

### Por Prioridade:
- **ALTA**: 24 arquivos × 4h = 96 horas
- **MÉDIA**: 63 arquivos × 2h = 126 horas  
- **BAIXA**: 128 arquivos × 1h = 128 horas

**Total Estimado**: 350 horas (≈ 44 dias úteis)

### Por API:
- **Material-UI v4**: 180 horas
- **makeStyles**: 120 horas
- **react-toastify**: 30 horas
- **Formik**: 15 horas
- **React Query**: 5 horas

## Estratégia de Migração Recomendada

### Fase 7A: Fundação (1-2 semanas)
1. **toastError.js** - Criar wrapper react-hot-toast
2. **FormFields** - Migrar componentes base para React Hook Form
3. **App.js** - Migração completa MUI v5

### Fase 7B: Core System (3-4 semanas)
1. **Páginas principais** (16 arquivos priority alta)
2. **Componentes de sistema** (8 arquivos priority alta)
3. **Testes de regressão visual**

### Fase 7C: Componentes (4-5 semanas)
1. **Modais e Dialogs** (39 arquivos priority média)
2. **Flow Builder** (12 arquivos priority média)
3. **Testes funcionais**

### Fase 7D: Finalização (2-3 semanas)
1. **Componentes utilitários** (78 arquivos priority baixa)
2. **Hooks e utilitários** (10 arquivos priority baixa)
3. **Limpeza e otimização**

## Riscos Identificados

### ALTO RISCO:
- **Layout breaking**: makeStyles → sx pode quebrar layouts
- **Performance**: Mudança massiva pode impactar performance
- **UX**: Mudanças visuais podem confundir usuários

### MÉDIO RISCO:
- **Formulários**: Validações podem ser perdidas na migração
- **Toasts**: Mudança na API pode perder funcionalidades
- **Temas**: Sistema de temas pode precisar revisão

### BAIXO RISCO:
- **Hooks**: React Query já tem wrapper funcional
- **Utilitários**: Componentes simples com baixo risco

## Recomendações

1. **Migração Incremental**: Nunca migrar tudo de uma vez
2. **Testes Visuais**: Cada componente precisa teste visual
3. **Feature Flags**: Usar para rollback rápido se necessário
4. **Documentação**: Documentar padrões da nova API
5. **Treinamento**: Time precisa conhecer MUI v5 e React Hook Form

## Próximos Passos

1. **Aprovação**: Revisar e aprovar estratégia de migração
2. **Setup**: Configurar ferramentas de migração (codemods)
3. **Baseline**: Criar testes visuais da aplicação atual
4. **Início**: Começar pela Fase 7A (Fundação)

---

**Data da Auditoria**: $(date)
**Arquivos Analisados**: 215 arquivos .js em src/
**Status**: PRONTO PARA FASE 7