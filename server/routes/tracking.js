const express = require("express");
const router = express.Router();
const { getDB } = require("../config/database");

router.get("/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { email } = req.query;

    if (!orderNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Número do pedido obrigatório" });
    }

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "E-mail obrigatório para rastrear o pedido" });
    }

    const db = getDB();
    const [orders] = await db.execute(
      `SELECT id, order_number, status, payment_status, shipping_tracking,
                    shipping_amount, total_amount, payment_method,
                    customer_name, customer_email, shipping_address, created_at, updated_at
             FROM orders WHERE order_number = ? LIMIT 1`,
      [orderNumber.toUpperCase()],
    );

    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "Pedido não encontrado" });
    }

    const order = orders[0];

    if (order.customer_email.toLowerCase() !== email.toLowerCase()) {
      return res
        .status(403)
        .json({ success: false, message: "Email não confere com o pedido" });
    }

    let shippingAddress = {};
    try {
      shippingAddress =
        typeof order.shipping_address === "string"
          ? JSON.parse(order.shipping_address)
          : order.shipping_address || {};
    } catch {}

    const [items] = await db.execute(
      `SELECT product_name, quantity, unit_price, total_price
             FROM order_items WHERE order_id = ?`,
      [order.id],
    );

    res.json({
      success: true,
      data: {
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        shipping_tracking: order.shipping_tracking,
        total_amount: order.total_amount,
        shipping_amount: order.shipping_amount,
        payment_method: order.payment_method,
        customer_name: order.customer_name,
        shipping_address: shippingAddress,
        items,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    });
  } catch (e) {
    console.error("[tracking]", e);
    res.status(500).json({ success: false, message: "Erro ao buscar pedido" });
  }
});

module.exports = router;