import { z } from 'zod';

export const createRFQSchema = z.object({
  title: z.string().min(1, 'RFQ title is required'),
  description: z.string().optional(),
  deadline: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid deadline date' }),
  items: z
    .array(
      z.object({
        productName: z.string().min(1, 'Product name is required'),
        description: z.string().optional(),
        quantity: z.number().positive('Quantity must be positive'),
        unit: z.string().min(1, 'Unit is required'),
      })
    )
    .min(1, 'At least one line item is required'),
});

export const updateRFQSchema = createRFQSchema.partial();

export const assignVendorsSchema = z.object({
  vendorIds: z
    .array(z.string().uuid('Invalid vendor ID format'))
    .min(1, 'Select at least one vendor'),
});

export type CreateRFQInput = z.infer<typeof createRFQSchema>;
export type UpdateRFQInput = z.infer<typeof updateRFQSchema>;
export type AssignVendorsInput = z.infer<typeof assignVendorsSchema>;