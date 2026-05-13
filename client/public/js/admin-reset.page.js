const token = new URLSearchParams(window.location.search).get("token");

if (!token) {
  showFeedback(
    "Link inválido ou expirado. Solicite um novo link de recuperação.",
    "error",
  );
  document.getElementById("submitBtn").style.display = "none";
}

function toggleVis(id, btn) {
  const input = document.getElementById(id);
  const icon = btn.querySelector("i");
  if (input.type === "password") {
    input.type = "text";
    icon.className = "fas fa-eye-slash";
  } else {
    input.type = "password";
    icon.className = "fas fa-eye";
  }
}

function showFeedback(msg, type) {
  const el = document.getElementById("feedback");
  el.textContent = msg;
  el.className = "feedback " + type;
  el.style.display = "block";
}

async function submitReset() {
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const btn = document.getElementById("submitBtn");

  document.getElementById("feedback").style.display = "none";

  if (!newPassword || !confirmPassword) {
    showFeedback("Preencha todos os campos.", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    showFeedback("As senhas não coincidem.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      showFeedback(
        "✅ Senha redefinida com sucesso! Redirecionando...",
        "success",
      );
      btn.style.display = "none";
      setTimeout(() => (window.location.href = "/login"), 2500);
    } else {
      showFeedback(data.message || "Erro ao redefinir senha.", "error");
      btn.disabled = false;
      btn.textContent = "Redefinir Senha";
    }
  } catch {
    showFeedback("Erro de conexão. Tente novamente.", "error");
    btn.disabled = false;
    btn.textContent = "Redefinir Senha";
  }
}
