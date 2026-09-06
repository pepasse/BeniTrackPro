import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../config/apiClient';
import { API_ENDPOINTS } from '../config/constants';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'driver';
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const STORAGE_KEY = 'benitrackpro.auth';

const loadPersistedAuth = (): Pick<AuthState, 'user' | 'accessToken' | 'refreshToken'> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw);
    return { user: parsed.user, accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
};

const persistAuth = (state: Pick<AuthState, 'user' | 'accessToken' | 'refreshToken'>) => {
  if (state.accessToken && state.refreshToken && state.user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

const initialState: AuthState = {
  ...loadPersistedAuth(),
  status: 'idle',
  error: null,
};

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (error && typeof error === 'object' && 'request' in error && !('response' in (error as object))) {
    // La requête est partie mais aucune réponse n'est revenue : le serveur
    // est injoignable (backend éteint, mauvaise URL, coupure réseau...).
    // Bien distinguer ce cas d'un vrai refus d'identifiants.
    return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
  }
  return fallback;
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Identifiants incorrects'));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    payload: { fullName: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Impossible de créer le compte"));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      persistAuth(state);
    },
    tokensRefreshed(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      persistAuth(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persistAuth(state);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Échec de connexion';
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persistAuth(state);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Échec de création du compte';
      });
  },
});

export const { logout, tokensRefreshed } = authSlice.actions;
export default authSlice.reducer;
