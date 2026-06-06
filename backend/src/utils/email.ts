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