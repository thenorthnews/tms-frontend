import Axios, { InternalAxiosRequestConfig } from 'axios';

import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { User } from '@/types/api';

const ADMIN_ROLES: readonly (number | string)[] = [0, 1, 2, 'SUPERADMIN', 'ADMIN', 'TL'];

export const mapUser = (backendUser: Record<string, any>): User => {
  if (!backendUser) return null as any;
  const userInfo = backendUser.userInfo || {};
  return {
    id: backendUser._id,
    createdAt: backendUser.createdAt ? new Date(backendUser.createdAt).getTime() : Date.now(),
    email: backendUser.email?.id || backendUser.email || '',
    firstName: userInfo.firstName || backendUser.firstName || '',
    lastName: userInfo.lastName || backendUser.lastName || '',
    role: backendUser.role ?? (ADMIN_ROLES.includes(backendUser.role) ? 'ADMIN' : 'USER'),
    teamId: backendUser.teamId || '',
    bio: backendUser.bio || '',
    fatherName: userInfo.fatherName || '',
    motherName: userInfo.motherName || '',
    image: userInfo.image || '',
    status: backendUser.status ?? 0,
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

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const message = error.response?.data?.message || error.message;
    const isLoginRequest = originalRequest?.url?.includes('/admin/auth/login');
    const isRefreshRequest = originalRequest?.url?.includes('/admin/auth/refresh');

    // Display notification for non-401 errors, or 401s during login
    if (error.response?.status !== 401 || isLoginRequest) {
      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    }

    if (error.response?.status === 401 && !isLoginRequest && !isRefreshRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Call refresh endpoint directly using Axios to avoid infinite interceptor loops
          const response = await Axios.post(`${env.API_URL}/admin/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (response.data?.data?.access_token) {
            const { access_token, refresh_token } = response.data.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');

          if (!window.location.pathname.startsWith('/auth/login')) {
            const searchParams = new URLSearchParams(window.location.search);
            const redirectTo = searchParams.get('redirectTo') || window.location.pathname;
            window.location.href = paths.auth.login.getHref(redirectTo);
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, just redirect
        localStorage.removeItem('token');
        if (!window.location.pathname.startsWith('/auth/login')) {
          const searchParams = new URLSearchParams(window.location.search);
          const redirectTo = searchParams.get('redirectTo') || window.location.pathname;
          window.location.href = paths.auth.login.getHref(redirectTo);
        }
      }
    }

    return Promise.reject(error);
  },
);
