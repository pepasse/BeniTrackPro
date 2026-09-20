import { Response } from 'express';
import { Request } from 'express';
import { getConnection } from '../config/database';
import { Vehicle } from '../entities/Vehicle';
import { DeviceApiKey } from '../entities/DeviceApiKey';
import { generateApiKey } from '../utils/apiKey';
import { recordVehiclePosition, PositionValidationError, VehicleNotFoundError } from '../services/position.service';
import type { DeviceRequest } from '../middleware/device.middleware';
import logger from '../config/logger';

const vehicleRepository = () => getConnection().getRepository(Vehicle);
const deviceKeyRepository = () => getConnection().getRepository(DeviceApiKey);

// --- Gestion des clés (utilisateur authentifié par JWT) ---

export const createDeviceKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: vehicleId } = req.params;
    const { label } = req.body;

    if (!label) {
      res.status(400).json({ message: 'label est requis' });
      return;
    }

    const vehicle = await vehicleRepository().findOneBy({ id: vehicleId });
    if (!vehicle) {
      res.status(404).json({ message: 'Véhicule introuvable' });
      return;
    }

    const { plainKey, keyPrefix, keyHash } = generateApiKey();

    const repo = deviceKeyRepository();
    const deviceKey = repo.create({ vehicleId, label, keyPrefix, keyHash });
    await repo.save(deviceKey);

    // La clé en clair n'est renvoyée qu'ICI, une seule fois. Elle ne sera
    // plus jamais récupérable ensuite (seul son hash est conservé).
    res.status(201).json({
      id: deviceKey.id,
      label: deviceKey.label,
      keyPrefix: deviceKey.keyPrefix,
      apiKey: plainKey,
      createdAt: deviceKey.createdAt,
    });
  } catch (error) {
    logger.error('Erreur lors de la création de la clé API:', error);
    res.status(500).json({ message: 'Impossible de créer la clé API' });
  }
};

export const listDeviceKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: vehicleId } = req.params;
    const keys = await deviceKeyRepository().find({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
    });

    // Ne jamais renvoyer keyHash, même hashée : aucune raison de l'exposer
    res.status(200).json(
      keys.map((k) => ({
        id: k.id,
        label: k.label,
        keyPrefix: k.keyPrefix,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
      }))
    );
  } catch (error) {
    logger.error('Erreur lors de la récupération des clés API:', error);
    res.status(500).json({ message: 'Impossible de récupérer les clés API' });
  }
};

export const revokeDeviceKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const result = await deviceKeyRepository().delete({ id: deviceId });
    if (result.affected === 0) {
      res.status(404).json({ message: 'Clé API introuvable' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Erreur lors de la révocation de la clé API:', error);
    res.status(500).json({ message: 'Impossible de révoquer la clé API' });
  }
};

// --- Ingestion (balise authentifiée par clé API) ---

export const ingestDeviceLocation = async (req: DeviceRequest, res: Response): Promise<void> => {
  try {
    const position = await recordVehiclePosition(req.deviceVehicleId!, req.body);
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
    logger.error("Erreur lors de l'ingestion de la position GPS (device):", error);
    res.status(500).json({ message: "Impossible d'enregistrer la position" });
  }
};
