document.addEventListener("DOMContentLoaded", function () {
  var header = document.querySelector(".header");
  var body = document.getElementById("pageBody");
  if (header && body) body.style.marginTop = header.offsetHeight + "px";
});

(async () => {
  try {
    const r = await fetch("/api/alerts");
    const d = await r.json();
    if (d.success && d.data.length && d.data.some((a) => a.is_active)) {
      const a = d.data.find((x) => x.is_active);
      const txt = (a.title ? a.title + " — " : "") + a.message;
      const el = document.getElementById("headerTopText");
      if (txt.length > 60) {
        el.className = "header-top-marquee";
        el.innerHTML = `<div class="marquee-inner"><span>${txt}</span><span>${txt}</span></div>`;
      } else {
        el.textContent = txt;
      }
      document.getElementById("headerTop").style.display = "";
    }
  } catch {}
})();

const STATUS_LABELS = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
const STATUS_CLASS = {
  pending: "status-pending",
  paid: "status-paid",
  processing: "status-processing",
  shipped: "status-shipped",
  delivered: "status-delivered",
  cancelled: "status-cancelled",
};

const STEPS = ["paid", "processing", "shipped", "delivered"];
const STEP_LABELS = ["Pago", "Preparando", "Enviado", "Entregue"];

function stepIndex(status) {
  const map = { paid: 0, processing: 1, shipped: 2, delivered: 3 };
  return map[status] ?? -1;
}

function buildProgress(status) {
  if (status === "cancelled") return "";
  const cur = stepIndex(status);
  if (cur < 0) return "";
  const pct = cur === 0 ? 0 : Math.round((cur / (STEPS.length - 1)) * 100);
  const steps = STEPS.map((s, i) => {
    const done = i < cur;
    const current = i === cur;
    const cls = done ? "step done" : current ? "step current" : "step";
    const icon = done ? '<i class="fas fa-check"></i>' : i + 1;
    return `<div class="${cls}">
                <div class="step-dot">${icon}</div>
                <div class="step-label">${STEP_LABELS[i]}</div>
            </div>`;
  }).join("");

  return `<div class="order-progress">
            <div class="progress-steps">
                <div class="progress-line" style="width:${pct}%"></div>
                ${steps}
            </div>
        </div>`;
}

function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function fmtMoney(v) {
  return "R$ " + parseFloat(v).toFixed(2).replace(".", ",");
}

function buildOrderCard(o) {
  const statusLabel = STATUS_LABELS[o.status] || o.status;
  const statusCls = STATUS_CLASS[o.status] || "status-pending";
  const items = (o.items || [])
    .map(
      (i) => `
            <div class="order-item">
                ${
                  i.image
                    ? `<img src="${i.image}" class="item-img" alt="${i.product_name}">`
                    : `<div class="item-img-placeholder"><i class="fas fa-tshirt"></i></div>`
                }
                <div class="item-info">
                    <div class="item-name">${i.product_name}</div>
                    <div class="item-qty">Qtd: ${i.quantity}</div>
                </div>
                <div class="item-price">${fmtMoney(i.total_price)}</div>
            </div>`,
    )
    .join("");

  const trackingInfo = o.shipping_tracking
    ? `<div class="order-shipping-info"><i class="fas fa-barcode"></i> Código: <strong>${o.shipping_tracking}</strong></div>`
    : `<div class="order-shipping-info"><i class="fas fa-clock"></i> Código de rastreio será disponibilizado após o envio</div>`;

  const trackBtn = o.shipping_tracking
    ? `<button class="btn-track" onclick="openTrackingModal('${o.shipping_tracking}')"><i class="fas fa-search-location"></i> Rastrear Entrega</button>`
    : `<button class="btn-track" style="opacity:.5;cursor:not-allowed;" disabled><i class="fas fa-search-location"></i> Aguardando Envio</button>`;

  return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-number">#${o.order_number}</div>
                    <div class="order-date">${formatDate(o.created_at)}</div>
                </div>
                <div class="order-meta">
                    <span class="order-total">${fmtMoney(o.total_amount)}</span>
                    <span class="status-pill ${statusCls}">${statusLabel}</span>
                </div>
            </div>
            ${buildProgress(o.status)}
            <div class="order-items">${items}</div>
            <div class="order-footer">
                ${trackingInfo}
                <div class="order-actions">
                    ${trackBtn}
                    ${o.status === "delivered" && o.items && o.items.length ? o.items.map(i => i.product_id ? `<a class="btn-review" href="/product?id=${i.product_id}#reviews"><i class="fas fa-star"></i> Avaliar ${o.items.length > 1 ? i.product_name.split(" ").slice(0,2).join(" ") : "Pedido"}</a>` : "").join("") : ""}
                    <a class="btn-help" href="/ajuda"><i class="fas fa-question-circle"></i> Ajuda</a>
                </div>
            </div>
        </div>`;
}

async function loadOrders() {
  const el = document.getElementById("ordersList");
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login?redirect=/orders";
      return;
    }
    const res = await fetch("/api/orders", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    if (!data.data.length) {
      el.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h2>Nenhum pedido encontrado</h2>
                    <p>Quando você fizer uma compra, seus pedidos aparecerão aqui.</p>
                    <a href="/products">Explorar Coleção</a>
                </div>`;
      return;
    }

    el.innerHTML = data.data.map(buildOrderCard).join("");
  } catch (e) {
    console.error(e);
    el.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="color:#e74c3c;"></i>
                <h2>Erro ao carregar pedidos</h2>
                <p>Por favor, tente novamente ou entre em contato com o suporte.</p>
                <a href="/ajuda">Central de Ajuda</a>
            </div>`;
  }
}

loadOrders();

(function () {
  var overlay = document.getElementById("mobileOverlay");
  var drawer = document.getElementById("mobileDrawer");
  var btn = document.querySelector(".mobile-menu-btn");
  var closeBtn = document.getElementById("drawerClose");
  if (!btn) return;
  var navCopied = false;
  function copyNav() {
    if (navCopied) return;
    navCopied = true;
    var dn = document.getElementById("drawerNav");
    document.querySelectorAll(".nav-menu ul > li").forEach(function (li) {
      var a = li.querySelector("a");
      if (!a) return;
      var l = document.createElement("a");
      l.href = a.href;
      l.textContent = a.textContent.trim();
      l.style.cssText =
        "display:block;padding:16px 24px;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#1a1817;text-decoration:none;border-bottom:1px solid #f0ede9;";
      if (a.style.color) l.style.color = a.style.color;
      dn.appendChild(l);
    });
  }
  function open() {
    copyNav();
    drawer.style.display = "flex";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
    btn.innerHTML = '<i class="fas fa-times"></i>';
  }
  function close() {
    drawer.style.display = "none";
    overlay.style.display = "none";
    document.body.style.overflow = "";
    btn.innerHTML = '<i class="fas fa-bars"></i>';
  }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (window.innerWidth > 768) return;
    drawer.style.display === "none" ? open() : close();
  });
  overlay.addEventListener("click", close);
  closeBtn.addEventListener("click", close);
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) close();
  });
})();

function openTrackingModal(code) {
  document.getElementById("trackingCodeDisplay").textContent = code;
  document.getElementById("trackingCorreiosLink").href =
    "https://rastreamento.correios.com.br/app/index.php?id=" +
    encodeURIComponent(code);
  document.getElementById("trackingModalOverlay").classList.add("open");
}
function closeTrackingModal() {
  document.getElementById("trackingModalOverlay").classList.remove("open");
}
function copyTrackingCode() {
  const code = document.getElementById("trackingCodeDisplay").textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector(".btn-copy");
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-copy"></i>';
    }, 1800);
  });
}
document
  .getElementById("trackingModalOverlay")
  .addEventListener("click", function (e) {
    if (e.target === this) closeTrackingModal();
  });