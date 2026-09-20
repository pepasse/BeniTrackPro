import { getConnection } from '../config/database';
import { Vehicle } from '../entities/Vehicle';
import { VehiclePosition } from '../entities/VehiclePosition';
import { emitVehicleLocation } from '../config/socket';
import { checkGeofences } from './geofence.service';
import logger from '../config/logger';

const vehicleRepository = () => getConnection().getRepository(Vehicle);
const positionRepository = () => getConnection().getRepository(VehiclePosition);

export interface PositionInput {
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?: number;
  recordedAt?: string | Date;
}

export class PositionValidationError extends Error {}
export class VehicleNotFoundError extends Error {}

const validatePosition = (input: PositionInput): void => {
  const { latitude, longitude } = input;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new PositionValidationError('latitude et longitude (numériques) sont requis');
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new PositionValidationError('latitude ou longitude hors des bornes valides');
  }
};

// Logique centrale d'ingestion d'une position GPS : validation, écriture de
// l'historique (TimescaleDB), mise à jour de la dernière position connue,
// diffusion temps réel (Socket.io) et vérification des géofences.
// Appelée à la fois par la route protégée JWT (dashboard, tests manuels) et
// par la route protégée par clé API (balises GPS réelles), pour ne pas
// dupliquer cette logique entre les deux points d'entrée.
export const recordVehiclePosition = async (
  vehicleId: string,
  input: PositionInput
): Promise<VehiclePosition> => {
  validatePosition(input);

  const { latitude, longitude, speedKmh, heading, recordedAt } = input;

  const vRepo = vehicleRepository();
  const vehicle = await vRepo.findOneBy({ id: vehicleId });
  if (!vehicle) {
    throw new VehicleNotFoundError('Véhicule introuvable');
  }

  const timestamp = recordedAt ? new Date(recordedAt) : new Date();

  const position = positionRepository().create({
    vehicleId,
    latitude,
    longitude,
    speedKmh,
    heading,
    recordedAt: timestamp,
  });
  await positionRepository().save(position);

  vehicle.lastLatitude = latitude;
  vehicle.lastLongitude = longitude;
  vehicle.lastSpeedKmh = speedKmh;
  vehicle.lastLocationAt = timestamp;
  await vRepo.save(vehicle);

  emitVehicleLocation(vehicleId, {
    vehicleId,
    latitude,
    longitude,
    speedKmh,
    heading,
    recordedAt: timestamp,
  });

  checkGeofences(vehicleId, { latitude, longitude }).catch((err) =>
    logger.error('checkGeofences a échoué:', err)
  );

  return position;
};
