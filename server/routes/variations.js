const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/variations/:productId — público
router.get('/:productId', async (req, res) => {
    try {
        const db = getDB();
        const [variations] = await db.execute(
            `SELECT id, size, color, images, stock, price_adjustment, sku
             FROM product_variations
             WHERE product_id = ?
             ORDER BY color, size`,
            [req.params.productId]
        );

        // Parse images JSON
        variations.forEach(v => {
            try { v.images = v.images ? JSON.parse(v.images) : []; }
            catch { v.images = []; }
        });

        res.json({ success: true, data: variations });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Erro ao buscar variações' });
    }
});

// POST /api/variations/:productId — admin: salva todas as variações
router.post('/:productId', authMiddleware, adminMiddleware, async (req, res) => {
    const db        = getDB();
    const productId = req.params.productId;
    const { variations } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.execute(
            'DELETE FROM product_variations WHERE product_id = ?',
            [productId]
        );

        if (variations && variations.length) {
            for (const v of variations) {
                if (!v.size && !v.color) continue;
                const imagesJson = JSON.stringify(Array.isArray(v.images) ? v.images : []);
                await connection.execute(
                    `INSERT INTO product_variations (product_id, size, color, images, stock, price_adjustment, sku)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [productId,
                     v.size  || null,
                     v.color || null,
                     imagesJson,
                     parseInt(v.stock) || 0,
                     parseFloat(v.price_adjustment) || 0,
                     v.sku || null]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Variações salvas!' });
    } catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(500).json({ success: false, message: 'Erro ao salvar variações' });
    } finally {
        connection.release();
    }
});

module.exports = router;