import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { User } from '@/types/api';

export type UpdateUserStatusDTO = {
  userId: string;
  status: number;
};

export const updateUserStatus = ({
  userId,
  status,
}: UpdateUserStatusDTO): Promise<User> => {
  return api.patch(`/admin/users/${userId}/status`, { status });
};

type UseUpdateUserStatusOptions = {
  mutationConfig?: MutationConfig<typeof updateUserStatus>;
};

export const useUpdateUserStatus = ({
  mutationConfig,
}: UseUpdateUserStatusOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
      onSuccess?.(data, variables, context);
    },
    ...restConfig,
    mutationFn: updateUserStatus,
  });
};
