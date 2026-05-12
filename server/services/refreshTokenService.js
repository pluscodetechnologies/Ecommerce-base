const crypto = require('crypto');
const logger = require('../config/logger');
const { getDB } = require('../config/database');

/**
 * Refresh token service: rotação segura de tokens.
 *
 * Estratégia:
 *  - O refresh token é uma string aleatória de 64 bytes (não JWT).
 *  - No banco guardamos só o HASH (SHA-256) — se o DB vazar, o token bruto
 *    ainda assim não vaza.
 *  - A cada uso (refresh), o token antigo é revogado e um novo é emitido.
 *    Isso permite detectar reuso: se o mesmo token aparecer 2x → ataque
 *    em curso, e revogamos toda a árvore de sessões do usuário.
 *  - Expiração padrão: 7 dias.
 */

const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS) || 7;

function generateRawToken() {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Cria um refresh token novo no banco e retorna a versão crua (pra cliente).
 */
async function createRefreshToken(userId, { ip, userAgent, rememberMe } = {}) {
    const db = getDB();
    const raw  = generateRawToken();
    const hash = hashToken(raw);
    // "Lembrar de mim" estende o refresh token para 30 dias
    const ttlDays = rememberMe ? 30 : REFRESH_TOKEN_TTL_DAYS;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await db.execute(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, hash, expiresAt, (userAgent || '').slice(0, 255), (ip || '').slice(0, 45)]
    );

    return { token: raw, expiresAt };
}

/**
 * Consome um refresh token, rotaciona (invalida o antigo, gera novo).
 * Retorna { userId, newToken } se válido.
 * Retorna null se inválido/expirado/já usado.
 *
 * Se detectar reuso (token já revogado), revoga TODOS os refresh tokens do
 * usuário — é sinal de comprometimento.
 */
async function rotateRefreshToken(rawToken, { ip, userAgent } = {}) {
    const db = getDB();
    const hash = hashToken(rawToken);

    const [rows] = await db.execute(
        `SELECT id, user_id, revoked_at, expires_at
         FROM refresh_tokens
         WHERE token_hash = ?
         LIMIT 1`,
        [hash]
    );

    if (!rows.length) return null;

    const record = rows[0];

    // Reuso de token revogado → ataque. Revoga toda a sessão do usuário.
    if (record.revoked_at) {
        logger.warn(`[refresh-token] reuso detectado para user ${record.user_id} — revogando todas as sessões`);
        await revokeAllUserTokens(record.user_id);
        return null;
    }

    if (new Date(record.expires_at) < new Date()) {
        return null;
    }

    // Rotação: marca o antigo como revogado e cria um novo
    await db.execute(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?',
        [record.id]
    );

    const { token: newRaw, expiresAt } = await createRefreshToken(record.user_id, { ip, userAgent });

    return { userId: record.user_id, newToken: newRaw, expiresAt };
}

/**
 * Revoga um refresh token específico (logout normal).
 */
async function revokeRefreshToken(rawToken) {
    if (!rawToken) return;
    const db = getDB();
    const hash = hashToken(rawToken);
    await db.execute(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
        [hash]
    );
}

/**
 * Revoga TODOS os refresh tokens do usuário (logout de todos os dispositivos,
 * troca de senha, suspeita de comprometimento).
 */
async function revokeAllUserTokens(userId) {
    const db = getDB();
    await db.execute(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
        [userId]
    );
}

/**
 * Job de limpeza: remove refresh tokens expirados/revogados há mais de 30 dias.
 * Pode ser chamado em um cron ou no startup.
 */
async function cleanupExpiredTokens() {
    const db = getDB();
    const [result] = await db.execute(
        `DELETE FROM refresh_tokens
         WHERE expires_at < NOW()
            OR (revoked_at IS NOT NULL AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY))`
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