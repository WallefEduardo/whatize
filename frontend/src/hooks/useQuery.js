// Hook wrapper para migração gradual React Query v3 → TanStack Query v5
// Este arquivo substitui gradualmente o uso direto do react-query
import { useQuery as useTanStackQuery, useMutation as useTanStackMutation, useQueryClient } from '@tanstack/react-query';

// Re-export com compatibilidade React Query v3
export const useQuery = (queryKey, queryFn, options = {}) => {
  // Garantir que queryKey seja array
  const normalizedKey = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  return useTanStackQuery({
    queryKey: normalizedKey,
    queryFn,
    ...options,
  });
};

export const useMutation = (mutationFn, options = {}) => {
  return useTanStackMutation({
    mutationFn,
    ...options,
  });
};

// Re-exports diretos
export { useQueryClient, useInfiniteQuery, useIsFetching } from '@tanstack/react-query';

// Export para compatibilidade
export default useQuery;