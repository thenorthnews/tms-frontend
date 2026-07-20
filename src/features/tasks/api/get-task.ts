import { useQuery, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Task } from '../types';
import { QueryConfig } from '@/lib/react-query';

export const getTask = async (taskId: string): Promise<Task> => {
  return api.get(`/tasks/${taskId}`);
};

export const getTaskQueryOptions = (taskId: string) => {
  return queryOptions({
    queryKey: ['tasks', taskId],
    queryFn: () => getTask(taskId),
  });
};

type UseTaskOptions = {
  taskId: string;
  queryConfig?: QueryConfig<typeof getTaskQueryOptions>;
};

export const useTask = ({ taskId, queryConfig }: UseTaskOptions) => {
  return useQuery({
    ...getTaskQueryOptions(taskId),
    ...queryConfig,
  });
};
