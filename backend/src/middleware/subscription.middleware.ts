import { Request, Response, NextFunction } from 'express';
import { isSubscriptionActive } from '../services/subscription.service';
import type { DeviceRequest } from './device.middleware';
import logger from '../config/logger';

export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const vehicleId = req.params.id;
    const active = await isSubscriptionActive(vehicleId);

    if (!active) {
      res.status(402).json({
        message: "Abonnement expiré pour ce véhicule. Le suivi GPS est suspendu jusqu'au renouvellement.",
        code: 'SUBSCRIPTION_EXPIRED',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error("Erreur lors de la vérification de l'abonnement:", error);
    res.status(500).json({ message: "Impossible de vérifier l'abonnement" });
  }
};

// Même contrôle, mais pour la route balise/device : le véhicule est celui
// résolu par authenticateDevice (via la clé API), pas un paramètre d'URL.
export const requireActiveSubscriptionForDevice = async (
  req: DeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const active = await isSubscriptionActive(req.deviceVehicleId!);

    if (!active) {
      res.status(402).json({
        message: "Abonnement expiré pour ce véhicule. Le suivi GPS est suspendu jusqu'au renouvellement.",
        code: 'SUBSCRIPTION_EXPIRED',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error("Erreur lors de la vérification de l'abonnement (device):", error);
    res.status(500).json({ message: "Impossible de vérifier l'abonnement" });
  }
};
