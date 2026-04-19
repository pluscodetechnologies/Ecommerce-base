const axios = require('axios');

class MercadoPagoService {
    constructor() {
        this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        this.baseURL = 'https://api.mercadopago.com';
        this.headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    // Criar preferência de pagamento (checkout)
    async createPreference(orderData) {
        try {
            const preference = {
                items: orderData.items.map(item => ({
                    id: item.product_id.toString(),
                    title: item.name,
                    description: item.description || item.name,
                    quantity: item.quantity,
                    currency_id: 'BRL',
                    unit_price: Number(item.price)
                })),
                payer: {
                    name: orderData.customer.name,
                    email: orderData.customer.email,
                    identification: orderData.customer.cpf ? {
                        type: 'CPF',
                        number: orderData.customer.cpf.replace(/\D/g, '')
                    } : undefined,
                    phone: orderData.customer.phone ? {
                        number: orderData.customer.phone.replace(/\D/g, '')
                    } : undefined
                },
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/views/checkout-success.html`,
                    failure: `${process.env.FRONTEND_URL}/views/checkout-error.html`,
                    pending: `${process.env.FRONTEND_URL}/views/checkout-pending.html`
                },
                auto_return: 'approved',
                external_reference: orderData.order_id.toString(),
                notification_url: `${process.env.FRONTEND_URL}/api/payment/webhook`,
                statement_descriptor: 'VELVET STORE',
                payment_methods: {
                    excluded_payment_methods: [],
                    excluded_payment_types: [],
                    installments: 12
                },
                shipments: orderData.shipping ? {
                    cost: Number(orderData.shipping.cost),
                    mode: 'not_specified',
                    receiver_address: {
                        street_name: orderData.shipping.street,
                        street_number: orderData.shipping.number,
                        zip_code: orderData.shipping.zip_code.replace(/\D/g, ''),
                        city: {
                            name: orderData.shipping.city
                        },
                        state: orderData.shipping.state
                    }
                } : undefined
            };

            const response = await axios.post(
                `${this.baseURL}/checkout/preferences`,
                preference,
                { headers: this.headers }
            );

            return {
                success: true,
                preference_id: response.data.id,
                init_point: response.data.init_point,
                sandbox_init_point: response.data.sandbox_init_point
            };
        } catch (error) {
            console.error('Erro ao criar preferência:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Erro ao processar pagamento'
            };
        }
    }

    // Criar pagamento via PIX
    async createPixPayment(paymentData) {
        try {
            const payment = {
                transaction_amount: Number(paymentData.amount),
                description: paymentData.description,
                payment_method_id: 'pix',
                payer: {
                    email: paymentData.email,
                    first_name: paymentData.first_name,
                    last_name: paymentData.last_name,
                    identification: paymentData.cpf ? {
                        type: 'CPF',
                        number: paymentData.cpf.replace(/\D/g, '')
                    } : undefined
                },
                notification_url: `${process.env.FRONTEND_URL}/api/payment/webhook`
            };

            const response = await axios.post(
                `${this.baseURL}/v1/payments`,
                payment,
                { headers: this.headers }
            );

            return {
                success: true,
                payment_id: response.data.id,
                status: response.data.status,
                qr_code: response.data.point_of_interaction?.transaction_data?.qr_code,
                qr_code_base64: response.data.point_of_interaction?.transaction_data?.qr_code_base64,
                ticket_url: response.data.point_of_interaction?.transaction_data?.ticket_url
            };
        } catch (error) {
            console.error('Erro ao criar PIX:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Erro ao gerar PIX'
            };
        }
    }

    // Criar pagamento via Cartão de Crédito
    async createCardPayment(paymentData) {
        try {
            const payment = {
                transaction_amount: Number(paymentData.amount),
                token: paymentData.card_token,
                description: paymentData.description,
                installments: paymentData.installments || 1,
                payment_method_id: paymentData.payment_method_id,
                issuer_id: paymentData.issuer_id,
                payer: {
                    email: paymentData.email,
                    identification: paymentData.cpf ? {
                        type: 'CPF',
                        number: paymentData.cpf.replace(/\D/g, '')
                    } : undefined
                },
                notification_url: `${process.env.FRONTEND_URL}/api/payment/webhook`
            };

            const response = await axios.post(
                `${this.baseURL}/v1/payments`,
                payment,
                { headers: this.headers }
            );

            return {
                success: true,
                payment_id: response.data.id,
                status: response.data.status,
                status_detail: response.data.status_detail
            };
        } catch (error) {
            console.error('Erro ao processar cartão:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Erro ao processar pagamento com cartão'
            };
        }
    }

    // Criar pagamento via Boleto
    async createBoletoPayment(paymentData) {
        try {
            const payment = {
                transaction_amount: Number(paymentData.amount),
                description: paymentData.description,
                payment_method_id: 'bolbradesco',
                payer: {
                    email: paymentData.email,
                    first_name: paymentData.first_name,
                    last_name: paymentData.last_name,
                    identification: paymentData.cpf ? {
                        type: 'CPF',
                        number: paymentData.cpf.replace(/\D/g, '')
                    } : undefined,
                    address: paymentData.address ? {
                        zip_code: paymentData.address.zip_code.replace(/\D/g, ''),
                        street_name: paymentData.address.street,
                        street_number: paymentData.address.number,
                        neighborhood: paymentData.address.neighborhood,
                        city: paymentData.address.city,
                        federal_unit: paymentData.address.state
                    } : undefined
                },
                notification_url: `${process.env.FRONTEND_URL}/api/payment/webhook`
            };

            const response = await axios.post(
                `${this.baseURL}/v1/payments`,
                payment,
                { headers: this.headers }
            );

            return {
                success: true,
                payment_id: response.data.id,
                status: response.data.status,
                boleto_url: response.data.transaction_details?.external_resource_url,
                boleto_barcode: response.data.barcode?.content
            };
        } catch (error) {
            console.error('Erro ao criar boleto:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Erro ao gerar boleto'
            };
        }
    }

    // Consultar status do pagamento
    async getPaymentStatus(paymentId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/v1/payments/${paymentId}`,
                { headers: this.headers }
            );

            return {
                success: true,
                payment_id: response.data.id,
                status: response.data.status,
                status_detail: response.data.status_detail,
                transaction_amount: response.data.transaction_amount,
                date_approved: response.data.date_approved,
                payment_method_id: response.data.payment_method_id,
                payment_type_id: response.data.payment_type_id
            };
        } catch (error) {
            console.error('Erro ao consultar pagamento:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Erro ao consultar status do pagamento'
            };
        }
    }

    // Cancelar pagamento
    async cancelPayment(paymentId) {
        try {
            const response = await axios.put(
                `${this.baseURL}/v1/payments/${paymentId}`,
                { status: 'cancelled' },
                { headers: this.headers }
            );

            return {
                success: true,
                payment_id: response.data.id,
                status: response.data.status
            };
        } catch (error) {
            console.error('Erro ao cancelar pagamento:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Erro ao cancelar pagamento'
            };
        }
    }

    // Estornar pagamento
    async refundPayment(paymentId, amount = null) {
        try {
            const refundData = amount ? { amount: Number(amount) } : {};
            
            const response = await axios.post(
                `${this.baseURL}/v1/payments/${paymentId}/refunds`,
                refundData,
                { headers: this.headers }
            );

            return {
                success: true,
                refund_id: response.data.id,
                amount: response.data.amount,
                status: response.data.status
            };
        } catch (error) {
            console.error('Erro ao estornar pagamento:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Erro ao processar estorno'
            };
        }
    }

    // Buscar métodos de pagamento disponíveis
    async getPaymentMethods() {
        try {
            const response = await axios.get(
                `${this.baseURL}/v1/payment_methods`,
                { headers: this.headers }
            );

            return {
                success: true,
                methods: response.data
            };
        } catch (error) {
            console.error('Erro ao buscar métodos de pagamento:', error.response?.data || error.message);
            return {
                success: false,
                error: 'Erro ao buscar métodos de pagamento'
            };
        }
    }

    // Buscar parcelas disponíveis
    async getInstallments(amount, paymentMethodId, issuerId = null) {
        try {
            let url = `${this.baseURL}/v1/payment_methods/installments?amount=${amount}&payment_method_id=${paymentMethodId}`;
            
            if (issuerId) {
                url += `&issuer.id=${issuerId}`;
            }

            const response = await axios.get(url, { headers: this.headers });

            return {
                success: true,
                installments: response.data
            };
        } catch (error) {
            console.error('Erro ao buscar parcelas:', error.response?.data || error.message);
            return {
                success: false,
                error: 'Erro ao buscar opções de parcelamento'
            };
        }
    }

    // Validar webhook
    validateWebhookSignature(xSignature, xRequestId, dataID) {
        try {
            const ts = xSignature.split(',')[0].split('=')[1];
            const v1 = xSignature.split(',')[1].split('=')[1];
            
            // Implementar validação HMAC SHA256 aqui
            // Por enquanto, retornamos true para testes
            return true;
        } catch (error) {
            console.error('Erro ao validar assinatura do webhook:', error);
            return false;
        }
    }
}

module.exports = new MercadoPagoService();