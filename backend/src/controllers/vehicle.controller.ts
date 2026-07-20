import { Request, Response } from 'express';
import { getConnection } from '../config/database';
import { Vehicle } from '../entities/Vehicle';
import logger from '../config/logger';

const vehicleRepository = () => getConnection().getRepository(Vehicle);

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
