const { getDB } = require('../config/database');
const Cart = require('../models/Cart');
const mercadoPagoService = require('../services/mercadoPagoService');

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
                throw new Error('Carrinho vazio');
            }
            
            const subtotal = items.reduce((sum, item) => sum + (item.final_price * item.quantity), 0);
            const shippingCost = parseFloat(shipping?.cost) || 0;
            let discountAmount = 0;
            
            if (coupon === 'VELVET20') {
                discountAmount = subtotal * 0.2;
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
                [orderNumber, userId, shipping.name, shipping.email, shipping.phone, shipping.cpf,
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
            
            let paymentResult = null;
            
            if (payment.method === 'pix') {
    paymentResult = await mercadoPagoService.createPixPayment({
        amount: totalAmount,
        description: `Pedido #${orderNumber}`,
        email: shipping.email,
        first_name: shipping.name.split(' ')[0],
        last_name: shipping.name.split(' ').slice(1).join(' ') || shipping.name
    });
    
    if (paymentResult.success && paymentResult.payment_id) {
        await connection.execute(
            'UPDATE orders SET payment_id = ?, payment_method = ?, payment_status = ? WHERE id = ?',
            [paymentResult.payment_id, 'pix', 'pending', orderId]
        );
    }
} else if (payment.method === 'boleto') {
                paymentResult = await mercadoPagoService.createBoletoPayment({
                    amount: totalAmount,
                    description: `Pedido #${orderNumber}`,
                    email: shipping.email,
                    first_name: shipping.name.split(' ')[0],
                    last_name: shipping.name.split(' ').slice(1).join(' ') || shipping.name,
                    cpf: shipping.cpf,
                    address: {
                        zip_code: shipping.zip_code,
                        street: shipping.street,
                        number: shipping.number,
                        neighborhood: shipping.neighborhood,
                        city: shipping.city,
                        state: shipping.state
                    }
                });
            } else if (payment.method === 'credit_card') {
                paymentResult = await mercadoPagoService.createCardPayment({
                    amount: totalAmount,
                    card_token: payment.card_token,
                    payment_method_id: payment.payment_method_id,
                    issuer_id: payment.issuer_id,
                    installments: payment.installments,
                    description: `Pedido #${orderNumber}`,
                    email: shipping.email,
                    cpf: shipping.cpf
                });
            } else {
                const preference = await mercadoPagoService.createPreference({
                    order_id: orderId,
                    items: items.map(i => ({
                        product_id: i.product_id,
                        name: i.name,
                        quantity: i.quantity,
                        price: i.final_price
                    })),
                    customer: {
                        name: shipping.name,
                        email: shipping.email,
                        phone: shipping.phone
                    },
                    shipping: {
                        cost: shippingCost
                    }
                });
                
                if (preference.success) {
                    paymentResult = preference;
                    await connection.execute(
                        'UPDATE orders SET payment_preference_id = ? WHERE id = ?',
                        [preference.preference_id, orderId]
                    );
                }
            }
            
            if (paymentResult && paymentResult.payment_id) {
                await connection.execute(
                    'UPDATE orders SET payment_id = ?, payment_method = ? WHERE id = ?',
                    [paymentResult.payment_id, payment.method, orderId]
                );
            }
            
            await Cart.clearCart(cart.id);
            await connection.commit();
            
            res.json({
                success: true,
                orderId,
                orderNumber,
                totalAmount,
                payment: paymentResult
            });
        } catch (error) {
            await connection.rollback();
            console.error('Erro ao criar pedido:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            connection.release();
        }
    }
    
    async getOrder(req, res) {
        try {
            const db = getDB();
            const { orderId } = req.params;
            
            const [orders] = await db.execute(
                'SELECT * FROM orders WHERE id = ?',
                [orderId]
            );
            
            if (orders.length === 0) {
                return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
            }
            
            const order = orders[0];
            
            const [items] = await db.execute(
                'SELECT * FROM order_items WHERE order_id = ?',
                [orderId]
            );
            
            order.items = items;
            order.shipping_address = JSON.parse(order.shipping_address || '{}');
            
            res.json({ success: true, data: order });
        } catch (error) {
            console.error('Erro ao buscar pedido:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar pedido' });
        }
    }
    
    async calculateShipping(req, res) {
        try {
            const { zipcode, items } = req.body;
            
            const cleanZipcode = zipcode.replace(/\D/g, '');
            
            if (cleanZipcode.length !== 8) {
                return res.status(400).json({ success: false, message: 'CEP inválido' });
            }
            
            const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0.3) * item.quantity, 0);
            
            const shippingOptions = [
                { name: 'PAC', code: '04510', price: 15.90, days: '5-8 dias úteis' },
                { name: 'SEDEX', code: '04014', price: 25.90, days: '2-3 dias úteis' }
            ];
            
            setTimeout(() => {
                res.json({
                    success: true,
                    data: shippingOptions.map(opt => ({
                        ...opt,
                        price: opt.price + (totalWeight * 2)
                    }))
                });
            }, 1000);
        } catch (error) {
            console.error('Erro ao calcular frete:', error);
            res.status(500).json({ success: false, message: 'Erro ao calcular frete' });
        }
    }
}

module.exports = new CheckoutController();