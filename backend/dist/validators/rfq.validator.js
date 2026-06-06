"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignVendorsSchema = exports.updateRFQSchema = exports.createRFQSchema = void 0;
const zod_1 = require("zod");
exports.createRFQSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'RFQ title is required'),
    description: zod_1.z.string().optional(),
    deadline: zod_1.z
        .string()
        .refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid deadline date' }),
    items: zod_1.z
        .array(zod_1.z.object({
        productName: zod_1.z.string().min(1, 'Product name is required'),
        description: zod_1.z.string().optional(),
        quantity: zod_1.z.number().positive('Quantity must be positive'),
        unit: zod_1.z.string().min(1, 'Unit is required'),
    }))
        .min(1, 'At least one line item is required'),
});
exports.updateRFQSchema = exports.createRFQSchema.partial();
exports.assignVendorsSchema = zod_1.z.object({
    vendorIds: zod_1.z
        .array(zod_1.z.string().uuid('Invalid vendor ID format'))
        .min(1, 'Select at least one vendor'),
});
