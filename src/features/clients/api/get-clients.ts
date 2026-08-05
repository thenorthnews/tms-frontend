import { useQuery, queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { Client } from '../types';

export const getClients = async (): Promise<Client[]> => {
  const res = await api.get('/clients');
  return (
    Array.isArray(res) ? res : (res as { data?: Client[] })?.data || []
  ) as Client[];
};

export const getClientsQueryOptions = () => {
  return queryOptions({
    queryKey: ['clients'],
    queryFn: getClients,
  });
};

type UseClientsOptions = {
  queryConfig?: QueryConfig<typeof getClientsQueryOptions>;
};

export const useClients = ({ queryConfig }: UseClientsOptions = {}) => {
  return useQuery({
    ...getClientsQueryOptions(),
    ...queryConfig,
  });
};
