const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool;

const connectDB = async () => {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'velvet_store',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        });

        // Testar conexão
        const connection = await pool.getConnection();
        console.log('Banco de dados conectado com sucesso!');
        connection.release();
        
        return pool;
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error.message);
        process.exit(1);
    }
};

const getDB = () => {
    if (!pool) {
        throw new Error('Banco de dados não inicializado');
    }
    return pool;
};

module.exports = { connectDB, getDB };