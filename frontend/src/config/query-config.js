import { QueryClient } from '@tanstack/react-query';

// Configuração TanStack Query v5 com compatibilidade ReactQuery v3
export const queryConfig = {
  defaultOptions: {
    queries: {
      // Configurações de cache e retry
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: (failureCount, error) => {
        // Não retry em erros 4xx
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      // Manter dados em background
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Timeout para mutations
      retry: 1,
    },
  },
};

// Instância do QueryClient com configurações otimizadas
export const queryClient = new QueryClient(queryConfig);

// Logging para migração
if (import.meta.env.DEV) {
  console.log('TanStack Query v5 configurado com compatibilidade React Query v3');
}

// Helper para invalidar queries por pattern
export const invalidateQueriesPattern = (pattern) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      return query.queryKey.some((key) => 
        typeof key === 'string' && key.includes(pattern)
      );
    },
  });
};

// Helper para clear all queries
export const clearAllQueries = () => {
  queryClient.clear();
};

export default queryClient;