/**
 * Extrai o IP real do cliente.
 * Respeita o trust proxy configurado no Express (app.set('trust proxy', 1)).
 */
function getClientIp(req) {
    return (
        req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        '0.0.0.0'
    );
}

module.exports = { getClientIp };