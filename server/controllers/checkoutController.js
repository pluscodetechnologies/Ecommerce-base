const { getDB } = require('../config/database');
const Cart = require('../models/Cart');

class CheckoutController {
    async createOrder(req, res) {
        const connection = await getDB().getConnection();
        
        try {
            await connection.beginTransaction();
            
            const userId = req.userId || null;
            const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
            const { shipping, payment, coupon } = req.body;
            
            const cart = await Cart.getOrCreateCart(userId, sessionId);
            const items = await Cart.getCartItems(cart.id);
            
            if (items.length === 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Carrinho vazio' });
            }
            
            const subtotal = items.reduce((sum, item) => sum + (item.final_price * item.quantity), 0);
            const shippingCost = parseFloat(shipping?.cost) || 0;
            let discountAmount = 0;
            let couponData = null;

            if (coupon) {
                const [couponRows] = await connection.execute(
                    'SELECT * FROM coupons WHERE code = ? AND status = "active"',
                    [coupon.trim().toUpperCase()]
                );

                if (couponRows.length) {
                    couponData = couponRows[0];
                    const isExpired = couponData.expires_at && new Date(couponData.expires_at) < new Date();
                    const isExhausted = couponData.max_uses && couponData.used_count >= couponData.max_uses;

                    let alreadyUsed = false;
                    if (couponData.max_uses === 1 && userId) {
                        const [usage] = await connection.execute(
                            'SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
                            [couponData.id, userId]
                        );
                        alreadyUsed = usage.length > 0;
                    }

                    if (!isExpired && !isExhausted && !alreadyUsed) {
                        if (couponData.discount_type === 'percentage') {
                            discountAmount = subtotal * (couponData.discount_value / 100);
                        } else {
                            discountAmount = parseFloat(couponData.discount_value);
                        }
                    }
                }
            }
            
            const totalAmount = subtotal + shippingCost - discountAmount;
            const orderNumber = 'VLT' + Date.now().toString().slice(-8);
            
            const shippingAddress = JSON.stringify({
                name: shipping.name,
                street: shipping.street,
                number: shipping.number,
                complement: shipping.complement || '',
                neighborhood: shipping.neighborhood,
                city: shipping.city,
                state: shipping.state,
                zip_code: shipping.zip_code
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
            }
            
            await Cart.clearCart(cart.id);

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

            await connection.commit();
            
            res.json({ success: true, orderId, orderNumber, totalAmount });
            
        } catch (error) {
            await connection.rollback();
            console.error('Erro ao criar pedido:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            connection.release();
        }
    }
    
    async calculateShipping(req, res) {
        try {
            const { zipcode } = req.body;
            const cleanZipcode = zipcode.replace(/\D/g, '');
            
            if (cleanZipcode.length !== 8) {
                return res.status(400).json({ success: false, message: 'CEP inválido' });
            }
            
            const options = [
                { name: 'PAC', code: '04510', price: 15.90, days: '5-8 dias úteis' },
                { name: 'SEDEX', code: '04014', price: 25.90, days: '2-3 dias úteis' }
            ];
            
            res.json({ success: true, data: options });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao calcular frete' });
        }
    }
}

module.exports = new CheckoutController();