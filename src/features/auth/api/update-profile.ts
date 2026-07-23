import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { MutationConfig } from '@/lib/react-query';

export const updateProfileInputSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phoneNumber: z.string().trim().optional(),
  fatherName: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  image: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const updateProfile = ({ data }: { data: UpdateProfileInput }) => {
  return api.patch(`/admin/auth/profile`, data);
};

type UseUpdateProfileOptions = {
  mutationConfig?: MutationConfig<typeof updateProfile>;
};

export const useUpdateProfile = ({
  mutationConfig,
}: UseUpdateProfileOptions = {}) => {
  const { refetch: refetchUser } = useUser();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      refetchUser();
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateProfile,
  });
};
