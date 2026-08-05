import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { Client } from '../types';

export const deleteClient = ({
  clientId,
}: {
  clientId: string;
}): Promise<Client> => {
  return api.delete(`/clients/${clientId}`);
};

type UseDeleteClientOptions = {
  mutationConfig?: MutationConfig<typeof deleteClient>;
};

export const useDeleteClient = ({
  mutationConfig,
}: UseDeleteClientOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteClient,
  });
};
