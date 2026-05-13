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

const today = new Date().toISOString().split("T")[0];
const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];
document.getElementById("startDate").value = lastMonth;
document.getElementById("endDate").value = today;

async function loadReport() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  try {
    const response = await adminFetch(
      `/api/admin/reports/sales?start_date=${start}&end_date=${end}`,
    );
    const result = await response.json();

    if (result.success) {
      const data = result.data;

      if (!data.length) {
        document.getElementById("summary").innerHTML = `
                            <div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">
                                <i class="fas fa-chart-bar" style="font-size:36px;margin-bottom:12px;display:block;opacity:0.3;"></i>
                                Nenhuma venda encontrada no período selecionado.
                            </div>`;
        document.getElementById("reportTableBody").innerHTML = "";
        return;
      }
      const totalRevenue = data.reduce(
        (sum, d) => sum + parseFloat(d.revenue),
        0,
      );
      const totalOrders = data.reduce((sum, d) => sum + parseInt(d.orders), 0);
      const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      document.getElementById("summary").innerHTML = `
                        <div class="summary-card"><div class="summary-value">${totalOrders}</div><div class="summary-label">Total de Pedidos</div></div>
                        <div class="summary-card"><div class="summary-value">R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div><div class="summary-label">Faturamento Total</div></div>
                        <div class="summary-card"><div class="summary-value">R$ ${avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div><div class="summary-label">Ticket Médio</div></div>
                    `;

      const tbody = document.getElementById("reportTableBody");
      tbody.innerHTML = data
        .map(
          (d) => `
                        <tr>
                            <td>${new Date(d.date).toLocaleDateString("pt-BR")}</td>
                            <td>${d.orders}</td>
                            <td>R$ ${parseFloat(d.revenue).toFixed(2)}</td>
                            <td>R$ ${(d.revenue / d.orders).toFixed(2)}</td>
                        </tr>
                    `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Erro ao carregar relatório:", error);
  }
}

document.getElementById("filterBtn").addEventListener("click", loadReport);
loadReport();
