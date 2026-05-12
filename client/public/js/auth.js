/**
 * AuthManager — gerencia autenticação no frontend.
 *
 * Mudanças em relação à versão antiga:
 *  - Faz refresh automático do access token quando recebe 401.
 *  - Refresh token está em cookie httpOnly (não acessível ao JS) — passa
 *    automaticamente pelas requisições com credentials: 'include'.
 *  - Apenas o access token fica em localStorage (curto, 15min).
 *  - Logout chama o endpoint /api/auth/logout pra revogar o refresh.
 *  - Em caso de 401 após refresh falhar, redireciona pro login.
 */

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user  = this.#safeParse(localStorage.getItem('user'));
        this.refreshing = null;      // Promise em curso (evita refresh concorrente)
        this.init();
    }

    #safeParse(s) {
        try { return s ? JSON.parse(s) : null; } catch { return null; }
    }

    init() {
        this.updateUserInterface();
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getUser()  { return this.user;  }
    getToken() { return this.token; }

    setSession(token, user) {
        this.token = token;
        if (user) this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);   // compat com código legado
        if (user) localStorage.setItem('user', JSON.stringify(user));
        // Limpa dados de frete/cupom da sessão anterior para não vazar entre contas
        sessionStorage.removeItem('cartShipping');
        sessionStorage.removeItem('cartCoupon');
    }

    clearSession() {
        this.token = null;
        this.user  = null;
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch { /* ignora erro de rede no logout */ }
        this.clearSession();
        window.location.href = '/';
    }

    /**
     * Tenta renovar o access token usando o refresh token (cookie httpOnly).
     * Retorna true se conseguiu, false caso contrário.
     */
    async refresh() {
        // Evita múltiplas requisições simultâneas de refresh
        if (this.refreshing) return this.refreshing;

        this.refreshing = (async () => {
            try {
                const res = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include',
                });
                if (!res.ok) return false;
                const data = await res.json();
                if (data.success && data.data?.token) {
                    this.token = data.data.token;
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('authToken', data.data.token);
                    return true;
                }
                return false;
            } catch {
                return false;
            } finally {
                this.refreshing = null;
            }
        })();

        return this.refreshing;
    }

    /**
     * Wrapper de fetch que adiciona o Bearer token e renova automaticamente
     * em caso de 401. Se o refresh falhar, limpa a sessão e redireciona.
     */
    async fetchWithAuth(url, options = {}) {
        const doFetch = (token) => fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                ...options.headers,
                'Authorization': token ? `Bearer ${token}` : '',
            },
        });

        if (!this.token) {
            // Sem token: tenta refresh primeiro (talvez tenha refresh cookie)
            const ok = await this.refresh();
            if (!ok) {
                this.clearSession();
                window.location.href = '/login';
                throw new Error('Não autenticado');
            }
        }

        let response = await doFetch(this.token);

        // 401 → tenta refresh uma vez. Não tenta de novo em endpoints que sempre
        // retornam 401 com senha errada (login, change-password).
        if (response.status === 401) {
            const skipRefresh = ['/api/auth/login', '/api/auth/change-password', '/api/auth/update-email'];
            if (skipRefresh.some(ep => url.includes(ep))) {
                return response;
            }

            const refreshed = await this.refresh();
            if (refreshed) {
                response = await doFetch(this.token);
            } else {
                this.clearSession();
                // Redireciona suavemente: salva a URL atual pra voltar depois
                const redirect = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/login?redirect=${redirect}`;
                throw new Error('Sessão expirada');
            }
        }

        return response;
    }

    updateUserInterface() {
        const container = document.getElementById('userMenuContainer');
        if (!container) return;

        if (this.isAuthenticated()) {
            const firstName = (this.user.name || '').split(' ')[0] || 'Conta';

            container.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-btn">
                        <i class="fas fa-user-circle"></i>
                        <span>Olá, ${this.#escapeHtml(firstName)}</span>
                        <i class="fas fa-chevron-down" style="font-size: 12px;"></i>
                    </button>
                    <div class="user-dropdown">
                        <a href="/account"><i class="fas fa-user"></i> Minha Conta</a>
                        <a href="/account?tab=orders"><i class="fas fa-shopping-bag"></i> Meus Pedidos</a>
                        <a href="/account?tab=favorites"><i class="fas fa-heart"></i> Favoritos</a>
                        <a href="/ajuda"><i class="fas fa-question-circle"></i> Ajuda</a>
                        <div class="divider"></div>
                        <a href="#" class="logout-btn" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i> Sair
                        </a>
                    </div>
                </div>
            `;

            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        } else {
            container.innerHTML = `
                <a href="/login" class="user-btn">
                    <i class="fas fa-user"></i>
                </a>
            `;
        }
    }

    // Escape básico contra XSS no nome do usuário (caso venha texto com HTML)
    #escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

const auth = new AuthManager();
window.auth = auth;