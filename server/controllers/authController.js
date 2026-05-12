const bcrypt = require('bcrypt');
const logger = require('../config/logger');
const crypto = require('crypto');

const { getDB } = require('../config/database');
const { generateAccessToken, REFRESH_TOKEN_TTL } = require('../middleware/auth');
const refreshTokenService = require('../services/refreshTokenService');
const loginAttempts       = require('../services/loginAttemptService');

const BCRYPT_ROUNDS = 12;   // 10 era OK em 2018; 12 é o mínimo aceitável em 2026

// ────────────────────────────────────────────────────────────────────
// Helper: configura cookie httpOnly para o refresh token
// ────────────────────────────────────────────────────────────────────
function setRefreshCookie(res, token, expiresAt) {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',   // só HTTPS em prod
        sameSite: 'lax',                                   // bloqueia CSRF cross-site
        path:     '/api/auth',                             // só vai pras rotas de auth
        expires:  expiresAt,
    });
}

function clearRefreshCookie(res) {
    res.clearCookie('refreshToken', { path: '/api/auth' });
}

function getClientIp(req) {
    // Confiar em x-forwarded-for só se app.set('trust proxy', 1) está configurado
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

class AuthController {

    // ════════════════════════════════════════════════════════════════
    // REGISTER
    // ════════════════════════════════════════════════════════════════
    async register(req, res) {
        try {
            // Já validado pelo middleware Zod — vem limpo
            const { name, email, password, phone, cpf } = req.body;

            const db = getDB();

            // Email já existe? (resposta genérica pra não vazar info)
            const [existing] = await db.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Não foi possível criar a conta. Verifique os dados.',
                });
            }

            const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

            const [result] = await db.execute(
                `INSERT INTO users (name, email, password, phone, cpf, auth_provider, created_at)
                 VALUES (?, ?, ?, ?, ?, 'local', NOW())`,
                [name, email, hashedPassword, phone || null, cpf || null]
            );

            res.status(201).json({
                success: true,
                message: 'Conta criada com sucesso!',
                data:    { userId: result.insertId },
            });
        } catch (error) {
            logger.error('[register]', error);
            res.status(500).json({ success: false, message: 'Erro ao criar usuário. Tente novamente.' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // LOGIN — com lockout e refresh token
    // ════════════════════════════════════════════════════════════════
    async login(req, res) {
        const { email, password } = req.body;
        const ip        = getClientIp(req);
        const userAgent = req.headers['user-agent'] || '';

        try {
            // 1) Lockout check
            const lock = await loginAttempts.isLocked(email);
            if (lock.locked) {
                return res.status(429).json({
                    success: false,
                    message: `Muitas tentativas. Tente novamente em ${lock.remainingMinutes} minuto(s).`,
                });
            }

            const db = getDB();
            const [users] = await db.execute(
                'SELECT id, name, email, password, role, token_version, auth_provider FROM users WHERE email = ?',
                [email]
            );

            // Resposta genérica → não revelar se o email existe
            const genericFail = () => {
                loginAttempts.recordAttempt(email, ip, false).catch(() => {});
                return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
            };

            if (users.length === 0) return genericFail();

            const user = users[0];

            // Usuário de social login sem senha local → não pode logar com email/senha
            if (!user.password) {
                return res.status(401).json({
                    success: false,
                    message: 'Esta conta usa login social. Entre com Google ou Facebook.',
                });
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return genericFail();

            // Sucesso — limpa tentativas
            await loginAttempts.recordAttempt(email, ip, true);
            await loginAttempts.clearAttempts(email);

            // Emite access + refresh token
            const accessToken = generateAccessToken(user);
            const { token: refreshToken, expiresAt } =
                await refreshTokenService.createRefreshToken(user.id, { ip, userAgent });

            setRefreshCookie(res, refreshToken, expiresAt);

            res.json({
                success: true,
                data: {
                    token:        accessToken,   // mantido pra compat com frontend antigo
                    accessToken,
                    expiresIn:    process.env.ACCESS_TOKEN_TTL || '15m',
                    user: {
                        id:    user.id,
                        name:  user.name,
                        email: user.email,
                        role:  user.role || 'user',
                    },
                },
            });
        } catch (error) {
            logger.error('[login]', error);
            res.status(500).json({ success: false, message: 'Erro ao fazer login' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // REFRESH — emite novo access token a partir do refresh
    // ════════════════════════════════════════════════════════════════
    async refresh(req, res) {
        try {
            const ip        = getClientIp(req);
            const userAgent = req.headers['user-agent'] || '';

            // Refresh token vem do cookie httpOnly (preferido) ou do body (fallback)
            const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;

            if (!rawToken) {
                return res.status(401).json({ success: false, message: 'Refresh token ausente' });
            }

            const result = await refreshTokenService.rotateRefreshToken(rawToken, { ip, userAgent });
            if (!result) {
                clearRefreshCookie(res);
                return res.status(401).json({
                    success: false,
                    message: 'Sessão expirada. Faça login novamente.',
                });
            }

            // Busca usuário pra montar novo access token (precisa de token_version atual)
            const db = getDB();
            const [users] = await db.execute(
                'SELECT id, role, token_version FROM users WHERE id = ?',
                [result.userId]
            );
            if (!users.length) {
                clearRefreshCookie(res);
                return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
            }

            const accessToken = generateAccessToken(users[0]);
            setRefreshCookie(res, result.newToken, result.expiresAt);

            res.json({
                success: true,
                data: {
                    token:       accessToken,
                    accessToken,
                    expiresIn:   process.env.ACCESS_TOKEN_TTL || '15m',
                },
            });
        } catch (error) {
            logger.error('[refresh]', error);
            res.status(500).json({ success: false, message: 'Erro ao renovar sessão' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // LOGOUT — revoga refresh token
    // ════════════════════════════════════════════════════════════════
    async logout(req, res) {
        try {
            const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
            if (rawToken) await refreshTokenService.revokeRefreshToken(rawToken);
            clearRefreshCookie(res);
            res.json({ success: true, message: 'Logout realizado' });
        } catch (error) {
            logger.error('[logout]', error);
            // Logout deve ser idempotente — sempre 200
            clearRefreshCookie(res);
            res.json({ success: true });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // LOGOUT ALL — revoga TODOS os tokens do usuário e incrementa version
    // ════════════════════════════════════════════════════════════════
    async logoutAll(req, res) {
        try {
            const db = getDB();
            await refreshTokenService.revokeAllUserTokens(req.userId);
            await db.execute('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [req.userId]);
            clearRefreshCookie(res);
            res.json({ success: true, message: 'Todas as sessões foram encerradas' });
        } catch (error) {
            logger.error('[logoutAll]', error);
            res.status(500).json({ success: false, message: 'Erro ao encerrar sessões' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // SOCIAL LOGIN — corrigido
    // ════════════════════════════════════════════════════════════════
    async socialLogin(req, res) {
        try {
            const { provider, name, email, provider_id } = req.body;
            const ip        = getClientIp(req);
            const userAgent = req.headers['user-agent'] || '';

            // TODO: validar o id_token do Google no backend (chamada à API do Google)
            //       Sem isso, qualquer um pode forjar um social login enviando dados falsos.
            //       Veja: https://developers.google.com/identity/sign-in/web/backend-auth

            const db = getDB();
            const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

            let user;
            if (existing.length > 0) {
                user = existing[0];

                // Se a conta local existia, NÃO permitir login social automaticamente
                // (atacante pode fazer "takeover" criando conta google com email da vítima).
                if (user.auth_provider === 'local' && user.password) {
                    return res.status(409).json({
                        success: false,
                        message: 'Esta conta já existe com login por senha. Faça login normalmente ou redefina a senha.',
                    });
                }

                // Atualiza nome se mudou
                await db.execute(
                    'UPDATE users SET name = ?, auth_provider = ? WHERE id = ?',
                    [name, provider, user.id]
                );
                user.name          = name;
                user.auth_provider = provider;
            } else {
                // Novo usuário — password NULL (não vazio)
                const [result] = await db.execute(
                    `INSERT INTO users (name, email, password, auth_provider, created_at)
                     VALUES (?, ?, NULL, ?, NOW())`,
                    [name, email, provider]
                );
                user = {
                    id:            result.insertId,
                    name,
                    email,
                    role:          'user',
                    token_version: 0,
                };
            }

            const accessToken = generateAccessToken(user);
            const { token: refreshToken, expiresAt } =
                await refreshTokenService.createRefreshToken(user.id, { ip, userAgent });

            setRefreshCookie(res, refreshToken, expiresAt);

            res.json({
                success: true,
                data: {
                    token:        accessToken,
                    accessToken,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' },
                },
            });
        } catch (error) {
            logger.error('[socialLogin]', error);
            res.status(500).json({ success: false, message: 'Erro ao fazer login social' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // GET PROFILE
    // ════════════════════════════════════════════════════════════════
    async getProfile(req, res) {
        try {
            const db = getDB();
            const [users] = await db.execute(
                // NÃO retornar password, reset_token, token_version
                'SELECT id, name, email, phone, cpf, role, auth_provider, created_at FROM users WHERE id = ?',
                [req.userId]
            );

            if (!users.length) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
            }
            res.json({ success: true, data: users[0] });
        } catch (error) {
            logger.error('[getProfile]', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar perfil' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // UPDATE PROFILE
    // ════════════════════════════════════════════════════════════════
    async updateProfile(req, res) {
        try {
            const { name, phone } = req.body;
            const db = getDB();
            await db.execute(
                'UPDATE users SET name = ?, phone = ? WHERE id = ?',
                [name, phone || null, req.userId]
            );
            res.json({ success: true, message: 'Perfil atualizado com sucesso' });
        } catch (error) {
            logger.error('[updateProfile]', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar perfil' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // CHANGE PASSWORD — invalida tokens antigos
    // ════════════════════════════════════════════════════════════════
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const db = getDB();

            const [users] = await db.execute(
                'SELECT password FROM users WHERE id = ?',
                [req.userId]
            );
            if (!users.length || !users[0].password) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
            }

            const valid = await bcrypt.compare(currentPassword, users[0].password);
            if (!valid) {
                return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

            // Atualiza senha + incrementa token_version (invalida todos os tokens antigos)
            await db.execute(
                'UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?',
                [hashedPassword, req.userId]
            );

            // Revoga todos os refresh tokens
            await refreshTokenService.revokeAllUserTokens(req.userId);

            // Cria novo refresh token pro próprio usuário (não desloga deste dispositivo)
            const ip        = getClientIp(req);
            const userAgent = req.headers['user-agent'] || '';
            const { token: refreshToken, expiresAt } =
                await refreshTokenService.createRefreshToken(req.userId, { ip, userAgent });
            setRefreshCookie(res, refreshToken, expiresAt);

            // Devolve um novo access token também (frontend atualiza)
            const [u] = await db.execute('SELECT id, role, token_version FROM users WHERE id = ?', [req.userId]);
            const accessToken = generateAccessToken(u[0]);

            res.json({
                success: true,
                message: 'Senha alterada com sucesso',
                data: { token: accessToken, accessToken },
            });
        } catch (error) {
            logger.error('[changePassword]', error);
            res.status(500).json({ success: false, message: 'Erro ao alterar senha' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // FORGOT PASSWORD
    // ════════════════════════════════════════════════════════════════
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const db = getDB();

            const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);

            // Sempre retorna a mesma mensagem — não revela se email existe
            const genericResponse = () => res.json({
                success: true,
                message: 'Se o email existir, você receberá um link de recuperação',
            });

            if (!users.length) return genericResponse();

            // Token aleatório com entropia alta
            const token   = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            await db.execute(
                'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
                [token, expires, users[0].id]
            );

            try {
                const { sendClientPasswordResetEmail } = require('../services/emailService');
                await sendClientPasswordResetEmail(email, token);
            } catch (emailErr) {
                // Não vaza falha de email pro atacante — apenas loga
                logger.error('[forgotPassword] erro ao enviar email:', emailErr);
            }

            return genericResponse();
        } catch (error) {
            logger.error('[forgotPassword]', error);
            res.status(500).json({ success: false, message: 'Erro ao processar solicitação' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // RESET PASSWORD — também invalida tokens antigos
    // ════════════════════════════════════════════════════════════════
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            const db = getDB();

            const [users] = await db.execute(
                'SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()',
                [token]
            );
            if (!users.length) {
                return res.status(400).json({ success: false, message: 'Link inválido ou expirado' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

            await db.execute(
                `UPDATE users
                 SET password = ?, reset_token = NULL, reset_expires = NULL,
                     token_version = token_version + 1
                 WHERE id = ?`,
                [hashedPassword, users[0].id]
            );

            // Revoga todos os refresh tokens — quem redefine senha desloga todos
            await refreshTokenService.revokeAllUserTokens(users[0].id);

            res.json({ success: true, message: 'Senha redefinida com sucesso' });
        } catch (error) {
            logger.error('[resetPassword]', error);
            res.status(500).json({ success: false, message: 'Erro ao redefinir senha' });
        }
    }

    // ════════════════════════════════════════════════════════════════
    // UPDATE EMAIL — agora exige senha atual
    // ════════════════════════════════════════════════════════════════
    async updateEmail(req, res) {
        try {
            const { newEmail, password } = req.body;
            const db = getDB();

            // Reautenticação com senha
            const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.userId]);
            if (!users.length || !users[0].password) {
                return res.status(401).json({ success: false, message: 'Não autorizado' });
            }
            const valid = await bcrypt.compare(password, users[0].password);
            if (!valid) {
                return res.status(401).json({ success: false, message: 'Senha incorreta' });
            }

            const [existing] = await db.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [newEmail, req.userId]
            );
            if (existing.length) {
                return res.status(400).json({ success: false, message: 'Este email já está em uso' });
            }

            await db.execute('UPDATE users SET email = ? WHERE id = ?', [newEmail, req.userId]);
            res.json({ success: true, message: 'Email atualizado com sucesso' });
        } catch (error) {
            logger.error('[updateEmail]', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar email' });
        }
    }
}

module.exports = new AuthController();