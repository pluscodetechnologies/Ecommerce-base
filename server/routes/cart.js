const express = require('express');
const router  = express.Router();

const cartController = require('../controllers/cartController');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { addItemSchema, updateItemSchema } = require('../schemas/checkout.schema');

// Carrinho funciona logado E deslogado (sessionId via cookie).
// optionalAuthMiddleware popula req.userId se houver token válido — sem bloquear.
router.use(optionalAuthMiddleware);

router.get('/',
    cartController.getCart.bind(cartController));

router.post('/add',
    validate({ body: addItemSchema }),
    cartController.addItem.bind(cartController));

router.put('/item/:itemId',
    validate({ body: updateItemSchema }),
    cartController.updateItem.bind(cartController));

router.delete('/item/:itemId',
    cartController.removeItem.bind(cartController));

router.delete('/clear',
    cartController.clearCart.bind(cartController));

module.exports = router;
