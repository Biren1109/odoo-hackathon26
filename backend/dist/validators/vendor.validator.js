"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorStatusSchema = exports.updateVendorSchema = exports.createVendorSchema = void 0;
const zod_1 = require("zod");
exports.createVendorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Vendor name is required'),
    email: zod_1.z.string().email('Invalid email address'),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    gstNumber: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1, 'Category is required'),
    contacts: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'Contact name required'),
        email: zod_1.z.string().email('Invalid contact email'),
        phone: zod_1.z.string().optional(),
        designation: zod_1.z.string().optional(),
    }))
        .optional(),
});
exports.updateVendorSchema = exports.createVendorSchema.partial();
exports.vendorStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'PENDING', 'BLOCKED']),
});
