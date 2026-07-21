import { Request, Response } from 'express';
import { getConnection } from '../config/database';
import { Geofence, GeofenceType } from '../entities/Geofence';
import logger from '../config/logger';

const geofenceRepository = () => getConnection().getRepository(Geofence);

export const getAllGeofences = async (_req: Request, res: Response): Promise<void> => {
  try {
    const geofences = await geofenceRepository().find({ order: { createdAt: 'DESC' } });
    res.status(200).json(geofences);
  } catch (error) {
    logger.error('Erreur lors de la récupération des géofences:', error);
    res.status(500).json({ message: 'Impossible de récupérer les géofences' });
  }
};

export const getGeofenceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const geofence = await geofenceRepository().findOneBy({ id: req.params.id });
    if (!geofence) {
      res.status(404).json({ message: 'Géofence introuvable' });
      return;
    }
    res.status(200).json(geofence);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la géofence:', error);
    res.status(500).json({ message: 'Impossible de récupérer la géofence' });
  }
};

const validateGeofencePayload = (body: any): string | null => {
  const { name, type, centerLatitude, centerLongitude, radiusMeters, polygon } = body;

  if (!name) return 'name est requis';
  if (![GeofenceType.CIRCLE, GeofenceType.POLYGON].includes(type)) {
    return "type doit être 'circle' ou 'polygon'";
  }

  if (type === GeofenceType.CIRCLE) {
    if (typeof centerLatitude !== 'number' || typeof centerLongitude !== 'number' || typeof radiusMeters !== 'number') {
      return 'centerLatitude, centerLongitude et radiusMeters (numériques) sont requis pour une zone circulaire';
    }
    if (radiusMeters <= 0) return 'radiusMeters doit être positif';
  }

  if (type === GeofenceType.POLYGON) {
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return 'polygon doit contenir au moins 3 points { latitude, longitude }';
    }
    const invalid = polygon.some(
      (p: any) => typeof p.latitude !== 'number' || typeof p.longitude !== 'number'
    );
    if (invalid) return 'chaque point du polygon doit avoir latitude et longitude numériques';
  }

  return null;
};

export const createGeofence = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationError = validateGeofencePayload(req.body);
    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const { name, type, centerLatitude, centerLongitude, radiusMeters, polygon, vehicleId, isActive } = req.body;

    const repo = geofenceRepository();
    const geofence = repo.create({
      name,
      type,
      centerLatitude,
      centerLongitude,
      radiusMeters,
      polygon,
      vehicleId: vehicleId || undefined,
      isActive: isActive ?? true,
    });
    await repo.save(geofence);
    res.status(201).json(geofence);
  } catch (error) {
    logger.error('Erreur lors de la création de la géofence:', error);
    res.status(500).json({ message: 'Impossible de créer la géofence' });
  }
};

export const updateGeofence = async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = geofenceRepository();
    const geofence = await repo.findOneBy({ id: req.params.id });
    if (!geofence) {
      res.status(404).json({ message: 'Géofence introuvable' });
      return;
    }
    repo.merge(geofence, req.body);
    await repo.save(geofence);
    res.status(200).json(geofence);
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la géofence:', error);
    res.status(500).json({ message: 'Impossible de mettre à jour la géofence' });
  }
};

export const deleteGeofence = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await geofenceRepository().delete({ id: req.params.id });
    if (result.affected === 0) {
      res.status(404).json({ message: 'Géofence introuvable' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Erreur lors de la suppression de la géofence:', error);
    res.status(500).json({ message: 'Impossible de supprimer la géofence' });
  }
};
