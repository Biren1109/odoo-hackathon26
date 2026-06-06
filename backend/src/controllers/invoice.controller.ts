import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateInvoiceNumber } from '../utils/generateNumbers';
import { calculateGST } from '../utils/taxCalculator';
import { generateInvoicePDF } from '../utils/pdf';
import { generateInvoiceHTML } from '../utils/invoiceTemplate';
import { sendInvoiceEmail } from '../utils/email';

// POST /api/invoices — generate invoice from PO
export async function createInvoice(req: Request, res: Response) {
  try {
    const { poId, dueDate } = req.body;
    const actor = (req as any).user;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true, vendor: true },
    });
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });

    const invoiceNumber = await generateInvoiceNumber();
    const subtotal = po.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const { cgstAmount, sgstAmount, totalAmount } = calculateGST(subtotal);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        poId,
        vendorId: po.vendorId,
        status: 'DRAFT',
        subtotal,
        cgstRate: 9,
        cgstAmount,
        sgstRate: 9,
        sgstAmount,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdById: actor.userId,
        items: {
          create: po.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
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
        entityType: 'invoice',
        entityId: invoice.id,
        action: 'INVOICE_CREATED',
        actorId: actor.userId,
        details: { invoiceNumber, vendorName: po.vendor.name },
      },
    });

    return res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

// GET /api/invoices — list invoices
export async function getInvoices(req: Request, res: Response) {
  try {
    const { status, vendorId } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (vendorId) where.vendorId = vendorId as string;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: invoices });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/invoices/:id — invoice detail
export async function getInvoiceById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { vendor: true, items: true, po: true },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    return res.json({ success: true, data: invoice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/invoices/:id/pdf — generate and stream PDF
export async function downloadInvoicePDF(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { vendor: true, items: true },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const html = generateInvoiceHTML({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.issuedDate.toLocaleDateString('en-IN'),
      dueDate: invoice.dueDate?.toLocaleDateString('en-IN'),
      vendorName: invoice.vendor.name,
      vendorGST: invoice.vendor.gstNumber ?? undefined,
      items: invoice.items,
      subtotal: invoice.subtotal,
      cgstRate: invoice.cgstRate,
      cgstAmount: invoice.cgstAmount,
      sgstRate: invoice.sgstRate,
      sgstAmount: invoice.sgstAmount,
      totalAmount: invoice.totalAmount,
    });

    const pdfBuffer = await generateInvoicePDF(html);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/invoices/:id/send-email — generate PDF and email it to vendor
export async function sendInvoiceViaEmail(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const actor = (req as any).user;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { vendor: true, items: true },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const html = generateInvoiceHTML({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.issuedDate.toLocaleDateString('en-IN'),
      dueDate: invoice.dueDate?.toLocaleDateString('en-IN'),
      vendorName: invoice.vendor.name,
      vendorGST: invoice.vendor.gstNumber ?? undefined,
      items: invoice.items,
      subtotal: invoice.subtotal,
      cgstRate: invoice.cgstRate,
      cgstAmount: invoice.cgstAmount,
      sgstRate: invoice.sgstRate,
      sgstAmount: invoice.sgstAmount,
      totalAmount: invoice.totalAmount,
    });

    const pdfBuffer = await generateInvoicePDF(html);
    await sendInvoiceEmail(invoice.vendor.email, invoice.invoiceNumber, pdfBuffer);

    // Update status to ISSUED after sending
    await prisma.invoice.update({
      where: { id },
      data: { status: 'ISSUED' },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'invoice',
        entityId: id,
        action: 'INVOICE_EMAILED',
        actorId: actor.userId,
        details: { invoiceNumber: invoice.invoiceNumber, sentTo: invoice.vendor.email },
      },
    });

    return res.json({ success: true, message: `Invoice emailed to ${invoice.vendor.email}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// PATCH /api/invoices/:id/status — DRAFT → ISSUED → PAID
export async function updateInvoiceStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const updated = await prisma.invoice.update({
      where: { id: String(req.params.id) },
      data: { status },
    });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}