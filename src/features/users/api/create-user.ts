import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export const createUserInputSchema = z.object({
  // User credentials
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  countryCode: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),

  // User info
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  gender: z.coerce.number().min(0).max(2).optional(),
  image: z.string().optional(),
  role: z.coerce.number().optional(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createUser = ({
  data,
}: {
  data: CreateUserInput;
}): Promise<any> => {
  // Transform flat form data to the backend DTO structure
  const payload: any = {
    UserDto: {
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber && data.phoneNumber.trim() ? data.phoneNumber.trim() : undefined,
    },
    UserInfo: {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      image: data.image,
      role: data.role,
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
