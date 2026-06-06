import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

<<<<<<< HEAD
=======
// These routes will be added by P2 and P3 — placeholder imports
>>>>>>> c20cc5ea97db90acb5a0d849c40fa48c46dff8e8
import vendorRoutes from './routes/vendor.routes';
import rfqRoutes from './routes/rfq.routes';
import quotationRoutes from './routes/quotation.routes';
import approvalRoutes from './routes/approval.routes';
import purchaseOrderRoutes from './routes/purchaseOrder.routes';
import invoiceRoutes from './routes/invoice.routes';
import activityLogRoutes from './routes/activityLog.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://vendorbridge.vercel.app'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
<<<<<<< HEAD
app.use('/api/vendors', vendorRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
=======
app.use('/api/vendors', vendorRoutes);       // P2
app.use('/api/rfqs', rfqRoutes);             // P2
app.use('/api/quotations', quotationRoutes); // P3
app.use('/api/approvals', approvalRoutes);   // P3
app.use('/api/purchase-orders', purchaseOrderRoutes); // P3
app.use('/api/invoices', invoiceRoutes);     // P3
app.use('/api/activity-logs', activityLogRoutes);     // P2
app.use('/api/notifications', notificationRoutes);    // P2
app.use('/api/reports', reportRoutes);       // P1 — coming in next branch
>>>>>>> c20cc5ea97db90acb5a0d849c40fa48c46dff8e8

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

export default app;