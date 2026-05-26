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

let _lastReportData = [];

async function loadReport() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  _lastReportData = [];
  document.getElementById("exportBtns").style.display = "none";

  try {
    const response = await adminFetch(
      `/api/admin/reports/sales?start_date=${start}&end_date=${end}`,
    );
    const result = await response.json();

    if (result.success) {
      const data = result.data;
      _lastReportData = data;

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

      document.getElementById("exportBtns").style.display = "flex";
    }
  } catch (error) {
    console.error("Erro ao carregar relatório:", error);
  }
}


window.exportCSV = function () {
  if (!_lastReportData.length) return;

  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  const header = ["Data", "Pedidos", "Faturamento (R$)", "Ticket Médio (R$)"];
  const rows = _lastReportData.map((d) => [
    new Date(d.date).toLocaleDateString("pt-BR"),
    d.orders,
    parseFloat(d.revenue).toFixed(2),
    (d.revenue / d.orders).toFixed(2),
  ]);

  const csv = [header, ...rows]
    .map((r) => r.join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio_${start}_${end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};


window.exportPDF = function () {
  if (!_lastReportData.length) return;

  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  const startFmt = new Date(start + "T00:00:00").toLocaleDateString("pt-BR");
  const endFmt = new Date(end + "T00:00:00").toLocaleDateString("pt-BR");

  const totalRevenue = _lastReportData.reduce((s, d) => s + parseFloat(d.revenue), 0);
  const totalOrders = _lastReportData.reduce((s, d) => s + parseInt(d.orders), 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const rows = _lastReportData.map((d) => `
    <tr>
      <td>${new Date(d.date).toLocaleDateString("pt-BR")}</td>
      <td style="text-align:center">${d.orders}</td>
      <td style="text-align:right">R$ ${parseFloat(d.revenue).toFixed(2)}</td>
      <td style="text-align:right">R$ ${(d.revenue / d.orders).toFixed(2)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Vendas</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #0f172a; background: white; padding: 0; }

  .header {
    background: #0f172a;
    color: white;
    padding: 32px 40px 28px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header-brand { font-size: 28px; font-weight: 800; letter-spacing: 5px; }
  .header-sub { font-size: 11px; letter-spacing: 2px; opacity: 0.5; text-transform: uppercase; margin-top: 4px; }
  .header-right { text-align: right; }
  .header-right h2 { font-size: 18px; font-weight: 700; }
  .header-right p { font-size: 12px; opacity: 0.6; margin-top: 4px; }

  .accent-bar { height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa); }

  .body { padding: 36px 40px; }

  .period-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid #c7d2fe;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 28px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 36px;
  }
  .summary-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
  }
  .summary-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
  }
  .summary-value { font-size: 26px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px; }
  .summary-label { font-size: 12px; color: #64748b; font-weight: 500; }

  .section-title {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 14px;
  }

  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #0f172a; }
  thead th {
    padding: 11px 16px;
    color: rgba(255,255,255,0.7);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    text-align: left;
  }
  thead th:not(:first-child) { text-align: right; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #f1f5ff; }
  td {
    padding: 12px 16px;
    font-size: 13.5px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }
  td:not(:first-child) { text-align: right; }
  tbody tr:last-child td { border-bottom: none; }

  tfoot tr { background: #eef2ff; }
  tfoot td {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 700;
    color: #4338ca;
    border-top: 2px solid #c7d2fe;
  }
  tfoot td:not(:first-child) { text-align: right; }

  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer p { font-size: 11px; color: #94a3b8; }
  .footer-brand { font-weight: 700; letter-spacing: 2px; color: #64748b; font-size: 12px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { background: #0f172a !important; }
    thead tr { background: #0f172a !important; }
    .accent-bar { background: #6366f1 !important; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-brand">VELVET</div>
      <div class="header-sub">administração</div>
    </div>
    <div class="header-right">
      <h2>Relatório de Vendas</h2>
      <p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    </div>
  </div>
  <div class="accent-bar"></div>

  <div class="body">
    <div class="period-badge">
      📅 Período: ${startFmt} até ${endFmt}
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-value">${totalOrders}</div>
        <div class="summary-label">Total de Pedidos</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
        <div class="summary-label">Faturamento Total</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">R$ ${avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
        <div class="summary-label">Ticket Médio</div>
      </div>
    </div>

    <div class="section-title">Detalhamento por dia</div>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Pedidos</th>
          <th>Faturamento</th>
          <th>Ticket Médio</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td>Total</td>
          <td style="text-align:center">${totalOrders}</td>
          <td>R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
          <td>R$ ${avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer">
      <p>Velvet Store Admin · Relatório confidencial</p>
      <div class="footer-brand">VELVET</div>
    </div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

document.getElementById("filterBtn").addEventListener("click", loadReport);
loadReport();
