const nodemailer = require("nodemailer");

const configured = () => Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    (process.env.EMAIL_FROM || process.env.SMTP_FROM)
);

const createTransporter = () => {
    if (!configured()) return null;

    const port = Number(process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000
    });
};

const sendPasswordResetOtp = async ({ email, name, otp }) => {
    const transporter = createTransporter();
    if (!transporter) {
        const error = new Error("Password reset email service is not configured.");
        error.code = "EMAIL_NOT_CONFIGURED";
        throw error;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_FROM,
        to: email,
        subject: "Campus Resolve - Password Reset OTP",
        text: `Hello ${name},\n\nYour Campus Resolve password reset code is ${otp}. It expires in 15 minutes. If you did not request this, ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f8f5ed;border:1px solid #d6c27a"><h2 style="color:#142451">Campus Resolve</h2><p>Hello <strong>${escapeHtml(name)}</strong>,</p><p>Use this one-time password to reset your Campus Resolve account password. It expires in <strong>15 minutes</strong>.</p><div style="margin:30px 0;font-size:32px;letter-spacing:8px;font-weight:bold;color:#142451">${otp}</div><p>If you did not request a password reset, you can safely ignore this email.</p><hr><p style="font-size:12px;color:#777">Campus Resolve Support</p></div>`
    });
};

const verifyEmailService = async () => {
    const transporter = createTransporter();
    if (!transporter) return false;
    await transporter.verify();
    return true;
};

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
})[character]);

module.exports = { configured, sendPasswordResetOtp, verifyEmailService };
