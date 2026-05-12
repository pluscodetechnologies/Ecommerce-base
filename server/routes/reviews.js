const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
    createReviewSchema,
    productIdParamSchema,
    idParamSchema,
} = require('../schemas/checkout.schema');

// GET /api/reviews/:productId — público
router.get('/:productId',
    validate({ params: productIdParamSchema }),
    async (req, res) => {
        try {
            const db = getDB();
            const [reviews] = await db.execute(`
                SELECT r.id, r.rating, r.title, r.comment, r.created_at, u.name as user_name
                FROM product_reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.product_id = ? AND r.status = 'approved'
                ORDER BY r.created_at DESC
            `, [req.params.productId]);

            const [stats] = await db.execute(`
                SELECT COUNT(*) as total, ROUND(AVG(rating), 1) as average,
                       SUM(rating = 5) as five, SUM(rating = 4) as four,
                       SUM(rating = 3) as three, SUM(rating = 2) as two, SUM(rating = 1) as one
                FROM product_reviews
                WHERE product_id = ? AND status = 'approved'
            `, [req.params.productId]);

            res.json({ success: true, data: reviews, stats: stats[0] });
        } catch (e) {
            console.error('[reviews.get]', e);
            res.status(500).json({ success: false, message: 'Erro ao buscar avaliações' });
        }
    }
);

// POST /api/reviews/:productId — requer login + compra confirmada
router.post('/:productId',
    authMiddleware,
    validate({ params: productIdParamSchema, body: createReviewSchema }),
    async (req, res) => {
        try {
            const db        = getDB();
            const { rating, title, comment } = req.body;
            const productId = req.params.productId;
            const userId    = req.userId;

            // Só pode avaliar quem comprou
            const [purchases] = await db.execute(`
                SELECT oi.id FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'paid'
                LIMIT 1
            `, [userId, productId]);

            if (!purchases.length) {
                return res.status(403).json({
                    success: false,
                    message: 'Você precisa ter comprado este produto para avaliá-lo.',
                });
            }

            // Evita avaliação duplicada
            const [existing] = await db.execute(
                'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?',
                [productId, userId]
            );
            if (existing.length) {
                return res.status(400).json({ success: false, message: 'Você já avaliou este produto.' });
            }

            await db.execute(
                `INSERT INTO product_reviews (product_id, user_id, rating, title, comment, status)
                 VALUES (?, ?, ?, ?, ?, 'approved')`,
                [productId, userId, rating, title || '', comment || '']
            );

            res.json({ success: true, message: 'Avaliação enviada com sucesso!' });
        } catch (e) {
            console.error('[reviews.create]', e);
            res.status(500).json({ success: false, message: 'Erro ao enviar avaliação' });
        }
    }
);

// DELETE /api/reviews/:id — somente admin
router.delete('/:id',
    authMiddleware,
    adminMiddleware,
    validate({ params: idParamSchema }),
    async (req, res) => {
        try {
            const db = getDB();
            await db.execute('DELETE FROM product_reviews WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (e) {
            console.error('[reviews.delete]', e);
            res.status(500).json({ success: false, message: 'Erro ao deletar avaliação' });
        }
    }
);

module.exports = router;
