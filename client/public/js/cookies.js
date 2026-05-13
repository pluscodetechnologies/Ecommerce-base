(function () {
  "use strict";

  var STORAGE_KEY = "velvet_cookie_consent";

  if (localStorage.getItem(STORAGE_KEY)) return;

  var style = document.createElement("style");
  style.textContent = [
    "#vc-banner{",
    "position:fixed;bottom:0;left:0;right:0;z-index:99999;",
    "background:#1A1817;color:#fff;",
    "padding:20px 24px;",
    "box-shadow:0 -4px 24px rgba(0,0,0,0.25);",
    'font-family:"Montserrat",sans-serif;',
    "animation:vcSlideUp .4s ease;",
    "}",
    "@keyframes vcSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}",

    "#vc-banner .vc-inner{",
    "max-width:1200px;margin:0 auto;",
    "display:flex;align-items:center;gap:20px;flex-wrap:wrap;",
    "}",

    "#vc-banner .vc-text{flex:1;min-width:220px;font-size:13px;line-height:1.7;color:rgba(255,255,255,.80);}",
    "#vc-banner .vc-text strong{color:#fff;font-weight:600;}",
    "#vc-banner .vc-link{color:#C4A97D;text-decoration:underline;cursor:pointer;background:none;border:none;padding:0;font-size:inherit;font-family:inherit;line-height:inherit;display:inline;vertical-align:baseline;}",
    "#vc-banner .vc-link:hover{color:#fff;}",

    "#vc-banner .vc-actions{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;}",

    "#vc-banner .vc-btn{",
    'padding:10px 22px;border-radius:4px;font-family:"Montserrat",sans-serif;',
    "font-size:13px;font-weight:600;cursor:pointer;border:none;",
    "transition:all .2s;white-space:nowrap;letter-spacing:.5px;",
    "}",
    "#vc-btn-accept{background:#8B7355;color:#fff;}",
    "#vc-btn-accept:hover{background:#C4A97D;}",
    "#vc-btn-decline{background:transparent;color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.25) !important;}",
    "#vc-btn-decline:hover{border-color:rgba(255,255,255,.6) !important;color:#fff;}",

    ".vc-modal{",
    "display:none;position:fixed;inset:0;z-index:100000;",
    "background:rgba(0,0,0,.6);overflow-y:auto;",
    "}",
    ".vc-modal.open{display:block;}",

    ".vc-modal-box{",
    "background:#fff;max-width:720px;margin:40px auto 80px;",
    "border-radius:8px;overflow:hidden;",
    "box-shadow:0 20px 60px rgba(0,0,0,.35);",
    "}",

    ".vc-modal-head{",
    "display:flex;justify-content:space-between;align-items:center;",
    "padding:22px 30px;border-bottom:1px solid #E8E4E0;background:#FDFCFB;",
    "}",
    ".vc-modal-head h2{",
    'font-family:"Cormorant Garamond",serif;font-size:24px;',
    "font-weight:600;color:#1A1817;margin:0;",
    "}",
    ".vc-modal-close{",
    "background:none;border:none;font-size:26px;cursor:pointer;",
    "color:#aaa;line-height:1;padding:0 4px;",
    "}",
    ".vc-modal-close:hover{color:#1A1817;}",

    ".vc-modal-body{",
    "padding:28px 30px;font-size:13.5px;line-height:1.85;",
    "color:#444;max-height:68vh;overflow-y:auto;",
    "}",
    ".vc-modal-body h3{",
    'font-family:"Cormorant Garamond",serif;font-size:17px;',
    "font-weight:600;color:#1A1817;margin:24px 0 8px;",
    "}",
    ".vc-modal-body h3:first-child{margin-top:0;}",
    ".vc-modal-body p{margin:0 0 14px;}",
    ".vc-modal-body ul{margin:0 0 14px 20px;}",
    ".vc-modal-body ul li{margin-bottom:5px;}",
    ".vc-modal-body a{color:#8B7355;}",
    ".vc-modal-body .vc-meta{font-size:11px;color:#8B8581;margin-bottom:22px;}",

    ".vc-modal-foot{",
    "padding:18px 30px;border-top:1px solid #E8E4E0;text-align:right;",
    "}",
    ".vc-modal-foot button{",
    "padding:10px 28px;background:#8B7355;color:#fff;",
    "border:none;border-radius:4px;cursor:pointer;",
    'font-family:"Montserrat",sans-serif;font-size:13px;font-weight:600;',
    "}",
    ".vc-modal-foot button:hover{background:#6B5340;}",

    "@media(max-width:600px){",
    "#vc-banner{padding:16px;}",
    "#vc-banner .vc-inner{gap:14px;}",
    "#vc-banner .vc-text{font-size:12px;}",
    "#vc-banner .vc-actions{width:100%;justify-content:flex-end;}",
    "#vc-btn-accept,#vc-btn-decline{flex:1;text-align:center;}",
    ".vc-modal-box{margin:16px;border-radius:8px;}",
    ".vc-modal-head{padding:18px 20px;}",
    ".vc-modal-body{padding:20px;max-height:60vh;}",
    ".vc-modal-foot{padding:14px 20px;}",
    "}",
  ].join("");
  document.head.appendChild(style);

  var banner = document.createElement("div");
  banner.id = "vc-banner";
  banner.innerHTML = [
    '<div class="vc-inner">',
    '<p class="vc-text">',
    "<strong>🍪 Utilizamos cookies</strong> para melhorar sua experiência de navegação, ",
    "personalizar conteúdo e anúncios, e analisar nosso tráfego. ",
    "Ao continuar navegando, você concorda com nossa ",
    '<button class="vc-link" onclick="vcOpenModal(\'termos\')">Política de Cookies</button>, ',
    '<button class="vc-link" onclick="vcOpenModal(\'termos\')">Termos de Uso</button> e ',
    '<button class="vc-link" onclick="vcOpenModal(\'privacidade\')">Política de Privacidade</button>.',
    "</p>",
    '<div class="vc-actions">',
    '<button id="vc-btn-decline" class="vc-btn" onclick="vcDecline()">Recusar</button>',
    '<button id="vc-btn-accept"  class="vc-btn" onclick="vcAccept()">Aceitar todos</button>',
    "</div>",
    "</div>",
  ].join("");
  document.body.appendChild(banner);

  var modalTermos = document.createElement("div");
  modalTermos.id = "vc-modal-termos";
  modalTermos.className = "vc-modal";
  modalTermos.innerHTML = [
    '<div class="vc-modal-box">',
    '<div class="vc-modal-head">',
    "<h2>Termos de Uso</h2>",
    '<button class="vc-modal-close" onclick="vcCloseModal(\'termos\')">&times;</button>',
    "</div>",
    '<div class="vc-modal-body">',
    '<p class="vc-meta">Última atualização: maio de 2026</p>',

    "<h3>1. Aceitação dos Termos</h3>",
    "<p>Ao acessar e utilizar o site <strong>Velvet Atelier</strong> (velvetatelier.com.br), você declara ter lido, compreendido e concordado com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde, pedimos que não utilize nossos serviços.</p>",

    "<h3>2. Cadastro e Conta de Usuário</h3>",
    "<p>Para realizar compras, é necessário criar uma conta com informações verdadeiras e completas. Você é responsável pela confidencialidade de sua senha e por todas as atividades realizadas em sua conta. A Velvet Atelier pode recusar cadastros ou cancelar contas em caso de fraude ou violação destes Termos.</p>",

    "<h3>3. Produtos e Preços</h3>",
    "<p>Todos os produtos estão sujeitos à disponibilidade de estoque. Nos esforçamos para manter informações precisas, mas caso um produto seja listado com preço incorreto, reservamo-nos o direito de cancelar o pedido antes de qualquer cobrança. Os preços incluem impostos federais, mas não incluem o frete.</p>",

    "<h3>4. Pedidos e Pagamento</h3>",
    "<p>A confirmação do pedido está sujeita à aprovação do pagamento. A Velvet Atelier não armazena dados de cartão — todas as transações são processadas por gateways certificados e seguros. Pedidos com suspeita de fraude podem ser cancelados unilateralmente.</p>",

    "<h3>5. Entrega e Prazos</h3>",
    "<p>Os prazos de entrega são estimados e podem variar conforme a localização, modalidade de frete e disponibilidade da transportadora. Não nos responsabilizamos por atrasos decorrentes de greves, desastres naturais ou outros eventos de força maior. O cliente será informado por e-mail sobre o status do pedido.</p>",

    "<h3>6. Trocas e Devoluções</h3>",
    "<p>Nos termos do Código de Defesa do Consumidor (Lei nº 8.078/90), o cliente tem direito de arrependimento em até <strong>7 dias corridos</strong> após o recebimento. Para trocas por defeito: <strong>30 dias</strong> (não duráveis) e <strong>90 dias</strong> (duráveis). O produto deve ser devolvido na embalagem original, sem uso e com nota fiscal. Custos de envio por arrependimento são do cliente; por defeito ou erro nosso, arcamos com o frete.</p>",

    "<h3>7. Propriedade Intelectual</h3>",
    "<p>Todo o conteúdo do site — textos, imagens, logotipos, layout e software — é protegido por direitos autorais. É proibida a reprodução ou uso comercial sem autorização prévia por escrito.</p>",

    "<h3>8. Limitação de Responsabilidade</h3>",
    "<p>A Velvet Atelier não se responsabiliza por danos indiretos ou consequenciais, exceto nos casos previstos em lei. Nossa responsabilidade total fica limitada ao valor pago pelo produto em questão.</p>",

    "<h3>9. Uso de Cookies</h3>",
    "<p>Utilizamos cookies essenciais (necessários para o funcionamento do site), cookies de análise (para entender como o site é usado) e cookies de marketing (para personalizar anúncios). Você pode aceitar todos, recusar os não essenciais ou gerenciar suas preferências a qualquer momento nas configurações do seu navegador.</p>",

    "<h3>10. Legislação e Foro</h3>",
    '<p>Estes Termos são regidos pelo ordenamento jurídico brasileiro — CDC (Lei nº 8.078/90), Marco Civil da Internet (Lei nº 12.965/14) e LGPD (Lei nº 13.709/18). Fica eleito o foro de São Paulo/SP. Dúvidas: <a href="mailto:contato@velvetatelier.com">contato@velvetatelier.com</a></p>',
    "</div>",
    '<div class="vc-modal-foot"><button onclick="vcCloseModal(\'termos\')">Fechar</button></div>',
    "</div>",
  ].join("");
  document.body.appendChild(modalTermos);

  var modalPriv = document.createElement("div");
  modalPriv.id = "vc-modal-privacidade";
  modalPriv.className = "vc-modal";
  modalPriv.innerHTML = [
    '<div class="vc-modal-box">',
    '<div class="vc-modal-head">',
    "<h2>Política de Privacidade</h2>",
    '<button class="vc-modal-close" onclick="vcCloseModal(\'privacidade\')">&times;</button>',
    "</div>",
    '<div class="vc-modal-body">',
    '<p class="vc-meta">Última atualização: maio de 2026 &nbsp;|&nbsp; Em conformidade com a LGPD (Lei nº 13.709/2018)</p>',

    "<h3>1. Quem Somos</h3>",
    '<p>A <strong>Velvet Atelier</strong> é responsável pelo tratamento dos seus dados pessoais. Para questões de privacidade, contate nosso DPO: <a href="mailto:privacidade@velvetatelier.com">privacidade@velvetatelier.com</a>.</p>',

    "<h3>2. Dados que Coletamos</h3>",
    "<ul>",
    "<li><strong>Cadastro:</strong> nome, CPF, e-mail, telefone.</li>",
    "<li><strong>Entrega:</strong> endereço completo.</li>",
    "<li><strong>Pagamento:</strong> processado pelo gateway; não armazenamos dados de cartão.</li>",
    "<li><strong>Navegação:</strong> IP, dispositivo, navegador, páginas visitadas (via cookies).</li>",
    "<li><strong>Transações:</strong> histórico de pedidos, produtos visualizados, carrinho.</li>",
    "</ul>",

    "<h3>3. Como Usamos seus Dados</h3>",
    "<ul>",
    "<li>Processar e entregar pedidos (execução de contrato — art. 7º, V).</li>",
    "<li>Enviar confirmações e atualizações de entrega (execução de contrato).</li>",
    "<li>Enviar ofertas e novidades, <strong>somente com seu consentimento</strong> (art. 7º, I).</li>",
    "<li>Cumprir obrigações fiscais — nota fiscal (obrigação legal — art. 7º, II).</li>",
    "<li>Prevenir fraudes e garantir segurança (legítimo interesse — art. 7º, IX).</li>",
    "<li>Melhorar a experiência de navegação (legítimo interesse).</li>",
    "</ul>",

    "<h3>4. Compartilhamento</h3>",
    "<p>Não vendemos nem alugamos seus dados. Compartilhamos apenas com transportadoras (para entrega), gateways de pagamento certificados e, se você consentiu, com serviços de e-mail marketing. Todos os parceiros são obrigados contratualmente a respeitar a LGPD.</p>",

    "<h3>5. Cookies</h3>",
    "<p>Usamos cookies essenciais (necessários para o funcionamento), de análise (tráfego e comportamento) e de marketing (personalização). Você pode gerenciar preferências nas configurações do seu navegador. Cookies essenciais não podem ser desativados sem comprometer o funcionamento do site.</p>",

    "<h3>6. Segurança</h3>",
    "<p>Adotamos criptografia SSL/TLS, controle de acesso restrito e monitoramento contínuo. Em caso de incidente de segurança, você será notificado conforme exige a LGPD.</p>",

    "<h3>7. Retenção de Dados</h3>",
    "<p>Dados são mantidos pelo tempo necessário à finalidade ou por exigência legal (dados fiscais: mínimo 5 anos). Após isso, são anonimizados ou excluídos.</p>",

    "<h3>8. Seus Direitos (LGPD — art. 18)</h3>",
    "<ul>",
    "<li><strong>Confirmação e acesso</strong> aos seus dados.</li>",
    "<li><strong>Correção</strong> de dados incompletos ou desatualizados.</li>",
    "<li><strong>Exclusão</strong> dos dados tratados com base no consentimento.</li>",
    "<li><strong>Portabilidade</strong> em formato estruturado.</li>",
    "<li><strong>Revogação do consentimento</strong> a qualquer momento.</li>",
    "<li><strong>Oposição</strong> a tratamentos por legítimo interesse.</li>",
    "<li><strong>Reclamação à ANPD</strong> (Autoridade Nacional de Proteção de Dados).</li>",
    "</ul>",
    '<p>Para exercer seus direitos: <a href="mailto:privacidade@velvetatelier.com">privacidade@velvetatelier.com</a></p>',

    "<h3>9. Alterações nesta Política</h3>",
    "<p>Atualizações relevantes serão comunicadas por e-mail. O uso contínuo do site implica aceitação das novas condições.</p>",
    "</div>",
    '<div class="vc-modal-foot"><button onclick="vcCloseModal(\'privacidade\')">Fechar</button></div>',
    "</div>",
  ].join("");
  document.body.appendChild(modalPriv);

  window.vcAccept = function () {
    localStorage.setItem(STORAGE_KEY, "accepted");
    hideBanner();
  };

  window.vcDecline = function () {
    localStorage.setItem(STORAGE_KEY, "declined");
    hideBanner();
  };

  window.vcOpenModal = function (which) {
    var el = document.getElementById("vc-modal-" + which);
    if (el) {
      el.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  };

  window.vcCloseModal = function (which) {
    var el = document.getElementById("vc-modal-" + which);
    if (el) {
      el.classList.remove("open");
      document.body.style.overflow = "";
    }
  };

  function hideBanner() {
    var b = document.getElementById("vc-banner");
    if (!b) return;
    b.style.transition = "transform .35s ease, opacity .35s ease";
    b.style.transform = "translateY(100%)";
    b.style.opacity = "0";
    setTimeout(function () {
      b.remove();
    }, 380);
  }

  [modalTermos, modalPriv].forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m) vcCloseModal(m.id.replace("vc-modal-", ""));
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      vcCloseModal("termos");
      vcCloseModal("privacidade");
    }
  });
})();
