const { getDB } = require('../config/database');

class AdminController {
    async getDashboardStats(req, res) {
        try {
            const db = getDB();
            
            const [totalOrders] = await db.execute('SELECT COUNT(*) as count FROM orders');
            const [totalRevenue] = await db.execute('SELECT SUM(total_amount) as total FROM orders WHERE status IN ("paid", "shipped", "delivered")');
            const [totalProducts] = await db.execute('SELECT COUNT(*) as count FROM products');
            const [totalCustomers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"');
            const [recentOrders] = await db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
            const [lowStock] = await db.execute('SELECT * FROM products WHERE stock < 5 AND status = "active" LIMIT 5');
            const [topProducts] = await db.execute(`
                SELECT p.name, SUM(oi.quantity) as sold
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                GROUP BY p.id
                ORDER BY sold DESC
                LIMIT 5
            `);
            
            res.json({
                success: true,
                data: {
                    totalOrders: totalOrders[0].count,
                    totalRevenue: totalRevenue[0].total || 0,
                    totalProducts: totalProducts[0].count,
                    totalCustomers: totalCustomers[0].count,
                    recentOrders,
                    lowStock,
                    topProducts
                }
            });
        } catch (error) {
            console.error('Erro ao buscar stats:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
        }
    }

    async getOrders(req, res) {
        try {
            const db = getDB();
            const status = req.query.status || null;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            let query = 'SELECT * FROM orders';
            const params = [];
            
            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }
            
            query += ' ORDER BY created_at DESC LIMIT ' + limit + ' OFFSET ' + offset;
            
            const [orders] = await db.execute(query, params);
            const [total] = await db.execute('SELECT COUNT(*) as count FROM orders' + (status ? ' WHERE status = ?' : ''), status ? [status] : []);
            
            res.json({
                success: true,
                data: {
                    orders,
                    total: total[0].count,
                    page: page,
                    totalPages: Math.ceil(total[0].count / limit)
                }
            });
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar pedidos' });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const db = getDB();
            
            await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
            
            res.json({ success: true, message: 'Status atualizado com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar status' });
        }
    }

    async getProducts(req, res) {
        try {
            const db = getDB();
            const category = req.query.category || null;
            const search = req.query.search || null;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            let query = `
                SELECT p.*, c.name as category_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE 1=1
            `;
            const params = [];
            
            if (category) {
                query += ' AND p.category_id = ?';
                params.push(category);
            }
            
            if (search) {
                query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            
            query += ' ORDER BY p.created_at DESC LIMIT ' + limit + ' OFFSET ' + offset;
            
            const [products] = await db.execute(query, params);
            const [total] = await db.execute('SELECT COUNT(*) as count FROM products');
            
            res.json({
                success: true,
                data: {
                    products,
                    total: total[0].count,
                    page: page,
                    totalPages: Math.ceil(total[0].count / limit)
                }
            });
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar produtos' });
        }
    }

    async createProduct(req, res) {
    try {
        const db = getDB();
        const { name, description, price, promotional_price, sku, stock, category_id, status, is_featured, images } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ success: false, message: 'Nome e preço são obrigatórios' });
        }
        
        const slug = name.toLowerCase()
            .replace(/[áàãâä]/g, 'a')
            .replace(/[éèêë]/g, 'e')
            .replace(/[íìîï]/g, 'i')
            .replace(/[óòõôö]/g, 'o')
            .replace(/[úùûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        const [result] = await db.execute(
            `INSERT INTO products (name, slug, description, price, promotional_price, sku, stock, category_id, status, is_featured, images, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [name, slug, description || null, price, promotional_price || null, sku || null, stock || 0, category_id || null, status || 'active', is_featured || false, JSON.stringify(images || [])]
        );
        
        res.status(201).json({
            success: true,
            message: 'Produto criado com sucesso',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ success: false, message: 'Erro ao criar produto' });
    }
}

async updateProduct(req, res) {
    try {
        const { id } = req.params;
        const { name, description, price, promotional_price, sku, stock, category_id, status, is_featured, images } = req.body;
        const db = getDB();
        
        const slug = name.toLowerCase()
            .replace(/[áàãâä]/g, 'a')
            .replace(/[éèêë]/g, 'e')
            .replace(/[íìîï]/g, 'i')
            .replace(/[óòõôö]/g, 'o')
            .replace(/[úùûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        await db.execute(
            `UPDATE products SET name = ?, slug = ?, description = ?, price = ?, promotional_price = ?,
             sku = ?, stock = ?, category_id = ?, status = ?, is_featured = ?, images = ? WHERE id = ?`,
            [name, slug, description || null, price, promotional_price || null, sku || null, stock || 0, category_id || null, status, is_featured || false, JSON.stringify(images || []), id]
        );
        
        res.json({ success: true, message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar produto' });
    }
}

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const db = getDB();
            
            await db.execute('DELETE FROM products WHERE id = ?', [id]);
            
            res.json({ success: true, message: 'Produto excluído com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            res.status(500).json({ success: false, message: 'Erro ao excluir produto' });
        }
    }

    async getCategories(req, res) {
        try {
            const db = getDB();
            const [categories] = await db.execute('SELECT * FROM categories ORDER BY sort_order, name');
            
            res.json({ success: true, data: categories });
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar categorias' });
        }
    }

    async createCategory(req, res) {
    try {
        const db = getDB();
        const { name, description, image_url, sort_order, status } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
        
        const slug = name.toLowerCase().replace(/[áàãâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[íìîï]/g,'i').replace(/[óòõôö]/g,'o').replace(/[úùûü]/g,'u').replace(/[ç]/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        
        const [result] = await db.execute(
            'INSERT INTO categories (name, slug, description, image_url, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, slug, description || null, image_url || null, sort_order || 0, status || 'active']
        );
        res.status(201).json({ success: true, message: 'Categoria criada com sucesso', data: { id: result.insertId } });
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ success: false, message: 'Erro ao criar categoria' });
    }
}

async updateCategory(req, res) {
    try {
        const { id } = req.params;
        const { name, description, image_url, sort_order, status } = req.body;
        const db = getDB();
        const slug = name.toLowerCase().replace(/[áàãâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[íìîï]/g,'i').replace(/[óòõôö]/g,'o').replace(/[úùûü]/g,'u').replace(/[ç]/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        
        await db.execute(
            'UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, sort_order = ?, status = ? WHERE id = ?',
            [name, slug, description || null, image_url || null, sort_order || 0, status, id]
        );
        res.json({ success: true, message: 'Categoria atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ success: false, message: 'Erro ao atualizar categoria' });
    }
}

    async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const db = getDB();
            
            const [products] = await db.execute('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
            
            if (products[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Não é possível excluir categoria com produtos vinculados'
                });
            }
            
            await db.execute('DELETE FROM categories WHERE id = ?', [id]);
            
            res.json({ success: true, message: 'Categoria excluída com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            res.status(500).json({ success: false, message: 'Erro ao excluir categoria' });
        }
    }

    async getCustomers(req, res) {
        try {
            const db = getDB();
            const search = req.query.search || null;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            let query = 'SELECT id, name, email, phone, cpf, role, created_at FROM users WHERE role = "user"';
            const params = [];
            
            if (search) {
                query += ' AND (name LIKE ? OR email LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            
            query += ' ORDER BY created_at DESC LIMIT ' + limit + ' OFFSET ' + offset;
            
            const [customers] = await db.execute(query, params);
            const [total] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"');
            
            res.json({
                success: true,
                data: {
                    customers,
                    total: total[0].count,
                    page: page,
                    totalPages: Math.ceil(total[0].count / limit)
                }
            });
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar clientes' });
        }
    }

    async getBanners(req, res) {
        try {
            const db = getDB();
            const [banners] = await db.execute('SELECT * FROM banners ORDER BY sort_order');
            
            res.json({ success: true, data: banners });
        } catch (error) {
            console.error('Erro ao buscar banners:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar banners' });
        }
    }

    async createBanner(req, res) {
        try {
            const db = getDB();
            const { title, subtitle, image_url, link, position, sort_order, is_active } = req.body;
            
            const [result] = await db.execute(
                'INSERT INTO banners (title, subtitle, image_url, link, position, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, subtitle || null, image_url, link || null, position || 'hero', sort_order || 0, is_active !== false ? 1 : 0]
            );
            
            res.status(201).json({
                success: true,
                message: 'Banner criado com sucesso',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Erro ao criar banner:', error);
            res.status(500).json({ success: false, message: 'Erro ao criar banner' });
        }
    }

    async updateBanner(req, res) {
        try {
            const { id } = req.params;
            const { title, subtitle, image_url, link, position, sort_order, is_active } = req.body;
            const db = getDB();
            
            await db.execute(
                'UPDATE banners SET title = ?, subtitle = ?, image_url = ?, link = ?, position = ?, sort_order = ?, is_active = ? WHERE id = ?',
                [title, subtitle || null, image_url, link || null, position, sort_order || 0, is_active !== false ? 1 : 0, id]
            );
            
            res.json({ success: true, message: 'Banner atualizado com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar banner:', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar banner' });
        }
    }

    async deleteBanner(req, res) {
        try {
            const { id } = req.params;
            const db = getDB();
            
            await db.execute('DELETE FROM banners WHERE id = ?', [id]);
            
            res.json({ success: true, message: 'Banner excluído com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir banner:', error);
            res.status(500).json({ success: false, message: 'Erro ao excluir banner' });
        }
    }

    async getCoupons(req, res) {
        try {
            const db = getDB();
            const [coupons] = await db.execute('SELECT * FROM coupons ORDER BY created_at DESC');
            
            res.json({ success: true, data: coupons });
        } catch (error) {
            console.error('Erro ao buscar cupons:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar cupons' });
        }
    }

    async createCoupon(req, res) {
        try {
            const db = getDB();
            const { code, description, discount_type, discount_value, min_purchase, max_uses, starts_at, expires_at } = req.body;
            
            const [result] = await db.execute(
                `INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_uses, starts_at, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [code, description || null, discount_type, discount_value, min_purchase || 0, max_uses || null, starts_at || null, expires_at || null]
            );
            
            res.status(201).json({
                success: true,
                message: 'Cupom criado com sucesso',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Erro ao criar cupom:', error);
            res.status(500).json({ success: false, message: 'Erro ao criar cupom' });
        }
    }

    async deleteCoupon(req, res) {
        try {
            const { id } = req.params;
            const db = getDB();
            
            await db.execute('DELETE FROM coupons WHERE id = ?', [id]);
            
            res.json({ success: true, message: 'Cupom excluído com sucesso' });
        } catch (error) {
            console.error('Erro ao excluir cupom:', error);
            res.status(500).json({ success: false, message: 'Erro ao excluir cupom' });
        }
    }

    async getSalesReport(req, res) {
        try {
            const db = getDB();
            const start_date = req.query.start_date || null;
            const end_date = req.query.end_date || null;
            
            let query = `
                SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
                FROM orders
                WHERE status IN ('paid', 'shipped', 'delivered')
            `;
            const params = [];
            
            if (start_date) {
                query += ' AND DATE(created_at) >= ?';
                params.push(start_date);
            }
            
            if (end_date) {
                query += ' AND DATE(created_at) <= ?';
                params.push(end_date);
            }
            
            query += ' GROUP BY DATE(created_at) ORDER BY date DESC';
            
            const [report] = await db.execute(query, params);
            
            res.json({ success: true, data: report });
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
        }
    }

    async getSettings(req, res) {
        try {
            const db = getDB();
            const [settings] = await db.execute('SELECT * FROM store_settings');
            
            res.json({ success: true, data: settings });
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar configurações' });
        }
    }

    async updateSettings(req, res) {
        try {
            const db = getDB();
            const settings = req.body;
            
            for (const [key, value] of Object.entries(settings)) {
                await db.execute(
                    'UPDATE store_settings SET setting_value = ? WHERE setting_key = ?',
                    [String(value), key]
                );
            }
            
            res.json({ success: true, message: 'Configurações atualizadas com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            res.status(500).json({ success: false, message: 'Erro ao atualizar configurações' });
        }
    }
}

module.exports = new AdminController();