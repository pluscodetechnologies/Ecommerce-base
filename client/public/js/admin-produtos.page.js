(function () {
  if (localStorage.getItem("adminTheme") === "dark") {
    document.documentElement.classList.add("dark");
  }
})();

const user = JSON.parse(localStorage.getItem("user") || "{}");
document.getElementById("adminName").textContent = user.name || "Administrador";
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = "/admin";
});

function showToast(msg, type) {
  type = type || "success";
  const t = document.getElementById("toast");
  t.querySelector("i").className =
    type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
  t.className = "toast " + type;
  document.getElementById("toastMsg").textContent = msg;
  t.classList.add("show");
  setTimeout(function () {
    t.classList.remove("show");
  }, 3000);
}

let allProducts = [];
let allCategories = [];
let activeCategory = null;
let searchTerm = "";

async function loadCategories() {
  const res = await adminFetch("/api/admin/categories");
  const result = await res.json();
  if (result.success) {
    allCategories = result.data;
    renderCategoryTabs();
  }
  await loadCategorySelect();
}

async function loadCategorySelect() {
  const res = await adminFetch("/api/admin/categories");
  const result = await res.json();
  if (result.success) {
    const select = document.getElementById("productCategory");
    select.innerHTML = '<option value="">Sem categoria</option>';
    result.data.forEach(function (cat) {
      select.innerHTML +=
        '<option value="' + cat.id + '">' + cat.name + "</option>";
    });
  }
}

function getCategoryCount(catId) {
  if (catId === null) return allProducts.length;
  if (catId === "__sem__")
    return allProducts.filter(function (p) {
      return !p.category_id;
    }).length;
  return allProducts.filter(function (p) {
    return String(p.category_id) === String(catId);
  }).length;
}

function renderCategoryTabs() {
  const tabs = document.getElementById("categoryTabs");
  let html =
    '<button class="cat-tab ' +
    (activeCategory === null ? "active" : "") +
    '" onclick="setCategory(null)">' +
    'Todos <span class="tab-count">' +
    allProducts.length +
    "</span></button>";

  allCategories.forEach(function (cat) {
    const count = getCategoryCount(cat.id);
    html +=
      '<button class="cat-tab ' +
      (activeCategory === cat.id ? "active" : "") +
      '" onclick="setCategory(' +
      cat.id +
      ')">' +
      cat.name +
      ' <span class="tab-count">' +
      count +
      "</span></button>";
  });

  const semCount = getCategoryCount("__sem__");
  if (semCount > 0) {
    html +=
      '<button class="cat-tab ' +
      (activeCategory === "__sem__" ? "active" : "") +
      '" onclick="setCategory(\'__sem__\')">' +
      'Sem categoria <span class="tab-count">' +
      semCount +
      "</span></button>";
  }

  tabs.innerHTML = html;
}

window.setCategory = function (catId) {
  activeCategory = catId;
  renderCategoryTabs();
  renderTable();
};

async function loadProducts() {
  const res = await adminFetch("/api/admin/products?limit=200");
  const result = await res.json();
  if (result.success) {
    allProducts = result.data.products;
    renderCategoryTabs();
    renderTable();
  }
}

function getFilteredProducts() {
  let list = allProducts.slice();

  if (activeCategory === "__sem__") {
    list = list.filter(function (p) {
      return !p.category_id;
    });
  } else if (activeCategory !== null) {
    list = list.filter(function (p) {
      return String(p.category_id) === String(activeCategory);
    });
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    list = list.filter(function (p) {
      return (
        (p.name || "").toLowerCase().includes(term) ||
        (p.sku || "").toLowerCase().includes(term)
      );
    });
  }

  return list;
}

function renderTable() {
  const filtered = getFilteredProducts();
  const tbody = document.getElementById("productsTableBody");

  let title = "Todos os Produtos";
  if (activeCategory === "__sem__") title = "Sem Categoria";
  else if (activeCategory !== null) {
    const cat = allCategories.find(function (c) {
      return c.id == activeCategory;
    });
    if (cat) title = cat.name;
  }
  document.getElementById("panelTitle").textContent = title;
  document.getElementById("panelCount").textContent =
    filtered.length + " produto" + (filtered.length !== 1 ? "s" : "");

  if (!filtered.length) {
    tbody.innerHTML =
      '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-box-open"></i><p>Nenhum produto encontrado</p></div></td></tr>';
    return;
  }

  const _filtered = filtered;
  tbody.innerHTML = filtered
    .map(function (p, idx) {
      let images = [];
      try {
        images =
          typeof p.images === "string" ? JSON.parse(p.images) : p.images || [];
      } catch (e) {
        images = [];
      }
      const img = images.length
        ? images[0]
        : "https://via.placeholder.com/50x60";
      const price = parseFloat(p.price) || 0;
      const promoPrice = p.promotional_price
        ? parseFloat(p.promotional_price)
        : null;
      const isFeatured = p.is_featured === 1 || p.is_featured === true;

      return (
        '<tr data-id="' +
        p.id +
        '">' +
        '<td><img src="' +
        img +
        '" class="product-image" alt="' +
        (p.name || "") +
        '"></td>' +
        '<td><div class="product-name-cell"><strong>' +
        (p.name || "") +
        "</strong>" +
        (p.sku ? '<span class="product-sku">SKU: ' + p.sku + "</span>" : "") +
        (isFeatured
          ? '<span class="featured-badge"><i class="fas fa-star"></i> Destaque</span>'
          : "") +
        "</div></td>" +
        "<td>" +
        (p.category_name || '<span style="color:#bbb">—</span>') +
        "</td>" +
        "<td>" +
        (promoPrice
          ? '<span style="text-decoration:line-through;color:#bbb;font-size:11px;">R$ ' +
            price.toFixed(2) +
            '</span><br><span style="color:#c62828;font-weight:600;">R$ ' +
            promoPrice.toFixed(2) +
            "</span>"
          : "R$ " + price.toFixed(2)) +
        "</td>" +
        '<td><div class="var-tags" id="var-tags-' +
        p.id +
        '" data-stock="' +
        (p.stock || 0) +
        '"><span class="var-loading">carregando...</span></div></td>' +
        '<td><span class="status-badge status-' +
        p.status +
        '">' +
        (p.status === "active" ? "Ativo" : "Inativo") +
        "</span></td>" +
        '<td><div class="action-buttons">' +
        '<button class="action-btn edit-btn" onclick="editProduct(' +
        p.id +
        ')" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="action-btn delete-btn" onclick="deleteProduct(' +
        p.id +
        ')" title="Excluir"><i class="fas fa-trash"></i></button>' +
        "</div></td>" +
        "</tr>"
      );
    })
    .join("");

  loadAllVariationTags(_filtered);
}

document.getElementById("searchInput").addEventListener("input", function (e) {
  searchTerm = e.target.value;
  renderTable();
});

const modal = document.getElementById("productModal");
document.getElementById("closeModalBtn").addEventListener("click", function () {
  modal.style.display = "none";
});
modal.addEventListener("click", function (e) {
  if (e.target === modal) modal.style.display = "none";
});

document.getElementById("newProductBtn").addEventListener("click", function () {
  document.getElementById("modalTitle").textContent = "Novo Produto";
  document.getElementById("productId").value = "";
  document.getElementById("productForm").reset();
  document.getElementById("productStatus").value = "active";
  document.getElementById("colorsContainer").innerHTML = "";
  modal.style.display = "flex";
});

window.editProduct = async function (id) {
  const p = allProducts.find(function (x) {
    return x.id === id;
  });
  if (!p) return;
  document.getElementById("modalTitle").textContent = "Editar Produto";
  document.getElementById("productId").value = p.id;
  document.getElementById("productName").value = p.name || "";
  document.getElementById("productDescription").value = p.description || "";
  document.getElementById("productPrice").value = p.price || "";
  document.getElementById("productPromoPrice").value =
    p.promotional_price || "";
  document.getElementById("productSku").value = p.sku || "";
  document.getElementById("productStock").value = p.stock || 0;
  document.getElementById("productCategory").value = p.category_id || "";
  document.getElementById("productStatus").value = p.status || "active";
  document.getElementById("productFeatured").checked =
    p.is_featured === 1 || p.is_featured === true;
  let images = [];
  try {
    images =
      typeof p.images === "string" ? JSON.parse(p.images) : p.images || [];
  } catch (e) {
    images = [];
  }
  document.getElementById("productImages").value = images.join(", ");
  modal.style.display = "flex";
  loadVariationsAdmin(p.id);
};

window.deleteProduct = async function (id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;
  await adminFetch("/api/admin/products/" + id, { method: "DELETE" });
  showToast("Produto excluído");
  loadProducts();
};

document
  .getElementById("saveProductBtn")
  .addEventListener("click", async function () {
    const errEl =
      document.getElementById("productErr") ||
      document.getElementById("manualOrderErr");
    function showFormErr(msg) {
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = "block";
        setTimeout(() => (errEl.style.display = "none"), 4000);
      } else {
        showAdminToast(msg, "error");
      }
    }
    if (!document.getElementById("productName").value.trim()) {
      showFormErr("Informe o nome do produto.");
      return;
    }
    if (!document.getElementById("productPrice").value) {
      showFormErr("Informe o preço do produto.");
      return;
    }
    if (
      !document.getElementById("productStock").value &&
      document.getElementById("productStock").value !== "0"
    ) {
      showFormErr("Informe o estoque do produto.");
      return;
    }

    const id = document.getElementById("productId").value;
    const imagesRaw = document.getElementById("productImages").value;
    const images = imagesRaw
      ? imagesRaw
          .split(",")
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean)
      : [];

    const data = {
      name: document.getElementById("productName").value,
      description: document.getElementById("productDescription").value,
      price: parseFloat(document.getElementById("productPrice").value),
      promotional_price: document.getElementById("productPromoPrice").value
        ? parseFloat(document.getElementById("productPromoPrice").value)
        : null,
      sku: document.getElementById("productSku").value,
      stock: parseInt(document.getElementById("productStock").value) || 0,
      category_id: document.getElementById("productCategory").value || null,
      status: document.getElementById("productStatus").value,
      is_featured: document.getElementById("productFeatured").checked,
      images: images,
    };

    const url = id ? "/api/admin/products/" + id : "/api/admin/products";
    const method = id ? "PUT" : "POST";
    const res = await adminFetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    const savedId = id
      ? parseInt(id)
      : result.data && result.data.id
        ? result.data.id
        : null;
    if (savedId) await saveVariations(savedId);
    modal.style.display = "none";
    showToast(id ? "Produto atualizado!" : "Produto criado!");
    loadProducts();
  });

window.previewHex = function (input) {
  const preview = input.closest(".color-block").querySelector(".c-preview");
  if (preview) preview.style.background = input.value.trim() || "#eee";
};

window.toggleColorPrice = function (checkbox, priceId) {
  const input = document.getElementById(priceId);
  if (!input) return;
  if (checkbox.checked) {
    input.style.display = "none";
    input.value = "";
  } else {
    input.style.display = "";
    input.focus();
  }
};

window.toggleColorBody = function (btn) {
  const block = btn.closest(".color-block");
  const body = block.querySelector(".c-body");
  const icon = btn.querySelector(".chevron");
  const open = body.style.display !== "none";
  body.style.display = open ? "none" : "block";
  icon.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
};

function makeSizeRow(size, stock) {
  size = size || "";
  stock = stock !== undefined ? stock : "";
  return (
    '<div class="size-row" style="display:flex;gap:6px;align-items:center;margin-top:6px;">' +
    '<input type="text" placeholder="Ex: P, M, G, GG…" value="' +
    size +
    '" class="s-size" style="flex:1;min-width:60px;padding:5px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">' +
    '<input type="number" min="0" placeholder="Estoque" value="' +
    stock +
    '" class="s-stock" style="width:80px;padding:5px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px;">' +
    '<button type="button" onclick="this.closest(\'.size-row\').remove()" style="background:#e74c3c;color:white;border:none;width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:14px;flex-shrink:0;">×</button>' +
    "</div>"
  );
}

function makeColorBlock(c, expanded) {
  c = c || {};
  expanded = expanded !== undefined ? expanded : false;
  const hex = c.hex || "";
  const imgs = Array.isArray(c.images) ? c.images.join(", ") : c.images || "";
  const sizes = c.sizes || [];
  const hasPrice = c.price && parseFloat(c.price) > 0;
  const priceNum = parseFloat(c.price) || 0;
  const sizeRowsHtml = sizes.length
    ? sizes
        .map(function (s) {
          return makeSizeRow(s.size, s.stock);
        })
        .join("")
    : makeSizeRow();
  const priceId = "cp_" + Math.random().toString(36).slice(2, 7);
  const blockId = "cb_" + Math.random().toString(36).slice(2, 8);
  const colorName = c.name || "";
  const previewBg = hex || "#e0e0e0";

  return (
    '<div class="color-block" id="' +
    blockId +
    '" style="border:1.5px solid #e8e8e8;border-radius:10px;margin-bottom:8px;background:white;overflow:hidden;">' +
    '<div class="c-header" style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;user-select:none;background:#fafafa;border-bottom:1px solid ' +
    (expanded ? "#e8e8e8" : "transparent") +
    ';" onclick="toggleColorBody(this)">' +
    '<span class="color-drag-handle" title="Arrastar para reordenar" onclick="event.stopPropagation()" style="cursor:grab;color:#ccc;font-size:15px;padding:2px 4px;flex-shrink:0;">⠿</span>' +
    '<div class="c-preview" style="width:20px;height:20px;border-radius:50%;border:1.5px solid #ddd;background:' +
    previewBg +
    ';flex-shrink:0;"></div>' +
    '<span class="c-name-label" style="flex:1;font-size:13px;font-weight:600;color:#1a1a2e;">' +
    (colorName ||
      '<span style=\"color:#bbb;font-weight:400;\">Nova cor</span>') +
    "</span>" +
    '<span style="font-size:11px;color:#aaa;margin-right:4px;">' +
    (sizes.length
      ? sizes.length + " tamanho" + (sizes.length > 1 ? "s" : "")
      : "") +
    "</span>" +
    '<svg class="chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;transition:transform 0.2s;transform:' +
    (expanded ? "rotate(180deg)" : "rotate(0deg)") +
    ';"><path d="M2 4.5L7 9.5L12 4.5" stroke="#aaa" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    "</div>" +
    '<div class="c-body" style="padding:12px;display:' +
    (expanded ? "block" : "none") +
    ';">' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">' +
    '<input type="text" placeholder="Nome da cor (ex: Branco)" value="' +
    colorName +
    '" class="c-name" ' +
    'style="flex:1;min-width:100px;padding:7px 10px;border:1.5px solid #e0e0e0;border-radius:7px;font-size:13px;font-weight:500;" ' +
    "oninput=\"this.closest('.color-block').querySelector('.c-name-label').textContent = this.value || 'Nova cor'\">" +
    '<div style="display:flex;gap:5px;align-items:center;">' +
    '<input type="text" placeholder="#ffffff" value="' +
    hex +
    '" class="c-hex" ' +
    'style="width:82px;padding:7px 8px;border:1.5px solid #e0e0e0;border-radius:7px;font-size:12px;" ' +
    'oninput="previewHex(this)">' +
    '<div class="c-preview-body" style="width:26px;height:26px;border-radius:50%;border:1.5px solid #ddd;background:' +
    previewBg +
    ';flex-shrink:0;"></div>' +
    "</div>" +
    '<button type="button" onclick="document.getElementById(\'' +
    blockId +
    "').remove()\" " +
    'style="background:#ffebee;color:#c62828;border:none;padding:7px 12px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;">Remover</button>' +
    "</div>" +
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
    '<label style="display:flex;align-items:center;gap:5px;font-size:12px;color:#555;cursor:pointer;white-space:nowrap;">' +
    '<input type="checkbox" class="c-same-price" ' +
    (hasPrice ? "" : "checked") +
    " onchange=\"toggleColorPrice(this,'" +
    priceId +
    "')\"> Mesmo preço do produto" +
    "</label>" +
    '<input type="number" id="' +
    priceId +
    '" min="0" step="0.01" placeholder="Preço desta cor (R$)" value="' +
    (hasPrice ? priceNum.toFixed(2) : "") +
    '" class="c-price" ' +
    'style="width:160px;padding:6px 10px;border:1.5px solid #e0e0e0;border-radius:7px;font-size:12px;' +
    (hasPrice ? "" : "display:none;") +
    '">' +
    "</div>" +
    '<div style="margin-bottom:10px;">' +
    '<label style="font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.4px;">URLs das imagens (separadas por vírgula)</label>' +
    '<input type="text" placeholder="https://img1.jpg, https://img2.jpg" value="' +
    imgs +
    '" class="c-images" ' +
    'style="width:100%;margin-top:5px;padding:7px 10px;border:1.5px solid #e0e0e0;border-radius:7px;font-size:12px;box-sizing:border-box;">' +
    "</div>" +
    "<div>" +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
    '<label style="font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.4px;">Tamanhos e estoques</label>' +
    '<button type="button" class="add-size-btn" style="font-size:11px;padding:4px 10px;background:#1a1a2e;color:white;border:none;border-radius:5px;cursor:pointer;">+ Tamanho</button>' +
    "</div>" +
    '<div class="sizes-list">' +
    sizeRowsHtml +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function appendColorBlock(container, c, expanded) {
  const div = document.createElement("div");
  div.innerHTML = makeColorBlock(c, expanded);
  const block = div.firstElementChild;
  container.appendChild(block);
  block.querySelector(".add-size-btn").addEventListener("click", function () {
    this.closest(".color-block")
      .querySelector(".sizes-list")
      .insertAdjacentHTML("beforeend", makeSizeRow());
  });
  const hexInput = block.querySelector(".c-hex");
  const prevHead = block.querySelector(".c-preview");
  const prevBody = block.querySelector(".c-preview-body");
  hexInput.addEventListener("input", function () {
    const v = this.value.trim() || "#e0e0e0";
    prevHead.style.background = v;
    if (prevBody) prevBody.style.background = v;
  });
  return block;
}

let colorDragSrc = null;
const colorsContainer = document.getElementById("colorsContainer");

colorsContainer.addEventListener("mousedown", function (e) {
  const handle = e.target.closest(".color-drag-handle");
  if (!handle) return;
  const block = handle.closest(".color-block");
  if (block) block.draggable = true;
});

document.addEventListener("mouseup", function () {
  colorsContainer
    .querySelectorAll('.color-block[draggable="true"]')
    .forEach(function (b) {
      b.draggable = false;
    });
});

colorsContainer.addEventListener("dragstart", function (e) {
  const block = e.target.closest(".color-block");
  if (!block) return;
  colorDragSrc = block;
  block.style.opacity = "0.4";
  e.dataTransfer.effectAllowed = "move";
});

colorsContainer.addEventListener("dragend", function () {
  if (colorDragSrc) {
    colorDragSrc.style.opacity = "";
    colorDragSrc.draggable = false;
  }
  colorDragSrc = null;
  colorsContainer.querySelectorAll(".color-block").forEach(function (b) {
    b.style.outline = "";
  });
});

colorsContainer.addEventListener("dragover", function (e) {
  e.preventDefault();
  const block = e.target.closest(".color-block");
  if (!block || !colorDragSrc || block === colorDragSrc) return;
  colorsContainer.querySelectorAll(".color-block").forEach(function (b) {
    b.style.outline = "";
  });
  block.style.outline = "2px dashed #1a1a2e";
});

colorsContainer.addEventListener("dragleave", function (e) {
  const block = e.target.closest(".color-block");
  if (block) block.style.outline = "";
});

colorsContainer.addEventListener("drop", function (e) {
  e.preventDefault();
  const block = e.target.closest(".color-block");
  if (!block) return;
  block.style.outline = "";
  if (!colorDragSrc || colorDragSrc === block) return;
  const blocks = Array.from(colorsContainer.querySelectorAll(".color-block"));
  const srcIdx = blocks.indexOf(colorDragSrc);
  const tgtIdx = blocks.indexOf(block);
  if (srcIdx < tgtIdx)
    colorsContainer.insertBefore(colorDragSrc, block.nextSibling);
  else colorsContainer.insertBefore(colorDragSrc, block);
  colorDragSrc.style.opacity = "";
  colorDragSrc.draggable = false;
  colorDragSrc = null;
});

document.getElementById("addColorRow").addEventListener("click", function () {
  const container = document.getElementById("colorsContainer");
  appendColorBlock(container, {}, true);
});

async function loadVariationsAdmin(productId) {
  try {
    const [varRes, colRes] = await Promise.all([
      adminFetch("/api/variations/" + productId),
      adminFetch("/api/colors/" + productId),
    ]);
    const varData = await varRes.json();
    const colData = await colRes.json();
    if (!varData.success || !varData.data.length) return;

    const colorMeta = {};
    const colorOrder = [];
    if (colData.success) {
      colData.data.forEach(function (c) {
        colorMeta[c.name] = {
          hex: c.hex || "",
          images: Array.isArray(c.images) ? c.images : [],
        };
        colorOrder.push(c.name);
      });
    }

    const byColor = {};
    varData.data.forEach(function (v) {
      const key = v.color || "__sem_cor__";
      if (!byColor[key]) {
        const meta = colorMeta[v.color] || {};
        byColor[key] = {
          name: v.color || "",
          hex: meta.hex || "",
          images:
            meta.images && meta.images.length ? meta.images : v.images || [],
          sizes: [],
        };
      }
      if (!byColor[key].price) byColor[key].price = v.price_adjustment || 0;
      byColor[key].sizes.push({ size: v.size || "", stock: v.stock || 0 });
    });

    const ordered = colorOrder
      .map(function (n) {
        return byColor[n];
      })
      .filter(Boolean);
    const rest = Object.keys(byColor)
      .filter(function (k) {
        return !colorOrder.includes(k);
      })
      .map(function (k) {
        return byColor[k];
      });

    const container = document.getElementById("colorsContainer");
    container.innerHTML = "";
    ordered.concat(rest).forEach(function (c) {
      appendColorBlock(container, c, false);
    });
  } catch (e) {
    console.error(e);
  }
}

async function saveVariations(productId) {
  const blocks = document.querySelectorAll("#colorsContainer .color-block");
  const variations = [];
  const colors = [];
  const seenColors = {};
  let orderIndex = 0;

  blocks.forEach(function (block) {
    const colorName = block.querySelector(".c-name").value.trim();
    const hex = block.querySelector(".c-hex").value.trim() || null;
    const imgsRaw = block.querySelector(".c-images").value.trim();
    const images = imgsRaw
      ? imgsRaw
          .split(",")
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean)
      : [];
    const samePriceChk = block.querySelector(".c-same-price");
    const colorPrice =
      samePriceChk && samePriceChk.checked
        ? 0
        : parseFloat((block.querySelector(".c-price") || {}).value) || 0;
    const sizeRows = block.querySelectorAll(".size-row");

    if (colorName && !seenColors[colorName]) {
      seenColors[colorName] = true;
      var totalStock = 0;
      sizeRows.forEach(function (r) {
        totalStock += parseInt(r.querySelector(".s-stock").value) || 0;
      });
      colors.push({
        name: colorName,
        hex: hex,
        images: images,
        stock: totalStock,
        sort_order: orderIndex++,
      });
    }

    if (sizeRows.length === 0) {
      variations.push({
        color: colorName || null,
        size: null,
        stock: 0,
        price_adjustment: colorPrice,
        images: images,
        hex: hex,
      });
    } else {
      sizeRows.forEach(function (row) {
        const sizeVal = row.querySelector(".s-size").value.trim();
        const stockVal = parseInt(row.querySelector(".s-stock").value) || 0;
        variations.push({
          color: colorName || null,
          size: sizeVal || null,
          stock: stockVal,
          price_adjustment: colorPrice,
          images: images,
          hex: hex,
        });
      });
    }
  });

  if (!variations.length) return;

  await adminFetch("/api/variations/" + productId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variations: variations }),
  });

  if (colors.length) {
    await adminFetch("/api/colors/" + productId, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colors: colors }),
    });
  }
}

async function loadAllVariationTags(products) {
  const lim = parseInt(localStorage.getItem("lowStockLimit") || "5");
  const chunks = [];
  for (let i = 0; i < products.length; i += 10)
    chunks.push(products.slice(i, i + 10));

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async function (p) {
        const el = document.getElementById("var-tags-" + p.id);
        if (!el) return;
        try {
          const res = await adminFetch("/api/variations/" + p.id);
          const data = await res.json();

          if (!data.success || !data.data || !data.data.length) {
            const st = parseInt(el.dataset.stock) || 0;
            const color =
              st === 0 ? "#c62828" : st <= lim ? "#e65100" : "#2e7d32";
            const bg = st === 0 ? "#ffebee" : st <= lim ? "#fff3e0" : "#e8f5e9";
            const border =
              st === 0 ? "#ffcdd2" : st <= lim ? "#ffe0b2" : "#c8e6c9";
            el.style.justifyContent = "flex-start";
            el.innerHTML =
              '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:' +
              bg +
              ";color:" +
              color +
              ";border:1px solid " +
              border +
              ';width:fit-content;">' +
              '<span style="width:8px;height:8px;border-radius:50%;background:' +
              color +
              ';display:inline-block;flex-shrink:0;"></span>' +
              st +
              " un." +
              "</span>";
            return;
          }

          const byColor = {};
          const colorOrder = [];
          data.data.forEach(function (v) {
            const key = v.color || "__sem_cor__";
            if (!byColor[key]) {
              byColor[key] = [];
              colorOrder.push(key);
            }
            byColor[key].push(v);
          });

          const MAX_COLORS = 3;
          function buildColorRow(colorKey) {
            const vars = byColor[colorKey];
            const colorLbl = colorKey === "__sem_cor__" ? "Padrão" : colorKey;
            const minStock = Math.min.apply(
              null,
              vars.map(function (v) {
                return parseInt(v.stock) || 0;
              }),
            );
            const dotColor =
              minStock === 0
                ? "#c62828"
                : minStock <= lim
                  ? "#e65100"
                  : "#2e7d32";
            const chips = vars
              .map(function (v) {
                const qty = parseInt(v.stock) || 0;
                const cls = qty === 0 ? "zero" : qty <= lim ? "low" : "ok";
                const lbl = v.size ? v.size + " (" + qty + ")" : qty;
                return '<span class="var-chip ' + cls + '">' + lbl + "</span>";
              })
              .join("");
            return (
              '<div class="var-color-row">' +
              '<span style="width:7px;height:7px;border-radius:50%;background:' +
              dotColor +
              ';display:inline-block;flex-shrink:0;"></span>' +
              '<span class="var-color-name" title="' +
              colorLbl +
              '">' +
              colorLbl +
              "</span>" +
              '<div class="var-size-chips">' +
              chips +
              "</div>" +
              "</div>"
            );
          }

          const visible = colorOrder.slice(0, MAX_COLORS);
          const hidden = colorOrder.slice(MAX_COLORS);
          const hiddenId = "var-hidden-" + p.id;

          let html = visible.map(buildColorRow).join("");

          if (hidden.length > 0) {
            html +=
              '<div id="' +
              hiddenId +
              '" style="display:none;">' +
              hidden.map(buildColorRow).join("") +
              "</div>";
            html +=
              '<button class="var-show-more" onclick="' +
              "var h=document.getElementById('" +
              hiddenId +
              "');" +
              "if(h.style.display==='none'){h.style.display='block';this.textContent='▲ Ver menos';}" +
              "else{h.style.display='none';this.textContent='▼ +" +
              hidden.length +
              " cor" +
              (hidden.length > 1 ? "es" : "") +
              "';}" +
              '">▼ +' +
              hidden.length +
              " cor" +
              (hidden.length > 1 ? "es" : "") +
              "</button>";
          }

          el.innerHTML = html;
        } catch (e) {
          if (el)
            el.innerHTML = '<span style="font-size:11px;color:#ccc;">—</span>';
        }
      }),
    );
  }
}

loadCategories();
loadProducts();

function showAdminToast(message, type = "error") {
  const existing = document.getElementById("admin-toast");
  if (existing) existing.remove();
  const colors = {
    error: "background:#e74c3c;",
    success: "background:#27ae60;",
    info: "background:#1a1a2e;",
  };
  const t = document.createElement("div");
  t.id = "admin-toast";
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);${colors[type] || colors.error}color:#fff;padding:12px 24px;border-radius:10px;font-family:'Poppins',sans-serif;font-size:13px;font-weight:500;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.3);animation:fadeInUp 0.3s ease;pointer-events:none;`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
