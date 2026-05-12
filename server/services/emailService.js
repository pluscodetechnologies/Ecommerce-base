const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADMIN  = `Velvet Store <${process.env.EMAIL_FROM || 'naoresponda@velvetatelier.com.br'}>`;
const FROM_CLIENT = `Velvet Atelier <${process.env.EMAIL_FROM || 'naoresponda@velvetatelier.com.br'}>`;
const FRONTEND    = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(v) {
    return 'R$ ' + parseFloat(v || 0).toFixed(2).replace('.', ',');
}

function headerHtml(subtitle = '') {
    return `
    <div style="background:#1A1817;padding:28px 40px;text-align:center;">
        <h1 style="color:white;font-family:Georgia,serif;font-size:28px;letter-spacing:6px;margin:0 0 4px;">VELVET</h1>
        <span style="color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:3px;text-transform:uppercase;">ATELIER</span>
        ${subtitle ? `<p style="color:rgba(255,255,255,0.7);font-size:13px;margin:12px 0 0;letter-spacing:1px;">${subtitle}</p>` : ''}
    </div>`;
}

function footerHtml() {
    return `
    <div style="background:#f7f5f2;padding:18px 40px;text-align:center;border-top:1px solid #e8e4e0;">
        <p style="color:#aaa;font-size:11px;margin:0 0 6px;">© ${new Date().getFullYear()} Velvet Atelier — Todos os direitos reservados</p>
        <p style="color:#bbb;font-size:11px;margin:0;">
            <a href="${FRONTEND}" style="color:#8B7355;text-decoration:none;">velvetatelier.com.br</a>
        </p>
    </div>`;
}

function wrapEmail(content) {
    return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e4e0;border-radius:8px;overflow:hidden;">${content}</div>`;
}

// ─── Reset de senha — Admin ──────────────────────────────────────────────────
async function sendPasswordResetEmail(toEmail, resetToken) {
    const resetUrl = `${FRONTEND}/admin/reset-password?token=${resetToken}`;
    await resend.emails.send({
        from: FROM_ADMIN,
        to: [toEmail],
        subject: 'Redefinição de senha — Velvet Store Admin',
        html: wrapEmail(`
            <div style="background:#1a1a2e;padding:32px 40px;text-align:center;">
                <h1 style="color:white;font-size:22px;letter-spacing:4px;margin:0;">VELVET</h1>
                <span style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Admin Panel</span>
            </div>
            <div style="padding:40px;">
                <h2 style="color:#1a1a2e;font-size:20px;margin:0 0 12px;">Redefinição de senha</h2>
                <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">Recebemos uma solicitação para redefinir a senha da sua conta de administrador.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#1a1a2e;color:white;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:500;">Redefinir senha</a>
                <p style="color:#999;font-size:13px;margin:28px 0 0;line-height:1.6;">Este link expira em <strong>1 hora</strong>.<br>Se você não solicitou a redefinição, ignore este email.</p>
            </div>
        `)
    });
}

// ─── Reset de senha — Cliente ────────────────────────────────────────────────
async function sendClientPasswordResetEmail(toEmail, resetToken) {
    const resetUrl = `${FRONTEND}/reset-password?token=${resetToken}`;
    await resend.emails.send({
        from: FROM_CLIENT,
        to: [toEmail],
        subject: 'Redefinição de senha — Velvet Atelier',
        html: wrapEmail(`
            ${headerHtml()}
            <div style="padding:40px;">
                <h2 style="color:#1A1817;font-size:20px;margin:0 0 12px;">Redefinição de senha</h2>
                <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">Recebemos uma solicitação para redefinir a senha da sua conta.<br>Clique no botão abaixo para criar uma nova senha.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#8B7355;color:white;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:14px;font-weight:500;letter-spacing:0.5px;">Redefinir minha senha</a>
                <p style="color:#999;font-size:13px;margin:28px 0 0;line-height:1.6;">Este link expira em <strong>1 hora</strong>.<br>Se você não solicitou a redefinição, ignore este email — sua senha permanece a mesma.</p>
            </div>
            ${footerHtml()}
        `)
    });
}

// ─── Confirmação de pedido ───────────────────────────────────────────────────
async function sendOrderConfirmationEmail(toEmail, order) {
    const {
        order_number,
        customer_name,
        total_amount,
        shipping_amount,
        discount_amount,
        payment_method,
        items = [],
        shipping_address = {}
    } = order;

    const addr = typeof shipping_address === 'string'
        ? JSON.parse(shipping_address)
        : (shipping_address || {});

    const paymentLabel = {
        checkout_pro: 'Mercado Pago',
        pix:          'PIX',
        boleto:       'Boleto Bancário',
        credit_card:  'Cartão de Crédito',
        manual:       'Pagamento Manual',
    }[payment_method] || 'Mercado Pago';

    const subtotal = parseFloat(total_amount) - parseFloat(shipping_amount || 0) + parseFloat(discount_amount || 0);

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding:12px 0;border-bottom:1px solid #f0ede8;">
                <div style="font-size:14px;font-weight:500;color:#1A1817;">${item.product_name}</div>
                ${item.color || item.size ? `<div style="font-size:12px;color:#8B8581;margin-top:2px;">${[item.color, item.size].filter(Boolean).join(' · ')}</div>` : ''}
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #f0ede8;text-align:center;font-size:14px;color:#4A4543;">${item.quantity}x</td>
            <td style="padding:12px 0;border-bottom:1px solid #f0ede8;text-align:right;font-size:14px;font-weight:500;color:#1A1817;">${fmt(item.unit_price * item.quantity)}</td>
        </tr>
    `).join('');

    const trackingUrl = `${FRONTEND}/rastreamento?order=${order_number}`;

    await resend.emails.send({
        from: FROM_CLIENT,
        to: [toEmail],
        subject: `Pedido confirmado! #${order_number} — Velvet Atelier`,
        html: wrapEmail(`
            ${headerHtml('Confirmação de Pedido')}
            <div style="padding:36px 40px 0;">
                <p style="color:#4A4543;font-size:15px;line-height:1.7;margin:0 0 6px;">Olá, <strong>${customer_name}</strong>!</p>
                <p style="color:#4A4543;font-size:15px;line-height:1.7;margin:0 0 28px;">Recebemos seu pedido e ele já está sendo processado. Assim que for despachado, você receberá um novo email com o código de rastreamento.</p>

                <!-- Número do pedido -->
                <div style="background:#f7f5f2;border-radius:8px;padding:18px 24px;margin-bottom:28px;text-align:center;">
                    <p style="color:#8B8581;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">Número do Pedido</p>
                    <p style="color:#1A1817;font-size:24px;font-weight:700;font-family:Georgia,serif;margin:0;letter-spacing:2px;">#${order_number}</p>
                </div>

                <!-- Itens -->
                <h3 style="color:#1A1817;font-size:14px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;">Itens do Pedido</h3>
                <table style="width:100%;border-collapse:collapse;">
                    ${itemsHtml}
                </table>

                <!-- Totais -->
                <table style="width:100%;margin-top:16px;">
                    <tr>
                        <td style="padding:5px 0;font-size:13px;color:#8B8581;">Subtotal</td>
                        <td style="padding:5px 0;font-size:13px;color:#4A4543;text-align:right;">${fmt(subtotal)}</td>
                    </tr>
                    <tr>
                        <td style="padding:5px 0;font-size:13px;color:#8B8581;">Frete</td>
                        <td style="padding:5px 0;font-size:13px;color:#4A4543;text-align:right;">${parseFloat(shipping_amount) > 0 ? fmt(shipping_amount) : 'Grátis'}</td>
                    </tr>
                    ${parseFloat(discount_amount) > 0 ? `
                    <tr>
                        <td style="padding:5px 0;font-size:13px;color:#2E8B57;">Desconto</td>
                        <td style="padding:5px 0;font-size:13px;color:#2E8B57;text-align:right;">— ${fmt(discount_amount)}</td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding:12px 0 5px;font-size:15px;font-weight:700;color:#1A1817;border-top:2px solid #e8e4e0;">Total</td>
                        <td style="padding:12px 0 5px;font-size:18px;font-weight:700;color:#8B7355;text-align:right;border-top:2px solid #e8e4e0;">${fmt(total_amount)}</td>
                    </tr>
                </table>

                <!-- Pagamento e Endereço -->
                <div style="display:flex;gap:20px;margin-top:28px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:200px;background:#f7f5f2;border-radius:8px;padding:18px 20px;">
                        <p style="color:#8B8581;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;">Pagamento</p>
                        <p style="color:#1A1817;font-size:13px;font-weight:500;margin:0;">${paymentLabel}</p>
                    </div>
                    <div style="flex:1;min-width:200px;background:#f7f5f2;border-radius:8px;padding:18px 20px;">
                        <p style="color:#8B8581;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;">Entregar em</p>
                        <p style="color:#1A1817;font-size:13px;font-weight:500;margin:0;">${addr.street || ''}, ${addr.number || ''}</p>
                        <p style="color:#4A4543;font-size:12px;margin:2px 0 0;">${addr.city || ''} — ${addr.state || ''}, ${addr.zip_code || ''}</p>
                    </div>
                </div>

                <!-- Botão rastrear -->
                <div style="text-align:center;margin:32px 0 8px;">
                    <a href="${trackingUrl}" style="display:inline-block;background:#1A1817;color:white;text-decoration:none;padding:14px 36px;border-radius:4px;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Acompanhar Pedido</a>
                </div>
            </div>
            ${footerHtml()}
        `)
    });
}

// ─── Pedido enviado (com rastreio) ───────────────────────────────────────────
async function sendOrderShippedEmail(toEmail, order) {
    const { order_number, customer_name, shipping_tracking } = order;
    const trackingUrl = `${FRONTEND}/rastreamento?order=${order_number}`;
    const correiosUrl = shipping_tracking
        ? `https://rastreamento.correios.com.br/app/index.php?objetos=${shipping_tracking}`
        : null;

    await resend.emails.send({
        from: FROM_CLIENT,
        to: [toEmail],
        subject: `Seu pedido foi enviado! #${order_number} — Velvet Atelier`,
        html: wrapEmail(`
            ${headerHtml('Seu Pedido Foi Enviado!')}
            <div style="padding:36px 40px;">
                <p style="color:#4A4543;font-size:15px;line-height:1.7;margin:0 0 6px;">Olá, <strong>${customer_name}</strong>!</p>
                <p style="color:#4A4543;font-size:15px;line-height:1.7;margin:0 0 28px;">Ótimas notícias! Seu pedido <strong>#${order_number}</strong> foi despachado e está a caminho.</p>

                ${shipping_tracking ? `
                <div style="background:#f0f7f0;border:1px solid #c3e0c3;border-radius:8px;padding:20px 24px;margin-bottom:28px;text-align:center;">
                    <p style="color:#2d6a4f;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Código de Rastreamento</p>
                    <p style="color:#1A1817;font-size:22px;font-weight:700;font-family:Georgia,serif;letter-spacing:3px;margin:0;">${shipping_tracking}</p>
                </div>
                ` : ''}

                <div style="text-align:center;margin-bottom:16px;">
                    <a href="${trackingUrl}" style="display:inline-block;background:#8B7355;color:white;text-decoration:none;padding:14px 36px;border-radius:4px;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Rastrear Pedido</a>
                </div>
                ${correiosUrl ? `
                <div style="text-align:center;">
                    <a href="${correiosUrl}" style="color:#8B7355;font-size:13px;text-decoration:underline;">Rastrear nos Correios →</a>
                </div>` : ''}

                <p style="color:#8B8581;font-size:12px;line-height:1.7;margin:28px 0 0;text-align:center;">Prazo de entrega estimado conforme opção de frete selecionada no pedido.</p>
            </div>
            ${footerHtml()}
        `)
    });
}

module.exports = {
    sendPasswordResetEmail,
    sendClientPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendOrderShippedEmail,
};