import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { Client, UpdateClientInput } from '../types';

export const updateClient = ({
  clientId,
  data,
}: {
  clientId: string;
  data: UpdateClientInput;
}): Promise<Client> => {
  return api.patch(`/clients/${clientId}`, data);
};

type UseUpdateClientOptions = {
  mutationConfig?: MutationConfig<typeof updateClient>;
};

export const useUpdateClient = ({
  mutationConfig,
}: UseUpdateClientOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateClient,
  });
};
