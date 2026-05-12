const express = require('express');
const router  = express.Router();

const checkoutController = require('../controllers/checkoutController');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { webhookLimiter } = require('../middleware/rateLimits');
const {
    createOrderSchema,
    calculateShippingSchema,
} = require('../schemas/checkout.schema');

// Cálculo de frete: público (precisa funcionar antes do login)
router.post('/shipping',
    validate({ body: calculateShippingSchema }),
    (req, res) => checkoutController.calculateShipping(req, res));

router.post('/shipping-proxy',
    validate({ body: calculateShippingSchema }),
    (req, res) => checkoutController.shippingProxy(req, res));

// Criar pedido: aceita logado e deslogado (guest checkout) — controller checa
router.post('/order',
    optionalAuthMiddleware,
    validate({ body: createOrderSchema }),
    (req, res) => checkoutController.createOrder(req, res));

// Webhook: validação de assinatura está dentro do controller.
// IMPORTANTE: express.raw() é obrigatório porque a assinatura HMAC do MP
// é calculada sobre o body cru. Se passar pelo express.json() antes, a
// validação falha (espaços, ordem de chaves etc. mudam o hash).
router.post('/webhook',
    webhookLimiter,
    express.raw({ type: 'application/json' }),
    (req, res) => checkoutController.handleWebhook(req, res));

module.exports = router;
