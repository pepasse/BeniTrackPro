import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../config/apiClient';
import { API_ENDPOINTS } from '../config/constants';

export type GeofenceType = 'circle' | 'polygon';

export interface PolygonPoint {
  latitude: number;
  longitude: number;
}

export interface Geofence {
  id: string;
  name: string;
  type: GeofenceType;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  polygon?: PolygonPoint[];
  vehicleId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GeofenceInput {
  name: string;
  type: GeofenceType;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  polygon?: PolygonPoint[];
  vehicleId?: string;
  isActive?: boolean;
}

interface GeofencesState {
  items: Geofence[];
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
  mutationError: string | null;
}

const initialState: GeofencesState = {
  items: [],
  status: 'idle',
  error: null,
  mutationError: null,
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
};

export const fetchGeofences = createAsyncThunk('geofences/fetchAll', async () => {
  const { data } = await apiClient.get<Geofence[]>(API_ENDPOINTS.GEOFENCES.GET_ALL);
  return data;
});

export const createGeofence = createAsyncThunk(
  'geofences/create',
  async (payload: GeofenceInput, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Geofence>(API_ENDPOINTS.GEOFENCES.CREATE, payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Impossible de créer la géofence'));
    }
  }
);

export const updateGeofence = createAsyncThunk(
  'geofences/update',
  async ({ id, ...payload }: Partial<GeofenceInput> & { id: string }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put<Geofence>(API_ENDPOINTS.GEOFENCES.UPDATE(id), payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Impossible de mettre à jour la géofence'));
    }
  }
);

export const deleteGeofence = createAsyncThunk(
  'geofences/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(API_ENDPOINTS.GEOFENCES.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Impossible de supprimer la géofence'));
    }
  }
);

const geofencesSlice = createSlice({
  name: 'geofences',
  initialState,
  reducers: {
    clearMutationError(state) {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGeofences.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGeofences.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchGeofences.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Impossible de charger les géofences';
      })
      .addCase(createGeofence.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.mutationError = null;
      })
      .addCase(createGeofence.rejected, (state, action) => {
        state.mutationError = action.payload as string;
      })
      .addCase(updateGeofence.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteGeofence.fulfilled, (state, action) => {
        state.items = state.items.filter((g) => g.id !== action.payload);
      });
  },
});

export const { clearMutationError } = geofencesSlice.actions;
export default geofencesSlice.reducer;
