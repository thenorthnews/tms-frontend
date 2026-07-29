import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getTaskQueryOptions } from './get-task';

import { Task } from '../types';

export type LogTimeDTO = {
  taskId: string;
  data: {
    hours: number;
    minutes: number;
    description?: string;
  };
};

export const logTime = ({ taskId, data }: LogTimeDTO): Promise<Task> => {
  return api.post(`/tasks/${taskId}/time-logs`, data);
};

type UseLogTimeOptions = {
  mutationConfig?: MutationConfig<typeof logTime>;
};

export const useLogTime = ({ mutationConfig }: UseLogTimeOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
      queryClient.invalidateQueries({
        queryKey: getTaskQueryOptions(variables.taskId).queryKey,
      });
      onSuccess?.(data, variables, context);
    },
    ...restConfig,
    mutationFn: logTime,
  });
};
