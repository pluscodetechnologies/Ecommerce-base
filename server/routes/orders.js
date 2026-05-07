const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/orders — lista pedidos pagos do usuário logado
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const [orders] = await db.execute(`
            SELECT o.id, o.order_number, o.status, o.payment_status,
                   o.total_amount, o.shipping_amount, o.discount_amount,
                   o.payment_method, o.shipping_tracking, o.created_at, o.updated_at
            FROM orders o
            WHERE o.user_id = ? AND o.payment_status = 'approved'
            ORDER BY o.created_at DESC
        `, [req.userId]);

        for (const order of orders) {
            const [items] = await db.execute(`
                SELECT oi.product_name, oi.quantity, oi.unit_price, oi.total_price,
                       p.images
                FROM order_items oi
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = ?
            `, [order.id]);

            items.forEach(i => {
                let imgs = [];
                try { imgs = typeof i.images === 'string' ? JSON.parse(i.images) : (i.images || []); } catch {}
                i.image = imgs[0] || null;
                delete i.images;
            });

            order.items = items;
        }

        res.json({ success: true, data: orders });
    } catch (e) {
        console.error('Erro ao buscar pedidos:', e);
        res.status(500).json({ success: false, message: 'Erro ao buscar pedidos' });
    }
});

module.exports = router;