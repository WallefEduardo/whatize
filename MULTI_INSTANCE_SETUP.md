# 🚀 SETUP MULTI-INSTÂNCIAS - IMPLEMENTAÇÃO COMPLETA

## ✅ O QUE FOI IMPLEMENTADO

### **Frontend Modificado (1 único)**
- ✅ Campo "Código da Empresa" no formulário de login
- ✅ Validação do código da empresa
- ✅ Configuração dinâmica do backend baseado no código
- ✅ Persistência da instância escolhida no localStorage
- ✅ Limpeza dos dados da empresa no logout

### **Arquivos Criados/Modificados:**
1. **`/frontend/src/config/instances.js`** - Mapeamento códigos → backends
2. **`/frontend/src/hooks/useAuth.js/index.js`** - Lógica de autenticação multi-instância
3. **`/frontend/src/pages/Login/index.js`** - Formulário com campo código da empresa
4. **`/frontend/.env.example`** - Exemplo de configuração das URLs

## 🔧 COMO FUNCIONA

### **Login Flow:**
1. Usuário digita código da empresa (ex: "EMP001")
2. Frontend consulta mapeamento: `EMP001 → http://localhost:3000`
3. Configura axios.baseURL para o backend correto
4. Faz login normal no backend específico
5. Salva código da empresa no localStorage

### **Códigos Padrão Configurados:**
- **EMP001** → Backend atual (porta 3000)
- **EMP002** → Backend novo (porta 3001)

## 🛠️ PRÓXIMOS PASSOS PARA VOCÊ

### **1. Configurar .env do Frontend**
```bash
cd /www/wwwroot/WhatizeBeta/frontend
cp .env.example .env

# Editar .env com suas URLs:
# REACT_APP_BACKEND_URL=http://localhost:3000
# REACT_APP_BACKEND_URL_2=http://localhost:3001
```

### **2. Testar com Backend Atual**
```bash
cd /www/wwwroot/WhatizeBeta/frontend
npm start

# No login, usar:
# Código: EMP001
# Email/Senha: suas credenciais normais
```

### **3. Duplicar e Configurar Backend 2**
```bash
# Copiar projeto inteiro
cp -r /www/wwwroot/WhatizeBeta /www/wwwroot/WhatizeBeta_Instance2

# Configurar .env da segunda instância
cd /www/wwwroot/WhatizeBeta_Instance2/backend
nano .env

# Alterar:
# PORT=3001
# DATABASE_URL=postgresql://user:pass@localhost:5433/sistema2_db
# (Usar banco diferente!)
```

### **4. Criar Banco da Segunda Instância**
```sql
-- Criar novo banco
CREATE DATABASE sistema2_db;

-- Executar migrations
cd /www/wwwroot/WhatizeBeta_Instance2/backend
npm run db:migrate
npm run db:seed
```

### **5. Executar Ambos os Backends**
```bash
# Terminal 1 - Backend Instância 1
cd /www/wwwroot/WhatizeBeta/backend
npm run dev

# Terminal 2 - Backend Instância 2  
cd /www/wwwroot/WhatizeBeta_Instance2/backend
npm run dev
```

### **6. Testar Multi-Instância**
- Acessar: `http://localhost:3000` (frontend)
- Login 1: Código "EMP001" + credenciais da instância 1
- Login 2: Código "EMP002" + credenciais da instância 2

## 🌐 PRODUÇÃO

### **Estrutura Recomendada:**
```
Frontend: https://app.seudominio.com
Backend 1: https://api1.seudominio.com  
Backend 2: https://api2.seudominio.com
```

### **Configurar /frontend/src/config/instances.js:**
```javascript
const INSTANCES_MAP = {
  "EMP001": "https://api1.seudominio.com",
  "EMP002": "https://api2.seudominio.com",
  // Adicionar mais conforme necessário
};
```

## ✨ VANTAGENS DA IMPLEMENTAÇÃO

- ✅ **1 Frontend** = 1 domínio, 1 manutenção
- ✅ **N Backends** = Dados totalmente isolados
- ✅ **Transparente** = Usuário não percebe diferença
- ✅ **Escalável** = Fácil adicionar mais instâncias
- ✅ **Flexível** = Pode ter backends em servidores diferentes

## 🔍 TESTAR AGORA

1. Configure o .env do frontend
2. Execute `npm start` no frontend
3. Acesse `http://localhost:3000`  
4. Use código "EMP001" para testar com backend atual

**Pronto para duplicar o backend e ter sistema completo!** 🎉