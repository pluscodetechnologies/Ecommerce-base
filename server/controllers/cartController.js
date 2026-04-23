const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

class CartController {
    async getCart(req, res) {
        try {
            const userId = req.userId || null;
            let sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
            
            if (!sessionId) {
                sessionId = uuidv4();
                res.cookie('sessionId', sessionId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            }
            
            const cart = await Cart.getOrCreateCart(userId, sessionId);
            const items = await Cart.getCartItems(cart.id);
            const totals = await Cart.getCartTotal(cart.id);
            
            res.json({
                success: true,
                data: {
                    cartId: cart.id,
                    items,
                    subtotal: totals.subtotal,
                    totalItems: totals.items
                },
                sessionId
            });
        } catch (error) {
            console.error('Erro ao buscar carrinho:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar carrinho' });
        }
    }
    
    async addItem(req, res) {
        try {
            const { productId, quantity } = req.body;
            const userId = req.userId || null;
            let sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
            
            if (!sessionId) {
                sessionId = uuidv4();
                res.cookie('sessionId', sessionId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            }
            
            const cart = await Cart.getOrCreateCart(userId, sessionId);
            await Cart.addItem(cart.id, productId, quantity || 1);
            
            const items = await Cart.getCartItems(cart.id);
            const totals = await Cart.getCartTotal(cart.id);
            
            res.json({
                success: true,
                message: 'Item adicionado ao carrinho',
                data: { items, subtotal: totals.subtotal, totalItems: totals.items }
            });
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    
    async updateItem(req, res) {
        try {
            const { itemId } = req.params;
            const { quantity } = req.body;
            const userId = req.userId || null;
            const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
            
            const cart = await Cart.getOrCreateCart(userId, sessionId);
            await Cart.updateItemQuantity(cart.id, itemId, quantity);
            
            const items = await Cart.getCartItems(cart.id);
            const totals = await Cart.getCartTotal(cart.id);
            
            res.json({
                success: true,
                data: { items, subtotal: totals.subtotal, totalItems: totals.items }
            });
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    
    async removeItem(req, res) {
        try {
            const { itemId } = req.params;
            const userId = req.userId || null;
            const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
            
            const cart = await Cart.getOrCreateCart(userId, sessionId);
            await Cart.removeItem(cart.id, itemId);
            
            const items = await Cart.getCartItems(cart.id);
            const totals = await Cart.getCartTotal(cart.id);
            
            res.json({
                success: true,
                data: { items, subtotal: totals.subtotal, totalItems: totals.items }
            });
        } catch (error) {
            console.error('Erro ao remover item:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    
    async clearCart(req, res) {
        try {
            const userId = req.userId || null;
            const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
            
            const cart = await Cart.getOrCreateCart(userId, sessionId);
            await Cart.clearCart(cart.id);
            
            res.json({ success: true, message: 'Carrinho limpo' });
        } catch (error) {
            console.error('Erro ao limpar carrinho:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new CartController();