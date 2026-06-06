# Procurement & Vendor Management System

A robust, full-stack application built to streamline the procurement lifecycle. This system handles everything from vendor management to Request for Quotations (RFQs), PO generation, approval workflows, and invoice processing.

## 🚀 Features

- **Vendor Management**: Create, update, and manage vendors. Track their performance and status (Active, Pending, Blocked).
- **RFQ Lifecycle**: Create RFQs, publish them to vendors, and manage incoming quotes.
- **Quotation Comparison**: Automatically compare quotations side-by-side to find the most cost-effective vendor.
- **Approval Workflows**: Multi-level (L1/L2) approvals for generated quotations.
- **Purchase Orders (POs)**: Automatically generate POs from approved quotations.
- **Invoicing & PDF Generation**: Generate dynamic PDF invoices and email them directly to vendors.
- **Activity & Audit Logging**: Track every action taken within the system for accountability.

## 🛠 Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, Zustand (State Management), React Hook Form, Zod.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, JWT Authentication.
- **Database**: PostgreSQL
- **Utilities**: Puppeteer (PDF generation), Nodemailer (Emails), Cloudinary (File Uploads).

---

## 💻 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (Running locally or via a cloud provider like Supabase/Neon)
- Git

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd odoo-hackathon26
```

---

### 2. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

**Install Dependencies:**
```bash
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` folder and add the following:
```env
PORT=5000
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"

# JWT Secrets
JWT_SECRET="your_super_secret_jwt_key_123"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="your_super_secret_refresh_key_123"
JWT_REFRESH_EXPIRES_IN="7d"

# Nodemailer (For sending emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="your_email@gmail.com"

# Puppeteer PDF Generation (Optional, for production environments)
# PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"
```

**Database Setup & Prisma:**
Initialize the database and generate the Prisma client:
```bash
npx prisma generate
npx prisma db push
```

**Start the Backend Server:**
```bash
npm run dev
```
*The backend should now be running on `http://localhost:5000`.*

---

### 3. Frontend Setup

Open a **new** terminal window and navigate to the `frontend` directory:
```bash
cd frontend
```

**Install Dependencies:**
```bash
npm install
```

**Environment Variables:**
Create a `.env.local` file in the `frontend` folder and add the following:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

**Start the Frontend Development Server:**
```bash
npm run dev
```
*The frontend should now be running on `http://localhost:3000`.*

---

## 🐛 Troubleshooting

### Prisma Error: `Unknown property datasourceUrl provided to PrismaClient constructor`
If you encounter this error when starting the backend, it usually means there is a mismatch between your Prisma CLI version and your `@prisma/client` version. 
**Fix:**
```bash
cd backend
npm install @prisma/client@latest prisma@latest
npx prisma generate
npm run dev
```

### Next.js Type Errors during Build
If you face any TypeScript typing errors regarding `VendorForm` or `ActivityLogs` when running `npm run build`, we have set `"strict": false` in `tsconfig.json` to bypass legacy MVP types. If they persist:
- Ensure the `vendots` folder (a legacy typo) inside `src/components/layout/` is deleted.
- Run `npm run dev` to use the development server which is more forgiving than the production builder.

### Cannot Connect to Database
- Ensure your local PostgreSQL service is actively running.
- Double-check that your `DATABASE_URL` in the `backend/.env` file has the correct username, password, and port (default is 5432).

---

## 📝 Usage Guide

1. **Sign Up / Login**: Register an account on the frontend.
2. **Dashboard**: Once logged in, you will be taken to the Dashboard overview.
3. **Vendors**: Navigate to the Vendors tab to add new vendors.
4. **RFQs**: Create an RFQ and add line items. Publish it, then "simulate" or enter quotations submitted by vendors.
5. **Quotations**: Review and compare vendor quotations. Push the best quotation to Approval.
6. **Approvals**: The L1 (and L2) manager can approve the quotation.
7. **Purchase Orders**: Once approved, navigate to the PO tab to generate a Purchase Order.
8. **Invoices**: Finally, convert the PO into an Invoice and click "Send Email" to automatically generate a PDF and dispatch it to the vendor.

## 👥 Contributors
- biren patel
- meet patel
- shlok thakkar
- mehul rajput

Happy Coding! 🚀
