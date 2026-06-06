// CGST (9%) + SGST (9%) = 18% effective GST
// As per Excalidraw Screen 9 — tax is shown as two separate lines

export function calculateGST(subtotal: number, cgstRate = 9, sgstRate = 9) {
    const cgstAmount = parseFloat((subtotal * (cgstRate / 100)).toFixed(2));
    const sgstAmount = parseFloat((subtotal * (sgstRate / 100)).toFixed(2));
    const totalAmount = parseFloat((subtotal + cgstAmount + sgstAmount).toFixed(2));
    return { cgstAmount, sgstAmount, totalAmount };
  }