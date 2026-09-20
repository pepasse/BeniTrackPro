import { Request, Response } from 'express';
import { getConnection } from '../config/database';
import { Vehicle } from '../entities/Vehicle';
import { VehiclePosition } from '../entities/VehiclePosition';
import {
  recordVehiclePosition,
  PositionValidationError,
  VehicleNotFoundError,
} from '../services/position.service';
import { createInitialSubscription, checkExpirationWarning } from '../services/subscription.service';
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

    // Ouvre automatiquement un abonnement d'un an pour ce véhicule
    await createInitialSubscription(vehicle.id);

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
    const position = await recordVehiclePosition(id, req.body);
    res.status(201).json(position);
  } catch (error) {
    if (error instanceof PositionValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    if (error instanceof VehicleNotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    logger.error("Erreur lors de l'ingestion de la position GPS:", error);
    res.status(500).json({ message: "Impossible d'enregistrer la position" });
  }
};

export const getVehicleLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await vehicleRepository().findOneBy({ id: req.params.id });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }

    // Averti le client si l'abonnement expire bientôt (au plus 1x/semaine),
    // affiché directement dans l'app au moment où il consulte le suivi.
    const subscriptionWarning = await checkExpirationWarning(vehicle.id);

    res.status(200).json({
      vehicleId: vehicle.id,
      latitude: vehicle.lastLatitude,
      longitude: vehicle.lastLongitude,
      speedKmh: vehicle.lastSpeedKmh,
      updatedAt: vehicle.lastLocationAt,
      ...(subscriptionWarning && { subscriptionWarning }),
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
