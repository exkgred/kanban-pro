export let accessTokenMemory: string | null = null;

export const getAccessToken = (): string | null => {
  if (accessTokenMemory) return accessTokenMemory;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

export const setAccessToken = (token: string) => {
  accessTokenMemory = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
};

export const clearAccessToken = () => {
  accessTokenMemory = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

export const setRefreshToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', token);
  }
};

export const clearRefreshToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refreshToken');
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('authUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as unknown;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: unknown) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authUser', JSON.stringify(user));
  }
};

export const clearStoredUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authUser');
  }
};

export const clearTokens = () => {
  clearAccessToken();
  clearRefreshToken();
  clearStoredUser();
};

