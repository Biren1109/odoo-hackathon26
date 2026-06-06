import { Router } from 'express';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePOStatus,
} from '../controllers/purchaseOrder.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('PROCUREMENT_OFFICER'), createPurchaseOrder);
router.get('/', authorize('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), getPurchaseOrders);
router.get('/:id', getPurchaseOrderById);   // all authenticated
router.patch('/:id/status', authorize('PROCUREMENT_OFFICER'), updatePOStatus);

export default router;