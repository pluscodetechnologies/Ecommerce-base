require("dotenv").config();
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

resend.emails
  .send({
    from: "onboarding@resend.dev",
    to: ["pluscodebr@gmail.com"],
    subject: "Teste Velvet - Recuperacao de Senha",
    html: "<p>Funcionou! Seu sistema de email esta funcionando corretamente.</p>",
  })
  .then((r) => console.log("RESULTADO:", JSON.stringify(r, null, 2)))
  .catch((e) => console.error("ERRO:", e.message));
