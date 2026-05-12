const { getDB } = require('../config/database');

/**
 * Lockout por email + IP contra força bruta.
 *
 * O rate limit global (por IP) já cobre boa parte. Esta camada adicional
 * trava o EMAIL após N falhas em janela curta — protege contra ataques
 * distribuídos (botnet rodando 1 tentativa por IP).
 *
 * Política:
 *  - 5 falhas em 15min → lockout de 30min
 *  - Sucesso limpa as falhas
 */

const MAX_ATTEMPTS    = 5;
const WINDOW_MINUTES  = 15;
const LOCKOUT_MINUTES = 30;

/**
 * Registra uma tentativa (sucesso ou falha).
 */
async function recordAttempt(email, ip, success) {
    const db = getDB();
    const identifier = (email || '').toLowerCase().trim().slice(0, 255);
    await db.execute(
        `INSERT INTO login_attempts (identifier, ip_address, success) VALUES (?, ?, ?)`,
        [identifier, (ip || '').slice(0, 45), success ? 1 : 0]
    );
}

/**
 * Verifica se o email está bloqueado por excesso de falhas.
 * Retorna { locked: bool, remainingMinutes: number }
 */
async function isLocked(email) {
    const db = getDB();
    const identifier = (email || '').toLowerCase().trim();

    // Conta falhas recentes (na janela de WINDOW_MINUTES)
    const [rows] = await db.execute(
        `SELECT COUNT(*) AS failures,
                MAX(attempted_at) AS last_attempt
         FROM login_attempts
         WHERE identifier = ?
           AND success = 0
           AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [identifier, WINDOW_MINUTES]
    );

    const failures = rows[0]?.failures || 0;
    if (failures < MAX_ATTEMPTS) {
        return { locked: false, remainingMinutes: 0 };
    }

    // Atingiu o limite — bloqueado até passar LOCKOUT_MINUTES desde a última falha
    const lastAttempt = rows[0].last_attempt;
    if (!lastAttempt) {
        return { locked: false, remainingMinutes: 0 };
    }

    const unlockTime = new Date(new Date(lastAttempt).getTime() + LOCKOUT_MINUTES * 60 * 1000);
    const now = new Date();

    if (now >= unlockTime) {
        return { locked: false, remainingMinutes: 0 };
    }

    const remainingMs      = unlockTime - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return { locked: true, remainingMinutes };
}

/**
 * Limpa as falhas registradas após um login bem-sucedido.
 */
async function clearAttempts(email) {
    const db = getDB();
    const identifier = (email || '').toLowerCase().trim();
    await db.execute(
        `DELETE FROM login_attempts WHERE identifier = ? AND success = 0`,
        [identifier]
    );
}

/**
 * Limpa entradas antigas (cron / startup).
 */
async function cleanupOldAttempts() {
    const db = getDB();
    const [result] = await db.execute(
        `DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    return result.affectedRows;
}

module.exports = {
    recordAttempt,
    isLocked,
    clearAttempts,
    cleanupOldAttempts,
    MAX_ATTEMPTS,
    LOCKOUT_MINUTES,
};
