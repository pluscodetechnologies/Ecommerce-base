const express = require('express');
const router  = express.Router();
const { getDB } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/colors/:productId — público
router.get('/:productId', async (req, res) => {
    try {
        const db = getDB();
        const [colors] = await db.execute(
            `SELECT id, name, hex, stock, images
             FROM product_colors
             WHERE product_id = ?
             ORDER BY name`,
            [req.params.productId]
        );
        colors.forEach(c => {
            // mysql2 com coluna JSON já retorna objeto; se for string, parseia
            if (typeof c.images === 'string') {
                try { c.images = JSON.parse(c.images); } catch { c.images = []; }
            }
            if (!Array.isArray(c.images)) c.images = [];
        });
        res.json({ success: true, data: colors });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: 'Erro ao buscar cores' });
    }
});

// POST /api/colors/:productId — admin: salva todas as cores
router.post('/:productId', authMiddleware, adminMiddleware, async (req, res) => {
    const db        = getDB();
    const productId = req.params.productId;
    const { colors } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('DELETE FROM product_colors WHERE product_id = ?', [productId]);

        if (colors && colors.length) {
            for (const c of colors) {
                if (!c.name) continue;
                const imgs = Array.isArray(c.images) ? c.images : [];
                await connection.execute(
                    `INSERT INTO product_colors (product_id, name, hex, stock, images)
                     VALUES (?, ?, ?, ?, ?)`,
                    [productId, c.name.trim(), c.hex || null,
                     parseInt(c.stock) || 0,
                     JSON.stringify(imgs)]
                );
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(500).json({ success: false, message: 'Erro ao salvar cores' });
    } finally {
        connection.release();
    }
});

module.exports = router;