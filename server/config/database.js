const mysql = require('mysql2/promise');

let pool = null;

async function connectDB() {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'velvet_store',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const connection = await pool.getConnection();
        console.log('✅ MySQL conectado com sucesso!');
        connection.release();
        
        return pool;
    } catch (error) {
        console.error('❌ Erro ao conectar ao MySQL:', error.message);
        throw error;
    }
}

function getDB() {
    if (!pool) {
        throw new Error('Banco de dados não inicializado. Chame connectDB() primeiro.');
    }
    return pool;
}

module.exports = { connectDB, getDB };