import { useQuery as useTanStackQuery, useMutation as useTanStackMutation } from '@tanstack/react-query';

// Hook de compatibilidade para migração gradual de React Query v3 → TanStack Query v5
export const useQuery = (
  queryKey,
  queryFn,
  options
) => {
  // Se receber parâmetros no formato React Query v3
  if (typeof queryKey === 'string' || Array.isArray(queryKey)) {
    return useTanStackQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      queryFn,
      ...options,
    });
  }

  // Se receber objeto no formato TanStack Query v5
  return useTanStackQuery(queryKey);
};

export const useMutation = (
  mutationFn,
  options
) => {
  // Se receber função como primeiro parâmetro (React Query v3)
  if (typeof mutationFn === 'function') {
    return useTanStackMutation({
      mutationFn,
      ...options,
    });
  }

  // Se receber objeto (TanStack Query v5)
  return useTanStackMutation(mutationFn);
};

// Export direto para facilitar migração
export { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';