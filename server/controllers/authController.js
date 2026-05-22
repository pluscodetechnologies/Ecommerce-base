const bcrypt = require("bcrypt");
const logger = require("../config/logger");
const crypto = require("crypto");

const { getDB } = require("../config/database");
const {
  generateAccessToken,
  REFRESH_TOKEN_TTL,
} = require("../middleware/auth");
const refreshTokenService = require("../services/refreshTokenService");
const loginAttempts = require("../services/loginAttemptService");

const BCRYPT_ROUNDS = 12;

function setRefreshCookie(res, token, expiresAt) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    expires: expiresAt,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", { path: "/api/auth" });
}

function getClientIp(req) {
  return (
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    ""
  );
}

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, phone, cpf } = req.body;

      const db = getDB();

      const [byEmail] = await db.execute(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (byEmail.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Este e-mail já está cadastrado." });
      }

      if (cpf) {
        const [byCpf] = await db.execute("SELECT id FROM users WHERE cpf = ?", [
          cpf,
        ]);
        if (byCpf.length > 0) {
          return res
            .status(400)
            .json({ success: false, message: "Este CPF já está cadastrado." });
        }
      }

      if (phone) {
        const [byPhone] = await db.execute(
          "SELECT id FROM users WHERE phone = ?",
          [phone],
        );
        if (byPhone.length > 0) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Este telefone já está cadastrado.",
            });
        }
      }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const [result] = await db.execute(
        `INSERT INTO users (name, email, password, phone, cpf, auth_provider, created_at)
                 VALUES (?, ?, ?, ?, ?, 'local', NOW())`,
        [name, email, hashedPassword, phone || null, cpf || null],
      );

      try {
        const { sendWelcomeEmail } = require("../services/emailService");
        sendWelcomeEmail(email, name).catch(() => {});
      } catch {}

      res.status(201).json({
        success: true,
        message: "Conta criada com sucesso!",
        data: { userId: result.insertId },
      });
    } catch (error) {
      logger.error("[register]", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Erro ao criar usuário. Tente novamente.",
        });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;
    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";

    try {
      const lock = await loginAttempts.isLocked(email);
      if (lock.locked) {
        return res.status(429).json({
          success: false,
          message: `Muitas tentativas. Tente novamente em ${lock.remainingMinutes} minuto(s).`,
        });
      }

      const db = getDB();
      const [users] = await db.execute(
        "SELECT id, name, email, password, role, token_version, auth_provider, totp_enabled FROM users WHERE email = ?",
        [email],
      );

      const genericFail = () => {
        loginAttempts.recordAttempt(email, ip, false).catch(() => {});
        return res
          .status(401)
          .json({ success: false, message: "Email ou senha incorretos" });
      };

      if (users.length === 0) return genericFail();

      const user = users[0];

      if (!user.password) {
        return res.status(401).json({
          success: false,
          message: "Esta conta usa login social. Entre com Google ou Facebook.",
        });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return genericFail();

      await loginAttempts.recordAttempt(email, ip, true);
      await loginAttempts.clearAttempts(email);

      if (user.role === "admin" && user.totp_enabled) {
        const crypto = require("crypto");
        const pendingToken = crypto.randomBytes(32).toString("hex");
        const pendingExpires = new Date(Date.now() + 10 * 60 * 1000);

        const db = getDB();
        await db.execute(
          "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
          ["2fa_" + pendingToken, pendingExpires, user.id],
        );

        return res.json({
          success: true,
          requires2FA: true,
          pendingToken,
        });
      }

      const rememberMe = req.body.rememberMe === true;
      const { token: refreshToken, expiresAt } =
        await refreshTokenService.createRefreshToken(user.id, {
          ip,
          userAgent,
          rememberMe,
        });

      const accessToken = generateAccessToken(user);
      setRefreshCookie(res, refreshToken, expiresAt);

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
            role: user.role || "user",
          },
        },
      });
    } catch (error) {
      logger.error("[login]", error);
      res.status(500).json({ success: false, message: "Erro ao fazer login" });
    }
  }

  async refresh(req, res) {
    try {
      const ip = getClientIp(req);
      const userAgent = req.headers["user-agent"] || "";

      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!rawToken) {
        return res
          .status(401)
          .json({ success: false, message: "Refresh token ausente" });
      }

      const result = await refreshTokenService.rotateRefreshToken(rawToken, {
        ip,
        userAgent,
      });
      if (!result) {
        clearRefreshCookie(res);
        return res.status(401).json({
          success: false,
          message: "Sessão expirada. Faça login novamente.",
        });
      }

      const db = getDB();
      const [users] = await db.execute(
        "SELECT id, role, token_version FROM users WHERE id = ?",
        [result.userId],
      );
      if (!users.length) {
        clearRefreshCookie(res);
        return res
          .status(401)
          .json({ success: false, message: "Usuário não encontrado" });
      }

      const accessToken = generateAccessToken(users[0]);
      setRefreshCookie(res, result.newToken, result.expiresAt);

      res.json({
        success: true,
        data: {
          token: accessToken,
          accessToken,
          expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
        },
      });
    } catch (error) {
      logger.error("[refresh]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao renovar sessão" });
    }
  }

  async logout(req, res) {
    try {
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (rawToken) await refreshTokenService.revokeRefreshToken(rawToken);
      clearRefreshCookie(res);
      res.json({ success: true, message: "Logout realizado" });
    } catch (error) {
      logger.error("[logout]", error);
      clearRefreshCookie(res);
      res.json({ success: true });
    }
  }

  async logoutAll(req, res) {
    try {
      const db = getDB();
      await refreshTokenService.revokeAllUserTokens(req.userId);
      await db.execute(
        "UPDATE users SET token_version = token_version + 1 WHERE id = ?",
        [req.userId],
      );
      clearRefreshCookie(res);
      res.json({ success: true, message: "Todas as sessões foram encerradas" });
    } catch (error) {
      logger.error("[logoutAll]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao encerrar sessões" });
    }
  }

  async socialLogin(req, res) {
    try {
      const { provider, name, email, provider_id } = req.body;
      const ip = getClientIp(req);
      const userAgent = req.headers["user-agent"] || "";

      const db = getDB();
      const [existing] = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email],
      );

      let user;
      if (existing.length > 0) {
        user = existing[0];

        if (user.auth_provider === "local" && user.password) {
          return res.status(409).json({
            success: false,
            message:
              "Esta conta já existe com login por senha. Faça login normalmente ou redefina a senha.",
          });
        }

        await db.execute(
          "UPDATE users SET name = ?, auth_provider = ? WHERE id = ?",
          [name, provider, user.id],
        );
        user.name = name;
        user.auth_provider = provider;
      } else {
        const [result] = await db.execute(
          `INSERT INTO users (name, email, password, auth_provider, created_at)
                     VALUES (?, ?, NULL, ?, NOW())`,
          [name, email, provider],
        );
        user = {
          id: result.insertId,
          name,
          email,
          role: "user",
          token_version: 0,
        };
      }

      const accessToken = generateAccessToken(user);
      const { token: refreshToken, expiresAt } =
        await refreshTokenService.createRefreshToken(user.id, {
          ip,
          userAgent,
        });

      setRefreshCookie(res, refreshToken, expiresAt);

      res.json({
        success: true,
        data: {
          token: accessToken,
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || "user",
          },
        },
      });
    } catch (error) {
      logger.error("[socialLogin]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao fazer login social" });
    }
  }

  async getProfile(req, res) {
    try {
      const db = getDB();
      const [users] = await db.execute(
        "SELECT id, name, email, phone, cpf, role, auth_provider, created_at FROM users WHERE id = ?",
        [req.userId],
      );

      if (!users.length) {
        return res
          .status(404)
          .json({ success: false, message: "Usuário não encontrado" });
      }
      res.json({ success: true, data: users[0] });
    } catch (error) {
      logger.error("[getProfile]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar perfil" });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, phone } = req.body;
      const db = getDB();
      await db.execute("UPDATE users SET name = ?, phone = ? WHERE id = ?", [
        name,
        phone || null,
        req.userId,
      ]);
      res.json({ success: true, message: "Perfil atualizado com sucesso" });
    } catch (error) {
      logger.error("[updateProfile]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar perfil" });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const db = getDB();

      const [users] = await db.execute(
        "SELECT password FROM users WHERE id = ?",
        [req.userId],
      );
      if (!users.length || !users[0].password) {
        return res
          .status(404)
          .json({ success: false, message: "Usuário não encontrado" });
      }

      const valid = await bcrypt.compare(currentPassword, users[0].password);
      if (!valid) {
        return res
          .status(401)
          .json({ success: false, message: "Senha atual incorreta" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      await db.execute(
        "UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?",
        [hashedPassword, req.userId],
      );

      await refreshTokenService.revokeAllUserTokens(req.userId);

      const ip = getClientIp(req);
      const userAgent = req.headers["user-agent"] || "";
      const { token: refreshToken, expiresAt } =
        await refreshTokenService.createRefreshToken(req.userId, {
          ip,
          userAgent,
        });
      setRefreshCookie(res, refreshToken, expiresAt);

      const [u] = await db.execute(
        "SELECT id, role, token_version FROM users WHERE id = ?",
        [req.userId],
      );
      const accessToken = generateAccessToken(u[0]);

      res.json({
        success: true,
        message: "Senha alterada com sucesso",
        data: { token: accessToken, accessToken },
      });
    } catch (error) {
      logger.error("[changePassword]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao alterar senha" });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const db = getDB();

      const [users] = await db.execute(
        "SELECT id, totp_enabled FROM users WHERE email = ? AND auth_provider = 'local'",
        [email],
      );

      // Resposta genérica para não revelar se o e-mail existe
      const genericEmailResponse = () =>
        res.json({
          success: true,
          method: "email",
          message: "Se o email existir, você receberá um link de recuperação",
        });

      if (!users.length) return genericEmailResponse();

      const user = users[0];

      // --- Usuário tem 2FA ativo: usa TOTP em vez de e-mail ---
      if (user.totp_enabled) {
        const pendingToken = crypto.randomBytes(32).toString("hex");
        const pendingExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        await db.execute(
          "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
          ["pwd_2fa_" + pendingToken, pendingExpires, user.id],
        );

        return res.json({
          success: true,
          method: "totp",
          pendingToken,
          message: "Confirme sua identidade com o Google Authenticator",
        });
      }

      // --- Usuário sem 2FA: fluxo normal por e-mail ---
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await db.execute(
        "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
        [token, expires, user.id],
      );

      try {
        const {
          sendClientPasswordResetEmail,
        } = require("../services/emailService");
        await sendClientPasswordResetEmail(email, token);
      } catch (emailErr) {
        logger.error("[forgotPassword] erro ao enviar email:", emailErr);
      }

      return genericEmailResponse();
    } catch (error) {
      logger.error("[forgotPassword]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao processar solicitação" });
    }
  }

  // Valida o código TOTP e troca o pendingToken por um resetToken de uso único
  async verifyTotpForReset(req, res) {
    try {
      const { pendingToken, code } = req.body;

      if (!pendingToken || !code) {
        return res
          .status(400)
          .json({ success: false, message: "Dados incompletos" });
      }

      const speakeasy = require("speakeasy");
      const db = getDB();

      const [rows] = await db.execute(
        `SELECT id, totp_secret
         FROM users
         WHERE reset_token = ? AND reset_expires > NOW()`,
        ["pwd_2fa_" + pendingToken],
      );

      if (!rows.length) {
        return res.status(401).json({
          success: false,
          message: "Sessão expirada. Inicie o processo novamente.",
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

      // Troca o pendingToken por um resetToken limpo (sem prefixo) de 15 min
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

      await db.execute(
        "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
        [resetToken, resetExpires, user.id],
      );

      return res.json({
        success: true,
        resetToken,
        message: "Identidade confirmada. Defina sua nova senha.",
      });
    } catch (error) {
      logger.error("[verifyTotpForReset]", error);
      res.status(500).json({ success: false, message: "Erro na verificação" });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      const db = getDB();

      // Rejeita tokens com prefixo (pendingTokens ainda não validados)
      if (token.startsWith("pwd_2fa_") || token.startsWith("2fa_")) {
        return res
          .status(400)
          .json({ success: false, message: "Token inválido" });
      }

      const [users] = await db.execute(
        "SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()",
        [token],
      );
      if (!users.length) {
        return res
          .status(400)
          .json({ success: false, message: "Link inválido ou expirado" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      await db.execute(
        `UPDATE users
         SET password = ?, reset_token = NULL, reset_expires = NULL,
             token_version = token_version + 1
         WHERE id = ?`,
        [hashedPassword, users[0].id],
      );

      await refreshTokenService.revokeAllUserTokens(users[0].id);

      res.json({ success: true, message: "Senha redefinida com sucesso" });
    } catch (error) {
      logger.error("[resetPassword]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao redefinir senha" });
    }
  }

  async updateEmail(req, res) {
    try {
      const { newEmail, password } = req.body;
      const db = getDB();

      const [users] = await db.execute(
        "SELECT password FROM users WHERE id = ?",
        [req.userId],
      );
      if (!users.length || !users[0].password) {
        return res
          .status(401)
          .json({ success: false, message: "Não autorizado" });
      }
      const valid = await bcrypt.compare(password, users[0].password);
      if (!valid) {
        return res
          .status(401)
          .json({ success: false, message: "Senha incorreta" });
      }

      const [existing] = await db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [newEmail, req.userId],
      );
      if (existing.length) {
        return res
          .status(400)
          .json({ success: false, message: "Este email já está em uso" });
      }

      await db.execute("UPDATE users SET email = ? WHERE id = ?", [
        newEmail,
        req.userId,
      ]);
      res.json({ success: true, message: "Email atualizado com sucesso" });
    } catch (error) {
      logger.error("[updateEmail]", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar email" });
    }
  }
}

module.exports = new AuthController();