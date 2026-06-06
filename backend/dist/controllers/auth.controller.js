"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.refreshToken = refreshToken;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const db_1 = __importDefault(require("../config/db"));
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
// POST /api/auth/register
async function register(req, res) {
    try {
        const { firstName, lastName, username, email, phone, country, additionalInfo, password, role } = req.body;
        const avatarUrl = req.file?.path || null; // Cloudinary URL via Multer
        const exists = await db_1.default.user.findFirst({ where: { OR: [{ email }, { username }] } });
        if (exists)
            return res.status(409).json({ message: 'Email or username already taken' });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await db_1.default.user.create({
            data: { firstName, lastName, username, email, phone, country, additionalInfo, avatarUrl, passwordHash, role: role || 'PROCUREMENT_OFFICER' },
        });
        const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role);
        const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
        await db_1.default.user.update({ where: { id: user.id }, data: { refreshToken } });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.status(201).json({ accessToken, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
    }
    catch (err) {
        res.status(500).json({ message: 'Registration failed', error: err });
    }
}
// POST /api/auth/login
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user || !await bcryptjs_1.default.compare(password, user.passwordHash))
            return res.status(401).json({ message: 'Invalid credentials' });
        if (!user.isActive)
            return res.status(403).json({ message: 'Account disabled' });
        const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role);
        const refreshToken = (0, jwt_1.signRefreshToken)(user.id);
        await db_1.default.user.update({ where: { id: user.id }, data: { refreshToken } });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ accessToken, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
    }
    catch (err) {
        res.status(500).json({ message: 'Login failed', error: err });
    }
}
// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user)
            return res.json({ message: 'If account exists, reset email sent' }); // don't leak
        const resetToken = (0, uuid_1.v4)();
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await db_1.default.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });
        await (0, email_1.sendPasswordResetEmail)(email, resetToken);
        res.json({ message: 'Password reset email sent' });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to send reset email', error: err });
    }
}
// POST /api/auth/reset-password
async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;
        const user = await db_1.default.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: new Date() } } });
        if (!user)
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        await db_1.default.user.update({ where: { id: user.id }, data: { passwordHash, resetToken: null, resetTokenExpiry: null } });
        res.json({ message: 'Password reset successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Reset failed', error: err });
    }
}
// POST /api/auth/refresh-token
async function refreshToken(req, res) {
    try {
        const token = req.cookies.refreshToken;
        if (!token)
            return res.status(401).json({ message: 'No refresh token' });
        const { userId } = (0, jwt_1.verifyRefreshToken)(token);
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        if (!user || user.refreshToken !== token)
            return res.status(401).json({ message: 'Invalid refresh token' });
        const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role);
        res.json({ accessToken });
    }
    catch {
        res.status(401).json({ message: 'Refresh token expired' });
    }
}
// POST /api/auth/logout
async function logout(req, res) {
    try {
        const userId = req.user?.userId;
        if (userId)
            await db_1.default.user.update({ where: { id: userId }, data: { refreshToken: null } });
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out' });
    }
    catch (err) {
        res.status(500).json({ message: 'Logout failed', error: err });
    }
}
