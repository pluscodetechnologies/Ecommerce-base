(function () {
  if (localStorage.getItem("adminTheme") === "dark") {
    document.documentElement.classList.add("dark");
  }
})();

const user = JSON.parse(localStorage.getItem("user") || "{}");
document.getElementById("adminName").textContent = user.name || "Administrador";
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  adminLogout();
});

const modal = document.getElementById("bannerModal");

let currentLinkTab = "none";
window.setLinkTab = function (tab) {
  currentLinkTab = tab;
  document.getElementById("linkNone").style.display =
    tab === "none" ? "block" : "none";
  document.getElementById("linkProduct").style.display =
    tab === "product" ? "block" : "none";
  document.getElementById("linkCustom").style.display =
    tab === "custom" ? "block" : "none";
  document.getElementById("tabNone").classList.toggle("active", tab === "none");
  document
    .getElementById("tabProduct")
    .classList.toggle("active", tab === "product");
  document
    .getElementById("tabCustom")
    .classList.toggle("active", tab === "custom");
};

let allProducts = [],
  searchTimer = null;

async function loadProducts() {
  try {
    const r = await adminFetch("/api/products?limit=200");
    const d = await r.json();
    allProducts = d.data || [];
  } catch (e) {}
}

function renderProductDropdown(query) {
  const dd = document.getElementById("productDropdown");
  const filtered = allProducts
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);
  if (!filtered.length) {
    dd.innerHTML =
      '<div style="padding:12px 14px;color:#999;font-size:13px;">Nenhum produto encontrado</div>';
  } else {
    dd.innerHTML = filtered
      .map((p) => {
        let imgs = [];
        try {
          imgs = JSON.parse(p.images || "[]");
        } catch (e) {}
        const thumb = imgs[0] || p.main_image || "";
        const price = parseFloat(p.promotional_price || p.price)
          .toFixed(2)
          .replace(".", ",");
        return `<div class="product-option" onclick="selectProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${thumb}', '${price}')">
                        <img src="${thumb}" onerror="this.style.display='none'">
                        <div class="product-option-info">
                            <div class="product-option-name">${p.name}</div>
                            <div class="product-option-price">R$ ${price}</div>
                        </div>
                    </div>`;
      })
      .join("");
  }
  dd.classList.add("open");
}

window.selectProduct = function (id, name, thumb, price) {
  document.getElementById("selectedProductId").value = id;
  document.getElementById("selectedProductLink").value = `/product?id=${id}`;
  document.getElementById("productSearch").value = "";
  document.getElementById("productDropdown").classList.remove("open");
  document.getElementById("productSelected").style.display = "flex";
  document.getElementById("productSelected").innerHTML = `
                <div class="product-selected">
                    <img src="${thumb}" onerror="this.style.display='none'">
                    <span class="product-selected-name">${name} — <strong>R$ ${price}</strong></span>
                    <button type="button" class="product-clear-btn" onclick="clearProduct()" title="Remover">&times;</button>
                </div>`;
};

window.clearProduct = function () {
  document.getElementById("selectedProductId").value = "";
  document.getElementById("selectedProductLink").value = "";
  document.getElementById("productSelected").style.display = "none";
  document.getElementById("productSelected").innerHTML = "";
};

document.getElementById("productSearch").addEventListener("input", function () {
  clearTimeout(searchTimer);
  const q = this.value.trim();
  if (!q) {
    document.getElementById("productDropdown").classList.remove("open");
    return;
  }
  searchTimer = setTimeout(() => renderProductDropdown(q), 200);
});

document.addEventListener("click", function (e) {
  if (!document.getElementById("linkProduct")?.contains(e.target))
    document.getElementById("productDropdown").classList.remove("open");
});

function detectLinkTab(link) {
  if (!link) return "none";
  if (link.startsWith("/product?id=")) return "product";
  return "custom";
}

document.getElementById("newBannerBtn").addEventListener("click", () => {
  document.getElementById("modalTitle").textContent = "Novo Banner";
  document.getElementById("bannerId").value = "";
  document.getElementById("bannerForm").reset();
  clearProduct();
  setLinkTab("none");
  modal.style.display = "flex";
});
document
  .getElementById("closeModalBtn")
  .addEventListener("click", () => (modal.style.display = "none"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

async function loadBanners() {
  try {
    const response = await adminFetch("/api/admin/banners");
    const result = await response.json();
    if (result.success) {
      const grid = document.getElementById("bannersGrid");
      grid.innerHTML = result.data
        .map((b) => {
          const linkBadge = b.link
            ? `<span style="display:inline-block;margin-top:6px;font-size:11px;background:#e3f2fd;color:#1565c0;padding:3px 8px;border-radius:20px;"><i class="fas fa-link"></i> ${b.link.startsWith("/product?id=") ? "Produto vinculado" : b.link}</span>`
            : `<span style="display:inline-block;margin-top:6px;font-size:11px;background:#f5f5f5;color:#999;padding:3px 8px;border-radius:20px;">Sem link</span>`;
          return `
                        <div class="banner-card" data-id="${b.id}">
                            <span class="banner-drag-handle" title="Arrastar para reordenar">⠿</span>
                            <img src="${b.image_url}" class="banner-image" alt="${b.title}">
                            <div class="banner-content" style="flex:1;">
                                <h3 class="banner-title">${b.title}</h3>
                                <p class="banner-subtitle">${b.subtitle || ""}</p>
                                ${linkBadge}
                                <div class="banner-actions" style="margin-top:12px;">
                                    <button class="action-btn edit-btn" onclick="editBanner(${b.id})"><i class="fas fa-edit"></i> Editar</button>
                                    <button class="action-btn delete-btn" onclick="deleteBanner(${b.id})"><i class="fas fa-trash"></i> Excluir</button>
                                </div>
                            </div>
                        </div>`;
        })
        .join("");
      initBannerDrag();
    }
  } catch (error) {
    console.error("Erro ao carregar banners:", error);
  }
}

window.editBanner = async function (id) {
  try {
    const response = await adminFetch("/api/admin/banners");
    const result = await response.json();
    const b = result.data.find((x) => x.id === id);
    if (!b) return;

    document.getElementById("modalTitle").textContent = "Editar Banner";
    document.getElementById("bannerId").value = b.id;
    document.getElementById("bannerTitle").value = b.title;
    document.getElementById("bannerSubtitle").value = b.subtitle || "";
    document.getElementById("bannerImage").value = b.image_url;
    document.getElementById("bannerStatus").value = b.is_active ? "1" : "0";

    clearProduct();
    const tab = detectLinkTab(b.link);
    setLinkTab(tab);

    if (tab === "product" && b.link) {
      const productId = parseInt(b.link.split("id=")[1]);
      await loadProducts();
      const prod = allProducts.find((p) => p.id === productId);
      if (prod) {
        let imgs = [];
        try {
          imgs = JSON.parse(prod.images || "[]");
        } catch (e) {}
        const price = parseFloat(prod.promotional_price || prod.price)
          .toFixed(2)
          .replace(".", ",");
        selectProduct(
          prod.id,
          prod.name,
          imgs[0] || prod.main_image || "",
          price,
        );
      } else {
        setLinkTab("custom");
        document.getElementById("bannerLink").value = b.link;
      }
    } else if (tab === "custom") {
      document.getElementById("bannerLink").value = b.link || "";
    }

    modal.style.display = "flex";
  } catch (error) {
    console.error("Erro ao editar banner:", error);
  }
};

window.deleteBanner = async function (id) {
  if (confirm("Tem certeza que deseja excluir este banner?")) {
    try {
      await adminFetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      loadBanners();
    } catch (error) {
      console.error("Erro ao excluir banner:", error);
    }
  }
};

document.getElementById("bannerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("bannerId").value;

  let link = null;
  if (currentLinkTab === "product") {
    link = document.getElementById("selectedProductLink").value || null;
  } else if (currentLinkTab === "custom") {
    link = document.getElementById("bannerLink").value.trim() || null;
  }

  const data = {
    title: document.getElementById("bannerTitle").value,
    subtitle: document.getElementById("bannerSubtitle").value,
    image_url: document.getElementById("bannerImage").value,
    link,
    position: "hero",
    is_active: document.getElementById("bannerStatus").value === "1",
  };

  try {
    const url = id ? `/api/admin/banners/${id}` : "/api/admin/banners";
    const method = id ? "PUT" : "POST";
    await adminFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    modal.style.display = "none";
    loadBanners();
  } catch (error) {
    console.error("Erro ao salvar banner:", error);
  }
});

loadProducts();
loadBanners();

let bannerDragSrc = null;
const bannersGrid = document.getElementById("bannersGrid");

function initBannerDrag() {
  bannersGrid.addEventListener("mousedown", function (e) {
    const handle = e.target.closest(".banner-drag-handle");
    if (!handle) return;
    const card = handle.closest(".banner-card");
    if (card) card.draggable = true;
  });
  document.addEventListener("mouseup", function () {
    bannersGrid
      .querySelectorAll('.banner-card[draggable="true"]')
      .forEach(function (c) {
        c.draggable = false;
      });
  });
}

bannersGrid.addEventListener("dragstart", function (e) {
  const card = e.target.closest(".banner-card");
  if (!card) return;
  bannerDragSrc = card;
  card.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
});
bannersGrid.addEventListener("dragend", function () {
  bannersGrid.querySelectorAll(".banner-card").forEach(function (c) {
    c.classList.remove("dragging", "drag-over");
    c.draggable = false;
  });
  bannerDragSrc = null;
});
bannersGrid.addEventListener("dragover", function (e) {
  e.preventDefault();
  const card = e.target.closest(".banner-card");
  if (!card || !bannerDragSrc || card === bannerDragSrc) return;
  bannersGrid.querySelectorAll(".banner-card").forEach(function (c) {
    c.classList.remove("drag-over");
  });
  card.classList.add("drag-over");
});
bannersGrid.addEventListener("dragleave", function (e) {
  const card = e.target.closest(".banner-card");
  if (card) card.classList.remove("drag-over");
});
bannersGrid.addEventListener("drop", function (e) {
  e.preventDefault();
  const card = e.target.closest(".banner-card");
  if (!card || !bannerDragSrc || card === bannerDragSrc) return;
  card.classList.remove("drag-over");
  const cards = Array.from(bannersGrid.querySelectorAll(".banner-card"));
  const si = cards.indexOf(bannerDragSrc),
    ti = cards.indexOf(card);
  if (si < ti) bannersGrid.insertBefore(bannerDragSrc, card.nextSibling);
  else bannersGrid.insertBefore(bannerDragSrc, card);
  saveBannerOrder();
});

async function saveBannerOrder() {
  const cards = Array.from(bannersGrid.querySelectorAll(".banner-card"));
  const items = cards.map(function (c, i) {
    return { id: parseInt(c.dataset.id), sort_order: i };
  });
  await adminFetch("/api/admin/banners/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: items }),
  });
}
