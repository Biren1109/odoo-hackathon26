"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchaseOrder_controller_1 = require("../controllers/purchaseOrder.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), purchaseOrder_controller_1.createPurchaseOrder);
router.get('/', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER', 'MANAGER', 'ADMIN'), purchaseOrder_controller_1.getPurchaseOrders);
router.get('/:id', purchaseOrder_controller_1.getPurchaseOrderById); // all authenticated
router.patch('/:id/status', (0, role_middleware_1.authorize)('PROCUREMENT_OFFICER'), purchaseOrder_controller_1.updatePOStatus);
exports.default = router;
