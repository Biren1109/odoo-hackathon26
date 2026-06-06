"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendors = getVendors;
exports.createVendor = createVendor;
exports.getVendorById = getVendorById;
exports.updateVendor = updateVendor;
exports.deleteVendor = deleteVendor;
exports.updateVendorStatus = updateVendorStatus;
const db_1 = __importDefault(require("../config/db"));
const logger_1 = require("../utils/logger");
const vendor_validator_1 = require("../validators/vendor.validator");
// ─── GET /api/vendors ──────────────────────────────────────────────────────
async function getVendors(req, res) {
    try {
        const { search, category, status, page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { category: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        if (category)
            where.category = { contains: String(category), mode: 'insensitive' };
        if (status)
            where.status = String(status);
        const [vendors, total] = await Promise.all([
            db_1.default.vendor.findMany({
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
            db_1.default.vendor.count({ where }),
        ]);
        // Count per status for tabs
        const [activeCount, pendingCount, blockedCount] = await Promise.all([
            db_1.default.vendor.count({ where: { status: 'ACTIVE' } }),
            db_1.default.vendor.count({ where: { status: 'PENDING' } }),
            db_1.default.vendor.count({ where: { status: 'BLOCKED' } }),
        ]);
        return res.json({
            vendors,
            total,
            page: Number(page),
            limit: Number(limit),
            counts: { active: activeCount, pending: pendingCount, blocked: blockedCount },
        });
    }
    catch (error) {
        console.error('getVendors error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── POST /api/vendors ─────────────────────────────────────────────────────
async function createVendor(req, res) {
    try {
        const parsed = vendor_validator_1.createVendorSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }
        const { contacts, ...vendorData } = parsed.data;
        const actorId = req.user.userId;
        const vendor = await db_1.default.$transaction(async (tx) => {
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
        await (0, logger_1.logActivity)('VENDOR', vendor.id, 'VENDOR_CREATED', actorId, {
            vendorName: vendor.name,
            category: vendor.category,
        });
        return res.status(201).json({ message: 'Vendor created successfully', vendor });
    }
    catch (error) {
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
async function getVendorById(req, res) {
    try {
        const vendor = await db_1.default.vendor.findUnique({
            where: { id: String(req.params.id) },
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
    }
    catch (error) {
        console.error('getVendorById error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── PUT /api/vendors/:id ──────────────────────────────────────────────────
async function updateVendor(req, res) {
    try {
        const parsed = vendor_validator_1.updateVendorSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }
        const { contacts, ...vendorData } = parsed.data;
        const actorId = req.user.userId;
        const vendor = await db_1.default.vendor.update({
            where: { id: String(req.params.id) },
            data: vendorData,
            include: { contacts: true },
        });
        await (0, logger_1.logActivity)('VENDOR', vendor.id, 'VENDOR_UPDATED', actorId, {
            vendorName: vendor.name,
            updatedFields: Object.keys(vendorData),
        });
        return res.json({ message: 'Vendor updated successfully', vendor });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        console.error('updateVendor error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── DELETE /api/vendors/:id (soft delete → set BLOCKED) ───────────────────
async function deleteVendor(req, res) {
    try {
        const actorId = req.user.userId;
        const vendor = await db_1.default.vendor.update({
            where: { id: String(req.params.id) },
            data: { status: 'BLOCKED' },
        });
        await (0, logger_1.logActivity)('VENDOR', vendor.id, 'VENDOR_DEACTIVATED', actorId, {
            vendorName: vendor.name,
        });
        return res.json({ message: 'Vendor deactivated successfully' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        console.error('deleteVendor error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── PATCH /api/vendors/:id/status ────────────────────────────────────────
async function updateVendorStatus(req, res) {
    try {
        const parsed = vendor_validator_1.vendorStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }
        const actorId = req.user.userId;
        const vendor = await db_1.default.vendor.update({
            where: { id: String(req.params.id) },
            data: { status: parsed.data.status },
        });
        await (0, logger_1.logActivity)('VENDOR', vendor.id, 'VENDOR_STATUS_CHANGED', actorId, {
            vendorName: vendor.name,
            newStatus: parsed.data.status,
        });
        return res.json({
            message: `Vendor status updated to ${parsed.data.status}`,
            vendor,
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        console.error('updateVendorStatus error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
