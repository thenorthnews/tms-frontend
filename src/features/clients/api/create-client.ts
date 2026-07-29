import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { Client, CreateClientInput } from '../types';

export const createClientInputSchema = z.object({
  name: z.string().trim().min(2, 'Client name must be at least 2 characters'),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').or(z.literal('')).optional(),
  phone: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.coerce.number().optional(),
});

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
