let cartData = { items: [], subtotal: 0, totalItems: 0 };
let selectedShipping = null;

async function loadCart() {
  try {
    const headers = {};
    const sessionId = localStorage.getItem("cartSessionId") || "";
    if (sessionId) headers["X-Session-Id"] = sessionId;
    if (window.auth && auth.isAuthenticated())
      headers["Authorization"] = `Bearer ${auth.getToken()}`;

    const res = await fetch("/api/cart", { headers });
    const data = await res.json();
    if (data.success) {
      cartData = data.data;
      if (data.sessionId) localStorage.setItem("cartSessionId", data.sessionId);
      renderCart();
      updateCartCount();
    } else {
      renderCart();
    }
  } catch (e) {
    console.error(e);
    renderCart();
  }
}

function renderCart() {
  const container = document.getElementById("cartContent");
  if (!cartData.items || cartData.items.length === 0) {
    container.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>Seu carrinho está vazio</h3>
                        <p>Explore nossa coleção!</p>
                        <a href="/products" class="btn-primary">Ver Coleção</a>
                    </div>`;
    return;
  }

  container.innerHTML = `
                <div class="cart-container">
                    <div class="cart-items">
                        <div class="cart-header">
                            <span>Produto</span><span>Preço</span><span>Quantidade</span><span>Total</span><span></span>
                        </div>
                        <div id="cartItemsList"></div>
                    </div>
                    <div class="cart-summary">
                        <h3 class="summary-title">Resumo</h3>
                        <div class="summary-row">
                            <span>Subtotal (${cartData.totalItems} itens)</span>
                            <span>R$ ${cartData.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row" id="shippingRow" style="display:none;">
                            <span>Frete</span>
                            <span id="shippingRowValue">—</span>
                        </div>

                        <div class="shipping-calc">
                            <h4>Calcular Frete</h4>
                            <div class="shipping-input">
                                <input type="text" id="shippingCep" placeholder="00000-000" maxlength="9">
                                <button type="button" id="calcShippingBtn">Calcular</button>
                            </div>
                            <div id="shippingResult"></div>
                        </div>

                        <!-- Cupom -->
                        <div class="shipping-calc" style="margin-top:16px;">
                            <h4>Cupom de Desconto</h4>
                            <div class="shipping-input">
                                <input type="text" id="couponInput" placeholder="CÓDIGO DO CUPOM" style="text-transform:uppercase;">
                                <button type="button" id="applyCouponBtn">Aplicar</button>
                            </div>
                            <div id="couponMsg" style="font-size:12px;margin-top:6px;display:none;"></div>
                        </div>

                        <div class="summary-row" id="discountRow" style="display:none;">
                            <span>Desconto</span>
                            <span id="discountRowValue" style="color:#2E8B57;">—</span>
                        </div>

                        <div class="summary-total">
                            <span>Total</span>
                            <span id="cartTotal">R$ ${cartData.subtotal.toFixed(2)}</span>
                        </div>
                        <button class="btn-checkout" id="checkoutBtn">Finalizar Compra</button>
                        <a href="/products" class="continue-link">Continuar Comprando</a>
                    </div>
                </div>`;

  renderCartItems();
  bindShippingEvents();
}

function renderCartItems() {
  const list = document.getElementById("cartItemsList");
  list.innerHTML = cartData.items
    .map((item) => {
      const varTags = [item.variation_color, item.variation_size].filter(
        Boolean,
      );
      const varHtml = varTags.length
        ? varTags
            .map(
              (v) =>
                `<span style="display:inline-block;padding:2px 8px;border:1px solid #ddd;border-radius:20px;font-size:11px;color:#555;margin-top:4px;margin-right:4px;">${v}</span>`,
            )
            .join("")
        : "";
      return `
                <div class="cart-item">
                    <div class="product-cell">
                        <div class="product-image"><img src="${item.main_image}" alt="${item.name}"></div>
                        <div class="product-info">
                            <h4><a href="/product?id=${item.product_id}">${item.name}</a></h4>
                            <div>${varHtml}</div>
                        </div>
                    </div>
                    <div class="price-cell">R$ ${item.final_price.toFixed(2)}</div>
                    <div class="quantity-cell">
                        <div class="quantity-control">
                            <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <input type="text" value="${item.quantity}" readonly>
                            <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <div class="total-cell">R$ ${(item.final_price * item.quantity).toFixed(2)}</div>
                    <div class="remove-cell">
                        <button class="remove-btn" onclick="removeItem(${item.id})"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
    })
    .join("");
}

function bindShippingEvents() {
  document.getElementById("shippingCep").addEventListener("input", function () {
    let v = this.value.replace(/\D/g, "");
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
    this.value = v;
  });

  document
    .getElementById("shippingCep")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") calcShipping();
    });

  document
    .getElementById("calcShippingBtn")
    .addEventListener("click", calcShipping);
  document
    .getElementById("applyCouponBtn")
    .addEventListener("click", applyCoupon);
  document.getElementById("couponInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyCoupon();
  });
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login?redirect=/checkout";
      return;
    }
    if (appliedCoupon) {
      sessionStorage.setItem("cartCoupon", JSON.stringify(appliedCoupon));
    } else {
      sessionStorage.removeItem("cartCoupon");
    }
    window.location.href = "/checkout";
  });
}

async function applyCoupon() {
  const input = document.getElementById("couponInput");
  const msg = document.getElementById("couponMsg");
  const btn = document.getElementById("applyCouponBtn");
  const code = input.value.trim().toUpperCase();
  if (!code) return;

  btn.disabled = true;
  btn.textContent = "...";
  msg.style.display = "none";

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
        msg.textContent = `Pedido mínimo de R$ ${parseFloat(c.min_purchase).toFixed(2)} para este cupom.`;
        msg.style.color = "#C45C5C";
        msg.style.display = "block";
        appliedCoupon = null;
        sessionStorage.removeItem("cartCoupon");
      } else {
        appliedCoupon = c;
        sessionStorage.setItem("cartCoupon", JSON.stringify(c));
        const label =
          c.discount_type === "percentage"
            ? `${c.discount_value}% OFF`
            : `R$ ${parseFloat(c.discount_value).toFixed(2)} OFF`;
        msg.textContent = `✓ Cupom ${c.code} aplicado — ${label}`;
        msg.style.color = "#2E8B57";
        msg.style.display = "block";

        const discount = calcDiscount(cartData.subtotal);
        const discRow = document.getElementById("discountRow");
        if (discRow) {
          discRow.style.display = "flex";
          document.getElementById("discountRowValue").textContent =
            `- R$ ${discount.toFixed(2)}`;
        }
        updateCartTotal();
      }
    } else {
      appliedCoupon = null;
      sessionStorage.removeItem("cartCoupon");
      msg.textContent = result.message || "Cupom inválido.";
      msg.style.color = "#C45C5C";
      msg.style.display = "block";
    }
  } catch {
    msg.textContent = "Erro ao validar cupom.";
    msg.style.color = "#C45C5C";
    msg.style.display = "block";
  }
  btn.disabled = false;
  btn.textContent = "Aplicar";
}

async function calcShipping() {
  const cep = document.getElementById("shippingCep").value.replace(/\D/g, "");
  const result = document.getElementById("shippingResult");
  const btn = document.getElementById("calcShippingBtn");

  if (cep.length !== 8) {
    result.innerHTML =
      '<span style="color:#C45C5C;font-size:12px;">CEP inválido.</span>';
    return;
  }

  if (cartData.subtotal >= 299) {
    result.innerHTML = `
                    <div class="shipping-option selected" style="margin-top:8px;">
                        <div class="shipping-option-info">
                            <div class="shipping-option-name">Frete Grátis</div>
                            <div class="shipping-option-days">Entrega normal</div>
                        </div>
                        <div class="shipping-option-price" style="color:#2E8B57;">Grátis</div>
                    </div>`;
    selectShipping(0, "Frete Grátis");
    return;
  }

  btn.textContent = "...";
  btn.disabled = true;
  result.innerHTML =
    '<span style="color:#8B8581;font-size:12px;">Calculando...</span>';

  try {
    const items = (cartData.items || []).map((i) => ({
      quantity: i.quantity,
      weight: 0.3,
    }));
    const res = await fetch("/api/checkout/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zipcode: cep, items }),
    });
    const data = await res.json();

    if (data.success && data.data && data.data.length) {
      const opcoes = data.data;

      result.innerHTML = opcoes
        .map(
          (opt, i) => `
                        <div class="shipping-option${i === 0 ? " selected" : ""}"
                             onclick="handleShippingClick(this, ${opt.price}, '${opt.name}')">
                            <input type="radio" name="shippingOpt" ${i === 0 ? "checked" : ""}>
                            <div class="shipping-option-info">
                                <div class="shipping-option-name">${opt.name}</div>
                                <div class="shipping-option-days">
                                    <i class="fas fa-clock" style="margin-right:3px;opacity:0.5;"></i>${opt.days}
                                </div>
                            </div>
                            <div class="shipping-option-price">R$ ${opt.price.toFixed(2)}</div>
                        </div>
                    `,
        )
        .join("");

      selectShipping(opcoes[0].price, opcoes[0].name);
    } else {
      result.innerHTML = `<span style="color:#C45C5C;font-size:12px;">${data.message || "Nenhuma opção disponível para este CEP."}</span>`;
    }
  } catch (e) {
    result.innerHTML =
      '<span style="color:#C45C5C;font-size:12px;">Erro ao calcular. Tente novamente.</span>';
  } finally {
    btn.textContent = "Calcular";
    btn.disabled = false;
  }
}

function handleShippingClick(el, price, name) {
  document.querySelectorAll("#shippingResult .shipping-option").forEach((o) => {
    o.classList.remove("selected");
    const radio = o.querySelector('input[type="radio"]');
    if (radio) radio.checked = false;
  });
  el.classList.add("selected");
  const radio = el.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;

  selectShipping(price, name);
}

function selectShipping(price, name) {
  selectedShipping = { price, name };

  const cep = (document.getElementById("shippingCep")?.value || "").replace(
    /\D/g,
    "",
  );
  sessionStorage.setItem("cartShipping", JSON.stringify({ price, name, cep }));

  const shippingRow = document.getElementById("shippingRow");
  if (shippingRow) {
    if (price === 0) {
      shippingRow.style.display = "flex";
      document.getElementById("shippingRowValue").innerHTML =
        '<span style="color:#2E8B57;font-weight:600;">Grátis</span>';
    } else {
      shippingRow.style.display = "flex";
      document.getElementById("shippingRowValue").textContent =
        `R$ ${price.toFixed(2)}`;
    }
  }

  const discount = appliedCoupon ? calcDiscount(cartData.subtotal) : 0;
  const total = (cartData.subtotal || 0) + price - discount;
  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2)}`;
}

let appliedCoupon = null;

function calcDiscount(subtotal) {
  if (!appliedCoupon) return 0;
  return appliedCoupon.discount_type === "percentage"
    ? subtotal * (appliedCoupon.discount_value / 100)
    : parseFloat(appliedCoupon.discount_value);
}

function updateCartTotal() {
  const shipping = selectedShipping ? selectedShipping.price : 0;
  const discount = calcDiscount(cartData.subtotal);
  const total = (cartData.subtotal || 0) + shipping - discount;
  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2)}`;
}

async function updateQuantity(itemId, newQty) {
  if (newQty < 1) newQty = 1;
  if (newQty > 99) newQty = 99;
  try {
    const headers = { "Content-Type": "application/json" };
    const sessionId = localStorage.getItem("cartSessionId") || "";
    if (sessionId) headers["X-Session-Id"] = sessionId;
    if (window.auth && auth.isAuthenticated())
      headers["Authorization"] = `Bearer ${auth.getToken()}`;

    const res = await fetch(`/api/cart/item/${itemId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ quantity: newQty }),
    });
    const data = await res.json();
    if (data.success) {
      cartData = data.data;
      selectedShipping = null;
      renderCart();
      updateCartCount();
    }
  } catch (e) {
    console.error(e);
  }
}

async function removeItem(itemId) {
  try {
    const headers = {};
    const sessionId = localStorage.getItem("cartSessionId") || "";
    if (sessionId) headers["X-Session-Id"] = sessionId;
    if (window.auth && auth.isAuthenticated())
      headers["Authorization"] = `Bearer ${auth.getToken()}`;

    const res = await fetch(`/api/cart/item/${itemId}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (data.success) {
      cartData = data.data;
      selectedShipping = null;
      renderCart();
      updateCartCount();
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadNavCategories() {
  try {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success && data.data.length > 0) {
      const dropdown = document.getElementById("categoriesDropdown");
      if (dropdown) {
        const active = data.data.filter((c) => c.status === "active");
        let html = active
          .map(
            (cat) =>
              `<li><a href="/products?category=${cat.slug}">${cat.name}</a></li>`,
          )
          .join("");
        while (html.split("<li>").length - 1 < 8) {
          html += `<li><a href="#" style="visibility:hidden;"> </a></li>`;
        }
        html += `<li class="view-all"><a href="/products">Ver Todas as Categorias</a></li>`;
        dropdown.innerHTML = html;
      }
    }
  } catch (e) {
    console.error("Erro ao carregar categorias:", e);
  }
}

window.updateQuantity = updateQuantity;
window.removeItem = removeItem;

document.addEventListener("DOMContentLoaded", loadNavCategories);

(async () => {
  try {
    const r = await fetch("/api/alerts");
    const d = await r.json();
    const headerTop = document.getElementById("headerTop");
    const textEl = document.getElementById("headerTopText");
    if (d.success && d.data.length) {
      const alerts = d.data;
      let idx = 0;
      function showAlert(a) {
        const text = a.title ? `${a.title} — ${a.message}` : a.message;
        textEl.style.opacity = "0";
        setTimeout(() => {
          if (text.length > 60) {
            textEl.className = "header-top-marquee";
            textEl.innerHTML =
              '<div class="marquee-inner"><span>' +
              text +
              "</span><span>" +
              text +
              "</span></div>";
          } else {
            textEl.className = "";
            textEl.textContent = text;
          }
          textEl.style.opacity = "1";
        }, 300);
      }
      textEl.style.transition = "opacity 0.3s ease";
      headerTop.style.display = "";
      showAlert(alerts[0]);
      if (alerts.length > 1) {
        setInterval(() => {
          idx = (idx + 1) % alerts.length;
          showAlert(alerts[idx]);
        }, 5000);
      }
    } else {
      headerTop.style.display = "none";
    }
  } catch (e) {
    document.getElementById("headerTop").style.display = "none";
  }
})();
loadCart();

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
