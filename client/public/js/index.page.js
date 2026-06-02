let categories = [],
  currentCategoryPage = 0;

function getItemsPerPage() {
  return window.innerWidth <= 768 ? 2 : window.innerWidth <= 1024 ? 3 : 5;
}

async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success) {
      categories = data.data.filter((c) => c.status === "active");
      renderCategories();
    }
  } catch (e) {
    console.error(e);
  }
}

function renderCategories() {
  const ipp = getItemsPerPage();
  const grid = document.getElementById("categoriesGrid");
  const dots = document.getElementById("categoriesDots");
  const totalPages = Math.ceil(categories.length / ipp);

  if (!categories.length) {
    grid.innerHTML =
      '<p style="text-align:center;width:100%;">Nenhuma categoria</p>';
    return;
  }

  document.getElementById("categoriesPrev").style.display =
    totalPages > 1 ? "flex" : "none";
  document.getElementById("categoriesNext").style.display =
    totalPages > 1 ? "flex" : "none";

  grid.innerHTML = categories
    .map(
      (c) =>
        `<a href="/products?category=${c.slug}" class="category-card"><img src="${c.image_url || "https://via.placeholder.com/400x350"}" alt="${c.name}"><div class="category-overlay"><h3>${c.name}</h3><span>Ver Coleção</span></div></a>`,
    )
    .join("");

  dots.innerHTML = "";
  for (let i = 0; i < totalPages; i++) {
    const d = document.createElement("span");
    d.className = "carousel-dot" + (i === currentCategoryPage ? " active" : "");
    d.onclick = () => goToPage(i);
    dots.appendChild(d);
  }
  updatePosition();
}

function updatePosition() {
  const ipp = getItemsPerPage();
  const grid = document.getElementById("categoriesGrid");
  const card = grid.querySelector(".category-card");
  if (!card) return;
  const gap = window.innerWidth <= 768 ? 16 : 25;
  const w = card.offsetWidth + gap;
  grid.style.transform = `translateX(${-currentCategoryPage * w * ipp}px)`;
}

function goToPage(p) {
  const ipp = getItemsPerPage();
  const total = Math.ceil(categories.length / ipp);
  if (p >= 0 && p < total) {
    currentCategoryPage = p;
    document
      .querySelectorAll(".carousel-dot")
      .forEach((d, i) => d.classList.toggle("active", i === p));
    updatePosition();
    document.getElementById("categoriesPrev").disabled = p === 0;
    document.getElementById("categoriesNext").disabled = p === total - 1;
  }
}

window.addEventListener("resize", () => {
  currentCategoryPage = 0;
  renderCategories();
});

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

document.addEventListener("DOMContentLoaded", loadNavCategories);

document.addEventListener("DOMContentLoaded", loadNavCategories);

async function renderProducts(id, products) {
  const favs = await Wishlist.getIds();
  document.getElementById(id).innerHTML = products
    .map((p) => {
      const price = parseFloat(p.price) || 0,
        promo = p.promotional_price ? parseFloat(p.promotional_price) : null;
      const img =
        p.main_image || p.images?.[0] || "https://via.placeholder.com/400";
      const isFav = favs.has(String(p.id));
      const cartBtn = p.has_variations
        ? `<button class="quickcart-btn" onclick="quickAddToCart(this,${p.id},true)" title="Ver opções"><i class="fas fa-eye"></i></button>`
        : `<button class="quickcart-btn" onclick="quickAddToCart(this,${p.id},false)" title="Adicionar ao carrinho"><i class="fas fa-shopping-bag"></i></button>`;
      return `<div class="product-card"><div class="product-image"><a href="/product?id=${p.id}"><img src="${img}" alt="${p.name}"></a>${promo ? `<span class="product-badge sale">-${Math.round((1 - promo / price) * 100)}%</span>` : ""}<div class="card-actions">${Wishlist.button(p.id, isFav)}${cartBtn}</div></div><div class="product-info"><h3><a href="/product?id=${p.id}">${p.name}</a></h3><div class="product-price">${promo ? `<span class="old-price">R$ ${price.toFixed(2)}</span><span class="current-price">R$ ${promo.toFixed(2)}</span>` : `<span class="current-price">R$ ${price.toFixed(2)}</span>`}</div></div></div>`;
    })
    .join("");
}

window.quickAddToCart = async function (btn, productId, hasVariations) {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/login?redirect=/";
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

document.addEventListener("DOMContentLoaded", function () {
  var header = document.querySelector(".header");
  var hero = document.querySelector(".hero");
  if (header && hero) hero.style.marginTop = header.offsetHeight + "px";
});
document.addEventListener("DOMContentLoaded", async () => {
  loadCategories();
  try {
    const r = await fetch("/api/products/featured");
    const d = await r.json();
    if (d.success) renderProducts("featuredProducts", d.data);
  } catch (e) {}
  try {
    const r = await fetch("/api/products/new-arrivals");
    const d = await r.json();
    if (d.success) renderProducts("newArrivals", d.data);
  } catch (e) {}

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
        if (text.length > 60) {
          textEl.className = "header-top-marquee";
          textEl.innerHTML = `<div class="marquee-inner"><span>${text}</span><span>${text}</span></div>`;
        } else {
          textEl.className = "";
          textEl.style.opacity = "0";
          setTimeout(() => {
            textEl.textContent = text;
            textEl.style.opacity = "1";
          }, 300);
        }
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
});

let slide = 0,
  slides = [],
  dots = [];

function showSlide(i) {
  slides.forEach((s) => s.classList.remove("active"));
  dots.forEach((d) => d.classList.remove("active"));
  if (slides[i]) slides[i].classList.add("active");
  if (dots[i]) dots[i].classList.add("active");
}

async function loadHeroBanners() {
  try {
    const res = await fetch("/api/banners");
    const data = await res.json();
    if (!data.success || !data.data.length) return;

    const heroBanners = data.data;
    if (!heroBanners.length) return;

    const slider = document.getElementById("heroSlider");
    const dotsContainer = document.getElementById("sliderDots");

    slider.innerHTML = heroBanners
      .map(
        (b, i) => `
                    <div class="slide ${i === 0 ? "active" : ""}" ${b.link ? `onclick="window.location.href='${b.link}'" style="cursor:pointer;"` : ""}>
                        <img src="${b.image_url}" alt="${b.title}">
                        <div class="slide-overlay"></div>
                        <div class="slide-content">
                            ${b.subtitle ? `<span class="slide-subtitle">${b.subtitle}</span>` : ""}
                            <h2 class="slide-title">${b.title}</h2>
                            
                        </div>
                    </div>
                `,
      )
      .join("");

    dotsContainer.innerHTML = heroBanners
      .map(
        (_, i) => `
                    <div class="dot ${i === 0 ? "active" : ""}" onclick="showSlide(${i}); slide=${i};"></div>
                `,
      )
      .join("");

    slides = Array.from(slider.querySelectorAll(".slide"));
    dots = Array.from(dotsContainer.querySelectorAll(".dot"));
    slide = 0;

    // Esconde setas e dots quando só há 1 banner
    const onlyOne = slides.length <= 1;
    document.getElementById("prevSlide").style.display = onlyOne ? "none" : "";
    document.getElementById("nextSlide").style.display = onlyOne ? "none" : "";
    dotsContainer.style.display = onlyOne ? "none" : "";
  } catch (e) {
    console.error("Erro ao carregar banners:", e);
  }
}

document.getElementById("prevSlide").onclick = () => {
  slide = (slide - 1 + slides.length) % slides.length;
  showSlide(slide);
};
document.getElementById("nextSlide").onclick = () => {
  slide = (slide + 1) % slides.length;
  showSlide(slide);
};
setInterval(() => {
  if (slides.length) {
    slide = (slide + 1) % slides.length;
    showSlide(slide);
  }
}, 5000);
loadHeroBanners();

document.getElementById("categoriesPrev").onclick = () =>
  goToPage(currentCategoryPage - 1);
document.getElementById("categoriesNext").onclick = () =>
  goToPage(currentCategoryPage + 1);

document.getElementById("newsletterForm").onsubmit = (e) => {
  e.preventDefault();
  showToast("Obrigada por assinar! 💌", "success");
  e.target.reset();
};

(function () {
  const input = document.getElementById("searchInput");
  const dropdown = document.getElementById("searchDropdown");
  const clearBtn = document.getElementById("searchClear");
  let debounceTimer = null;
  let lastQuery = "";

  function fmt(n) {
    return "R$ " + parseFloat(n).toFixed(2).replace(".", ",");
  }

  function renderResults(products, query) {
    if (!products.length) {
      dropdown.innerHTML = `<div class="search-empty"><i class="fas fa-search" style="font-size:24px;opacity:0.3;display:block;margin-bottom:10px;"></i>Nenhum produto encontrado para "<strong>${query}</strong>"</div>`;
      return;
    }
    const items = products
      .slice(0, 6)
      .map((p) => {
        const price = parseFloat(p.promotional_price || p.price);
        const oldPrice = p.promotional_price
          ? `<span class="old">${fmt(p.price)}</span>`
          : "";
        let imgs = [];
        try {
          imgs =
            typeof p.images === "string"
              ? JSON.parse(p.images)
              : p.images || [];
        } catch (e) {}
        const thumb = imgs[0] || p.main_image || "/images/placeholder.jpg";
        return `<a class="search-result-item" href="/product?id=${p.id}">
                    <img class="search-result-thumb" src="${thumb}" alt="${p.name}" onerror="this.src='/images/placeholder.jpg'">
                    <div class="search-result-info">
                        <div class="search-result-name">${p.name}</div>
                        <div class="search-result-cat">${p.category_name || "Sem categoria"}</div>
                    </div>
                    <div class="search-result-price">${oldPrice}${fmt(price)}</div>
                </a>`;
      })
      .join("");

    const total = products.length;
    const footer = `<div class="search-footer"><a href="/products?search=${encodeURIComponent(query)}">Ver todos os ${total} resultado${total !== 1 ? "s" : ""} →</a></div>`;
    dropdown.innerHTML = items + (total > 0 ? footer : "");
  }

  async function doSearch(query) {
    if (!query.trim()) {
      closeDropdown();
      return;
    }
    dropdown.innerHTML =
      '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Buscando...</div>';
    dropdown.classList.add("open");
    try {
      const r = await fetch(
        `/api/products?search=${encodeURIComponent(query)}&limit=20`,
      );
      const d = await r.json();
      if (input.value.trim() === query) renderResults(d.data || [], query);
    } catch (e) {
      dropdown.innerHTML =
        '<div class="search-empty">Erro ao buscar. Tente novamente.</div>';
    }
  }

  function closeDropdown() {
    dropdown.classList.remove("open");
    dropdown.innerHTML = "";
  }

  window.submitSearch = function () {
    const q = input.value.trim();
    if (q) window.location.href = `/products?search=${encodeURIComponent(q)}`;
  };

  window.clearSearch = function () {
    input.value = "";
    clearBtn.style.display = "none";
    closeDropdown();
    input.focus();
  };

  input.addEventListener("input", function () {
    const q = this.value.trim();
    clearBtn.style.display = q ? "block" : "none";
    clearTimeout(debounceTimer);
    if (!q) {
      closeDropdown();
      lastQuery = "";
      return;
    }
    if (q === lastQuery) return;
    lastQuery = q;
    debounceTimer = setTimeout(() => doSearch(q), 280);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitSearch();
    }
    if (e.key === "Escape") closeDropdown();
  });

  document.addEventListener("click", function (e) {
    if (!document.getElementById("searchWrapper").contains(e.target))
      closeDropdown();
  });
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