// Adicionar no server/routes/reviews.js (ou criar server/routes/uploads.js)
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');
const fs      = require('fs');
const { authMiddleware } = require('../middleware/auth');

// Garante que o diretório existe
const uploadDir = path.join(__dirname, '../../uploads/reviews');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer: memória (sharp processa antes de salvar)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Apenas imagens são permitidas'));
    }
});

// POST /api/uploads/review-image — requer login
router.post('/review-image',
    authMiddleware,
    upload.single('image'),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada' });

            const filename = `review_${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
            const filepath = path.join(uploadDir, filename);

            // Redimensiona e converte para webp (leve e universal)
            await sharp(req.file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 82 })
                .toFile(filepath);

            const url = `/uploads/reviews/${filename}`;
            res.json({ success: true, url });
        } catch (e) {
            console.error('[upload-review-image]', e);
            res.status(500).json({ success: false, message: 'Erro ao processar imagem' });
        }
    }
);

module.exports = router;