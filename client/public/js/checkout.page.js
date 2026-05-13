let cartData = { items: [], subtotal: 0 };
let selectedShipping = null;
let discountAmount = 0;
let appliedCoupon = null;
let selectedPayment = "checkout_pro";

document.getElementById("shippingCep").addEventListener("input", function () {
  let v = this.value.replace(/\D/g, "");
  if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
  this.value = v;
});
document.getElementById("cepCalc").addEventListener("input", function () {
  let v = this.value.replace(/\D/g, "");
  if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
  this.value = v;
});
document.getElementById("shippingCpf").addEventListener("input", function () {
  let v = this.value.replace(/\D/g, "");
  if (v.length > 3) v = v.replace(/(\d{3})(\d)/, "$1.$2");
  if (v.length > 7) v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  if (v.length > 11)
    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  this.value = v;
});

async function buscaCep(cep) {
  cep = cep.replace(/\D/g, "");
  if (cep.length !== 8) return;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    if (!d.erro) {
      document.getElementById("shippingStreet").value = d.logradouro || "";
      document.getElementById("shippingNeighborhood").value = d.bairro || "";
      document.getElementById("shippingCity").value = d.localidade || "";
      document.getElementById("shippingState").value = d.uf || "";
      document.getElementById("cepCalc").value =
        document.getElementById("shippingCep").value;
      document.getElementById("shippingNumber").focus();
    }
  } catch {}
}
document.getElementById("shippingCep").addEventListener("blur", function () {
  buscaCep(this.value);
});

async function restoreFromCart() {
  const savedShipping = sessionStorage.getItem("cartShipping");
  if (savedShipping) {
    try {
      const s = JSON.parse(savedShipping);
      selectedShipping = s;
      if (s.cep) {
        const formatted = s.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
        const cepField = document.getElementById("shippingCep");
        const cepCalc = document.getElementById("cepCalc");
        if (cepField) cepField.value = formatted;
        if (cepCalc) cepCalc.value = formatted;
        if (typeof buscaCep === "function") await buscaCep(s.cep);
      }
      const wrap = document.getElementById("shippingOptions");
      if (wrap) {
        wrap.innerHTML = `
                            <label class="shipping-opt selected">
                                <input type="radio" name="shippingOpt" value='${JSON.stringify(s)}' checked>
                                <div class="shipping-opt-info">
                                    <div class="shipping-opt-name">${s.name}</div>
                                    <div class="shipping-opt-days" style="font-size:11px;color:#888;">Selecionado no carrinho</div>
                                </div>
                                <div class="shipping-opt-price">R$ ${parseFloat(s.price).toFixed(2).replace(".", ",")}</div>
                            </label>
                            <button type="button" onclick="recalcShipping()" style="background:none;border:none;color:#888;font-size:11px;cursor:pointer;margin-top:4px;text-decoration:underline;">Recalcular frete</button>`;
      }
      updateTotals();
    } catch (e) {
      console.warn("restoreFromCart shipping:", e);
    }
  }

  const savedCoupon = sessionStorage.getItem("cartCoupon");
  if (savedCoupon) {
    try {
      const c = JSON.parse(savedCoupon);
      appliedCoupon = c;
      const couponField = document.getElementById("couponCode");
      const couponMsg = document.getElementById("couponMessage");
      if (couponField) couponField.value = c.code;
      if (couponMsg) {
        const label =
          c.discount_type === "percentage"
            ? `${c.discount_value}% OFF`
            : `R$ ${parseFloat(c.discount_value).toFixed(2)} OFF`;
        couponMsg.textContent = `✓ Cupom ${c.code} aplicado — ${label}`;
        couponMsg.style.color = "var(--success)";
        couponMsg.style.display = "block";
      }
      updateTotals();
    } catch (e) {
      console.warn("restoreFromCart coupon:", e);
    }
  }
}

window.recalcShipping = async function () {
  const cep = (document.getElementById("cepCalc")?.value || "").replace(
    /\D/g,
    "",
  );
  if (cep.length !== 8) return;
  document.getElementById("calcShippingBtn")?.click();
};

async function loadCart() {
  try {
    const headers = {};
    const sid = localStorage.getItem("cartSessionId") || "";
    if (sid) headers["X-Session-Id"] = sid;
    const res = await fetch("/api/cart", { headers });
    const data = await res.json();
    if (data.success) {
      cartData = data.data;
      renderSummary();
    }
  } catch (e) {
    console.error(e);
  }
}

function fmt(v) {
  return "R$ " + parseFloat(v).toFixed(2).replace(".", ",");
}

function renderSummary() {
  const el = document.getElementById("summaryItems");
  if (!cartData.items || !cartData.items.length) {
    el.innerHTML =
      '<p style="color:var(--gray);font-size:13px;">Carrinho vazio.</p>';
    return;
  }
  el.innerHTML = cartData.items
    .map(
      (item) => `
                <div class="s-item">
                    <img class="s-item-img" src="${item.main_image || "/images/placeholder.jpg"}" alt="${item.name}">
                    <div class="s-item-info">
                        <h4>${item.name}<span class="s-item-qty">${item.quantity}</span></h4>
                        <p>${fmt(item.final_price)} cada</p>
                    </div>
                    <div class="s-item-price">${fmt(item.final_price * item.quantity)}</div>
                </div>
            `,
    )
    .join("");
  updateTotals();
}

function updateTotals() {
  const sub = parseFloat(cartData.subtotal) || 0;
  const ship = selectedShipping ? parseFloat(selectedShipping.price) : 0;
  document.getElementById("sSubtotal").textContent = fmt(sub);
  document.getElementById("sShipping").textContent = selectedShipping
    ? fmt(ship)
    : "A calcular";
  if (appliedCoupon) {
    discountAmount =
      appliedCoupon.discount_type === "percentage"
        ? sub * (appliedCoupon.discount_value / 100)
        : parseFloat(appliedCoupon.discount_value);
    document.getElementById("sDiscountRow").style.display = "flex";
    document.getElementById("sDiscount").textContent =
      "— " + fmt(discountAmount);
  }
  document.getElementById("sTotal").textContent = fmt(
    sub + ship - discountAmount,
  );
}

document
  .getElementById("calcShippingBtn")
  .addEventListener("click", async () => {
    const rawCep = document.getElementById("cepCalc").value;
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) {
      showToast("Digite um CEP válido.");
      return;
    }

    document.getElementById("shippingCep").value = rawCep;
    await buscaCep(cep);

    const btn = document.getElementById("calcShippingBtn");
    btn.textContent = "...";
    btn.disabled = true;

    try {
      const res = await fetch("/api/checkout/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipcode: cep,
          items: (cartData.items || []).map((i) => ({
            quantity: i.quantity,
            weight: 0.3,
          })),
        }),
      });
      const data = await res.json();
      const wrap = document.getElementById("shippingOptions");

      if (data.success && data.data.length) {
        wrap.innerHTML = data.data
          .map(
            (opt, i) => `
                        <label class="shipping-opt${i === 0 ? " selected" : ""}">
                            <input type="radio" name="shippingOpt" value='${JSON.stringify(opt)}' ${i === 0 ? "checked" : ""}>
                            <div class="shipping-opt-info">
                                <div class="shipping-opt-name">${opt.name}</div>
                                <div class="shipping-opt-days"><i class="fas fa-clock" style="margin-right:4px;opacity:0.5;"></i>${opt.days}</div>
                            </div>
                            <div class="shipping-opt-price">${fmt(opt.price)}</div>
                        </label>
                    `,
          )
          .join("");

        selectedShipping = data.data[0];
        updateTotals();

        wrap.querySelectorAll('input[type="radio"]').forEach((radio) => {
          radio.addEventListener("change", function () {
            wrap
              .querySelectorAll(".shipping-opt")
              .forEach((l) => l.classList.remove("selected"));
            this.closest(".shipping-opt").classList.add("selected");
            selectedShipping = JSON.parse(this.value);
            updateTotals();
          });
        });
      } else {
        wrap.innerHTML =
          '<p style="color:var(--error);font-size:13px;">Não foi possível calcular o frete para este CEP.</p>';
      }
    } catch {
      showToast("Erro de conexão ao calcular frete.");
    } finally {
      btn.textContent = "Calcular";
      btn.disabled = false;
    }
  });

document
  .getElementById("applyCouponBtn")
  .addEventListener("click", async () => {
    const code = document
      .getElementById("couponCode")
      .value.trim()
      .toUpperCase();
    const msg = document.getElementById("couponMessage");
    const btn = document.getElementById("applyCouponBtn");
    if (!code) return;
    btn.disabled = true;
    btn.textContent = "...";
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId: user.id || null }),
      });
      const result = await res.json();
      if (result.success) {
        const c = result.data;
        if (c.min_purchase > 0 && cartData.subtotal < c.min_purchase) {
          msg.textContent = `Pedido mínimo de ${fmt(c.min_purchase)} para este cupom.`;
          msg.style.color = "var(--error)";
          msg.style.display = "block";
          appliedCoupon = null;
        } else {
          appliedCoupon = c;
          const label =
            c.discount_type === "percentage"
              ? `${c.discount_value}% OFF`
              : `${fmt(c.discount_value)} OFF`;
          msg.textContent = `✓ Cupom ${c.code} aplicado — ${label}`;
          msg.style.color = "var(--success)";
          msg.style.display = "block";
          updateTotals();
        }
      } else {
        appliedCoupon = null;
        msg.textContent = result.message || "Cupom inválido.";
        msg.style.color = "var(--error)";
        msg.style.display = "block";
      }
    } catch {
      msg.textContent = "Erro ao validar cupom.";
      msg.style.color = "var(--error)";
      msg.style.display = "block";
    }
    btn.disabled = false;
    btn.textContent = "Aplicar";
  });

document
  .getElementById("checkoutForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedShipping) {
      showToast("Selecione uma opção de frete antes de continuar.");
      return;
    }
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i><span>Processando...</span>';

    const shipping = {
      name: document.getElementById("shippingName").value.trim(),
      email: document.getElementById("shippingEmail").value.trim(),
      phone: document.getElementById("shippingPhone").value.trim(),
      cpf: document.getElementById("shippingCpf").value.trim(),
      street: document.getElementById("shippingStreet").value.trim(),
      number: document.getElementById("shippingNumber").value.trim(),
      complement: document.getElementById("shippingComplement").value.trim(),
      neighborhood: document
        .getElementById("shippingNeighborhood")
        .value.trim(),
      city: document.getElementById("shippingCity").value.trim(),
      state: document.getElementById("shippingState").value,
      zip_code: document.getElementById("shippingCep").value.trim(),
      cost: selectedShipping ? selectedShipping.price : 0,
    };

    try {
      const headers = { "Content-Type": "application/json" };
      const sid = localStorage.getItem("cartSessionId") || "";
      if (sid) headers["X-Session-Id"] = sid;
      if (typeof auth !== "undefined" && auth.isAuthenticated())
        headers["Authorization"] = `Bearer ${auth.getToken()}`;

      const res = await fetch("/api/checkout/order", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          shipping,
          payment: { method: selectedPayment },
          coupon: appliedCoupon?.code || null,
        }),
      });
      const data = await res.json();

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.success) {
        window.location.href = `/checkout-success?order=${data.orderNumber}`;
      } else {
        let msg = data.message || "Erro ao processar pedido.";
        if (Array.isArray(data.errors) && data.errors.length) {
          msg = data.errors.map((e) => e.message).join(" • ");
        }
        showToast(msg);
        btn.disabled = false;
        btn.innerHTML =
          '<i class="fas fa-lock"></i><span>Ir para Pagamento</span><i class="fas fa-arrow-right arrow"></i>';
      }
    } catch {
      showToast("Erro de conexão. Tente novamente.");
      btn.disabled = false;
      btn.innerHTML =
        '<i class="fas fa-lock"></i><span>Ir para Pagamento</span><i class="fas fa-arrow-right arrow"></i>';
    }
  });

(async function prefillUserData() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.id) return;

  if (user.name) document.getElementById("shippingName").value = user.name;
  if (user.email) document.getElementById("shippingEmail").value = user.email;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) {
      if (data.data.phone)
        document.getElementById("shippingPhone").value = data.data.phone;
      if (data.data.cpf)
        document.getElementById("shippingCpf").value = data.data.cpf;
    }
  } catch (e) {}
})();

loadCart().then(() => {
  restoreFromCart();
});

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
    var drawerNav = document.getElementById("drawerNav");
    var navLinks = document.querySelectorAll(".nav-menu ul > li");
    navLinks.forEach(function (li) {
      var a = li.querySelector("a");
      if (!a) return;
      var link = document.createElement("a");
      link.href = a.href;
      link.textContent = a.textContent
        .trim()
        .replace(/keyboard_arrow_down/, "")
        .trim();
      link.style.cssText =
        "display:block;padding:16px 24px;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#1a1817;text-decoration:none;border-bottom:1px solid #f0ede9;";
      if (a.style.color) link.style.color = a.style.color;
      drawerNav.appendChild(link);
    });
  }

  function openDrawer() {
    copyNav();
    drawer.style.display = "flex";
    overlay.style.display = "block";
    document.body.style.overflow = "hidden";
    btn.innerHTML = '<i class="fas fa-times"></i>';
  }
  function closeDrawer() {
    drawer.style.display = "none";
    overlay.style.display = "none";
    document.body.style.overflow = "";
    btn.innerHTML = '<i class="fas fa-bars"></i>';
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (window.innerWidth > 768) return;
    drawer.style.display === "none" ? openDrawer() : closeDrawer();
  });

  overlay.addEventListener("click", closeDrawer);
  closeBtn.addEventListener("click", closeDrawer);

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) closeDrawer();
  });
})();

function showToast(message, type = "error") {
  const existing = document.getElementById("page-toast");
  if (existing) existing.remove();
  const colors = {
    error: "background:#C45C5C;color:#fff;",
    success: "background:#2E8B57;color:#fff;",
    info: "background:#1A1817;color:#fff;",
  };
  const t = document.createElement("div");
  t.id = "page-toast";
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);${colors[type] || colors.error}padding:12px 24px;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:500;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:fadeInUp 0.3s ease;pointer-events:none;`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
