(function () {
  if (localStorage.getItem("adminTheme") === "dark") {
    document.documentElement.classList.add("dark");
  }
})();

const user = JSON.parse(localStorage.getItem("user") || "{}");
document.getElementById("adminName").textContent = user.name || "Administrador";
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = "/admin";
});

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.querySelector("i").className =
    type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
  t.className = "toast " + type;
  document.getElementById("toastMsg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

const SPECIAL_DEFS = [
  {
    type: "first_purchase",
    title: "Cupom de Primeira Compra",
    description:
      "Desconto exclusivo para novos clientes. Verificado automaticamente — cada usuário só pode usar uma vez.",
    icon: "fas fa-gift",
    iconColor: "#8B6914",
    defaultCode: "PRIMEIRACOMPRA",
    defaultDiscount: 10,
    defaultType: "percentage",
  },
];

let specialData = {};

async function loadSpecialCoupons() {
  try {
    const res = await adminFetch("/api/admin/coupons/special");
    const result = await res.json();
    if (result.success)
      result.data.forEach((c) => (specialData[c.coupon_type] = c));
  } catch (e) {}
  renderSpecialCards();
}

function renderSpecialCards() {
  const grid = document.getElementById("specialCouponsGrid");
  grid.innerHTML = SPECIAL_DEFS.map((def) => {
    const saved = specialData[def.type];
    const active = saved ? saved.status === "active" : false;
    const dv = saved ? parseFloat(saved.discount_value) : def.defaultDiscount;
    const dt = saved ? saved.discount_type : def.defaultType;
    const code = saved ? saved.code : def.defaultCode;
    const uses = saved ? saved.used_count || 0 : 0;

    return (
      '<div class="special-card ' +
      (active ? "enabled" : "") +
      '" id="card-' +
      def.type +
      '">' +
      '<div class="special-card-header">' +
      '<div class="special-card-info">' +
      '<h3><i class="' +
      def.icon +
      '" style="color:' +
      def.iconColor +
      ';margin-right:7px;"></i>' +
      def.title +
      "</h3>" +
      "<p>" +
      def.description +
      "</p>" +
      "</div>" +
      '<div class="toggle-wrap">' +
      '<span class="toggle-label">' +
      (active ? "Ativo" : "Inativo") +
      "</span>" +
      '<label class="toggle">' +
      '<input type="checkbox" id="toggle-' +
      def.type +
      '" ' +
      (active ? "checked" : "") +
      " onchange=\"onSpecialToggle('" +
      def.type +
      "', this.checked)\">" +
      '<span class="toggle-slider"></span>' +
      "</label>" +
      "</div>" +
      "</div>" +
      '<div class="special-card-fields">' +
      '<div class="field-group"><label>Tipo de Desconto</label>' +
      '<select id="stype-' +
      def.type +
      '" ' +
      (!active ? "disabled" : "") +
      ">" +
      '<option value="percentage" ' +
      (dt === "percentage" ? "selected" : "") +
      ">Percentual (%)</option>" +
      '<option value="fixed" ' +
      (dt === "fixed" ? "selected" : "") +
      ">Valor Fixo (R$)</option>" +
      "</select></div>" +
      '<div class="field-group"><label>Valor do Desconto</label>' +
      '<input type="number" id="sval-' +
      def.type +
      '" value="' +
      dv +
      '" step="0.01" min="0" ' +
      (!active ? "disabled" : "") +
      ">" +
      "</div>" +
      "</div>" +
      '<div class="special-card-code">' +
      "<label>Código do Cupom</label>" +
      '<div class="code-row">' +
      '<input type="text" id="scode-' +
      def.type +
      '" value="' +
      code +
      '" ' +
      (!active ? "disabled" : "") +
      ">" +
      '<button class="btn-save-special" id="sbtn-' +
      def.type +
      '" onclick="saveSpecialCoupon(\'' +
      def.type +
      "')\" " +
      (!active ? "disabled" : "") +
      ">" +
      '<i class="fas fa-save"></i> Salvar' +
      "</button>" +
      "</div>" +
      "</div>" +
      '<span class="special-status-pill ' +
      (active ? "pill-active" : "pill-inactive") +
      '">' +
      '<i class="fas fa-circle"></i> ' +
      (active
        ? "Ativo · " + uses + " uso" + (uses !== 1 ? "s" : "")
        : "Desativado") +
      "</span>" +
      "</div>"
    );
  }).join("");
}

function setCardEnabled(type, enabled) {
  const card = document.getElementById("card-" + type);
  if (!card) return;
  card.className = "special-card " + (enabled ? "enabled" : "");
  ["stype", "sval", "scode", "sbtn"].forEach((p) => {
    const el = document.getElementById(p + "-" + type);
    if (el) el.disabled = !enabled;
  });
  const label = card.querySelector(".toggle-label");
  if (label) label.textContent = enabled ? "Ativo" : "Inativo";
  const pill = card.querySelector(".special-status-pill");
  if (pill) {
    const saved = specialData[type];
    const uses = saved ? saved.used_count || 0 : 0;
    pill.className =
      "special-status-pill " + (enabled ? "pill-active" : "pill-inactive");
    pill.innerHTML =
      '<i class="fas fa-circle"></i> ' +
      (enabled
        ? "Ativo · " + uses + " uso" + (uses !== 1 ? "s" : "")
        : "Desativado");
  }
}

async function onSpecialToggle(type, checked) {
  setCardEnabled(type, checked);
  if (checked) {
    await saveSpecialCoupon(type);
  } else {
    const def = SPECIAL_DEFS.find((d) => d.type === type);
    const code =
      (document.getElementById("scode-" + type) || {}).value || def.defaultCode;
    const dv = parseFloat(
      (document.getElementById("sval-" + type) || {}).value ||
        def.defaultDiscount,
    );
    const dt =
      (document.getElementById("stype-" + type) || {}).value || def.defaultType;
    await upsertSpecial(type, "inactive", dv, dt, code);
  }
}

async function saveSpecialCoupon(type) {
  const def = SPECIAL_DEFS.find((d) => d.type === type);
  const code = ((document.getElementById("scode-" + type) || {}).value || "")
    .trim()
    .toUpperCase();
  const dv = parseFloat((document.getElementById("sval-" + type) || {}).value);
  const dt = (document.getElementById("stype-" + type) || {}).value;
  if (!code) {
    showToast("Informe o código do cupom.", "error");
    return;
  }
  if (!dv || dv <= 0) {
    showToast("Informe um valor de desconto válido.", "error");
    return;
  }
  const active = (document.getElementById("toggle-" + type) || {}).checked;
  await upsertSpecial(
    type,
    active ? "active" : "inactive",
    dv,
    dt,
    code,
    def.title,
  );
}

async function upsertSpecial(
  type,
  status,
  discount_value,
  discount_type,
  code,
  description,
) {
  try {
    const res = await adminFetch("/api/admin/coupons/special/" + type, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        discount_value,
        discount_type,
        code,
        description,
      }),
    });
    const result = await res.json();
    if (result.success) {
      showToast("Cupom especial salvo!");
      if (!specialData[type]) specialData[type] = {};
      Object.assign(specialData[type], {
        status,
        discount_value,
        discount_type,
        code,
        coupon_type: type,
      });
    } else {
      showToast(result.message || "Erro ao salvar", "error");
    }
  } catch (e) {
    showToast("Erro de conexão", "error");
  }
}

async function loadCoupons() {
  try {
    const res = await adminFetch("/api/admin/coupons");
    const result = await res.json();
    if (!result.success) return;
    const manual = result.data.filter((c) => !c.coupon_type);
    const tbody = document.getElementById("couponsTableBody");
    if (!manual.length) {
      tbody.innerHTML =
        '<tr class="empty-row"><td colspan="8"><i class="fas fa-ticket-alt" style="margin-right:8px;color:#ddd;"></i>Nenhum cupom manual cadastrado</td></tr>';
      return;
    }
    tbody.innerHTML = manual
      .map(
        (c) =>
          "<tr>" +
          '<td><strong style="letter-spacing:0.5px;">' +
          c.code +
          "</strong></td>" +
          '<td style="color:#666;">' +
          (c.description || "—") +
          "</td>" +
          "<td>" +
          (c.discount_type === "percentage"
            ? '<span style="color:#1a73e8">%</span> Percentual'
            : '<span style="color:#34a853">R$</span> Fixo') +
          "</td>" +
          "<td><strong>" +
          (c.discount_type === "percentage"
            ? c.discount_value + "%"
            : "R$ " + parseFloat(c.discount_value).toFixed(2)) +
          "</strong></td>" +
          "<td>" +
          (c.used_count || 0) +
          " / " +
          (c.max_uses != null ? c.max_uses : "∞") +
          "</td>" +
          '<td style="color:#666;">' +
          (c.expires_at
            ? new Date(c.expires_at).toLocaleDateString("pt-BR")
            : "Sem validade") +
          "</td>" +
          '<td><span class="status-badge status-' +
          c.status +
          '">' +
          (c.status === "active" ? "Ativo" : "Inativo") +
          "</span></td>" +
          "<td>" +
          '<button class="action-btn btn-tog ' +
          (c.status === "active" ? "deact" : "") +
          '" onclick="toggleStatus(' +
          c.id +
          ",'" +
          c.status +
          '\')" title="' +
          (c.status === "active" ? "Desativar" : "Ativar") +
          '">' +
          '<i class="fas fa-' +
          (c.status === "active" ? "pause" : "play") +
          '"></i>' +
          "</button> " +
          '<button class="action-btn btn-del" onclick="deleteCoupon(' +
          c.id +
          ')" title="Excluir">' +
          '<i class="fas fa-trash"></i>' +
          "</button>" +
          "</td>" +
          "</tr>",
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

window.toggleStatus = async function (id, cur) {
  const ns = cur === "active" ? "inactive" : "active";
  await adminFetch("/api/admin/coupons/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: ns }),
  });
  showToast("Status atualizado");
  loadCoupons();
};

window.deleteCoupon = async function (id) {
  if (!confirm("Excluir este cupom?")) return;
  await adminFetch("/api/admin/coupons/" + id, { method: "DELETE" });
  showToast("Cupom excluído");
  loadCoupons();
};

const modal = document.getElementById("couponModal");
document.getElementById("newCouponBtn").addEventListener("click", () => {
  document.getElementById("couponForm").reset();
  modal.style.display = "flex";
});
document
  .getElementById("closeModalBtn")
  .addEventListener("click", () => (modal.style.display = "none"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

document.getElementById("couponForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    code: document.getElementById("couponCode").value.trim().toUpperCase(),
    description: document.getElementById("couponDescription").value,
    discount_type: document.getElementById("couponType").value,
    discount_value: parseFloat(document.getElementById("couponValue").value),
    min_purchase: parseFloat(document.getElementById("minPurchase").value) || 0,
    max_uses: document.getElementById("maxUses").value
      ? parseInt(document.getElementById("maxUses").value)
      : null,
    starts_at: document.getElementById("startsAt").value || null,
    expires_at: document.getElementById("expiresAt").value || null,
  };
  const res = await adminFetch("/api/admin/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (result.success) {
    modal.style.display = "none";
    showToast("Cupom criado!");
    loadCoupons();
  } else showToast(result.message || "Erro ao criar cupom", "error");
});

loadSpecialCoupons();
loadCoupons();
