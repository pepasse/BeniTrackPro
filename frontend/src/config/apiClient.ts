import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { API_ENDPOINTS } from './constants';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Ces fonctions sont branchées depuis authSlice pour éviter une dépendance
// circulaire entre le client API et le store Redux.
let getAccessToken: () => string | null = () => null;
let getRefreshToken: () => string | null = () => null;
let onTokensRefreshed: (accessToken: string, refreshToken: string) => void = () => {};
let onAuthExpired: () => void = () => {};

export const attachAuthHandlers = (handlers: {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (accessToken: string, refreshToken: string) => void;
  onAuthExpired: () => void;
}) => {
  getAccessToken = handlers.getAccessToken;
  getRefreshToken = handlers.getRefreshToken;
  onTokensRefreshed = handlers.onTokensRefreshed;
  onAuthExpired = handlers.onAuthExpired;
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_URL}${API_ENDPOINTS.AUTH.REFRESH}`, { refreshToken });
    onTokensRefreshed(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Plusieurs requêtes peuvent échouer en même temps sur un token expiré :
      // on ne déclenche qu'un seul rafraîchissement, les autres l'attendent.
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }

      onAuthExpired();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
