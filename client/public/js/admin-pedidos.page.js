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

const statusLabel = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

async function loadOrders(status = "") {
  try {
    const url =
      "/api/admin/orders?include_items=1" + (status ? `&status=${status}` : "");
    const response = await adminFetch(url);
    const result = await response.json();

    if (result.success) {
      window._lastOrders = result.data.orders || [];
      document.getElementById("ordersTableBody").innerHTML = result.data.orders
        .map((order) => {
          const customerName = order.customer_name || "Cliente";

          let productNames = '<span style="color:#bbb;">—</span>';
          if (order.items && order.items.length > 0) {
            const preview = order.items
              .slice(0, 2)
              .map(
                (i) =>
                  `${i.product_name}${i.quantity > 1 ? " x" + i.quantity : ""}`,
              )
              .join(", ");
            const extra =
              order.items.length > 2
                ? ` <span style="color:#aaa;">+${order.items.length - 2}</span>`
                : "";
            productNames = `<span class="products-link" onclick="openProductsModal(${order.id})" title="Clique para ver detalhes">${preview}${extra}</span>`;
          } else {
            try {
              const addr =
                typeof order.shipping_address === "string"
                  ? JSON.parse(order.shipping_address)
                  : order.shipping_address || {};
              if (addr.items_manual) productNames = addr.items_manual;
            } catch {}
          }

          return `
                            <tr>
                                <td>#${order.order_number}</td>
                                <td>${new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                                <td>${customerName}</td>
                                <td style="max-width:200px;">${productNames}</td>
                                <td>R$ ${parseFloat(order.total_amount).toFixed(2)}</td>
                                <td>${order.payment_method || "-"}</td>
                                <td>
                                    <span class="status-badge status-${order.status}" id="badge-${order.id}">${statusLabel[order.status] || order.status}</span>
                                    ${order.shipping_tracking ? `<div style="font-size:11px;color:#888;margin-top:4px;"><i class="fas fa-truck" style="margin-right:3px;"></i>${order.shipping_tracking}</div>` : ""}
                                </td>
                                <td>
                                    <select class="status-change"
                                        onchange="updateStatus(${order.id}, this.value, this, '${order.customer_email || ""}', '${order.order_number}')"
                                        style="padding:5px 10px;border-radius:5px;border:1px solid #ddd;">
                                        <option value="pending"    ${order.status === "pending"    ? "selected" : ""}>Pendente</option>
                                        <option value="paid"       ${order.status === "paid"       ? "selected" : ""}>Pago</option>
                                        <option value="processing" ${order.status === "processing" ? "selected" : ""}>Preparando</option>
                                        <option value="shipped"    ${order.status === "shipped"    ? "selected" : ""}>Enviado</option>
                                        <option value="delivered"  ${order.status === "delivered"  ? "selected" : ""}>Entregue</option>
                                        <option value="cancelled"  ${order.status === "cancelled"  ? "selected" : ""}>Cancelado</option>
                                    </select>
                                </td>
                            </tr>`;
        })
        .join("");
    }
  } catch (error) {
    console.error("Erro ao carregar pedidos:", error);
  }
}

window.updateStatus = function (
  orderId,
  status,
  selectEl,
  customerEmail,
  orderNumber,
) {
  if (status === "shipped") {
    openTrackingModal(orderId, status, selectEl, customerEmail, orderNumber);
    return;
  }
  doUpdateStatus(orderId, status, null, selectEl);
};

async function doUpdateStatus(orderId, status, trackingCode, selectEl) {
  try {
    const body = { status };
    if (trackingCode) body.tracking_code = trackingCode;

    const res = await adminFetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      const badge = document.getElementById(`badge-${orderId}`);
      if (badge) {
        badge.className = `status-badge status-${status}`;
        badge.textContent = statusLabel[status] || status;
        if (trackingCode) {
          badge.nextElementSibling?.remove();
          badge.insertAdjacentHTML(
            "afterend",
            `<div style="font-size:11px;color:#888;margin-top:4px;"><i class="fas fa-truck" style="margin-right:3px;"></i>${trackingCode}</div>`,
          );
        }
      }
      if (selectEl) {
        selectEl.style.borderColor = "#27ae60";
        setTimeout(() => {
          selectEl.style.borderColor = "";
        }, 1200);
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
  }
}

let _trackingData = {};

function openTrackingModal(
  orderId,
  status,
  selectEl,
  customerEmail,
  orderNumber,
) {
  _trackingData = { orderId, status, selectEl, customerEmail, orderNumber };
  document.getElementById("trackingOrderNum").textContent = "#" + orderNumber;
  document.getElementById("trackingCodeInput").value = "";
  document.getElementById("trackingMsg").style.display = "none";
  document.getElementById("trackingModal").classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("trackingCodeInput").focus(), 100);
}

function closeTrackingModal() {
  document.getElementById("trackingModal").classList.remove("open");
  document.body.style.overflow = "";
  if (_trackingData.selectEl) _trackingData.selectEl.value = "paid";
}

window.confirmTracking = async function () {
  const trackingCode = document
    .getElementById("trackingCodeInput")
    .value.trim()
    .toUpperCase();
  const { orderId, status, selectEl } = _trackingData;
  await doUpdateStatus(orderId, status, trackingCode || null, selectEl);
  document.getElementById("trackingModal").classList.remove("open");
  document.body.style.overflow = "";
};

document
  .getElementById("trackingModal")
  .addEventListener("click", function (e) {
    if (e.target === this) closeTrackingModal();
  });

window.openProductsModal = async function (orderId) {
  document.getElementById("productsModal").classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("productsModalBody").innerHTML =
    '<p style="color:#999;text-align:center;padding:20px;">Carregando...</p>';

  try {
    const res = await adminFetch(`/api/admin/orders/${orderId}`);
    const data = await res.json();
    if (data.success && data.data) {
      const order = data.data;
      const items = order.items || [];
      document.getElementById("productsModalTitle").textContent =
        `Pedido #${order.order_number}`;
      document.getElementById("productsModalBody").innerHTML = items.length
        ? `
                        <table style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr>
                                    <th style="text-align:left;padding:10px 12px;font-size:12px;color:#666;border-bottom:2px solid #eee;">Produto</th>
                                    <th style="text-align:center;padding:10px 12px;font-size:12px;color:#666;border-bottom:2px solid #eee;">Variações</th>
                                    <th style="text-align:center;padding:10px 12px;font-size:12px;color:#666;border-bottom:2px solid #eee;">Qtd</th>
                                    <th style="text-align:right;padding:10px 12px;font-size:12px;color:#666;border-bottom:2px solid #eee;">Unit.</th>
                                    <th style="text-align:right;padding:10px 12px;font-size:12px;color:#666;border-bottom:2px solid #eee;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items
                                  .map(
                                    (i) => `
                                    <tr>
                                        <td style="padding:12px;font-size:13px;font-weight:500;border-bottom:1px solid #f5f7fa;">${i.product_name}</td>
                                        <td style="padding:12px;text-align:center;border-bottom:1px solid #f5f7fa;">
                                            ${i.color ? `<span style="background:#f0ede8;padding:2px 8px;border-radius:4px;font-size:11px;margin:2px;display:inline-block;">${i.color}</span>` : ""}
                                            ${i.size ? `<span style="background:#f0ede8;padding:2px 8px;border-radius:4px;font-size:11px;margin:2px;display:inline-block;">${i.size}</span>` : ""}
                                            ${!i.color && !i.size ? '<span style="color:#bbb;font-size:12px;">—</span>' : ""}
                                        </td>
                                        <td style="padding:12px;text-align:center;font-size:13px;border-bottom:1px solid #f5f7fa;">${i.quantity}</td>
                                        <td style="padding:12px;text-align:right;font-size:13px;border-bottom:1px solid #f5f7fa;">R$ ${parseFloat(i.unit_price).toFixed(2)}</td>
                                        <td style="padding:12px;text-align:right;font-size:13px;font-weight:600;border-bottom:1px solid #f5f7fa;">R$ ${parseFloat(i.total_price).toFixed(2)}</td>
                                    </tr>`,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    `
        : '<p style="color:#999;text-align:center;padding:20px;">Nenhum item encontrado.</p>';
    }
  } catch {
    document.getElementById("productsModalBody").innerHTML =
      '<p style="color:#e74c3c;text-align:center;padding:20px;">Erro ao carregar itens.</p>';
  }
};

window.closeProductsModal = function () {
  document.getElementById("productsModal").classList.remove("open");
  document.body.style.overflow = "";
};

document
  .getElementById("productsModal")
  .addEventListener("click", function (e) {
    if (e.target === this) closeProductsModal();
  });

async function exportOrders() {
  const status = document.getElementById("statusFilter").value;
  const url =
    "/api/admin/orders?export=csv" + (status ? "&status=" + status : "");
  try {
    const res = await adminFetch(url);
    if (!res.ok) {
      alert("Erro ao exportar pedidos.");
      return;
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pedidos_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    alert("Erro ao exportar: " + e.message);
  }
}
window.exportOrders = exportOrders;

window.exportOrdersPDF = async function () {
  const orders = window._lastOrders || [];
  if (!orders.length) { alert("Nenhum pedido para exportar."); return; }

  const statusLabel = { pending:"Pendente", paid:"Pago", processing:"Preparando", shipped:"Enviado", delivered:"Entregue", cancelled:"Cancelado" };
  const statusColor = { pending:"#92400e", paid:"#065f46", processing:"#6b21a8", shipped:"#1e40af", delivered:"#065f46", cancelled:"#991b1b" };
  const statusBg = { pending:"#fffbeb", paid:"#ecfdf5", processing:"#f3e8ff", shipped:"#eff6ff", delivered:"#ecfdf5", cancelled:"#fef2f2" };

  const rows = orders.map(o => {
    const s = o.status || "pending";
    const label = statusLabel[s] || s;
    const bg = statusBg[s] || "#f1f5f9";
    const color = statusColor[s] || "#334155";
    const items = o.items ? o.items.slice(0,2).map(i => i.product_name + (i.quantity > 1 ? " x"+i.quantity:"")).join(", ") + (o.items.length > 2 ? ` +${o.items.length-2}`:""): "—";
    return `<tr>
      <td style="font-weight:600;color:#6366f1">#${o.order_number || o.id}</td>
      <td>${new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
      <td>${o.customer_name || "—"}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${items}</td>
      <td style="text-align:right;font-weight:600">R$ ${parseFloat(o.total_amount || o.total || 0).toFixed(2)}</td>
      <td style="text-align:center"><span style="background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600">${label}</span></td>
    </tr>`;
  }).join("");

  const total = orders.reduce((s,o) => s + parseFloat(o.total_amount || o.total || 0), 0);
  const statusFilter = document.getElementById("statusFilter").value;
  const filterLabel = statusFilter ? (statusLabel[statusFilter] || statusFilter) : "Todos";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Pedidos - Velvet Store</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#0f172a; background:white; }

  .header { background:#0f172a; color:white; padding:28px 36px; display:flex; justify-content:space-between; align-items:flex-end; }
  .brand { font-size:26px; font-weight:800; letter-spacing:5px; }
  .brand-sub { font-size:10px; letter-spacing:2px; opacity:0.45; text-transform:uppercase; margin-top:4px; }
  .header-right { text-align:right; }
  .header-right h2 { font-size:17px; font-weight:700; }
  .header-right p { font-size:11px; opacity:0.55; margin-top:3px; }
  .accent-bar { height:4px; background:linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa); }

  .body { padding:30px 36px; }

  .meta-row { display:flex; align-items:center; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
  .badge { display:inline-flex; align-items:center; gap:5px; padding:5px 13px; border-radius:20px; font-size:11.5px; font-weight:600; }
  .badge-purple { background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; }
  .badge-gray { background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }

  .summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:28px; }
  .sc { background:#f8fafc; border:1px solid #e2e8f0; border-radius:11px; padding:16px 18px; position:relative; overflow:hidden; }
  .sc::before { content:''; position:absolute; top:0;left:0;right:0; height:3px; background:linear-gradient(90deg,#6366f1,#8b5cf6); }
  .sv { font-size:22px; font-weight:700; letter-spacing:-0.3px; color:#0f172a; margin-bottom:3px; }
  .sl { font-size:11.5px; color:#64748b; font-weight:500; }

  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0f172a; }
  th { padding:10px 14px; color:rgba(255,255,255,0.65); font-size:10.5px; font-weight:600; text-transform:uppercase; letter-spacing:0.7px; text-align:left; }
  th:nth-child(5) { text-align:right; }
  th:nth-child(6) { text-align:center; }
  tbody tr:nth-child(even) { background:#f8fafc; }
  td { padding:11px 14px; font-size:13px; border-bottom:1px solid #f1f5f9; color:#334155; vertical-align:middle; }
  tbody tr:last-child td { border-bottom:none; }

  tfoot td { padding:11px 14px; font-size:13px; font-weight:700; color:#4338ca; background:#eef2ff; border-top:2px solid #c7d2fe; }
  tfoot td:nth-child(5) { text-align:right; }

  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
  .footer p { font-size:10.5px; color:#94a3b8; }
  .footer-brand { font-weight:700; letter-spacing:2px; color:#64748b; font-size:11px; }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .header { background:#0f172a !important; }
    thead tr { background:#0f172a !important; }
  }
</style>
</head>
<body>
  <div class="header">
    <div><div class="brand">VELVET</div><div class="brand-sub">administração</div></div>
    <div class="header-right"><h2>Relatório de Pedidos</h2><p>Gerado em ${new Date().toLocaleString("pt-BR")}</p></div>
  </div>
  <div class="accent-bar"></div>
  <div class="body">
    <div class="meta-row">
      <span class="badge badge-purple">📦 ${orders.length} pedido${orders.length !== 1 ? "s" : ""}</span>
      <span class="badge badge-gray">Filtro: ${filterLabel}</span>
    </div>
    <div class="summary-grid">
      <div class="sc"><div class="sv">${orders.length}</div><div class="sl">Total de Pedidos</div></div>
      <div class="sc"><div class="sv">R$ ${total.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div><div class="sl">Faturamento Total</div></div>
      <div class="sc"><div class="sv">R$ ${orders.length ? (total/orders.length).toLocaleString("pt-BR",{minimumFractionDigits:2}) : "0,00"}</div><div class="sl">Ticket Médio</div></div>
    </div>
    <table>
      <thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Produtos</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="4">Total</td><td>R$ ${total.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td><td></td></tr></tfoot>
    </table>
    <div class="footer">
      <p>Velvet Store Admin · Relatório confidencial</p>
      <div class="footer-brand">VELVET</div>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};



document
  .getElementById("statusFilter")
  .addEventListener("change", (e) => loadOrders(e.target.value));
loadOrders();

function openManualOrderModal() {
  document.getElementById("manualOrderModal").classList.add("open");
  document.body.style.overflow = "hidden";
  ["mo_order_number", "mo_customer_name", "mo_total"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("mo_shipping").value = "0";
  document.getElementById("mo_status").value = "paid";
  document.getElementById("mo_payment").value = "manual";
  document.getElementById("mo_items").innerHTML = "";
  document.getElementById("manualOrderMsg").style.display = "none";
  document.getElementById("manualOrderErr").style.display = "none";
  itemRowCount = 0;
  addItemRow();
}

function closeManualOrderModal() {
  document.getElementById("manualOrderModal").classList.remove("open");
  document.body.style.overflow = "";
}

document
  .getElementById("manualOrderModal")
  .addEventListener("click", function (e) {
    if (e.target === this) closeManualOrderModal();
  });

let itemRowCount = 0;
function addItemRow() {
  itemRowCount++;
  const id = itemRowCount;
  const div = document.createElement("div");
  div.id = "item_row_" + id;
  div.className = "mo-item-row";
  div.innerHTML = `
                <input type="text"   id="item_code_${id}"  placeholder="Código (opcional)" onblur="moFetchProduct(this,${id})">
                <input type="text"   id="item_name_${id}"  placeholder="Nome do produto *">
                <input type="number" id="item_qty_${id}"   value="1" min="1" placeholder="Qtd" oninput="moRecalcTotal()">
                <input type="number" id="item_price_${id}" step="0.01" min="0" placeholder="Preço" oninput="moRecalcTotal()">
                <button class="mo-item-remove" onclick="document.getElementById('item_row_${id}').remove();moRecalcTotal();">&times;</button>`;
  document.getElementById("mo_items").appendChild(div);
}

async function moFetchProduct(input, rowId) {
  const code = input.value.trim();
  if (!code) return;
  try {
    const res = await adminFetch(
      `/api/products?search=${encodeURIComponent(code)}`,
    );
    const data = await res.json();
    if (data.success && data.data && data.data.length > 0) {
      const p = data.data[0];
      const nameEl = document.getElementById("item_name_" + rowId);
      const priceEl = document.getElementById("item_price_" + rowId);
      if (nameEl && !nameEl.value) nameEl.value = p.name;
      if (priceEl && !priceEl.value)
        priceEl.value = p.promotional_price || p.price;
      input.dataset.productId = p.id;
      input.style.borderColor = "#27ae60";
      moRecalcTotal();
    }
  } catch {}
}

function moRecalcTotal() {
  let total = 0;
  document.querySelectorAll('[id^="item_qty_"]').forEach((el) => {
    const id = el.id.replace("item_qty_", "");
    total +=
      (parseFloat(document.getElementById("item_qty_" + id)?.value) || 0) *
      (parseFloat(document.getElementById("item_price_" + id)?.value) || 0);
  });
  total += parseFloat(document.getElementById("mo_shipping").value) || 0;
  document.getElementById("mo_total").value = total.toFixed(2);
}

document.getElementById("mo_shipping").addEventListener("input", moRecalcTotal);

async function submitManualOrder() {
  const btnEl = document.getElementById("mo_submit_btn");
  document.getElementById("manualOrderMsg").style.display = "none";
  document.getElementById("manualOrderErr").style.display = "none";

  const customerName = document.getElementById("mo_customer_name").value.trim();
  const total = document.getElementById("mo_total").value;
  if (!customerName) {
    showMoMsg("Nome do cliente é obrigatório.", "error");
    return;
  }
  if (!total || parseFloat(total) <= 0) {
    showMoMsg("Informe o valor total do pedido.", "error");
    return;
  }

  const items = [];
  document.querySelectorAll('[id^="item_name_"]').forEach((nameEl) => {
    const id = nameEl.id.replace("item_name_", "");
    const codeEl = document.getElementById("item_code_" + id);
    if (nameEl.value.trim())
      items.push({
        product_id: codeEl?.dataset?.productId || null,
        product_name: nameEl.value.trim(),
        quantity:
          parseInt(document.getElementById("item_qty_" + id)?.value) || 1,
        unit_price:
          parseFloat(document.getElementById("item_price_" + id)?.value) || 0,
      });
  });

  const payload = {
    order_number: document.getElementById("mo_order_number").value.trim(),
    customer_name: customerName,
    total_amount: parseFloat(total),
    shipping_amount:
      parseFloat(document.getElementById("mo_shipping").value) || 0,
    payment_method: document.getElementById("mo_payment").value,
    status: document.getElementById("mo_status").value,
    items,
  };

  btnEl.disabled = true;
  btnEl.textContent = "Salvando...";
  try {
    const res = await adminFetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showMoMsg(
        `✅ Pedido ${data.data.order_number} criado com sucesso!`,
        "success",
      );
      setTimeout(() => {
        closeManualOrderModal();
        loadOrders();
      }, 1500);
    } else {
      showMoMsg(data.message || "Erro ao criar pedido.", "error");
    }
  } catch {
    showMoMsg("Erro de conexão. Tente novamente.", "error");
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = "Criar Pedido";
  }
}

function showMoMsg(msg, type) {
  const el = document.getElementById(
    type === "success" ? "manualOrderMsg" : "manualOrderErr",
  );
  el.textContent = msg;
  el.style.display = "block";
}