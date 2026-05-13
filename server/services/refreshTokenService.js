const crypto = require("crypto");
const logger = require("../config/logger");
const { getDB } = require("../config/database");

const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_TTL_DAYS =
  parseInt(process.env.REFRESH_TOKEN_TTL_DAYS) || 7;

function generateRawToken() {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createRefreshToken(userId, { ip, userAgent, rememberMe } = {}) {
  const db = getDB();
  const raw = generateRawToken();
  const hash = hashToken(raw);
  const ttlDays = rememberMe ? 30 : REFRESH_TOKEN_TTL_DAYS;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await db.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      hash,
      expiresAt,
      (userAgent || "").slice(0, 255),
      (ip || "").slice(0, 45),
    ],
  );

  return { token: raw, expiresAt };
}

async function rotateRefreshToken(rawToken, { ip, userAgent } = {}) {
  const db = getDB();
  const hash = hashToken(rawToken);

  const [rows] = await db.execute(
    `SELECT id, user_id, revoked_at, expires_at
         FROM refresh_tokens
         WHERE token_hash = ?
         LIMIT 1`,
    [hash],
  );

  if (!rows.length) return null;

  const record = rows[0];

  if (record.revoked_at) {
    logger.warn(
      `[refresh-token] reuso detectado para user ${record.user_id} — revogando todas as sessões`,
    );
    await revokeAllUserTokens(record.user_id);
    return null;
  }

  if (new Date(record.expires_at) < new Date()) {
    return null;
  }

  await db.execute(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?",
    [record.id],
  );

  const { token: newRaw, expiresAt } = await createRefreshToken(
    record.user_id,
    { ip, userAgent },
  );

  return { userId: record.user_id, newToken: newRaw, expiresAt };
}

async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  const db = getDB();
  const hash = hashToken(rawToken);
  await db.execute(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL",
    [hash],
  );
}

async function revokeAllUserTokens(userId) {
  const db = getDB();
  await db.execute(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL",
    [userId],
  );
}

async function cleanupExpiredTokens() {
  const db = getDB();
  const [result] = await db.execute(
    `DELETE FROM refresh_tokens
         WHERE expires_at < NOW()
            OR (revoked_at IS NOT NULL AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY))`,
  );
  return result.affectedRows;
}

module.exports = {
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  REFRESH_TOKEN_TTL_DAYS,
};
