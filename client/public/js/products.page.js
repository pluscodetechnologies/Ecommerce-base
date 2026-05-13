let page = 1,
  totalPages = 1,
  category = "",
  sort = "newest";
const urlParams = new URLSearchParams(window.location.search);
category = urlParams.get("category") || "";
const searchQuery = urlParams.get("search") || "";
if (searchQuery) {
  const si = document.getElementById("productsSearchInput");
  if (si) si.value = searchQuery;
}

async function loadNavCategories() {
  try {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      const dropdown = document.getElementById("categoriesDropdown");
      if (dropdown) {
        const activeCategories = data.data.filter((c) => c.status === "active");
        let html = "";
        activeCategories.forEach((cat) => {
          html += `<li><a href="/products?category=${cat.slug}">${cat.name}</a></li>`;
        });
        while (html.split("<li>").length - 1 < 8) {
          html += `<li><a href="#" style="visibility: hidden;"> </a></li>`;
        }
        html += `<li class="view-all"><a href="/products">Ver Todas as Categorias</a></li>`;
        dropdown.innerHTML = html;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar categorias da navbar:", e);
  }
}

async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success) {
      const list = document.getElementById("categoryList");
      list.innerHTML =
        '<li><a href="/products" class="' +
        (category === "" ? "active" : "") +
        '">Todas</a></li>';
      data.data.forEach((cat) => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="/products?category=${cat.slug}" class="${cat.slug === category ? "active" : ""}">${cat.name}</a>`;
        list.appendChild(li);
      });
      if (category) {
        const cat = data.data.find((c) => c.slug === category);
        if (cat) document.getElementById("pageTitle").textContent = cat.name;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadProducts() {
  try {
    let url = `/api/products?page=${page}&limit=12`;
    if (category === "novidades") {
      url += "&sort=newest";
    } else if (category === "mais-vendidos") {
      url += "&sort=best-sellers";
    } else if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (urlParams.get("sale") === "true") {
      url += "&onSale=true";
      document.getElementById("pageTitle").textContent = "Ofertas";
    }
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
      document.getElementById("pageTitle").textContent =
        `Resultados para "${searchQuery}"`;
    }
    if (sort === "price-asc") url += "&sort=price-asc";
    if (sort === "price-desc") url += "&sort=price-desc";
    if (sort === "best-sellers") url += "&sort=best-sellers";

    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      totalPages = data.totalPages;
      let prods = data.data || [];
      const grid = document.getElementById("productsGrid");
      if (!prods.length) {
        grid.innerHTML =
          '<div class="no-products">Nenhum produto encontrado</div>';
        document.getElementById("pagination").innerHTML = "";
      } else {
        const favoriteIds = await Wishlist.getIds();
        grid.innerHTML = prods
          .map((p) => {
            const price = parseFloat(p.price) || 0,
              promo = p.promotional_price
                ? parseFloat(p.promotional_price)
                : null;
            const img =
              p.main_image ||
              p.images?.[0] ||
              "https://via.placeholder.com/400";
            const isFav = favoriteIds.has(String(p.id));
            const cartBtn = p.has_variations
              ? `<button class="quickcart-btn" onclick="quickAddToCart(this,${p.id},true)" title="Ver opções"><i class="fas fa-eye"></i></button>`
              : `<button class="quickcart-btn" onclick="quickAddToCart(this,${p.id},false)" title="Adicionar ao carrinho"><i class="fas fa-shopping-bag"></i></button>`;
            return `<div class="product-card"><div class="product-image"><a href="/product?id=${p.id}"><img src="${img}" alt="${p.name}"></a>${promo ? `<span class="product-badge">-${Math.round((1 - promo / price) * 100)}%</span>` : ""}<div class="card-actions">${Wishlist.button(p.id, isFav)}${cartBtn}</div></div><div class="product-info"><h3><a href="/product?id=${p.id}">${p.name}</a></h3><div class="product-price">${promo ? `<span class="old-price">R$ ${price.toFixed(2)}</span><span class="current-price">R$ ${promo.toFixed(2)}</span>` : `<span class="current-price">R$ ${price.toFixed(2)}</span>`}</div></div></div>`;
          })
          .join("");
      }
      document.getElementById("productCount").textContent =
        `${data.total} produtos`;
      document.getElementById("showingCount").textContent =
        data.total > 0
          ? `Mostrando ${(page - 1) * 12 + 1}-${Math.min(page * 12, data.total)} de ${data.total}`
          : "Nenhum produto";
      if (totalPages > 1) {
        let pag = `<button ${page === 1 ? "disabled" : ""} onclick="goToPage(${page - 1})">Anterior</button>`;
        for (let i = 1; i <= totalPages; i++) {
          if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2))
            pag += `<button class="${i === page ? "active" : ""}" onclick="goToPage(${i})">${i}</button>`;
          else if (i === page - 3 || i === page + 3) pag += "<span>...</span>";
        }
        pag += `<button ${page === totalPages ? "disabled" : ""} onclick="goToPage(${page + 1})">Próximo</button>`;
        document.getElementById("pagination").innerHTML = pag;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

window.quickAddToCart = async function (btn, productId, hasVariations) {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  if (!token) {
    window.location.href =
      "/login?redirect=" +
      encodeURIComponent(window.location.pathname + window.location.search);
    return;
  }
  if (hasVariations) {
    window.location.href = "/product?id=" + productId;
    return;
  }
  btn.disabled = true;
  const ok = await addToCart(productId, 1);
  if (ok) {
    btn.classList.add("added");
    btn.querySelector("i").className = "fas fa-check";
    setTimeout(() => {
      btn.classList.remove("added");
      btn.querySelector("i").className = "fas fa-shopping-bag";
      btn.disabled = false;
    }, 1800);
  } else {
    btn.disabled = false;
  }
};

window.goToPage = (p) => {
  page = p;
  loadProducts();
  scrollTo(0, 0);
};
document.getElementById("sortSelect").onchange = (e) => {
  sort = e.target.value;
  loadProducts();
};
document.getElementById("newsletterForm").onsubmit = (e) => {
  e.preventDefault();
  showToast("Obrigada por assinar! 💌", "success");
  e.target.reset();
};

loadNavCategories();
loadCategories();
loadProducts();

(async () => {
  try {
    const r = await fetch("/api/alerts");
    const d = await r.json();
    const headerTop = document.getElementById("headerTop");
    const textEl = document.getElementById("headerTopText");
    if (d.success && d.data.length) {
      const alerts = d.data;
      let idx = 0;
      function showAlert(a) {
        const text = a.title ? `${a.title} — ${a.message}` : a.message;
        textEl.style.opacity = "0";
        setTimeout(() => {
          if (text.length > 60) {
            textEl.className = "header-top-marquee";
            textEl.innerHTML =
              '<div class="marquee-inner"><span>' +
              text +
              "</span><span>" +
              text +
              "</span></div>";
          } else {
            textEl.className = "";
            textEl.textContent = text;
          }
          textEl.style.opacity = "1";
        }, 300);
      }
      textEl.style.transition = "opacity 0.3s ease";
      headerTop.style.display = "";
      showAlert(alerts[0]);
      if (alerts.length > 1) {
        setInterval(() => {
          idx = (idx + 1) % alerts.length;
          showAlert(alerts[idx]);
        }, 5000);
      }
    } else {
      headerTop.style.display = "none";
    }
  } catch (e) {
    document.getElementById("headerTop").style.display = "none";
  }
})();

(function () {
  var overlay = document.getElementById("mobileOverlay");
  var drawer = document.getElementById("mobileDrawer");
  var btn = document.querySelector(".mobile-menu-btn");
  var closeBtn = document.getElementById("drawerClose");

  if (!btn) return;

  var navCopied = false;
  function copyNav() {
    if (navCopied) return;
    navCopied = true;
    var drawerNav = document.getElementById("drawerNav");
    var navLinks = document.querySelectorAll(".nav-menu ul > li");
    navLinks.forEach(function (li) {
      var a = li.querySelector("a");
      if (!a) return;
      var link = document.createElement("a");
      link.href = a.href;
      link.textContent = a.textContent
        .trim()
        .replace(/keyboard_arrow_down/, "")
        .trim();
      link.style.cssText =
        "display:block;padding:16px 24px;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#1a1817;text-decoration:none;border-bottom:1px solid #f0ede9;";
      if (a.style.color) link.style.color = a.style.color;
      drawerNav.appendChild(link);
    });
  }

  function openDrawer() {
    copyNav();
    drawer.style.display = "flex";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
    btn.innerHTML = '<i class="fas fa-times"></i>';
  }
  function closeDrawer() {
    drawer.style.display = "none";
    overlay.style.display = "none";
    document.body.style.overflow = "";
    btn.innerHTML = '<i class="fas fa-bars"></i>';
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (window.innerWidth > 768) return;
    drawer.style.display === "none" ? openDrawer() : closeDrawer();
  });

  overlay.addEventListener("click", closeDrawer);
  closeBtn.addEventListener("click", closeDrawer);

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) closeDrawer();
  });
})();

function showToast(message, type = "success") {
  const existing = document.getElementById("page-toast");
  if (existing) existing.remove();
  const colors = {
    error: "background:#C45C5C;color:#fff;",
    success: "background:#2E8B57;color:#fff;",
    info: "background:#1A1817;color:#fff;",
  };
  const t = document.createElement("div");
  t.id = "page-toast";
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);${colors[type] || colors.success}padding:12px 24px;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:500;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:fadeInUp 0.3s ease;pointer-events:none;`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
