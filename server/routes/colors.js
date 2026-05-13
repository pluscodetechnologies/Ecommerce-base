const express = require("express");
const router = express.Router();
const { getDB } = require("../config/database");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

router.get("/:productId", async (req, res) => {
  try {
    const db = getDB();
    let colors;

    try {
      [colors] = await db.execute(
        `SELECT id, name, hex, stock, images, sort_order
                 FROM product_colors
                 WHERE product_id = ?
                 ORDER BY sort_order ASC, name`,
        [req.params.productId],
      );
    } catch (e) {
      [colors] = await db.execute(
        `SELECT id, name, hex, stock, images
                 FROM product_colors
                 WHERE product_id = ?
                 ORDER BY name`,
        [req.params.productId],
      );
    }

    colors.forEach((c) => {
      if (typeof c.images === "string") {
        try {
          c.images = JSON.parse(c.images);
        } catch {
          c.images = [];
        }
      }
      if (!Array.isArray(c.images)) c.images = [];
    });

    res.json({ success: true, data: colors });
  } catch (e) {
    console.error("Erro GET colors:", e);
    res.status(500).json({ success: false, message: "Erro ao buscar cores" });
  }
});

router.post(
  "/:productId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const db = getDB();
    const productId = req.params.productId;
    const { colors } = req.body;

    console.log(
      "[colors POST] productId:",
      productId,
      "| cores recebidas:",
      JSON.stringify(
        (colors || []).map((c, i) => ({
          i,
          name: c.name,
          sort_order: c.sort_order,
        })),
      ),
    );

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "DELETE FROM product_colors WHERE product_id = ?",
        [productId],
      );

      if (colors && colors.length) {
        const validColors = colors.filter((c) => c.name && c.name.trim());

        let hasSortOrder = true;
        try {
          await connection.execute(
            "SELECT sort_order FROM product_colors LIMIT 0",
          );
        } catch (e) {
          hasSortOrder = false;
        }

        for (let i = 0; i < validColors.length; i++) {
          const c = validColors[i];
          const imgs = Array.isArray(c.images) ? c.images : [];
          const sortOrder = c.sort_order !== undefined ? c.sort_order : i;

          if (hasSortOrder) {
            await connection.execute(
              `INSERT INTO product_colors (product_id, name, hex, stock, images, sort_order)
                         VALUES (?, ?, ?, ?, ?, ?)`,
              [
                productId,
                c.name.trim(),
                c.hex || null,
                parseInt(c.stock) || 0,
                JSON.stringify(imgs),
                sortOrder,
              ],
            );
          } else {
            await connection.execute(
              `INSERT INTO product_colors (product_id, name, hex, stock, images)
                         VALUES (?, ?, ?, ?, ?)`,
              [
                productId,
                c.name.trim(),
                c.hex || null,
                parseInt(c.stock) || 0,
                JSON.stringify(imgs),
              ],
            );
          }
        }
      }

      await connection.commit();
      res.json({ success: true });
    } catch (e) {
      await connection.rollback();
      console.error("Erro POST colors:", e);
      res
        .status(500)
        .json({
          success: false,
          message: "Erro ao salvar cores: " + e.message,
        });
    } finally {
      connection.release();
    }
  },
);

module.exports = router;
