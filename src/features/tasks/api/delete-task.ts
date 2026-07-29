import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export const deleteTask = ({ taskId }: { taskId: string }): Promise<{ message: string }> => {
  return api.delete(`/tasks/${taskId}`);
};

type UseDeleteTaskOptions = {
  mutationConfig?: MutationConfig<typeof deleteTask>;
};

export const useDeleteTask = ({ mutationConfig }: UseDeleteTaskOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteTask,
  });
};
