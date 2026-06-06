import { Router } from 'express';
import {
  submitQuotation,
  updateQuotation,
  getQuotationsByRFQ,
  getQuotationsByVendor,
  compareQuotations,
} from '../controllers/quotation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Vendor submits a quotation
router.post('/', authorize('VENDOR'), submitQuotation);

// Vendor edits own quotation (only SUBMITTED status)
router.put('/:id', authorize('VENDOR'), updateQuotation);

// Officer/Manager gets all quotations for an RFQ
router.get('/rfq/:rfqId', authorize('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), getQuotationsByRFQ);

// Vendor views own quotations
router.get('/vendor/:vendorId', authorize('VENDOR'), getQuotationsByVendor);

// Compare quotations side-by-side
router.get('/compare/:rfqId', authorize('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), compareQuotations);

export default router;