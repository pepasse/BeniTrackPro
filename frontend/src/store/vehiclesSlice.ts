import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../config/apiClient';
import { API_ENDPOINTS } from '../config/constants';
import type { VehicleLocationEvent } from '../services/socket';

export type VehicleStatus = 'active' | 'inactive' | 'maintenance';
export type VehicleType = 'car' | 'truck' | 'motorcycle' | 'van' | 'other';

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number;
  type: VehicleType;
  status: VehicleStatus;
  rfidTag?: string;
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationAt?: string;
  lastSpeedKmh?: number;
}

export interface VehicleInput {
  plateNumber: string;
  brand: string;
  model: string;
  year?: number;
  type: VehicleType;
  rfidTag?: string;
}

interface VehiclesState {
  items: Vehicle[];
  selectedVehicleId: string | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
  mutationError: string | null;
}

const initialState: VehiclesState = {
  items: [],
  selectedVehicleId: null,
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

export const fetchVehicles = createAsyncThunk('vehicles/fetchAll', async () => {
  const { data } = await apiClient.get<Vehicle[]>(API_ENDPOINTS.VEHICLES.GET_ALL);
  return data;
});

export const createVehicle = createAsyncThunk(
  'vehicles/create',
  async (payload: VehicleInput, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<Vehicle>(API_ENDPOINTS.VEHICLES.CREATE, payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Impossible de créer le véhicule'));
    }
  }
);

export const updateVehicle = createAsyncThunk(
  'vehicles/update',
  async ({ id, ...payload }: VehicleInput & { id: string }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put<Vehicle>(API_ENDPOINTS.VEHICLES.UPDATE(id), payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Impossible de mettre à jour le véhicule'));
    }
  }
);

export const deleteVehicle = createAsyncThunk(
  'vehicles/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(API_ENDPOINTS.VEHICLES.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Impossible de supprimer le véhicule'));
    }
  }
);

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    selectVehicle(state, action: PayloadAction<string | null>) {
      state.selectedVehicleId = action.payload;
    },
    clearMutationError(state) {
      state.mutationError = null;
    },
    // Appliqué à chaque événement `vehicle:location` reçu via Socket.io
    applyLiveLocation(state, action: PayloadAction<VehicleLocationEvent>) {
      const vehicle = state.items.find((v) => v.id === action.payload.vehicleId);
      if (vehicle) {
        vehicle.lastLatitude = action.payload.latitude;
        vehicle.lastLongitude = action.payload.longitude;
        vehicle.lastSpeedKmh = action.payload.speedKmh;
        vehicle.lastLocationAt = action.payload.recordedAt;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Impossible de charger les véhicules';
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.mutationError = null;
      })
      .addCase(createVehicle.rejected, (state, action) => {
        state.mutationError = action.payload as string;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const index = state.items.findIndex((v) => v.id === action.payload.id);
        if (index !== -1) state.items[index] = { ...state.items[index], ...action.payload };
        state.mutationError = null;
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.mutationError = action.payload as string;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.items = state.items.filter((v) => v.id !== action.payload);
        if (state.selectedVehicleId === action.payload) state.selectedVehicleId = null;
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.mutationError = action.payload as string;
      });
  },
});

export const { selectVehicle, applyLiveLocation, clearMutationError } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
