"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
exports.getVendorPerformance = getVendorPerformance;
exports.getSpendingSummary = getSpendingSummary;
exports.getMonthlyTrends = getMonthlyTrends;
exports.exportReport = exportReport;
const db_1 = __importDefault(require("../config/db"));
// GET /api/reports/dashboard
async function getDashboard(req, res) {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [activeRFQs, pendingApprovals, posThisMonth, overdueInvoices] = await Promise.all([
            db_1.default.rFQ.count({ where: { status: 'PUBLISHED' } }),
            db_1.default.approval.count({ where: { status: 'PENDING' } }),
            db_1.default.purchaseOrder.aggregate({
                _sum: { grandTotal: true },
                where: { createdAt: { gte: startOfMonth } },
            }),
            db_1.default.invoice.count({
                where: { dueDate: { lt: now }, status: { not: 'PAID' } },
            }),
        ]);
        const recentPOs = await db_1.default.purchaseOrder.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { vendor: { select: { name: true } } },
        });
        const recentInvoices = await db_1.default.invoice.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { vendor: { select: { name: true } } },
        });
        res.json({
            activeRFQs,
            pendingApprovals,
            posThisMonth: posThisMonth._sum.grandTotal || 0,
            overdueInvoices,
            recentPOs,
            recentInvoices,
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch dashboard', error: err });
    }
}
// GET /api/reports/vendor-performance
async function getVendorPerformance(req, res) {
    try {
        const vendors = await db_1.default.vendor.findMany({
            include: {
                rfqVendors: true,
                quotations: true,
            },
        });
        const performance = vendors.map((v) => {
            const rfqsInvited = v.rfqVendors.length;
            const quotesSubmitted = v.quotations.length;
            const quotesAccepted = v.quotations.filter((q) => q.status === 'ACCEPTED').length;
            const avgPrice = quotesSubmitted
                ? v.quotations.reduce((sum, q) => sum + q.totalAmount, 0) / quotesSubmitted
                : 0;
            const avgDelivery = quotesSubmitted
                ? v.quotations.reduce((sum, q) => sum + (parseInt(q.deliveryTimeline || '0') || 0), 0) / quotesSubmitted
                : 0;
            return {
                vendorId: v.id,
                vendorName: v.name,
                rfqsInvited,
                quotesSubmitted,
                quotesAccepted,
                acceptanceRate: rfqsInvited ? ((quotesAccepted / rfqsInvited) * 100).toFixed(1) : '0',
                avgPrice: avgPrice.toFixed(2),
                avgDelivery: avgDelivery.toFixed(0),
                rating: v.rating || 0,
            };
        });
        res.json(performance);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch vendor performance', error: err });
    }
}
// GET /api/reports/spending-summary
async function getSpendingSummary(req, res) {
    try {
        const { from, to } = req.query;
        const dateFilter = from && to
            ? { createdAt: { gte: new Date(from), lte: new Date(to) } }
            : {};
        const totalSpend = await db_1.default.purchaseOrder.aggregate({
            _sum: { grandTotal: true },
            where: { status: { not: 'CANCELLED' }, ...dateFilter },
        });
        const byVendor = await db_1.default.purchaseOrder.groupBy({
            by: ['vendorId'],
            _sum: { grandTotal: true },
            where: { status: { not: 'CANCELLED' }, ...dateFilter },
        });
        const vendorIds = byVendor.map((b) => b.vendorId);
        const vendors = await db_1.default.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true } });
        const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
        const spendByVendor = byVendor.map((b) => ({
            vendorId: b.vendorId,
            vendorName: vendorMap[b.vendorId] || 'Unknown',
            total: b._sum.grandTotal || 0,
        }));
        res.json({
            totalSpend: totalSpend._sum.grandTotal || 0,
            spendByVendor,
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch spending summary', error: err });
    }
}
// GET /api/reports/monthly-trends
async function getMonthlyTrends(req, res) {
    try {
        // Last 6 months
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            months.push({ label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), start: d, end });
        }
        const trends = await Promise.all(months.map(async ({ label, start, end }) => {
            const [rfqs, pos, invoices] = await Promise.all([
                db_1.default.rFQ.count({ where: { createdAt: { gte: start, lte: end } } }),
                db_1.default.purchaseOrder.count({ where: { createdAt: { gte: start, lte: end } } }),
                db_1.default.invoice.count({ where: { createdAt: { gte: start, lte: end } } }),
            ]);
            return { month: label, rfqs, pos, invoices };
        }));
        res.json(trends);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch monthly trends', error: err });
    }
}
// GET /api/reports/export?type=vendor-performance|spending|trends&format=csv
async function exportReport(req, res) {
    try {
        const { type, format } = req.query;
        let data = [];
        let filename = 'report';
        if (type === 'vendor-performance') {
            const vendors = await db_1.default.vendor.findMany({ include: { quotations: true, rfqVendors: true } });
            data = vendors.map((v) => ({
                'Vendor Name': v.name,
                'RFQs Invited': v.rfqVendors.length,
                'Quotes Submitted': v.quotations.length,
                'Quotes Accepted': v.quotations.filter((q) => q.status === 'ACCEPTED').length,
                'Rating': v.rating || 0,
            }));
            filename = 'vendor-performance';
        }
        else if (type === 'spending') {
            const pos = await db_1.default.purchaseOrder.findMany({ include: { vendor: { select: { name: true } } } });
            data = pos.map((p) => ({ 'PO Number': p.poNumber, 'Vendor': p.vendor.name, 'Total': p.grandTotal, 'Status': p.status, 'Date': p.createdAt.toISOString().split('T')[0] }));
            filename = 'spending-summary';
        }
        if (format === 'csv') {
            if (data.length === 0)
                return res.status(404).json({ message: 'No data' });
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map((row) => Object.values(row).join(','));
            const csv = [headers, ...rows].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            return res.send(csv);
        }
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ message: 'Export failed', error: err });
    }
}
