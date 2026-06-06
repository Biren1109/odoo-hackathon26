"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoiceHTML = generateInvoiceHTML;
function generateInvoiceHTML(data) {
    const itemRows = data.items
        .map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.productName}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>₹${item.unitPrice.toFixed(2)}</td>
          <td>₹${item.totalPrice.toFixed(2)}</td>
        </tr>`)
        .join('');
    return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a1a; }
      h1 { color: #2563eb; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th { background: #2563eb; color: white; padding: 8px 12px; text-align: left; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
      .totals { margin-top: 20px; text-align: right; }
      .totals table { width: 320px; float: right; }
      .grand-total td { font-weight: bold; font-size: 16px; color: #2563eb; }
      .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1>VendorBridge</h1>
        <p>Procurement & Vendor ERP</p>
      </div>
      <div style="text-align:right">
        <h2>INVOICE</h2>
        <p><strong>#${data.invoiceNumber}</strong></p>
        <p>Date: ${data.invoiceDate}</p>
        ${data.dueDate ? `<p>Due: ${data.dueDate}</p>` : ''}
      </div>
    </div>
  
    <div>
      <strong>Vendor:</strong> ${data.vendorName}<br/>
      ${data.vendorAddress ? `Address: ${data.vendorAddress}<br/>` : ''}
      ${data.vendorGST ? `GST: ${data.vendorGST}` : ''}
    </div>
  
    <table>
      <thead>
        <tr><th>#</th><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  
    <div class="totals">
      <table>
        <tr><td>Subtotal</td><td>₹${data.subtotal.toFixed(2)}</td></tr>
        <tr><td>CGST (${data.cgstRate}%)</td><td>₹${data.cgstAmount.toFixed(2)}</td></tr>
        <tr><td>SGST (${data.sgstRate}%)</td><td>₹${data.sgstAmount.toFixed(2)}</td></tr>
        <tr class="grand-total"><td>Grand Total</td><td>₹${data.totalAmount.toFixed(2)}</td></tr>
      </table>
    </div>
  </body>
  </html>`;
}
