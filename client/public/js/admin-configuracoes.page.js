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

function showFeedback(id, message, type) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.className = "feedback " + type;
  el.style.display = "block";
  setTimeout(function () {
    el.style.display = "none";
  }, 5000);
}

const themeToggle = document.getElementById("themeToggle");
const isDark = localStorage.getItem("adminTheme") === "dark";
themeToggle.checked = isDark;
updateThemeLabels(isDark);

themeToggle.addEventListener("change", function () {
  const dark = this.checked;
  if (dark) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("adminTheme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("adminTheme", "light");
  }
  updateThemeLabels(dark);
});

function updateThemeLabels(dark) {
  document.getElementById("labelLight").classList.toggle("active", !dark);
  document.getElementById("labelDark").classList.toggle("active", dark);
}

const savedLimit = localStorage.getItem("lowStockLimit") || "5";
document.getElementById("lowStockLimit").value = savedLimit;

document
  .getElementById("saveLowStockBtn")
  .addEventListener("click", function () {
    const val = parseInt(document.getElementById("lowStockLimit").value) || 5;
    localStorage.setItem("lowStockLimit", String(val));
    const btn = this;
    btn.textContent = "✓ Salvo!";
    setTimeout(function () {
      btn.textContent = "Salvar";
    }, 2000);
  });

document
  .getElementById("savePasswordBtn")
  .addEventListener("click", async () => {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const btn = document.getElementById("savePasswordBtn");

    if (!currentPassword || !newPassword || !confirmPassword)
      return showFeedback(
        "passwordFeedback",
        "Preencha todos os campos.",
        "error",
      );
    if (newPassword !== confirmPassword)
      return showFeedback(
        "passwordFeedback",
        "As senhas não coincidem.",
        "error",
      );

    btn.disabled = true;
    btn.textContent = "Salvando...";

    try {
      const res = await adminFetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();

      if (result.success) {
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
        showFeedback(
          "passwordFeedback",
          "Senha alterada com sucesso!",
          "success",
        );
      } else {
        showFeedback("passwordFeedback", result.message, "error");
      }
    } catch (e) {
      showFeedback("passwordFeedback", "Erro ao alterar senha.", "error");
    }

    btn.disabled = false;
    btn.textContent = "Salvar senha";
  });

async function load2FAStatus() {
  try {
    const res = await adminFetch("/api/admin/2fa/status");
    const data = await res.json();
    if (!data.success) return;
    update2FAUI(data.data.enabled);
  } catch {}
}

function update2FAUI(enabled) {
  const badge = document.getElementById("twoFaStatusBadge");
  const setup = document.getElementById("twoFaSetupSection");
  const disable = document.getElementById("twoFaDisableSection");
  const qrSec = document.getElementById("twoFaQrSection");

  badge.innerHTML = enabled
    ? '<span class="badge-2fa-on"><i class="fas fa-check-circle"></i> Ativo</span>'
    : '<span class="badge-2fa-off"><i class="fas fa-times-circle"></i> Inativo</span>';

  setup.style.display = enabled ? "none" : "block";
  disable.style.display = enabled ? "block" : "none";
  qrSec.style.display = "none";
}

async function setup2FA() {
  const btn = document.getElementById("btn2faSetup");
  btn.disabled = true;
  btn.innerHTML =
    '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Gerando QR...';
  try {
    const res = await adminFetch("/api/admin/2fa/setup");
    const data = await res.json();
    if (!data.success) {
      showFeedback(
        "twoFaFeedback",
        data.message || "Erro ao gerar QR code",
        "error",
      );
      return;
    }
    document.getElementById("qrCodeImg").src = data.data.qrCode;
    document.getElementById("totpSecretDisplay").textContent = data.data.secret;
    document.getElementById("twoFaSetupSection").style.display = "none";
    document.getElementById("twoFaQrSection").style.display = "block";
  } catch {
    showFeedback("twoFaFeedback", "Erro ao configurar 2FA", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fas fa-qrcode" style="margin-right:8px;"></i>Configurar 2FA';
  }
}

function cancelSetup2FA() {
  document.getElementById("twoFaQrSection").style.display = "none";
  document.getElementById("twoFaSetupSection").style.display = "block";
  document.getElementById("verifyTotpInput").value = "";
}

async function verifyAndEnable2FA() {
  const code = document
    .getElementById("verifyTotpInput")
    .value.replace(/\D/g, "");
  const btn = document.getElementById("btnVerifyTotp");
  if (code.length < 6) {
    showFeedback("twoFaFeedback", "Digite o código de 6 dígitos.", "error");
    return;
  }

  btn.disabled = true;
  btn.innerHTML =
    '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Ativando...';
  try {
    const res = await adminFetch("/api/admin/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.success) {
      showFeedback(
        "twoFaFeedback",
        "2FA ativado com sucesso! Ele será exigido no próximo login.",
        "success",
      );
      update2FAUI(true);
      document.getElementById("verifyTotpInput").value = "";
    } else {
      showFeedback(
        "twoFaFeedback",
        data.message || "Código inválido.",
        "error",
      );
      document.getElementById("verifyTotpInput").value = "";
      document.getElementById("verifyTotpInput").focus();
    }
  } catch {
    showFeedback("twoFaFeedback", "Erro ao verificar código.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fas fa-check" style="margin-right:8px;"></i>Confirmar e Ativar';
  }
}

async function disable2FA() {
  const code = document
    .getElementById("disableTotpInput")
    .value.replace(/\D/g, "");
  const btn = document.getElementById("btnDisableTotp");
  if (code.length < 6) {
    showFeedback(
      "twoFaFeedback",
      "Digite o código atual do autenticador.",
      "error",
    );
    return;
  }

  btn.disabled = true;
  btn.innerHTML =
    '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Desativando...';
  try {
    const res = await adminFetch("/api/admin/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.success) {
      showFeedback("twoFaFeedback", "2FA desativado.", "success");
      update2FAUI(false);
      document.getElementById("disableTotpInput").value = "";
    } else {
      showFeedback(
        "twoFaFeedback",
        data.message || "Código inválido.",
        "error",
      );
    }
  } catch {
    showFeedback("twoFaFeedback", "Erro ao desativar.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fas fa-times" style="margin-right:8px;"></i>Desativar 2FA';
  }
}

["verifyTotpInput", "disableTotpInput"].forEach(function (id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
    if (this.value.length === 6) {
      if (id === "verifyTotpInput") verifyAndEnable2FA();
      else disable2FA();
    }
  });
});

load2FAStatus();

document
  .getElementById("forgotPasswordLink")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("forgotPasswordLink");
    btn.textContent = "Enviando...";

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const result = await res.json();
      showFeedback(
        "passwordFeedback",
        `Link de redefinição enviado para ${user.email}`,
        "success",
      );
    } catch (e) {
      showFeedback("passwordFeedback", "Erro ao enviar email.", "error");
    }

    btn.innerHTML =
      '<i class="fas fa-question-circle"></i> Esqueceu sua senha?';
  });
