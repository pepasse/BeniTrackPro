import { Router } from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleLocation,
  ingestVehicleLocation,
  getVehicleHistory,
} from '../controllers/vehicle.controller';
import {
  getVehicleSubscription,
  renewVehicleSubscription,
  getVehiclePaymentHistory,
} from '../controllers/subscription.controller';
import { getVehicleStatsController } from '../controllers/fleet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireActiveSubscription } from '../middleware/subscription.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllVehicles);
router.post('/', createVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

// Dernière position connue : toujours consultable, même abonnement expiré
// (utile pour que le client voie que le suivi s'est arrêté et doive payer)
router.get('/:id/location', getVehicleLocation);

// Suivi actif : bloqué si l'abonnement du véhicule a expiré
router.post('/:id/location', requireActiveSubscription, ingestVehicleLocation);
router.get('/:id/history', requireActiveSubscription, getVehicleHistory);

// Abonnement
router.get('/:id/subscription', getVehicleSubscription);
router.post('/:id/subscription/renew', renewVehicleSubscription);
router.get('/:id/subscription/payments', getVehiclePaymentHistory);

// Statistiques (distance parcourue, consommation estimée)
router.get('/:id/stats', getVehicleStatsController);

export default router;
