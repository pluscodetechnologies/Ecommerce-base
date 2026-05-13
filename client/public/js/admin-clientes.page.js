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

async function loadCustomers(search = "") {
  try {
    const url = search
      ? `/api/admin/customers?search=${search}`
      : "/api/admin/customers";
    const response = await adminFetch(url);
    const result = await response.json();
    if (result.success) {
      const tbody = document.getElementById("customersTableBody");
      tbody.innerHTML = result.data.customers
        .map(
          (c) => `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="customer-avatar">${c.name.charAt(0).toUpperCase()}</div>
                                    <span>${c.name}</span>
                                </div>
                            </td>
                            <td>${c.email}</td>
                            <td>${c.phone || "-"}</td>
                            <td>${c.cpf || "-"}</td>
                            <td>${new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                        </tr>
                    `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
  }
}

document
  .getElementById("searchInput")
  .addEventListener("input", (e) => loadCustomers(e.target.value));
loadCustomers();
