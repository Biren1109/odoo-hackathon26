"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectSchema = exports.approveRejectSchema = exports.initiateApprovalSchema = void 0;
const zod_1 = require("zod");
exports.initiateApprovalSchema = zod_1.z.object({
    rfqId: zod_1.z.string().uuid(),
    quotationId: zod_1.z.string().uuid(),
    approverId: zod_1.z.string().uuid(), // L1 approver (manager) ID
});
exports.approveRejectSchema = zod_1.z.object({
    remarks: zod_1.z.string().optional(),
});
exports.rejectSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(1, 'Remarks are mandatory when rejecting'),
});
