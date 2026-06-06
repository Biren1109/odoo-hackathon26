import prisma from '../config/db';

export async function generatePONumber(): Promise<string> {
  const count = await prisma.purchaseOrder.count();
  const year = new Date().getFullYear();
  return `PO-${year}-${String(count + 1).padStart(5, '0')}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
}