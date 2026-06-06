import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendInvoiceEmail(
  toEmail: string,
  invoiceNumber: string,
  pdfBuffer: Buffer
) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Invoice ${invoiceNumber} from VendorBridge`,
    html: `<p>Please find attached your invoice <strong>${invoiceNumber}</strong> from VendorBridge.</p>
           <p>Thank you for your business.</p>`,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetToken: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Password Reset Request - VendorBridge`,
    html: `<p>Please use this token to reset your password: <strong>${resetToken}</strong></p>`,
  });
}

export async function sendRFQInvitationEmail(toEmail: string, vendorName: string, rfqTitle: string, rfqId: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `New RFQ Invitation - ${rfqTitle}`,
    html: `<p>Hello ${vendorName},</p>
           <p>You have been invited to participate in the RFQ: <strong>${rfqTitle}</strong>.</p>
           <p>Please log in to your dashboard to view the details.</p>`,
  });
}