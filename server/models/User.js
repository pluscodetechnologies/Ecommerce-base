const { getDB } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
    static async create(userData) {
        const db = getDB();
        const { name, email, password, phone, cpf } = userData;
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            `INSERT INTO users (name, email, password, phone, cpf, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
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
            'SELECT id, name, email, phone, cpf, created_at, role FROM users WHERE id = ?',
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
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, id]
        );
        
        return true;
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static generateToken(userId, role = 'user') {
        return jwt.sign(
            { userId, role },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '24h' }
        );
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
        } catch (error) {
            return null;
        }
    }

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