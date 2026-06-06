import { Request, Response } from 'express';
import prisma from '../config/db';
import { initiateApprovalSchema, approveRejectSchema, rejectSchema } from '../validators/approval.validator';

// GET /api/approvals — list approvals with optional status filter
export async function getApprovals(req: Request, res: Response) {
  try {
    const { status } = req.query;
    const user = (req as any).user;

    const where: any = {};
    if (status) where.status = status as string;

    // Vendors cannot see approvals
    if (user.role === 'VENDOR')
      return res.status(403).json({ message: 'Forbidden' });

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        rfq: true,
        quotation: { include: { vendor: true } },
        approver: { select: { firstName: true, lastName: true, email: true } },
        timeline: { orderBy: { timestamp: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: approvals });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/approvals — officer initiates approval (L1)
export async function initiateApproval(req: Request, res: Response) {
  try {
    const data = initiateApprovalSchema.parse(req.body);
    const actor = (req as any).user;

    // Create Approval record at L1
    const approval = await prisma.approval.create({
      data: {
        rfqId: data.rfqId,
        quotationId: data.quotationId,
        approverId: data.approverId,
        status: 'PENDING',
        currentLevel: 'L1',
        totalLevels: 2,
        timeline: {
          create: {
            level: 'L1',
            action: 'SUBMITTED',
            actorName: actor.userId,   // replace with actual name in final
            remarks: 'Approval initiated by procurement officer',
          },
        },
      },
      include: { timeline: true, quotation: { include: { vendor: true } } },
    });

    // Notify L1 approver (manager)
    await prisma.notification.create({
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
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// PATCH /api/approvals/:id/approve — manager approves (handles L1 → L2 → final)
export async function approveApproval(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { remarks } = approveRejectSchema.parse(req.body);
    const actor = (req as any).user;

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: { quotation: { include: { vendor: true } }, rfq: true },
    });
    if (!approval) return res.status(404).json({ message: 'Approval not found' });
    if (approval.status !== 'PENDING')
      return res.status(400).json({ message: 'Approval is no longer pending' });

    if (approval.currentLevel === 'L1' && approval.totalLevels === 2) {
      // L1 approved → advance to L2
      const updated = await prisma.approval.update({
        where: { id },
        data: {
          currentLevel: 'L2',
          timeline: {
            create: {
              level: 'L1',
              action: 'L1_APPROVED',
              actorName: actor.userId,
              remarks: remarks ?? 'L1 Approved — forwarded to L2',
            },
          },
        },
        include: { timeline: true },
      });

      // TODO: notify L2 manager (for now notify same approver as placeholder)
      await prisma.notification.create({
        data: {
          userId: approval.approverId,
          type: 'APPROVAL',
          title: 'L2 Approval Required',
          message: `L1 approved. Final L2 approval needed for ${approval.rfq.title}.`,
          entityType: 'approval',
          entityId: id,
        },
      });

      return res.json({ success: true, message: 'L1 approved — awaiting L2', data: updated });
    }

    // L2 (final) approved → set APPROVED + accept quotation
    const [updated] = await prisma.$transaction([
      prisma.approval.update({
        where: { id },
        data: {
          status: 'APPROVED',
          timeline: {
            create: {
              level: 'L2',
              action: 'L2_APPROVED',
              actorName: actor.userId,
              remarks: remarks ?? 'Final L2 approval granted',
            },
          },
        },
        include: { timeline: true },
      }),
      prisma.quotation.update({
        where: { id: approval.quotationId },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    // Notify procurement officer (RFQ creator)
    await prisma.notification.create({
      data: {
        userId: approval.rfq.createdById,
        type: 'APPROVAL',
        title: 'Quotation Fully Approved ✅',
        message: `${approval.quotation.vendor.name}'s quotation has been approved. You can now generate a PO.`,
        entityType: 'approval',
        entityId: id,
      },
    });

    return res.json({ success: true, message: 'Fully approved — PO can now be generated', data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// PATCH /api/approvals/:id/reject — any level manager rejects (remarks mandatory)
export async function rejectApproval(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { remarks } = rejectSchema.parse(req.body);
    const actor = (req as any).user;

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: { quotation: { include: { vendor: true } }, rfq: true },
    });
    if (!approval) return res.status(404).json({ message: 'Approval not found' });
    if (approval.status !== 'PENDING')
      return res.status(400).json({ message: 'Approval is no longer pending' });

    const [updated] = await prisma.$transaction([
      prisma.approval.update({
        where: { id },
        data: {
          status: 'REJECTED',
          remarks,
          timeline: {
            create: {
              level: approval.currentLevel,
              action: 'REJECTED',
              actorName: actor.userId,
              remarks,
            },
          },
        },
        include: { timeline: true },
      }),
      prisma.quotation.update({
        where: { id: approval.quotationId },
        data: { status: 'REJECTED' },
      }),
    ]);

    // Notify procurement officer
    await prisma.notification.create({
      data: {
        userId: approval.rfq.createdById,
        type: 'APPROVAL',
        title: 'Quotation Rejected ❌',
        message: `Quotation from ${approval.quotation.vendor.name} was rejected. Reason: ${remarks}`,
        entityType: 'approval',
        entityId: id,
      },
    });

    return res.json({ success: true, message: 'Approval rejected', data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// GET /api/approvals/:id/timeline — full timeline for an approval
export async function getApprovalTimeline(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const timeline = await prisma.approvalTimeline.findMany({
      where: { approvalId: id },
      orderBy: { timestamp: 'asc' },
    });
    return res.json({ success: true, data: timeline });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}