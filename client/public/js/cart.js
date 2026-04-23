let cartCount = 0;
let sessionId = localStorage.getItem('cartSessionId') || '';

async function updateCartCount() {
    try {
        const headers = {};
        if (sessionId) headers['X-Session-Id'] = sessionId;
        if (window.auth && auth.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${auth.getToken()}`;
        }
        
        const res = await fetch('/api/cart', { headers });
        const data = await res.json();
        
        if (data.success) {
            cartCount = data.data.totalItems || 0;
            if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('cartSessionId', sessionId);
            }
        }
        
        updateCartDisplay();
    } catch (e) {
        console.error('Erro ao atualizar carrinho:', e);
    }
}

function updateCartDisplay() {
    const countElements = document.querySelectorAll('#cartCount');
    countElements.forEach(el => {
        el.textContent = cartCount;
    });
}

async function addToCart(productId, quantity = 1) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (sessionId) headers['X-Session-Id'] = sessionId;
        if (window.auth && auth.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${auth.getToken()}`;
        }
        
        const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId, quantity })
        });
        const data = await res.json();
        
        if (data.success) {
            cartCount = data.data.totalItems;
            if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('cartSessionId', sessionId);
            }
            updateCartDisplay();
            return true;
        } else {
            alert(data.message || 'Erro ao adicionar ao carrinho');
            return false;
        }
    } catch (e) {
        console.error('Erro ao adicionar:', e);
        alert('Erro ao adicionar ao carrinho');
        return false;
    }
}

async function getCart() {
    try {
        const headers = {};
        if (sessionId) headers['X-Session-Id'] = sessionId;
        if (window.auth && auth.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${auth.getToken()}`;
        }
        
        const res = await fetch('/api/cart', { headers });
        const data = await res.json();
        
        if (data.success) {
            cartCount = data.data.totalItems || 0;
            if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('cartSessionId', sessionId);
            }
            updateCartDisplay();
            return data.data;
        }
        return null;
    } catch (e) {
        console.error('Erro ao buscar carrinho:', e);
        return null;
    }
}

window.addToCart = addToCart;
window.getCart = getCart;
window.updateCartCount = updateCartCount;

document.addEventListener('DOMContentLoaded', updateCartCount);