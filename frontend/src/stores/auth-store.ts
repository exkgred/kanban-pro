import { create } from 'zustand';
import type { User } from '../types';
import { apiClient } from '../lib/api-client';
import {
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getRefreshToken,
  getAccessToken,
  getStoredUser,
  setStoredUser,
} from '../lib/auth';
import { disconnectSocket } from '../lib/socket';

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

interface AuthTokensPayload {
  user: User;
  tokens?: { accessToken: string; refreshToken: string };
  accessToken?: string;
  refreshToken?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  loadFromStorage: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  login: async (email, password) => {
    const payload = unwrapData<AuthTokensPayload>(
      await apiClient.post('/auth/login', { email, password }),
    );
    const accessToken = payload.tokens?.accessToken || payload.accessToken;
    const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;
    if (!payload.user || !accessToken || !refreshToken) {
      throw new Error('Resposta de login inválida');
    }
    get().setTokens(accessToken, refreshToken, payload.user);
  },

  register: async (name, email, password) => {
    const payload = unwrapData<AuthTokensPayload>(
      await apiClient.post('/auth/register', { name, email, password }),
    );
    const accessToken = payload.tokens?.accessToken || payload.accessToken;
    const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;
    if (!payload.user || !accessToken || !refreshToken) {
      throw new Error('Resposta de cadastro inválida');
    }
    get().setTokens(accessToken, refreshToken, payload.user);
  },

  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      get().clearAuth();
    }
  },

  refreshAuth: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      const payload = unwrapData<{
        accessToken?: string;
        refreshToken?: string;
        tokens?: { accessToken: string; refreshToken: string };
      }>(await apiClient.post('/auth/refresh', { refreshToken }));

      const accessToken = payload.accessToken || payload.tokens?.accessToken;
      const newRefreshToken =
        payload.refreshToken || payload.tokens?.refreshToken || refreshToken;
      if (!accessToken) return false;

      setAccessToken(accessToken);
      const mePayload = unwrapData<User>(
        await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      get().setTokens(accessToken, newRefreshToken, mePayload);
      return true;
    } catch {
      get().clearAuth();
      return false;
    }
  },

  setTokens: (accessToken, refreshToken, user) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setStoredUser(user);
    set({ accessToken, user, isLoading: false });
  },

  clearAuth: () => {
    clearTokens();
    disconnectSocket();
    set({ user: null, accessToken: null, isLoading: false });
  },

  loadFromStorage: async () => {
    try {
      const storedUser = getStoredUser() as User | null;
      const storedToken = getAccessToken();
      if (storedUser && storedToken) {
        set({ user: storedUser, accessToken: storedToken, isLoading: false });
        return true;
      }

      if (!getRefreshToken()) {
        return false;
      }

      return await get().refreshAuth();
    } catch {
      get().clearAuth();
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
