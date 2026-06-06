import { z } from 'zod';

export const initiateApprovalSchema = z.object({
  rfqId: z.string().uuid(),
  quotationId: z.string().uuid(),
  approverId: z.string().uuid(),    // L1 approver (manager) ID
});

export const approveRejectSchema = z.object({
  remarks: z.string().optional(),
});

export const rejectSchema = z.object({
  remarks: z.string().min(1, 'Remarks are mandatory when rejecting'),
});