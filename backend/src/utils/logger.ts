// ⚠️ WRITE-ONLY — No update or delete function must EVER be added here
import prisma from '../config/db';

export async function logActivity(
  entityType: string,
  entityId: string,
  action: string,
  actorId: string,
  details?: object
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        entityType,
        entityId,
        action,
        actorId,
        details: details ?? undefined,
      },
    });
  } catch (err) {
    // Never let log failure crash the main request
    console.error('[logger] Failed to write activity log:', err);
  }
}

export async function createNotification(
  userId: string,
  type: 'RFQ' | 'QUOTATION' | 'APPROVAL' | 'PURCHASE_ORDER' | 'INVOICE',
  title: string,
  message: string,
  entityType?: string,
  entityId?: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        entityType,
        entityId,
      },
    });
  } catch (err) {
    console.error('[logger] Failed to create notification:', err);
  }
}