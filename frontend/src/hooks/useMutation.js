// Hook wrapper para mutations migração gradual React Query v3 → TanStack Query v5
import { useMutation as useTanStackMutation } from '@tanstack/react-query';

export const useMutation = (mutationFn, options = {}) => {
  return useTanStackMutation({
    mutationFn,
    ...options,
  });
};

export default useMutation;