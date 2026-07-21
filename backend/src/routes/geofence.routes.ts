import { Router } from 'express';
import {
  getAllGeofences,
  getGeofenceById,
  createGeofence,
  updateGeofence,
  deleteGeofence,
} from '../controllers/geofence.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAllGeofences);
router.post('/', createGeofence);
router.get('/:id', getGeofenceById);
router.put('/:id', updateGeofence);
router.delete('/:id', deleteGeofence);

export default router;
