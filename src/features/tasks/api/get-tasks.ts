import { useQuery, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Task } from '../types';
import { QueryConfig } from '@/lib/react-query';

export type GetTasksParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  priority?: number;
  assignedTo?: string;
  createdBy?: string;
  teamId?: string;
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
};
export const getTasks = async (
  params?: GetTasksParams,
): Promise<{ data: Task[]; total: number; page: number; limit: number }> => {
  return api.get('/tasks', { params });
};

export const getTasksQueryOptions = (params?: GetTasksParams) => {
  return queryOptions({
    queryKey: ['tasks', params],
    queryFn: () => getTasks(params),
  });
};

type UseTasksOptions = {
  params?: GetTasksParams;
  queryConfig?: QueryConfig<typeof getTasksQueryOptions>;
};

export const useTasks = ({ params, queryConfig }: UseTasksOptions = {}) => {
  return useQuery({
    ...getTasksQueryOptions(params),
    ...queryConfig,
  });
};
