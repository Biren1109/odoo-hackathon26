"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePONumber = generatePONumber;
exports.generateInvoiceNumber = generateInvoiceNumber;
const db_1 = __importDefault(require("../config/db"));
async function generatePONumber() {
    const count = await db_1.default.purchaseOrder.count();
    const year = new Date().getFullYear();
    return `PO-${year}-${String(count + 1).padStart(5, '0')}`;
}
async function generateInvoiceNumber() {
    const count = await db_1.default.invoice.count();
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
}
