import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { getDashboard, getVendorPerformance, getSpendingSummary, getMonthlyTrends, exportReport } from '../controllers/report.controller';

const router = Router();

router.get('/dashboard', authenticate, getDashboard);
router.get('/vendor-performance', authenticate, authorize('ADMIN', 'MANAGER'), getVendorPerformance);
router.get('/spending-summary', authenticate, authorize('ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'), getSpendingSummary);
router.get('/monthly-trends', authenticate, authorize('ADMIN', 'MANAGER'), getMonthlyTrends);
router.get('/export', authenticate, authorize('ADMIN', 'MANAGER'), exportReport);

export default router;