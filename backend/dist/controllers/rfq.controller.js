"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRFQs = getRFQs;
exports.createRFQ = createRFQ;
exports.getRFQById = getRFQById;
exports.updateRFQ = updateRFQ;
exports.publishRFQ = publishRFQ;
exports.assignVendors = assignVendors;
const db_1 = __importDefault(require("../config/db"));
const logger_1 = require("../utils/logger");
const email_1 = require("../utils/email");
const cloudinary_1 = require("../config/cloudinary");
const rfq_validator_1 = require("../validators/rfq.validator");
// ─── GET /api/rfqs ─────────────────────────────────────────────────────────
async function getRFQs(req, res) {
    try {
        const { status, search, page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const user = req.user;
        const where = {};
        if (status)
            where.status = String(status);
        if (search) {
            where.title = { contains: String(search), mode: 'insensitive' };
        }
        // Vendors only see RFQs they are assigned to
        if (user.role === 'VENDOR') {
            const vendorRecord = await db_1.default.vendor.findFirst({
                where: { email: user.email },
            });
            if (vendorRecord) {
                where.rfqVendors = { some: { vendorId: vendorRecord.id } };
            }
        }
        const [rfqs, total] = await Promise.all([
            db_1.default.rFQ.findMany({
                where,
                include: {
                    createdBy: { select: { firstName: true, lastName: true } },
                    items: true,
                    vendors: {
                        include: { vendor: { select: { id: true, name: true, status: true } } },
                    },
                    _count: { select: { quotations: true } },
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.rFQ.count({ where }),
        ]);
        return res.json({ rfqs, total, page: Number(page), limit: Number(limit) });
    }
    catch (error) {
        console.error('getRFQs error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── POST /api/rfqs ────────────────────────────────────────────────────────
// Accepts multipart/form-data with optional 'attachments' files
// Text body can be sent as JSON string in 'data' field OR as individual fields
async function createRFQ(req, res) {
    try {
        // Parse body — handle both JSON and multipart/form-data
        let bodyData = req.body;
        if (typeof req.body.data === 'string') {
            try {
                bodyData = JSON.parse(req.body.data);
            }
            catch {
                return res.status(400).json({ message: 'Invalid JSON in data field' });
            }
        }
        // Parse items if sent as JSON string
        if (typeof bodyData.items === 'string') {
            bodyData.items = JSON.parse(bodyData.items);
        }
        const parsed = rfq_validator_1.createRFQSchema.safeParse(bodyData);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }
        const actorId = req.user.userId;
        const files = req.files;
        let attachmentData = [];
        if (files && files.length > 0) {
            attachmentData = await Promise.all(files.map(async (file) => {
                const url = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, 'vendorbridge/rfq-attachments', file.originalname);
                return {
                    fileName: file.originalname,
                    fileUrl: url,
                    fileType: file.mimetype,
                };
            }));
        }
        const rfq = await db_1.default.$transaction(async (tx) => {
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
                },
                include: {
                    items: true,
                    createdBy: { select: { firstName: true, lastName: true } },
                },
            });
        });
        await (0, logger_1.logActivity)('RFQ', rfq.id, 'RFQ_CREATED', actorId, {
            title: rfq.title,
            itemCount: rfq.items.length,
        });
        return res.status(201).json({ message: 'RFQ created successfully', rfq });
    }
    catch (error) {
        console.error('createRFQ error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── GET /api/rfqs/:id ─────────────────────────────────────────────────────
async function getRFQById(req, res) {
    try {
        const rfq = await db_1.default.rFQ.findUnique({
            where: { id: String(req.params.id) },
            include: {
                createdBy: { select: { firstName: true, lastName: true, email: true } },
                items: true,
                vendors: {
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
    }
    catch (error) {
        console.error('getRFQById error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── PUT /api/rfqs/:id (only DRAFT RFQs can be edited) ────────────────────
async function updateRFQ(req, res) {
    try {
        const parsed = rfq_validator_1.updateRFQSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }
        const actorId = req.user.userId;
        const existing = await db_1.default.rFQ.findUnique({ where: { id: String(req.params.id) } });
        if (!existing) {
            return res.status(404).json({ message: 'RFQ not found' });
        }
        if (existing.status !== 'DRAFT') {
            return res.status(400).json({ message: 'Only DRAFT RFQs can be edited' });
        }
        const { items, ...rfqFields } = parsed.data;
        const updateData = {};
        if (rfqFields.title)
            updateData.title = rfqFields.title;
        if (rfqFields.description !== undefined)
            updateData.description = rfqFields.description;
        if (rfqFields.deadline)
            updateData.deadline = new Date(rfqFields.deadline);
        if (items && items.length > 0) {
            // Delete old items and recreate
            await db_1.default.rFQItem.deleteMany({ where: { rfqId: String(req.params.id) } });
            updateData.items = {
                create: items.map((item) => ({
                    productName: item.productName,
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                })),
            };
        }
        const rfq = await db_1.default.rFQ.update({
            where: { id: String(req.params.id) },
            data: updateData,
            include: { items: true },
        });
        await (0, logger_1.logActivity)('RFQ', rfq.id, 'RFQ_UPDATED', actorId, { title: rfq.title });
        return res.json({ message: 'RFQ updated successfully', rfq });
    }
    catch (error) {
        console.error('updateRFQ error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── PATCH /api/rfqs/:id/publish (DRAFT → PUBLISHED) ──────────────────────
async function publishRFQ(req, res) {
    try {
        const actorId = req.user.userId;
        const existing = await db_1.default.rFQ.findUnique({
            where: { id: String(req.params.id) },
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
        const rfq = await db_1.default.rFQ.update({
            where: { id: String(req.params.id) },
            data: { status: 'PUBLISHED' },
            include: {
                vendors: { include: { vendor: true } },
                items: true,
            },
        });
        await (0, logger_1.logActivity)('RFQ', rfq.id, 'RFQ_PUBLISHED', actorId, {
            title: rfq.title,
            assignedVendors: rfq.vendors.length,
        });
        return res.json({ message: 'RFQ published successfully', rfq });
    }
    catch (error) {
        console.error('publishRFQ error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── POST /api/rfqs/:id/assign-vendors ────────────────────────────────────
async function assignVendors(req, res) {
    try {
        const parsed = rfq_validator_1.assignVendorsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }
        const actorId = req.user.userId;
        const rfqId = String(req.params.id);
        const rfq = await db_1.default.rFQ.findUnique({
            where: { id: rfqId },
            include: { items: true },
        });
        if (!rfq) {
            return res.status(404).json({ message: 'RFQ not found' });
        }
        // Only active vendors can be assigned
        const vendors = await db_1.default.vendor.findMany({
            where: { id: { in: parsed.data.vendorIds }, status: 'ACTIVE' },
        });
        if (vendors.length === 0) {
            return res.status(400).json({
                message: 'No active vendors found. Only ACTIVE vendors can be assigned.',
            });
        }
        // Upsert RFQVendor records (skip duplicates)
        const rfqVendors = await Promise.all(vendors.map((vendor) => db_1.default.rFQVendor.upsert({
            where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } },
            update: {},
            create: { rfqId, vendorId: vendor.id, status: 'INVITED' },
        })));
        // Send invitation emails (don't fail the request if email fails)
        const emailResults = await Promise.allSettled(vendors.map((vendor) => (0, email_1.sendRFQInvitationEmail)(vendor.email, vendor.name, rfq.title, rfqId)));
        const emailsSent = emailResults.filter((r) => r.status === 'fulfilled').length;
        const emailsFailed = emailResults.filter((r) => r.status === 'rejected').length;
        await (0, logger_1.logActivity)('RFQ', rfqId, 'VENDORS_ASSIGNED', actorId, {
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
    }
    catch (error) {
        console.error('assignVendors error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
