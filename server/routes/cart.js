const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', cartController.getCart.bind(cartController));
router.post('/add', cartController.addItem.bind(cartController));
router.put('/item/:itemId', cartController.updateItem.bind(cartController));
router.delete('/item/:itemId', cartController.removeItem.bind(cartController));
router.delete('/clear', cartController.clearCart.bind(cartController));

module.exports = router;