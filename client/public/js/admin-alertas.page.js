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

const modal = document.getElementById("alertModal");
document
  .getElementById("newAlertBtn")
  .addEventListener("click", () => (modal.style.display = "flex"));
document
  .getElementById("closeModalBtn")
  .addEventListener("click", () => (modal.style.display = "none"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

document.getElementById("alertTitle").addEventListener("input", updatePreview);
document
  .getElementById("alertMessage")
  .addEventListener("input", updatePreview);

function updatePreview() {
  const title = document.getElementById("alertTitle").value.trim();
  const msg = document.getElementById("alertMessage").value.trim();
  document.getElementById("previewTitle").textContent = title;
  document.getElementById("previewSep").style.display = title
    ? "inline"
    : "none";
  document.getElementById("previewMsg").textContent =
    msg || "Sua mensagem aparece aqui";
}

async function loadAlerts() {
  try {
    const res = await adminFetch("/api/admin/alerts");
    const result = await res.json();
    const list = document.getElementById("alertsList");

    if (!result.success || !result.data.length) {
      list.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-bell-slash"></i>
                            <p>Nenhum alerta criado ainda.</p>
                        </div>`;
      return;
    }

    list.innerHTML = result.data
      .map(
        (a) => `
                    <div class="alert-card" data-id="${a.id}">
<div class="alert-preview">
                            ${a.title ? `<span class="alert-preview-title">${a.title}</span><span class="alert-preview-sep">—</span>` : ""}
                            <span class="alert-preview-msg">${a.message}</span>
                        </div>
                        <span class="alert-meta">${a.is_active ? "● Ativo" : "○ Inativo"}</span>
                        <div class="alert-actions">
                            <button class="btn-icon ${a.is_active ? "btn-toggle-on" : "btn-toggle-off"}"
                                onclick="toggleAlert(${a.id}, ${a.is_active})"
                                title="${a.is_active ? "Desativar" : "Ativar"}">
                                <i class="fas fa-${a.is_active ? "eye" : "eye-slash"}"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="deleteAlert(${a.id})" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `,
      )
      .join("");
  } catch (e) {
    console.error("Erro ao carregar alertas:", e);
  }
}

document.getElementById("saveAlertBtn").addEventListener("click", async () => {
  const title = document.getElementById("alertTitle").value.trim();
  const message = document.getElementById("alertMessage").value.trim();

  if (!message) {
    alert("A mensagem é obrigatória.");
    return;
  }

  try {
    await adminFetch("/api/admin/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message }),
    });
    modal.style.display = "none";
    document.getElementById("alertTitle").value = "";
    document.getElementById("alertMessage").value = "";
    updatePreview();
    loadAlerts();
  } catch (e) {
    console.error("Erro ao salvar alerta:", e);
  }
});

window.toggleAlert = async function (id, currentState) {
  try {
    await adminFetch(`/api/admin/alerts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentState }),
    });
    loadAlerts();
  } catch (e) {
    console.error("Erro ao atualizar alerta:", e);
  }
};

window.deleteAlert = async function (id) {
  if (!confirm("Excluir este alerta?")) return;
  try {
    await adminFetch(`/api/admin/alerts/${id}`, { method: "DELETE" });
    loadAlerts();
  } catch (e) {
    console.error("Erro ao excluir alerta:", e);
  }
};

loadAlerts();
