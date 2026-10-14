import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastSpeedKmh?: number | null;
  lastLocationAt?: string | null;
}

const ACCESS = 'btp_access';
const REFRESH = 'btp_refresh';

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS);
export const hasSession = async () => !!(await SecureStore.getItemAsync(REFRESH));

export const clearSession = async () => {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
};

const saveTokens = async (access: string, refresh: string) => {
  await SecureStore.setItemAsync(ACCESS, access);
  await SecureStore.setItemAsync(REFRESH, refresh);
};

const parse = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
};

export const login = async (email: string, password: string) => {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Serveur injoignable. Vérifie l’IP dans config.ts et le Wi-Fi.');
  }
  const data = await parse(res);
  if (!res.ok) throw new Error(data?.message || 'Connexion impossible');
  await saveTokens(data.accessToken, data.refreshToken);
  return data.user;
};

let refreshing: Promise<boolean> | null = null;
const refresh = (): Promise<boolean> => {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const token = await SecureStore.getItemAsync(REFRESH);
        if (!token) return false;
        const res = await fetch(`${API_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: token }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        await saveTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
};

export class SessionExpiredError extends Error {}

export const apiGet = async <T,>(path: string): Promise<T> => {
  const call = async () =>
    fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${await getAccessToken()}` } });
  let res = await call();
  if (res.status === 401) {
    if (await refresh()) res = await call();
    else {
      await clearSession();
      throw new SessionExpiredError();
    }
  }
  const data = await parse(res);
  if (!res.ok) throw new Error(data?.message || 'Erreur serveur');
  return data as T;
};
