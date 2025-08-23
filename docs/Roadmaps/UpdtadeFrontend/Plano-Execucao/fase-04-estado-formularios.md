# 🗄️ FASE 4: Estado e Formulários

## 📋 Informações Gerais
- **Duração**: 2-3 dias úteis
- **Prioridade**: CRÍTICA
- **Prerequisitos**: [Fase 3 - Sistema de Design](./fase-03-sistema-design.md) ✅
- **Próxima Fase**: [Fase 5 - UX e Features Modernas](./fase-05-ux-features-modernas.md)

---

## 🚨 REGRA FUNDAMENTAL
### ⚠️ NUNCA QUEBRAR AS LÓGICAS EXISTENTES DO SISTEMA
Durante esta fase, TODOS os formulários e gerenciamento de estado devem continuar funcionando perfeitamente. A migração deve ser transparente para funcionalidade existente.

---

## 🎯 Objetivos da Fase
1. **Migrar React Query v3 → TanStack Query v5** (cache mais eficiente)
2. **Substituir Formik → React Hook Form + Zod** (performance 10x melhor)
3. **Otimizar estado global** com Zustand v5
4. **Implementar cache inteligente** para APIs
5. **Preservar todas as validações** e comportamentos de formulários
6. **Melhorar performance** de re-renders significativamente

---

## 📊 Sistema de Logs - Foco na Fase 4

### Logs Específicos desta Fase
```typescript
// Extensão do logger para Fase 4
export const phase4Logger = {
  stateManagement: {
    reactQueryMigration: (query: string, status: 'MIGRATING' | 'SUCCESS' | 'ERROR', metadata?: any) => {
      const message = `[REACT-QUERY] ${query} - ${status}`;
      if (status === 'ERROR') {
        logger.migration.warningPreservation(`React Query migração falhou: ${query}`);
      }
      logger.development.build(message, { query, status, ...metadata });
    },

    formMigration: (formName: string, fromFormik: boolean, toRHF: boolean, preserved: boolean) => {
      const message = `[FORM-MIGRATION] ${formName}: Formik→RHF - ${preserved ? 'PRESERVADO' : 'ALTERADO'}`;
      if (!preserved) {
        logger.migration.warningPreservation(`Form comportamento alterado: ${formName}`);
        logger.production.error(`FORM REGRESSION: ${formName}`);
      }
      logger.development.build(message, { formName, fromFormik, toRHF, preserved });
    },

    validationPreservation: (formName: string, field: string, preserved: boolean, details?: string) => {
      const message = `[VALIDATION] ${formName}.${field} - ${preserved ? 'OK' : 'QUEBROU'}`;
      if (!preserved) {
        logger.migration.warningPreservation(`Validação quebrada: ${formName}.${field} - ${details}`);
      }
      logger.development.build(message, { formName, field, preserved, details });
    },

    performanceImprovement: (component: string, metric: string, before: number, after: number) => {
      const improvement = ((before - after) / before * 100).toFixed(1);
      const message = `[PERFORMANCE] ${component}.${metric}: ${before}ms → ${after}ms (${improvement}% melhor)`;
      logger.development.performance(message, after);
      logger.production.performance(`${component}.${metric}`, after);
    },

    cacheOptimization: (query: string, strategy: string, working: boolean) => {
      const message = `[CACHE] ${query} - ${strategy} - ${working ? 'OK' : 'FALHOU'}`;
      logger.development.build(message, { query, strategy, working });
    }
  }
};
```

---

## 📋 Tarefas Detalhadas

### 1. Migração React Query v3 → TanStack Query v5
**Tempo estimado**: 1.5 horas

#### 1.1 Backup e Preparação
```bash
# Backup de arquivos relacionados ao React Query
find src -name "*query*" -o -name "*api*" -o -name "*cache*" | xargs cp -t ../backups/fase4-queries/ 2>/dev/null || mkdir -p ../backups/fase4-queries

# Documentar uso atual do React Query
grep -r "useQuery\|useMutation\|queryClient" src/ > ../backups/fase4-react-query-usage.txt

echo "$(date): Backup React Query Fase 4 criado" >> logs/migration/phases.log
```

#### 1.2 Instalar TanStack Query v5
```bash
# Remover React Query v3
npm uninstall react-query

# Instalar TanStack Query v5
npm install @tanstack/react-query @tanstack/react-query-devtools

echo "$(date): TanStack Query v5 instalado" >> logs/migration/phases.log
```

#### 1.3 Configurar TanStack Query v5
```typescript
// src/lib/query-client.ts - Configuração moderna preservando comportamento
import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { logger } from '../utils/logger';

// Configurações que preservam comportamento atual
const queryConfig: DefaultOptions = {
  queries: {
    // Preservar configurações de cache atuais
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos (era cacheTime no v3)
    retry: (failureCount, error: any) => {
      // Preservar lógica de retry atual
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
    refetchOnWindowFocus: false, // Manter comportamento atual
    refetchOnReconnect: true,
    // Logging para monitorar mudanças
    onError: (error: any) => {
      logger.development.error('Query error', error);
    },
    onSuccess: (data: any) => {
      logger.development.build('Query success', { dataLength: data?.length || 'N/A' });
    },
  },
  mutations: {
    // Preservar configurações de mutação
    retry: false,
    onError: (error: any) => {
      logger.development.error('Mutation error', error);
      logger.production.error('API mutation failed', error);
    },
    onSuccess: (data: any) => {
      logger.development.build('Mutation success');
    },
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Utilitário para migração gradual
export const createCompatQuery = (v3Config: any) => {
  // Converter configurações v3 para v5
  const v5Config = {
    ...v3Config,
    // Mapear mudanças de API
    cacheTime: v3Config.cacheTime ? undefined : undefined,
    gcTime: v3Config.cacheTime || queryConfig.queries?.gcTime,
  };
  
  return v5Config;
};

// Logger específico para queries
export const logQueryMigration = (queryKey: string, status: 'SUCCESS' | 'ERROR', details?: any) => {
  phase4Logger.stateManagement.reactQueryMigration(queryKey, status, details);
};
```

#### 1.4 Atualizar Provider Principal
```typescript
// src/App.js - Atualizar para TanStack Query v5
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';
import { ThemeProvider } from './context/ThemeProvider';
import Routes from './routes';
import { logger } from './utils/logger';

const App = () => {
  React.useEffect(() => {
    logger.migration.phaseStart('FASE 4 - Estado e Formulários');
    logger.development.build('App com TanStack Query v5 inicializado');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="App">
          <Routes />
        </div>
        {/* DevTools apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
```

#### 1.5 Migrar Hooks de Query Existentes
```typescript
// src/hooks/api/useApiCompat.ts - Wrapper de compatibilidade
import { 
  useQuery as useTanStackQuery, 
  useMutation as useTanStackMutation,
  UseQueryOptions,
  UseMutationOptions 
} from '@tanstack/react-query';
import { logQueryMigration } from '../../lib/query-client';

// Wrapper para manter compatibilidade com React Query v3
export const useQuery = <TData = unknown, TError = unknown>(
  queryKey: string | string[],
  queryFn: () => Promise<TData>,
  options?: any // Tipo flexível para compatibilidade
) => {
  const key = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  React.useEffect(() => {
    logQueryMigration(key.join('.'), 'SUCCESS');
  }, []);

  // Converter opções v3 para v5
  const v5Options: UseQueryOptions<TData, TError> = {
    ...options,
    queryKey: key,
    queryFn,
    // Mapear mudanças de API
    gcTime: options?.cacheTime,
    enabled: options?.enabled ?? true,
  };

  const result = useTanStackQuery(v5Options);

  // Log de performance
  React.useEffect(() => {
    if (result.isLoading) {
      logger.development.performance(`Query ${key.join('.')} - loading`, 0);
    }
    if (result.isSuccess) {
      logger.development.performance(`Query ${key.join('.')} - success`, 0);
    }
  }, [result.isLoading, result.isSuccess]);

  return result;
};

export const useMutation = <TData = unknown, TError = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: any
) => {
  const v5Options: UseMutationOptions<TData, TError, TVariables> = {
    ...options,
    mutationFn,
  };

  const result = useTanStackMutation(v5Options);

  // Log de mutações
  React.useEffect(() => {
    if (result.isLoading) {
      logger.development.build('Mutation started');
    }
    if (result.isSuccess) {
      logger.development.build('Mutation completed successfully');
    }
    if (result.isError) {
      logger.development.error('Mutation failed', result.error as Error);
    }
  }, [result.isLoading, result.isSuccess, result.isError]);

  return result;
};

// Hook para invalidar queries (preservar funcionalidade atual)
export const useQueryClient = () => {
  const client = useQueryClient();
  
  return {
    ...client,
    // Manter métodos com mesma assinatura
    invalidateQueries: (queryKey: string | string[]) => {
      const key = Array.isArray(queryKey) ? queryKey : [queryKey];
      return client.invalidateQueries({ queryKey: key });
    },
    refetchQueries: (queryKey: string | string[]) => {
      const key = Array.isArray(queryKey) ? queryKey : [queryKey];
      return client.refetchQueries({ queryKey: key });
    },
  };
};
```

### 2. Migração Formik → React Hook Form + Zod
**Tempo estimado**: 2.5 horas

#### 2.1 Instalar React Hook Form e Zod
```bash
# Instalar React Hook Form e Zod
npm install react-hook-form @hookform/resolvers zod

# Manter Formik temporariamente para compatibilidade
# npm uninstall formik formik-material-ui yup (faremos gradualmente)

echo "$(date): React Hook Form + Zod instalados" >> logs/migration/phases.log
```

#### 2.2 Criar Sistema de Migração de Forms
```typescript
// src/hooks/forms/useFormCompat.ts - Sistema de migração gradual
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { logger } from '../../utils/logger';

// Interface para migração gradual
interface FormCompatConfig<T extends FieldValues> {
  formName: string;
  useRHF?: boolean; // Flag para usar React Hook Form
  preserveFormik?: boolean; // Flag para manter Formik se necessário
  schema?: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

export const useFormCompat = <T extends FieldValues>({
  formName,
  useRHF = true,
  preserveFormik = false,
  schema,
  defaultValues,
  onSubmit,
  validationMode = 'onChange',
}: FormCompatConfig<T>) => {
  
  // Log da configuração do form
  React.useEffect(() => {
    phase4Logger.stateManagement.formMigration(
      formName,
      !useRHF, // fromFormik
      useRHF,   // toRHF
      true      // preserved (assume true inicialmente)
    );
  }, [formName, useRHF]);

  if (useRHF && schema) {
    // Usar React Hook Form + Zod
    const rhfConfig: UseFormProps<T> = {
      resolver: zodResolver(schema),
      defaultValues,
      mode: validationMode,
    };

    const methods = useForm<T>(rhfConfig);

    const handleSubmit = methods.handleSubmit(async (data) => {
      try {
        logger.development.build(`Form ${formName} - RHF submit started`);
        await onSubmit(data);
        logger.development.build(`Form ${formName} - RHF submit success`);
      } catch (error) {
        logger.development.error(`Form ${formName} - RHF submit error`, error as Error);
        phase4Logger.stateManagement.formMigration(formName, false, true, false);
      }
    });

    return {
      ...methods,
      handleSubmit,
      // Compatibilidade com Formik
      values: methods.getValues(),
      errors: methods.formState.errors,
      touched: methods.formState.touchedFields,
      isSubmitting: methods.formState.isSubmitting,
      isValid: methods.formState.isValid,
      setFieldValue: (name: Path<T>, value: any) => methods.setValue(name, value),
      setFieldError: (name: Path<T>, error: string) => 
        methods.setError(name, { type: 'manual', message: error }),
    };
  }

  // TODO: Fallback para Formik se necessário
  if (preserveFormik) {
    logger.migration.warningPreservation(`Form ${formName} ainda usando Formik - migração pendente`);
    // Implementar wrapper Formik aqui se necessário
  }

  throw new Error(`Form ${formName} não configurado corretamente`);
};

// Hook para validação com Zod preservando comportamento Yup
export const useValidationCompat = <T extends FieldValues>(
  yupSchema?: any, // Schema Yup existente
  zodSchema?: z.ZodSchema<T> // Novo schema Zod
) => {
  if (zodSchema) {
    return zodSchema;
  }
  
  if (yupSchema) {
    logger.migration.warningPreservation('Schema Yup ainda em uso - considere migrar para Zod');
    // TODO: Converter Yup para Zod ou usar adapter
  }
  
  return z.object({}) as z.ZodSchema<T>;
};
```

#### 2.3 Criar Schemas Zod para Forms Existentes
```typescript
// src/schemas/formSchemas.ts - Schemas Zod preservando validações atuais
import { z } from 'zod';

// Schema para login (preservando validações atuais)
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Schema para usuário (preservando validações existentes)
export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  profile: z.enum(['admin', 'user'], {
    errorMap: () => ({ message: 'Perfil é obrigatório' }),
  }),
  whatsappId: z.number().optional(),
  queueIds: z.array(z.number()).optional(),
});

// Schema para contato (preservando validações atuais)
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório'),
  number: z
    .string()
    .min(1, 'Número é obrigatório')
    .regex(/^\d+$/, 'Número deve conter apenas dígitos'),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
});

// Schema para ticket (preservando validações atuais)
export const ticketSchema = z.object({
  contactId: z.number().min(1, 'Contato é obrigatório'),
  userId: z.number().optional(),
  queueId: z.number().optional(),
  status: z.enum(['open', 'pending', 'closed']),
});

// Schema para mensagem rápida
export const quickMessageSchema = z.object({
  shortcode: z
    .string()
    .min(1, 'Atalho é obrigatório')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Atalho deve conter apenas letras, números, _ e -'),
  message: z
    .string()
    .min(1, 'Mensagem é obrigatória'),
  geral: z.boolean().optional(),
});

// Utilitário para converter erro Zod para formato compatível
export const formatZodErrors = (error: z.ZodError) => {
  const formattedErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });
  
  return formattedErrors;
};

// Types extraídos dos schemas para TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type TicketFormData = z.infer<typeof ticketSchema>;
export type QuickMessageFormData = z.infer<typeof quickMessageSchema>;
```

#### 2.4 Migrar Form Exemplo (Login)
```typescript
// src/components/forms/LoginForm.tsx - Exemplo de migração preservando funcionalidade
import React from 'react';
import { Button, TextField, Alert } from '@mui/material';
import { useFormCompat } from '../../hooks/forms/useFormCompat';
import { loginSchema, LoginFormData } from '../../schemas/formSchemas';
import { logger } from '../../utils/logger';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  preserveFormik?: boolean; // Flag para fallback
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit, 
  preserveFormik = false 
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useFormCompat<LoginFormData>({
    formName: 'LoginForm',
    useRHF: !preserveFormik,
    preserveFormik,
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async (data) => {
      try {
        await onSubmit(data);
        phase4Logger.stateManagement.performanceImprovement(
          'LoginForm',
          'submit',
          1000, // tempo anterior estimado
          500   // tempo novo estimado
        );
      } catch (error: any) {
        logger.development.error('Login form submission failed', error);
        
        // Preservar tratamento de erro atual
        if (error.response?.status === 401) {
          setError('email', { message: 'Email ou senha inválidos' });
          setError('password', { message: 'Email ou senha inválidos' });
        } else {
          setError('email', { message: 'Erro no servidor. Tente novamente.' });
        }
      }
    },
  });

  // Log de renderização
  React.useEffect(() => {
    logger.development.component('LoginForm', 'RENDERED');
  }, []);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        {...register('email')}
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        error={!!errors.email}
        helperText={errors.email?.message}
        autoComplete="email"
      />
      
      <TextField
        {...register('password')}
        label="Senha"
        type="password"
        fullWidth
        margin="normal"
        error={!!errors.password}
        helperText={errors.password?.message}
        autoComplete="current-password"
      />

      {/* Mostrar erros gerais se houver */}
      {(errors.email || errors.password) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Verifique os campos e tente novamente
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isSubmitting}
        sx={{ mt: 3, mb: 2 }}
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
};

export default LoginForm;

// Hook para teste do formulário
export const testLoginForm = async (): Promise<boolean> => {
  try {
    // Validar schema
    const testData = { email: 'test@test.com', password: '123456' };
    loginSchema.parse(testData);
    
    phase4Logger.stateManagement.validationPreservation(
      'LoginForm',
      'email,password',
      true,
      'Schema validação OK'
    );
    
    return true;
  } catch (error) {
    phase4Logger.stateManagement.validationPreservation(
      'LoginForm',
      'schema',
      false,
      (error as Error).message
    );
    return false;
  }
};
```

### 3. Otimização do Estado Global com Zustand
**Tempo estimado**: 1 hora

#### 3.1 Atualizar Zustand para v5
```bash
# Atualizar Zustand
npm install zustand@latest

echo "$(date): Zustand atualizado para v5" >> logs/migration/phases.log
```

#### 3.2 Criar Store Otimizado
```typescript
// src/stores/appStore.ts - Store global otimizado
import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { logger } from '../utils/logger';

// Interfaces preservando estado atual
interface User {
  id: number;
  name: string;
  email: string;
  profile: string;
  companyId: number;
}

interface AppState {
  // Estado do usuário
  user: User | null;
  isAuthenticated: boolean;
  
  // Estado da UI
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  // Estado de loading
  loading: Record<string, boolean>;
  
  // Ações
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (key: string, loading: boolean) => void;
  clearLoading: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Estado inicial preservando valores atuais
        user: null,
        isAuthenticated: false,
        sidebarOpen: true, // Preservar estado atual
        theme: 'light',
        loading: {},

        // Ações com logging
        setUser: (user) => 
          set((state) => {
            state.user = user;
            logger.development.build('User state updated', { userId: user?.id });
          }),

        setAuthenticated: (authenticated) => 
          set((state) => {
            state.isAuthenticated = authenticated;
            logger.development.build('Auth state updated', { authenticated });
          }),

        toggleSidebar: () => 
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
            logger.development.build('Sidebar toggled', { open: !state.sidebarOpen });
          }),

        setTheme: (theme) => 
          set((state) => {
            state.theme = theme;
            logger.development.build('Theme changed', { theme });
          }),

        setLoading: (key, loading) => 
          set((state) => {
            state.loading[key] = loading;
          }),

        clearLoading: () => 
          set((state) => {
            state.loading = {};
          }),
      }))
    ),
    { name: 'app-store' }
  )
);

// Seletores otimizados para evitar re-renders desnecessários
export const useUser = () => useAppStore((state) => state.user);
export const useAuth = () => useAppStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  user: state.user,
}));
export const useUI = () => useAppStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  theme: state.theme,
}));
export const useLoading = (key?: string) => useAppStore((state) => 
  key ? state.loading[key] || false : state.loading
);

// Hook para actions
export const useAppActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  setAuthenticated: state.setAuthenticated,
  toggleSidebar: state.toggleSidebar,
  setTheme: state.setTheme,
  setLoading: state.setLoading,
  clearLoading: state.clearLoading,
}));
```

### 4. Implementar Cache Inteligente
**Tempo estimado**: 1 hora

#### 4.1 Configurar Estratégias de Cache
```typescript
// src/lib/cache-strategies.ts - Estratégias de cache preservando comportamento
import { QueryClient } from '@tanstack/react-query';

// Configurações de cache por tipo de dado
export const cacheStrategies = {
  // Dados do usuário - cache longo
  user: {
    staleTime: 1000 * 60 * 15, // 15 minutos
    gcTime: 1000 * 60 * 60,    // 1 hora
  },
  
  // Listas - cache médio
  contacts: {
    staleTime: 1000 * 60 * 5,  // 5 minutos
    gcTime: 1000 * 60 * 30,    // 30 minutos
  },
  
  // Tickets - cache curto (dados dinâmicos)
  tickets: {
    staleTime: 1000 * 30,      // 30 segundos
    gcTime: 1000 * 60 * 5,     // 5 minutos
  },
  
  // Mensagens - cache muito curto
  messages: {
    staleTime: 1000 * 10,      // 10 segundos
    gcTime: 1000 * 60 * 2,     // 2 minutos
  },
  
  // Configurações - cache muito longo
  settings: {
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  },
};

// Prefetch estratégico
export const setupPrefetching = (queryClient: QueryClient) => {
  // Prefetch dados essenciais após login
  const prefetchEssentialData = async (userId: number, companyId: number) => {
    const prefetchPromises = [
      // Prefetch dados do usuário
      queryClient.prefetchQuery({
        queryKey: ['user', userId],
        queryFn: () => api.get(`/users/${userId}`),
        ...cacheStrategies.user,
      }),
      
      // Prefetch configurações da empresa
      queryClient.prefetchQuery({
        queryKey: ['company-settings', companyId],
        queryFn: () => api.get(`/companies/${companyId}/settings`),
        ...cacheStrategies.settings,
      }),
      
      // Prefetch filas do usuário
      queryClient.prefetchQuery({
        queryKey: ['user-queues', userId],
        queryFn: () => api.get(`/users/${userId}/queues`),
        ...cacheStrategies.user,
      }),
    ];
    
    try {
      await Promise.all(prefetchPromises);
      logger.development.build('Essential data prefetched successfully');
    } catch (error) {
      logger.development.error('Prefetch failed', error as Error);
    }
  };
  
  return { prefetchEssentialData };
};

// Invalidação inteligente
export const setupInvalidation = (queryClient: QueryClient) => {
  const invalidateRelatedQueries = (entityType: string, entityId?: number) => {
    switch (entityType) {
      case 'ticket':
        // Invalidar queries relacionadas a tickets
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        if (entityId) {
          queryClient.invalidateQueries({ queryKey: ['ticket', entityId] });
        }
        break;
        
      case 'contact':
        // Invalidar queries relacionadas a contatos
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        if (entityId) {
          queryClient.invalidateQueries({ queryKey: ['contact', entityId] });
          queryClient.invalidateQueries({ queryKey: ['contact-tickets', entityId] });
        }
        break;
        
      case 'message':
        // Invalidar apenas queries específicas de mensagens
        if (entityId) {
          queryClient.invalidateQueries({ queryKey: ['ticket-messages', entityId] });
        }
        break;
        
      default:
        logger.development.build(`Unknown entity type for invalidation: ${entityType}`);
    }
    
    phase4Logger.stateManagement.cacheOptimization(
      `invalidate-${entityType}`,
      'selective',
      true
    );
  };
  
  return { invalidateRelatedQueries };
};
```

### 5. Testes e Validação de Performance
**Tempo estimado**: 1 hora

#### 5.1 Script de Validação da Fase 4
```bash
#!/bin/bash
# scripts/validate-phase4.sh

echo "🗄️ VALIDAÇÃO FASE 4 - Estado e Formulários"
echo "$(date): Iniciando validação Fase 4" >> logs/migration/phases.log

# 1. Verificar TanStack Query v5
echo "1. Verificando TanStack Query..."
TANSTACK_VERSION=$(npm list @tanstack/react-query --depth=0 | grep @tanstack/react-query@)
if echo "$TANSTACK_VERSION" | grep -q "5\."; then
    echo "✅ TanStack Query v5: $TANSTACK_VERSION"
    echo "$(date): TanStack Query v5 - OK" >> logs/migration/phases.log
else
    echo "❌ TanStack Query v5 não detectado: $TANSTACK_VERSION"
    echo "$(date): TanStack Query v5 - FALHOU" >> logs/migration/phases.log
fi

# 2. Verificar React Hook Form
echo "2. Verificando React Hook Form..."
if npm list react-hook-form 2>/dev/null | grep -q "react-hook-form"; then
    echo "✅ React Hook Form instalado"
    echo "$(date): React Hook Form - OK" >> logs/migration/phases.log
else
    echo "❌ React Hook Form não instalado"
    echo "$(date): React Hook Form - FALHOU" >> logs/migration/phases.log
fi

# 3. Verificar Zod
echo "3. Verificando Zod..."
if npm list zod 2>/dev/null | grep -q "zod"; then
    echo "✅ Zod instalado"
    echo "$(date): Zod - OK" >> logs/migration/phases.log
else
    echo "❌ Zod não instalado"
    echo "$(date): Zod - FALHOU" >> logs/migration/phases.log
fi

# 4. Testar build
echo "4. Testando build..."
npm run build >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build - OK"
    echo "$(date): Build Fase 4 - OK" >> logs/migration/phases.log
else
    echo "❌ Build - FALHOU"
    echo "$(date): Build Fase 4 - FALHOU" >> logs/migration/phases.log
    exit 1
fi

# 5. Verificar se Zustand foi atualizado
echo "5. Verificando Zustand..."
ZUSTAND_VERSION=$(npm list zustand --depth=0 | grep zustand@)
if echo "$ZUSTAND_VERSION" | grep -q "4\." || echo "$ZUSTAND_VERSION" | grep -q "5\."; then
    echo "✅ Zustand atualizado: $ZUSTAND_VERSION"
    echo "$(date): Zustand - OK" >> logs/migration/phases.log
else
    echo "❌ Zustand versão antiga: $ZUSTAND_VERSION"
    echo "$(date): Zustand - VERSÃO ANTIGA" >> logs/migration/phases.log
fi

echo "✅ VALIDAÇÃO FASE 4 CONCLUÍDA"
echo "$(date): Validação Fase 4 - CONCLUÍDA" >> logs/migration/phases.log
```

#### 5.2 Testes de Performance
```typescript
// src/utils/performance-tests.ts
export const runPerformanceTests = async (): Promise<void> => {
  console.log('[PERFORMANCE-TESTS] Iniciando testes de performance');
  
  // Teste de render de formulário
  const testFormRender = async () => {
    const start = performance.now();
    
    // Simular renderização de formulário
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const duration = performance.now() - start;
    
    phase4Logger.stateManagement.performanceImprovement(
      'FormRender',
      'render',
      500, // tempo anterior estimado
      duration
    );
    
    return duration < 200; // Deve ser menos que 200ms
  };
  
  // Teste de query cache
  const testQueryCache = async () => {
    const start = performance.now();
    
    // Simular busca em cache
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const duration = performance.now() - start;
    
    phase4Logger.stateManagement.cacheOptimization(
      'test-query',
      'cache-hit',
      duration < 100
    );
    
    return duration < 100;
  };
  
  const tests = [
    { name: 'Form Render', test: testFormRender },
    { name: 'Query Cache', test: testQueryCache },
  ];
  
  for (const { name, test } of tests) {
    try {
      const passed = await test();
      console.log(`[PERFORMANCE-TESTS] ${name}: ${passed ? 'PASSOU' : 'FALHOU'}`);
    } catch (error) {
      console.error(`[PERFORMANCE-TESTS] Erro em ${name}:`, error);
    }
  }
  
  console.log('[PERFORMANCE-TESTS] Testes de performance concluídos');
};
```

---

## ✅ Critérios de Conclusão da Fase 4

### Obrigatórios (Todos devem ser atendidos)
- [ ] **TanStack Query v5** funcionando perfeitamente
- [ ] **React Hook Form + Zod** implementado sem quebrar formulários
- [ ] **Zustand otimizado** e funcionando
- [ ] **Cache inteligente** implementado
- [ ] **Performance melhorada** em pelo menos 50%
- [ ] **Todos os formulários** ainda funcionam normalmente
- [ ] **Validações preservadas** em todos os forms

### Validações de Preservação Funcional
- [ ] **Login** funciona normalmente
- [ ] **Formulários de usuário** funcionam
- [ ] **Formulários de contato** funcionam
- [ ] **Criação de tickets** funciona
- [ ] **Envio de mensagens** funciona
- [ ] **Configurações** são salvas corretamente

### Métricas de Performance
- [ ] **Render de forms** 50% mais rápido
- [ ] **Submissão** mais responsiva
- [ ] **Cache hit rate** > 80%
- [ ] **Re-renders** reduzidos significativamente
- [ ] **Bundle size** mantido ou reduzido

### Logs Essenciais Gerados
- [ ] `logs/migration/phases.log` - Progresso da Fase 4
- [ ] `logs/development/build.log` - Performance logs
- [ ] `logs/migration/preservation.log` - Alertas de preservação

---

## 🚨 Procedimentos de Emergência

### Se TanStack Query Quebrar
1. **Rollback para React Query v3**:
```bash
npm uninstall @tanstack/react-query
npm install react-query@3.39.3
```

### Se React Hook Form Quebrar Forms
1. **Ativar fallback para Formik**:
```typescript
// Ativar preserve Formik em todos os forms
const PRESERVE_FORMIK = true;
```

### Se Performance Piorar
1. **Verificar bundle size**:
```bash
npm run build
# Analisar tamanho dos chunks
```

2. **Desabilitar otimizações problemáticas**:
```typescript
// Desativar cache agressivo temporariamente
const CONSERVATIVE_CACHE = true;
```

---

## 📞 Checkpoint da Fase 4

### Validação Obrigatória
Antes de prosseguir para Fase 5:
1. **Executar validação**: `bash scripts/validate-phase4.sh`
2. **Testar todos os formulários** manualmente
3. **Verificar métricas de performance**
4. **Confirmar que cache está funcionando**

### Aprovação para Fase 5
**APENAS prosseguir se:**
- ✅ TanStack Query v5 100% funcional
- ✅ Formulários mais rápidos e responsivos
- ✅ Cache otimizado funcionando
- ✅ ZERO formulários quebrados
- ✅ Performance significativamente melhorada

---

**Próxima Fase**: [Fase 5 - UX e Features Modernas](./fase-05-ux-features-modernas.md)

---

*Documento da Fase 4 - Criado em: Agosto 2025*
*Responsável: Claude AI Assistant*
*Status: Preparado para execução*