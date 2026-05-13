(function () {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get("order") || params.get("external_reference");
  if (!orderNumber) {
    window.location.href = "/orders";
    return;
  }

  document.getElementById("orderNumber").textContent = "Pedido #" + orderNumber;

  sessionStorage.removeItem("cartShipping");
  sessionStorage.removeItem("cartCoupon");
  localStorage.removeItem("cartSessionId");

  let attempts = 0;
  const MAX_ATTEMPTS = 24;

  async function checkOrderStatus() {
    try {
      const res = await fetch(`/api/checkout/status/${orderNumber}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!data.success) return;

      const isPaid =
        data.status === "processing" ||
        data.status === "paid" ||
        data.payment_status === "approved";
      const isPending =
        data.status === "pending" ||
        data.payment_status === "pending" ||
        data.payment_status === "in_process";

      if (isPaid) {
        document.getElementById("statusIcon").classList.remove("pending");
        document.getElementById("statusIconI").className = "fas fa-check";
        document.getElementById("statusTitle").textContent =
          "Pagamento Confirmado!";
        document.getElementById("statusSubtitle").textContent =
          "Seu pedido está confirmado e será processado em breve.";
        document.getElementById("statusBadge").textContent = "Pago";
        document.getElementById("statusBadge").className =
          "status-badge status-paid";
        document.getElementById("statusBadge").style.display = "inline-block";
        document.getElementById("pixInstructions").style.display = "none";
        document.getElementById("pollingIndicator").style.display = "none";
        return;
      }

      if (isPending) {
        document.getElementById("statusIcon").classList.add("pending");
        document.getElementById("statusIconI").className = "fas fa-clock";
        document.getElementById("statusTitle").textContent =
          "Aguardando Pagamento";
        document.getElementById("statusSubtitle").textContent =
          "Seu pedido foi criado. Complete o pagamento no app do Mercado Pago.";
        document.getElementById("statusBadge").textContent = "Pendente";
        document.getElementById("statusBadge").className =
          "status-badge status-pending";
        document.getElementById("statusBadge").style.display = "inline-block";
        document.getElementById("pixInstructions").style.display = "block";
        document.getElementById("pollingIndicator").style.display = "block";
      }

      attempts++;
      if (attempts < MAX_ATTEMPTS && isPending) {
        setTimeout(checkOrderStatus, 5000);
      } else {
        document.getElementById("pollingIndicator").style.display = "none";
      }
    } catch (e) {
      console.warn("Erro ao checar status:", e);
    }
  }

  setTimeout(checkOrderStatus, 2000);
})();
