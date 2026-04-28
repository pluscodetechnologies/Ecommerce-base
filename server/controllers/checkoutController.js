const { getDB } = require('../config/database');
const Cart = require('../models/Cart');
const { createPreference } = require('../services/mercadoPagoService');
const https = require('https');

const CEP_ORIGEM = process.env.CEP_ORIGEM || '01310100';

function melhorEnvioRequest(host, token, body) {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(body);
        const req = https.request({
            hostname: host,
            path: '/api/v2/me/shipment/calculate',
            method: 'POST',
            headers: {
                'Authorization':  `Bearer ${token}`,
                'Content-Type':   'application/json',
                'Accept':         'application/json',
                'User-Agent':     process.env.MELHOR_ENVIO_USER_AGENT || 'VelvetAtelier contato@velvet.com.br',
                'Content-Length': Buffer.byteLength(bodyStr),
            }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 400) reject({ status: res.statusCode, data: parsed });
                    else resolve(parsed);
                } catch { reject({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

class CheckoutController {

    // ── CALCULAR FRETE ────────────────────────────────────────────────────────
    async calculateShipping(req, res) {
        try {
            const { zipcode, items } = req.body;
            const cepDestino = zipcode.replace(/\D/g, '');

            if (cepDestino.length !== 8) {
                return res.status(400).json({ success: false, message: 'CEP inválido' });
            }

            const token = process.env.MELHOR_ENVIO_TOKEN;
            if (!token || token === 'SEU_TOKEN_AQUI') {
                return res.json({ success: true, fallback: true, data: fallbackOptions() });
            }

            const totalItens = (items || []).reduce((s, i) => s + (i.quantity || 1), 0);
            const pesoKg     = Math.max(0.3, totalItens * 0.3);

            const payload = {
                from:    { postal_code: CEP_ORIGEM.replace(/\D/g, '') },
                to:      { postal_code: cepDestino },
                package: { height: 10, width: 15, length: 20, weight: pesoKg },
                services: '1,2',
                options: { receipt: false, own_hand: false, collect: false, insurance_value: 0 }
            };

            let resultado = null;

            for (const host of ['melhorenvio.com.br', 'sandbox.melhorenvio.com.br']) {
                try {
                    resultado = await melhorEnvioRequest(host, token, payload);
                    break;
                } catch (e) {
                    console.log(`⚠️  Melhor Envio falhou em ${host}:`, e.data || e.message);
                }
            }

            if (!resultado) {
                console.log('ℹ️  Melhor Envio indisponível — usando fallback');
                return res.json({ success: true, fallback: true, data: fallbackOptions() });
            }

            const opcoes = resultado
                .filter(s => !s.error && s.price && parseFloat(s.price) > 0)
                .map(s => ({
                    name:    s.name,
                    company: s.company?.name || 'Correios',
                    price:   parseFloat(s.price),
                    days:    s.delivery_range
                        ? `${s.delivery_range.min}–${s.delivery_range.max} dias úteis`
                        : `${s.delivery_time || '?'} dias úteis`,
                }))
                .sort((a, b) => a.price - b.price);

            if (!opcoes.length) {
                return res.json({ success: false, message: 'Nenhuma opção de frete disponível para este CEP.' });
            }

            res.json({ success: true, data: opcoes });

        } catch (error) {
            console.error('Erro ao calcular frete:', error?.data || error.message);
            res.json({ success: true, fallback: true, data: fallbackOptions() });
        }
    }

    // ── PROXY MELHOR ENVIO (chamada direta do browser — evita o allowlist) ────
    async shippingProxy(req, res) {
        try {
            const { zipcode, items } = req.body;
            const cepDestino = (zipcode || '').replace(/\D/g, '');

            if (cepDestino.length !== 8) {
                return res.status(400).json({ success: false, message: 'CEP inválido' });
            }

            const token = process.env.MELHOR_ENVIO_TOKEN;
            if (!token || token === 'SEU_TOKEN_AQUI') {
                return res.json({ success: true, fallback: true, data: fallbackOptions() });
            }

            const totalItens = (items || []).reduce((s, i) => s + (i.quantity || 1), 0);
            const pesoKg     = Math.max(0.3, totalItens * 0.3);

            // Monta o payload para o Melhor Envio
            const mePayload = {
                from:    { postal_code: CEP_ORIGEM.replace(/\D/g, '') },
                to:      { postal_code: cepDestino },
                package: { height: 10, width: 15, length: 20, weight: pesoKg },
                services: '1,2',
                options: { receipt: false, own_hand: false, collect: false, insurance_value: 0 }
            };

            // Repassa o IP real do usuário para o Melhor Envio liberar
            const userIP  = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
            const bodyStr = JSON.stringify(mePayload);

            const resultado = await new Promise((resolve, reject) => {
                const r = https.request({
                    hostname: 'melhorenvio.com.br',
                    path: '/api/v2/me/shipment/calculate',
                    method: 'POST',
                    headers: {
                        'Authorization':  `Bearer ${token}`,
                        'Content-Type':   'application/json',
                        'Accept':         'application/json',
                        'User-Agent':     process.env.MELHOR_ENVIO_USER_AGENT || 'VelvetAtelier contato@velvet.com.br',
                        'X-Forwarded-For': userIP,
                        'Content-Length': Buffer.byteLength(bodyStr),
                    }
                }, (response) => {
                    let data = '';
                    response.on('data', d => data += d);
                    response.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            if (response.statusCode >= 400) reject({ status: response.statusCode, data: parsed });
                            else resolve(parsed);
                        } catch { reject({ status: response.statusCode, raw: data }); }
                    });
                });
                r.on('error', reject);
                r.write(bodyStr);
                r.end();
            });

            const opcoes = resultado
                .filter(s => !s.error && s.price && parseFloat(s.price) > 0)
                .map(s => ({
                    name:    s.name,
                    company: s.company?.name || 'Correios',
                    price:   parseFloat(s.price),
                    days:    s.delivery_range
                        ? `${s.delivery_range.min}–${s.delivery_range.max} dias úteis`
                        : `${s.delivery_time || '?'} dias úteis`,
                }))
                .sort((a, b) => a.price - b.price);

            if (!opcoes.length) {
                return res.json({ success: false, message: 'Nenhuma opção disponível para este CEP.' });
            }

            res.json({ success: true, data: opcoes });

        } catch (error) {
            console.log('Proxy Melhor Envio falhou, usando fallback:', error?.data || error.message);
            res.json({ success: true, fallback: true, data: fallbackOptions() });
        }
    }

    // ── CRIAR PEDIDO ──────────────────────────────────────────────────────────
    async createOrder(req, res) {
        const connection = await getDB().getConnection();

        try {
            await connection.beginTransaction();

            const userId    = req.userId || null;
            const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
            const { shipping, payment, coupon } = req.body;

            const cart  = await Cart.getOrCreateCart(userId, sessionId);
            const items = await Cart.getCartItems(cart.id);

            if (items.length === 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Carrinho vazio' });
            }

            for (const item of items) {
                const [stockRows] = await connection.execute('SELECT stock FROM products WHERE id = ?', [item.product_id]);
                if (!stockRows.length || stockRows[0].stock < item.quantity) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: `Produto "${item.name}" sem estoque suficiente.` });
                }
            }

            const subtotal     = items.reduce((s, i) => s + (i.final_price * i.quantity), 0);
            const shippingCost = parseFloat(shipping?.cost) || 0;
            let discountAmount = 0;
            let couponData     = null;

            if (coupon) {
                const [couponRows] = await connection.execute(
                    'SELECT * FROM coupons WHERE code = ? AND status = "active"',
                    [coupon.trim().toUpperCase()]
                );
                if (couponRows.length) {
                    couponData = couponRows[0];
                    const isExpired   = couponData.expires_at && new Date(couponData.expires_at) < new Date();
                    const isExhausted = couponData.max_uses && couponData.used_count >= couponData.max_uses;
                    let alreadyUsed   = false;
                    if (couponData.max_uses === 1 && userId) {
                        const [usage] = await connection.execute(
                            'SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
                            [couponData.id, userId]
                        );
                        alreadyUsed = usage.length > 0;
                    }
                    if (!isExpired && !isExhausted && !alreadyUsed) {
                        discountAmount = couponData.discount_type === 'percentage'
                            ? subtotal * (couponData.discount_value / 100)
                            : parseFloat(couponData.discount_value);
                    }
                }
            }

            const totalAmount = subtotal + shippingCost - discountAmount;
            const orderNumber = 'VLT' + Date.now().toString().slice(-8);

            const shippingAddress = JSON.stringify({
                name: shipping.name, street: shipping.street, number: shipping.number,
                complement: shipping.complement || '', neighborhood: shipping.neighborhood,
                city: shipping.city, state: shipping.state, zip_code: shipping.zip_code
            });

            const [orderResult] = await connection.execute(
                `INSERT INTO orders
                (order_number, user_id, customer_name, customer_email, customer_phone, customer_document,
                 total_amount, shipping_amount, discount_amount, payment_method, shipping_address, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [orderNumber, userId, shipping.name, shipping.email, shipping.phone, shipping.cpf || null,
                 totalAmount, shippingCost, discountAmount, payment.method, shippingAddress]
            );

            const orderId = orderResult.insertId;

            for (const item of items) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, item.product_id, item.name, item.quantity, item.final_price, item.final_price * item.quantity]
                );
                await connection.execute(
                    'UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?',
                    [item.quantity, item.quantity, item.product_id]
                );
            }

            if (couponData && discountAmount > 0 && userId) {
                await connection.execute(
                    'INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)',
                    [couponData.id, userId, orderId, discountAmount]
                );
                await connection.execute(
                    'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
                    [couponData.id]
                );
            }

            await Cart.clearCart(cart.id);
            await connection.commit();

            const mpItems = items.map(item => ({
                id: String(item.product_id), title: item.name,
                quantity: Number(item.quantity),
                unit_price: parseFloat(parseFloat(item.final_price).toFixed(2)),
                currency_id: 'BRL',
            }));

            if (shippingCost > 0) {
                mpItems.push({
                    id: 'frete', title: `Frete — ${shipping.shipping_name || 'Entrega'}`,
                    quantity: 1, unit_price: parseFloat(shippingCost.toFixed(2)), currency_id: 'BRL',
                });
            }

            if (discountAmount > 0) {
                mpItems.push({
                    id: 'desconto', title: 'Desconto cupom',
                    quantity: 1, unit_price: parseFloat((-discountAmount).toFixed(2)), currency_id: 'BRL',
                });
            }

            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const preference = await createPreference({
                items: mpItems,
                payer: { name: shipping.name, email: shipping.email },
                orderNumber,
                backUrls: {
                    success: `${baseUrl}/checkout-success?order=${orderNumber}`,
                    failure: `${baseUrl}/checkout-error?order=${orderNumber}`,
                    pending: `${baseUrl}/checkout-pending?order=${orderNumber}`,
                    webhook: `${baseUrl}/api/checkout/webhook`,
                }
            });

            res.json({
                success: true, orderId, orderNumber, totalAmount,
                paymentUrl: preference.sandbox_init_point,
            });

        } catch (error) {
            await connection.rollback();
            console.error('Erro ao criar pedido:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            connection.release();
        }
    }

    // ── WEBHOOK ───────────────────────────────────────────────────────────────
    async handleWebhook(req, res) {
        try {
            const { type, data } = req.body;
            if (type === 'payment') {
                const { MercadoPagoConfig, Payment } = require('mercadopago');
                const client        = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
                const paymentClient = new Payment(client);
                const payment       = await paymentClient.get({ id: data.id });
                const statusMap     = { approved: 'paid', pending: 'pending', in_process: 'pending', rejected: 'cancelled' };
                const newStatus     = statusMap[payment.status] || 'pending';
                const db            = getDB();

                if (newStatus === 'cancelled') {
                    const [orderRows] = await db.execute('SELECT id FROM orders WHERE order_number = ?', [payment.external_reference]);
                    if (orderRows.length) {
                        const [orderItems] = await db.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderRows[0].id]);
                        for (const item of orderItems) {
                            await db.execute(
                                'UPDATE products SET stock = stock + ?, sales_count = GREATEST(0, sales_count - ?) WHERE id = ?',
                                [item.quantity, item.quantity, item.product_id]
                            );
                        }
                    }
                }
                await db.execute('UPDATE orders SET status = ?, payment_id = ? WHERE order_number = ?',
                    [newStatus, String(data.id), payment.external_reference]);
            }
            res.sendStatus(200);
        } catch (error) {
            console.error('Erro no webhook:', error);
            res.sendStatus(500);
        }
    }
}

function fallbackOptions() {
    return [
        { name: 'PAC',   company: 'Correios', price: 15.90, days: '5–8 dias úteis' },
        { name: 'SEDEX', company: 'Correios', price: 25.90, days: '2–3 dias úteis' },
    ];
}

module.exports = new CheckoutController();