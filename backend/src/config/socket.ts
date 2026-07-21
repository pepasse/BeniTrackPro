import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import config from './config';
import logger from './logger';

let io: SocketIOServer | null = null;

export const initializeSocket = (httpServer: http.Server): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Client connecté via Socket.io: ${socket.id}`);

    // Le client rejoint une "room" par véhicule pour ne recevoir
    // que les mises à jour des véhicules qu'il suit.
    socket.on('subscribe:vehicle', (vehicleId: string) => {
      socket.join(`vehicle:${vehicleId}`);
    });

    socket.on('unsubscribe:vehicle', (vehicleId: string) => {
      socket.leave(`vehicle:${vehicleId}`);
    });

    socket.on('subscribe:alerts', () => {
      socket.join('alerts');
    });

    socket.on('disconnect', () => {
      logger.info(`Client déconnecté: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io non initialisé');
  }
  return io;
};

// Diffuse une position GPS aux clients abonnés à ce véhicule
export const emitVehicleLocation = (
  vehicleId: string,
  payload: {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speedKmh?: number;
    heading?: number;
    recordedAt: Date;
  }
): void => {
  if (!io) return;
  io.to(`vehicle:${vehicleId}`).emit('vehicle:location', payload);
};

// Diffuse une alerte de géofencing (entrée/sortie de zone) aux clients
// abonnés au véhicule concerné, ainsi qu'à une room globale "alerts"
// (pour un futur tableau de bord centralisé).
export const emitGeofenceAlert = (payload: {
  geofenceId: string;
  geofenceName: string;
  vehicleId: string;
  eventType: 'enter' | 'exit';
  latitude: number;
  longitude: number;
  occurredAt: Date;
}): void => {
  if (!io) return;
  io.to(`vehicle:${payload.vehicleId}`).emit('geofence:alert', payload);
  io.to('alerts').emit('geofence:alert', payload);
};
