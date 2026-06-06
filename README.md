# VendorBridge — Procurement & Vendor Management ERP

Full-stack ERP for managing vendors, RFQs, quotations, approvals, purchase orders, and invoices.

**Stack:** Next.js 14 · Node.js · Express.js · PostgreSQL · Prisma · Docker · Nginx · Vercel

## Quick Start

```bash
git clone https://github.com/YOUR-ORG/vendorbridge.git
cd vendorbridge
docker-compose up --build

# First time only:
docker exec vendorbridge_backend npx prisma migrate dev
docker exec vendorbridge_backend npx prisma db seed
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Via Nginx: http://localhost:80

**Demo credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vendorbridge.com | Admin@123 |
| Officer | officer@vendorbridge.com | Officer@123 |
| Manager | manager@vendorbridge.com | Manager@123 |