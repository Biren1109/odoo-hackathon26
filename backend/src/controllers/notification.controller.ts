import { Request, Response } from 'express';
import prisma from '../config/db';

// ─── GET /api/notifications ────────────────────────────────────────────────
// Returns user's own notifications, newest first, with unread count
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return res.json({
      notifications,
      total,
      unreadCount,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────
export async function markNotificationRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;

    // Verify this notification belongs to the requesting user
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    return res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── PATCH /api/notifications/read-all ────────────────────────────────────
export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;

    const { count } = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ message: `${count} notification(s) marked as read` });
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}