import axios from 'axios';
import { getAccessToken, getRefreshToken } from './auth';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const refreshRes = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/refresh`,
          { refreshToken },
          { timeout: 15000 },
        );

        const payload = refreshRes.data?.data || refreshRes.data;
        const newAccessToken = payload.accessToken || payload.tokens?.accessToken;
        const newRefreshToken = payload.refreshToken || payload.tokens?.refreshToken || refreshToken;

        if (!newAccessToken) throw new Error('No access token received on refresh');

        const { useAuthStore } = await import('../stores/auth-store');
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken, useAuthStore.getState().user!);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        const { useAuthStore } = await import('../stores/auth-store');
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
