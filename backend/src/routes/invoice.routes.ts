import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  downloadInvoicePDF,
  sendInvoiceViaEmail,
  updateInvoiceStatus,
} from '../controllers/invoice.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize('PROCUREMENT_OFFICER'), createInvoice);
router.get('/', authorize('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), getInvoices);
router.get('/:id', getInvoiceById);   // all authenticated
router.get('/:id/pdf', authorize('PROCUREMENT_OFFICER', 'ADMIN'), downloadInvoicePDF);
router.post('/:id/send-email', authorize('PROCUREMENT_OFFICER'), sendInvoiceViaEmail);
router.patch('/:id/status', authorize('PROCUREMENT_OFFICER'), updateInvoiceStatus);

export default router;