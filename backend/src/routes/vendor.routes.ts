import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import {
  getVendors,
  createVendor,
  getVendorById,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
} from '../controllers/vendor.controller';

const router = Router();

// All vendor routes require authentication
router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'),
  getVendors
);

router.post(
  '/',
  authorize('ADMIN'),
  createVendor
);

router.get(
  '/:id',
  authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'),
  getVendorById
);

router.put(
  '/:id',
  authorize('ADMIN'),
  updateVendor
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  deleteVendor
);

router.patch(
  '/:id/status',
  authorize('ADMIN'),
  updateVendorStatus
);

export default router;