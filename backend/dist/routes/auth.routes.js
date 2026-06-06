"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/' }); // Cloudinary integration via P2/P3 can replace later
router.post('/register', upload.single('avatar'), auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
router.post('/refresh-token', auth_controller_1.refreshToken);
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.logout);
exports.default = router;
