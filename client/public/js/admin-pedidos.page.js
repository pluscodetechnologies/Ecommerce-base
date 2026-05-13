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
                                        <option value="pending"   ${order.status === "pending" ? "selected" : ""}>Pendente</option>
                                        <option value="paid"      ${order.status === "paid" ? "selected" : ""}>Pago</option>
                                        <option value="shipped"   ${order.status === "shipped" ? "selected" : ""}>Enviado</option>
                                        <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Entregue</option>
                                        <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Cancelado</option>
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
