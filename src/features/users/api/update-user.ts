import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getUserQueryOptions } from './get-user';
import { getUsersQueryOptions } from './get-users';

export const updateUserInputSchema = z.object({
  // UserDto fields
  email: z.string().email('Valid email is required'),
  countryCode: z.string().min(1, 'Country code is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),

  // UserInfo fields
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  fatherName: z.string().min(2, 'Father name must be at least 2 characters'),
  motherName: z.string().min(2, 'Mother name must be at least 2 characters'),
  age: z.coerce.number().min(1, 'Age must be at least 1').max(100, 'Age must be at most 100'),
  gender: z.coerce.number().min(0).max(2),
  salary: z.coerce.number().min(0, 'Salary must be at least 0').max(1000000, 'Salary must be at most 1000000'),
  image: z.string().min(1, 'Image is required'),
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
      salary: data.salary,
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
