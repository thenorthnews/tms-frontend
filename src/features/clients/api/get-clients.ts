import { useQuery, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Client } from '../types';
import { QueryConfig } from '@/lib/react-query';

export const getClients = async (): Promise<Client[]> => {
  const res = (await api.get('/clients')) as any;
  return res.data || res || [];
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
