import { Request, Response } from 'express';
import prisma from '../config/db';
import { createQuotationSchema, updateQuotationSchema } from '../validators/quotation.validator';

// POST /api/quotations — vendor submits quotation
export async function submitQuotation(req: Request, res: Response) {
  try {
    const data = createQuotationSchema.parse(req.body);

    // Calculate total amount from items
    const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);

    const quotation = await prisma.quotation.create({
      data: {
        rfqId: data.rfqId,
        vendorId: data.vendorId,
        totalAmount,
        deliveryTimeline: data.deliveryTimeline,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            rfqItemId: item.rfqItemId,
            unitPrice: item.unitPrice,
            gstRate: item.gstRate,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true, vendor: true, rfq: true },
    });

    // Update RFQVendor status to RESPONDED
    await prisma.rFQVendor.updateMany({
      where: { rfqId: data.rfqId, vendorId: data.vendorId },
      data: { status: 'RESPONDED' },
    });

    // Notify procurement officer (get RFQ creator)
    const rfq = await prisma.rFQ.findUnique({ where: { id: data.rfqId } });
    if (rfq) {
      await prisma.notification.create({
        data: {
          userId: rfq.createdById,
          type: 'QUOTATION',
          title: 'New Quotation Received',
          message: `${quotation.vendor.name} submitted a quotation for ${rfq.title}`,
          entityType: 'quotation',
          entityId: quotation.id,
        },
      });
    }

    return res.status(201).json({ success: true, data: quotation });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// PUT /api/quotations/:id — vendor edits (only if SUBMITTED status)
export async function updateQuotation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateQuotationSchema.parse(req.body);

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });
    if (existing.status !== 'SUBMITTED')
      return res.status(400).json({ message: 'Can only edit quotations with SUBMITTED status' });

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        deliveryTimeline: data.deliveryTimeline,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        ...(data.items && {
          items: {
            deleteMany: {},
            create: data.items.map((item) => ({
              rfqItemId: item.rfqItemId,
              unitPrice: item.unitPrice,
              gstRate: item.gstRate,
              totalPrice: item.totalPrice,
            })),
          },
          totalAmount: data.items.reduce((s, i) => s + i.totalPrice, 0),
        }),
      },
      include: { items: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// GET /api/quotations/rfq/:rfqId — all quotations for an RFQ
export async function getQuotationsByRFQ(req: Request, res: Response) {
  try {
    const { rfqId } = req.params;
    const quotations = await prisma.quotation.findMany({
      where: { rfqId },
      include: { vendor: true, items: { include: { rfqItem: true } } },
      orderBy: { submittedAt: 'desc' },
    });
    return res.json({ success: true, data: quotations });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/quotations/vendor/:vendorId — vendor views own quotations
export async function getQuotationsByVendor(req: Request, res: Response) {
  try {
    const { vendorId } = req.params;
    const quotations = await prisma.quotation.findMany({
      where: { vendorId },
      include: { rfq: true, items: true },
      orderBy: { submittedAt: 'desc' },
    });
    return res.json({ success: true, data: quotations });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/quotations/compare/:rfqId — side-by-side comparison data
export async function compareQuotations(req: Request, res: Response) {
  try {
    const { rfqId } = req.params;

    const quotations = await prisma.quotation.findMany({
      where: { rfqId },
      include: {
        vendor: true,
        items: { include: { rfqItem: true } },
      },
    });

    if (!quotations.length)
      return res.status(404).json({ message: 'No quotations found for this RFQ' });

    // Find the lowest totalAmount and flag it
    const minTotal = Math.min(...quotations.map((q) => q.totalAmount));

    const comparison = quotations.map((q) => ({
      quotationId: q.id,
      vendorId: q.vendorId,
      vendorName: q.vendor.name,
      vendorRating: q.vendor.rating,
      deliveryTimeline: q.deliveryTimeline,
      paymentTerms: q.paymentTerms,
      totalAmount: q.totalAmount,
      isLowest: q.totalAmount === minTotal,   // flag lowest price vendor
      items: q.items.map((item) => ({
        rfqItemId: item.rfqItemId,
        productName: item.rfqItem.productName,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
        totalPrice: item.totalPrice,
      })),
    }));

    return res.json({ success: true, data: comparison });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}