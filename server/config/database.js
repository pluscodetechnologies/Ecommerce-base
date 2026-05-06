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

        // Migration automática: adiciona sort_order em products se não existir
        try {
            await connection.execute(
                "ALTER TABLE `products` ADD COLUMN `sort_order` INT DEFAULT 0 COMMENT 'Ordem de exibição'"
            );
            await connection.execute(
                "UPDATE `products` p JOIN (SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1) * 10 AS rn FROM `products`) ranked ON p.id = ranked.id SET p.sort_order = ranked.rn"
            );
            console.log('✅ Coluna sort_order adicionada em products');
        } catch (e) {
            if (e.errno !== 1060) console.warn('Migration sort_order products:', e.message);
        }

        // Migration automática: adiciona sort_order em store_alerts se não existir
        try {
            await connection.execute(
                "ALTER TABLE `store_alerts` ADD COLUMN `sort_order` INT DEFAULT 0"
            );
            console.log('✅ Coluna sort_order adicionada em store_alerts');
        } catch (e) {
            if (e.errno !== 1060) console.warn('Migration sort_order store_alerts:', e.message);
        }

        // Migration automática: adiciona sort_order em product_colors se não existir
        try {
            await connection.execute(
                "ALTER TABLE `product_colors` ADD COLUMN `sort_order` INT DEFAULT 0 COMMENT 'Ordem de exibição das cores'"
            );
            console.log('✅ Coluna sort_order adicionada em product_colors');
        } catch (e) {
            if (e.errno !== 1060) console.warn('Migration sort_order product_colors:', e.message);
        }

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