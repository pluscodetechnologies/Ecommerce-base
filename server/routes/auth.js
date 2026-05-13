const express = require("express");
const router = express.Router();

const { getDB } = require("../config/database");
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  refreshLimiter,
} = require("../middleware/rateLimits");

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  updateEmailSchema,
  socialLoginSchema,
} = require("../schemas/auth.schema");

router.post(
  "/register",
  registerLimiter,
  validate({ body: registerSchema }),
  authController.register.bind(authController),
);

router.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  authController.login.bind(authController),
);

router.post(
  "/social-login",
  loginLimiter,
  validate({ body: socialLoginSchema }),
  authController.socialLogin.bind(authController),
);

router.post("/2fa-login", loginLimiter, async (req, res) => {
  try {
    const speakeasy = require("speakeasy");
    const { pendingToken, code, rememberMe } = req.body;
    if (!pendingToken || !code) {
      return res
        .status(400)
        .json({ success: false, message: "Dados incompletos" });
    }

    const db = getDB();
    const [rows] = await db.execute(
      `SELECT id, name, email, role, token_version, totp_secret
                 FROM users
                 WHERE reset_token = ? AND reset_expires > NOW() AND role = 'admin'`,
      ["2fa_" + pendingToken],
    );

    if (!rows.length) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Sessão expirada. Faça login novamente.",
        });
    }

    const user = rows[0];
    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: "base32",
      token: code.replace(/\s/g, ""),
      window: 1,
    });

    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Código inválido. Tente novamente." });
    }

    await db.execute(
      "UPDATE users SET reset_token = NULL, reset_expires = NULL WHERE id = ?",
      [user.id],
    );

    const { generateAccessToken } = require("../middleware/auth");
    const refreshTokenService = require("../services/refreshTokenService");

    const ip = req.ip || "";
    const userAgent = req.headers["user-agent"] || "";
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, expiresAt } =
      await refreshTokenService.createRefreshToken(user.id, {
        ip,
        userAgent,
        rememberMe: rememberMe === true,
      });

    const isNgrok = process.env.NGROK_MODE === "true";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || isNgrok,
      sameSite: isNgrok ? "none" : "lax",
      path: "/api/auth",
      expires: expiresAt,
    });

    res.json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (e) {
    console.error("[2fa-login]", e);
    res.status(500).json({ success: false, message: "Erro na verificação" });
  }
});

router.post(
  "/refresh",
  refreshLimiter,
  authController.refresh.bind(authController),
);

router.post("/logout", authController.logout.bind(authController));

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword.bind(authController),
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword.bind(authController),
);

router.get(
  "/profile",
  authMiddleware,
  authController.getProfile.bind(authController),
);

router.put(
  "/profile",
  authMiddleware,
  validate({ body: updateProfileSchema }),
  authController.updateProfile.bind(authController),
);

router.put(
  "/change-password",
  authMiddleware,
  validate({ body: changePasswordSchema }),
  authController.changePassword.bind(authController),
);

router.put(
  "/update-email",
  authMiddleware,
  validate({ body: updateEmailSchema }),
  authController.updateEmail.bind(authController),
);

router.post(
  "/logout-all",
  authMiddleware,
  authController.logoutAll.bind(authController),
);

module.exports = router;
