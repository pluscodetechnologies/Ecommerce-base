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

const modal = document.getElementById("categoryModal");
document.getElementById("newCategoryBtn").addEventListener("click", () => {
  document.getElementById("modalTitle").textContent = "Nova Categoria";
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryForm").reset();
  document.getElementById("categoryStatus").value = "active";
  modal.style.display = "flex";
});
document
  .getElementById("closeModalBtn")
  .addEventListener("click", () => (modal.style.display = "none"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

async function loadCategories() {
  try {
    const response = await adminFetch("/api/admin/categories");
    const result = await response.json();
    if (result.success) {
      const grid = document.getElementById("categoriesGrid");
      grid.innerHTML = result.data
        .map(
          (cat) => `
                        <div class="category-card" data-id="${cat.id}">
                            <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
                                <span class="cat-drag-handle" title="Arrastar para reordenar">⠿</span>
                            </div>
                            <img src="${cat.image_url || "https://via.placeholder.com/300x150?text=" + encodeURIComponent(cat.name)}" class="category-image" alt="${cat.name}">
                            <div class="category-header">
                                <span class="category-name">${cat.name}</span>
                                <span class="status-badge status-${cat.status}">${cat.status === "active" ? "Ativo" : "Inativo"}</span>
                            </div>
                            <div class="category-info">${cat.description || "Sem descrição"}</div>
                            <div class="category-actions">
                                <button class="action-btn edit-btn" onclick="editCategory(${cat.id})"><i class="fas fa-edit"></i> Editar</button>
                                <button class="action-btn delete-btn" onclick="deleteCategory(${cat.id})"><i class="fas fa-trash"></i> Excluir</button>
                            </div>
                        </div>
                    `,
        )
        .join("");
      initCategoryDrag();
    }
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
  }
}

window.editCategory = async function (id) {
  try {
    const response = await adminFetch("/api/admin/categories");
    const result = await response.json();
    const category = result.data.find((c) => c.id === id);
    if (category) {
      document.getElementById("modalTitle").textContent = "Editar Categoria";
      document.getElementById("categoryId").value = category.id;
      document.getElementById("categoryName").value = category.name;
      document.getElementById("categoryDescription").value =
        category.description || "";
      document.getElementById("categoryImage").value = category.image_url || "";
      document.getElementById("categoryStatus").value = category.status;
      modal.style.display = "flex";
    }
  } catch (error) {
    console.error("Erro ao editar categoria:", error);
  }
};

window.deleteCategory = async function (id) {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    try {
      await adminFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      loadCategories();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
    }
  }
};

document
  .getElementById("categoryForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("categoryId").value;
    const data = {
      name: document.getElementById("categoryName").value,
      description: document.getElementById("categoryDescription").value,
      image_url: document.getElementById("categoryImage").value,
      status: document.getElementById("categoryStatus").value,
    };
    try {
      const url = id ? `/api/admin/categories/${id}` : "/api/admin/categories";
      const method = id ? "PUT" : "POST";
      await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      modal.style.display = "none";
      loadCategories();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    }
  });

loadCategories();

let catDragSrc = null;
const catGrid = document.getElementById("categoriesGrid");

function initCategoryDrag() {
  catGrid.addEventListener("mousedown", function (e) {
    const handle = e.target.closest(".cat-drag-handle");
    if (!handle) return;
    const card = handle.closest(".category-card");
    if (card) card.draggable = true;
  });
  document.addEventListener("mouseup", function () {
    catGrid
      .querySelectorAll('.category-card[draggable="true"]')
      .forEach(function (c) {
        c.draggable = false;
      });
  });
}

catGrid.addEventListener("dragstart", function (e) {
  const card = e.target.closest(".category-card");
  if (!card) return;
  catDragSrc = card;
  card.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
});
catGrid.addEventListener("dragend", function () {
  catGrid.querySelectorAll(".category-card").forEach(function (c) {
    c.classList.remove("dragging", "drag-over");
    c.draggable = false;
  });
  catDragSrc = null;
});
catGrid.addEventListener("dragover", function (e) {
  e.preventDefault();
  const card = e.target.closest(".category-card");
  if (!card || !catDragSrc || card === catDragSrc) return;
  catGrid.querySelectorAll(".category-card").forEach(function (c) {
    c.classList.remove("drag-over");
  });
  card.classList.add("drag-over");
});
catGrid.addEventListener("dragleave", function (e) {
  const card = e.target.closest(".category-card");
  if (card) card.classList.remove("drag-over");
});
catGrid.addEventListener("drop", function (e) {
  e.preventDefault();
  const card = e.target.closest(".category-card");
  if (!card || !catDragSrc || card === catDragSrc) return;
  card.classList.remove("drag-over");
  const cards = Array.from(catGrid.querySelectorAll(".category-card"));
  const si = cards.indexOf(catDragSrc),
    ti = cards.indexOf(card);
  if (si < ti) catGrid.insertBefore(catDragSrc, card.nextSibling);
  else catGrid.insertBefore(catDragSrc, card);
  saveCategoryOrder();
});

async function saveCategoryOrder() {
  const cards = Array.from(catGrid.querySelectorAll(".category-card"));
  const items = cards.map(function (c, i) {
    return { id: parseInt(c.dataset.id), sort_order: i };
  });
  await adminFetch("/api/admin/categories/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: items }),
  });
}
