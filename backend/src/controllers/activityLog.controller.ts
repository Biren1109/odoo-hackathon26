import { Request, Response } from 'express';
import prisma from '../config/db';

// ─── GET /api/activity-logs ────────────────────────────────────────────────
// Admin/Manager: all logs, paginated + filterable by entityType
export async function getActivityLogs(req: Request, res: Response) {
  try {
    const { entityType, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    // Filter by entity type tab: rfq | vendor | approval | invoice | quotation
    if (entityType && String(entityType).toLowerCase() !== 'all') {
      where.entityType = String(entityType).toUpperCase();
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
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
      prisma.activityLog.count({ where }),
    ]);

    return res.json({
      logs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('getActivityLogs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ─── GET /api/activity-logs/:entityType/:id ────────────────────────────────
// All authenticated users: entity-specific audit trail (e.g. /rfq/abc123)
export async function getEntityActivityLogs(req: Request, res: Response) {
  try {
    const { entityType, id } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      entityType: String(entityType).toUpperCase(),
      entityId: String(id),
    };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
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
      prisma.activityLog.count({ where }),
    ]);

    return res.json({
      logs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('getEntityActivityLogs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}