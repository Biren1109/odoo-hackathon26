"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signAccessToken(userId, role) {
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m'),
    });
}
function signRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
}
