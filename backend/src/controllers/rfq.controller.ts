import { Request, Response } from 'express';
import prisma from '../config/db';
import { logActivity, createNotification } from '../utils/logger';
import { sendRFQInvitationEmail } from '../utils/email';
import { uploadToCloudinary } from '../config/cloudinary';
import {
  createRFQSchema,
  updateRFQSchema,
  assignVendorsSchema,
} from '../validators/rfq.validator';

// ─── GET /api/rfqs ─────────────────────────────────────────────────────────
export async function getRFQs(req: Request, res: Response) {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const user = (req as any).user;

    const where: any = {};

    if (status) where.status = String(status);
    if (search) {
      where.title = { contains: String(search), mode: 'insensitive' };
    }

    // Vendors only see RFQs they are assigned to
    if (user.role === 'VENDOR') {
      const vendorRecord = await prisma.vendor.findFirst({
        where: { email: user.email },
      });
      if (vendorRecord) {
        where.rfqVendors = { some: { vendorId: vendorRecord.id } };
      }
    }

    const [rfqs, total] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          items: true,
          attachments: true,
          rfqVendors: {
            include: { vendor: { select: { id: true, name: true, status: true } } },
          },
          _count: { select: { quotations: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rFQ.count({ where }),
    ]);

    return res.json({ rfqs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('getRFQs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── POST /api/rfqs ────────────────────────────────────────────────────────
// Accepts multipart/form-data with optional 'attachments' files
// Text body can be sent as JSON string in 'data' field OR as individual fields
export async function createRFQ(req: Request, res: Response) {
  try {
    // Parse body — handle both JSON and multipart/form-data
    let bodyData = req.body;
    if (typeof req.body.data === 'string') {
      try {
        bodyData = JSON.parse(req.body.data);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON in data field' });
      }
    }

    // Parse items if sent as JSON string
    if (typeof bodyData.items === 'string') {
      bodyData.items = JSON.parse(bodyData.items);
    }

    const parsed = createRFQSchema.safeParse(bodyData);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const actorId = (req as any).user.userId;
    const files = req.files as Express.Multer.File[] | undefined;

    // Upload files to Cloudinary (if any)
    type AttachmentData = { fileName: string; fileUrl: string; fileType: string };
    let attachmentData: AttachmentData[] = [];

    if (files && files.length > 0) {
      attachmentData = await Promise.all(
        files.map(async (file) => {
          const url = await uploadToCloudinary(
            file.buffer,
            'vendorbridge/rfq-attachments',
            file.originalname
          );
          return {
            fileName: file.originalname,
            fileUrl: url,
            fileType: file.mimetype,
          };
        })
      );
    }

    const rfq = await prisma.$transaction(async (tx) => {
      return tx.rFQ.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          deadline: new Date(parsed.data.deadline),
          createdById: actorId,
          items: {
            create: parsed.data.items.map((item) => ({
              productName: item.productName,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
            })),
          },
          attachments:
            attachmentData.length > 0
              ? { create: attachmentData }
              : undefined,
        },
        include: {
          items: true,
          attachments: true,
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });
    });

    await logActivity('RFQ', rfq.id, 'RFQ_CREATED', actorId, {
      title: rfq.title,
      itemCount: rfq.items.length,
    });

    return res.status(201).json({ message: 'RFQ created successfully', rfq });
  } catch (error) {
    console.error('createRFQ error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── GET /api/rfqs/:id ─────────────────────────────────────────────────────
export async function getRFQById(req: Request, res: Response) {
  try {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        items: true,
        attachments: true,
        rfqVendors: {
          include: {
            vendor: {
              select: { id: true, name: true, email: true, status: true, rating: true },
            },
          },
        },
        _count: { select: { quotations: true } },
      },
    });

    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    return res.json({ rfq });
  } catch (error) {
    console.error('getRFQById error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── PUT /api/rfqs/:id (only DRAFT RFQs can be edited) ────────────────────
export async function updateRFQ(req: Request, res: Response) {
  try {
    const parsed = updateRFQSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const actorId = (req as any).user.userId;

    const existing = await prisma.rFQ.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'RFQ not found' });
    }
    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT RFQs can be edited' });
    }

    const { items, ...rfqFields } = parsed.data;
    const updateData: any = {};

    if (rfqFields.title) updateData.title = rfqFields.title;
    if (rfqFields.description !== undefined) updateData.description = rfqFields.description;
    if (rfqFields.deadline) updateData.deadline = new Date(rfqFields.deadline);

    if (items && items.length > 0) {
      // Delete old items and recreate
      await prisma.rFQItem.deleteMany({ where: { rfqId: req.params.id } });
      updateData.items = {
        create: items.map((item) => ({
          productName: item.productName!,
          description: item.description,
          quantity: item.quantity!,
          unit: item.unit!,
        })),
      };
    }

    const rfq = await prisma.rFQ.update({
      where: { id: req.params.id },
      data: updateData,
      include: { items: true, attachments: true },
    });

    await logActivity('RFQ', rfq.id, 'RFQ_UPDATED', actorId, { title: rfq.title });

    return res.json({ message: 'RFQ updated successfully', rfq });
  } catch (error) {
    console.error('updateRFQ error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── PATCH /api/rfqs/:id/publish (DRAFT → PUBLISHED) ──────────────────────
export async function publishRFQ(req: Request, res: Response) {
  try {
    const actorId = (req as any).user.userId;

    const existing = await prisma.rFQ.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ message: 'RFQ not found' });
    }
    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT RFQs can be published' });
    }
    if (existing.items.length === 0) {
      return res.status(400).json({ message: 'Add at least one item before publishing' });
    }

    const rfq = await prisma.rFQ.update({
      where: { id: req.params.id },
      data: { status: 'PUBLISHED' },
      include: {
        rfqVendors: { include: { vendor: true } },
        items: true,
      },
    });

    await logActivity('RFQ', rfq.id, 'RFQ_PUBLISHED', actorId, {
      title: rfq.title,
      assignedVendors: rfq.rfqVendors.length,
    });

    return res.json({ message: 'RFQ published successfully', rfq });
  } catch (error) {
    console.error('publishRFQ error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── POST /api/rfqs/:id/assign-vendors ────────────────────────────────────
export async function assignVendors(req: Request, res: Response) {
  try {
    const parsed = assignVendorsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const actorId = (req as any).user.userId;
    const rfqId = req.params.id;

    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { items: true },
    });
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    // Only active vendors can be assigned
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: parsed.data.vendorIds }, status: 'ACTIVE' },
    });

    if (vendors.length === 0) {
      return res.status(400).json({
        message: 'No active vendors found. Only ACTIVE vendors can be assigned.',
      });
    }

    // Upsert RFQVendor records (skip duplicates)
    const rfqVendors = await Promise.all(
      vendors.map((vendor) =>
        prisma.rFQVendor.upsert({
          where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } },
          update: {},
          create: { rfqId, vendorId: vendor.id, status: 'INVITED' },
        })
      )
    );

    // Send invitation emails (don't fail the request if email fails)
    const emailResults = await Promise.allSettled(
      vendors.map((vendor) =>
        sendRFQInvitationEmail(vendor.email, vendor.name, rfq.title, rfqId)
      )
    );

    const emailsSent = emailResults.filter((r) => r.status === 'fulfilled').length;
    const emailsFailed = emailResults.filter((r) => r.status === 'rejected').length;

    await logActivity('RFQ', rfqId, 'VENDORS_ASSIGNED', actorId, {
      title: rfq.title,
      vendorCount: vendors.length,
      vendorNames: vendors.map((v) => v.name),
      emailsSent,
      emailsFailed,
    });

    return res.json({
      message: `${vendors.length} vendor(s) assigned. ${emailsSent} invitation email(s) sent.`,
      rfqVendors,
    });
  } catch (error) {
    console.error('assignVendors error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}