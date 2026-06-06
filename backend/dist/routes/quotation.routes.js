"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quotation_controller_1 = require("../controllers/quotation.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Vendor submits a quotation
router.post('/', (0, role_middleware_1.authorize)('VENDOR'), quotation_controller_1.submitQuotation);
// Vendor edits own quotation (only SUBMITTED status)
router.put('/:id', (0, role_middleware_1.authorize)('VENDOR'), quotation_controller_1.updateQuotation);
// Officer/Manager gets all quotations for an RFQ
router.get('/rfq/:rfqId', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), quotation_controller_1.getQuotationsByRFQ);
// Vendor views own quotations
router.get('/vendor/:vendorId', (0, role_middleware_1.authorize)('VENDOR'), quotation_controller_1.getQuotationsByVendor);
// Compare quotations side-by-side
router.get('/compare/:rfqId', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), quotation_controller_1.compareQuotations);
exports.default = router;
