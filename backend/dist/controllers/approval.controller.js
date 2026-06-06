"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApprovals = getApprovals;
exports.initiateApproval = initiateApproval;
exports.approveApproval = approveApproval;
exports.rejectApproval = rejectApproval;
exports.getApprovalTimeline = getApprovalTimeline;
const db_1 = __importDefault(require("../config/db"));
const approval_validator_1 = require("../validators/approval.validator");
// GET /api/approvals — list approvals with optional status filter
async function getApprovals(req, res) {
    try {
        const { status } = req.query;
        const user = req.user;
        const where = {};
        if (status)
            where.status = status;
        // Vendors cannot see approvals
        if (user.role === 'VENDOR')
            return res.status(403).json({ message: 'Forbidden' });
        const approvals = await db_1.default.approval.findMany({
            where,
            include: {
                rfq: false, // removed since not in schema
                quotation: { include: { vendor: true, rfq: true } },
                approver: { select: { firstName: true, lastName: true, email: true } },
                timeline: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: approvals });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// POST /api/approvals — officer initiates approval (L1)
async function initiateApproval(req, res) {
    try {
        const data = approval_validator_1.initiateApprovalSchema.parse(req.body);
        const actor = req.user;
        // Create Approval record at L1
        const approval = await db_1.default.approval.create({
            data: {
                quotationId: data.quotationId,
                approverId: data.approverId,
                status: 'PENDING',
                level: 'L1',
                timeline: {
                    create: {
                        level: 'L1',
                        action: 'SUBMITTED',
                        actorId: actor.userId,
                        remarks: 'Approval initiated by procurement officer',
                    },
                },
            },
            include: { timeline: true, quotation: { include: { vendor: true } } },
        });
        // Notify L1 approver (manager)
        await db_1.default.notification.create({
            data: {
                userId: data.approverId,
                type: 'APPROVAL',
                title: 'Approval Required (L1)',
                message: `A quotation from ${approval.quotation.vendor.name} needs your L1 approval.`,
                entityType: 'approval',
                entityId: approval.id,
            },
        });
        return res.status(201).json({ success: true, data: approval });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
// PATCH /api/approvals/:id/approve — manager approves (handles L1 → L2 → final)
async function approveApproval(req, res) {
    try {
        const id = String(req.params.id);
        const { remarks } = approval_validator_1.approveRejectSchema.parse(req.body);
        const actor = req.user;
        const approval = await db_1.default.approval.findUnique({
            where: { id },
            include: { quotation: { include: { vendor: true, rfq: true } } },
        });
        if (!approval)
            return res.status(404).json({ message: 'Approval not found' });
        if (approval.status !== 'PENDING')
            return res.status(400).json({ message: 'Approval is no longer pending' });
        if (approval.level === 'L1') {
            // L1 approved → advance to L2
            const updated = await db_1.default.approval.update({
                where: { id },
                data: {
                    level: 'L2',
                    timeline: {
                        create: {
                            level: 'L1',
                            action: 'L1_APPROVED',
                            actorId: actor.userId,
                            remarks: remarks ?? 'L1 Approved — forwarded to L2',
                        },
                    },
                },
                include: { timeline: true },
            });
            // TODO: notify L2 manager (for now notify same approver as placeholder)
            await db_1.default.notification.create({
                data: {
                    userId: approval.approverId,
                    type: 'APPROVAL',
                    title: 'L2 Approval Required',
                    message: `L1 approved. Final L2 approval needed for ${approval.quotation.rfq.title}.`,
                    entityType: 'approval',
                    entityId: id,
                },
            });
            return res.json({ success: true, message: 'L1 approved — awaiting L2', data: updated });
        }
        // L2 (final) approved → set APPROVED + accept quotation
        const [updated] = await db_1.default.$transaction([
            db_1.default.approval.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    timeline: {
                        create: {
                            level: 'L2',
                            action: 'L2_APPROVED',
                            actorId: actor.userId,
                            remarks: remarks ?? 'Final L2 approval granted',
                        },
                    },
                },
                include: { timeline: true },
            }),
            db_1.default.quotation.update({
                where: { id: approval.quotationId },
                data: { status: 'ACCEPTED' },
            }),
        ]);
        // Notify procurement officer (RFQ creator)
        await db_1.default.notification.create({
            data: {
                userId: approval.quotation.rfq.createdById,
                type: 'APPROVAL',
                title: 'Quotation Fully Approved ✅',
                message: `${approval.quotation.vendor.name}'s quotation has been approved. You can now generate a PO.`,
                entityType: 'approval',
                entityId: id,
            },
        });
        return res.json({ success: true, message: 'Fully approved — PO can now be generated', data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
// PATCH /api/approvals/:id/reject — any level manager rejects (remarks mandatory)
async function rejectApproval(req, res) {
    try {
        const id = String(req.params.id);
        const { remarks } = approval_validator_1.rejectSchema.parse(req.body);
        const actor = req.user;
        const approval = await db_1.default.approval.findUnique({
            where: { id },
            include: { quotation: { include: { vendor: true, rfq: true } } },
        });
        if (!approval)
            return res.status(404).json({ message: 'Approval not found' });
        if (approval.status !== 'PENDING')
            return res.status(400).json({ message: 'Approval is no longer pending' });
        const [updated] = await db_1.default.$transaction([
            db_1.default.approval.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    remarks,
                    timeline: {
                        create: {
                            level: approval.level,
                            action: 'REJECTED',
                            actorId: actor.userId,
                            remarks,
                        },
                    },
                },
                include: { timeline: true },
            }),
            db_1.default.quotation.update({
                where: { id: approval.quotationId },
                data: { status: 'REJECTED' },
            }),
        ]);
        // Notify procurement officer
        await db_1.default.notification.create({
            data: {
                userId: approval.quotation.rfq.createdById,
                type: 'APPROVAL',
                title: 'Quotation Rejected ❌',
                message: `Quotation from ${approval.quotation.vendor.name} was rejected. Reason: ${remarks}`,
                entityType: 'approval',
                entityId: id,
            },
        });
        return res.json({ success: true, message: 'Approval rejected', data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
// GET /api/approvals/:id/timeline — full timeline for an approval
async function getApprovalTimeline(req, res) {
    try {
        const id = String(req.params.id);
        const timeline = await db_1.default.approvalTimeline.findMany({
            where: { approvalId: id },
            orderBy: { createdAt: 'asc' },
        });
        return res.json({ success: true, data: timeline });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
