import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendPasswordResetEmail(toEmail: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'VendorBridge — Password Reset',
    html: `<p>Click the link below to reset your password:</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>This link expires in 1 hour.</p>`,
  });
}

export async function sendRFQInvitationEmail(
  toEmail: string,
  rfqTitle: string,
  rfqId: string
) {
  const rfqUrl = `${process.env.FRONTEND_URL}/rfqs/${rfqId}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `RFQ Invitation: ${rfqTitle}`,
    html: `<p>You have been invited to submit a quotation for:</p>
           <p><strong>${rfqTitle}</strong></p>
           <p><a href="${rfqUrl}">View RFQ</a></p>`,
  });
}

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