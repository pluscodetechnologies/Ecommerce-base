const express = require("express");
const router = express.Router();
const { getDB } = require("../config/database");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createReviewSchema,
  productIdParamSchema,
  idParamSchema,
} = require("../schemas/checkout.schema");

router.get(
  "/:productId",
  validate({ params: productIdParamSchema }),
  async (req, res) => {
    try {
      const db = getDB();
      const [reviews] = await db.execute(
        `
                SELECT r.id, r.rating, r.title, r.comment, r.images, r.created_at, r.user_id, u.name as user_name
                FROM product_reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.product_id = ? AND r.status = 'approved'
                ORDER BY r.created_at DESC
            `,
        [req.params.productId],
      );

      const [stats] = await db.execute(
        `
                SELECT COUNT(*) as total, ROUND(AVG(rating), 1) as average,
                       SUM(rating = 5) as five, SUM(rating = 4) as four,
                       SUM(rating = 3) as three, SUM(rating = 2) as two, SUM(rating = 1) as one
                FROM product_reviews
                WHERE product_id = ? AND status = 'approved'
            `,
        [req.params.productId],
      );

      res.json({ success: true, data: reviews, stats: stats[0] });
    } catch (e) {
      console.error("[reviews.get]", e);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar avaliações" });
    }
  },
);

router.post(
  "/:productId",
  authMiddleware,
  validate({ params: productIdParamSchema, body: createReviewSchema }),
  async (req, res) => {
    try {
      const db = getDB();
      const { rating, title, comment, images } = req.body;
      const productId = req.params.productId;
      const userId = req.userId;

      const [purchases] = await db.execute(
        `
                SELECT oi.id FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.user_id = ? AND oi.product_id = ?
                  AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
                LIMIT 1
            `,
        [userId, productId],
      );

      if (!purchases.length) {
        return res.status(403).json({
          success: false,
          message: "Você precisa ter comprado este produto para avaliá-lo.",
        });
      }

      const [existing] = await db.execute(
        "SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?",
        [productId, userId],
      );
      if (existing.length) {
        return res
          .status(400)
          .json({ success: false, message: "Você já avaliou este produto." });
      }

      const imagesJson =
        Array.isArray(images) && images.length
          ? JSON.stringify(images.slice(0, 5))
          : null;

      await db.execute(
        `INSERT INTO product_reviews (product_id, user_id, rating, title, comment, images, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
        [productId, userId, rating, title || "", comment || "", imagesJson],
      );

      res.json({ success: true, message: "Avaliação enviada com sucesso!" });
    } catch (e) {
      console.error("[reviews.create]", e);
      res
        .status(500)
        .json({ success: false, message: "Erro ao enviar avaliação" });
    }
  },
);

router.delete(
  "/:id",
  authMiddleware,
  validate({ params: idParamSchema }),
  async (req, res) => {
    try {
      const db = getDB();
      const [rows] = await db.execute(
        "SELECT user_id FROM product_reviews WHERE id = ?",
        [req.params.id],
      );
      if (!rows.length)
        return res
          .status(404)
          .json({ success: false, message: "Avaliação não encontrada" });

      if (rows[0].user_id !== req.userId && req.userRole !== "admin") {
        return res
          .status(403)
          .json({ success: false, message: "Sem permissão" });
      }

      await db.execute("DELETE FROM product_reviews WHERE id = ?", [
        req.params.id,
      ]);
      res.json({ success: true });
    } catch (e) {
      console.error("[reviews.delete]", e);
      res
        .status(500)
        .json({ success: false, message: "Erro ao deletar avaliação" });
    }
  },
);

module.exports = router;
