/**
 * admin-auth.js — Gerenciamento de autenticação do painel admin
 *
 * Como usar: adicione este script no <head> de todas as páginas admin,
 * ANTES de qualquer outro script que use `token` ou `adminFetch`.
 *
 *   <script src="/js/admin-auth.js"></script>
 *
 * Depois substitua todos os `fetch(url, { headers: { Authorization: 'Bearer ' + token } })`
 * por `adminFetch(url, options)` — a função cuida do refresh automaticamente.
 *
 * As variáveis `token` e `user` continuam disponíveis globalmente para
 * compatibilidade com o código existente.
 */

(function () {
    // ── Estado global ─────────────────────────────────────────────────────────
    window.user  = JSON.parse(localStorage.getItem('user') || '{}');
    window.token = localStorage.getItem('token') || '';

    // Redireciona se não for admin
    if (!window.token || window.user.role !== 'admin') {
        window.location.href = '/admin';
    }

    let _refreshing = null; // Promise singleton para evitar múltiplos refreshes

    /**
     * Tenta renovar o access token usando o refresh token (cookie httpOnly).
     * Retorna true se conseguiu, false caso contrário.
     */
    async function refreshToken() {
        if (_refreshing) return _refreshing;

        _refreshing = (async () => {
            try {
                const res  = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include',
                });
                if (!res.ok) return false;

                const data = await res.json();
                if (data.success && data.data?.token) {
                    window.token = data.data.token;
                    localStorage.setItem('token',     data.data.token);
                    localStorage.setItem('authToken', data.data.token);
                    return true;
                }
                return false;
            } catch {
                return false;
            } finally {
                _refreshing = null;
            }
        })();

        return _refreshing;
    }

    /**
     * adminFetch — substituto do fetch() para o painel admin.
     * Adiciona o Bearer token automaticamente e renova se receber 401.
     *
     * Uso:
     *   const res = await adminFetch('/api/admin/orders');
     *   const res = await adminFetch('/api/admin/products/1', { method: 'DELETE' });
     */
    window.adminFetch = async function (url, options = {}) {
        const doFetch = (tk) => fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${tk}`,
            },
        });

        let response = await doFetch(window.token);

        // Se 401, tenta refresh uma vez
        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                response = await doFetch(window.token);
            } else {
                // Refresh falhou — desloga
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/admin';
                throw new Error('Sessão expirada');
            }
        }

        return response;
    };

    /**
     * Logout — revoga o refresh token e redireciona
     */
    window.adminLogout = async function () {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch { /* ignora erro de rede */ }
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/admin';
    };

    // Renova o token proativamente 2 minutos antes de expirar (access token = 15min)
    // Evita que o admin seja interrompido no meio de uma ação
    function scheduleProactiveRefresh() {
        const REFRESH_BEFORE_MS = 2 * 60 * 1000; // 2 minutos antes
        const TOKEN_TTL_MS      = 15 * 60 * 1000; // 15 minutos

        setTimeout(async () => {
            const ok = await refreshToken();
            if (ok) scheduleProactiveRefresh(); // agenda o próximo
        }, TOKEN_TTL_MS - REFRESH_BEFORE_MS);
    }

    scheduleProactiveRefresh();
})();