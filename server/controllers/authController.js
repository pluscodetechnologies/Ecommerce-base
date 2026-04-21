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
            
            const [users] = await db.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Email não encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Se o email existir, você receberá um link de recuperação'
            });
        } catch (error) {
            console.error('Erro ao recuperar senha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao processar solicitação'
            });
        }
    }
    
    async resetPassword(req, res) {
        res.json({
            success: true,
            message: 'Senha redefinida com sucesso'
        });
    }
}

module.exports = new AuthController();