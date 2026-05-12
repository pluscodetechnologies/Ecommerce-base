const { getDB } = require('../config/database');
const bcrypt = require('bcrypt');
const { generateAccessToken, verifyAccessToken } = require('../middleware/auth');

const BCRYPT_ROUNDS = 12;

class User {
    static async create(userData) {
        const db = getDB();
        const { name, email, password, phone, cpf } = userData;

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const [result] = await db.execute(
            `INSERT INTO users (name, email, password, phone, cpf, auth_provider, created_at)
             VALUES (?, ?, ?, ?, ?, 'local', NOW())`,
            [name, email, hashedPassword, phone, cpf]
        );

        return result.insertId;
    }

    static async findByEmail(email) {
        const db = getDB();
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async findById(id) {
        const db = getDB();
        const [rows] = await db.execute(
            // Nunca retornar password ou reset_token aqui
            'SELECT id, name, email, phone, cpf, created_at, role, auth_provider FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, userData) {
        const db = getDB();
        const { name, phone } = userData;

        await db.execute(
            'UPDATE users SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?',
            [name, phone, id]
        );

        return true;
    }

    static async updatePassword(id, newPassword) {
        const db = getDB();
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        // Incrementa token_version → invalida sessões antigas
        await db.execute(
            'UPDATE users SET password = ?, token_version = token_version + 1, updated_at = NOW() WHERE id = ?',
            [hashedPassword, id]
        );

        return true;
    }

    static async comparePassword(password, hashedPassword) {
        if (!hashedPassword) return false;   // social login user
        return await bcrypt.compare(password, hashedPassword);
    }

    // ────────────────────────────────────────────────────────────────
    // generateToken / verifyToken: delegam pro middleware/auth.js
    // (mantido só pra compat com código antigo que usa User.generateToken)
    // ────────────────────────────────────────────────────────────────
    static generateToken(userId, role = 'user', tokenVersion = 0) {
        return generateAccessToken({ id: userId, role, token_version: tokenVersion });
    }

    static verifyToken(token) {
        return verifyAccessToken(token);
    }

    // ────────────────────────────────────────────────────────────────
    // Endereços
    // ────────────────────────────────────────────────────────────────
    static async addAddress(userId, addressData) {
        const db = getDB();
        const { street, number, complement, neighborhood, city, state, zip_code, is_default } = addressData;

        if (is_default) {
            await db.execute(
                'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
                [userId]
            );
        }

        const [result] = await db.execute(
            `INSERT INTO user_addresses
             (user_id, street, number, complement, neighborhood, city, state, zip_code, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, street, number, complement, neighborhood, city, state, zip_code, is_default || 0]
        );

        return result.insertId;
    }

    static async getAddresses(userId) {
        const db = getDB();
        const [rows] = await db.execute(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC',
            [userId]
        );
        return rows;
    }
}

module.exports = User;
