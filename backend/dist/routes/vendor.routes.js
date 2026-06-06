"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const vendor_controller_1 = require("../controllers/vendor.controller");
const router = (0, express_1.Router)();
// All vendor routes require authentication
router.use(auth_middleware_1.authenticate);
router.get('/', (0, role_middleware_1.authorize)('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'), vendor_controller_1.getVendors);
router.post('/', (0, role_middleware_1.authorize)('ADMIN'), vendor_controller_1.createVendor);
router.get('/:id', (0, role_middleware_1.authorize)('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'), vendor_controller_1.getVendorById);
router.put('/:id', (0, role_middleware_1.authorize)('ADMIN'), vendor_controller_1.updateVendor);
router.delete('/:id', (0, role_middleware_1.authorize)('ADMIN'), vendor_controller_1.deleteVendor);
router.patch('/:id/status', (0, role_middleware_1.authorize)('ADMIN'), vendor_controller_1.updateVendorStatus);
exports.default = router;
