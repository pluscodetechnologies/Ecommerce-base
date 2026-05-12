const express    = require('express');
const router     = express.Router();
const speakeasy  = require('speakeasy');
const QRCode     = require('qrcode');
const { getDB }  = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminMiddleware);

// ── GET /api/admin/2fa/setup — gera secret e QR code ─────────────────────────
router.get('/setup', async (req, res) => {
    try {
        const db   = getDB();
        const user = JSON.parse(JSON.stringify(
            (await db.execute('SELECT name, email, totp_enabled FROM users WHERE id = ?', [req.userId]))[0][0]
        ));

        if (user.totp_enabled) {
            return res.status(400).json({ success: false, message: '2FA já está ativo.' });
        }

        // Gera novo secret
        const secret = speakeasy.generateSecret({
            name:   `Velvet Admin (${user.email})`,
            issuer: 'Velvet Store',
            length: 32,
        });

        // Salva o secret temporariamente (não ativado ainda)
        await db.execute(
            'UPDATE users SET totp_secret = ?, totp_verified = 0 WHERE id = ?',
            [secret.base32, req.userId]
        );

        // Gera QR code como data URL
        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            data: {
                secret:  secret.base32,  // para quem preferir digitar manual
                qrCode:  qrDataUrl,
            }
        });
    } catch (e) {
        console.error('[2fa.setup]', e);
        res.status(500).json({ success: false, message: 'Erro ao configurar 2FA' });
    }
});

// ── POST /api/admin/2fa/verify — confirma código e ativa 2FA ─────────────────
router.post('/verify', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Código obrigatório' });

        const db   = getDB();
        const [rows] = await db.execute(
            'SELECT totp_secret FROM users WHERE id = ?', [req.userId]
        );
        if (!rows.length || !rows[0].totp_secret) {
            return res.status(400).json({ success: false, message: 'Execute o setup primeiro' });
        }

        const valid = speakeasy.totp.verify({
            secret:   rows[0].totp_secret,
            encoding: 'base32',
            token:    code.replace(/\s/g, ''),
            window:   1,
        });

        if (!valid) {
            return res.status(400).json({ success: false, message: 'Código inválido. Tente novamente.' });
        }

        await db.execute(
            'UPDATE users SET totp_enabled = 1, totp_verified = 1 WHERE id = ?',
            [req.userId]
        );

        res.json({ success: true, message: '2FA ativado com sucesso!' });
    } catch (e) {
        console.error('[2fa.verify]', e);
        res.status(500).json({ success: false, message: 'Erro ao verificar código' });
    }
});

// ── POST /api/admin/2fa/disable — desativa 2FA ────────────────────────────────
router.post('/disable', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Confirme com o código atual' });

        const db   = getDB();
        const [rows] = await db.execute(
            'SELECT totp_secret, totp_enabled FROM users WHERE id = ?', [req.userId]
        );
        if (!rows.length || !rows[0].totp_enabled) {
            return res.status(400).json({ success: false, message: '2FA não está ativo' });
        }

        const valid = speakeasy.totp.verify({
            secret:   rows[0].totp_secret,
            encoding: 'base32',
            token:    code.replace(/\s/g, ''),
            window:   1,
        });

        if (!valid) {
            return res.status(400).json({ success: false, message: 'Código inválido.' });
        }

        await db.execute(
            'UPDATE users SET totp_secret = NULL, totp_enabled = 0, totp_verified = 0 WHERE id = ?',
            [req.userId]
        );

        res.json({ success: true, message: '2FA desativado.' });
    } catch (e) {
        console.error('[2fa.disable]', e);
        res.status(500).json({ success: false, message: 'Erro ao desativar 2FA' });
    }
});

// ── GET /api/admin/2fa/status — status atual do 2FA ──────────────────────────
router.get('/status', async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute(
            'SELECT totp_enabled FROM users WHERE id = ?', [req.userId]
        );
        res.json({
            success: true,
            data: { enabled: rows[0]?.totp_enabled === 1 }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Erro' });
    }
});

module.exports = router;