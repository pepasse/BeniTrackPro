import { Router } from 'express';
import {
  getFleetStatsController,
  getFleetConsumptionController,
} from '../controllers/fleet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getFleetStatsController);
router.get('/consumption', getFleetConsumptionController);

export default router;
