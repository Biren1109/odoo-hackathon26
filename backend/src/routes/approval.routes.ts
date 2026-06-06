import { Router } from 'express';
import {
  getApprovals,
  initiateApproval,
  approveApproval,
  rejectApproval,
  getApprovalTimeline,
} from '../controllers/approval.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

// List all approvals (Manager/Admin)
router.get('/', authorize('MANAGER', 'ADMIN', 'PROCUREMENT_OFFICER'), getApprovals);

// Officer initiates an approval
router.post('/', authorize('PROCUREMENT_OFFICER'), initiateApproval);

// Manager approves (handles L1 → L2 transition)
router.patch('/:id/approve', authorize('MANAGER', 'ADMIN'), approveApproval);

// Manager rejects with mandatory remarks
router.patch('/:id/reject', authorize('MANAGER', 'ADMIN'), rejectApproval);

// Anyone authenticated can view the timeline
router.get('/:id/timeline', getApprovalTimeline);

export default router;