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
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllVehicles);
router.post('/', createVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.get('/:id/location', getVehicleLocation);
router.post('/:id/location', ingestVehicleLocation);
router.get('/:id/history', getVehicleHistory);

export default router;
