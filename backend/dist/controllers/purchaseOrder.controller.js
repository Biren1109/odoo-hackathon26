"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPurchaseOrder = createPurchaseOrder;
exports.getPurchaseOrders = getPurchaseOrders;
exports.getPurchaseOrderById = getPurchaseOrderById;
exports.updatePOStatus = updatePOStatus;
const db_1 = __importDefault(require("../config/db"));
const generateNumbers_1 = require("../utils/generateNumbers");
const taxCalculator_1 = require("../utils/taxCalculator");
// POST /api/purchase-orders — create PO from approved quotation
async function createPurchaseOrder(req, res) {
    try {
        const { quotationId } = req.body;
        const actor = req.user;
        // Fetch approved quotation with items and vendor
        const quotation = await db_1.default.quotation.findUnique({
            where: { id: quotationId },
            include: {
                items: { include: { rfqItem: true } },
                vendor: true,
                rfq: true,
            },
        });
        if (!quotation)
            return res.status(404).json({ message: 'Quotation not found' });
        if (quotation.status !== 'ACCEPTED')
            return res.status(400).json({ message: 'Only ACCEPTED quotations can generate a PO' });
        const poNumber = await (0, generateNumbers_1.generatePONumber)();
        const subtotal = quotation.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const { cgstAmount, sgstAmount, totalAmount } = (0, taxCalculator_1.calculateGST)(subtotal);
        const po = await db_1.default.purchaseOrder.create({
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
        await db_1.default.activityLog.create({
            data: {
                entityType: 'purchase_order',
                entityId: po.id,
                action: 'PO_CREATED',
                actorId: actor.userId,
                details: { poNumber, vendorName: quotation.vendor.name },
            },
        });
        // Notify vendor
        await db_1.default.notification.create({
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
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
// GET /api/purchase-orders — list POs
async function getPurchaseOrders(req, res) {
    try {
        const { status, vendorId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (vendorId)
            where.vendorId = vendorId;
        const pos = await db_1.default.purchaseOrder.findMany({
            where,
            include: { vendor: true, items: true },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, data: pos });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// GET /api/purchase-orders/:id — PO detail
async function getPurchaseOrderById(req, res) {
    try {
        const { id } = req.params;
        const po = await db_1.default.purchaseOrder.findUnique({
            where: { id: String(req.params.id) },
            include: { vendor: true, items: true, quotation: { include: { rfq: true } } },
        });
        if (!po)
            return res.status(404).json({ message: 'Purchase order not found' });
        return res.json({ success: true, data: po });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
// PATCH /api/purchase-orders/:id/status — DRAFT → CONFIRMED → DELIVERED
async function updatePOStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['DRAFT', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status))
            return res.status(400).json({ message: 'Invalid status' });
        const updated = await db_1.default.purchaseOrder.update({
            where: { id: String(req.params.id) },
            data: { status },
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
