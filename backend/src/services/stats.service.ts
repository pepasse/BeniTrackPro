import { getConnection } from '../config/database';
import { Vehicle } from '../entities/Vehicle';
import { VehiclePosition } from '../entities/VehiclePosition';
import { haversineDistanceMeters } from '../utils/geo';

const vehicleRepository = () => getConnection().getRepository(Vehicle);
const positionRepository = () => getConnection().getRepository(VehiclePosition);

export interface VehicleStats {
  vehicleId: string;
  plateNumber: string;
  distanceKm: number;
  estimatedFuelLiters: number;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  pointCount: number;
  periodFrom: Date | null;
  periodTo: Date | null;
}

interface DateRange {
  from?: Date;
  to?: Date;
}

// Calcule la distance parcourue en sommant la distance Haversine entre
// chaque paire de points GPS consécutifs (triés chronologiquement).
// Un saut de plus de 2 minutes entre deux points est ignoré du calcul de
// distance (probable coupure de signal ou trajet non couvert), pour éviter
// de compter une "téléportation" comme un déplacement réel.
const MAX_GAP_MS = 2 * 60 * 1000;

export const getVehicleStats = async (vehicleId: string, range: DateRange = {}): Promise<VehicleStats | null> => {
  const vehicle = await vehicleRepository().findOneBy({ id: vehicleId });
  if (!vehicle) return null;

  const qb = positionRepository()
    .createQueryBuilder('position')
    .where('position.vehicleId = :vehicleId', { vehicleId })
    .orderBy('position.recordedAt', 'ASC');

  if (range.from) qb.andWhere('position.recordedAt >= :from', { from: range.from });
  if (range.to) qb.andWhere('position.recordedAt <= :to', { to: range.to });

  const positions = await qb.getMany();

  let distanceMeters = 0;
  let speedSum = 0;
  let speedCount = 0;
  let maxSpeed: number | null = null;

  for (let i = 0; i < positions.length; i++) {
    const point = positions[i];

    if (typeof point.speedKmh === 'number') {
      speedSum += point.speedKmh;
      speedCount++;
      if (maxSpeed === null || point.speedKmh > maxSpeed) maxSpeed = point.speedKmh;
    }

    if (i > 0) {
      const prev = positions[i - 1];
      const gapMs = point.recordedAt.getTime() - prev.recordedAt.getTime();
      if (gapMs <= MAX_GAP_MS) {
        distanceMeters += haversineDistanceMeters(
          { latitude: prev.latitude, longitude: prev.longitude },
          { latitude: point.latitude, longitude: point.longitude }
        );
      }
    }
  }

  const distanceKm = distanceMeters / 1000;
  const estimatedFuelLiters = (distanceKm * vehicle.fuelConsumptionL100km) / 100;

  return {
    vehicleId: vehicle.id,
    plateNumber: vehicle.plateNumber,
    distanceKm: Math.round(distanceKm * 100) / 100,
    estimatedFuelLiters: Math.round(estimatedFuelLiters * 100) / 100,
    avgSpeedKmh: speedCount > 0 ? Math.round((speedSum / speedCount) * 10) / 10 : null,
    maxSpeedKmh: maxSpeed,
    pointCount: positions.length,
    periodFrom: positions[0]?.recordedAt ?? null,
    periodTo: positions[positions.length - 1]?.recordedAt ?? null,
  };
};

export interface FleetStats {
  totalVehicles: number;
  totalDistanceKm: number;
  totalEstimatedFuelLiters: number;
  perVehicle: VehicleStats[];
}

export const getFleetStats = async (range: DateRange = {}): Promise<FleetStats> => {
  const vehicles = await vehicleRepository().find();

  const perVehicle: VehicleStats[] = [];
  for (const vehicle of vehicles) {
    const stats = await getVehicleStats(vehicle.id, range);
    if (stats) perVehicle.push(stats);
  }

  const totalDistanceKm = perVehicle.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalEstimatedFuelLiters = perVehicle.reduce((sum, s) => sum + s.estimatedFuelLiters, 0);

  return {
    totalVehicles: vehicles.length,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    totalEstimatedFuelLiters: Math.round(totalEstimatedFuelLiters * 100) / 100,
    perVehicle,
  };
};
