"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), invoice_controller_1.createInvoice);
router.get('/', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), invoice_controller_1.getInvoices);
router.get('/:id', invoice_controller_1.getInvoiceById); // all authenticated
router.get('/:id/pdf', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER', 'ADMIN'), invoice_controller_1.downloadInvoicePDF);
router.post('/:id/send-email', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), invoice_controller_1.sendInvoiceViaEmail);
router.patch('/:id/status', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), invoice_controller_1.updateInvoiceStatus);
exports.default = router;
