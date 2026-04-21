const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
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
app.use(morgan('dev'));

app.use('/css', express.static(path.join(__dirname, '../client/public/css')));
app.use('/js', express.static(path.join(__dirname, '../client/public/js')));
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

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

app.get('/api/products/featured', (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 1, name: "Vestido Floral", price: 189.90, promotional_price: 149.90, main_image: "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=600" },
            { id: 2, name: "Blusa de Seda", price: 129.90, promotional_price: null, main_image: "https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=600" },
            { id: 3, name: "Calça Pantalona", price: 199.90, promotional_price: 169.90, main_image: "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=600" },
            { id: 4, name: "Saia Midi", price: 149.90, promotional_price: null, main_image: "https://images.pexels.com/photos/1457983/pexels-photo-1457983.jpeg?auto=compress&cs=tinysrgb&w=600" }
        ]
    });
});

app.get('/api/products/new-arrivals', (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { id: 5, name: "Conjunto Linho", price: 299.90, promotional_price: 249.90, main_image: "https://images.pexels.com/photos/1485031/pexels-photo-1485031.jpeg?auto=compress&cs=tinysrgb&w=600" },
            { id: 6, name: "Vestido Longo", price: 259.90, promotional_price: null, main_image: "https://images.pexels.com/photos/972995/pexels-photo-972995.jpeg?auto=compress&cs=tinysrgb&w=600" },
            { id: 7, name: "Blazer Feminino", price: 229.90, promotional_price: 189.90, main_image: "https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=600" },
            { id: 8, name: "Macacão", price: 219.90, promotional_price: null, main_image: "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=600" }
        ]
    });
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

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/account.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/views/admin/dashboard.html'));
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