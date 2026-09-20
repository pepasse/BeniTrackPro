import { Router } from 'express';
import { ingestDeviceLocation, revokeDeviceKey } from '../controllers/device.controller';
import { authenticateDevice } from '../middleware/device.middleware';
import { requireActiveSubscriptionForDevice } from '../middleware/subscription.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Route de la balise elle-même : authentification par clé API uniquement,
// jamais par JWT (une balise GPS n'a pas de compte utilisateur).
router.post('/location', authenticateDevice, requireActiveSubscriptionForDevice, ingestDeviceLocation);

// À partir d'ici, routes de gestion réservées aux utilisateurs (JWT)
router.use(authenticate);
router.delete('/:deviceId', revokeDeviceKey);

export default router;
