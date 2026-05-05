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
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/css',     express.static(path.join(__dirname, '../client/public/css')));
app.use('/js',      express.static(path.join(__dirname, '../client/public/js')));
app.use('/images',  express.static(path.join(__dirname, '../client/public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Desabilitar cache para todas as rotas /api ────────────────────────────────
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// ── Rotas da API ──────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const adminRoutes     = require('./routes/admin');
const cartRoutes      = require('./routes/cart');
const checkoutRoutes  = require('./routes/checkout');
const reviewRoutes    = require('./routes/reviews');
const orderRoutes     = require('./routes/orders');
const wishlistRoutes  = require('./routes/wishlist');
const variationRoutes = require('./routes/variations');
const colorRoutes     = require('./routes/colors');

app.use('/api/auth',       authRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/checkout',   checkoutRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/wishlist',   wishlistRoutes);
app.use('/api/variations', variationRoutes);
app.use('/api/colors',     colorRoutes);

// ── Produtos ──────────────────────────────────────────────────────────────────
function parseProduct(p) {
    try { p.images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []); } catch { p.images = []; }
    p.main_image = p.images[0] || 'https://via.placeholder.com/600';
    p.price = parseFloat(p.price) || 0;
    p.promotional_price = p.promotional_price ? parseFloat(p.promotional_price) : null;
    return p;
}

app.get('/api/products/featured', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name, COALESCE(p.images, '[]') as images
            FROM products p LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active' AND p.is_featured = 1
            ORDER BY p.created_at DESC LIMIT 8
        `);
        res.json({ success: true, data: products.map(parseProduct) });
    } catch (e) { console.error(e); res.json({ success: true, data: [] }); }
});

app.get('/api/products/new-arrivals', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name, COALESCE(p.images, '[]') as images
            FROM products p LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active' ORDER BY p.created_at DESC LIMIT 8
        `);
        res.json({ success: true, data: products.map(parseProduct) });
    } catch (e) { console.error(e); res.json({ success: true, data: [] }); }
});

app.get('/api/products', async (req, res) => {
    try {
        const db       = require('./config/database').getDB();
        const category = req.query.category || null;
        const search   = req.query.search   || null;
        const onSale   = req.query.onSale === 'true';
        const sort     = req.query.sort  || 'newest';
        const page     = parseInt(req.query.page)  || 1;
        const limit    = parseInt(req.query.limit) || 12;
        const offset   = (page - 1) * limit;

        let query = `SELECT p.*, c.name as category_name, c.slug as category_slug, COALESCE(p.images, '[]') as images
                     FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active'`;
        const params = [];

        if (category && !['novidades','mais-vendidos'].includes(category)) { query += ' AND c.slug = ?'; params.push(category); }
        if (onSale)  { query += ' AND p.promotional_price IS NOT NULL'; }
        if (search)  { query += ' AND p.name LIKE ?'; params.push(`%${search}%`); }

        if (sort === 'price-asc')        query += ' ORDER BY COALESCE(p.promotional_price, p.price) ASC';
        else if (sort === 'price-desc')  query += ' ORDER BY COALESCE(p.promotional_price, p.price) DESC';
        else if (sort === 'best-sellers')query += ' ORDER BY p.sales_count DESC';
        else                             query += ' ORDER BY p.created_at DESC';

        query += ` LIMIT ${limit} OFFSET ${offset}`;
        const [products] = await db.execute(query, params);

        let cq = 'SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = "active"';
        const cp = [];
        if (category && !['novidades','mais-vendidos'].includes(category)) { cq += ' AND c.slug = ?'; cp.push(category); }
        if (onSale) { cq += ' AND p.promotional_price IS NOT NULL'; }
        if (search) { cq += ' AND p.name LIKE ?'; cp.push(`%${search}%`); }
        const [total] = await db.execute(cq, cp);

        res.json({ success: true, data: products.map(parseProduct), total: total[0].count, page, totalPages: Math.ceil(total[0].count / limit) });
    } catch (e) { console.error(e); res.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 }); }
});

app.get('/api/product/:id', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [rows] = await db.execute(`
            SELECT p.*, c.name as category_name, COALESCE(p.images, '[]') as images
            FROM products p LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.status = 'active'
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Produto não encontrado' });
        res.json({ success: true, data: parseProduct(rows[0]) });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erro ao buscar produto' }); }
});

app.get('/api/alerts', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [alerts] = await db.execute('SELECT * FROM store_alerts WHERE is_active = 1 ORDER BY created_at DESC');
        res.json({ success: true, data: alerts });
    } catch (e) { res.status(500).json({ success: false, data: [] }); }
});

app.get('/api/banners', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [banners] = await db.execute('SELECT * FROM banners WHERE is_active = 1 AND position = "hero" ORDER BY sort_order');
        res.json({ success: true, data: banners });
    } catch (e) { res.status(500).json({ success: false, message: 'Erro ao buscar banners' }); }
});

app.get('/api/categories', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const [categories] = await db.execute('SELECT * FROM categories WHERE status = "active" ORDER BY sort_order, name');
        res.json({ success: true, data: categories });
    } catch (e) { console.error(e); res.status(500).json({ success: false, data: [] }); }
});

app.post('/api/coupons/validate', async (req, res) => {
    try {
        const db = require('./config/database').getDB();
        const { code, userId } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Informe o código do cupom' });
        const [rows] = await db.execute('SELECT * FROM coupons WHERE code = ? AND status = "active"', [code.trim().toUpperCase()]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Cupom inválido ou inativo' });
        const c = rows[0];
        if (c.expires_at && new Date(c.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'Este cupom já expirou' });
        if (c.max_uses && c.used_count >= c.max_uses) return res.status(400).json({ success: false, message: 'Este cupom atingiu o limite de usos' });
        if (c.max_uses === 1 && userId) {
            const [u] = await db.execute('SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?', [c.id, userId]);
            if (u.length) return res.status(400).json({ success: false, message: 'Você já utilizou este cupom' });
        }
        res.json({ success: true, data: { id: c.id, code: c.code, discount_type: c.discount_type, discount_value: parseFloat(c.discount_value), min_purchase: parseFloat(c.min_purchase || 0), description: c.description } });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erro ao validar cupom' }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Páginas HTML ──────────────────────────────────────────────────────────────
const v = (file) => (req, res) => res.sendFile(path.join(__dirname, file));
app.get('/',                     v('../client/views/index.html'));
app.get('/login',                v('../client/views/login.html'));
app.get('/products',             v('../client/views/products.html'));
app.get('/product',              v('../client/views/product-detail.html'));
app.get('/cart',                 v('../client/views/cart.html'));
app.get('/checkout',             v('../client/views/checkout.html'));
app.get('/checkout-success',     v('../client/views/checkout-success.html'));
app.get('/checkout-pending',     v('../client/views/checkout-pending.html'));
app.get('/checkout-error',       v('../client/views/checkout-error.html'));
app.get('/account',              v('../client/views/account.html'));
app.get('/admin',                v('../client/views/admin/login.html'));
app.get('/admin/dashboard',      v('../client/views/admin/dashboard.html'));
app.get('/admin/produtos',       v('../client/views/admin/produtos.html'));
app.get('/admin/pedidos',        v('../client/views/admin/pedidos.html'));
app.get('/admin/categorias',     v('../client/views/admin/categorias.html'));
app.get('/admin/clientes',       v('../client/views/admin/clientes.html'));
app.get('/admin/banners',        v('../client/views/admin/banners.html'));
app.get('/admin/cupons',         v('../client/views/admin/cupons.html'));
app.get('/admin/relatorios',     v('../client/views/admin/relatorios.html'));
app.get('/admin/alertas',        v('../client/views/admin/alertas.html'));
app.get('/admin/reset-password', v('../client/views/admin/reset-password.html'));
app.get('/admin/configuracoes',  v('../client/views/admin/configuracoes.html'));

// ── Error handlers ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});
app.use((req, res) => res.status(404).json({ success: false, message: 'Rota não encontrada' }));

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
}).catch(error => {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
});