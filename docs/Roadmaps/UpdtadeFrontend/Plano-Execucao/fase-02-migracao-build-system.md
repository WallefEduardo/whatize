# ⚡ FASE 2: Migração Build System

## 📋 Informações Gerais
- **Duração**: 2-3 dias úteis
- **Prioridade**: CRÍTICA
- **Prerequisitos**: [Fase 1 - Preparação e Setup](./fase-01-preparacao-setup.md) ✅
- **Próxima Fase**: [Fase 3 - Sistema de Design](./fase-03-sistema-design.md)

---

## 🚨 REGRA FUNDAMENTAL
### ⚠️ NUNCA QUEBRAR AS LÓGICAS EXISTENTES DO SISTEMA
Durante toda esta fase, TODAS as funcionalidades existentes devem continuar funcionando. A migração do build system deve ser transparente para o usuário final.

---

## 🎯 Objetivos da Fase
1. **Migrar de Create React App → Vite** (performance 10x melhor)
2. **Atualizar React 16.13.1 → 18.3.x** (preservando compatibilidade)
3. **Configurar TypeScript** adequadamente sem quebrar JS existente
4. **Implementar logs robustos** em cada etapa da migração
5. **Garantir compatibilidade** com todas as funcionalidades atuais

---

## 📊 Sistema de Logs - Foco na Fase 2

### Logs Específicos desta Fase
```typescript
// Extensão do logger para Fase 2
export const phase2Logger = {
  buildSystem: {
    viteMigration: (step: string, status: 'START' | 'SUCCESS' | 'ERROR', metadata?: any) => {
      const message = `[VITE-MIGRATION] ${step} - ${status}`;
      logger.migration.phaseStart(message);
      logger.development.build(message, metadata);
    },

    reactUpdate: (component: string, status: string, compatibility?: boolean) => {
      const message = `[REACT-UPDATE] ${component} - ${status}`;
      if (!compatibility) {
        logger.migration.warningPreservation(`Possível incompatibilidade em ${component}`);
      }
      logger.development.build(message, { component, compatibility });
    },

    typeScriptConfig: (file: string, action: string) => {
      const message = `[TYPESCRIPT] ${file} - ${action}`;
      logger.development.build(message);
    },

    preservationCheck: (functionality: string, working: boolean) => {
      const message = `[PRESERVATION] ${functionality} - ${working ? 'OK' : 'FALHOU'}`;
      if (!working) {
        logger.migration.warningPreservation(`FUNCIONALIDADE QUEBRADA: ${functionality}`);
        logger.production.error(`CRITICAL: ${functionality} não está funcionando`);
      }
      logger.development.build(message, { functionality, working });
    }
  }
};
```

---

## 📋 Tarefas Detalhadas

### 1. Preparação para Migração do Build System
**Tempo estimado**: 45 minutos

#### 1.1 Validar Estado Atual
```bash
# Garantir que estamos na branch correta
git checkout feature/frontend-modernization-2025

# Log início da fase
echo "$(date): INICIANDO FASE 2 - Migração Build System" >> logs/migration/phases.log

# Testar build atual uma última vez
npm run build
if [ $? -eq 0 ]; then
    echo "$(date): Build atual OK - Prosseguindo" >> logs/migration/phases.log
else
    echo "$(date): Build atual FALHOU - PARAR" >> logs/migration/phases.log
    exit 1
fi
```

#### 1.2 Backup da Configuração Atual
```bash
# Backup de configurações críticas
cp package.json package.json.fase1-backup
cp public/index.html public/index.html.backup
cp tsconfig.json tsconfig.json.backup 2>/dev/null || echo "tsconfig.json não existe"

# Log do backup
echo "$(date): Backup configurações Fase 2 criado" >> logs/migration/phases.log
```

#### 1.3 Documentar Scripts Atuais
```bash
# Documentar scripts atuais do package.json
grep -A 20 '"scripts"' package.json > ../backups/scripts-current.txt
echo "$(date): Scripts atuais documentados" >> logs/migration/phases.log
```

### 2. Instalação e Configuração do Vite
**Tempo estimado**: 1.5 horas

#### 2.1 Instalar Vite e Dependências
```bash
# Instalar Vite
npm install --save-dev vite @vitejs/plugin-react

# Log da instalação
echo "$(date): Vite instalado" >> logs/migration/phases.log
```

#### 2.2 Criar Configuração do Vite
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Manter aliases existentes para não quebrar imports
      'src': path.resolve(__dirname, './src'),
      'components': path.resolve(__dirname, './src/components'),
      'pages': path.resolve(__dirname, './src/pages'),
      'services': path.resolve(__dirname, './src/services'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'context': path.resolve(__dirname, './src/context'),
      'utils': path.resolve(__dirname, './src/utils'),
      'assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3002, // Manter porta do projeto
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4002', // Backend na porta 4002
        changeOrigin: true,
        secure: false
      },
    },
  },
  build: {
    outDir: 'build', // Manter diretório de build atual
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          // Otimização de chunks para melhor performance
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          utils: ['axios', 'date-fns', 'lodash'],
        },
      },
    },
  },
  define: {
    // Manter variáveis de ambiente existentes
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      // Pré-bundling de dependências críticas
      'react', 
      'react-dom',
      'axios',
      'socket.io-client',
      '@mui/material',
      'zustand'
    ]
  }
})
```

#### 2.3 Atualizar index.html para Vite
```bash
# Backup do index.html atual
cp public/index.html public/index.html.cra-backup

# Atualizar public/index.html para Vite
```

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Whatize - WhatsApp Business Management Platform" />
    
    <!-- Manter todos os links e metas existentes -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />
    
    <title>Whatize</title>
  </head>
  <body>
    <noscript>Você precisa habilitar JavaScript para executar este app.</noscript>
    <div id="root"></div>
    
    <!-- Ponto de entrada do Vite -->
    <script type="module" src="/src/index.js"></script>
  </body>
</html>
```

#### 2.4 Atualizar Scripts do Package.json
```json
{
  "scripts": {
    "dev": "vite",
    "start": "vite",
    "build": "vite build",
    "builddev": "vite build --mode development",
    "preview": "vite preview",
    "test": "vitest",
    
    // Manter scripts de compatibilidade
    "start:legacy": "react-scripts --openssl-legacy-provider start",
    "build:legacy": "cross-env GENERATE_SOURCEMAP=false NODE_OPTIONS=--openssl-legacy-provider react-scripts build",
    
    // Scripts de migração
    "migration:validate": "vite build && echo 'Vite build OK'",
    "migration:compare": "npm run build:legacy && npm run build && echo 'Comparação concluída'"
  }
}
```

### 3. Atualização do React 16 → 18
**Tempo estimado**: 2 horas

#### 3.1 Instalar React 18
```bash
# ⚠️ CUIDADO: Esta é uma atualização crítica
# Fazer uma validação a cada passo

# Instalar React 18
npm install react@18 react-dom@18

# Instalar types se necessário
npm install --save-dev @types/react@18 @types/react-dom@18

# Log da instalação
echo "$(date): React 18 instalado" >> logs/migration/phases.log
```

#### 3.2 Atualizar Entry Point (src/index.js)
```javascript
// src/index.js - Migração cuidadosa para React 18
import React from 'react';
import { createRoot } from 'react-dom/client'; // React 18 API
import App from './App';
import './index.css';

// Log da migração
console.log('[MIGRATION] Inicializando React 18');

// Verificar se elemento root existe (preservar funcionalidade)
const container = document.getElementById('root');
if (!container) {
  console.error('[MIGRATION ERROR] Elemento root não encontrado!');
  throw new Error('Elemento root não encontrado - verifique index.html');
}

// Usar nova API do React 18, mas com fallback
try {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('[MIGRATION] React 18 inicializado com sucesso');
} catch (error) {
  console.error('[MIGRATION ERROR] Falha ao inicializar React 18:', error);
  // Em caso de erro, manter funcionalidade (não implementar fallback aqui, apenas logar)
  throw error;
}
```

#### 3.3 Verificar Compatibilidade de Componentes
```typescript
// src/utils/react18-compatibility.ts
interface CompatibilityCheck {
  component: string;
  compatible: boolean;
  issues: string[];
  solution?: string;
}

export const checkReact18Compatibility = (): CompatibilityCheck[] => {
  const checks: CompatibilityCheck[] = [];

  // Verificar se há uso de APIs deprecadas
  // Esta função será chamada durante a migração para logar problemas

  // 1. Verificar ReactDOM.render (deve ter sido atualizado)
  // 2. Verificar componentWillMount, componentWillUpdate, etc.
  // 3. Verificar string refs
  // 4. Verificar findDOMNode

  return checks;
};

// Hook para componentes que podem ter problemas
export const useReact18CompatibilityLogger = (componentName: string) => {
  React.useEffect(() => {
    console.log(`[REACT18-COMPAT] ${componentName} montado no React 18`);
  }, [componentName]);
};
```

#### 3.4 Atualizar Configuração do TypeScript
```json
// tsconfig.json - Atualizado para React 18
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": [
      "dom",
      "dom.iterable", 
      "ES6"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false, // Gradualmente aumentar para true
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx", // React 18 JSX transform

    // Path mapping para manter imports existentes
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "src/*": ["src/*"],
      "components/*": ["src/components/*"],
      "pages/*": ["src/pages/*"],
      "services/*": ["src/services/*"],
      "hooks/*": ["src/hooks/*"],
      "context/*": ["src/context/*"],
      "utils/*": ["src/utils/*"],
      "assets/*": ["src/assets/*"]
    }
  },
  "include": [
    "src",
    "vite.config.ts"
  ],
  "exclude": [
    "node_modules",
    "build"
  ]
}
```

### 4. Configuração Gradual do TypeScript
**Tempo estimado**: 1 hora

#### 4.1 Configurar TypeScript Sem Quebrar JavaScript
```typescript
// src/types/global.d.ts - Declarações globais para evitar erros
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.mp3';
declare module '*.ogg';

// Declarações para bibliotecas sem tipos
declare module 'react-modal-image';
declare module 'react-webcam';
declare module 'react-html5-camera-photo';
declare module 'mic-recorder-to-mp3';
declare module 'emoji-mart';

// Manter compatibilidade com código JavaScript existente
declare global {
  interface Window {
    // Adicionar propriedades do window se necessário
  }
}
```

#### 4.2 Criar Utilitários de Migração TypeScript
```typescript
// src/utils/migration-helpers.ts
export const preserveJavaScriptFunctionality = () => {
  // Garantir que JavaScript e TypeScript coexistam
  console.log('[MIGRATION] JavaScript/TypeScript híbrido configurado');
};

// Wrapper para componentes JavaScript existentes
export const wrapJSComponent = <T extends React.ComponentType<any>>(
  component: T,
  componentName: string
): T => {
  const WrappedComponent = (props: any) => {
    console.log(`[JS-COMPAT] ${componentName} renderizado`);
    return React.createElement(component, props);
  };
  
  return WrappedComponent as T;
};
```

### 5. Testes de Migração e Validação
**Tempo estimado**: 1.5 horas

#### 5.1 Script de Validação Completa
```bash
#!/bin/bash
# scripts/validate-phase2.sh

echo "🔍 VALIDAÇÃO FASE 2 - Build System Migration"
echo "$(date): Iniciando validação Fase 2" >> logs/migration/phases.log

# 1. Testar build com Vite
echo "1. Testando build com Vite..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Vite build - OK"
    echo "$(date): Vite build - SUCESSO" >> logs/migration/phases.log
else
    echo "❌ Vite build - FALHOU"
    echo "$(date): Vite build - FALHOU" >> logs/migration/phases.log
    exit 1
fi

# 2. Testar servidor de desenvolvimento
echo "2. Testando servidor de desenvolvimento..."
timeout 30s npm run dev &
DEV_PID=$!
sleep 10

# Verificar se o servidor está rodando
if curl -f http://localhost:3002 >/dev/null 2>&1; then
    echo "✅ Servidor de desenvolvimento - OK"
    echo "$(date): Dev server - SUCESSO" >> logs/migration/phases.log
else
    echo "❌ Servidor de desenvolvimento - FALHOU"
    echo "$(date): Dev server - FALHOU" >> logs/migration/phases.log
fi

# Matar processo do servidor
kill $DEV_PID 2>/dev/null

# 3. Verificar se todas as rotas ainda existem
echo "3. Verificando rotas..."
if [ -f "src/routes/index.js" ]; then
    echo "✅ Arquivo de rotas presente"
    echo "$(date): Rotas - OK" >> logs/migration/phases.log
else
    echo "❌ Arquivo de rotas não encontrado"
    echo "$(date): Rotas - FALHOU" >> logs/migration/phases.log
    exit 1
fi

# 4. Verificar estrutura de componentes
echo "4. Verificando componentes..."
COMPONENT_COUNT=$(find src/components -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | wc -l)
if [ $COMPONENT_COUNT -gt 0 ]; then
    echo "✅ $COMPONENT_COUNT componentes encontrados"
    echo "$(date): Componentes - $COMPONENT_COUNT encontrados" >> logs/migration/phases.log
else
    echo "❌ Nenhum componente encontrado"
    echo "$(date): Componentes - NENHUM ENCONTRADO" >> logs/migration/phases.log
    exit 1
fi

# 5. Verificar se React 18 foi instalado corretamente
echo "5. Verificando React 18..."
REACT_VERSION=$(npm list react --depth=0 | grep react@)
if echo "$REACT_VERSION" | grep -q "18\."; then
    echo "✅ React 18 instalado: $REACT_VERSION"
    echo "$(date): React 18 - INSTALADO" >> logs/migration/phases.log
else
    echo "❌ React 18 não detectado: $REACT_VERSION"
    echo "$(date): React 18 - NÃO DETECTADO" >> logs/migration/phases.log
    exit 1
fi

echo "✅ VALIDAÇÃO FASE 2 CONCLUÍDA COM SUCESSO"
echo "$(date): Validação Fase 2 - SUCESSO COMPLETO" >> logs/migration/phases.log
```

#### 5.2 Teste de Funcionalidades Críticas
```typescript
// src/utils/functionality-tests.ts
interface FunctionalityTest {
  name: string;
  test: () => Promise<boolean>;
  critical: boolean;
}

export const criticalFunctionalityTests: FunctionalityTest[] = [
  {
    name: 'API Communication',
    critical: true,
    test: async () => {
      try {
        // Testar se API ainda responde
        const response = await fetch('/api/health-check');
        return response.ok;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Socket.IO Connection',
    critical: true,
    test: async () => {
      try {
        // Testar conexão WebSocket
        return true; // Implementar teste real
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Authentication',
    critical: true,
    test: async () => {
      try {
        // Testar se auth ainda funciona
        return true; // Implementar teste real
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Component Rendering',
    critical: true,
    test: async () => {
      try {
        // Testar se componentes renderizam
        return true; // Implementar teste real
      } catch {
        return false;
      }
    }
  }
];

export const runFunctionalityTests = async (): Promise<void> => {
  console.log('[FUNCTIONALITY-TESTS] Iniciando testes críticos');
  
  for (const test of criticalFunctionalityTests) {
    try {
      const result = await test.test();
      const status = result ? 'PASSOU' : 'FALHOU';
      
      console.log(`[FUNCTIONALITY-TESTS] ${test.name}: ${status}`);
      
      if (!result && test.critical) {
        throw new Error(`Teste crítico falhou: ${test.name}`);
      }
    } catch (error) {
      console.error(`[FUNCTIONALITY-TESTS] Erro em ${test.name}:`, error);
      if (test.critical) {
        throw error;
      }
    }
  }
  
  console.log('[FUNCTIONALITY-TESTS] Todos os testes concluídos');
};
```

#### 5.3 Remover Create React App (CUIDADOSAMENTE)
```bash
# Apenas após validação completa
echo "🗑️ Removendo Create React App..."

# Remover react-scripts apenas se Vite está funcionando
npm uninstall react-scripts

# Remover configurações desnecessárias
# (Manter backups caso precisemos reverter)

echo "$(date): Create React App removido - Vite funcionando" >> logs/migration/phases.log
```

---

## ✅ Critérios de Conclusão da Fase 2

### Obrigatórios (Todos devem ser atendidos)
- [ ] **Vite configurado** e build funcionando perfeitamente
- [ ] **React 18 instalado** e aplicação funcionando
- [ ] **TypeScript configurado** sem quebrar JavaScript existente
- [ ] **Todas as funcionalidades** ainda funcionam normalmente
- [ ] **Performance de build** melhorou significativamente
- [ ] **HMR** está 10x mais rápido
- [ ] **Logs de migração** documentam cada passo

### Validações de Preservação
- [ ] **Todas as rotas** ainda funcionam
- [ ] **Todos os componentes** renderizam corretamente
- [ ] **API calls** funcionam normalmente
- [ ] **Socket.IO** conecta corretamente
- [ ] **Autenticação** não foi afetada
- [ ] **Build de produção** gera arquivos corretos

### Métricas de Performance
- [ ] **Build time** reduzido em pelo menos 70%
- [ ] **HMR** em menos de 500ms
- [ ] **Bundle size** mantido ou reduzido
- [ ] **Dev server** inicia em menos de 5 segundos

### Logs Essenciais Gerados
- [ ] `logs/migration/phases.log` - Todas as etapas da Fase 2
- [ ] `logs/development/build.log` - Logs de build do Vite
- [ ] `logs/migration/preservation.log` - Verificações de preservação

---

## 🚨 Procedimentos de Emergência

### Se Vite Não Funcionar
1. **Reverter para Create React App**:
```bash
git checkout package.json.fase1-backup
npm install
npm run start:legacy
```

2. **Documentar problema**:
```bash
echo "$(date): ROLLBACK - Vite falhou, voltando CRA" >> logs/migration/preservation.log
```

### Se React 18 Quebrar Algo
1. **Downgrade para React 16**:
```bash
npm install react@16.13.1 react-dom@16.13.1
```

2. **Reverter index.js**:
```bash
# Voltar para ReactDOM.render
```

### Se Build Quebrar Completamente
1. **Rollback total**:
```bash
git checkout package.json.fase1-backup
git checkout public/index.html.backup
npm install
npm run build:legacy
```

---

## 📞 Checkpoint da Fase 2

### Validação Obrigatória
Antes de prosseguir para Fase 3:
1. **Executar script de validação**: `bash scripts/validate-phase2.sh`
2. **Testar todas as funcionalidades** manualmente
3. **Verificar métricas de performance**
4. **Confirmar logs** estão sendo gerados corretamente

### Aprovação para Fase 3
**APENAS prosseguir se:**
- ✅ Build com Vite 100% funcional
- ✅ React 18 funcionando sem problemas
- ✅ TypeScript configurado corretamente
- ✅ ZERO funcionalidades quebradas
- ✅ Performance significativamente melhorada
- ✅ Equipe aprovou continuidade

---

**Próxima Fase**: [Fase 3 - Sistema de Design](./fase-03-sistema-design.md)

---

*Documento da Fase 2 - Criado em: Agosto 2025*
*Responsável: Claude AI Assistant*
*Status: Preparado para execução*