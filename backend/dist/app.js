"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const vendor_routes_1 = __importDefault(require("./routes/vendor.routes"));
const rfq_routes_1 = __importDefault(require("./routes/rfq.routes"));
const quotation_routes_1 = __importDefault(require("./routes/quotation.routes"));
const approval_routes_1 = __importDefault(require("./routes/approval.routes"));
const purchaseOrder_routes_1 = __importDefault(require("./routes/purchaseOrder.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const activityLog_routes_1 = __importDefault(require("./routes/activityLog.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://vendorbridge.vercel.app'],
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/vendors', vendor_routes_1.default);
app.use('/api/rfqs', rfq_routes_1.default);
app.use('/api/quotations', quotation_routes_1.default);
app.use('/api/approvals', approval_routes_1.default);
app.use('/api/purchase-orders', purchaseOrder_routes_1.default);
app.use('/api/invoices', invoice_routes_1.default);
app.use('/api/activity-logs', activityLog_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use(error_middleware_1.errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
exports.default = app;
