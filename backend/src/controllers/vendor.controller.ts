import { Request, Response } from 'express';
import prisma from '../config/db';
import { logActivity } from '../utils/logger';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorStatusSchema,
} from '../validators/vendor.validator';

// ─── GET /api/vendors ──────────────────────────────────────────────────────
export async function getVendors(req: Request, res: Response) {
  try {
    const { search, category, status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { category: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (category) where.category = { contains: String(category), mode: 'insensitive' };
    if (status) where.status = String(status);

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          contacts: true,
          _count: {
            select: { quotations: true, purchaseOrders: true, rfqVendors: true },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendor.count({ where }),
    ]);

    // Count per status for tabs
    const [activeCount, pendingCount, blockedCount] = await Promise.all([
      prisma.vendor.count({ where: { status: 'ACTIVE' } }),
      prisma.vendor.count({ where: { status: 'PENDING' } }),
      prisma.vendor.count({ where: { status: 'BLOCKED' } }),
    ]);

    return res.json({
      vendors,
      total,
      page: Number(page),
      limit: Number(limit),
      counts: { active: activeCount, pending: pendingCount, blocked: blockedCount },
    });
  } catch (error) {
    console.error('getVendors error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── POST /api/vendors ─────────────────────────────────────────────────────
export async function createVendor(req: Request, res: Response) {
  try {
    const parsed = createVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { contacts, ...vendorData } = parsed.data;
    const actorId = (req as any).user.userId;

    const vendor = await prisma.$transaction(async (tx) => {
      return tx.vendor.create({
        data: {
          ...vendorData,
          contacts: contacts && contacts.length > 0
            ? { create: contacts }
            : undefined,
        },
        include: { contacts: true },
      });
    });

    await logActivity('VENDOR', vendor.id, 'VENDOR_CREATED', actorId, {
      vendorName: vendor.name,
      category: vendor.category,
    });

    return res.status(201).json({ message: 'Vendor created successfully', vendor });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'A vendor with this email or GST number already exists',
      });
    }
    console.error('createVendor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── GET /api/vendors/:id ──────────────────────────────────────────────────
export async function getVendorById(req: Request, res: Response) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: true,
        _count: {
          select: { quotations: true, purchaseOrders: true, rfqVendors: true },
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    return res.json({ vendor });
  } catch (error) {
    console.error('getVendorById error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── PUT /api/vendors/:id ──────────────────────────────────────────────────
export async function updateVendor(req: Request, res: Response) {
  try {
    const parsed = updateVendorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const { contacts, ...vendorData } = parsed.data;
    const actorId = (req as any).user.userId;

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: vendorData,
      include: { contacts: true },
    });

    await logActivity('VENDOR', vendor.id, 'VENDOR_UPDATED', actorId, {
      vendorName: vendor.name,
      updatedFields: Object.keys(vendorData),
    });

    return res.json({ message: 'Vendor updated successfully', vendor });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    console.error('updateVendor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── DELETE /api/vendors/:id (soft delete → set BLOCKED) ───────────────────
export async function deleteVendor(req: Request, res: Response) {
  try {
    const actorId = (req as any).user.userId;

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { status: 'BLOCKED' },
    });

    await logActivity('VENDOR', vendor.id, 'VENDOR_DEACTIVATED', actorId, {
      vendorName: vendor.name,
    });

    return res.json({ message: 'Vendor deactivated successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    console.error('deleteVendor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── PATCH /api/vendors/:id/status ────────────────────────────────────────
export async function updateVendorStatus(req: Request, res: Response) {
  try {
    const parsed = vendorStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const actorId = (req as any).user.userId;

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });

    await logActivity('VENDOR', vendor.id, 'VENDOR_STATUS_CHANGED', actorId, {
      vendorName: vendor.name,
      newStatus: parsed.data.status,
    });

    return res.json({
      message: `Vendor status updated to ${parsed.data.status}`,
      vendor,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    console.error('updateVendorStatus error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}