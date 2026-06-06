"use strict";
// CGST (9%) + SGST (9%) = 18% effective GST
// As per Excalidraw Screen 9 — tax is shown as two separate lines
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGST = calculateGST;
function calculateGST(subtotal, cgstRate = 9, sgstRate = 9) {
    const cgstAmount = parseFloat((subtotal * (cgstRate / 100)).toFixed(2));
    const sgstAmount = parseFloat((subtotal * (sgstRate / 100)).toFixed(2));
    const totalAmount = parseFloat((subtotal + cgstAmount + sgstAmount).toFixed(2));
    return { cgstAmount, sgstAmount, totalAmount };
}
