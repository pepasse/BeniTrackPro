import { Request, Response } from 'express';
import { getConnection } from '../config/database';
import { Vehicle } from '../entities/Vehicle';
import { VehiclePosition } from '../entities/VehiclePosition';
import { emitVehicleLocation } from '../config/socket';
import { checkGeofences } from '../services/geofence.service';
import logger from '../config/logger';

const vehicleRepository = () => getConnection().getRepository(Vehicle);
const positionRepository = () => getConnection().getRepository(VehiclePosition);

export const getAllVehicles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await vehicleRepository().find({ order: { createdAt: 'DESC' } });
    res.status(200).json(vehicles);
  } catch (error) {
    logger.error('Erreur lors de la récupération des véhicules:', error);
    res.status(500).json({ message: 'Impossible de récupérer les véhicules' });
  }
};

export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await vehicleRepository().findOneBy({ id: req.params.id });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }
    res.status(200).json(vehicle);
  } catch (error) {
    logger.error('Erreur lors de la récupération du véhicule:', error);
    res.status(500).json({ message: 'Impossible de récupérer le véhicule' });
  }
};

export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plateNumber, brand, model, year, type, rfidTag } = req.body;

    if (!plateNumber || !brand || !model) {
      res.status(400).json({ message: 'plateNumber, brand et model sont requis' });
      return;
    }

    const repo = vehicleRepository();
    const existing = await repo.findOneBy({ plateNumber });
    if (existing) {
      res.status(409).json({ message: 'Un véhicule avec cette plaque existe déjà' });
      return;
    }

    const vehicle = repo.create({ plateNumber, brand, model, year, type, rfidTag });
    await repo.save(vehicle);
    res.status(201).json(vehicle);
  } catch (error) {
    logger.error('Erreur lors de la création du véhicule:', error);
    res.status(500).json({ message: 'Impossible de créer le véhicule' });
  }
};

export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = vehicleRepository();
    const vehicle = await repo.findOneBy({ id: req.params.id });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }
    repo.merge(vehicle, req.body);
    await repo.save(vehicle);
    res.status(200).json(vehicle);
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du véhicule:', error);
    res.status(500).json({ message: 'Impossible de mettre à jour le véhicule' });
  }
};

export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = vehicleRepository();
    const result = await repo.delete({ id: req.params.id });
    if (result.affected === 0) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Erreur lors de la suppression du véhicule:', error);
    res.status(500).json({ message: 'Impossible de supprimer le véhicule' });
  }
};

export const ingestVehicleLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { latitude, longitude, speedKmh, heading, recordedAt } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      res.status(400).json({ message: 'latitude et longitude (numériques) sont requis' });
      return;
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({ message: 'latitude ou longitude hors des bornes valides' });
      return;
    }

    const vRepo = vehicleRepository();
    const vehicle = await vRepo.findOneBy({ id });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }

    const timestamp = recordedAt ? new Date(recordedAt) : new Date();

    // Historique (TimescaleDB)
    const position = positionRepository().create({
      vehicleId: id,
      latitude,
      longitude,
      speedKmh,
      heading,
      recordedAt: timestamp,
    });
    await positionRepository().save(position);

    // Dernière position connue (accès rapide, pas de scan de l'historique)
    vehicle.lastLatitude = latitude;
    vehicle.lastLongitude = longitude;
    vehicle.lastSpeedKmh = speedKmh;
    vehicle.lastLocationAt = timestamp;
    await vRepo.save(vehicle);

    // Diffusion en temps réel aux clients abonnés à ce véhicule
    emitVehicleLocation(id, {
      vehicleId: id,
      latitude,
      longitude,
      speedKmh,
      heading,
      recordedAt: timestamp,
    });

    // Vérifie si cette position déclenche une entrée/sortie de géofence
    // (asynchrone, ne bloque pas la réponse HTTP)
    checkGeofences(id, { latitude, longitude }).catch((err) =>
      logger.error('checkGeofences a échoué:', err)
    );

    res.status(201).json(position);
  } catch (error) {
    logger.error("Erreur lors de l'ingestion de la position GPS:", error);
    res.status(500).json({ message: 'Impossible d\'enregistrer la position' });
  }
};

export const getVehicleLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await vehicleRepository().findOneBy({ id: req.params.id });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }
    res.status(200).json({
      vehicleId: vehicle.id,
      latitude: vehicle.lastLatitude,
      longitude: vehicle.lastLongitude,
      speedKmh: vehicle.lastSpeedKmh,
      updatedAt: vehicle.lastLocationAt,
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de la position:', error);
    res.status(500).json({ message: 'Impossible de récupérer la position' });
  }
};

export const getVehicleHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { from, to, limit } = req.query;

    const vehicle = await vehicleRepository().findOneBy({ id });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }

    const qb = positionRepository()
      .createQueryBuilder('position')
      .where('position.vehicleId = :id', { id })
      .orderBy('position.recordedAt', 'DESC')
      .limit(limit ? Math.min(parseInt(limit as string, 10), 1000) : 100);

    if (from) qb.andWhere('position.recordedAt >= :from', { from });
    if (to) qb.andWhere('position.recordedAt <= :to', { to });

    const positions = await qb.getMany();
    res.status(200).json(positions);
  } catch (error) {
    logger.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({ message: "Impossible de récupérer l'historique" });
  }
};
