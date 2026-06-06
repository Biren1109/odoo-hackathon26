import 'dotenv/config';
import {
  Role,
  VendorStatus,
  RFQStatus,
  QuotationStatus,
  ApprovalStatus,
  ApprovalLevel,
  POStatus,
  InvoiceStatus,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db';

async function seedUsers() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendorbridge.com' },
    update: {},
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      username: 'superadmin',
      email: 'admin@vendorbridge.com',
      passwordHash: await bcrypt.hash('Admin@123', 12),
      role: Role.ADMIN,
      phone: '+91 98765 43210',
      country: 'India',
    },
  });

  const officer = await prisma.user.upsert({
    where: { email: 'officer@vendorbridge.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Procurement',
      username: 'john_officer',
      email: 'officer@vendorbridge.com',
      passwordHash: await bcrypt.hash('Officer@123', 12),
      role: Role.PROCUREMENT_OFFICER,
      phone: '+91 98765 43211',
      country: 'India',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@vendorbridge.com' },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Manager',
      username: 'sarah_manager',
      email: 'manager@vendorbridge.com',
      passwordHash: await bcrypt.hash('Manager@123', 12),
      role: Role.MANAGER,
      phone: '+91 98765 43212',
      country: 'India',
    },
  });

  return { admin, officer, manager };
}

async function seedDummyData(
  adminId: string,
  officerId: string,
  managerId: string,
) {
  const existing = await prisma.vendor.count();
  if (existing > 0) {
    console.log('ℹ️  Dummy data already present — skipping entity seed');
    return;
  }

  const year = new Date().getFullYear();
  const inDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };
  const daysAgo = (days: number) => inDays(-days);

  // ── Vendors ──────────────────────────────────────────────
  const techSupply = await prisma.vendor.create({
    data: {
      name: 'TechSupply India Pvt Ltd',
      email: 'sales@techsupply.in',
      phone: '+91 22 4567 8900',
      address: 'Plot 12, MIDC Andheri, Mumbai 400093',
      gstNumber: '27AABCT1234F1Z5',
      category: 'IT Hardware',
      status: VendorStatus.ACTIVE,
      rating: 4.5,
      contacts: {
        create: [
          { name: 'Rajesh Kumar', email: 'rajesh@techsupply.in', phone: '+91 98200 11111', role: 'Sales Manager' },
          { name: 'Priya Sharma', email: 'priya@techsupply.in', phone: '+91 98200 22222', role: 'Account Manager' },
        ],
      },
    },
  });

  const officeMart = await prisma.vendor.create({
    data: {
      name: 'OfficeMart Solutions',
      email: 'orders@officemart.co.in',
      phone: '+91 80 2345 6789',
      address: '45 MG Road, Bengaluru 560001',
      gstNumber: '29AABCO5678G1Z3',
      category: 'Office Supplies',
      status: VendorStatus.ACTIVE,
      rating: 4.2,
      contacts: {
        create: [
          { name: 'Anita Desai', email: 'anita@officemart.co.in', phone: '+91 98450 33333', role: 'Procurement Lead' },
        ],
      },
    },
  });

  const buildRight = await prisma.vendor.create({
    data: {
      name: 'BuildRight Materials',
      email: 'contact@buildright.in',
      phone: '+91 11 3456 7890',
      address: 'Sector 18, Noida 201301',
      gstNumber: '09AABCB9012H1Z7',
      category: 'Construction',
      status: VendorStatus.PENDING,
      rating: 3.8,
      contacts: {
        create: [
          { name: 'Vikram Singh', email: 'vikram@buildright.in', phone: '+91 98100 44444', role: 'Director' },
        ],
      },
    },
  });

  const greenEnergy = await prisma.vendor.create({
    data: {
      name: 'GreenEnergy Solutions',
      email: 'info@greenenergy.in',
      phone: '+91 40 5678 9012',
      address: 'HITEC City, Hyderabad 500081',
      gstNumber: '36AABCG3456I1Z9',
      category: 'Energy & Utilities',
      status: VendorStatus.ACTIVE,
      rating: 4.7,
      contacts: {
        create: [
          { name: 'Meera Reddy', email: 'meera@greenenergy.in', phone: '+91 97000 55555', role: 'Business Development' },
        ],
      },
    },
  });

  const secureNet = await prisma.vendor.create({
    data: {
      name: 'SecureNet Systems',
      email: 'support@securenet.in',
      phone: '+91 44 6789 0123',
      address: 'OMR Road, Chennai 600096',
      gstNumber: '33AABCS7890J1Z1',
      category: 'Security & Surveillance',
      status: VendorStatus.BLOCKED,
      rating: 2.1,
      contacts: {
        create: [
          { name: 'Arun Nair', email: 'arun@securenet.in', phone: '+91 96000 66666', role: 'Support Head' },
        ],
      },
    },
  });

  // ── RFQ 1: Published — laptops (open quotations) ─────────
  const rfqLaptops = await prisma.rFQ.create({
    data: {
      title: 'Office Laptops — Q2 2026',
      description: 'Procurement of 50 business laptops with 3-year warranty for new hires.',
      status: RFQStatus.PUBLISHED,
      deadline: inDays(14),
      createdById: officerId,
      createdAt: daysAgo(5),
      items: {
        create: [
          { description: 'Business Laptop — Intel i7, 16GB RAM, 512GB SSD', quantity: 50, unit: 'units', notes: 'Windows 11 Pro pre-installed' },
          { description: 'USB-C Docking Station', quantity: 50, unit: 'units' },
        ],
      },
      vendors: {
        create: [
          { vendorId: techSupply.id, status: 'RESPONDED', invitedAt: daysAgo(4) },
          { vendorId: officeMart.id, status: 'RESPONDED', invitedAt: daysAgo(4) },
          { vendorId: greenEnergy.id, status: 'INVITED', invitedAt: daysAgo(3) },
        ],
      },
    },
  });

  const laptopQty = 50;
  const laptopUnitPrice = 72000;
  const dockUnitPrice = 4500;
  const techLaptopSubtotal = laptopQty * laptopUnitPrice + laptopQty * dockUnitPrice;

  await prisma.quotation.create({
    data: {
      rfqId: rfqLaptops.id,
      vendorId: techSupply.id,
      status: QuotationStatus.SUBMITTED,
      totalAmount: techLaptopSubtotal,
      deliveryDays: 21,
      paymentTerms: 'Net 30',
      notes: 'Includes on-site setup for all units.',
      submittedAt: daysAgo(2),
      items: {
        create: [
          { description: 'Business Laptop — Intel i7, 16GB RAM, 512GB SSD', quantity: laptopQty, unitPrice: laptopUnitPrice, gstRate: 18, totalPrice: laptopQty * laptopUnitPrice },
          { description: 'USB-C Docking Station', quantity: laptopQty, unitPrice: dockUnitPrice, gstRate: 18, totalPrice: laptopQty * dockUnitPrice },
        ],
      },
    },
  });

  const officeMartUnitPrice = 69500;
  const officeMartSubtotal = laptopQty * officeMartUnitPrice + laptopQty * dockUnitPrice;

  await prisma.quotation.create({
    data: {
      rfqId: rfqLaptops.id,
      vendorId: officeMart.id,
      status: QuotationStatus.UNDER_REVIEW,
      totalAmount: officeMartSubtotal,
      deliveryDays: 28,
      paymentTerms: 'Net 45',
      submittedAt: daysAgo(1),
      items: {
        create: [
          { description: 'Business Laptop — Intel i7, 16GB RAM, 512GB SSD', quantity: laptopQty, unitPrice: officeMartUnitPrice, gstRate: 18, totalPrice: laptopQty * officeMartUnitPrice },
          { description: 'USB-C Docking Station', quantity: laptopQty, unitPrice: dockUnitPrice, gstRate: 18, totalPrice: laptopQty * dockUnitPrice },
        ],
      },
    },
  });

  // ── RFQ 2: Closed — chairs (full pipeline) ───────────────
  const rfqChairs = await prisma.rFQ.create({
    data: {
      title: 'Ergonomic Office Chairs',
      description: '120 ergonomic chairs for open-plan workspace renovation.',
      status: RFQStatus.CLOSED,
      deadline: daysAgo(10),
      createdById: officerId,
      createdAt: daysAgo(30),
      items: {
        create: [
          { description: 'Ergonomic Mesh Chair with Lumbar Support', quantity: 120, unit: 'units' },
        ],
      },
      vendors: {
        create: [
          { vendorId: officeMart.id, status: 'RESPONDED', invitedAt: daysAgo(28) },
          { vendorId: buildRight.id, status: 'DECLINED', invitedAt: daysAgo(28) },
        ],
      },
    },
  });

  const chairQty = 120;
  const chairUnitPrice = 8500;
  const chairSubtotal = chairQty * chairUnitPrice;
  const chairTax = chairSubtotal * 0.18;
  const chairGrandTotal = chairSubtotal + chairTax;

  const acceptedQuotation = await prisma.quotation.create({
    data: {
      rfqId: rfqChairs.id,
      vendorId: officeMart.id,
      status: QuotationStatus.ACCEPTED,
      totalAmount: chairSubtotal,
      deliveryDays: 14,
      paymentTerms: 'Net 30',
      notes: 'Free assembly and 2-year warranty included.',
      submittedAt: daysAgo(20),
      items: {
        create: [
          { description: 'Ergonomic Mesh Chair with Lumbar Support', quantity: chairQty, unitPrice: chairUnitPrice, gstRate: 18, totalPrice: chairSubtotal },
        ],
      },
      approval: {
        create: {
          approverId: managerId,
          status: ApprovalStatus.APPROVED,
          level: ApprovalLevel.L2,
          remarks: 'Best value for money. Approved for PO generation.',
          timeline: {
            create: [
              { level: ApprovalLevel.L1, action: 'INITIATED', actorId: officerId, remarks: 'Quotation submitted for approval', createdAt: daysAgo(18) },
              { level: ApprovalLevel.L1, action: 'L1_APPROVED', actorId: officerId, remarks: 'Within budget', createdAt: daysAgo(17) },
              { level: ApprovalLevel.L2, action: 'L2_APPROVED', actorId: managerId, remarks: 'Final approval granted', createdAt: daysAgo(16) },
            ],
          },
        },
      },
    },
    include: { approval: true },
  });

  const poChairs = await prisma.purchaseOrder.create({
    data: {
      poNumber: `PO-${year}-00001`,
      quotationId: acceptedQuotation.id,
      vendorId: officeMart.id,
      status: POStatus.DELIVERED,
      subtotal: chairSubtotal,
      taxAmount: chairTax,
      grandTotal: chairGrandTotal,
      createdById: officerId,
      createdAt: daysAgo(15),
      items: {
        create: [
          { description: 'Ergonomic Mesh Chair with Lumbar Support', quantity: chairQty, unitPrice: chairUnitPrice, totalPrice: chairSubtotal },
        ],
      },
    },
  });

  const cgstAmount = chairSubtotal * 0.09;
  const sgstAmount = chairSubtotal * 0.09;

  await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${year}-00001`,
      poId: poChairs.id,
      vendorId: officeMart.id,
      status: InvoiceStatus.PAID,
      subtotal: chairSubtotal,
      cgstRate: 9,
      cgstAmount,
      sgstRate: 9,
      sgstAmount,
      totalAmount: chairGrandTotal,
      issuedDate: daysAgo(10),
      dueDate: daysAgo(-20),
      createdById: officerId,
      items: {
        create: [
          { description: 'Ergonomic Mesh Chair with Lumbar Support', quantity: chairQty, unitPrice: chairUnitPrice, totalPrice: chairSubtotal },
        ],
      },
    },
  });

  // ── RFQ 3: Draft ─────────────────────────────────────────
  await prisma.rFQ.create({
    data: {
      title: 'Network Equipment Upgrade',
      description: 'Core switch and firewall upgrade for HQ data centre.',
      status: RFQStatus.DRAFT,
      createdById: officerId,
      items: {
        create: [
          { description: '48-port Managed Switch', quantity: 2, unit: 'units' },
          { description: 'Enterprise Firewall Appliance', quantity: 1, unit: 'unit' },
        ],
      },
    },
  });

  // ── RFQ 4: Published — stationery ────────────────────────
  const rfqStationery = await prisma.rFQ.create({
    data: {
      title: 'Annual Stationery Supply 2026',
      description: 'Bulk stationery for all regional offices.',
      status: RFQStatus.PUBLISHED,
      deadline: inDays(7),
      createdById: officerId,
      createdAt: daysAgo(3),
      items: {
        create: [
          { description: 'A4 Copier Paper (500 sheets/ream)', quantity: 500, unit: 'reams' },
          { description: 'Ballpoint Pens (blue)', quantity: 2000, unit: 'pcs' },
          { description: 'Sticky Notes (3x3 inch)', quantity: 300, unit: 'packs' },
        ],
      },
      vendors: {
        create: [
          { vendorId: officeMart.id, status: 'RESPONDED', invitedAt: daysAgo(2) },
        ],
      },
    },
  });

  const paperQty = 500;
  const penQty = 2000;
  const stickyQty = 300;
  const stationerySubtotal = paperQty * 280 + penQty * 12 + stickyQty * 95;

  const pendingQuotation = await prisma.quotation.create({
    data: {
      rfqId: rfqStationery.id,
      vendorId: officeMart.id,
      status: QuotationStatus.SUBMITTED,
      totalAmount: stationerySubtotal,
      deliveryDays: 7,
      paymentTerms: 'Net 15',
      submittedAt: daysAgo(1),
      items: {
        create: [
          { description: 'A4 Copier Paper (500 sheets/ream)', quantity: paperQty, unitPrice: 280, gstRate: 12, totalPrice: paperQty * 280 },
          { description: 'Ballpoint Pens (blue)', quantity: penQty, unitPrice: 12, gstRate: 12, totalPrice: penQty * 12 },
          { description: 'Sticky Notes (3x3 inch)', quantity: stickyQty, unitPrice: 95, gstRate: 12, totalPrice: stickyQty * 95 },
        ],
      },
      approval: {
        create: {
          status: ApprovalStatus.PENDING,
          level: ApprovalLevel.L1,
          timeline: {
            create: [
              { level: ApprovalLevel.L1, action: 'INITIATED', actorId: officerId, remarks: 'Awaiting L1 review', createdAt: daysAgo(1) },
            ],
          },
        },
      },
    },
  });

  // ── RFQ 5: Cancelled ─────────────────────────────────────
  await prisma.rFQ.create({
    data: {
      title: 'CCTV Installation — Warehouse B',
      description: 'Cancelled due to budget reallocation.',
      status: RFQStatus.CANCELLED,
      deadline: daysAgo(5),
      createdById: officerId,
      createdAt: daysAgo(20),
      vendors: {
        create: [
          { vendorId: secureNet.id, status: 'INVITED', invitedAt: daysAgo(19) },
        ],
      },
    },
  });

  // ── Extra PO (confirmed, no invoice yet) ─────────────────
  const rfqSolar = await prisma.rFQ.create({
    data: {
      title: 'Rooftop Solar Panels — Phase 1',
      description: '50kW rooftop solar installation for manufacturing unit.',
      status: RFQStatus.CLOSED,
      deadline: daysAgo(25),
      createdById: officerId,
      createdAt: daysAgo(60),
      items: {
        create: [
          { description: '550W Monocrystalline Solar Panel', quantity: 100, unit: 'panels' },
          { description: 'Grid-tie Inverter 50kW', quantity: 1, unit: 'unit' },
        ],
      },
      vendors: {
        create: [
          { vendorId: greenEnergy.id, status: 'RESPONDED', invitedAt: daysAgo(55) },
        ],
      },
    },
  });

  const panelQty = 100;
  const panelPrice = 18500;
  const inverterPrice = 450000;
  const solarSubtotal = panelQty * panelPrice + inverterPrice;
  const solarTax = solarSubtotal * 0.18;
  const solarGrandTotal = solarSubtotal + solarTax;

  const solarQuotation = await prisma.quotation.create({
    data: {
      rfqId: rfqSolar.id,
      vendorId: greenEnergy.id,
      status: QuotationStatus.ACCEPTED,
      totalAmount: solarSubtotal,
      deliveryDays: 45,
      paymentTerms: '30% advance, 70% on delivery',
      submittedAt: daysAgo(40),
      items: {
        create: [
          { description: '550W Monocrystalline Solar Panel', quantity: panelQty, unitPrice: panelPrice, gstRate: 18, totalPrice: panelQty * panelPrice },
          { description: 'Grid-tie Inverter 50kW', quantity: 1, unitPrice: inverterPrice, gstRate: 18, totalPrice: inverterPrice },
        ],
      },
      approval: {
        create: {
          approverId: managerId,
          status: ApprovalStatus.APPROVED,
          level: ApprovalLevel.L2,
          remarks: 'Strategic energy initiative — approved.',
          timeline: {
            create: [
              { level: ApprovalLevel.L1, action: 'L1_APPROVED', actorId: officerId, createdAt: daysAgo(38) },
              { level: ApprovalLevel.L2, action: 'L2_APPROVED', actorId: managerId, createdAt: daysAgo(37) },
            ],
          },
        },
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      poNumber: `PO-${year}-00002`,
      quotationId: solarQuotation.id,
      vendorId: greenEnergy.id,
      status: POStatus.CONFIRMED,
      subtotal: solarSubtotal,
      taxAmount: solarTax,
      grandTotal: solarGrandTotal,
      createdById: officerId,
      createdAt: daysAgo(35),
      items: {
        create: [
          { description: '550W Monocrystalline Solar Panel', quantity: panelQty, unitPrice: panelPrice, totalPrice: panelQty * panelPrice },
          { description: 'Grid-tie Inverter 50kW', quantity: 1, unitPrice: inverterPrice, totalPrice: inverterPrice },
        ],
      },
    },
  });

  // ── Activity logs ────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      { entityType: 'RFQ', entityId: rfqLaptops.id, action: 'CREATED', actorId: officerId, details: { title: 'Office Laptops — Q2 2026' }, createdAt: daysAgo(5) },
      { entityType: 'RFQ', entityId: rfqLaptops.id, action: 'PUBLISHED', actorId: officerId, createdAt: daysAgo(4) },
      { entityType: 'QUOTATION', entityId: rfqChairs.id, action: 'SUBMITTED', actorId: officerId, createdAt: daysAgo(20) },
      { entityType: 'APPROVAL', entityId: acceptedQuotation.approval!.id, action: 'APPROVED', actorId: managerId, createdAt: daysAgo(16) },
      { entityType: 'PURCHASE_ORDER', entityId: poChairs.id, action: 'CREATED', actorId: officerId, createdAt: daysAgo(15) },
      { entityType: 'INVOICE', entityId: poChairs.id, action: 'PAID', actorId: adminId, createdAt: daysAgo(5) },
      { entityType: 'VENDOR', entityId: secureNet.id, action: 'BLOCKED', actorId: adminId, details: { reason: 'Repeated delivery failures' }, createdAt: daysAgo(7) },
    ],
  });

  // ── Notifications ────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: managerId, type: NotificationType.APPROVAL, title: 'Approval Required', message: 'Stationery quotation awaiting your L1 review.', entityType: 'QUOTATION', entityId: pendingQuotation.id, isRead: false, createdAt: daysAgo(1) },
      { userId: officerId, type: NotificationType.QUOTATION, title: 'New Quotation Received', message: 'TechSupply India submitted a quote for Office Laptops.', entityType: 'RFQ', entityId: rfqLaptops.id, isRead: true, createdAt: daysAgo(2) },
      { userId: officerId, type: NotificationType.RFQ, title: 'RFQ Published', message: 'Annual Stationery Supply 2026 is now live.', entityType: 'RFQ', entityId: rfqStationery.id, isRead: true, createdAt: daysAgo(3) },
      { userId: managerId, type: NotificationType.PURCHASE_ORDER, title: 'PO Delivered', message: 'PO-2026-00001 (Office Chairs) marked as delivered.', entityType: 'PURCHASE_ORDER', entityId: poChairs.id, isRead: true, createdAt: daysAgo(8) },
      { userId: adminId, type: NotificationType.INVOICE, title: 'Invoice Paid', message: 'INV-2026-00001 payment confirmed.', entityType: 'INVOICE', entityId: poChairs.id, isRead: false, createdAt: daysAgo(5) },
    ],
  });

  console.log('✅ Dummy data seeded: 5 vendors, 6 RFQs, quotations, approvals, POs, invoices');
}

async function main() {
  const { admin, officer, manager } = await seedUsers();
  await seedDummyData(admin.id, officer.id, manager.id);
  console.log('✅ Seed complete');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:     admin@vendorbridge.com     / Admin@123');
  console.log('  Officer:   officer@vendorbridge.com   / Officer@123');
  console.log('  Manager:   manager@vendorbridge.com   / Manager@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
