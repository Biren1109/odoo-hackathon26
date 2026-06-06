"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// ⚠️ read-all MUST come before /:id/read to avoid route conflict
router.get('/', notification_controller_1.getNotifications);
router.patch('/read-all', notification_controller_1.markAllNotificationsRead);
router.patch('/:id/read', notification_controller_1.markNotificationRead);
exports.default = router;
