import Axios, { InternalAxiosRequestConfig } from 'axios';

import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { User } from '@/types/api';

export const mapUser = (backendUser: Record<string, unknown>): User => {
  if (!backendUser) return {} as User;
  const userInfo = (backendUser.userInfo || {}) as Record<string, unknown>;
  const emailObj = backendUser.email as { id?: string } | string | undefined;
  const phoneObj = backendUser.phoneNumber as
    | { number?: string }
    | string
    | undefined;

  return {
    id: String(backendUser._id || backendUser.id || ''),
    createdAt: backendUser.createdAt
      ? new Date(String(backendUser.createdAt)).getTime()
      : Date.now(),
    email: typeof emailObj === 'string' ? emailObj : emailObj?.id || '',
    firstName: String(backendUser.firstName || userInfo.firstName || ''),
    lastName: String(backendUser.lastName || userInfo.lastName || ''),
    role: (backendUser.role as User['role']) ?? 4,
    teamId: String(backendUser.teamId || ''),
    bio: String(backendUser.bio || ''),
    phoneNumber: typeof phoneObj === 'string' ? phoneObj : phoneObj?.number,
    department: String(
      backendUser.department || userInfo.department || 'Engineering',
    ),
    image: String(backendUser.image || userInfo.image || ''),
    status: (backendUser.status as number) ?? 0,
  };
};

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
});

let refreshPromise: Promise<{
  access_token: string;
  refresh_token: string;
}> | null = null;

const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshPromise) {
    refreshPromise = Axios.post(`${env.API_URL}/admin/auth/refresh`, {
      refresh_token: refreshToken,
    })
      .then((response) => {
        const tokens = response.data?.data;
        if (!tokens?.access_token || !tokens?.refresh_token) {
          throw new Error('Invalid refresh-token response');
        }
        localStorage.setItem('token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        return tokens;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const message = error.response?.data?.message || error.message;
    const isLoginRequest = originalRequest?.url?.includes('/admin/auth/login');
    const isRefreshRequest = originalRequest?.url?.includes(
      '/admin/auth/refresh',
    );

    // Display notification for non-401 and non-409 errors, or 401s during login
    if (
      (error.response?.status !== 401 && error.response?.status !== 409) ||
      isLoginRequest
    ) {
      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    }

    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      !isRefreshRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const { access_token } = await refreshAccessToken(refreshToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');

          if (!window.location.pathname.startsWith('/auth/login')) {
            const searchParams = new URLSearchParams(window.location.search);
            const redirectTo =
              searchParams.get('redirectTo') || window.location.pathname;
            window.location.href = paths.auth.login.getHref(redirectTo);
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, just redirect
        localStorage.removeItem('token');
        if (!window.location.pathname.startsWith('/auth/login')) {
          const searchParams = new URLSearchParams(window.location.search);
          const redirectTo =
            searchParams.get('redirectTo') || window.location.pathname;
          window.location.href = paths.auth.login.getHref(redirectTo);
        }
      }
    }

    return Promise.reject(error);
  },
);
