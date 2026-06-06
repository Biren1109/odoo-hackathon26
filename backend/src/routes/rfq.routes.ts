import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { uploadMulter } from '../config/cloudinary';
import {
  getRFQs,
  createRFQ,
  getRFQById,
  updateRFQ,
  publishRFQ,
  assignVendors,
} from '../controllers/rfq.controller';

const router = Router();

// All RFQ routes require authentication
router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'),
  getRFQs
);

router.post(
  '/',
  authorize('PROCUREMENT_OFFICER'),
  uploadMulter.array('attachments', 10),
  createRFQ
);

router.get(
  '/:id',
  authorize('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'),
  getRFQById
);

router.put(
  '/:id',
  authorize('PROCUREMENT_OFFICER'),
  updateRFQ
);

router.patch(
  '/:id/publish',
  authorize('PROCUREMENT_OFFICER'),
  publishRFQ
);

router.post(
  '/:id/assign-vendors',
  authorize('PROCUREMENT_OFFICER'),
  assignVendors
);

export default router;