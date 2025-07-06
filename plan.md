# Sistema de Categorias para Central de Ajuda - Plano de Desenvolvimento

## Visão Geral

Este plano detalha a implementação de um sistema de categorias para a Central de Ajuda do Whatize, permitindo organizar vídeos tutoriais por categorias com ícones personalizados, busca avançada e interface moderna com menu lateral.

## Funcionalidades a Implementar

### 1. Sistema de Categorias
- Cadastro de categorias com nome, descrição e ícone
- Upload de ícones personalizados para cada categoria
- Vinculação de vídeos às categorias
- Contagem automática de vídeos por categoria

### 2. Interface Moderna
- Menu lateral com categorias (nome, ícone, quantidade de vídeos)
- Lista de vídeos com thumbnails, título e descrição
- Campo de busca global (título, categoria, descrição)
- Layout responsivo e moderno

### 3. Funcionalidades de Busca
- Busca por título do vídeo
- Busca por categoria
- Busca por descrição
- Filtros por categoria

## 1. Configuração do Projeto

### 1.1 Estrutura do Banco de Dados
- [ ] Adicionar campos de categoria ao model `Help` existente
  - Campos: category, categoryIcon (na tabela Helps)
- [ ] Criar migration para adicionar campos `category` e `categoryIcon` à tabela `Helps`
- [ ] Manter compatibilidade com a estrutura existente do sistema de Helps

### 1.2 Configuração de Upload de Arquivos
- [ ] Usar sistema de upload existente do projeto
- [ ] Configurar upload de ícones para categorias (32x32px)
- [ ] Seguir padrão existente de validação de arquivos

## 2. Base do Backend

### 2.1 Models e Migrations
- [ ] Atualizar model `Help.ts` existente
  - Adicionar campos category e categoryIcon
  - Manter estrutura existente
- [ ] Criar migration `AddCategoryFieldsToHelpsTable.ts`
  - Adicionar campos category (varchar) e categoryIcon (varchar)
  - Seguir padrão das migrations existentes do projeto

### 2.2 Atualização dos Services Existentes
- [ ] Atualizar `HelpServices/CreateService.ts`
  - Adicionar suporte aos campos category e categoryIcon
- [ ] Atualizar `HelpServices/UpdateService.ts`
  - Permitir edição de categoria e ícone
- [ ] Atualizar `HelpServices/ListService.ts`
  - Incluir campos de categoria nos resultados
  - Implementar busca por categoria
- [ ] Criar `HelpServices/GetCategoriesService.ts`
  - Listar categorias únicas com contagem de vídeos

### 2.3 Controllers
- [ ] Atualizar `HelpController.ts` existente
  - Adicionar suporte aos novos campos
  - Implementar endpoint para listar categorias
  - Manter compatibilidade com funcionalidades existentes
  - Seguir padrão de autenticação superadmin existente

## 3. Backend Específico de Funcionalidades

### 3.1 Endpoints da API
- [ ] `GET /helps/categories` - Listar categorias únicas com contagem
- [ ] Atualizar endpoints existentes de helps para incluir category e categoryIcon
- [ ] Implementar busca avançada nos endpoints existentes

### 3.2 Atualização dos Endpoints de Help
- [ ] Modificar `HelpServices/ListService.ts`
  - Incluir dados da categoria nos resultados
  - Implementar busca por categoria
- [ ] Modificar `HelpServices/CreateService.ts`
  - Validar categoryId fornecido
- [ ] Modificar `HelpServices/UpdateService.ts`
  - Permitir alteração de categoria
- [ ] Criar `HelpServices/SearchService.ts`
  - Busca avançada por título, categoria e descrição
  - Filtros combinados

### 3.3 Rotas
- [ ] Criar `helpCategoryRoutes.ts`
  - Definir rotas com middlewares apropriados
  - Configurar upload de arquivos
- [ ] Atualizar `helpRoutes.ts`
  - Adicionar rota de busca avançada
  - Incluir filtros por categoria

## 4. Base do Frontend

### 4.1 Hooks e Services
- [ ] Criar `useHelpCategories/index.js`
  - Funções CRUD para categorias
  - Upload de ícones
  - Cache de dados
- [ ] Atualizar `useHelps/index.js`
  - Adicionar busca avançada
  - Filtros por categoria
  - Incluir dados de categoria nos resultados

### 4.2 Componentes Base
- [ ] Criar `HelpCategoryModal/index.js`
  - Modal para CRUD de categorias
  - Upload de ícone com preview
  - Validação de formulário
- [ ] Criar `HelpCategoryIcon/index.js`
  - Componente para exibir ícones
  - Fallback para ícone padrão
  - Otimização de carregamento

### 4.3 Atualização de Componentes Existentes
- [ ] Modificar `HelpsManager/index.js`
  - Adicionar campo de seleção de categoria
  - Botão para gerenciar categorias
  - Exibir categoria na tabela
- [ ] Criar `CategorySelector/index.js`
  - Dropdown de seleção de categoria
  - Busca por nome da categoria
  - Opção "Sem categoria"

## 5. Frontend Específico de Funcionalidades

### 5.1 Nova Interface da Central de Ajuda
- [ ] Redesenhar `pages/Helps/index.js`
  - Layout com sidebar e conteúdo principal
  - Menu lateral com categorias
  - Lista de vídeos modernizada
- [ ] Criar `HelpsSidebar/index.js`
  - Menu de categorias com ícones
  - Contadores de vídeos
  - Filtro "Todos os vídeos"
- [ ] Criar `HelpVideoCard/index.js`
  - Card moderno para vídeos
  - Thumbnail, título e descrição
  - Badge da categoria
- [ ] Criar `HelpSearchBar/index.js`
  - Campo de busca em tempo real (conforme usuário digita)
  - Busca por título, categoria e descrição
  - Filtros por categoria

### 5.2 Componentes de Gerenciamento
- [ ] Criar `HelpCategoryManager/index.js`
  - Interface para gerenciar categorias
  - Listagem com drag-and-drop para ordenação
  - Ações em lote
- [ ] Criar `IconUploader/index.js`
  - Upload com preview
  - Validação de formato e tamanho
  - Crop de imagem

### 5.3 Layouts e Navegação
- [ ] Atualizar estilos globais
  - Paleta de cores consistente
  - Tipografia moderna
  - Animações suaves
- [ ] Implementar responsividade
  - Menu lateral sempre visível (não colapsável)
  - Grid adaptativo para cards em mobile
  - Design responsivo profissional

## 6. Integração

### 6.1 Integração Frontend-Backend
- [ ] Configurar interceptadores de requisição
  - Tratamento de erros de upload
  - Loading states
  - Cache de imagens
- [ ] Implementar WebSocket para atualizações em tempo real
  - Notificações de novas categorias
  - Sincronização de contadores
- [ ] Configurar lazy loading
  - Carregamento progressivo de vídeos
  - Paginação infinita
  - Otimização de imagens

### 6.2 Migração de Dados
- [ ] Criar script de migração
  - Criar categoria padrão "Geral"
  - Migrar vídeos existentes para categoria padrão
  - Validar integridade dos dados
- [ ] Implementar rollback
  - Backup automático antes da migração
  - Procedimento de reversão

## 7. Testes

### 7.1 Testes Backend
- [ ] Testes unitários para HelpCategoryServices
  - Validação de dados
  - Upload de arquivos
  - Relacionamentos
- [ ] Testes de integração para endpoints
  - CRUD completo
  - Validação de permissões
  - Tratamento de erros
- [ ] Testes de upload
  - Validação de tipos de arquivo
  - Limitação de tamanho
  - Processamento de imagens

### 7.2 Testes Frontend
- [ ] Testes de componentes
  - Renderização correta
  - Interações do usuário
  - Estados de loading
- [ ] Testes de integração
  - Fluxo completo de CRUD
  - Busca e filtros
  - Upload de arquivos
- [ ] Testes de responsividade
  - Diferentes tamanhos de tela
  - Touch interactions
  - Acessibilidade

### 7.3 Testes End-to-End
- [ ] Cenários de uso completos
  - Criação de categoria com ícone
  - Vinculação de vídeos
  - Busca e navegação
- [ ] Testes de performance
  - Carregamento de muitas categorias
  - Upload de arquivos grandes
  - Busca com muitos resultados

## 8. Documentação

### 8.1 Documentação da API
- [ ] Documentar endpoints de categorias
  - Parâmetros e respostas
  - Exemplos de uso
  - Códigos de erro
- [ ] Atualizar documentação de helps
  - Novos campos e filtros
  - Exemplos de busca avançada

### 8.2 Documentação do Usuário
- [ ] Guia de uso da Central de Ajuda
  - Como navegar pelas categorias
  - Como usar a busca
  - Como assistir vídeos
- [ ] Manual administrativo
  - Como criar categorias
  - Como fazer upload de ícones
  - Como organizar vídeos

### 8.3 Documentação Técnica
- [ ] Arquitetura do sistema
  - Diagramas de relacionamento
  - Fluxo de dados
  - Estrutura de arquivos
- [ ] Guia de manutenção
  - Como adicionar novas funcionalidades
  - Troubleshooting comum
  - Backup e restore

## 9. Implantação

### 9.1 Preparação do Ambiente
- [ ] Configurar variáveis de ambiente
  - Paths de upload
  - Configurações de imagem
  - Limites de arquivo
- [ ] Configurar permissões de pasta
  - Pasta de uploads
  - Permissões de escrita
  - Backup automático

### 9.2 Deploy em Staging
- [ ] Executar migrações
  - Backup do banco antes da migração
  - Validação de dados
  - Teste de rollback
- [ ] Teste de funcionalidades
  - Upload de arquivos
  - Busca e filtros
  - Performance

### 9.3 Deploy em Produção
- [ ] Janela de manutenção
  - Notificação aos usuários
  - Backup completo
  - Monitoramento de logs
- [ ] Validação pós-deploy
  - Funcionalidades críticas
  - Performance da aplicação
  - Integridade dos dados

## 10. Manutenção

### 10.1 Monitoramento
- [ ] Logs de upload
  - Falhas de upload
  - Tipos de arquivo rejeitados
  - Performance de processamento
- [ ] Métricas de uso
  - Categorias mais acessadas
  - Vídeos mais assistidos
  - Padrões de busca
- [ ] Alertas automáticos
  - Espaço em disco
  - Falhas de upload
  - Erros de API

### 10.2 Otimização Contínua
- [ ] Cache de imagens
  - CDN para ícones
  - Compressão automática
  - Lazy loading
- [ ] Índices de banco
  - Otimização de consultas
  - Análise de performance
  - Limpeza de dados antigos

### 10.3 Backup e Segurança
- [ ] Backup automático de arquivos
  - Ícones de categorias
  - Configurações
  - Logs de acesso
- [ ] Validação de segurança
  - Sanitização de uploads
  - Validação de tipos MIME
  - Proteção contra XSS

## Considerações Técnicas

### Tecnologias Utilizadas
- **Backend**: Node.js, TypeScript, Sequelize, Multer
- **Frontend**: React, Material-UI, Formik, Axios
- **Banco de Dados**: PostgreSQL/MySQL (conforme configuração atual)
- **Upload**: Multer com validação de tipos
- **Cache**: Redis (se disponível)

### Padrões de Desenvolvimento
- **Arquitetura**: MVC com Services
- **Validação**: Yup para backend e frontend
- **Estado**: Context API + useState/useEffect
- **Estilização**: Material-UI com customização
- **Responsividade**: Mobile-first approach

### Segurança
- **Upload**: Validação de tipos MIME e extensões
- **Autenticação**: Middleware de autenticação existente
- **Autorização**: Verificação de permissões por empresa
- **Sanitização**: Limpeza de dados de entrada

### Performance
- **Lazy Loading**: Carregamento progressivo de conteúdo
- **Cache**: Cache de consultas frequentes
- **Otimização**: Compressão de imagens automática
- **Paginação**: Implementação de paginação para grandes volumes

## Cronograma Estimado

### Fase 1: Backend (5-7 dias)
- Configuração do projeto e banco de dados
- Criação de models e migrations
- Implementação de services e controllers
- Testes unitários

### Fase 2: Frontend Base (3-5 dias)
- Criação de hooks e services
- Componentes base e modais
- Atualização de componentes existentes

### Fase 3: Interface Nova (7-10 dias)
- Redesign da Central de Ajuda
- Componentes de busca e filtros
- Responsividade e animações

### Fase 4: Integração e Testes (3-5 dias)
- Integração frontend-backend
- Testes de integração
- Correção de bugs

### Fase 5: Deploy e Documentação (2-3 dias)
- Preparação do ambiente
- Deploy em staging e produção
- Documentação final

**Total Estimado: 20-30 dias de desenvolvimento**

## Próximos Passos

1. **Validação do Plano**: Revisar e aprovar o plano com a equipe
2. **Configuração Inicial**: Preparar ambiente de desenvolvimento
3. **Início do Desenvolvimento**: Começar pela Fase 1 (Backend)
4. **Acompanhamento**: Reuniões diárias para acompanhar progresso
5. **Testes Contínuos**: Validação em cada etapa do desenvolvimento

## Observações Importantes

- Manter compatibilidade com o sistema existente
- Implementar feature flags para rollback rápido
- Documentar todas as alterações realizadas
- Realizar backups antes de cada deploy
- Monitorar performance após implementação 