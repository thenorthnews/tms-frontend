import { configureAuth } from 'react-query-auth';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';

import { paths } from '@/config/paths';
import { AuthResponse, User } from '@/types/api';

import { api, mapUser } from './api-client';

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features

const getUser = async (): Promise<User | null> => {
  try {
    const response = (await api.get('/admin/auth/me')) as Record<string, any>;
    return mapUser(response);
  } catch (error) {
    return null;
  }
};

const logout = async (): Promise<void> => {
  await api.post('/admin/auth/logout');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
};

export const loginInputSchema = z.object({
  email: z.string().trim().min(1, 'Required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
const loginWithEmailAndPassword = async (
  data: LoginInput,
): Promise<AuthResponse> => {
  const response = (await api.post('/admin/auth/login', {
    email: data.email,
    password: data.password,
  })) as Record<string, any>;

  if (response.access_token) {
    localStorage.setItem('token', response.access_token);
  }
  if (response.refresh_token) {
    localStorage.setItem('refresh_token', response.refresh_token);
  }

  return {
    jwt: response.access_token,
    refresh_token: response.refresh_token,
    user: mapUser(response.user),
  };
};

const authConfig = {
  userFn: getUser,
  loginFn: async (data: LoginInput) => {
    const response = await loginWithEmailAndPassword(data);
    return response.user;
  },
  registerFn: async () => {
    throw new Error('Registration is disabled');
  },
  logoutFn: logout,
};

export const { useUser, useLogin, useLogout, AuthLoader } =
  configureAuth(authConfig);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const location = useLocation();

  if (!user.data) {
    return (
      <Navigate to={paths.auth.login.getHref(location.pathname)} replace />
    );
  }

  return children;
};
