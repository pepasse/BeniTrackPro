import { Request, Response, NextFunction } from 'express';
import { getConnection } from '../config/database';
import { DeviceApiKey } from '../entities/DeviceApiKey';
import { hashApiKey, extractKeyPrefix, secureCompare } from '../utils/apiKey';
import logger from '../config/logger';

export interface DeviceRequest extends Request {
  deviceVehicleId?: string;
}

const deviceKeyRepository = () => getConnection().getRepository(DeviceApiKey);

export const authenticateDevice = async (
  req: DeviceRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey || !apiKey.startsWith('btp_')) {
    res.status(401).json({ message: 'Clé API manquante ou invalide' });
    return;
  }

  try {
    // Le préfixe permet de retrouver rapidement la ligne candidate (indexé),
    // puis on compare le hash complet en temps constant pour valider.
    const keyPrefix = extractKeyPrefix(apiKey);
    const candidate = await deviceKeyRepository().findOneBy({ keyPrefix });

    if (!candidate || !candidate.isActive) {
      res.status(401).json({ message: 'Clé API invalide ou désactivée' });
      return;
    }

    const providedHash = hashApiKey(apiKey);
    if (!secureCompare(providedHash, candidate.keyHash)) {
      res.status(401).json({ message: 'Clé API invalide ou désactivée' });
      return;
    }

    req.deviceVehicleId = candidate.vehicleId;

    // Mise à jour paresseuse, sans bloquer la requête
    deviceKeyRepository()
      .update({ id: candidate.id }, { lastUsedAt: new Date() })
      .catch((err) => logger.error('Échec de mise à jour de lastUsedAt:', err));

    next();
  } catch (error) {
    logger.error("Erreur lors de l'authentification par clé API:", error);
    res.status(500).json({ message: "Impossible de vérifier la clé API" });
  }
};
