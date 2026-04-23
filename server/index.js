const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/css', express.static(path.join(__dirname, '../client/public/css')));
app.use('/js', express.static(path.join(__dirname, '../client/public/js')));
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

const checkoutRoutes = require('./routes/checkout');
app.use('/api/checkout', checkoutRoutes);

app.get('/api/products/featured', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name, 
                   COALESCE(p.images, '[]') as images
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active' AND p.is_featured = 1
            ORDER BY p.created_at DESC
            LIMIT 8
        `);
        
        products.forEach(p => {
            if (p.images) {
                try { p.images = JSON.parse(p.images); } 
                catch { p.images = []; }
            } else { p.images = []; }
            p.main_image = p.images[0] || 'https://via.placeholder.com/600';
            p.price = parseFloat(p.price) || 0;
            p.promotional_price = p.promotional_price ? parseFloat(p.promotional_price) : null;
        });
        
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Erro ao buscar produtos em destaque:', error);
        res.json({ success: true, data: [] });
    }
});

app.get('/api/products/new-arrivals', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name, 
                   COALESCE(p.images, '[]') as images
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active'
            ORDER BY p.created_at DESC
            LIMIT 8
        `);
        
        products.forEach(p => {
            if (p.images) {
                try { p.images = JSON.parse(p.images); } 
                catch { p.images = []; }
            } else { p.images = []; }
            p.main_image = p.images[0] || 'https://via.placeholder.com/600';
            p.price = parseFloat(p.price) || 0;
            p.promotional_price = p.promotional_price ? parseFloat(p.promotional_price) : null;
        });
        
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Erro ao buscar novidades:', error);
        res.json({ success: true, data: [] });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const category = req.query.category || null;
        const search = req.query.search || null;
        const onSale = req.query.onSale === 'true';
        const sort = req.query.sort || 'newest';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug,
                   COALESCE(p.images, '[]') as images
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active'
        `;
        const params = [];
        
        if (category && category !== 'novidades' && category !== 'mais-vendidos') {
            query += ' AND c.slug = ?';
            params.push(category);
        }
        
        if (onSale) {
            query += ' AND p.promotional_price IS NOT NULL';
        }
        
        if (search) {
            query += ' AND p.name LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (sort === 'price-asc') {
            query += ' ORDER BY COALESCE(p.promotional_price, p.price) ASC';
        } else if (sort === 'price-desc') {
            query += ' ORDER BY COALESCE(p.promotional_price, p.price) DESC';
        } else if (sort === 'best-sellers') {
            query += ' ORDER BY p.sales_count DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }
        
        query += ' LIMIT ' + limit + ' OFFSET ' + offset;
        
        const [products] = await db.execute(query, params);
        
        let countQuery = 'SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = "active"';
        const countParams = [];
        
        if (category && category !== 'novidades' && category !== 'mais-vendidos') {
            countQuery += ' AND c.slug = ?';
            countParams.push(category);
        }
        
        if (onSale) {
            countQuery += ' AND p.promotional_price IS NOT NULL';
        }
        
        if (search) {
            countQuery += ' AND p.name LIKE ?';
            countParams.push(`%${search}%`);
        }
        
        const [total] = await db.execute(countQuery, countParams);
        
        products.forEach(p => {
            if (p.images) {
                try { p.images = JSON.parse(p.images); } 
                catch { p.images = []; }
            } else { p.images = []; }
            p.main_image = p.images[0] || 'https://via.placeholder.com/600';
            p.price = parseFloat(p.price) || 0;
            p.promotional_price = p.promotional_price ? parseFloat(p.promotional_price) : null;
        });
        
        res.json({
            success: true,
            data: products,
            total: total[0].count,
            page,
            totalPages: Math.ceil(total[0].count / limit)
        });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
    }
});

app.get('/api/product/:id', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name, 
                   COALESCE(p.images, '[]') as images
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.status = 'active'
        `, [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado' });
        }
        
        const product = products[0];
        
        if (product.images) {
            if (typeof product.images === 'string') {
                try {
                    product.images = JSON.parse(product.images);
                } catch {
                    product.images = [product.images];
                }
            }
        } else {
            product.images = [];
        }
        
        product.price = parseFloat(product.price) || 0;
        product.promotional_price = product.promotional_price ? parseFloat(product.promotional_price) : null;
        
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar produto' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [categories] = await db.execute('SELECT * FROM categories WHERE status = "active" ORDER BY sort_order, name');
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ success: false, data: [] });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/login.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/products.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/product-detail.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/checkout.html'));
});

app.get('/checkout-success', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/checkout-success.html'));
});

app.get('/checkout-pending', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/checkout-pending.html'));
});

app.get('/checkout-error', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/checkout-error.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/account.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/dashboard.html'));
});

app.get('/admin/produtos', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/produtos.html'));
});

app.get('/admin/pedidos', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/pedidos.html'));
});

app.get('/admin/categorias', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/categorias.html'));
});

app.get('/admin/clientes', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/clientes.html'));
});

app.get('/admin/banners', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/banners.html'));
});

app.get('/admin/cupons', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/cupons.html'));
});

app.get('/admin/relatorios', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/relatorios.html'));
});

app.get('/admin/configuracoes', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/configuracoes.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
});