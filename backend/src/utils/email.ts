import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendInvoiceEmail(toEmail: string, invoiceNumber: string, pdfBuffer: Buffer) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Invoice ${invoiceNumber} from VendorBridge`,
    html: `<p>Please find attached your invoice <strong>${invoiceNumber}</strong>.</p>`,
    attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  });
}

export async function sendRFQInvitationEmail(toEmail: string, vendorName: string, rfqTitle: string, rfqId: string) {
  const rfqLink = `${process.env.FRONTEND_URL}/rfqs/${rfqId}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `RFQ Invitation: ${rfqTitle}`,
    html: `<h2>Hello ${vendorName},</h2><p>You have been invited to submit a quotation for: <strong>${rfqTitle}</strong></p><p><a href="${rfqLink}">Click here to respond</a></p>`,
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetToken: string) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Reset your VendorBridge password',
    html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">Reset Password</a></p>`,
  });
}