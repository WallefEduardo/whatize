# 🏗️ FASE 1: Preparação e Setup

## 📋 Informações Gerais
- **Duração**: 2-3 dias úteis
- **Prioridade**: CRÍTICA
- **Prerequisitos**: Nenhum
- **Próxima Fase**: [Fase 2 - Migração Build System](./fase-02-migracao-build-system.md)

---

## 🚨 REGRA FUNDAMENTAL
### ⚠️ NUNCA QUEBRAR AS LÓGICAS EXISTENTES DO SISTEMA
Durante toda esta fase, TODAS as funcionalidades existentes devem continuar funcionando perfeitamente. Não fazer alterações que possam afetar o funcionamento atual.

---

## 🎯 Objetivos da Fase
1. **Preparar ambiente seguro** para migração
2. **Documentar estado atual** completamente
3. **Criar sistema de backup** robusto
4. **Implementar sistema de logs** abrangente
5. **Mapear dependências críticas** do sistema

---

## 📊 Sistema de Logs - Implementação Obrigatória

### Estrutura de Diretórios de Logs
```bash
# Criar estrutura de logs no frontend
mkdir -p whatize/frontend/logs/development
mkdir -p whatize/frontend/logs/production
mkdir -p whatize/frontend/logs/migration
```

### Arquivo de Configuração de Logs
```typescript
// whatize/frontend/src/utils/logger.ts
export interface LogLevel {
  TRACE: 0;
  DEBUG: 1;
  INFO: 2;
  WARN: 3;
  ERROR: 4;
  FATAL: 5;
}

export interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  phase?: string;
  component?: string;
  metadata?: any;
}

class FrontendLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  // LOGS DE DESENVOLVIMENTO (Detalhados)
  development = {
    migration: (message: string, metadata?: any) => {
      if (this.isDevelopment) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `[MIGRATION] ${message}`,
          phase: 'migration',
          metadata
        };
        console.log(entry.message, metadata || '');
        this.writeToFile('development/migration.log', entry);
      }
    },

    build: (message: string, metadata?: any) => {
      if (this.isDevelopment) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'DEBUG',
          message: `[BUILD] ${message}`,
          metadata
        };
        console.log(entry.message, metadata || '');
        this.writeToFile('development/build.log', entry);
      }
    },

    performance: (metric: string, value: number, metadata?: any) => {
      if (this.isDevelopment) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `[PERF] ${metric}: ${value}ms`,
          metadata: { metric, value, ...metadata }
        };
        console.log(entry.message);
        this.writeToFile('development/performance.log', entry);
      }
    },

    component: (component: string, action: string, metadata?: any) => {
      if (this.isDevelopment) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'DEBUG',
          message: `[COMPONENT] ${component} - ${action}`,
          component,
          metadata
        };
        console.log(entry.message, metadata || '');
        this.writeToFile('development/components.log', entry);
      }
    },

    error: (message: string, error?: Error, metadata?: any) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: `[ERROR] ${message}`,
        metadata: { error: error?.stack, ...metadata }
      };
      console.error(entry.message, error || '');
      this.writeToFile('development/errors.log', entry);
    }
  };

  // LOGS DE PRODUÇÃO (Apenas Essenciais)
  production = {
    system: (message: string, metadata?: any) => {
      if (this.isProduction) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `[SYSTEM] ${message}`,
          metadata
        };
        console.log(entry.message);
        this.writeToFile('production/system.log', entry);
      }
    },

    error: (message: string, error?: Error, metadata?: any) => {
      if (this.isProduction) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: `[ERROR] ${message}`,
          metadata: { error: error?.stack, ...metadata }
        };
        console.error(entry.message, error || '');
        this.writeToFile('production/errors.log', entry);
      }
    },

    performance: (metric: string, value: number) => {
      if (this.isProduction && value > 1000) { // Apenas métricas críticas
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'WARN',
          message: `[PERF-CRITICAL] ${metric}: ${value}ms`,
          metadata: { metric, value }
        };
        console.warn(entry.message);
        this.writeToFile('production/performance.log', entry);
      }
    }
  };

  // LOGS ESPECÍFICOS DA MIGRAÇÃO
  migration = {
    phaseStart: (phase: string) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[MIGRATION-START] Iniciando ${phase}`,
        phase
      };
      console.log(`🚀 ${entry.message}`);
      this.writeToFile('migration/phases.log', entry);
    },

    phaseComplete: (phase: string, duration: number) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[MIGRATION-COMPLETE] ${phase} concluída em ${duration}ms`,
        phase,
        metadata: { duration }
      };
      console.log(`✅ ${entry.message}`);
      this.writeToFile('migration/phases.log', entry);
    },

    componentMigrated: (component: string, fromVersion: string, toVersion: string) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[COMPONENT-MIGRATED] ${component}: ${fromVersion} → ${toVersion}`,
        component,
        metadata: { fromVersion, toVersion }
      };
      console.log(`🔄 ${entry.message}`);
      this.writeToFile('migration/components.log', entry);
    },

    dependencyUpdated: (dependency: string, fromVersion: string, toVersion: string) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[DEPENDENCY-UPDATED] ${dependency}: ${fromVersion} → ${toVersion}`,
        metadata: { dependency, fromVersion, toVersion }
      };
      console.log(`📦 ${entry.message}`);
      this.writeToFile('migration/dependencies.log', entry);
    },

    warningPreservation: (message: string, component?: string) => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message: `[PRESERVATION-WARNING] ${message}`,
        component,
        metadata: { preservationWarning: true }
      };
      console.warn(`⚠️ ${entry.message}`);
      this.writeToFile('migration/preservation.log', entry);
    }
  };

  private writeToFile(filepath: string, entry: LogEntry) {
    // Em ambiente de desenvolvimento, simular escrita em arquivo
    if (this.isDevelopment) {
      // TODO: Implementar escrita real em arquivo quando necessário
      // Para agora, apenas log no console com identificação do arquivo
      console.debug(`[LOG-FILE: ${filepath}]`, JSON.stringify(entry, null, 2));
    }
  }
}

// Exportar instância única
export const logger = new FrontendLogger();

// Utilidade para medir performance
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<T> => {
  const start = Date.now();
  logger.development.performance(`${operation} - START`, 0);
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.development.performance(`${operation} - SUCCESS`, duration);
    logger.production.performance(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.development.error(`${operation} - FAILED after ${duration}ms`, error as Error);
    logger.production.error(`${operation} failed`, error as Error);
    throw error;
  }
};

// Hook para logging de componentes React
export const useComponentLogger = (componentName: string) => {
  return {
    logMount: () => logger.development.component(componentName, 'MOUNTED'),
    logUnmount: () => logger.development.component(componentName, 'UNMOUNTED'),
    logRender: () => logger.development.component(componentName, 'RENDERED'),
    logError: (error: Error) => logger.development.error(`Component ${componentName} error`, error),
    logAction: (action: string, metadata?: any) => 
      logger.development.component(componentName, action, metadata)
  };
};
```

---

## 📋 Tarefas Detalhadas

### 1. Backup e Versionamento
**Tempo estimado**: 30 minutos

#### 1.1 Criar Branch de Migração
```bash
# Navegar para o diretório do frontend
cd whatize/frontend

# Criar e mudar para nova branch
git checkout -b feature/frontend-modernization-2025

# Verificar status
git status

# Log da ação
echo "$(date): Criada branch feature/frontend-modernization-2025" >> logs/migration/phases.log
```

#### 1.2 Backup Completo do Estado Atual
```bash
# Criar diretório de backup
mkdir -p ../backups/frontend-$(date +%Y%m%d-%H%M%S)

# Copiar todo o frontend atual
cp -r . ../backups/frontend-$(date +%Y%m%d-%H%M%S)/

# Criar snapshot do package.json
cp package.json package.json.backup

# Log do backup
echo "$(date): Backup completo criado em ../backups/" >> logs/migration/phases.log
```

#### 1.3 Documentar Package.json Atual
```bash
# Criar relatório de dependências atuais
npm list --depth=0 > ../backups/dependencies-current.txt
npm outdated > ../backups/dependencies-outdated.txt
npm audit > ../backups/security-audit-current.txt

# Log da documentação
echo "$(date): Documentação de dependências criada" >> logs/migration/phases.log
```

### 2. Auditoria Detalhada do Sistema
**Tempo estimado**: 2 horas

#### 2.1 Mapear Todos os Componentes
```bash
# Criar lista de todos os componentes
find src/components -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" > ../backups/components-list.txt

# Criar lista de todas as páginas
find src/pages -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" > ../backups/pages-list.txt

# Mapear hooks customizados
find src/hooks -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" > ../backups/hooks-list.txt
```

#### 2.2 Identificar Dependências Críticas
```bash
# Buscar por imports de Material-UI v4
grep -r "@material-ui" src/ > ../backups/material-ui-v4-usage.txt

# Buscar por imports de MUI v5
grep -r "@mui" src/ > ../backups/mui-v5-usage.txt

# Buscar por makeStyles (padrão antigo)
grep -r "makeStyles" src/ > ../backups/makestyles-usage.txt

# Buscar por styled-components
grep -r "styled-components" src/ > ../backups/styled-components-usage.txt

# Log da auditoria
echo "$(date): Auditoria de dependências concluída" >> logs/migration/phases.log
```

#### 2.3 Documentar Funcionalidades Críticas
```bash
# Identificar rotas principais
grep -r "path=" src/routes/ > ../backups/routes-mapping.txt

# Identificar context providers
grep -r "Provider" src/ > ../backups/context-providers.txt

# Identificar serviços de API
find src/services -name "*.js" -o -name "*.ts" > ../backups/api-services.txt
```

### 3. Implementar Sistema de Logs
**Tempo estimado**: 1 hora

#### 3.1 Criar Estrutura de Logs
```bash
# Criar diretórios de logs
mkdir -p logs/development
mkdir -p logs/production  
mkdir -p logs/migration

# Criar arquivos de log iniciais
touch logs/development/migration.log
touch logs/development/build.log
touch logs/development/performance.log
touch logs/development/errors.log
touch logs/development/components.log

touch logs/production/system.log
touch logs/production/errors.log
touch logs/production/performance.log

touch logs/migration/phases.log
touch logs/migration/components.log
touch logs/migration/dependencies.log
touch logs/migration/preservation.log
```

#### 3.2 Implementar Logger
```bash
# Criar o arquivo logger (já mostrado acima)
# whatize/frontend/src/utils/logger.ts
```

#### 3.3 Integrar Logger no App Principal
```typescript
// whatize/frontend/src/App.js - Adicionar logging
import { logger, measurePerformance } from './utils/logger';

// No início do App component
const App = () => {
  React.useEffect(() => {
    logger.migration.phaseStart('FASE 1 - Preparação e Setup');
    logger.development.build('App component inicializado');
    
    return () => {
      logger.development.build('App component desmontado');
    };
  }, []);

  // ... resto do código do App
};
```

### 4. Configurar Ambiente de Desenvolvimento Seguro
**Tempo estimado**: 45 minutos

#### 4.1 Atualizar .gitignore
```bash
# Adicionar logs ao .gitignore
echo "
# Logs da migração
logs/
*.log

# Backups
backups/
*.backup
" >> .gitignore
```

#### 4.2 Configurar Scripts de Desenvolvimento
```json
// package.json - Adicionar scripts de monitoramento
{
  "scripts": {
    "dev:safe": "npm run dev 2>&1 | tee logs/development/build.log",
    "build:safe": "npm run build 2>&1 | tee logs/development/build.log",
    "audit:security": "npm audit --audit-level=moderate",
    "audit:outdated": "npm outdated",
    "backup:create": "cp package.json package.json.backup-$(date +%Y%m%d-%H%M%S)",
    "logs:clear": "rm -rf logs/* && mkdir -p logs/{development,production,migration}",
    "migration:status": "cat logs/migration/phases.log | tail -20"
  }
}
```

#### 4.3 Criar Script de Validação
```bash
# whatize/frontend/scripts/validate-migration.sh
#!/bin/bash

echo "🔍 Validando integridade da migração..."

# Verificar se o app ainda builda
npm run build:safe
if [ $? -eq 0 ]; then
    echo "✅ Build ainda funciona"
    logger.migration.phaseComplete("Build validation", Date.now())
else
    echo "❌ Build quebrado - PARAR MIGRAÇÃO"
    exit 1
fi

# Verificar se dependências críticas estão intactas
if grep -q "react" package.json; then
    echo "✅ React ainda presente"
else
    echo "❌ React removido - ERRO CRÍTICO"
    exit 1
fi

# Verificar se estrutura de pastas está intacta
if [ -d "src/components" ] && [ -d "src/pages" ] && [ -d "src/services" ]; then
    echo "✅ Estrutura de pastas intacta"
else
    echo "❌ Estrutura de pastas modificada"
    exit 1
fi

echo "✅ Validação concluída com sucesso"
```

### 5. Testes de Integridade do Sistema Atual
**Tempo estimado**: 30 minutos

#### 5.1 Verificar Build Atual
```bash
# Testar build atual
npm run build

# Verificar se não há erros críticos
npm run lint 2>/dev/null || echo "ESLint não configurado ou com erros"

# Log do teste
echo "$(date): Build atual testado" >> logs/migration/phases.log
```

#### 5.2 Documentar APIs Utilizadas
```bash
# Mapear todas as chamadas de API
grep -r "api\." src/ > ../backups/api-calls-mapping.txt
grep -r "axios" src/ > ../backups/axios-usage.txt
grep -r "fetch" src/ > ../backups/fetch-usage.txt
```

---

## ✅ Critérios de Conclusão da Fase 1

### Obrigatórios (Todos devem ser atendidos)
- [ ] **Branch de migração criada** e testada
- [ ] **Backup completo** realizado e verificado
- [ ] **Sistema de logs** implementado e funcionando
- [ ] **Auditoria detalhada** documentada
- [ ] **Build atual** ainda funciona perfeitamente
- [ ] **Todas as funcionalidades** testadas e funcionando
- [ ] **Documentação** de dependências críticas completa

### Validações de Segurança
- [ ] **Nenhuma funcionalidade quebrada** durante a preparação
- [ ] **Todos os componentes** ainda renderizam corretamente
- [ ] **APIs** ainda funcionam normalmente
- [ ] **Roteamento** intacto
- [ ] **Autenticação** funcionando

### Logs Essenciais Gerados
- [ ] `logs/migration/phases.log` - Log da fase 1
- [ ] `logs/development/build.log` - Logs de build
- [ ] `../backups/dependencies-current.txt` - Estado atual
- [ ] `../backups/components-list.txt` - Mapeamento de componentes

---

## 🚨 Procedimentos de Emergência

### Se Algo Quebrar Durante a Fase 1
1. **PARAR IMEDIATAMENTE** qualquer mudança
2. **Voltar para branch principal**: `git checkout main`
3. **Restaurar backup**: `cp -r ../backups/frontend-[timestamp]/* .`
4. **Verificar funcionamento**: `npm run dev`
5. **Documentar o problema** em `logs/migration/preservation.log`
6. **Revisar procedimentos** antes de tentar novamente

### Rollback Completo
```bash
# Emergência total - voltar ao estado inicial
git checkout main
git branch -D feature/frontend-modernization-2025
cp package.json.backup package.json
npm install
npm run dev
```

---

## 📞 Checkpoint da Fase 1

### Reunião de Validação
Antes de prosseguir para a Fase 2, realizar reunião para:
1. **Revisar logs** de migração gerados
2. **Validar** que todas as funcionalidades ainda funcionam
3. **Confirmar** que backups foram criados corretamente
4. **Aprovar** continuidade para Fase 2

### Aprovação para Fase 2
**APENAS prosseguir para Fase 2 se:**
- ✅ Todos os critérios foram atendidos
- ✅ Sistema atual está 100% funcional
- ✅ Logs estão sendo gerados corretamente
- ✅ Backup foi validado e está funcional
- ✅ Equipe aprovou continuidade

---

**Próxima Fase**: [Fase 2 - Migração Build System](./fase-02-migracao-build-system.md)

---

*Documento da Fase 1 - Criado em: Agosto 2025*
*Responsável: Claude AI Assistant*
*Status: Preparado para execução*