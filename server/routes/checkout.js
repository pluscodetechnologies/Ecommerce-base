const express = require('express');
const router  = express.Router();
const checkoutController = require('../controllers/checkoutController');

router.post('/shipping',       (req, res) => checkoutController.calculateShipping(req, res));
router.post('/shipping-proxy', (req, res) => checkoutController.shippingProxy(req, res));
router.post('/order',          (req, res) => checkoutController.createOrder(req, res));
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => checkoutController.handleWebhook(req, res));

module.exports = router;