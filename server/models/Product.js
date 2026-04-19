const { getDB } = require('../config/database');

class Product {
    static async findAll(filters = {}) {
        const db = getDB();
        let query = `
            SELECT p.*, c.name as category_name,
                   (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active'
        `;
        
        const params = [];
        
        if (filters.category_id) {
            query += ' AND p.category_id = ?';
            params.push(filters.category_id);
        }
        
        if (filters.search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        
        if (filters.min_price) {
            query += ' AND p.price >= ?';
            params.push(filters.min_price);
        }
        
        if (filters.max_price) {
            query += ' AND p.price <= ?';
            params.push(filters.max_price);
        }
        
        query += ' ORDER BY p.created_at DESC';
        
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
            
            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }
        }
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async findById(id) {
        const db = getDB();
        
        // Buscar produto
        const [products] = await db.execute(
            `SELECT p.*, c.name as category_name 
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [id]
        );
        
        if (products.length === 0) return null;
        
        const product = products[0];
        
        // Buscar imagens
        const [images] = await db.execute(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, sort_order ASC',
            [id]
        );
        product.images = images;
        
        // Buscar variações
        const [variations] = await db.execute(
            'SELECT * FROM product_variations WHERE product_id = ?',
            [id]
        );
        product.variations = variations;
        
        // Buscar avaliações
        const [reviews] = await db.execute(
            `SELECT r.*, u.name as user_name 
             FROM product_reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ? AND r.status = 'approved'
             ORDER BY r.created_at DESC`,
            [id]
        );
        product.reviews = reviews;
        
        return product;
    }

    static async create(productData) {
        const db = getDB();
        const { name, description, price, promotional_price, sku, stock, category_id, status } = productData;
        
        const [result] = await db.execute(
            `INSERT INTO products 
             (name, description, price, promotional_price, sku, stock, category_id, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [name, description, price, promotional_price, sku, stock, category_id, status || 'active']
        );
        
        return result.insertId;
    }

    static async update(id, productData) {
        const db = getDB();
        const { name, description, price, promotional_price, sku, stock, category_id, status } = productData;
        
        await db.execute(
            `UPDATE products 
             SET name = ?, description = ?, price = ?, promotional_price = ?, 
                 sku = ?, stock = ?, category_id = ?, status = ?, updated_at = NOW()
             WHERE id = ?`,
            [name, description, price, promotional_price, sku, stock, category_id, status, id]
        );
        
        return true;
    }

    static async delete(id) {
        const db = getDB();
        await db.execute('DELETE FROM products WHERE id = ?', [id]);
        return true;
    }

    static async updateStock(id, quantity) {
        const db = getDB();
        await db.execute(
            'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
            [quantity, id, quantity]
        );
        return true;
    }

    static async addImage(productId, imageUrl, isMain = false) {
        const db = getDB();
        
        if (isMain) {
            await db.execute(
                'UPDATE product_images SET is_main = 0 WHERE product_id = ?',
                [productId]
            );
        }
        
        const [result] = await db.execute(
            'INSERT INTO product_images (product_id, image_url, is_main) VALUES (?, ?, ?)',
            [productId, imageUrl, isMain ? 1 : 0]
        );
        
        return result.insertId;
    }

    static async getFeatured(limit = 8) {
        const db = getDB();
        const [rows] = await db.execute(
            `SELECT p.*, 
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
             FROM products p
             WHERE p.status = 'active' AND p.stock > 0
             ORDER BY p.sales_count DESC, p.created_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async getNewArrivals(limit = 8) {
        const db = getDB();
        const [rows] = await db.execute(
            `SELECT p.*, 
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
             FROM products p
             WHERE p.status = 'active' AND p.stock > 0
             ORDER BY p.created_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }
}

module.exports = Product;