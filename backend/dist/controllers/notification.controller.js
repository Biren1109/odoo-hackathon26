"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
const db_1 = __importDefault(require("../config/db"));
// ─── GET /api/notifications ────────────────────────────────────────────────
// Returns user's own notifications, newest first, with unread count
async function getNotifications(req, res) {
    try {
        const userId = req.user.userId;
        const { page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [notifications, total, unreadCount] = await Promise.all([
            db_1.default.notification.findMany({
                where: { userId },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.notification.count({ where: { userId } }),
            db_1.default.notification.count({ where: { userId, isRead: false } }),
        ]);
        return res.json({
            notifications,
            total,
            unreadCount,
            page: Number(page),
            limit: Number(limit),
        });
    }
    catch (error) {
        console.error('getNotifications error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── PATCH /api/notifications/:id/read ────────────────────────────────────
async function markNotificationRead(req, res) {
    try {
        const userId = req.user.userId;
        // Verify this notification belongs to the requesting user
        const existing = await db_1.default.notification.findFirst({
            where: { id: String(req.params.id), userId },
        });
        if (!existing) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        const notification = await db_1.default.notification.update({
            where: { id: String(req.params.id) },
            data: { isRead: true },
        });
        return res.json({ message: 'Notification marked as read', notification });
    }
    catch (error) {
        console.error('markNotificationRead error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── PATCH /api/notifications/read-all ────────────────────────────────────
async function markAllNotificationsRead(req, res) {
    try {
        const userId = req.user.userId;
        const { count } = await db_1.default.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return res.json({ message: `${count} notification(s) marked as read` });
    }
    catch (error) {
        console.error('markAllNotificationsRead error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
