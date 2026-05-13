const { getClientIp } = require("./getClientIp");

const suspiciousIps = new Map();

const MAX_FAILURES = 10;
const BLOCK_MINUTES = 30;
const WINDOW_MINUTES = 15;

function parseAllowedIps() {
  const raw = process.env.ADMIN_ALLOWED_IPS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function recordSuspicious(ip) {
  const now = Date.now();
  const entry = suspiciousIps.get(ip) || {
    failures: 0,
    firstSeen: now,
    blockedUntil: null,
  };

  if (now - entry.firstSeen > WINDOW_MINUTES * 60 * 1000) {
    entry.failures = 0;
    entry.firstSeen = now;
  }

  entry.failures++;

  if (entry.failures >= MAX_FAILURES) {
    entry.blockedUntil = now + BLOCK_MINUTES * 60 * 1000;
    console.warn(
      `[admin-protect] IP bloqueado por força bruta: ${ip} (${entry.failures} tentativas)`,
    );
  }

  suspiciousIps.set(ip, entry);
}

function isBlocked(ip) {
  const entry = suspiciousIps.get(ip);
  if (!entry || !entry.blockedUntil) return false;
  if (Date.now() > entry.blockedUntil) {
    suspiciousIps.delete(ip);
    return false;
  }
  return true;
}

setInterval(
  () => {
    const now = Date.now();
    for (const [ip, entry] of suspiciousIps.entries()) {
      if (entry.blockedUntil && now > entry.blockedUntil) {
        suspiciousIps.delete(ip);
      } else if (now - entry.firstSeen > 2 * WINDOW_MINUTES * 60 * 1000) {
        suspiciousIps.delete(ip);
      }
    }
  },
  60 * 60 * 1000,
);

function adminProtect(req, res, next) {
  const ip = getClientIp(req);

  res.set("X-Robots-Tag", "noindex, nofollow");

  if (isBlocked(ip)) {
    return res.status(429).json({
      success: false,
      message: "Acesso temporariamente bloqueado. Tente novamente mais tarde.",
    });
  }

  const allowed = parseAllowedIps();
  if (allowed.length > 0 && !allowed.includes(ip)) {
    recordSuspicious(ip);
    console.warn(
      `[admin-protect] IP não autorizado tentou acessar /admin: ${ip}`,
    );
    return res.status(403).json({ success: false, message: "Acesso negado" });
  }

  next();
}

function adminRecordFailure(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      const ip = getClientIp(req);
      recordSuspicious(ip);
    }
    return originalJson(data);
  };
  next();
}

module.exports = { adminProtect, adminRecordFailure };
