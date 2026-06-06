"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = getActivityLogs;
exports.getEntityActivityLogs = getEntityActivityLogs;
const db_1 = __importDefault(require("../config/db"));
// ─── GET /api/activity-logs ────────────────────────────────────────────────
// Admin/Manager: all logs, paginated + filterable by entityType
async function getActivityLogs(req, res) {
    try {
        const { entityType, page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        // Filter by entity type tab: rfq | vendor | approval | invoice | quotation
        if (entityType && String(entityType).toLowerCase() !== 'all') {
            where.entityType = String(entityType).toUpperCase();
        }
        const [logs, total] = await Promise.all([
            db_1.default.activityLog.findMany({
                where,
                include: {
                    actor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.activityLog.count({ where }),
        ]);
        return res.json({
            logs,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        });
    }
    catch (error) {
        console.error('getActivityLogs error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
// ─── GET /api/activity-logs/:entityType/:id ────────────────────────────────
// All authenticated users: entity-specific audit trail (e.g. /rfq/abc123)
async function getEntityActivityLogs(req, res) {
    try {
        const { entityType, id } = req.params;
        const { page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            entityType: String(entityType).toUpperCase(),
            entityId: String(id),
        };
        const [logs, total] = await Promise.all([
            db_1.default.activityLog.findMany({
                where,
                include: {
                    actor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.activityLog.count({ where }),
        ]);
        return res.json({
            logs,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        });
    }
    catch (error) {
        console.error('getEntityActivityLogs error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
