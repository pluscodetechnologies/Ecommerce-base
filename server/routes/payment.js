const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');

router.post('/webhook', paymentController.webhook.bind(paymentController));
router.get('/methods', paymentController.getPaymentMethods.bind(paymentController));

router.use(authMiddleware);

router.post('/checkout', paymentController.createCheckout.bind(paymentController));
router.post('/pix', paymentController.createPix.bind(paymentController));
router.post('/card', paymentController.createCardPayment.bind(paymentController));
router.post('/boleto', paymentController.createBoleto.bind(paymentController));
router.get('/status/:orderId', paymentController.getStatus.bind(paymentController));
router.get('/installments', paymentController.getInstallments.bind(paymentController));

module.exports = router;