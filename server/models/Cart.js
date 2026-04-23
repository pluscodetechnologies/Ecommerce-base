const { getDB } = require('../config/database');

class Cart {
    static async getOrCreateCart(userId = null, sessionId = null) {
        const db = getDB();
        let cart = null;
        
        if (userId) {
            const [carts] = await db.execute('SELECT * FROM carts WHERE user_id = ?', [userId]);
            if (carts.length > 0) {
                cart = carts[0];
            }
        }
        
        if (!cart && sessionId) {
            const [carts] = await db.execute('SELECT * FROM carts WHERE session_id = ?', [sessionId]);
            if (carts.length > 0) {
                cart = carts[0];
            }
        }
        
        if (!cart) {
            const [result] = await db.execute(
                'INSERT INTO carts (user_id, session_id) VALUES (?, ?)',
                [userId, sessionId]
            );
            cart = { id: result.insertId, user_id: userId, session_id: sessionId };
        }
        
        return cart;
    }
    
    static async getCartItems(cartId) {
        const db = getDB();
        const [items] = await db.execute(`
            SELECT ci.*, p.name, p.slug, 
                   COALESCE(p.images, '[]') as images,
                   p.promotional_price
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        `, [cartId]);
        
        items.forEach(item => {
            if (item.images) {
                try { item.images = JSON.parse(item.images); } 
                catch { item.images = []; }
            } else {
                item.images = [];
            }
            item.main_image = item.images[0] || 'https://via.placeholder.com/300x400';
            item.final_price = item.promotional_price ? parseFloat(item.promotional_price) : parseFloat(item.price);
        });
        
        return items;
    }
    
    static async addItem(cartId, productId, quantity) {
        const db = getDB();
        
        const [products] = await db.execute(
            'SELECT price, promotional_price, stock FROM products WHERE id = ? AND status = "active"',
            [productId]
        );
        
        if (products.length === 0) {
            throw new Error('Produto não encontrado');
        }
        
        const product = products[0];
        
        if (product.stock < quantity) {
            throw new Error('Estoque insuficiente');
        }
        
        const finalPrice = product.promotional_price || product.price;
        
        const [existing] = await db.execute(
            'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
            [cartId, productId]
        );
        
        if (existing.length > 0) {
            await db.execute(
                'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                [quantity, existing[0].id]
            );
        } else {
            await db.execute(
                'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [cartId, productId, quantity, finalPrice]
            );
        }
        
        await db.execute('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cartId]);
        
        return true;
    }
    
    static async updateItemQuantity(cartId, itemId, quantity) {
        const db = getDB();
        
        if (quantity <= 0) {
            await db.execute('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cartId]);
        } else {
            await db.execute(
                'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
                [quantity, itemId, cartId]
            );
        }
        
        await db.execute('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cartId]);
        
        return true;
    }
    
    static async removeItem(cartId, itemId) {
        const db = getDB();
        await db.execute('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cartId]);
        await db.execute('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cartId]);
        return true;
    }
    
    static async clearCart(cartId) {
        const db = getDB();
        await db.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        await db.execute('UPDATE carts SET updated_at = NOW() WHERE id = ?', [cartId]);
        return true;
    }
    
    static async getCartTotal(cartId) {
        const db = getDB();
        const [result] = await db.execute(
            'SELECT SUM(quantity * price) as total, SUM(quantity) as items FROM cart_items WHERE cart_id = ?',
            [cartId]
        );
        return {
            subtotal: parseFloat(result[0].total) || 0,
            items: parseInt(result[0].items) || 0
        };
    }
    
    static async mergeCarts(userId, sessionId) {
        const db = getDB();
        
        const sessionCart = await this.getOrCreateCart(null, sessionId);
        const userCart = await this.getOrCreateCart(userId, null);
        
        if (sessionCart.id !== userCart.id) {
            const sessionItems = await this.getCartItems(sessionCart.id);
            
            for (const item of sessionItems) {
                await this.addItem(userCart.id, item.product_id, item.quantity);
            }
            
            await db.execute('DELETE FROM carts WHERE id = ?', [sessionCart.id]);
        }
        
        return userCart;
    }
}

module.exports = Cart;