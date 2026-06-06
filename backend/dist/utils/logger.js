"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
exports.createNotification = createNotification;
// ⚠️ WRITE-ONLY — No update or delete function must EVER be added here
const db_1 = __importDefault(require("../config/db"));
async function logActivity(entityType, entityId, action, actorId, details) {
    try {
        await db_1.default.activityLog.create({
            data: {
                entityType,
                entityId,
                action,
                actorId,
                details: details ?? undefined,
            },
        });
    }
    catch (err) {
        // Never let log failure crash the main request
        console.error('[logger] Failed to write activity log:', err);
    }
}
async function createNotification(userId, type, title, message, entityType, entityId) {
    try {
        await db_1.default.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                entityType,
                entityId,
            },
        });
    }
    catch (err) {
        console.error('[logger] Failed to create notification:', err);
    }
}
