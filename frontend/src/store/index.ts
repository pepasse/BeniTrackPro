import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import vehiclesReducer from './vehiclesSlice';
import geofencesReducer from './geofencesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehiclesReducer,
    geofences: geofencesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
