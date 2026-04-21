class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }
    
    init() {
        this.updateUserInterface();
    }
    
    isAuthenticated() {
        return !!this.token && !!this.user;
    }
    
    getUser() {
        return this.user;
    }
    
    getToken() {
        return this.token;
    }
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        window.location.href = '/';
    }
    
    updateUserInterface() {
        const container = document.getElementById('userMenuContainer');
        if (!container) return;
        
        if (this.isAuthenticated()) {
            const firstName = this.user.name.split(' ')[0];
            
            container.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-btn">
                        <i class="fas fa-user-circle"></i>
                        <span>Olá, ${firstName}</span>
                        <i class="fas fa-chevron-down" style="font-size: 12px;"></i>
                    </button>
                    <div class="user-dropdown">
                        <a href="/account">
                            <i class="fas fa-user"></i>
                            Minha Conta
                        </a>
                        <a href="/account?tab=orders">
                            <i class="fas fa-shopping-bag"></i>
                            Meus Pedidos
                        </a>
                        <a href="/account?tab=addresses">
                            <i class="fas fa-map-marker-alt"></i>
                            Endereços
                        </a>
                        <div class="divider"></div>
                        <a href="#" class="logout-btn" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            Sair
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
    
    async fetchWithAuth(url, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuário não autenticado');
        }
        
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.token}`
        };
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            this.logout();
            throw new Error('Sessão expirada');
        }
        
        return response;
    }
}

const auth = new AuthManager();
window.auth = auth;