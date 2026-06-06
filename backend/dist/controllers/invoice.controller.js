"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoice = createInvoice;
exports.getInvoices = getInvoices;
exports.getInvoiceById = getInvoiceById;
exports.downloadInvoicePDF = downloadInvoicePDF;
exports.sendInvoiceViaEmail = sendInvoiceViaEmail;
exports.updateInvoiceStatus = updateInvoiceStatus;
const db_1 = __importDefault(require("../config/db"));
const generateNumbers_1 = require("../utils/generateNumbers");
const taxCalculator_1 = require("../utils/taxCalculator");
const pdf_1 = require("../utils/pdf");
const invoiceTemplate_1 = require("../utils/invoiceTemplate");
const email_1 = require("../utils/email");
// POST /api/invoices — generate invoice from PO
async function createInvoice(req, res) {
    try {
        const { poId, dueDate } = req.body;
        const actor = req.user;
        const po = await db_1.default.purchaseOrder.findUnique({
            where: { id: poId },
            include: { items: true, vendor: true },
        });
        if (!po)
            return res.status(404).json({ message: 'Purchase order not found' });
        const invoiceNumber = await (0, generateNumbers_1.generateInvoiceNumber)();
        const subtotal = po.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const { cgstAmount, sgstAmount, totalAmount } = (0, taxCalculator_1.calculateGST)(subtotal);
        const invoice = await db_1.default.invoice.create({
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
        await db_1.default.activityLog.create({
            data: {
                entityType: 'invoice',
                entityId: invoice.id,
                action: 'INVOICE_CREATED',
                actorId: actor.userId,
                details: { invoiceNumber, vendorName: po.vendor.name },
            },
        });
        return res.status(201).json({ success: true, data: invoice });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
// GET /api/invoices — list invoices
async function getInvoices(req, res) {
    try {
        const { status, vendorId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (vendorId)
            where.vendorId = vendorId;
        const invoices = await db_1.default.invoice.findMany({
            where,
            include: { vendor: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: invoices });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// GET /api/invoices/:id — invoice detail
async function getInvoiceById(req, res) {
    try {
        const id = String(req.params.id);
        const invoice = await db_1.default.invoice.findUnique({
            where: { id },
            include: { vendor: true, items: true, po: true },
        });
        if (!invoice)
            return res.status(404).json({ message: 'Invoice not found' });
        return res.json({ success: true, data: invoice });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// GET /api/invoices/:id/pdf — generate and stream PDF
async function downloadInvoicePDF(req, res) {
    try {
        const id = String(req.params.id);
        const invoice = await db_1.default.invoice.findUnique({
            where: { id },
            include: { vendor: true, items: true },
        });
        if (!invoice)
            return res.status(404).json({ message: 'Invoice not found' });
        const html = (0, invoiceTemplate_1.generateInvoiceHTML)({
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
        const pdfBuffer = await (0, pdf_1.generateInvoicePDF)(html);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        return res.send(pdfBuffer);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// POST /api/invoices/:id/send-email — generate PDF and email it to vendor
async function sendInvoiceViaEmail(req, res) {
    try {
        const id = String(req.params.id);
        const actor = req.user;
        const invoice = await db_1.default.invoice.findUnique({
            where: { id },
            include: { vendor: true, items: true },
        });
        if (!invoice)
            return res.status(404).json({ message: 'Invoice not found' });
        const html = (0, invoiceTemplate_1.generateInvoiceHTML)({
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
        const pdfBuffer = await (0, pdf_1.generateInvoicePDF)(html);
        await (0, email_1.sendInvoiceEmail)(invoice.vendor.email, invoice.invoiceNumber, pdfBuffer);
        // Update status to ISSUED after sending
        await db_1.default.invoice.update({
            where: { id },
            data: { status: 'ISSUED' },
        });
        // Log activity
        await db_1.default.activityLog.create({
            data: {
                entityType: 'invoice',
                entityId: id,
                action: 'INVOICE_EMAILED',
                actorId: actor.userId,
                details: { invoiceNumber: invoice.invoiceNumber, sentTo: invoice.vendor.email },
            },
        });
        return res.json({ success: true, message: `Invoice emailed to ${invoice.vendor.email}` });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// PATCH /api/invoices/:id/status — DRAFT → ISSUED → PAID
async function updateInvoiceStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED'];
        if (!validStatuses.includes(status))
            return res.status(400).json({ message: 'Invalid status' });
        const updated = await db_1.default.invoice.update({
            where: { id: String(req.params.id) },
            data: { status },
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
