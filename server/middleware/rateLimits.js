const rateLimit = require('express-rate-limit');

/**
 * Rate limiters específicos por tipo de endpoint.
 *
 * Boas práticas:
 *   - Login / register / forgot / reset: limites apertados (anti-força bruta)
 *   - Webhooks: limite generoso por IP do gateway de pagamento
 *   - Rotas autenticadas comuns: limite moderado
 *   - Rotas públicas: limite global frouxo
 *
 * Nota sobre proxies: se rodar atrás de Cloudflare / nginx, garanta que
 * app.set('trust proxy', 1) está configurado em index.js, ou o limiter
 * vai contar requisições pelo IP do proxy.
 */

// Resposta padronizada quando o limite estoura
const handler = (req, res) => {
    res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
    });
};

// Login: 5 tentativas a cada 10min por IP (alinhado ao doc)
// O lockout adicional por email está no authController (login_attempts table).
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max:      10,                  // 10 por IP a cada 10min (uma família/escritório pode compartilhar IP)
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
    // Permite sucesso não consumir a cota — desencoraja brute force sem punir uso legítimo
    skipSuccessfulRequests: true,
});

// Register: 5 por hora por IP (não tem motivo pra criar muitas contas)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      5,
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
});

// Forgot password: 3 por hora por IP (evita spam de email pra clientes)
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      3,
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
});

// Reset password: 5 por hora por IP (tentativas de adivinhar token)
const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      5,
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
});

// Refresh token: 30 por hora por IP (uso normal não passa de ~10/dia por sessão)
const refreshLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      30,
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
});

// Webhook Mercado Pago: ~300 por minuto (eles fazem muitos retries)
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max:      300,
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
});

// Limit geral para a API (proteção genérica contra abuso)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      300,                 // 300 reqs / 15 min por IP (uso normal nem chega perto)
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
});

// Limit p/ rotas de upload (futuro — admin manda imagens)
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      100,
    standardHeaders: true,
    legacyHeaders:   false,
    handler,
});

module.exports = {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
    refreshLimiter,
    webhookLimiter,
    apiLimiter,
    uploadLimiter,
};
