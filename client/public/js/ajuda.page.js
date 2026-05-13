if (typeof AuthManager !== "undefined") new AuthManager();
if (typeof CartManager !== "undefined") new CartManager();

fetch("/api/alerts")
  .then((r) => r.json())
  .then((d) => {
    if (d.success && d.data.length) {
      const msg = d.data.filter((a) => a.is_active)[0];
      if (msg) {
        document.getElementById("headerTop").style.display = "block";
        var txt = (msg.title ? msg.title + " — " : "") + msg.message;
        var el = document.getElementById("headerTopText");
        if (el) {
          el.textContent = txt;
          var topBar = document.getElementById("headerTop");
          if (txt.length > 60) {
            el.outerHTML =
              '<div class="header-top-marquee" id="headerTopText"><div class="marquee-inner"><span>' +
              txt +
              "</span><span>" +
              txt +
              "</span></div></div>";
          }
        }
      }
    }
  });

function toggleAccordion(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector(".accordion-icon");
  const isOpen = body.classList.contains("open");
  document.querySelectorAll(".accordion-body.open").forEach((b) => {
    b.classList.remove("open");
    b.previousElementSibling.classList.remove("open");
    b.previousElementSibling
      .querySelector(".accordion-icon")
      .classList.remove("open");
  });
  if (!isOpen) {
    body.classList.add("open");
    header.classList.add("open");
    icon.classList.add("open");
  }
}

function openModal() {
  document.getElementById("contactModal").classList.add("open");
}
function closeModal() {
  document.getElementById("contactModal").classList.remove("open");
}

function toggleModal(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector(".modal-accordion-icon");
  const isOpen = body.classList.contains("open");
  document.querySelectorAll(".modal-accordion-body.open").forEach((b) => {
    b.classList.remove("open");
    b.previousElementSibling
      .querySelector(".modal-accordion-icon")
      .classList.remove("open");
  });
  if (!isOpen) {
    body.classList.add("open");
    icon.classList.add("open");
  }
}

const sections = document.querySelectorAll(".help-section");
const navLinks = document.querySelectorAll(".help-nav a");
window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((s) => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });
  navLinks.forEach((a) => {
    a.classList.remove("active");
    if (a.getAttribute("href") === "#" + current) a.classList.add("active");
  });
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
