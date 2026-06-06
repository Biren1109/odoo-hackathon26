"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuotationSchema = exports.createQuotationSchema = void 0;
const zod_1 = require("zod");
exports.createQuotationSchema = zod_1.z.object({
    rfqId: zod_1.z.string().uuid(),
    vendorId: zod_1.z.string().uuid(),
    deliveryTimeline: zod_1.z.string().min(1),
    paymentTerms: zod_1.z.string().optional(), // e.g. "30 days net"
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.object({
        rfqItemId: zod_1.z.string().uuid(),
        unitPrice: zod_1.z.number().positive(),
        gstRate: zod_1.z.number().min(0).max(100).default(18), // GST % per item
        totalPrice: zod_1.z.number().positive(),
    })).min(1),
});
exports.updateQuotationSchema = zod_1.z.object({
    deliveryTimeline: zod_1.z.string().optional(),
    paymentTerms: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.object({
        rfqItemId: zod_1.z.string().uuid(),
        unitPrice: zod_1.z.number().positive(),
        gstRate: zod_1.z.number().min(0).max(100),
        totalPrice: zod_1.z.number().positive(),
    })).optional(),
});
