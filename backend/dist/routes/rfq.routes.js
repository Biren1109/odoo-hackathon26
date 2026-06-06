"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const cloudinary_1 = require("../config/cloudinary");
const rfq_controller_1 = require("../controllers/rfq.controller");
const router = (0, express_1.Router)();
// All RFQ routes require authentication
router.use(auth_middleware_1.authenticate);
router.get('/', (0, role_middleware_1.authorize)('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'), rfq_controller_1.getRFQs);
router.post('/', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), cloudinary_1.uploadMulter.array('attachments', 10), rfq_controller_1.createRFQ);
router.get('/:id', (0, role_middleware_1.authorize)('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'), rfq_controller_1.getRFQById);
router.put('/:id', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), rfq_controller_1.updateRFQ);
router.patch('/:id/publish', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), rfq_controller_1.publishRFQ);
router.post('/:id/assign-vendors', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), rfq_controller_1.assignVendors);
exports.default = router;
