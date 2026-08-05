import { useQuery, queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { GetReportsParams, ReportsData } from '../types';

export const getReports = async (
  params?: GetReportsParams,
): Promise<ReportsData> => {
  return api.get('/admin/reports', { params });
};

export const getReportsQueryOptions = (params?: GetReportsParams) => {
  return queryOptions({
    queryKey: ['reports', params],
    queryFn: () => getReports(params),
  });
};

type UseReportsOptions = {
  params?: GetReportsParams;
  queryConfig?: QueryConfig<typeof getReportsQueryOptions>;
};

export const useReports = ({ params, queryConfig }: UseReportsOptions = {}) => {
  return useQuery({
    ...getReportsQueryOptions(params),
    ...queryConfig,
  });
};
