const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Hash gerado:', hashedPassword);
    
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'velvet_store'
    });
    
    await pool.execute('DELETE FROM users WHERE email = ?', ['admin@velvetstore.com']);
    
    await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Administrador', 'admin@velvetstore.com', hashedPassword, 'admin']
    );
    
    console.log('✅ Admin criado com sucesso!');
    console.log('Email: admin@velvetstore.com');
    console.log('Senha: admin123');
    
    process.exit(0);
}

createAdmin().catch(console.error);