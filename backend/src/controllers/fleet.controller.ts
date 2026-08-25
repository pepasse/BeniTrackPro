import { Request, Response } from 'express';
import { getVehicleStats, getFleetStats } from '../services/stats.service';
import logger from '../config/logger';

const parseDateRange = (req: Request): { from?: Date; to?: Date } => {
  const { from, to } = req.query;
  return {
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
  };
};

export const getVehicleStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getVehicleStats(req.params.id, parseDateRange(req));
    if (!stats) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }
    res.status(200).json(stats);
  } catch (error) {
    logger.error('Erreur lors du calcul des statistiques véhicule:', error);
    res.status(500).json({ message: 'Impossible de calculer les statistiques' });
  }
};

export const getFleetStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getFleetStats(parseDateRange(req));
    res.status(200).json(stats);
  } catch (error) {
    logger.error('Erreur lors du calcul des statistiques de flotte:', error);
    res.status(500).json({ message: 'Impossible de calculer les statistiques de flotte' });
  }
};

export const getFleetConsumptionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getFleetStats(parseDateRange(req));
    res.status(200).json({
      totalEstimatedFuelLiters: stats.totalEstimatedFuelLiters,
      perVehicle: stats.perVehicle.map((v) => ({
        vehicleId: v.vehicleId,
        plateNumber: v.plateNumber,
        distanceKm: v.distanceKm,
        estimatedFuelLiters: v.estimatedFuelLiters,
      })),
    });
  } catch (error) {
    logger.error('Erreur lors du calcul de la consommation de flotte:', error);
    res.status(500).json({ message: 'Impossible de calculer la consommation' });
  }
};
