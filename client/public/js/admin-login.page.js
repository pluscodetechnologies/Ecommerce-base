(function () {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (token && user.role === "admin") {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 > Date.now())
        window.location.href = "/admin/dashboard";
    } catch {}
  }
})();

document
  .querySelector(".password-toggle")
  .addEventListener("click", function () {
    const input = this.parentElement.querySelector("input");
    const icon = this.querySelector("i");
    input.type = input.type === "password" ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
  });

let _pendingToken = null;
let _rememberMe = false;

document
  .getElementById("adminLoginForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("loginBtn");
    const errEl = document.getElementById("errorMessage");
    errEl.style.display = "none";
    btn.disabled = true;
    btn.innerHTML =
      '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Entrando...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.rememberMe = document.getElementById("rememberMe").checked;
    _rememberMe = data.rememberMe;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success && result.requires2FA) {
        _pendingToken = result.pendingToken;
        document.getElementById("step1").style.display = "none";
        document.getElementById("step2fa").style.display = "block";
        setTimeout(() => document.getElementById("totpCode").focus(), 100);
        return;
      }

      if (result.success) {
        const user = result.data.user;
        if (user.role !== "admin") {
          errEl.textContent = "Acesso negado. Apenas administradores.";
          errEl.style.display = "block";
          return;
        }
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("authToken", result.data.token);
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "/admin/dashboard";
      } else {
        let msg = result.message || "Erro ao fazer login.";
        if (Array.isArray(result.errors) && result.errors.length)
          msg = result.errors.map((e) => e.message).join(" • ");
        if (response.status === 429)
          msg = "Muitas tentativas. Aguarde alguns minutos.";
        errEl.textContent = msg;
        errEl.style.display = "block";
      }
    } catch {
      errEl.textContent = "Erro ao fazer login. Tente novamente.";
      errEl.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.innerHTML =
        '<i class="fas fa-sign-in-alt" style="margin-right:8px;"></i>Acessar Painel';
    }
  });

async function verifyTOTP() {
  const code = document.getElementById("totpCode").value.replace(/\D/g, "");
  const errEl = document.getElementById("errorMessage2fa");
  const btn = document.getElementById("verifyBtn");
  errEl.style.display = "none";

  if (code.length < 6) {
    errEl.textContent = "Digite o código de 6 dígitos.";
    errEl.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.innerHTML =
    '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Verificando...';

  try {
    const res = await fetch("/api/auth/2fa-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        pendingToken: _pendingToken,
        code,
        rememberMe: _rememberMe,
      }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("authToken", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      window.location.href = "/admin/dashboard";
    } else {
      errEl.textContent = data.message || "Código inválido.";
      errEl.style.display = "block";
      document.getElementById("totpCode").value = "";
      document.getElementById("totpCode").focus();
    }
  } catch {
    errEl.textContent = "Erro de conexão.";
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fas fa-check" style="margin-right:8px;"></i>Verificar';
  }
}

document.getElementById("totpCode").addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyTOTP();
});
document.getElementById("totpCode").addEventListener("input", function () {
  const v = this.value.replace(/\D/g, "");
  this.value = v;
  if (v.length === 6) verifyTOTP();
});

function goBack() {
  _pendingToken = null;
  document.getElementById("step2fa").style.display = "none";
  document.getElementById("step1").style.display = "block";
  document.getElementById("totpCode").value = "";
  document.getElementById("errorMessage2fa").style.display = "none";
}
