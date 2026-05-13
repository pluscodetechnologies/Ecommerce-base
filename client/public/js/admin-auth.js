(function () {
    window.user  = JSON.parse(localStorage.getItem('user') || '{}');
    window.token = localStorage.getItem('token') || '';

    if (!window.token || window.user.role !== 'admin') {
        window.location.href = '/admin';
    }

    let _refreshing = null;

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

        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                response = await doFetch(window.token);
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/admin';
                throw new Error('Sessão expirada');
            }
        }

        return response;
    };

    window.adminLogout = async function () {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch {  }
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/admin';
    };

    function scheduleProactiveRefresh() {
        const REFRESH_BEFORE_MS = 2 * 60 * 1000;
        const TOKEN_TTL_MS      = 15 * 60 * 1000;

        setTimeout(async () => {
            const ok = await refreshToken();
            if (ok) scheduleProactiveRefresh();
        }, TOKEN_TTL_MS - REFRESH_BEFORE_MS);
    }

    scheduleProactiveRefresh();
})();