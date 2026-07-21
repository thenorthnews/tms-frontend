import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getUsersQueryOptions } from './get-users';

export const createUserInputSchema = z.object({
  // User credentials
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  countryCode: z.string().min(1, 'Country code is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),

  // User info
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  fatherName: z.string().min(2, 'Father name must be at least 2 characters'),
  motherName: z.string().min(2, 'Mother name must be at least 2 characters'),
  age: z.coerce.number().min(1, 'Age must be at least 1').max(100, 'Age must be at most 100'),
  gender: z.coerce.number().min(0).max(2),
  image: z.string().min(1, 'Image is required'),
  role: z.coerce.number().optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createUser = ({
  data,
}: {
  data: CreateUserInput;
}): Promise<any> => {
  // Transform flat form data to the backend DTO structure
  const payload = {
    UserDto: {
      email: {
        id: data.email,
        isVerified: false,
      },
      phoneNumber: {
        countryCode: data.countryCode,
        number: data.phoneNumber,
      },
      password: data.password,
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

  // The server assigns the role based on the selected endpoint; it is never client-controlled.
  const endpoint = data.role === 1 ? '/admin/managers' : '/admin/users';
  return api.post(endpoint, payload);
};

type UseCreateUserOptions = {
  mutationConfig?: MutationConfig<typeof createUser>;
};

export const useCreateUser = ({
  mutationConfig,
}: UseCreateUserOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createUser,
  });
};
