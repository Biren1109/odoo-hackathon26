import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1, 'Contact name required'),
        email: z.string().email('Invalid contact email'),
        phone: z.string().optional(),
        designation: z.string().optional(),
      })
    )
    .optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'BLOCKED']),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorStatusInput = z.infer<typeof vendorStatusSchema>;