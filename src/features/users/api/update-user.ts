import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getUserQueryOptions } from './get-user';

export const updateUserInputSchema = z.object({
  // UserDto fields
  email: z.string().trim().email('Valid email is required'),
  countryCode: z.string().trim().min(1, 'Country code is required'),
  phoneNumber: z.string().trim().min(1, 'Phone number is required'),

  // UserInfo fields
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  fatherName: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  age: z.coerce.number().min(1).max(100).optional(),
  gender: z.coerce.number().min(0).max(2),
  image: z.string().optional(),
  role: z.coerce.number().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateUser = ({
  userId,
  data,
}: {
  userId: string;
  data: UpdateUserInput;
}): Promise<any> => {
  const payload = {
    UserDto: {
      email: {
        id: data.email,
      },
      phoneNumber: {
        countryCode: data.countryCode,
        number: data.phoneNumber,
      },
    },
    UserInfo: {
      firstName: data.firstName,
      lastName: data.lastName,
      fatherName: data.fatherName,
      motherName: data.motherName,
      age: data.age,
      gender: data.gender,
      image: data.image,
    },
  };

  return api.patch(`/admin/users/${userId}`, payload);
};

type UseUpdateUserOptions = {
  mutationConfig?: MutationConfig<typeof updateUser>;
};

export const useUpdateUser = ({
  mutationConfig,
}: UseUpdateUserOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
      queryClient.invalidateQueries({
        queryKey: getUserQueryOptions(variables.userId).queryKey,
      });
      onSuccess?.(data, variables, context);
    },
    ...restConfig,
    mutationFn: updateUser,
  });
};
