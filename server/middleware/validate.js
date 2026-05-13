function formatZodError(error) {
  return error.errors.map((e) => ({
    field: e.path.join(".") || "(root)",
    message: e.message,
  }));
}

function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            message: "Dados inválidos",
            errors: formatZodError(parsed.error),
          });
        }
        req.body = parsed.data;
      }

      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            message: "Parâmetros inválidos",
            errors: formatZodError(parsed.error),
          });
        }
        Object.assign(req.params, parsed.data);
      }

      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            message: "Query inválida",
            errors: formatZodError(parsed.error),
          });
        }
        Object.assign(req.query, parsed.data);
      }

      next();
    } catch (err) {
      console.error("[validate] erro:", err);
      res
        .status(500)
        .json({ success: false, message: "Erro ao validar requisição" });
    }
  };
}

module.exports = { validate };
