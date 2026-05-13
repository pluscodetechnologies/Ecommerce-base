if (!auth.isAuthenticated()) window.location.href = "/login";

window.showTab = function (tab, link) {
  ["dados", "pedidos", "favoritos"].forEach((t) => {
    document.getElementById(
      "section" + t.charAt(0).toUpperCase() + t.slice(1),
    ).style.display = "none";
    document
      .getElementById("tab" + t.charAt(0).toUpperCase() + t.slice(1))
      .classList.remove("active");
  });
  document.getElementById(
    "section" + tab.charAt(0).toUpperCase() + tab.slice(1),
  ).style.display = "block";
  link.closest("li").classList.add("active");
  if (tab === "pedidos") loadOrders();
  if (tab === "favoritos") loadFavoritos();
  if (tab === "dados") loadProfile();
};

let profileData = null;

async function loadProfile() {
  try {
    const res = await auth.fetchWithAuth("/api/auth/profile");
    const data = await res.json();
    if (data.success) {
      profileData = data.data;
      renderProfileView(profileData);
    }
  } catch (e) {
    console.error(e);
  }
}

function renderProfileView(d) {
  document.getElementById("profileInfo").innerHTML = `
                <div class="info-row"><span class="info-label">Nome:</span><span class="info-value">${d.name}</span></div>
                <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${d.email}</span></div>
                <div class="info-row"><span class="info-label">Telefone:</span><span class="info-value">${d.phone || "-"}</span></div>
                <div class="info-row"><span class="info-label">CPF:</span><span class="info-value">${d.cpf || "-"}</span></div>
                <div class="profile-actions" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:22px;">
                    <button class="btn-edit" onclick="renderProfileForm()"><i class="fas fa-pen" style="margin-right:6px;font-size:13px;"></i>Editar Dados</button>
                    <button class="btn-edit" style="background:transparent;color:var(--primary);border:1px solid var(--primary);" onclick="renderPasswordForm()"><i class="fas fa-lock" style="margin-right:6px;font-size:13px;"></i>Alterar Senha</button>
                </div>`;
}

function renderProfileForm() {
  const d = profileData;
  document.getElementById("profileInfo").innerHTML = `
                <style>
                    .form-group { margin-bottom:18px; }
                    .form-group label { display:block; font-size:13px; font-weight:500; margin-bottom:6px; color:var(--dark); }
                    .form-group input { width:100%; padding:10px 14px; border:1px solid var(--border-light); border-radius:4px; font-family:'Montserrat',sans-serif; font-size:14px; color:var(--dark); background:#fafaf9; transition:border-color 0.2s; outline:none; }
                    .form-group input:focus { border-color:var(--primary); background:#fff; }
                    .form-group input:disabled { background:#f5f4f2; color:#aaa; cursor:not-allowed; }
                    .form-hint { font-size:11px; color:var(--gray); margin-top:4px; }
                    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
                    .msg-success { background:#d4edda; color:#155724; padding:10px 14px; border-radius:4px; font-size:13px; margin-bottom:16px; display:none; }
                    .msg-error   { background:#f8d7da; color:#721c24; padding:10px 14px; border-radius:4px; font-size:13px; margin-bottom:16px; display:none; }
                    .btn-save { padding:10px 28px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer; font-family:'Montserrat',sans-serif; font-weight:500; font-size:14px; transition:background 0.2s; }
                    .btn-save:hover { background:var(--primary-dark); }
                    .btn-cancel { padding:10px 20px; background:transparent; color:var(--gray); border:1px solid var(--border-light); border-radius:4px; cursor:pointer; font-family:'Montserrat',sans-serif; font-size:14px; margin-left:10px; transition:all 0.2s; }
                    .btn-cancel:hover { border-color:var(--gray); color:var(--dark); }
                    .section-divider { border:none; border-top:1px solid var(--border-light); margin:24px 0; }
                    .section-subtitle { font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:var(--gray); margin-bottom:16px; }
                </style>
                <div id="profileMsg" class="msg-success"></div>
                <div id="profileErr" class="msg-error"></div>

                <p class="section-subtitle">Dados Pessoais</p>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome completo</label>
                        <input type="text" id="editName" value="${d.name}" placeholder="Seu nome">
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="text" id="editPhone" value="${d.phone || ""}" placeholder="(11) 99999-9999">
                    </div>
                </div>
                <div class="form-group">
                    <label>CPF</label>
                    <input type="text" id="editCpf" value="${d.cpf || ""}" disabled>
                    <p class="form-hint">O CPF não pode ser alterado.</p>
                </div>

                <hr class="section-divider">
                <p class="section-subtitle">Alterar Senha <span style="font-size:11px;font-weight:400;text-transform:none;letter-spacing:0;color:var(--gray);">(opcional — deixe em branco para não alterar)</span></p>
                <div class="form-group">
                    <label>Senha atual</label>
                    <input type="password" id="currentPass" placeholder="••••••••">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nova senha</label>
                        <input type="password" id="newPass" placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label>Confirmar nova senha</label>
                        <input type="password" id="confirmPass" placeholder="••••••••">
                    </div>
                </div>
                <p class="form-hint">Mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo (@$!%*?&).</p>

                <div style="margin-top:24px;">
                    <button class="btn-save" onclick="saveProfile()">Salvar Alterações</button>
                    <button class="btn-cancel" onclick="renderProfileView(profileData)">Cancelar</button>
                </div>`;
}

async function saveProfile() {
  const name = document.getElementById("editName")?.value.trim();
  const phone = document.getElementById("editPhone")?.value.trim();
  const currentPass = document.getElementById("currentPass")?.value;
  const newPass = document.getElementById("newPass")?.value;
  const confirmPass = document.getElementById("confirmPass")?.value;

  const msgEl = document.getElementById("profileMsg");
  const errEl = document.getElementById("profileErr");
  msgEl.style.display = "none";
  errEl.style.display = "none";

  if (!name) {
    errEl.textContent = "O nome não pode estar vazio.";
    errEl.style.display = "block";
    return;
  }

  const querAlterarSenha = currentPass || newPass || confirmPass;
  if (querAlterarSenha) {
    if (!currentPass) {
      errEl.textContent = "Informe a senha atual.";
      errEl.style.display = "block";
      return;
    }
    if (!newPass) {
      errEl.textContent = "Informe a nova senha.";
      errEl.style.display = "block";
      return;
    }
    if (newPass !== confirmPass) {
      errEl.textContent = "As novas senhas não coincidem.";
      errEl.style.display = "block";
      return;
    }
  }

  try {
    const res = await auth.fetchWithAuth("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    if (!data.success) {
      let msg = data.message || "Erro ao salvar.";
      if (Array.isArray(data.errors) && data.errors.length) {
        msg = data.errors.map((e) => e.message).join(" • ");
      }
      errEl.textContent = msg;
      errEl.style.display = "block";
      return;
    }

    if (querAlterarSenha) {
      const resPass = await auth.fetchWithAuth("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPass,
          newPassword: newPass,
        }),
      });
      const dataPass = await resPass.json();
      if (!dataPass.success) {
        let msg = dataPass.message || "Erro ao alterar senha.";
        if (Array.isArray(dataPass.errors) && dataPass.errors.length) {
          msg = dataPass.errors.map((e) => e.message).join(" • ");
        }
        errEl.textContent = msg;
        errEl.style.display = "block";
        return;
      }
      if (dataPass.data?.token) {
        localStorage.setItem("token", dataPass.data.token);
        localStorage.setItem("authToken", dataPass.data.token);
      }
    }

    profileData.name = name;
    profileData.phone = phone;
    msgEl.textContent = querAlterarSenha
      ? "Dados e senha atualizados com sucesso!"
      : "Dados atualizados com sucesso!";
    msgEl.style.display = "block";
    setTimeout(() => renderProfileView(profileData), 1500);
  } catch (e) {
    errEl.textContent = "Erro de conexão. Tente novamente.";
    errEl.style.display = "block";
  }
}

function renderPasswordForm() {
  document.getElementById("profileInfo").innerHTML = `
                <style>
                    .form-group { margin-bottom:18px; }
                    .form-group label { display:block; font-size:13px; font-weight:500; margin-bottom:6px; }
                    .form-group input { width:100%; padding:10px 14px; border:1px solid var(--border-light); border-radius:4px; font-family:'Montserrat',sans-serif; font-size:14px; outline:none; transition:border-color 0.2s; }
                    .form-group input:focus { border-color:var(--primary); }
                    .pass-hint { font-size:11px; color:var(--gray); margin-top:4px; }
                    .forgot-pass-link { display:block; font-size:12px; color:var(--primary); text-decoration:none; margin-top:6px; cursor:pointer; background:none; border:none; padding:0; font-family:'Montserrat',sans-serif; }
                    .forgot-pass-link:hover { text-decoration:underline; }
                    .msg-success { background:#d4edda; color:#155724; padding:10px 14px; border-radius:4px; font-size:13px; margin-bottom:16px; display:none; }
                    .msg-error   { background:#f8d7da; color:#721c24; padding:10px 14px; border-radius:4px; font-size:13px; margin-bottom:16px; display:none; }
                    .btn-save { padding:10px 28px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer; font-family:'Montserrat',sans-serif; font-weight:500; font-size:14px; }
                    .btn-save:hover { background:var(--primary-dark); }
                    .btn-cancel { padding:10px 20px; background:transparent; color:var(--gray); border:1px solid var(--border-light); border-radius:4px; cursor:pointer; font-family:'Montserrat',sans-serif; font-size:14px; margin-left:10px; }
                    .btn-cancel:hover { border-color:var(--gray); color:var(--dark); }
                    .forgot-modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center; }
                    .forgot-modal-overlay.open { display:flex; }
                    .forgot-modal-box { background:#fff; border-radius:12px; padding:32px; max-width:400px; width:90%; box-shadow:0 20px 40px rgba(0,0,0,0.15); }
                    .forgot-modal-box h3 { font-family:'Cormorant Garamond',serif; font-size:22px; margin-bottom:8px; color:var(--dark); }
                    .forgot-modal-box p { font-size:13px; color:var(--gray); margin-bottom:20px; line-height:1.6; }
                    .forgot-modal-box input { width:100%; padding:11px 14px; border:1px solid var(--border-light); border-radius:4px; font-family:'Montserrat',sans-serif; font-size:14px; outline:none; margin-bottom:14px; }
                    .forgot-modal-box input:focus { border-color:var(--primary); }
                    .forgot-modal-actions { display:flex; gap:10px; justify-content:flex-end; }
                    .forgot-msg { font-size:12px; padding:8px 12px; border-radius:4px; margin-bottom:12px; display:none; }
                </style>

                <div id="passMsg" class="msg-success"></div>
                <div id="passErr" class="msg-error"></div>
                <div class="form-group">
                    <label>Senha atual</label>
                    <input type="password" id="currentPass" placeholder="••••••••">
                    <button class="forgot-pass-link" onclick="openForgotModal()">Esqueceu a senha?</button>
                </div>
                <div class="form-group">
                    <label>Nova senha</label>
                    <input type="password" id="newPass" placeholder="••••••••">
                    <p class="pass-hint">Mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo (@$!%*?&).</p>
                </div>
                <div class="form-group">
                    <label>Confirmar nova senha</label>
                    <input type="password" id="confirmPass" placeholder="••••••••">
                </div>
                <div style="margin-top:24px;">
                    <button class="btn-save" onclick="savePassword()">Alterar Senha</button>
                    <button class="btn-cancel" onclick="renderProfileView(profileData)">Cancelar</button>
                </div>

                <!-- Modal esqueci a senha -->
                <div class="forgot-modal-overlay" id="forgotModalAccount">
                    <div class="forgot-modal-box">
                        <h3>Esqueceu a senha?</h3>
                        <p>Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.</p>
                        <div class="forgot-msg" id="forgotAccMsg"></div>
                        <input type="email" id="forgotAccEmail" placeholder="seu@email.com">
                        <div class="forgot-modal-actions">
                            <button class="btn-cancel" onclick="closeForgotModal()">Cancelar</button>
                            <button class="btn-save" onclick="sendForgotEmail()">Enviar link</button>
                        </div>
                    </div>
                </div>`;
}

function openForgotModal() {
  const modal = document.getElementById("forgotModalAccount");
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  const emailInput = document.getElementById("forgotAccEmail");
  if (emailInput && profileData?.email) emailInput.value = profileData.email;
}

function closeForgotModal() {
  const modal = document.getElementById("forgotModalAccount");
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}

async function sendForgotEmail() {
  const email = document.getElementById("forgotAccEmail")?.value.trim();
  const msgEl = document.getElementById("forgotAccMsg");
  if (!email) {
    showForgotMsg("Digite seu e-mail.", "error");
    return;
  }

  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    showForgotMsg(
      "✅ Link enviado! Verifique sua caixa de entrada.",
      "success",
    );
    setTimeout(() => closeForgotModal(), 3000);
  } catch {
    showForgotMsg("Erro de conexão. Tente novamente.", "error");
  }
}

function showForgotMsg(msg, type) {
  const el = document.getElementById("forgotAccMsg");
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === "success" ? "#d4edda" : "#f8d7da";
  el.style.color = type === "success" ? "#155724" : "#721c24";
  el.style.display = "block";
}

async function savePassword() {
  const current = document.getElementById("currentPass").value;
  const newPass = document.getElementById("newPass").value;
  const confirm = document.getElementById("confirmPass").value;
  const msgEl = document.getElementById("passMsg");
  const errEl = document.getElementById("passErr");
  msgEl.style.display = "none";
  errEl.style.display = "none";

  if (!current || !newPass || !confirm) {
    errEl.textContent = "Preencha todos os campos.";
    errEl.style.display = "block";
    return;
  }
  if (newPass !== confirm) {
    errEl.textContent = "As senhas não coincidem.";
    errEl.style.display = "block";
    return;
  }

  try {
    const res = await auth.fetchWithAuth("/api/auth/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("authToken", data.data.token);
      }
      msgEl.textContent = "Senha alterada com sucesso!";
      msgEl.style.display = "block";
      setTimeout(() => renderProfileView(profileData), 1500);
    } else {
      let msg = data.message || "Erro ao alterar senha.";
      if (Array.isArray(data.errors) && data.errors.length) {
        msg = data.errors.map((e) => e.message).join(" • ");
      }
      errEl.textContent = msg;
      errEl.style.display = "block";
    }
  } catch (e) {
    errEl.textContent = "Erro de conexão. Tente novamente.";
    errEl.style.display = "block";
  }
}

async function loadOrders() {
  const el = document.getElementById("ordersList");
  el.innerHTML = "Carregando...";
  try {
    const res = await auth.fetchWithAuth("/api/orders");
    const data = await res.json();
    if (!data.success || !data.data?.length) {
      el.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Nenhum pedido ainda.</p><a href="/products">Explorar produtos →</a></div>`;
      return;
    }
    const statusLabel = {
      pending: "Aguardando",
      paid: "Pago",
      processing: "Preparando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    el.innerHTML = data.data
      .map(
        (o) => `
                    <a href="/orders" class="order-card order-card-link">
                        <div class="order-header">
                            <div>
                                <div class="order-number">#${o.order_number}</div>
                                <div class="order-date">${new Date(o.created_at).toLocaleDateString("pt-BR")}</div>
                            </div>
                            <span class="order-status status-${o.status}">${statusLabel[o.status] || o.status}</span>
                            <div class="order-total">R$ ${parseFloat(o.total_amount).toFixed(2)}</div>
                            <i class="fas fa-chevron-right" style="color:var(--gray);font-size:13px;"></i>
                        </div>
                    </a>`,
      )
      .join("");
  } catch (e) {
    el.innerHTML = "Erro ao carregar pedidos.";
  }
}

async function loadFavoritos() {
  const el = document.getElementById("favoritosList");
  el.innerHTML = "Carregando...";
  try {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token");
    const res = await fetch("/api/wishlist", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success || !data.data?.length) {
      el.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><p>Nenhum favorito ainda.</p><a href="/products">Explorar produtos →</a></div>`;
      return;
    }
    el.innerHTML = `<div class="fav-grid">${data.data
      .map((p) => {
        const price = p.promotional_price || p.price;
        return `<div class="fav-card" id="fav-${p.product_id}">
                        <a href="/product?id=${p.product_id}"><img src="${p.main_image}" alt="${p.name}"></a>
                        <div class="fav-card-info">
                            <h4><a href="/product?id=${p.product_id}">${p.name}</a></h4>
                            <div class="fav-card-price">R$ ${parseFloat(price).toFixed(2)}</div>
                            <div class="fav-card-actions">
                                <button class="btn-fav-remove" onclick="removeFavorito(${p.product_id})">
                                    <i class="far fa-trash-alt"></i> Remover
                                </button>
                            </div>
                        </div>
                    </div>`;
      })
      .join("")}</div>`;
  } catch (e) {
    el.innerHTML = "Erro ao carregar favoritos.";
  }
}

window.removeFavorito = async function (productId) {
  await Wishlist.toggle(productId);
  document.getElementById(`fav-${productId}`)?.remove();
  const grid = document.querySelector(".fav-grid");
  if (grid && !grid.children.length) loadFavoritos();
};

async function loadNavCategories() {
  try {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success && data.data.length) {
      const dropdown = document.getElementById("categoriesDropdown");
      if (dropdown) {
        let html = data.data
          .filter((c) => c.status === "active")
          .map(
            (cat) =>
              `<li><a href="/products?category=${cat.slug}">${cat.name}</a></li>`,
          )
          .join("");
        html += `<li class="view-all"><a href="/products">Ver Todas as Categorias</a></li>`;
        dropdown.innerHTML = html;
      }
    }
  } catch {}
}

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
document.getElementById("logoutSidebar").onclick = (e) => {
  e.preventDefault();
  auth.logout();
};

const urlTab = new URLSearchParams(window.location.search).get("tab");
if (urlTab === "pedidos" || urlTab === "orders") {
  showTab("pedidos", document.querySelector("#tabPedidos a"));
} else if (urlTab === "favoritos" || urlTab === "favorites") {
  showTab("favoritos", document.querySelector("#tabFavoritos a"));
} else {
  loadProfile();
}

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
