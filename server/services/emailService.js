const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPasswordResetEmail(toEmail, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;
    await resend.emails.send({
        from: `Velvet Store <${process.env.EMAIL_FROM}>`,
        to: [toEmail],
        subject: 'Redefinição de senha — Velvet Store Admin',
        html: `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;"><div style="background:#1a1a2e;padding:32px 40px;text-align:center;"><h1 style="color:white;font-size:22px;letter-spacing:4px;margin:0;">VELVET</h1><span style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Admin Panel</span></div><div style="padding:40px;"><h2 style="color:#1a1a2e;font-size:20px;margin:0 0 12px;">Redefinição de senha</h2><p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">Recebemos uma solicitação para redefinir a senha da sua conta de administrador. Clique no botão abaixo para criar uma nova senha.</p><a href="${resetUrl}" style="display:inline-block;background:#1a1a2e;color:white;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:500;">Redefinir senha</a><p style="color:#999;font-size:13px;margin:28px 0 0;line-height:1.6;">Este link expira em <strong>1 hora</strong>.<br>Se você não solicitou a redefinição, ignore este email.</p></div></div>`
    });
}

async function sendClientPasswordResetEmail(toEmail, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await resend.emails.send({
        from: `Velvet Atelier <${process.env.EMAIL_FROM}>`,
        to: [toEmail],
        subject: 'Redefinição de senha — Velvet Atelier',
        html: `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8e4e0;border-radius:8px;overflow:hidden;"><div style="background:#1A1817;padding:32px 40px;text-align:center;"><h1 style="color:white;font-family:Georgia,serif;font-size:26px;letter-spacing:5px;margin:0;">VELVET</h1><span style="color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:3px;text-transform:uppercase;">ATELIER</span></div><div style="padding:40px;"><h2 style="color:#1A1817;font-size:20px;margin:0 0 12px;">Redefinição de senha</h2><p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">Recebemos uma solicitação para redefinir a senha da sua conta.<br>Clique no botão abaixo para criar uma nova senha.</p><a href="${resetUrl}" style="display:inline-block;background:#8B7355;color:white;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:14px;font-weight:500;letter-spacing:0.5px;">Redefinir minha senha</a><p style="color:#999;font-size:13px;margin:28px 0 0;line-height:1.6;">Este link expira em <strong>1 hora</strong>.<br>Se você não solicitou a redefinição, ignore este email — sua senha permanece a mesma.</p></div><div style="background:#f7f5f2;padding:16px 40px;text-align:center;border-top:1px solid #e8e4e0;"><p style="color:#aaa;font-size:11px;margin:0;">© 2026 Velvet Atelier — Todos os direitos reservados</p></div></div>`
    });
}

module.exports = { sendPasswordResetEmail, sendClientPasswordResetEmail };