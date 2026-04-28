const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

// items já vem montado pelo checkoutController (inclui frete e desconto)
async function createPreference({ items, payer, orderNumber, backUrls }) {
    const preference = new Preference(client);

    const result = await preference.create({
        body: {
            items,   // ← recebe direto, sem remapear
            payer: {
                name:  payer.name,
                email: payer.email,
            },
            back_urls: {
                success: backUrls.success,
                failure: backUrls.failure,
                pending: backUrls.pending,
            },
            auto_return:        'approved',
            external_reference: orderNumber,
            notification_url:   backUrls.webhook,
        }
    });

    return result;
}

module.exports = { createPreference };