"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvoiceEmail = sendInvoiceEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendRFQInvitationEmail = sendRFQInvitationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
async function sendInvoiceEmail(toEmail, invoiceNumber, pdfBuffer) {
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
async function sendPasswordResetEmail(toEmail, resetToken) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: `Password Reset Request - VendorBridge`,
        html: `<p>Please use this token to reset your password: <strong>${resetToken}</strong></p>`,
    });
}
async function sendRFQInvitationEmail(toEmail, vendorName, rfqTitle, rfqId) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: `New RFQ Invitation - ${rfqTitle}`,
        html: `<p>Hello ${vendorName},</p>
           <p>You have been invited to participate in the RFQ: <strong>${rfqTitle}</strong>.</p>
           <p>Please log in to your dashboard to view the details.</p>`,
    });
}
