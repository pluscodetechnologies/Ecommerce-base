const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../middleware/auth");

const uploadDir = path.join(__dirname, "../../uploads/reviews");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas"));
  },
});

const IMAGE_MAGIC = [
  { bytes: [0xff, 0xd8, 0xff], type: "jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47], type: "png" },
  { bytes: [0x47, 0x49, 0x46], type: "gif" },
  { bytes: [0x52, 0x49, 0x46, 0x46], type: "webp" },
];

function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  return IMAGE_MAGIC.some(({ bytes }) =>
    bytes.every((b, i) => buffer[i] === b),
  );
}

router.post(
  "/review-image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "Nenhuma imagem enviada" });

      if (!isValidImageBuffer(req.file.buffer)) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Arquivo inválido. Envie uma imagem JPG, PNG, GIF ou WEBP.",
          });
      }

      const filename = `review_${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
      const filepath = path.join(uploadDir, filename);

      await sharp(req.file.buffer)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(filepath);

      const url = `/uploads/reviews/${filename}`;
      res.json({ success: true, url });
    } catch (e) {
      console.error("[upload-review-image]", e);
      res
        .status(500)
        .json({ success: false, message: "Erro ao processar imagem" });
    }
  },
);

module.exports = router;
