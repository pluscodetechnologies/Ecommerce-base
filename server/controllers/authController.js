const User = require('../models/User');
const { getDB } = require('../config/database');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

class AuthController {
    async register(req, res) {
        try {
            const { name, email, password, phone, cpf } = req.body;
            
            // Validação de senha forte
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo (@$!%*?&)'
                });
            }
            
            // Verificar se email já existe
            const db = getDB();
            const [existing] = await db.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email já cadastrado'
                });
            }
            
            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Criar usuário
            const [result] = await db.execute(
                `INSERT INTO users (name, email, password, phone, cpf, created_at) 
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [name, email, hashedPassword, phone || null, cpf || null]
            );
            
            res.status(201).json({
                success: true,
                message: 'Conta criada com sucesso!',
                data: { userId: result.insertId }
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao criar usuário. Tente novamente.'
            });
        }
    }
    
    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            const db = getDB();
            const [users] = await db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            
            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou senha incorretos'
                });
            }
            
            const user = users[0];
            
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou senha incorretos'
                });
            }
            
            const token = User.generateToken(user.id, user.role || 'user');
            
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role || 'user'
                    }
                }
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao fazer login'
            });
        }
    }
    
    async getProfile(req, res) {
        try {
            const db = getDB();
            const [users] = await db.execute(
                'SELECT id, name, email, phone, cpf, role, created_at FROM users WHERE id = ?',
                [req.userId]
            );
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }
            
            res.json({
                success: true,
                data: users[0]
            });
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar perfil'
            });
        }
    }
    
    async updateProfile(req, res) {
        try {
            const { name, phone } = req.body;
            const db = getDB();
            
            await db.execute(
                'UPDATE users SET name = ?, phone = ? WHERE id = ?',
                [name, phone, req.userId]
            );
            
            res.json({
                success: true,
                message: 'Perfil atualizado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar perfil'
            });
        }
    }
    
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const db = getDB();
            
            const [users] = await db.execute(
                'SELECT password FROM users WHERE id = ?',
                [req.userId]
            );
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }
            
            const validPassword = await bcrypt.compare(currentPassword, users[0].password);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Senha atual incorreta'
                });
            }
            
            // Validação de senha forte
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: 'A nova senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo'
                });
            }
            
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            await db.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, req.userId]
            );
            
            res.json({
                success: true,
                message: 'Senha alterada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao alterar senha'
            });
        }
    }
    
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const db = getDB();

            const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);

            // Sempre retorna sucesso para não revelar se o email existe
            if (!users.length) {
                return res.json({ success: true, message: 'Se o email existir, você receberá um link de recuperação' });
            }

            const crypto = require('crypto');
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

            await db.execute(
                'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
                [token, expires, users[0].id]
            );

            const { sendPasswordResetEmail } = require('../services/emailService');
            await sendPasswordResetEmail(email, token);

            res.json({ success: true, message: 'Se o email existir, você receberá um link de recuperação' });
        } catch (error) {
            console.error('Erro ao recuperar senha:', error);
            res.status(500).json({ success: false, message: 'Erro ao processar solicitação' });
        }
    }

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

            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: 'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo'
                });
            }

            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await db.execute(
                'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
                [hashedPassword, users[0].id]
            );

            res.json({ success: true, message: 'Senha redefinida com sucesso' });
        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            res.status(500).json({ success: false, message: 'Erro ao redefinir senha' });
        }
    }

    async updateEmail(req, res) {
        try {
            const { newEmail } = req.body;
            const db = getDB();

            if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                return res.status(400).json({ success: false, message: 'Email inválido' });
            }

            const [existing] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail, req.userId]);
            if (existing.length) {
                return res.status(400).json({ success: false, message: 'Este email já está em uso' });
            }

            await db.execute('UPDATE users SET email = ? WHERE id = ?', [newEmail, req.userId]);

            res.json({ success: true, message: 'Email atualizado com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar email:', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar email' });
        }
    }
}
module.exports = new AuthController();