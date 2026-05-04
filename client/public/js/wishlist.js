/**
 * wishlist.js — gerencia favoritos no frontend
 * Inclua este script nas páginas: products.html, product-detail.html
 * Requer: auth.js já carregado antes
 */

window.Wishlist = {

    // Busca IDs dos favoritos do usuário e retorna um Set
    async getIds() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) return new Set();
        try {
            const res  = await fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) return new Set(data.data.map(i => String(i.product_id)));
        } catch {}
        return new Set();
    },

    // Toggle favorito — retorna 'added' | 'removed' | null
    async toggle(productId) {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return null;
        }
        try {
            const res  = await fetch(`/api/wishlist/${productId}`, {
                method:  'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            return data.success ? data.action : null;
        } catch { return null; }
    },

    // Renderiza botão de coração
    button(productId, isFavorite) {
        return `<button
            class="wishlist-btn ${isFavorite ? 'active' : ''}"
            data-product-id="${productId}"
            title="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
            onclick="Wishlist.handleClick(this, ${productId})"
        ><i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i></button>`;
    },

    // Handler de clique — atualiza visual imediatamente (optimistic UI)
    async handleClick(btn, productId) {
        const wasActive = btn.classList.contains('active');
        // Atualiza visual antes da resposta
        btn.classList.toggle('active');
        btn.querySelector('i').className = btn.classList.contains('active') ? 'fas fa-heart' : 'far fa-heart';
        btn.title = btn.classList.contains('active') ? 'Remover dos favoritos' : 'Adicionar aos favoritos';

        const action = await Wishlist.toggle(productId);
        if (!action) {
            // Reverte se deu erro
            btn.classList.toggle('active', wasActive);
            btn.querySelector('i').className = wasActive ? 'fas fa-heart' : 'far fa-heart';
        }

        // Mostra toast
        if (action) {
            Wishlist.toast(action === 'added' ? '❤️ Adicionado aos favoritos' : 'Removido dos favoritos');
        }
    },

    toast(msg) {
        let el = document.getElementById('wishlistToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'wishlistToast';
            el.style.cssText = `
                position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
                background:#1A1817; color:white; padding:12px 24px; border-radius:8px;
                font-family:'Montserrat',sans-serif; font-size:13px; font-weight:500;
                opacity:0; transition:all 0.3s; z-index:9999; white-space:nowrap;
            `;
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.opacity = '1';
        el.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(el._timeout);
        el._timeout = setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-50%) translateY(20px)';
        }, 2500);
    }
};