import { z } from 'zod';

export const createQuotationSchema = z.object({
  rfqId: z.string().uuid(),
  vendorId: z.string().uuid(),
  deliveryTimeline: z.string().min(1),
  paymentTerms: z.string().optional(),   // e.g. "30 days net"
  notes: z.string().optional(),
  items: z.array(
    z.object({
      rfqItemId: z.string().uuid(),
      unitPrice: z.number().positive(),
      gstRate: z.number().min(0).max(100).default(18),  // GST % per item
      totalPrice: z.number().positive(),
    })
  ).min(1),
});

export const updateQuotationSchema = z.object({
  deliveryTimeline: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      rfqItemId: z.string().uuid(),
      unitPrice: z.number().positive(),
      gstRate: z.number().min(0).max(100),
      totalPrice: z.number().positive(),
    })
  ).optional(),
});