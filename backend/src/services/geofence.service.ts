import { getConnection } from '../config/database';
import { Geofence, GeofenceType } from '../entities/Geofence';
import { GeofenceEvent, GeofenceEventType } from '../entities/GeofenceEvent';
import { isPointInCircle, isPointInPolygon, LatLng } from '../utils/geo';
import { emitGeofenceAlert } from '../config/socket';
import logger from '../config/logger';

const geofenceRepository = () => getConnection().getRepository(Geofence);
const eventRepository = () => getConnection().getRepository(GeofenceEvent);

const isPointInGeofence = (point: LatLng, geofence: Geofence): boolean => {
  if (geofence.type === GeofenceType.CIRCLE) {
    if (geofence.centerLatitude == null || geofence.centerLongitude == null || geofence.radiusMeters == null) {
      return false;
    }
    return isPointInCircle(
      point,
      { latitude: geofence.centerLatitude, longitude: geofence.centerLongitude },
      geofence.radiusMeters
    );
  }

  if (geofence.type === GeofenceType.POLYGON) {
    if (!geofence.polygon || geofence.polygon.length < 3) return false;
    return isPointInPolygon(point, geofence.polygon);
  }

  return false;
};

// Appelé après chaque ingestion de position GPS. Compare l'état actuel
// (dedans/dehors) à la dernière transition connue et journalise + diffuse
// un événement si le véhicule vient d'entrer ou de sortir d'une zone.
export const checkGeofences = async (vehicleId: string, point: LatLng): Promise<void> => {
  try {
    const geofences = await geofenceRepository().find({ where: { isActive: true } });
    const relevant = geofences.filter((g) => !g.vehicleId || g.vehicleId === vehicleId);

    for (const geofence of relevant) {
      const isInside = isPointInGeofence(point, geofence);

      const lastEvent = await eventRepository().findOne({
        where: { geofenceId: geofence.id, vehicleId },
        order: { createdAt: 'DESC' },
      });

      const wasInside = lastEvent?.eventType === GeofenceEventType.ENTER;

      if (isInside === wasInside) continue; // pas de changement d'état

      const eventType = isInside ? GeofenceEventType.ENTER : GeofenceEventType.EXIT;
      const event = eventRepository().create({
        geofenceId: geofence.id,
        vehicleId,
        eventType,
        latitude: point.latitude,
        longitude: point.longitude,
      });
      await eventRepository().save(event);

      emitGeofenceAlert({
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        vehicleId,
        eventType,
        latitude: point.latitude,
        longitude: point.longitude,
        occurredAt: event.createdAt,
      });
    }
  } catch (error) {
    // Le géofencing ne doit jamais faire échouer l'ingestion GPS elle-même
    logger.error('Erreur lors de la vérification des géofences:', error);
  }
};
