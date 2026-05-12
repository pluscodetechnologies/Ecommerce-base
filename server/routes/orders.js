const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/database');
const { authMiddleware, requireOwnership } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParamSchema } = require('../schemas/checkout.schema');

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// ── GET /api/orders — lista pedidos do usuário logado ──────────────────────────
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const [orders] = await db.execute(`
            SELECT o.id, o.order_number, o.status, o.payment_status,
                   o.total_amount, o.shipping_amount, o.discount_amount,
                   o.payment_method, o.shipping_tracking, o.created_at, o.updated_at
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `, [req.userId]);

        for (const order of orders) {
            const [items] = await db.execute(`
                SELECT oi.product_name, oi.quantity, oi.unit_price, oi.total_price, p.images
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
        console.error('[orders.get]', e);
        res.status(500).json({ success: false, message: 'Erro ao buscar pedidos' });
    }
});

// ── GET /api/orders/:id — detalhe de UM pedido (só dono ou admin) ─────────────
router.get('/:id',
    validate({ params: idParamSchema }),
    async (req, res) => {
        try {
            const db = getDB();
            const orderId = req.params.id;

            // OWNERSHIP CHECK: o pedido pertence ao usuário? (admin tem bypass)
            const isOwner = await requireOwnership(db, 'orders', orderId, req.userId, 'user_id');
            if (!isOwner && req.userRole !== 'admin') {
                return res.status(403).json({ success: false, message: 'Acesso negado' });
            }

            const [orders] = await db.execute(
                `SELECT id, order_number, status, payment_status, customer_name, customer_email,
                        total_amount, shipping_amount, discount_amount, payment_method,
                        shipping_tracking, shipping_address, created_at, updated_at
                 FROM orders WHERE id = ?`,
                [orderId]
            );
            if (!orders.length) {
                return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
            }

            const [items] = await db.execute(
                `SELECT oi.product_name, oi.quantity, oi.unit_price, oi.total_price, p.images
                 FROM order_items oi
                 LEFT JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = ?`,
                [orderId]
            );
            items.forEach(i => {
                let imgs = [];
                try { imgs = typeof i.images === 'string' ? JSON.parse(i.images) : (i.images || []); } catch {}
                i.image = imgs[0] || null;
                delete i.images;
            });

            res.json({ success: true, data: { ...orders[0], items } });
        } catch (e) {
            console.error('[orders.get-by-id]', e);
            res.status(500).json({ success: false, message: 'Erro ao buscar pedido' });
        }
    }
);

module.exports = router;
