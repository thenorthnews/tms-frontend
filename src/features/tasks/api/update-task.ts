import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { Task } from '../types';

export const updateTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.coerce.number().min(0).max(4).optional(),
  priority: z.coerce.number().min(0).max(2).optional(),
  dueDate: z.string().optional(),
  assignedTo: z.union([z.string(), z.array(z.string())]).optional(),
  subtasks: z
    .array(
      z.object({
        _id: z.string().optional(),
        id: z.string().optional(),
        title: z.string().min(1),
        isCompleted: z.boolean(),
        status: z.coerce.number().min(0).max(4).optional(),
        assignedTo: z.string().optional().nullable(),
        dueDate: z.string().optional().nullable(),
      }),
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        originalName: z.string(),
        filename: z.string(),
        mimetype: z.string().optional(),
        size: z.number().optional(),
        path: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
  teamId: z.string().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const updateTask = ({
  taskId,
  data,
}: {
  taskId: string;
  data: UpdateTaskInput;
}): Promise<Task> => {
  return api.patch(`/tasks/${taskId}`, data);
};

type UseUpdateTaskOptions = {
  mutationConfig?: MutationConfig<typeof updateTask>;
};

export const useUpdateTask = ({
  mutationConfig,
}: UseUpdateTaskOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
      queryClient.invalidateQueries({
        queryKey: ['tasks', data.id || data._id],
      });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: updateTask,
  });
};
