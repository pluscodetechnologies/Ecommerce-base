let cartCount = 0;

// Toast de notificação (substitui alert())
function showCartToast(message, type = 'error') {
    const existing = document.getElementById('cart-toast');
    if (existing) existing.remove();

    const colors = {
        error:   'background:#C45C5C;color:#fff;',
        success: 'background:#2E8B57;color:#fff;',
        info:    'background:#1A1817;color:#fff;',
    };

    const toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
        ${colors[type] || colors.error}
        padding:12px 24px;border-radius:8px;font-family:'Montserrat',sans-serif;
        font-size:13px;font-weight:500;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);
        animation:fadeInUp 0.3s ease;pointer-events:none;`;
    toast.textContent = message;

    if (!document.getElementById('cart-toast-style')) {
        const style = document.createElement('style');
        style.id = 'cart-toast-style';
        style.textContent = '@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}


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

async function addToCart(productId, quantity = 1, color = null, size = null) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (sessionId) headers['X-Session-Id'] = sessionId;
        if (window.auth && auth.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${auth.getToken()}`;
        }
        
        const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers,
            body: JSON.stringify({ productId, quantity, color, size })
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
            showCartToast(data.message || 'Erro ao adicionar ao carrinho');
            return false;
        }
    } catch (e) {
        console.error('Erro ao adicionar:', e);
        showCartToast('Erro ao adicionar ao carrinho');
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