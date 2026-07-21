import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { Task } from '../types';

export const createTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.coerce.number().min(0).max(3).optional(),
  priority: z.coerce.number().min(0).max(2).optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    isCompleted: z.boolean().default(false),
  })).optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    originalName: z.string(),
    filename: z.string(),
    mimetype: z.string().optional(),
    size: z.number().optional(),
    path: z.string(),
    url: z.string(),
  })).optional(),
  teamId: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const createTask = ({ data }: { data: CreateTaskInput }): Promise<Task> => {
  return api.post('/tasks', data);
};

type UseCreateTaskOptions = {
  mutationConfig?: MutationConfig<typeof createTask>;
};

export const useCreateTask = ({ mutationConfig }: UseCreateTaskOptions = {}) => {
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
    mutationFn: createTask,
  });
};
