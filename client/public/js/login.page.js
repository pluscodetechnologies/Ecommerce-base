window.fbAsyncInit = function () {
  FB.init({
    appId: "SEU_FACEBOOK_APP_ID",
    cookie: true,
    xfbml: true,
    version: "v19.0",
  });
};

const tabs = document.querySelectorAll(".auth-tab");
const forms = document.querySelectorAll(".auth-form");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetTab = tab.dataset.tab;

    tabs.forEach((t) => t.classList.remove("active"));
    forms.forEach((f) => f.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(targetTab + "Form").classList.add("active");

    document.getElementById("errorMessage").style.display = "none";
    document.getElementById("successMessage").style.display = "none";
  });
});

document.querySelectorAll(".switch-to-register").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="register"]').click();
  });
});

document.querySelectorAll(".switch-to-login").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector('[data-tab="login"]').click();
  });
});

document.querySelectorAll(".password-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.parentElement.querySelector("input");
    const icon = btn.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
});

document
  .querySelector('input[name="phone"]')
  .addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 0) {
      value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
      value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    }
    e.target.value = value;
  });

document
  .querySelector('input[name="cpf"]')
  .addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (value.length > 0) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    e.target.value = value;
  });

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      if (typeof auth !== "undefined") {
        auth.setSession(result.data.token, result.data.user);
      } else {
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("authToken", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
      }
      sessionStorage.removeItem("cartShipping");
      sessionStorage.removeItem("cartCoupon");

      document.getElementById("successMessage").textContent =
        "Login realizado com sucesso! Redirecionando...";
      document.getElementById("successMessage").style.display = "block";

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/";
      setTimeout(() => {
        window.location.href = redirect;
      }, 1500);
    } else {
      let msg = result.message || "Erro ao fazer login.";
      if (Array.isArray(result.errors) && result.errors.length) {
        msg = result.errors.map((e) => e.message).join(" • ");
      }
      document.getElementById("errorMessage").textContent = msg;
      document.getElementById("errorMessage").style.display = "block";
    }
  } catch (error) {
    document.getElementById("errorMessage").textContent =
      "Erro ao fazer login. Tente novamente.";
    document.getElementById("errorMessage").style.display = "block";
  }
});

document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(data.password)) {
      document.getElementById("errorMessage").textContent =
        "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo (@$!%*?&)";
      document.getElementById("errorMessage").style.display = "block";
      return;
    }

    if (data.password !== data.confirmPassword) {
      document.getElementById("errorMessage").textContent =
        "As senhas não coincidem";
      document.getElementById("errorMessage").style.display = "block";
      return;
    }

    delete data.confirmPassword;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        document.getElementById("successMessage").textContent =
          "Conta criada com sucesso! Você já pode fazer login.";
        document.getElementById("successMessage").style.display = "block";
        document.getElementById("errorMessage").style.display = "none";

        e.target.reset();

        setTimeout(() => {
          document.querySelector('[data-tab="login"]').click();
          document.getElementById("successMessage").style.display = "none";
        }, 2000);
      } else {
        let msg = result.message || "Erro ao criar conta.";
        if (Array.isArray(result.errors) && result.errors.length) {
          msg = result.errors.map((e) => e.message).join(" • ");
        }
        document.getElementById("errorMessage").textContent = msg;
        document.getElementById("errorMessage").style.display = "block";
      }
    } catch (error) {
      document.getElementById("errorMessage").textContent =
        "Erro ao criar conta. Tente novamente.";
      document.getElementById("errorMessage").style.display = "block";
    }
  });

const modal = document.getElementById("forgotPasswordModal");

let fpPendingToken = null;
let fpResetToken = null;

function fpShowStep(step) {
  document.getElementById("fpStep1").style.display = step === 1 ? "" : "none";
  document.getElementById("fpStep2").style.display = step === 2 ? "" : "none";
  document.getElementById("fpStep3").style.display = step === 3 ? "" : "none";
}

function fpReset() {
  fpPendingToken = null;
  fpResetToken = null;
  document.getElementById("recoveryEmail").value = "";
  document.getElementById("totpCode").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmNewPassword").value = "";
  fpShowStep(1);
  modal.style.display = "none";
}

document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
  e.preventDefault();
  fpReset();
  modal.style.display = "flex";
});

document.getElementById("closeModalBtn").addEventListener("click", fpReset);
document.getElementById("backToStep1Btn").addEventListener("click", () => {
  document.getElementById("totpCode").value = "";
  fpPendingToken = null;
  fpShowStep(1);
});
document.getElementById("cancelStep3Btn").addEventListener("click", fpReset);

modal.addEventListener("click", (e) => {
  if (e.target === modal) fpReset();
});

document.getElementById("totpCode").addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "").slice(0, 6);
  if (v.length > 3) v = v.slice(0, 3) + " " + v.slice(3);
  e.target.value = v;
});

document.getElementById("sendRecoveryBtn").addEventListener("click", async () => {
  const email = document.getElementById("recoveryEmail").value.trim();
  if (!email) { showToast("Digite seu e-mail"); return; }

  const btn = document.getElementById("sendRecoveryBtn");
  btn.disabled = true;
  btn.textContent = "Aguarde...";

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!result.success) {
      const msg = result.errors?.map(e => e.message).join(" • ") || result.message || "Erro ao processar.";
      showToast(msg, "error");
      return;
    }

    if (result.method === "totp") {
      fpPendingToken = result.pendingToken;
      fpShowStep(2);
      setTimeout(() => document.getElementById("totpCode").focus(), 100);
    } else {
      showToast("E-mail enviado! Verifique sua caixa de entrada.", "success");
      setTimeout(fpReset, 2500);
    }
  } catch {
    showToast("Erro de conexão. Tente novamente.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Continuar";
  }
});

document.getElementById("verifyTotpBtn").addEventListener("click", async () => {
  const raw = document.getElementById("totpCode").value.replace(/\s/g, "");
  if (raw.length !== 6) { showToast("O código deve ter 6 dígitos"); return; }

  const btn = document.getElementById("verifyTotpBtn");
  btn.disabled = true;
  btn.textContent = "Verificando...";

  try {
    const response = await fetch("/api/auth/verify-totp-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingToken: fpPendingToken, code: raw }),
    });

    const result = await response.json();

    if (!result.success) {
      showToast(result.message || "Código inválido.", "error");
      document.getElementById("totpCode").value = "";
      document.getElementById("totpCode").focus();
      return;
    }

    fpResetToken = result.resetToken;
    fpShowStep(3);
    setTimeout(() => document.getElementById("newPassword").focus(), 100);
  } catch {
    showToast("Erro de conexão. Tente novamente.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Verificar";
  }
});

document.getElementById("saveNewPasswordBtn").addEventListener("click", async () => {
  const newPwd = document.getElementById("newPassword").value;
  const confirmPwd = document.getElementById("confirmNewPassword").value;
  const STRONG = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!newPwd || !confirmPwd) { showToast("Preencha os dois campos"); return; }
  if (newPwd !== confirmPwd) { showToast("As senhas não coincidem", "error"); return; }
  if (!STRONG.test(newPwd)) {
    showToast("A senha deve ter mínimo 8 caracteres, letra maiúscula, número e símbolo (@$!%*?&)", "error");
    return;
  }

  const btn = document.getElementById("saveNewPasswordBtn");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: fpResetToken, newPassword: newPwd }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("Senha redefinida com sucesso! Faça login.", "success");
      setTimeout(fpReset, 2500);
    } else {
      const msg = result.errors?.map(e => e.message).join(" • ") || result.message || "Erro ao redefinir senha.";
      showToast(msg, "error");
    }
  } catch {
    showToast("Erro de conexão. Tente novamente.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar senha";
  }
});

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
          textEl.textContent = text;
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

function openModal(id) {
  document.getElementById(id).style.display = "block";
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
  document.body.style.overflow = "";
}
["termosModal", "privacidadeModal"].forEach(function (id) {
  document.getElementById(id).addEventListener("click", function (e) {
    if (e.target === this) closeModal(id);
  });
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeModal("termosModal");
    closeModal("privacidadeModal");
  }
});

const GOOGLE_CLIENT_ID = "SEU_GOOGLE_CLIENT_ID";

async function handleSocialLogin(provider, name, email, providerId) {
  try {
    const res = await fetch("/api/auth/social-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ provider, name, email, provider_id: providerId }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("authToken", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      const redirect =
        new URLSearchParams(window.location.search).get("redirect") || "/";
      window.location.href = redirect;
    } else {
      showToast(data.message || "Erro ao fazer login social.");
    }
  } catch (e) {
    showToast("Erro de conexão. Tente novamente.");
  }
}

function initGoogleLogin() {
  if (
    !window.google ||
    !GOOGLE_CLIENT_ID ||
    GOOGLE_CLIENT_ID === "SEU_GOOGLE_CLIENT_ID"
  )
    return;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      handleSocialLogin("google", payload.name, payload.email, payload.sub);
    },
  });
}

function triggerGoogleLogin() {
  if (!window.google || GOOGLE_CLIENT_ID === "SEU_GOOGLE_CLIENT_ID") {
    showToast("Login com Google não configurado.");
    return;
  }
  google.accounts.id.prompt();
}

window.addEventListener("load", initGoogleLogin);

["googleLoginBtn", "googleRegisterBtn"].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", triggerGoogleLogin);
});

function triggerFacebookLogin() {
  if (
    !window.FB ||
    document.querySelector('[appId="SEU_FACEBOOK_APP_ID"]') !== null
  ) {
  }
  if (typeof FB === "undefined") {
    showToast("Login com Facebook não configurado.");
    return;
  }
  FB.login(
    function (response) {
      if (response.authResponse) {
        FB.api("/me", { fields: "name,email" }, function (me) {
          if (me && me.name) {
            handleSocialLogin(
              "facebook",
              me.name,
              me.email || `fb_${me.id}@velvetatelier.com`,
              me.id,
            );
          }
        });
      }
    },
    { scope: "public_profile,email" },
  );
}

["facebookLoginBtn", "facebookRegisterBtn"].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", triggerFacebookLogin);
});

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