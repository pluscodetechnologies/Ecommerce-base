(function () {
  if (localStorage.getItem("adminTheme") === "dark") {
    document.documentElement.classList.add("dark");
  }
})();

const user = JSON.parse(localStorage.getItem("user") || "{}");

document.getElementById("adminName").textContent = user.name || "Administrador";

const date = new Date();
document.getElementById("currentDate").textContent = date.toLocaleDateString(
  "pt-BR",
  {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  },
);

document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  adminLogout();
});

async function loadDashboard() {
  try {
    const response = await adminFetch("/api/admin/dashboard/stats");

    const result = await response.json();

    if (result.success) {
      const data = result.data;

      document.getElementById("totalOrders").textContent = data.totalOrders;
      document.getElementById("totalRevenue").textContent =
        `R$ ${parseFloat(data.totalRevenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      document.getElementById("totalProducts").textContent = data.totalProducts;
      document.getElementById("totalCustomers").textContent =
        data.totalCustomers;

      const topProductsDiv = document.getElementById("topProducts");
      topProductsDiv.innerHTML = data.topProducts
        .map(
          (p, i) => `
                        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
                            <span>${i + 1}. ${p.name}</span>
                            <span style="font-weight: 600;">${p.sold} vendidos</span>
                        </div>
                    `,
        )
        .join("");

      const lowStockDiv = document.getElementById("lowStock");
      if (data.lowStock.length > 0) {
        lowStockDiv.innerHTML = data.lowStock
          .map(
            (p) => `
                            <div style="padding: 12px; background: #fff3cd; border-radius: 8px; margin-bottom: 10px;">
                                <div style="font-weight: 600;">${p.name}</div>
                                <div style="color: #856404; font-size: 13px;">Estoque: ${p.stock} unidades</div>
                            </div>
                        `,
          )
          .join("");
      } else {
        lowStockDiv.innerHTML =
          '<p style="color: #666;">Nenhum produto com estoque baixo</p>';
      }

      const recentOrdersDiv = document.getElementById("recentOrders");
      recentOrdersDiv.innerHTML = data.recentOrders
        .map(
          (order) => `
                        <div class="order-item">
                            <div class="order-info">
                                <h4>Pedido #${order.order_number}</h4>
                                <p>${new Date(order.created_at).toLocaleDateString("pt-BR")} - R$ ${parseFloat(order.total_amount).toFixed(2)}</p>
                            </div>
                            <span class="order-status status-${order.status}">${order.status}</span>
                        </div>
                    `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
  }
}

loadDashboard();
