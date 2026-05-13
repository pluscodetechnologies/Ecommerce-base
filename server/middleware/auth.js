const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const { getDB } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "❌ JWT_SECRET ausente ou muito curto (mínimo 32 caracteres). " +
      "Defina no .env antes de iniciar o servidor.",
  );
}

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d";

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role || "user",
      tokenVersion: user.token_version || 0,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token =
      header && header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
        code: "NO_TOKEN",
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token inválido ou expirado",
        code: "INVALID_TOKEN",
      });
    }

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT token_version, role FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado",
        code: "USER_NOT_FOUND",
      });
    }

    const dbVersion = rows[0].token_version || 0;
    const tokenVer = decoded.tokenVersion ?? 0;
    if (tokenVer !== dbVersion) {
      return res.status(401).json({
        success: false,
        message: "Sessão expirada. Faça login novamente.",
        code: "TOKEN_REVOKED",
      });
    }

    req.userId = decoded.userId;
    req.userRole = rows[0].role || "user";
    next();
  } catch (error) {
    logger.error("[authMiddleware]", error);
    res.status(500).json({ success: false, message: "Erro na autenticação" });
  }
}

async function optionalAuthMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token =
      header && header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return next();

    const decoded = verifyAccessToken(token);
    if (!decoded) return next();

    const db = getDB();
    const [rows] = await db.execute(
      "SELECT token_version, role FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (
      rows.length &&
      (rows[0].token_version || 0) === (decoded.tokenVersion ?? 0)
    ) {
      req.userId = decoded.userId;
      req.userRole = rows[0].role || "user";
    }
    next();
  } catch (error) {
    logger.error("[optionalAuthMiddleware]", error);
    next();
  }
}

function adminMiddleware(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acesso negado. Requer privilégios de administrador.",
    });
  }
  next();
}

async function requireOwnership(
  db,
  table,
  id,
  userId,
  ownerColumn = "user_id",
) {
  const [rows] = await db.execute(
    `SELECT ${ownerColumn} FROM ${table} WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!rows.length) return false;
  return rows[0][ownerColumn] === userId;
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  requireOwnership,
  generateAccessToken,
  verifyAccessToken,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  JWT_SECRET,
};
