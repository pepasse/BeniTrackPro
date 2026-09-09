import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config/config';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_URL, { autoConnect: true });
  }
  return socket;
};

export const subscribeToVehicle = (vehicleId: string): void => {
  getSocket().emit('subscribe:vehicle', vehicleId);
};

export const unsubscribeFromVehicle = (vehicleId: string): void => {
  getSocket().emit('unsubscribe:vehicle', vehicleId);
};

export interface VehicleLocationEvent {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?: number;
  recordedAt: string;
}

export interface SubscriptionWarningEvent {
  vehicleId: string;
  daysRemaining: number;
  expiresAt: string;
}

export interface GeofenceAlertEvent {
  geofenceId: string;
  geofenceName: string;
  vehicleId: string;
  eventType: 'enter' | 'exit';
  latitude: number;
  longitude: number;
  occurredAt: string;
}
