const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const path         = require('path');
const dotenv       = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

// ────────────────────────────────────────────────────────────────────
// VALIDAÇÃO DE AMBIENTE — falha rápido se faltar variável crítica
// ────────────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
    console.error(`❌ Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
    console.error('   Configure-as no .env antes de iniciar o servidor.');
    process.exit(1);
}
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET muito curto (mínimo 32 caracteres). Gere com: openssl rand -hex 64');
    process.exit(1);
}

// ────────────────────────────────────────────────────────────────────
const { connectDB } = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimits');

const app  = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ────────────────────────────────────────────────────────────────────
// Trust proxy (Cloudflare / nginx) — necessário pra rate limit por IP real
// ────────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ────────────────────────────────────────────────────────────────────
// Helmet com CSP adequado
// ────────────────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            // 'unsafe-inline' em scriptSrc só porque há código inline nos HTMLs.
            // Quando migrar pra scripts externos, REMOVA 'unsafe-inline'.
            scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-hashes'",
                          "https://www.mercadopago.com",
                          "https://sdk.mercadopago.com",
                          "https://accounts.google.com",
                          "https://connect.facebook.net",
                          "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],   // ← adicione esta linha
            styleSrc:    ["'self'", "'unsafe-inline'",
                          "https://fonts.googleapis.com",
                          "https://cdnjs.cloudflare.com"],
            fontSrc:     ["'self'", "data:",
                          "https://fonts.gstatic.com",
                          "https://cdnjs.cloudflare.com"],
            imgSrc:      ["'self'", "data:", "blob:", "https:"],
            connectSrc:  ["'self'",
                        "https://viacep.com.br",
                          "https://api.mercadopago.com",
                          "https://sdk.mercadopago.com",
                          "https://accounts.google.com",
                          "https://graph.facebook.com"],
            frameSrc:    ["'self'",
                          "https://www.mercadopago.com",
                          "https://accounts.google.com",
                          "https://www.facebook.com"],
            objectSrc:   ["'none'"],
            baseUri:     ["'self'"],
            formAction:  ["'self'"],
            frameAncestors: ["'self'"],         // anti-clickjacking
            upgradeInsecureRequests: isProduction ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false,           // mantém compat com SDKs externos
    crossOriginOpenerPolicy:   { policy: 'same-origin-allow-popups' }, // Google OAuth precisa
}));

// ────────────────────────────────────────────────────────────────────
// CORS — origens explícitas (em vez de aberto pra tudo)
// ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Sem origin = same-origin / app mobile / curl — permitir
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0) {
            // Sem config explícita → em dev, libera; em prod, bloqueia
            if (isProduction) return callback(new Error('CORS bloqueado'), false);
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS bloqueado: ${origin}`), false);
    },
    credentials: true,                          // permite cookie httpOnly do refresh token
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
}));

// ────────────────────────────────────────────────────────────────────
// Body parsers — com limites razoáveis (anti-DoS)
// ATENÇÃO: o webhook do MP precisa de raw body, então a rota /api/checkout/webhook
// é registrada com express.raw() ANTES do express.json() global. Pra isso funcionar,
// não devemos passar req.url '/api/checkout/webhook' aqui. O Express respeita a
// ordem de registro por rota: como o webhook está dentro do router, e o router
// tem express.raw() explicito, isso funciona desde que NÃO declaremos json antes
// no mesmo path. Para garantir, fazemos um skip explícito:
// ────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    if (req.originalUrl === '/api/checkout/webhook') return next();
    express.json({ limit: '1mb' })(req, res, next);
});
app.use((req, res, next) => {
    if (req.originalUrl === '/api/checkout/webhook') return next();
    express.urlencoded({ extended: true, limit: '1mb' })(req, res, next);
});

app.use(cookieParser());

// ────────────────────────────────────────────────────────────────────
// Logger — em prod, formato 'combined' (logs estruturados); em dev, 'dev'
// ────────────────────────────────────────────────────────────────────
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ────────────────────────────────────────────────────────────────────
// Static files
// ────────────────────────────────────────────────────────────────────
app.use('/css',     express.static(path.join(__dirname, '../client/public/css')));
app.use('/js',      express.static(path.join(__dirname, '../client/public/js')));
app.use('/images',  express.static(path.join(__dirname, '../client/public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ────────────────────────────────────────────────────────────────────
// Cache-control para /api: nunca cachear (dados sensíveis)
// ────────────────────────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// ────────────────────────────────────────────────────────────────────
// Rate limit GLOBAL nas APIs (proteção genérica)
// Rate limits específicos (login, register, etc.) são aplicados nas próprias rotas.
// ────────────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ────────────────────────────────────────────────────────────────────
// Rotas da API
// ────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────
// Produtos (públicos)
// ────────────────────────────────────────────────────────────────────
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
        // Limites máximos pra evitar abuso
        const page     = Math.max(1, parseInt(req.query.page)  || 1);
        const limit    = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
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

        // limit/offset agora são números seguros (sanitizados acima)
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
        const id = parseInt(req.params.id);
        if (Number.isNaN(id) || id < 1) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        const db = require('./config/database').getDB();
        const [rows] = await db.execute(`
            SELECT p.*, c.name as category_name, COALESCE(p.images, '[]') as images
            FROM products p LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.status = 'active'
        `, [id]);
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

// Validate coupon — agora com Zod
const { validate } = require('./middleware/validate');
const { validateCouponSchema } = require('./schemas/checkout.schema');
app.post('/api/coupons/validate',
    validate({ body: validateCouponSchema }),
    async (req, res) => {
        try {
            const db = require('./config/database').getDB();
            const { code, userId } = req.body;
            const [rows] = await db.execute('SELECT * FROM coupons WHERE code = ? AND status = "active"', [code.trim().toUpperCase()]);
            if (!rows.length) return res.status(404).json({ success: false, message: 'Cupom inválido ou inativo' });
            const c = rows[0];
            if (c.expires_at && new Date(c.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'Este cupom já expirou' });
            if (c.max_uses && c.used_count >= c.max_uses) return res.status(400).json({ success: false, message: 'Este cupom atingiu o limite de usos' });
            const isPerUser = c.max_uses === 1 || c.coupon_type === 'first_purchase';
            if (isPerUser && userId) {
                const [u] = await db.execute('SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?', [c.id, userId]);
                if (u.length) return res.status(400).json({ success: false, message: 'Você já utilizou este cupom' });
            }
            if (c.coupon_type === 'first_purchase' && userId) {
                const [prevOrders] = await db.execute(
                    "SELECT id FROM orders WHERE user_id = ? AND payment_status = 'approved' LIMIT 1", [userId]
                );
                if (prevOrders.length) return res.status(400).json({ success: false, message: 'Este cupom é válido apenas para a primeira compra' });
            }
            res.json({ success: true, data: { id: c.id, code: c.code, discount_type: c.discount_type, discount_value: parseFloat(c.discount_value), min_purchase: parseFloat(c.min_purchase || 0), description: c.description, coupon_type: c.coupon_type || null } });
        } catch (e) { console.error('[coupons/validate]', e); res.status(500).json({ success: false, message: 'Erro ao validar cupom' }); }
    }
);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ────────────────────────────────────────────────────────────────────
// Páginas HTML
// ────────────────────────────────────────────────────────────────────
const v = (file) => (req, res) => res.sendFile(path.join(__dirname, file));
app.get('/',                     v('../client/views/index.html'));
app.get('/login',                v('../client/views/login.html'));
app.get('/reset-password',       v('../client/views/reset-password.html'));
app.get('/products',             v('../client/views/products.html'));
app.get('/product',              v('../client/views/product-detail.html'));
app.get('/cart',                 v('../client/views/cart.html'));
app.get('/checkout',             v('../client/views/checkout.html'));
app.get('/checkout-success',     v('../client/views/checkout-success.html'));
app.get('/checkout-pending',     v('../client/views/checkout-pending.html'));
app.get('/checkout-error',       v('../client/views/checkout-error.html'));
app.get('/account',              v('../client/views/account.html'));
app.get('/orders',               v('../client/views/orders.html'));
app.get('/ajuda',                v('../client/views/ajuda.html'));
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

// ────────────────────────────────────────────────────────────────────
// Error handlers — NUNCA vaza stack pro usuário em produção
// ────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    // Erros de CORS chegam aqui
    if (err && err.message && err.message.startsWith('CORS bloqueado')) {
        return res.status(403).json({ success: false, message: 'Origem não permitida' });
    }
    // Erro de body JSON malformado
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'JSON inválido' });
    }

    // Log completo apenas no servidor
    console.error('[error-handler]', err);

    // Resposta genérica pro cliente
    res.status(err.status || 500).json({
        success: false,
        message: isProduction
            ? 'Erro interno do servidor'
            : (err.message || 'Erro interno do servidor'),
    });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Rota não encontrada' }));

// ────────────────────────────────────────────────────────────────────
// Start
// ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando em http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);

        // Job de limpeza diário (refresh tokens expirados + tentativas de login antigas)
        const refreshSvc = require('./services/refreshTokenService');
        const attemptsSvc = require('./services/loginAttemptService');
        setInterval(async () => {
            try {
                const tk = await refreshSvc.cleanupExpiredTokens();
                const at = await attemptsSvc.cleanupOldAttempts();
                if (tk || at) console.log(`🧹 Limpeza: ${tk} tokens, ${at} tentativas`);
            } catch (e) { console.error('[cleanup]', e); }
        }, 24 * 60 * 60 * 1000);
    });
}).catch(error => {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
});

module.exports = app;
