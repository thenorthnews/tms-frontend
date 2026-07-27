import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { Client, CreateClientInput } from '../types';

export const createClient = (data: CreateClientInput): Promise<Client> => {
  return api.post('/clients', data);
};

type UseCreateClientOptions = {
  mutationConfig?: MutationConfig<typeof createClient>;
};

export const useCreateClient = ({ mutationConfig }: UseCreateClientOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createClient,
  });
};
