"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuotation = submitQuotation;
exports.updateQuotation = updateQuotation;
exports.getQuotationsByRFQ = getQuotationsByRFQ;
exports.getQuotationsByVendor = getQuotationsByVendor;
exports.compareQuotations = compareQuotations;
const db_1 = __importDefault(require("../config/db"));
const quotation_validator_1 = require("../validators/quotation.validator");
// POST /api/quotations — vendor submits quotation
async function submitQuotation(req, res) {
    try {
        const data = quotation_validator_1.createQuotationSchema.parse(req.body);
        // Calculate total amount from items
        const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const quotation = await db_1.default.quotation.create({
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
        await db_1.default.rFQVendor.updateMany({
            where: { rfqId: data.rfqId, vendorId: data.vendorId },
            data: { status: 'RESPONDED' },
        });
        // Notify procurement officer (get RFQ creator)
        const rfq = await db_1.default.rFQ.findUnique({ where: { id: data.rfqId } });
        if (rfq) {
            await db_1.default.notification.create({
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
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
// PUT /api/quotations/:id — vendor edits (only if SUBMITTED status)
async function updateQuotation(req, res) {
    try {
        const id = String(req.params.id);
        const data = quotation_validator_1.updateQuotationSchema.parse(req.body);
        const existing = await db_1.default.quotation.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ message: 'Quotation not found' });
        if (existing.status !== 'SUBMITTED')
            return res.status(400).json({ message: 'Can only edit quotations with SUBMITTED status' });
        const updated = await db_1.default.quotation.update({
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
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
// GET /api/quotations/rfq/:rfqId — all quotations for an RFQ
async function getQuotationsByRFQ(req, res) {
    try {
        const rfqId = String(req.params.rfqId);
        const quotations = await db_1.default.quotation.findMany({
            where: { rfqId },
            include: { vendor: true, items: { include: { rfqItem: true } } },
            orderBy: { submittedAt: 'desc' },
        });
        return res.json({ success: true, data: quotations });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// GET /api/quotations/vendor/:vendorId — vendor views own quotations
async function getQuotationsByVendor(req, res) {
    try {
        const vendorId = String(req.params.vendorId);
        const quotations = await db_1.default.quotation.findMany({
            where: { vendorId },
            include: { rfq: true, items: true },
            orderBy: { submittedAt: 'desc' },
        });
        return res.json({ success: true, data: quotations });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// GET /api/quotations/compare/:rfqId — side-by-side comparison data
async function compareQuotations(req, res) {
    try {
        const rfqId = String(req.params.rfqId);
        const quotations = await db_1.default.quotation.findMany({
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
            isLowest: q.totalAmount === minTotal, // flag lowest price vendor
            items: q.items.map((item) => ({
                rfqItemId: item.rfqItemId,
                description: item.rfqItem?.description || item.description,
                unitPrice: item.unitPrice,
                gstRate: item.gstRate,
                totalPrice: item.totalPrice,
            })),
        }));
        return res.json({ success: true, data: comparison });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
