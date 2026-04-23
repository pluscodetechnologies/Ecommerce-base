const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

router.post('/shipping', (req, res) => checkoutController.calculateShipping(req, res));
router.post('/order', (req, res) => checkoutController.createOrder(req, res));

module.exports = router;