const params = new URLSearchParams(window.location.search);
if (params.get("order")) {
  document.getElementById("orderInput").value = params
    .get("order")
    .toUpperCase();
  if (params.get("email")) {
    document.getElementById("emailInput").value = params.get("email");
    window.addEventListener("load", buscarPedido);
  }
}

const statusMap = {
  pending: { label: "Aguardando", icon: "fas fa-clock" },
  paid: { label: "Pago", icon: "fas fa-check-circle" },
  shipped: { label: "Enviado", icon: "fas fa-truck" },
  delivered: { label: "Entregue", icon: "fas fa-box-open" },
  cancelled: { label: "Cancelado", icon: "fas fa-times-circle" },
};

const statusOrder = ["pending", "paid", "shipped", "delivered"];

function fmt(v) {
  return (
    "R$ " +
    parseFloat(v || 0)
      .toFixed(2)
      .replace(".", ",")
  );
}

function renderTimeline(currentStatus) {
  if (currentStatus === "cancelled") {
    return `<div style="text-align:center;padding:12px 0;">
                <span class="status-badge badge-cancelled"><i class="fas fa-times-circle" style="margin-right:6px;"></i>Pedido Cancelado</span>
            </div>`;
  }
  const currentIdx = statusOrder.indexOf(currentStatus);
  return `<div class="status-timeline">
            ${statusOrder
              .map((s, i) => {
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                const cls = isDone ? "done" : isCurrent ? "current" : "";
                return `<div class="status-step ${cls}">
                    <div class="step-icon"><i class="${statusMap[s].icon}"></i></div>
                    <div class="step-label">${statusMap[s].label}</div>
                </div>`;
              })
              .join("")}
        </div>`;
}

function renderResult(order) {
  const addr = order.shipping_address || {};
  const payLabel =
    {
      checkout_pro: "Cartão / Mercado Pago",
      pix: "PIX",
      boleto: "Boleto",
      credit_card: "Cartão de Crédito",
    }[order.payment_method] ||
    order.payment_method ||
    "—";

  const trackingHtml = order.shipping_tracking
    ? `
            <div class="tracking-box">
                <div>
                    <div class="tracking-label">Código de Rastreamento</div>
                    <div class="tracking-code">${order.shipping_tracking}</div>
                </div>
                <a href="https://rastreamento.correios.com.br/app/index.php?objetos=${order.shipping_tracking}"
                   target="_blank" class="btn-correios">
                    <i class="fas fa-external-link-alt"></i> Rastrear nos Correios
                </a>
            </div>`
    : `
            <div style="background:#f7f5f2;border-radius:8px;padding:16px 20px;margin-bottom:24px;color:var(--gray);font-size:13px;">
                <i class="fas fa-info-circle" style="margin-right:8px;color:var(--primary);"></i>
                Código de rastreamento será disponibilizado quando o pedido for despachado.
            </div>`;

  const itemsHtml = (order.items || [])
    .map(
      (i) => `
            <div class="order-item">
                <div>
                    <div class="order-item-name">${i.product_name}</div>
                    <div class="order-item-qty">${i.quantity}x · ${fmt(i.unit_price)} cada</div>
                </div>
                <div class="order-item-price">${fmt(i.total_price)}</div>
            </div>`,
    )
    .join("");

  return `
        <div class="result-card">
            <div class="result-header">
                <div class="result-header-left">
                    <h3>#${order.order_number}</h3>
                    <p>Realizado em ${new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                </div>
                <span class="status-badge badge-${order.status}">${statusMap[order.status]?.label || order.status}</span>
            </div>
            <div class="result-body">
                ${renderTimeline(order.status)}
                ${trackingHtml}
                <div class="details-grid">
                    <div class="detail-box">
                        <div class="detail-box-label">Endereço de Entrega</div>
                        <div class="detail-box-value">
                            ${addr.street || ""}, ${addr.number || ""}<br>
                            ${addr.neighborhood ? addr.neighborhood + " · " : ""}${addr.city || ""} — ${addr.state || ""}<br>
                            CEP ${addr.zip_code || ""}
                        </div>
                    </div>
                    <div class="detail-box">
                        <div class="detail-box-label">Pagamento</div>
                        <div class="detail-box-value">${payLabel}</div>
                        <div class="detail-box-label" style="margin-top:12px;">Total</div>
                        <div class="detail-box-value" style="font-size:18px;font-weight:600;color:var(--primary);">${fmt(order.total_amount)}</div>
                    </div>
                </div>
                ${order.items?.length ? `<div class="items-title">Itens do Pedido</div>${itemsHtml}` : ""}
            </div>
        </div>`;
}

async function buscarPedido() {
  const orderNumber = document
    .getElementById("orderInput")
    .value.trim()
    .toUpperCase();
  const email = document.getElementById("emailInput").value.trim();
  const errEl = document.getElementById("msgError");
  const resultEl = document.getElementById("result");
  const btn = document.getElementById("searchBtn");

  errEl.style.display = "none";
  resultEl.style.display = "none";

  if (!orderNumber) {
    errEl.textContent = "Digite o número do pedido.";
    errEl.style.display = "block";
    return;
  }
  if (!email) {
    errEl.textContent = "Digite o email usado na compra.";
    errEl.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.innerHTML =
    '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Buscando...';

  try {
    const res = await fetch(
      `/api/tracking/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`,
    );
    const data = await res.json();

    if (data.success) {
      resultEl.innerHTML = renderResult(data.data);
      resultEl.style.display = "block";
      resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      errEl.textContent = data.message || "Pedido não encontrado.";
      errEl.style.display = "block";
    }
  } catch {
    errEl.textContent = "Erro de conexão. Tente novamente.";
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fas fa-search" style="margin-right:8px;"></i> Rastrear Pedido';
  }
}

["orderInput", "emailInput"].forEach((id) => {
  document.getElementById(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscarPedido();
  });
});
