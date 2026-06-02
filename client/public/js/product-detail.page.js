const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");
if (!productId) window.location.href = "/products";

let product = null;

async function loadProduct() {
  try {
    const res = await fetch(`/api/product/${productId}`);
    const data = await res.json();
    if (!data.success) {
      window.location.href = "/products";
      return;
    }
    product = data.data;
    document.title = `${product.name} | Velvet Atelier`;
    renderProduct();
    renderProductDescription();
  } catch (e) {
    console.error(e);
  }
}

function renderStars(rating, size) {
  size = size || 14;
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<i class="fas fa-star" style="font-size:${size}px;color:${i <= rating ? "#DAA520" : "#DDD"}"></i>`;
  }
  return html;
}

function renderProduct() {
  const price = parseFloat(product.price) || 0;
  const promo = product.promotional_price
    ? parseFloat(product.promotional_price)
    : null;
  const images =
    product.images && product.images.length
      ? product.images
      : ["https://via.placeholder.com/600x800"];
  const stock = product.stock || 0;

  document.getElementById("breadcrumbProduct").textContent = product.name;

  let stockStatus = "",
    stockClass = "";
  if (stock > 10) {
    stockStatus = `${stock} unidades disponíveis`;
    stockClass = "";
  } else if (stock > 0) {
    stockStatus = `Apenas ${stock} restantes`;
    stockClass = "low";
  } else {
    stockStatus = "Indisponível";
    stockClass = "out";
  }

  document.getElementById("productContainer").innerHTML = `
                    <div class="product-gallery">
                    <div class="main-image" onclick="openLightbox(this.querySelector('img').src)"><img src="${images[0]}" alt="${product.name}" id="mainImageImg"></div>
                    <div class="thumbnail-list" id="thumbnailList">
                        ${
                          images.length > 1
                            ? images
                                .map(
                                  (img, i) => `
                            <div class="thumbnail ${i === 0 ? "active" : ""}" onclick="setMainImage(${i})">
                                <img src="${img}" alt="">
                            </div>`,
                                )
                                .join("")
                            : ""
                        }
                    </div>
                </div>
                <div class="product-info">
                    <h1>${product.name}</h1>
                    ${product.subtitle ? `<div class="product-subtitle">${product.subtitle}</div>` : ""}
                    <div class="product-rating-summary" onclick="document.querySelector('.reviews-section').scrollIntoView({behavior:'smooth'})">
                        <div class="stars-display" id="productStars">${renderStars(0)}</div>
                        <span class="rating-count" id="productRatingCount">Ver avaliações</span>
                    </div>
                    <div class="product-price-container">
                        <span class="current-price" id="displayPrice">R$ ${(promo || price).toFixed(2)}</span>
                        ${promo ? `<span class="old-price">R$ ${price.toFixed(2)}</span><span class="discount-badge">-${Math.round((1 - promo / price) * 100)}%</span>` : ""}
                    </div>
                    <div class="product-meta">
                        <div class="meta-item"><span class="meta-label">Categoria:</span><span class="meta-value">${product.category_name || "-"}</span></div>
                        <div class="meta-item" id="stockMetaItem" style="display:none"><span class="meta-label">Disponibilidade:</span><span class="meta-value stock-status ${stockClass}" id="stockStatusLabel">${stockStatus}</span></div>
                    </div>
                    <div class="purchase-section">
                        <div id="variationsSection" class="variations-section"></div>
                        <div class="quantity-selector">
                            <label>Quantidade:</label>
                            <div class="quantity-control">
                                <button type="button" id="decreaseQty">-</button>
                                <input type="number" id="quantity" value="1" min="1" max="${stock}">
                                <button type="button" id="increaseQty">+</button>
                            </div>
                        </div>
                        <p class="stock-warning" id="stockWarning"></p>
                        <button class="btn-add-cart" id="addToCartBtn" ${stock === 0 ? "disabled" : ""}>
                            <i class="fas fa-shopping-bag"></i> Adicionar ao Carrinho
                        </button>
                        <button class="btn-wishlist" id="wishlistBtn">
                            <i class="far fa-heart"></i> Adicionar aos Favoritos
                        </button>
                    </div>
                </div>`;

  document.getElementById("decreaseQty").onclick = () => {
    const i = document.getElementById("quantity");
    i.value = Math.max(1, parseInt(i.value) - 1);
  };
  document.getElementById("increaseQty").onclick = () => {
    const i = document.getElementById("quantity");
    i.value = Math.min(parseInt(i.max) || 99, parseInt(i.value) + 1);
  };
  document.getElementById("addToCartBtn").onclick = async () => {
    const hasColors = window._variations.some((v) => v.color);
    const hasSizes = window._variations.some((v) => v.size);
    if (hasColors && !window._selectedColor) {
      showToast("Selecione uma cor antes de adicionar ao carrinho.");
      return;
    }
    if (hasSizes && !window._selectedSize) {
      showToast("Selecione um tamanho antes de adicionar ao carrinho.");
      return;
    }
    const qty = parseInt(document.getElementById("quantity").value);
    const ok = await addToCart(
      productId,
      qty,
      window._selectedColor,
      window._selectedSize,
    );
    if (ok) {
      const btn = document.getElementById("addToCartBtn");
      btn.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
      setTimeout(
        () =>
          (btn.innerHTML =
            '<i class="fas fa-shopping-bag"></i> Adicionar ao Carrinho'),
        2000,
      );
    }
  };

  const wishlistBtn = document.getElementById("wishlistBtn");
  if (wishlistBtn) {
    Wishlist.getIds().then((ids) => {
      const isFav = ids.has(String(productId));
      updateWishlistBtn(wishlistBtn, isFav);
    });

    wishlistBtn.onclick = async () => {
      const action = await Wishlist.toggle(productId);
      if (action) updateWishlistBtn(wishlistBtn, action === "added");
    };
  }

  function updateWishlistBtn(btn, isFav) {
    btn.innerHTML = isFav
      ? '<i class="fas fa-heart"></i> Salvo nos Favoritos'
      : '<i class="far fa-heart"></i> Adicionar aos Favoritos';
    btn.classList.toggle("active", isFav);
  }
}

function renderProductDescription() {
  const descSection = document.getElementById("productDescriptionSection");
  const descBody = document.getElementById("productDescriptionBody");
  if (!descSection || !descBody) return;
  if (product.description && product.description.trim()) {
    const raw = product.description.trim();
    const hasHtml = raw.indexOf("<") !== -1;
    descBody.innerHTML = hasHtml
      ? raw
      : raw
          .split("\n")
          .filter(function (p) {
            return p.trim();
          })
          .map(function (p) {
            return "<p>" + p + "</p>";
          })
          .join("");
    descSection.style.display = "";
  } else {
    descSection.style.display = "none";
  }
}

window.setMainImage = function (index, imgs) {
  const images = imgs || product.images || [];
  if (images[index]) {
    document.getElementById("mainImageImg").src = images[index];
    document
      .querySelectorAll(".thumbnail")
      .forEach((t, i) => t.classList.toggle("active", i === index));
  }
};

window._variations = [];
window._colors = [];
window._selectedColor = null;
window._selectedSize = null;
window._defaultImages = [];

async function loadVariations() {
  window._defaultImages = [...(product.images || [])];

  try {
    const res = await fetch(`/api/variations/${productId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success) window._variations = data.data;
  } catch (e) {
    console.error("Erro ao carregar variações:", e);
  }

  try {
    const res = await fetch(`/api/colors/${productId}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success) {
      window._colors = data.data.map((c) => ({
        ...c,
        images: Array.isArray(c.images)
          ? c.images
          : typeof c.images === "string"
            ? JSON.parse(c.images)
            : [],
      }));
    }
  } catch (e) {
    console.error("Erro ao carregar cores:", e);
  }

  renderVariationSection();
}

function renderVariationSection() {
  const section = document.getElementById("variationsSection");
  const vars = window._variations;
  if (!vars.length && !window._colors.length) {
    section.innerHTML = "";
    return;
  }

  const allColorNames = [...new Set(vars.map((v) => v.color).filter(Boolean))];
  const colorNames = [
    ...window._colors
      .map((c) => c.name)
      .filter((n) => allColorNames.includes(n)),
    ...allColorNames.filter((n) => !window._colors.some((c) => c.name === n)),
  ];
  const hasSizes = vars.some((v) => v.size);

  let html = "";

  if (colorNames.length) {
    html += `<div class="variation-group">
                    <div class="variation-label">Cor: <span id="selectedColorLabel">Selecione</span></div>
                    <div class="variation-options">`;
    colorNames.forEach((name) => {
      const colorMeta = window._colors.find((c) => c.name === name);
      if (colorMeta && colorMeta.hex) {
        html += `<button class="var-btn color-btn" data-type="color" data-value="${name}"
                            style="background:${colorMeta.hex};border-color:${colorMeta.hex};" title="${name}"></button>`;
      } else {
        html += `<button class="var-btn" data-type="color" data-value="${name}">${name}</button>`;
      }
    });
    html += `</div></div>`;
  }

  if (hasSizes) {
    html += `<div class="variation-group" id="sizesGroup">
                    <div class="variation-label">Tamanho: <span id="selectedSizeLabel">Selecione</span></div>
                    <div class="variation-options" id="sizeOptions"></div>
                </div>`;
  }

  if (!html) return;
  section.innerHTML = html;

  if (hasSizes) renderSizes(null);

  section.querySelectorAll('.var-btn[data-type="color"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      section
        .querySelectorAll('.var-btn[data-type="color"]')
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      window._selectedColor = btn.dataset.value;
      window._selectedSize = null;
      document.getElementById("selectedColorLabel").textContent =
        btn.dataset.value;

      const colorMeta = window._colors.find(
        (c) => c.name === btn.dataset.value,
      );
      swapGallery(
        colorMeta && colorMeta.images && colorMeta.images.length
          ? colorMeta.images
          : window._defaultImages,
      );

      const variation = window._variations.find(
        (v) => v.color === btn.dataset.value,
      );
      const priceEl = document.getElementById("displayPrice");
      const adjPrice = parseFloat(variation?.price_adjustment) || 0;
      if (priceEl && adjPrice > 0) {
        priceEl.textContent = `R$ ${adjPrice.toFixed(2)}`;
      } else if (priceEl) {
        priceEl.textContent = `R$ ${(promo || price).toFixed(2)}`;
      }

      if (hasSizes) renderSizes(btn.dataset.value);
      updateStockDisplay();
    });
  });
}

function renderSizes(filterColor) {
  const optionsEl = document.getElementById("sizeOptions");
  if (!optionsEl) return;
  const lbl = document.getElementById("selectedSizeLabel");
  if (lbl) lbl.textContent = "Selecione";
  window._selectedSize = null;

  const relevant = filterColor
    ? window._variations.filter((v) => v.color === filterColor && v.size)
    : window._variations.filter((v) => v.size);

  const sizeMap = {};
  relevant.forEach((v) => {
    if (!sizeMap[v.size]) sizeMap[v.size] = 0;
    sizeMap[v.size] += v.stock;
  });

  if (!Object.keys(sizeMap).length) {
    optionsEl.innerHTML = "";
    return;
  }

  optionsEl.innerHTML = Object.entries(sizeMap)
    .map(
      ([size, stock]) =>
        `<button class="var-btn${stock === 0 ? "" : ""}" data-type="size" data-value="${size}"
                    style="${stock === 0 ? "opacity:0.45;text-decoration:line-through;cursor:not-allowed;" : ""}"
                    ${stock === 0 ? "disabled" : ""}
                    title="${stock === 0 ? "Esgotado" : stock + " em estoque"}">${size}</button>`,
    )
    .join("");

  optionsEl.querySelectorAll('.var-btn[data-type="size"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      optionsEl
        .querySelectorAll('.var-btn[data-type="size"]')
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      window._selectedSize = btn.dataset.value;
      if (lbl) lbl.textContent = btn.dataset.value;
      updateStockDisplay();
    });
  });
}

function updateStockDisplay() {
  const warning = document.getElementById("stockWarning");
  const addBtn = document.getElementById("addToCartBtn");
  const qtyInput = document.getElementById("quantity");
  const statusLabel = document.getElementById("stockStatusLabel");
  const stockMeta = document.getElementById("stockMetaItem");
  if (!warning || !addBtn) return;

  const activeSizeBtn = document.querySelector(
    "#sizeOptions .var-btn.selected",
  );
  const activeColorBtn = document.querySelector(
    '.var-btn[data-type="color"].selected',
  );
  if (!activeSizeBtn) window._selectedSize = null;
  if (!activeColorBtn) window._selectedColor = null;

  const color = window._selectedColor || null;
  const size = window._selectedSize || null;
  const vars = window._variations || [];
  const hasColors = Array.isArray(window._colors) && window._colors.length > 0;
  const hasSizes = vars.some((v) => v.size);

  if ((hasColors && !color) || (hasSizes && !size)) {
    if (stockMeta) stockMeta.style.display = "none";
    addBtn.disabled = true;
    warning.classList.remove("visible");
    return;
  }

  const matched = vars.filter(
    (v) => (!hasColors || v.color === color) && (!hasSizes || v.size === size),
  );
  const totalStock = matched.reduce(
    (sum, v) => sum + (parseInt(v.stock) || 0),
    0,
  );

  if (!matched.length) {
    if (stockMeta) stockMeta.style.display = "none";
    addBtn.disabled = true;
    warning.classList.remove("visible");
    return;
  }

  if (stockMeta) stockMeta.style.display = "";

  qtyInput.max = totalStock;
  qtyInput.value = Math.min(parseInt(qtyInput.value) || 1, totalStock || 1);
  addBtn.disabled = totalStock === 0;

  if (statusLabel) {
    statusLabel.className = "meta-value stock-status";
    if (totalStock === 0) {
      statusLabel.textContent = "Esgotado";
      statusLabel.classList.add("out");
    } else if (totalStock <= 5) {
      statusLabel.textContent = `Apenas ${totalStock} unidade${totalStock > 1 ? "s" : ""} restante${totalStock > 1 ? "s" : ""}`;
      statusLabel.classList.add("low");
    } else {
      statusLabel.textContent = `${totalStock} unidades disponíveis`;
    }
  }

  if (totalStock === 0) {
    warning.textContent = "Esta combinação está esgotada.";
    warning.classList.add("visible");
  } else {
    warning.classList.remove("visible");
  }
}

function swapGallery(images) {
  if (!images || !images.length) return;
  const mainImg = document.getElementById("mainImageImg");
  if (mainImg) mainImg.src = images[0];
  const thumbList = document.getElementById("thumbnailList");
  if (!thumbList) return;
  if (images.length > 1) {
    thumbList.innerHTML = images
      .map(
        (img, i) => `
                    <div class="thumbnail ${i === 0 ? "active" : ""}" onclick="setMainImage(${i}, ${JSON.stringify(images).replace(/"/g, "&quot;")})">
                        <img src="${img}" alt="">
                    </div>`,
      )
      .join("");
  } else {
    thumbList.innerHTML = "";
  }
}

async function loadReviews() {
  try {
    const res = await fetch(`/api/reviews/${productId}`);
    const data = await res.json();
    if (!data.success) return;
    renderStats(data.stats);
    renderReviewsList(data.data);
    if (data.stats.total > 0) {
      document.getElementById("productStars").innerHTML = renderStars(
        Math.round(data.stats.average),
      );
      document.getElementById("productRatingCount").textContent =
        `${data.stats.average} (${data.stats.total} avaliação${data.stats.total !== 1 ? "ões" : ""})`;
    }
  } catch (e) {
    console.error(e);
  }
}

function renderStats(s) {
  const total = parseInt(s.total) || 0;
  const avg = parseFloat(s.average) || 0;
  document.getElementById("statsScore").textContent = total
    ? avg.toFixed(1)
    : "—";
  document.getElementById("statsStars").innerHTML = total
    ? renderStars(Math.round(avg), 18)
    : "";
  document.getElementById("statsTotal").textContent = total
    ? `${total} avaliação${total !== 1 ? "ões" : ""}`
    : "Nenhuma avaliação ainda";
  if (total) {
    const counts = { 5: s.five, 4: s.four, 3: s.three, 2: s.two, 1: s.one };
    document.getElementById("statsBars").innerHTML = [5, 4, 3, 2, 1]
      .map((n) => {
        const pct = Math.round((counts[n] / total) * 100);
        return `<div class="bar-row">
                        <span>${n} <i class="fas fa-star" style="color:#DAA520;font-size:10px;"></i></span>
                        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                        <span class="bar-count">${counts[n]}</span>
                    </div>`;
      })
      .join("");
  }
}

function renderReviewsList(reviews) {
  const el = document.getElementById("reviewsList");
  if (!reviews.length) {
    el.innerHTML = `<div class="reviews-empty"><i class="fas fa-comment-slash"></i>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</div>`;
    return;
  }
  if (window.storeReviewImages) storeReviewImages(reviews);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  el.innerHTML = reviews
    .map((r) => {
      let imgs = [];
      try {
        imgs = r.images
          ? typeof r.images === "string"
            ? JSON.parse(r.images)
            : r.images
          : [];
      } catch {}
      const imgsHtml = imgs.length
        ? `<div class="review-images">${imgs.map((u, idx) => `<img class="review-thumb" src="${u}" alt="Foto ${idx + 1}" onclick="openReviewLightbox(${r.id}, ${idx})">`).join("")}</div>`
        : "";
      const isOwner = currentUser.id && r.user_id === currentUser.id;
      const initial = (r.user_name || "?")[0].toUpperCase();
      const deleteBtn = isOwner
        ? `<button class="btn-delete-review" onclick="deleteReview(${r.id})" title="Excluir minha avaliação"><i class="fas fa-trash-alt"></i></button>`
        : "";
      return `
                <div class="review-card" id="review-${r.id}">
                    <div class="review-card-top">
                        <div class="review-card-left">
                            <div class="review-avatar">${initial}</div>
                            <div>
                                <div class="review-author">${r.user_name}</div>
                                <div class="review-date">${new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                            </div>
                        </div>
                        <div class="review-card-right">
                            <div class="review-stars">${renderStars(r.rating, 13)}</div>
                            ${deleteBtn}
                        </div>
                    </div>
                    ${r.comment ? `<div class="review-comment">${r.comment}</div>` : ""}
                    ${imgsHtml}
                </div>`;
    })
    .join("");
}

window.deleteReview = async function (reviewId) {
  if (!confirm("Excluir sua avaliação?")) return;
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  try {
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById(`review-${reviewId}`)?.remove();
      loadReviews();
    } else {
      alert(data.message || "Erro ao excluir.");
    }
  } catch {
    alert("Erro de conexão.");
  }
};

window.toggleReviewForm = function () {
  const wrap = document.getElementById("reviewFormWrap");
  const isVisible = wrap.classList.toggle("visible");
  if (isVisible) wrap.scrollIntoView({ behavior: "smooth", block: "start" });
};

let reviewImages = [];

function refreshImgPreview() {
  const preview = document.getElementById("reviewImgPreview");
  if (!preview) return;
  preview.innerHTML = reviewImages
    .map(
      (src, i) => `
                <div class="review-img-preview-item">
                    <img src="${src}" alt="Foto ${i + 1}">
                    <button class="remove-img" onclick="removeReviewImg(${i})" type="button">&times;</button>
                </div>`,
    )
    .join("");
  const dz = document.getElementById("reviewDropzone");
  if (dz) {
    dz.style.display = reviewImages.length >= 5 ? "none" : "";
  }
}

window.removeReviewImg = function (idx) {
  reviewImages.splice(idx, 1);
  refreshImgPreview();
};

async function uploadReviewFile(file) {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/uploads/review-image", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json();
  if (data.success) return data.url;
  throw new Error(data.message || "Erro no upload");
}

async function handleReviewFiles(files) {
  const remaining = 5 - reviewImages.length;
  const toUpload = Array.from(files)
    .filter((f) => f.type.startsWith("image/"))
    .slice(0, remaining);
  if (!toUpload.length) return;

  const preview = document.getElementById("reviewImgPreview");
  const tempIds = toUpload.map((_, i) => `temp-${Date.now()}-${i}`);
  toUpload.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement("div");
      div.className = "review-img-preview-item";
      div.id = tempIds[i];
      div.innerHTML = `<img src="${e.target.result}"><div class="upload-progress"><i class="fas fa-spinner fa-spin"></i></div>`;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });

  for (let i = 0; i < toUpload.length; i++) {
    try {
      const url = await uploadReviewFile(toUpload[i]);
      reviewImages.push(url);
      document.getElementById(tempIds[i])?.remove();
    } catch (e) {
      document.getElementById(tempIds[i])?.remove();
      console.warn("Upload falhou:", e);
    }
  }
  refreshImgPreview();
}

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("reviewFileInput");
  const dropzone = document.getElementById("reviewDropzone");
  if (!fileInput || !dropzone) return;

  fileInput.addEventListener("change", () => {
    handleReviewFiles(fileInput.files);
    fileInput.value = "";
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });
  dropzone.addEventListener("dragleave", () =>
    dropzone.classList.remove("drag-over"),
  );
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    handleReviewFiles(e.dataTransfer.files);
  });
});

window.submitReview = async function () {
  const ratingEl = document.querySelector('input[name="rating"]:checked');
  const comment = document.getElementById("reviewComment").value.trim();
  const msgEl = document.getElementById("reviewMsg");

  if (!ratingEl) {
    msgEl.textContent = "Selecione uma nota antes de enviar.";
    msgEl.style.color = "#C45C5C";
    msgEl.style.display = "block";
    return;
  }
  const token =
    localStorage.getItem("authToken") || localStorage.getItem("token");
  if (!token) {
    msgEl.innerHTML =
      'Você precisa <a href="/login" style="color:var(--primary);">fazer login</a> para avaliar.';
    msgEl.style.color = "#C45C5C";
    msgEl.style.display = "block";
    return;
  }

  const btn = document.querySelector(".btn-submit-review");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const res = await fetch(`/api/reviews/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating: parseInt(ratingEl.value),
        comment,
        images: reviewImages,
      }),
    });
    const data = await res.json();
    if (data.success) {
      msgEl.textContent = "✓ Avaliação enviada!";
      msgEl.style.color = "#2E8B57";
      msgEl.style.display = "block";
      reviewImages = [];
      refreshImgPreview();
      setTimeout(() => {
        document.getElementById("reviewFormWrap").classList.remove("visible");
        msgEl.style.display = "none";
        loadReviews();
      }, 1500);
    } else {
      msgEl.textContent = data.message || "Erro ao enviar.";
      msgEl.style.color = "#C45C5C";
      msgEl.style.display = "block";
    }
  } catch {
    msgEl.textContent = "Erro de conexão.";
    msgEl.style.color = "#C45C5C";
    msgEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar Avaliação";
  }
};

async function loadNavCategories() {
  try {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success && data.data.length) {
      const dropdown = document.getElementById("categoriesDropdown");
      if (dropdown) {
        let html = data.data
          .filter((c) => c.status === "active")
          .map(
            (cat) =>
              `<li><a href="/products?category=${cat.slug}">${cat.name}</a></li>`,
          )
          .join("");
        html += `<li class="view-all"><a href="/products">Ver Todas as Categorias</a></li>`;
        dropdown.innerHTML = html;
      }
    }
  } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavCategories();
  loadProduct().then(() => {
    loadReviews();
    loadVariations();
  });
});

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

function openLightbox(src) {
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
  document.body.style.overflow = "";
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

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

function showToast(message, type = "error") {
  const existing = document.getElementById("page-toast");
  if (existing) existing.remove();
  const colors = {
    error: "background:#C45C5C;color:#fff;",
    success: "background:#2E8B57;color:#fff;",
    info: "background:#1A1817;color:#fff;",
  };
  const t = document.createElement("div");
  t.id = "page-toast";
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);${colors[type] || colors.error}padding:12px 24px;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:500;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:fadeInUp 0.3s ease;pointer-events:none;`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

window._reviewImagesMap = {};

const _origRenderReviews = window.renderReviewsList;

function storeReviewImages(reviews) {
  reviews.forEach((r) => {
    let imgs = [];
    try {
      imgs = r.images
        ? typeof r.images === "string"
          ? JSON.parse(r.images)
          : r.images
        : [];
    } catch {}
    if (imgs.length) window._reviewImagesMap[r.id] = imgs;
  });
}

let _lbImages = [],
  _lbIdx = 0;

window.openReviewLightbox = function (reviewId, startIdx) {
  const imgs = window._reviewImagesMap[reviewId];
  if (!imgs || !imgs.length) return;
  _lbImages = imgs;
  _lbIdx = startIdx;
  _renderLightbox();
  document.getElementById("reviewLightbox").classList.add("open");
  document.body.style.overflow = "hidden";
};

function _renderLightbox() {
  document.getElementById("lbMainImg").src = _lbImages[_lbIdx];
  document.getElementById("lbCounter").textContent =
    `${_lbIdx + 1} / ${_lbImages.length}`;
  document.getElementById("lbThumbs").innerHTML = _lbImages
    .map(
      (u, i) =>
        `<img src="${u}" class="${i === _lbIdx ? "active" : ""}" onclick="lbGoTo(${i})" alt="${i + 1}">`,
    )
    .join("");
  const thumbs = document.getElementById("lbThumbs");
  const active = thumbs.querySelector(".active");
  if (active) active.scrollIntoView({ inline: "center", behavior: "smooth" });
  const show = _lbImages.length > 1;
  document.querySelector(".review-lb-prev").style.display = show ? "" : "none";
  document.querySelector(".review-lb-next").style.display = show ? "" : "none";
}

window.lbNav = function (dir) {
  _lbIdx = (_lbIdx + dir + _lbImages.length) % _lbImages.length;
  _renderLightbox();
};

window.lbGoTo = function (idx) {
  _lbIdx = idx;
  _renderLightbox();
};

window.closeReviewLightbox = function (e) {
  if (
    e &&
    e.target !== document.getElementById("reviewLightbox") &&
    !e.target.classList.contains("review-lb-close")
  )
    return;
  document.getElementById("reviewLightbox").classList.remove("open");
  document.body.style.overflow = "";
};

document.addEventListener("keydown", (e) => {
  if (!document.getElementById("reviewLightbox").classList.contains("open"))
    return;
  if (e.key === "ArrowRight") lbNav(1);
  if (e.key === "ArrowLeft") lbNav(-1);
  if (e.key === "Escape") {
    document.getElementById("reviewLightbox").classList.remove("open");
    document.body.style.overflow = "";
  }
});

const _origLoadReviews = window.loadReviews;
if (typeof _origLoadReviews === "function") {
  window.loadReviews = async function () {
    await _origLoadReviews();
  };
}

// Scroll automático para seção de avaliações quando URL tem #reviews
if (window.location.hash === "#reviews") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const section = document.querySelector(".reviews-section");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 600); // aguarda o carregamento dinâmico das avaliações
  });
}