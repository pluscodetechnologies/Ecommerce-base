const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { productIdParamSchema } = require('../schemas/checkout.schema');

router.use(authMiddleware);

// GET /api/wishlist
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const [items] = await db.execute(`
            SELECT w.id, w.product_id, w.created_at,
                   p.name, p.price, p.promotional_price,
                   COALESCE(p.images, '[]') as images,
                   p.stock, p.slug
            FROM wishlists w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = ? AND p.status = 'active'
            ORDER BY w.created_at DESC
        `, [req.userId]);

        items.forEach(p => {
            try { p.images = JSON.parse(p.images); } catch { p.images = []; }
            p.main_image        = p.images[0] || 'https://via.placeholder.com/400x500';
            p.price             = parseFloat(p.price) || 0;
            p.promotional_price = p.promotional_price ? parseFloat(p.promotional_price) : null;
        });

        res.json({ success: true, data: items });
    } catch (e) {
        console.error('[wishlist.get]', e);
        res.status(500).json({ success: false, message: 'Erro ao buscar favoritos' });
    }
});

// POST /api/wishlist/:productId — toggle
router.post('/:productId',
    validate({ params: productIdParamSchema }),
    async (req, res) => {
        try {
            const db        = getDB();
            const productId = req.params.productId;
            const userId    = req.userId;

            const [existing] = await db.execute(
                'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );

            if (existing.length) {
                await db.execute('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);
                res.json({ success: true, action: 'removed' });
            } else {
                await db.execute('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [userId, productId]);
                res.json({ success: true, action: 'added' });
            }
        } catch (e) {
            console.error('[wishlist.toggle]', e);
            res.status(500).json({ success: false, message: 'Erro ao atualizar favoritos' });
        }
    }
);

module.exports = router;
