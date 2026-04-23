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

    async createPreference(orderData) {
    try {
        const preference = {
            items: orderData.items.map(item => ({
                id: item.product_id.toString(),
                title: item.name,
                description: item.name,
                quantity: item.quantity,
                currency_id: 'BRL',
                unit_price: Number(item.price)
            })),
            payer: {
                name: orderData.customer.name,
                email: orderData.customer.email
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL}/checkout-success`,
                failure: `${process.env.FRONTEND_URL}/checkout-error`,
                pending: `${process.env.FRONTEND_URL}/checkout-pending`
            },
            external_reference: orderData.order_id.toString(),
            statement_descriptor: 'VELVET ATELIER'
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
        return { success: false, error: error.response?.data?.message || 'Erro ao processar pagamento' };
    }
}

    async createPixPayment(paymentData) {
        try {
            const payment = {
                transaction_amount: Number(paymentData.amount),
                description: paymentData.description,
                payment_method_id: 'pix',
                payer: {
                    email: paymentData.email,
                    first_name: paymentData.first_name,
                    last_name: paymentData.last_name
                }
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
                qr_code_base64: response.data.point_of_interaction?.transaction_data?.qr_code_base64
            };
        } catch (error) {
            console.error('Erro ao criar PIX:', error.response?.data || error.message);
            return { success: false, error: error.response?.data?.message || 'Erro ao gerar PIX' };
        }
    }

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
                }
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
            return { success: false, error: error.response?.data?.message || 'Erro ao processar pagamento' };
        }
    }

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
                }
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
            return { success: false, error: error.response?.data?.message || 'Erro ao gerar boleto' };
        }
    }

    async getPaymentStatus(paymentId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/v1/payments/${paymentId}`,
                { headers: this.headers }
            );
            
            return {
                success: true,
                data: {
                    status: response.data.status,
                    status_detail: response.data.status_detail,
                    qr_code: response.data.point_of_interaction?.transaction_data?.qr_code,
                    qr_code_base64: response.data.point_of_interaction?.transaction_data?.qr_code_base64
                }
            };
        } catch (error) {
            return { success: false };
        }
    }
}

module.exports = new MercadoPagoService();