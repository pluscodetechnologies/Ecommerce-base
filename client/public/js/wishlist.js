window.Wishlist = {
  async _fetch(url, options = {}) {
    if (window.auth && typeof auth.fetchWithAuth === "function") {
      return auth.fetchWithAuth(url, options);
    }
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
  },

  async getIds() {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) return new Set();
    try {
      const res = await this._fetch("/api/wishlist");
      if (res.status === 401) return new Set();
      const data = await res.json();
      if (data.success)
        return new Set(data.data.map((i) => String(i.product_id)));
    } catch {}
    return new Set();
  },

  async toggle(productId) {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      window.location.href =
        "/login?redirect=" +
        encodeURIComponent(window.location.pathname + window.location.search);
      return null;
    }
    try {
      const res = await this._fetch(`/api/wishlist/${productId}`, {
        method: "POST",
      });
      const data = await res.json();
      return data.success ? data.action : null;
    } catch {
      return null;
    }
  },

  button(productId, isFavorite) {
    return `<button
            class="wishlist-btn ${isFavorite ? "active" : ""}"
            data-product-id="${productId}"
            title="${isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}"
            onclick="Wishlist.handleClick(this, ${productId})"
        ><i class="${isFavorite ? "fas" : "far"} fa-heart"></i></button>`;
  },

  async handleClick(btn, productId) {
    const wasActive = btn.classList.contains("active");
    btn.classList.toggle("active");
    btn.querySelector("i").className = btn.classList.contains("active")
      ? "fas fa-heart"
      : "far fa-heart";
    btn.title = btn.classList.contains("active")
      ? "Remover dos favoritos"
      : "Adicionar aos favoritos";

    const action = await Wishlist.toggle(productId);
    if (!action) {
      btn.classList.toggle("active", wasActive);
      btn.querySelector("i").className = wasActive
        ? "fas fa-heart"
        : "far fa-heart";
    }

    if (action) {
      Wishlist.toast(
        action === "added"
          ? "❤️ Adicionado aos favoritos"
          : "Removido dos favoritos",
      );
    }
  },

  toast(msg) {
    let el = document.getElementById("wishlistToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "wishlistToast";
      el.style.cssText = `
                position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
                background:#1A1817; color:white; padding:12px 24px; border-radius:8px;
                font-family:'Montserrat',sans-serif; font-size:13px; font-weight:500;
                opacity:0; transition:all 0.3s; z-index:9999; white-space:nowrap;
            `;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(20px)";
    }, 2500);
  },
};
