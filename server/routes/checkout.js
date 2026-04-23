const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { authMiddleware } = require('../middleware/auth');

router.post('/shipping', checkoutController.calculateShipping.bind(checkoutController));
router.post('/order', authMiddleware, checkoutController.createOrder.bind(checkoutController));
router.get('/order/:orderId', authMiddleware, checkoutController.getOrder.bind(checkoutController));

module.exports = router;