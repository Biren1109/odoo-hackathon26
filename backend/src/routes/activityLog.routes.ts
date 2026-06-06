import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import {
  getActivityLogs,
  getEntityActivityLogs,
} from '../controllers/activityLog.controller';

const router = Router();

router.use(authenticate);

// All logs — Admin/Manager only
router.get(
  '/',
  authorize('ADMIN', 'MANAGER'),
  getActivityLogs
);

// Entity-specific audit trail — all authenticated users
router.get(
  '/:entityType/:id',
  getEntityActivityLogs
);

export default router;