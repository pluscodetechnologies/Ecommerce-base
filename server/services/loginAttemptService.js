const { getDB } = require("../config/database");

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 30;

async function recordAttempt(email, ip, success) {
  const db = getDB();
  const identifier = (email || "").toLowerCase().trim().slice(0, 255);
  await db.execute(
    `INSERT INTO login_attempts (identifier, ip_address, success) VALUES (?, ?, ?)`,
    [identifier, (ip || "").slice(0, 45), success ? 1 : 0],
  );
}

async function isLocked(email) {
  const db = getDB();
  const identifier = (email || "").toLowerCase().trim();

  const [rows] = await db.execute(
    `SELECT COUNT(*) AS failures,
                MAX(attempted_at) AS last_attempt
         FROM login_attempts
         WHERE identifier = ?
           AND success = 0
           AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [identifier, WINDOW_MINUTES],
  );

  const failures = rows[0]?.failures || 0;
  if (failures < MAX_ATTEMPTS) {
    return { locked: false, remainingMinutes: 0 };
  }

  const lastAttempt = rows[0].last_attempt;
  if (!lastAttempt) {
    return { locked: false, remainingMinutes: 0 };
  }

  const unlockTime = new Date(
    new Date(lastAttempt).getTime() + LOCKOUT_MINUTES * 60 * 1000,
  );
  const now = new Date();

  if (now >= unlockTime) {
    return { locked: false, remainingMinutes: 0 };
  }

  const remainingMs = unlockTime - now;
  const remainingMinutes = Math.ceil(remainingMs / 60000);
  return { locked: true, remainingMinutes };
}

async function clearAttempts(email) {
  const db = getDB();
  const identifier = (email || "").toLowerCase().trim();
  await db.execute(
    `DELETE FROM login_attempts WHERE identifier = ? AND success = 0`,
    [identifier],
  );
}

async function cleanupOldAttempts() {
  const db = getDB();
  const [result] = await db.execute(
    `DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
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
