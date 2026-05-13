const express = require("express");
const router = express.Router();
const { getDB } = require("../config/database");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.execute(
      `SELECT id, street, number, complement, neighborhood, city, state, zip_code, is_default
             FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [req.userId],
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error("[addresses.get]", e);
    res
      .status(500)
      .json({ success: false, message: "Erro ao buscar endereços" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zip_code,
      is_default,
    } = req.body;
    if (!street || !number || !city || !state || !zip_code) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Preencha todos os campos obrigatórios",
        });
    }
    const db = getDB();
    if (is_default) {
      await db.execute(
        "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?",
        [req.userId],
      );
    }
    const [result] = await db.execute(
      `INSERT INTO user_addresses (user_id, street, number, complement, neighborhood, city, state, zip_code, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        street,
        number,
        complement || null,
        neighborhood,
        city,
        state,
        zip_code,
        is_default ? 1 : 0,
      ],
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    console.error("[addresses.post]", e);
    res
      .status(500)
      .json({ success: false, message: "Erro ao salvar endereço" });
  }
});

router.put("/:id/default", async (req, res) => {
  try {
    const db = getDB();
    await db.execute(
      "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?",
      [req.userId],
    );
    await db.execute(
      "UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId],
    );
    res.json({ success: true });
  } catch (e) {
    console.error("[addresses.default]", e);
    res
      .status(500)
      .json({ success: false, message: "Erro ao atualizar endereço" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    await db.execute(
      "DELETE FROM user_addresses WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId],
    );
    res.json({ success: true });
  } catch (e) {
    console.error("[addresses.delete]", e);
    res
      .status(500)
      .json({ success: false, message: "Erro ao remover endereço" });
  }
});

module.exports = router;
