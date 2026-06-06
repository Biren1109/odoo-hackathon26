"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const approval_controller_1 = require("../controllers/approval.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// List all approvals (Manager/Admin)
router.get('/', (0, role_middleware_1.authorize)('MANAGER', 'ADMIN', 'PROCUREMENT_OFFICER'), approval_controller_1.getApprovals);
// Officer initiates an approval
router.post('/', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), approval_controller_1.initiateApproval);
// Manager approves (handles L1 → L2 transition)
router.patch('/:id/approve', (0, role_middleware_1.authorize)('MANAGER', 'ADMIN'), approval_controller_1.approveApproval);
// Manager rejects with mandatory remarks
router.patch('/:id/reject', (0, role_middleware_1.authorize)('MANAGER', 'ADMIN'), approval_controller_1.rejectApproval);
// Anyone authenticated can view the timeline
router.get('/:id/timeline', approval_controller_1.getApprovalTimeline);
exports.default = router;
