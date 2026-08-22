import { Request, Response } from 'express';
import { getConnection } from '../config/database';
import { Vehicle } from '../entities/Vehicle';
import {
  getSubscription as fetchSubscription,
  renewSubscription,
  getPaymentHistory,
} from '../services/subscription.service';
import logger from '../config/logger';

const vehicleRepository = () => getConnection().getRepository(Vehicle);

export const getVehicleSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await vehicleRepository().findOneBy({ id });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }

    const subscription = await fetchSubscription(id);
    if (!subscription) {
      res.status(404).json({ message: 'Aucun abonnement trouvé pour ce véhicule' });
      return;
    }

    const daysRemaining = Math.ceil(
      (subscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    res.status(200).json({ ...subscription, daysRemaining });
  } catch (error) {
    logger.error("Erreur lors de la récupération de l'abonnement:", error);
    res.status(500).json({ message: "Impossible de récupérer l'abonnement" });
  }
};

export const renewVehicleSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, currency, method, reference } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: 'amount (numérique positif) est requis' });
      return;
    }

    const vehicle = await vehicleRepository().findOneBy({ id });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }

    const subscription = await renewSubscription({ vehicleId: id, amount, currency, method, reference });
    res.status(200).json({
      message: 'Abonnement renouvelé avec succès',
      subscription,
    });
  } catch (error) {
    logger.error("Erreur lors du renouvellement de l'abonnement:", error);
    res.status(500).json({ message: "Impossible de renouveler l'abonnement" });
  }
};

export const getVehiclePaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await getPaymentHistory(req.params.id);
    res.status(200).json(payments);
  } catch (error) {
    logger.error("Erreur lors de la récupération de l'historique des paiements:", error);
    res.status(500).json({ message: "Impossible de récupérer l'historique des paiements" });
  }
};
