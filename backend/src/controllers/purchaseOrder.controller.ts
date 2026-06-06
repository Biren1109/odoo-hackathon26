import { Request, Response } from 'express';
import prisma from '../config/db';
import { generatePONumber } from '../utils/generateNumbers';
import { calculateGST } from '../utils/taxCalculator';

// POST /api/purchase-orders — create PO from approved quotation
export async function createPurchaseOrder(req: Request, res: Response) {
  try {
    const { quotationId } = req.body;
    const actor = (req as any).user;

    // Fetch approved quotation with items and vendor
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: { include: { rfqItem: true } },
        vendor: true,
        rfq: true,
      },
    });

    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (quotation.status !== 'ACCEPTED')
      return res.status(400).json({ message: 'Only ACCEPTED quotations can generate a PO' });

    const poNumber = await generatePONumber();
    const subtotal = quotation.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const { cgstAmount, sgstAmount, totalAmount } = calculateGST(subtotal);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        rfqId: quotation.rfqId,
        quotationId,
        vendorId: quotation.vendorId,
        subtotal,
        taxAmount: cgstAmount + sgstAmount,
        grandTotal: totalAmount,
        createdById: actor.userId,
        status: 'DRAFT',
        items: {
          create: quotation.items.map((item) => ({
            productName: item.rfqItem?.description || item.description,
            quantity: item.rfqItem?.quantity || item.quantity || 1,
            unit: item.rfqItem?.unit || 'Nos',
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true, vendor: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'purchase_order',
        entityId: po.id,
        action: 'PO_CREATED',
        actorId: actor.userId,
        details: { poNumber, vendorName: quotation.vendor.name },
      },
    });

    // Notify vendor
    await prisma.notification.create({
      data: {
        userId: actor.userId, // placeholder — replace with vendor user if they have login
        type: 'PURCHASE_ORDER',
        title: `Purchase Order ${poNumber} Created`,
        message: `A new PO has been issued for ${quotation.vendor.name}`,
        entityType: 'purchase_order',
        entityId: po.id,
      },
    });

    return res.status(201).json({ success: true, data: po });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// GET /api/purchase-orders — list POs
export async function getPurchaseOrders(req: Request, res: Response) {
  try {
    const { status, vendorId } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (vendorId) where.vendorId = vendorId as string;

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: { vendor: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: pos });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/purchase-orders/:id — PO detail
export async function getPurchaseOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: String(req.params.id) },
      include: { vendor: true, items: true, quotation: { include: { rfq: true } } },
    });
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });
    return res.json({ success: true, data: po });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PATCH /api/purchase-orders/:id/status — DRAFT → CONFIRMED → DELIVERED
export async function updatePOStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const updated = await prisma.purchaseOrder.update({
      where: { id: String(req.params.id) },
      data: { status },
    });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}