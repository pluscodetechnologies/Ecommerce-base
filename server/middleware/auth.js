const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }
        
        const decoded = User.verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
        
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        
        next();
    } catch (error) {
        console.error('Erro no middleware de auth:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na autenticação'
        });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Requer privilégios de administrador.'
        });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };