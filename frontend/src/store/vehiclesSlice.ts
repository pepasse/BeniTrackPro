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
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationAt?: string;
  lastSpeedKmh?: number;
}

interface VehiclesState {
  items: Vehicle[];
  selectedVehicleId: string | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: VehiclesState = {
  items: [],
  selectedVehicleId: null,
  status: 'idle',
  error: null,
};

export const fetchVehicles = createAsyncThunk('vehicles/fetchAll', async () => {
  const { data } = await apiClient.get<Vehicle[]>(API_ENDPOINTS.VEHICLES.GET_ALL);
  return data;
});

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    selectVehicle(state, action: PayloadAction<string | null>) {
      state.selectedVehicleId = action.payload;
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
      });
  },
});

export const { selectVehicle, applyLiveLocation } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
