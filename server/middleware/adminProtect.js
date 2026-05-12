/**
 * Middleware de proteção do painel admin.
 *
 * Camadas:
 *  1. Allowlist de IP (opcional) — se ADMIN_ALLOWED_IPS estiver definido no .env,
 *     só esses IPs acessam o /admin. Ideal pra produção.
 *  2. Bloqueio por força bruta — rastreia tentativas de acesso suspeito por IP.
 *     IP que fizer muitas requisições 401/403 seguidas é bloqueado temporariamente.
 *  3. Header de segurança extra — envia X-Robots-Tag para o Google não indexar o admin.
 *
 * Configuração no .env:
 *   ADMIN_ALLOWED_IPS=177.100.200.1,192.168.1.10   (vírgula-separado, sem espaços)
 *   # Se vazio, qualquer IP pode acessar (mas ainda tem o rate limit)
 */

const { getClientIp } = require('./getClientIp');

// Mapa em memória: ip → { failures, blockedUntil }
// Em produção com múltiplos processos, usar Redis. Para single-process é suficiente.
const suspiciousIps = new Map();

const MAX_FAILURES    = 10;   // tentativas suspeitas antes de bloquear
const BLOCK_MINUTES   = 30;   // minutos de bloqueio
const WINDOW_MINUTES  = 15;   // janela de contagem

function parseAllowedIps() {
    const raw = process.env.ADMIN_ALLOWED_IPS || '';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function recordSuspicious(ip) {
    const now    = Date.now();
    const entry  = suspiciousIps.get(ip) || { failures: 0, firstSeen: now, blockedUntil: null };

    // Reseta contagem se janela expirou
    if (now - entry.firstSeen > WINDOW_MINUTES * 60 * 1000) {
        entry.failures  = 0;
        entry.firstSeen = now;
    }

    entry.failures++;

    if (entry.failures >= MAX_FAILURES) {
        entry.blockedUntil = now + BLOCK_MINUTES * 60 * 1000;
        console.warn(`[admin-protect] IP bloqueado por força bruta: ${ip} (${entry.failures} tentativas)`);
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

// Limpa entradas antigas a cada hora
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of suspiciousIps.entries()) {
        if (entry.blockedUntil && now > entry.blockedUntil) {
            suspiciousIps.delete(ip);
        } else if (now - entry.firstSeen > 2 * WINDOW_MINUTES * 60 * 1000) {
            suspiciousIps.delete(ip);
        }
    }
}, 60 * 60 * 1000);

// ── Middleware principal ──────────────────────────────────────────────────────
function adminProtect(req, res, next) {
    const ip = getClientIp(req);

    // Impede indexação pelo Google
    res.set('X-Robots-Tag', 'noindex, nofollow');

    // 1) Bloquear IP por força bruta
    if (isBlocked(ip)) {
        return res.status(429).json({
            success: false,
            message: 'Acesso temporariamente bloqueado. Tente novamente mais tarde.',
        });
    }

    // 2) Allowlist de IP (se configurada)
    const allowed = parseAllowedIps();
    if (allowed.length > 0 && !allowed.includes(ip)) {
        recordSuspicious(ip);
        console.warn(`[admin-protect] IP não autorizado tentou acessar /admin: ${ip}`);
        return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    next();
}

// ── Middleware para registrar falhas de autenticação ──────────────────────────
// Use após rotas de login do admin para contar tentativas com senha errada.
function adminRecordFailure(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function(data) {
        if (res.statusCode === 401 || res.statusCode === 403) {
            const ip = getClientIp(req);
            recordSuspicious(ip);
        }
        return originalJson(data);
    };
    next();
}

module.exports = { adminProtect, adminRecordFailure };