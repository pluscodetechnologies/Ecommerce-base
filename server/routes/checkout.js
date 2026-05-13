const express = require("express");
const router = express.Router();

const checkoutController = require("../controllers/checkoutController");
const {
  optionalAuthMiddleware,
  authMiddleware,
} = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { webhookLimiter } = require("../middleware/rateLimits");
const {
  createOrderSchema,
  calculateShippingSchema,
} = require("../schemas/checkout.schema");

router.post(
  "/shipping",
  validate({ body: calculateShippingSchema }),
  (req, res) => checkoutController.calculateShipping(req, res),
);

router.post(
  "/shipping-proxy",
  validate({ body: calculateShippingSchema }),
  (req, res) => checkoutController.shippingProxy(req, res),
);

router.post(
  "/order",
  authMiddleware,
  validate({ body: createOrderSchema }),
  (req, res) => checkoutController.createOrder(req, res),
);

router.get("/status/:orderNumber", authMiddleware, (req, res) =>
  checkoutController.checkPaymentStatus(req, res),
);

router.post(
  "/webhook",
  webhookLimiter,
  express.raw({ type: "application/json" }),
  (req, res) => checkoutController.handleWebhook(req, res),
);

module.exports = router;
