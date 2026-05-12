const crypto = require('crypto');
const logger = require('../config/logger');
const https  = require('https');

const { getDB } = require('../config/database');
const Cart = require('../models/Cart');
const { createPreference } = require('../services/mercadoPagoService');

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
                    logger.info(`⚠️  Melhor Envio falhou em ${host}:`, e.data || e.message);
                }
            }

            if (!resultado) {
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
            logger.error('[calculateShipping]', error?.data || error.message);
            res.json({ success: true, fallback: true, data: fallbackOptions() });
        }
    }

    // ── PROXY MELHOR ENVIO ────────────────────────────────────────────────────
    async shippingProxy(req, res) {
        // (mesmo código original, mantido)
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
            const mePayload = {
                from:    { postal_code: CEP_ORIGEM.replace(/\D/g, '') },
                to:      { postal_code: cepDestino },
                package: { height: 10, width: 15, length: 20, weight: pesoKg },
                services: '1,2',
                options: { receipt: false, own_hand: false, collect: false, insurance_value: 0 }
            };

            const userIP  = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1')
                .toString().split(',')[0].trim();
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

            if (!opcoes.length) return res.json({ success: false, message: 'Nenhuma opção disponível para este CEP.' });
            res.json({ success: true, data: opcoes });
        } catch (error) {
            logger.info('[shippingProxy] fallback:', error?.data || error.message);
            res.json({ success: true, fallback: true, data: fallbackOptions() });
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // CRIAR PEDIDO
    // ════════════════════════════════════════════════════════════════════════
    // Mudanças de segurança:
    //  - userId vem do JWT (se logado). Atacante não pode forçar userId via body.
    //  - Preço é SEMPRE recalculado no servidor (nunca confiar no que veio do client).
    //  - Cupom é revalidado server-side.
    //  - Cart precisa pertencer ao usuário (se logado) ou casar com sessionId.
    //  - Frete não vem mais como "shipping.cost" do client — recalculamos pelo nome.
    //    (Por ora mantemos o cost como veio, mas com limite máximo)
    // ════════════════════════════════════════════════════════════════════════
    async createOrder(req, res) {
        const connection = await getDB().getConnection();

        try {
            await connection.beginTransaction();

            // userId AUTORITATIVO do middleware optionalAuth (NUNCA do body)
            const userId    = req.userId || null;
            const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] || null;

            // Guest checkout precisa de sessionId
            if (!userId && !sessionId) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Sessão inválida. Recarregue a página e tente novamente.',
                });
            }

            const { shipping, payment, coupon } = req.body;

            const cart  = await Cart.getOrCreateCart(userId, sessionId);
            const items = await Cart.getCartItems(cart.id);

            if (items.length === 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Carrinho vazio' });
            }

            // ── Validação de estoque ─────────────────────────────────────────
            for (const item of items) {
                const [stockRows] = await connection.execute(
                    'SELECT stock, status FROM products WHERE id = ?',
                    [item.product_id]
                );
                if (!stockRows.length || stockRows[0].status !== 'active') {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Produto "${item.name}" não está mais disponível.`,
                    });
                }

                // Se tem variação, verifica estoque da variação específica
                if (item.variation_id) {
                    const [varStock] = await connection.execute(
                        'SELECT stock FROM product_variations WHERE id = ?',
                        [item.variation_id]
                    );
                    if (!varStock.length || varStock[0].stock < item.quantity) {
                        const varLabel = [item.variation_color, item.variation_size].filter(Boolean).join(' / ');
                        await connection.rollback();
                        return res.status(400).json({
                            success: false,
                            message: `"${item.name}" (${varLabel}) sem estoque suficiente.`,
                        });
                    }
                } else if (stockRows[0].stock < item.quantity) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Produto "${item.name}" sem estoque suficiente.`,
                    });
                }
            }

            // ── Cálculo de totais (server-side, autoritativo) ───────────────
            const subtotal = items.reduce((s, i) => s + (parseFloat(i.final_price) * i.quantity), 0);

            // Valida que o frete foi selecionado (nome obrigatório)
            if (!shipping?.name_shipping && !shipping?.shipping_name && parseFloat(shipping?.cost) === 0 && !shipping?.free_shipping) {
                // Permite frete zero apenas se vier explicitamente marcado como grátis
                // Se cost=0 e não tem nome de modalidade, é porque não selecionou frete
            }
            const shippingName = shipping?.name_shipping || shipping?.shipping_name || shipping?.freight_name || null;
            const rawCost = parseFloat(shipping?.cost);
            if (!shippingName && isNaN(rawCost)) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Selecione uma opção de frete antes de finalizar.' });
            }

            // Limite máximo absoluto pro frete (defesa contra valores absurdos vindos do client).
            const RAW_SHIPPING_MAX = 1000;
            const shippingCost = Math.min(
                Math.max(rawCost || 0, 0),
                RAW_SHIPPING_MAX
            );

            // ── Cupom (revalidação server-side) ─────────────────────────────
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

                    const isPerUserCoupon = couponData.max_uses === 1 || couponData.coupon_type === 'first_purchase';
                    if (isPerUserCoupon && userId) {
                        const [usage] = await connection.execute(
                            'SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
                            [couponData.id, userId]
                        );
                        alreadyUsed = usage.length > 0;
                    }

                    if (!alreadyUsed && couponData.coupon_type === 'first_purchase' && userId) {
                        const [prevOrders] = await connection.execute(
                            "SELECT id FROM orders WHERE user_id = ? AND payment_status = 'approved' LIMIT 1",
                            [userId]
                        );
                        if (prevOrders.length > 0) alreadyUsed = true;
                    }

                    if (!isExpired && !isExhausted && !alreadyUsed) {
                        const minPurchase = parseFloat(couponData.min_purchase || 0);
                        if (subtotal >= minPurchase) {
                            discountAmount = couponData.discount_type === 'percentage'
                                ? subtotal * (couponData.discount_value / 100)
                                : parseFloat(couponData.discount_value);
                            // Desconto nunca pode passar do subtotal
                            discountAmount = Math.min(discountAmount, subtotal);
                        }
                    }
                }
            }

            const totalAmount = Math.max(0, subtotal + shippingCost - discountAmount);
            const orderNumber = 'VLT' + Date.now().toString().slice(-8);

            const shippingAddress = JSON.stringify({
                name: shipping.name, street: shipping.street, number: shipping.number,
                complement: shipping.complement || '', neighborhood: shipping.neighborhood,
                city: shipping.city, state: shipping.state, zip_code: shipping.zip_code,
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

            // Itens com SNAPSHOT do preço atual (não confia no que veio do client)
            for (const item of items) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, product_name, color, size, variation_id, quantity, unit_price, total_price)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, item.product_id, item.name,
                     item.variation_color || null, item.variation_size || null, item.variation_id || null,
                     item.quantity, item.final_price, item.final_price * item.quantity]
                );
                // Decrementa estoque da variação específica se existir
                if (item.variation_id) {
                    await connection.execute(
                        'UPDATE product_variations SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                        [item.quantity, item.variation_id]
                    );
                    // Recalcula estoque geral do produto (soma das variações)
                    await connection.execute(
                        `UPDATE products SET
                            stock = (SELECT COALESCE(SUM(pv.stock), 0) FROM product_variations pv WHERE pv.product_id = ?),
                            sales_count = sales_count + ?
                         WHERE id = ?`,
                        [item.product_id, item.quantity, item.product_id]
                    );
                } else {
                    await connection.execute(
                        'UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?',
                        [item.quantity, item.quantity, item.product_id]
                    );
                }
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

            // Email de confirmacao (assincrono)
            try {
                const { sendOrderConfirmationEmail } = require('../services/emailService');
                const orderForEmail = {
                    order_number:     orderNumber,
                    customer_name:    shipping.name,
                    total_amount:     totalAmount,
                    shipping_amount:  shippingCost,
                    discount_amount:  discountAmount,
                    payment_method:   payment.method,
                    shipping_address: shippingAddress,
                    items:            items.map(i => ({
                        product_name: i.name,
                        quantity:     i.quantity,
                        unit_price:   parseFloat(i.final_price),
                        color:        i.color || null,
                        size:         i.size  || null,
                    })),
                };
                sendOrderConfirmationEmail(shipping.email, orderForEmail).catch(err =>
                    logger.error('[email] confirmacao de pedido falhou:', err)
                );
            } catch (emailErr) {
                logger.error('[email] erro ao importar emailService:', emailErr);
            }

            // Salvar endereco no historico (usuario logado)
            if (userId) {
                try {
                    const db = getDB();
                    const [existing] = await db.execute(
                        `SELECT id FROM user_addresses
                         WHERE user_id = ? AND zip_code = ? AND street = ? AND number = ?
                         LIMIT 1`,
                        [userId, shipping.zip_code, shipping.street, shipping.number]
                    );
                    if (!existing.length) {
                        const [count] = await db.execute(
                            'SELECT COUNT(*) as total FROM user_addresses WHERE user_id = ?',
                            [userId]
                        );
                        const isDefault = count[0].total === 0 ? 1 : 0;
                        await db.execute(
                            `INSERT INTO user_addresses
                             (user_id, street, number, complement, neighborhood, city, state, zip_code, is_default)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [userId, shipping.street, shipping.number, shipping.complement || null,
                             shipping.neighborhood, shipping.city, shipping.state,
                             shipping.zip_code.replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2'),
                             isDefault]
                        );
                    }
                } catch (addrErr) {
                    logger.error('[address] erro ao salvar endereco:', addrErr);
                }
            }

            // ── Preferência Mercado Pago ────────────────────────────────────
            const mpItems = items.map(item => ({
                id: String(item.product_id),
                title: item.name,
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

            // Salva o preference_id para usar no polling de status
            if (preference.id) {
                await getDB().execute(
                    'UPDATE orders SET payment_preference_id = ? WHERE id = ?',
                    [preference.id, orderId]
                );
            }

            // Prefere init_point em produção; sandbox_init_point em dev
            const paymentUrl = process.env.NODE_ENV === 'production'
                ? (preference.init_point || preference.sandbox_init_point)
                : (preference.sandbox_init_point || preference.init_point);

            res.json({
                success: true,
                orderId,
                orderNumber,
                totalAmount,
                paymentUrl,
            });

        } catch (error) {
            await connection.rollback();
            logger.error('[createOrder]', error);
            // Não vaza error.message — pode conter detalhes internos
            res.status(500).json({ success: false, message: 'Erro ao processar pedido. Tente novamente.' });
        } finally {
            connection.release();
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // WEBHOOK MERCADO PAGO — com validação de assinatura HMAC
    // ════════════════════════════════════════════════════════════════════════
    //
    // O MP envia headers:
    //   x-signature: ts=1234567890,v1=hexhash
    //   x-request-id: <id>
    //
    // E nós validamos com a fórmula oficial:
    //   manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    //   hmac     = HMAC-SHA256(manifest, MP_WEBHOOK_SECRET)
    //   hmac === v1 ?
    //
    // SETUP: pegue o secret em
    //   https://www.mercadopago.com.br/developers/panel/app/{APP_ID}/webhooks
    //   → "Sua chave secreta" → coloque em MP_WEBHOOK_SECRET no .env
    //
    // IMPORTANTE: o body chega como Buffer (express.raw em routes/checkout.js).
    // ════════════════════════════════════════════════════════════════════════
    verifyMercadoPagoSignature(req) {
        const secret = process.env.MP_WEBHOOK_SECRET;

        // Sem secret configurado → REJEITA em produção; em dev, aceita com aviso.
        if (!secret || secret === 'COLOQUE_SEU_SECRET_AQUI') {
            if (process.env.NODE_ENV === 'production') {
                logger.error('[webhook] MP_WEBHOOK_SECRET não configurado em produção — webhook rejeitado');
                return false;
            }
            logger.warn('[webhook] MP_WEBHOOK_SECRET ausente — aceitando em dev (NÃO USE EM PROD)');
            return true;
        }

        const xSignature = req.headers['x-signature'];
        const xRequestId = req.headers['x-request-id'];

        if (!xSignature || !xRequestId) {
            logger.warn('[webhook] headers x-signature/x-request-id ausentes');
            return false;
        }

        // x-signature vem como "ts=123,v1=abc"
        const parts = {};
        xSignature.split(',').forEach(p => {
            const [k, v] = p.split('=').map(s => s.trim());
            if (k && v) parts[k] = v;
        });

        const ts = parts.ts;
        const v1 = parts.v1;
        if (!ts || !v1) {
            logger.warn('[webhook] x-signature mal formatada');
            return false;
        }

        // Proteção contra replay attack: timestamp não pode ter mais de 5 minutos
        const tsNum = parseInt(ts);
        if (Number.isNaN(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) {
            logger.warn('[webhook] timestamp fora da janela aceita (replay attack?)');
            return false;
        }

        // dataId vem do query string (?data.id=...) ou do body parseado
        const url = new URL(req.originalUrl || req.url, 'http://x');
        let dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

        // Fallback: tenta extrair do body cru
        if (!dataId && req.body) {
            try {
                const bodyStr = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
                const parsed = JSON.parse(bodyStr);
                dataId = parsed?.data?.id || parsed?.id || '';
            } catch {}
        }
        if (!dataId) {
            logger.warn('[webhook] data.id não encontrado para validar assinatura');
            return false;
        }

        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

        try {
            // timingSafeEqual exige tamanhos iguais
            return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
        } catch {
            return false;
        }
    }

    async handleWebhook(req, res) {
        try {
            // 1) Validar assinatura ANTES de qualquer coisa
            if (!this.verifyMercadoPagoSignature(req)) {
                logger.warn('[webhook] assinatura inválida — rejeitando');
                return res.sendStatus(401);
            }

            // 2) Parse manual do body (raw Buffer)
            let parsedBody;
            try {
                const bodyStr = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
                parsedBody = bodyStr ? JSON.parse(bodyStr) : {};
            } catch (e) {
                logger.error('[webhook] body inválido');
                return res.sendStatus(400);
            }

            const { type, data } = parsedBody;

            if (type === 'payment' && data?.id) {
                const { MercadoPagoConfig, Payment } = require('mercadopago');
                const client        = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
                const paymentClient = new Payment(client);
                const payment       = await paymentClient.get({ id: data.id });

                const statusMap = {
                    approved:   'processing',  // pago → vai direto para em preparo
                    pending:    'pending',
                    in_process: 'pending',
                    rejected:   'cancelled',
                    cancelled:  'cancelled',
                    refunded:   'cancelled',
                };
                const newStatus = statusMap[payment.status] || 'pending';
                const db        = getDB();

                // Idempotência: se já está no status final, não duplica o restock
                const [currentRows] = await db.execute(
                    'SELECT id, status FROM orders WHERE order_number = ?',
                    [payment.external_reference]
                );
                if (!currentRows.length) {
                    logger.warn(`[webhook] order ${payment.external_reference} não encontrado`);
                    return res.sendStatus(200);
                }

                const currentStatus = currentRows[0].status;
                const orderId       = currentRows[0].id;

                // Se já está cancelado E newStatus também é cancelado, não restock de novo
                if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
                    const [orderItems] = await db.execute(
                        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                        [orderId]
                    );
                    for (const item of orderItems) {
                        // Restaura estoque da variação se existir
                        if (item.variation_id) {
                            await db.execute(
                                'UPDATE product_variations SET stock = stock + ? WHERE id = ?',
                                [item.quantity, item.variation_id]
                            );
                            // Recalcula estoque geral
                            await db.execute(
                                `UPDATE products SET
                                    stock = (SELECT COALESCE(SUM(pv.stock), 0) FROM product_variations pv WHERE pv.product_id = ?),
                                    sales_count = GREATEST(0, sales_count - ?)
                                 WHERE id = ?`,
                                [item.product_id, item.quantity, item.product_id]
                            );
                        } else {
                            await db.execute(
                                'UPDATE products SET stock = stock + ?, sales_count = GREATEST(0, sales_count - ?) WHERE id = ?',
                                [item.quantity, item.quantity, item.product_id]
                            );
                        }
                    }
                }

                await db.execute(
                    'UPDATE orders SET status = ?, payment_status = ?, payment_id = ? WHERE order_number = ?',
                    [newStatus, payment.status, String(data.id), payment.external_reference]
                );
            }

            res.sendStatus(200);
        } catch (error) {
            logger.error('[webhook]', error);
            res.sendStatus(500);
        }
    }
    // ════════════════════════════════════════════════════════════════════════
    // POLLING DE STATUS — consultado pelo frontend após retornar do MP
    // Busca o status diretamente na API do Mercado Pago e atualiza o pedido.
    // ════════════════════════════════════════════════════════════════════════
    async checkPaymentStatus(req, res) {
        try {
            const { orderNumber } = req.params;
            const userId = req.userId;

            const db = getDB();
            const [rows] = await db.execute(
                'SELECT id, status, payment_status, payment_id, payment_preference_id, user_id FROM orders WHERE order_number = ?',
                [orderNumber]
            );

            if (!rows.length) {
                return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
            }

            const order = rows[0];

            if (order.user_id !== userId) {
                return res.status(403).json({ success: false, message: 'Acesso negado' });
            }

            // Se já está em preparo/enviado/entregue/cancelado, retorna direto
            if (['processing', 'shipped', 'delivered', 'cancelled'].includes(order.status)) {
                return res.json({ success: true, status: order.status, payment_status: order.payment_status });
            }

            if (process.env.MP_ACCESS_TOKEN) {
                try {
                    const { MercadoPagoConfig, Payment } = require('mercadopago');
                    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
                    const paymentClient = new Payment(client);

                    let payment = null;

                    // Tenta pelo payment_id direto primeiro
                    if (order.payment_id) {
                        payment = await paymentClient.get({ id: order.payment_id });
                    }
                    // Se não tem payment_id, busca pelo preference_id (pós-pagamento no MP)
                    else if (order.payment_preference_id) {
                        const searchResult = await paymentClient.search({
                            options: { external_reference: orderNumber }
                        });
                        const items = searchResult?.results || [];
                        if (items.length > 0) {
                            // Pega o mais recente
                            payment = items.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))[0];
                        }
                    }

                    if (payment) {
                        const statusMap = {
                            approved:   'processing',  // pago → vai direto para em preparo
                            pending:    'pending',
                            in_process: 'pending',
                            rejected:   'cancelled',
                            cancelled:  'cancelled',
                            refunded:   'cancelled',
                        };
                        const newStatus = statusMap[payment.status] || 'pending';

                        // Atualiza banco se mudou
                        if (newStatus !== order.status || order.payment_status !== payment.status) {
                            await db.execute(
                                'UPDATE orders SET status = ?, payment_status = ?, payment_id = ? WHERE order_number = ?',
                                [newStatus, payment.status, String(payment.id), orderNumber]
                            );
                        }

                        return res.json({ success: true, status: newStatus, payment_status: payment.status });
                    }
                } catch (mpErr) {
                    logger.warn('[checkPaymentStatus] erro ao consultar MP:', mpErr.message);
                }
            }

            return res.json({ success: true, status: order.status, payment_status: order.payment_status });

        } catch (error) {
            logger.error('[checkPaymentStatus]', error);
            res.status(500).json({ success: false, message: 'Erro ao consultar status' });
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