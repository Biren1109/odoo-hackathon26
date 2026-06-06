"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const activityLog_controller_1 = require("../controllers/activityLog.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// All logs — Admin/Manager only
router.get('/', (0, role_middleware_1.authorize)('ADMIN', 'MANAGER'), activityLog_controller_1.getActivityLogs);
// Entity-specific audit trail — all authenticated users
router.get('/:entityType/:id', activityLog_controller_1.getEntityActivityLogs);
exports.default = router;
