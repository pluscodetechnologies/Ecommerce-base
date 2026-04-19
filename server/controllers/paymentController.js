const paymentService = require('../services/paymentService');
const Order = require('../models/Order');
const { getDB } = require('../config/database');

class PaymentController {
    // Criar checkout
    async createCheckout(req, res) {
        try {
            const { orderId } = req.body;
            
            // Buscar pedido
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
            }

            // Verificar se o pedido pertence ao usuário
            if (order.user_id !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            // Preparar dados para o Mercado Pago
            const orderData = {
                order_id: order.id,
                items: order.items,
                customer: {
                    name: req.user.name,
                    email: req.user.email,
                    cpf: req.user.cpf,
                    phone: req.user.phone
                },
                shipping: order.shipping_address ? {
                    cost: order.shipping_amount,
                    ...JSON.parse(order.shipping_address)
                } : null
            };

            // Criar preferência no Mercado Pago
            const preference = await paymentService.createPreference(orderData);

            if (!preference.success) {
                return res.status(400).json({
                    success: false,
                    message: preference.error
                });
            }

            // Salvar preference_id no pedido
            const db = getDB();
            await db.execute(
                'UPDATE orders SET payment_preference_id = ? WHERE id = ?',
                [preference.preference_id, orderId]
            );

            res.json({
                success: true,
                data: {
                    preference_id: preference.preference_id,
                    init_point: preference.init_point,
                    sandbox_init_point: preference.sandbox_init_point
                }
            });
        } catch (error) {
            console.error('Erro ao criar checkout:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao processar checkout'
            });
        }
    }

    // Criar pagamento PIX
    async createPix(req, res) {
        try {
            const { orderId } = req.body;
            
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
            }

            const paymentData = {
                amount: order.total_amount,
                description: `Pedido #${order.order_number}`,
                email: req.user.email,
                first_name: req.user.name.split(' ')[0],
                last_name: req.user.name.split(' ').slice(1).join(' ') || req.user.name,
                cpf: req.user.cpf
            };

            const pixPayment = await paymentService.createPixPayment(paymentData);

            if (!pixPayment.success) {
                return res.status(400).json({
                    success: false,
                    message: pixPayment.error
                });
            }

            // Atualizar pedido com informações do PIX
            const db = getDB();
            await db.execute(
                `UPDATE orders 
                 SET payment_method = 'pix', 
                     payment_id = ?,
                     payment_status = 'pending'
                 WHERE id = ?`,
                [pixPayment.payment_id, orderId]
            );

            res.json({
                success: true,
                data: {
                    payment_id: pixPayment.payment_id,
                    qr_code: pixPayment.qr_code,
                    qr_code_base64: pixPayment.qr_code_base64,
                    ticket_url: pixPayment.ticket_url
                }
            });
        } catch (error) {
            console.error('Erro ao criar PIX:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar PIX'
            });
        }
    }

    // Criar pagamento com Cartão
    async createCardPayment(req, res) {
        try {
            const { orderId, cardToken, paymentMethodId, issuerId, installments } = req.body;
            
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
            }

            const paymentData = {
                amount: order.total_amount,
                card_token: cardToken,
                payment_method_id: paymentMethodId,
                issuer_id: issuerId,
                installments: installments || 1,
                description: `Pedido #${order.order_number}`,
                email: req.user.email,
                cpf: req.user.cpf
            };

            const cardPayment = await paymentService.createCardPayment(paymentData);

            if (!cardPayment.success) {
                return res.status(400).json({
                    success: false,
                    message: cardPayment.error
                });
            }

            // Atualizar pedido com informações do pagamento
            const db = getDB();
            await db.execute(
                `UPDATE orders 
                 SET payment_method = 'credit_card', 
                     payment_id = ?,
                     payment_status = ?,
                     status = ?
                 WHERE id = ?`,
                [cardPayment.payment_id, cardPayment.status, 
                 cardPayment.status === 'approved' ? 'paid' : 'pending', orderId]
            );

            // Se pagamento aprovado, baixar estoque
            if (cardPayment.status === 'approved') {
                await this.updateStock(orderId);
            }

            res.json({
                success: true,
                data: {
                    payment_id: cardPayment.payment_id,
                    status: cardPayment.status,
                    status_detail: cardPayment.status_detail
                }
            });
        } catch (error) {
            console.error('Erro ao processar cartão:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao processar pagamento com cartão'
            });
        }
    }

    // Criar pagamento com Boleto
    async createBoleto(req, res) {
        try {
            const { orderId } = req.body;
            
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
            }

            const paymentData = {
                amount: order.total_amount,
                description: `Pedido #${order.order_number}`,
                email: req.user.email,
                first_name: req.user.name.split(' ')[0],
                last_name: req.user.name.split(' ').slice(1).join(' ') || req.user.name,
                cpf: req.user.cpf,
                address: order.shipping_address ? JSON.parse(order.shipping_address) : null
            };

            const boletoPayment = await paymentService.createBoletoPayment(paymentData);

            if (!boletoPayment.success) {
                return res.status(400).json({
                    success: false,
                    message: boletoPayment.error
                });
            }

            // Atualizar pedido com informações do boleto
            const db = getDB();
            await db.execute(
                `UPDATE orders 
                 SET payment_method = 'boleto', 
                     payment_id = ?,
                     payment_status = 'pending'
                 WHERE id = ?`,
                [boletoPayment.payment_id, orderId]
            );

            res.json({
                success: true,
                data: {
                    payment_id: boletoPayment.payment_id,
                    boleto_url: boletoPayment.boleto_url,
                    boleto_barcode: boletoPayment.boleto_barcode
                }
            });
        } catch (error) {
            console.error('Erro ao criar boleto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar boleto'
            });
        }
    }

    // Webhook do Mercado Pago
    async webhook(req, res) {
        try {
            const { type, data } = req.body;
            
            // Validar assinatura do webhook
            const signature = req.headers['x-signature'];
            const requestId = req.headers['x-request-id'];
            
            if (!paymentService.validateWebhookSignature(signature, requestId, data?.id)) {
                return res.status(401).json({ success: false, message: 'Assinatura inválida' });
            }

            if (type === 'payment') {
                const paymentId = data.id;
                
                // Buscar status atualizado do pagamento
                const paymentStatus = await paymentService.getPaymentStatus(paymentId);
                
                if (paymentStatus.success) {
                    // Buscar pedido pelo payment_id
                    const db = getDB();
                    const [orders] = await db.execute(
                        'SELECT * FROM orders WHERE payment_id = ?',
                        [paymentId]
                    );

                    if (orders.length > 0) {
                        const order = orders[0];
                        
                        // Atualizar status do pedido
                        let orderStatus = 'pending';
                        if (paymentStatus.status === 'approved') {
                            orderStatus = 'paid';
                            // Baixar estoque
                            await this.updateStock(order.id);
                        } else if (paymentStatus.status === 'rejected') {
                            orderStatus = 'cancelled';
                        }

                        await db.execute(
                            `UPDATE orders 
                             SET payment_status = ?, status = ?, updated_at = NOW()
                             WHERE id = ?`,
                            [paymentStatus.status, orderStatus, order.id]
                        );

                        // Enviar email de confirmação se pagamento aprovado
                        if (paymentStatus.status === 'approved') {
                            // Implementar envio de email
                            console.log(`Pedido #${order.order_number} pago com sucesso!`);
                        }
                    }
                }
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Erro no webhook:', error);
            res.status(500).json({ success: false, message: 'Erro ao processar webhook' });
        }
    }

    // Consultar status do pagamento
    async getStatus(req, res) {
        try {
            const { orderId } = req.params;
            
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
            }

            // Verificar permissão
            if (order.user_id !== req.userId && req.userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado'
                });
            }

            if (!order.payment_id) {
                return res.json({
                    success: true,
                    data: {
                        status: 'pending',
                        message: 'Aguardando pagamento'
                    }
                });
            }

            const paymentStatus = await paymentService.getPaymentStatus(order.payment_id);

            res.json({
                success: true,
                data: {
                    status: paymentStatus.status,
                    status_detail: paymentStatus.status_detail,
                    date_approved: paymentStatus.date_approved,
                    payment_method: paymentStatus.payment_method_id
                }
            });
        } catch (error) {
            console.error('Erro ao consultar status:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao consultar status do pagamento'
            });
        }
    }

    // Buscar métodos de pagamento disponíveis
    async getPaymentMethods(req, res) {
        try {
            const methods = await paymentService.getPaymentMethods();
            res.json(methods);
        } catch (error) {
            console.error('Erro ao buscar métodos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar métodos de pagamento'
            });
        }
    }

    // Buscar opções de parcelamento
    async getInstallments(req, res) {
        try {
            const { amount, payment_method_id, issuer_id } = req.query;
            
            const installments = await paymentService.getInstallments(
                amount, 
                payment_method_id, 
                issuer_id
            );
            
            res.json(installments);
        } catch (error) {
            console.error('Erro ao buscar parcelas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar opções de parcelamento'
            });
        }
    }

    // Função auxiliar para baixar estoque
    async updateStock(orderId) {
        const db = getDB();
        
        // Buscar itens do pedido
        const [items] = await db.execute(
            `SELECT oi.*, pv.id as variation_id
             FROM order_items oi
             LEFT JOIN product_variations pv ON oi.variation_id = pv.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        // Baixar estoque de cada item
        for (const item of items) {
            if (item.variation_id) {
                // Baixar estoque da variação
                await db.execute(
                    'UPDATE product_variations SET stock = stock - ? WHERE id = ? AND stock >= ?',
                    [item.quantity, item.variation_id, item.quantity]
                );
            } else {
                // Baixar estoque do produto
                await db.execute(
                    'UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ? AND stock >= ?',
                    [item.quantity, item.quantity, item.product_id, item.quantity]
                );
            }
        }
    }
}

module.exports = new PaymentController();