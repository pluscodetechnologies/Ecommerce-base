const express = require('express');
const router  = express.Router();

const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
    refreshLimiter,
} = require('../middleware/rateLimits');

const {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    updateProfileSchema,
    updateEmailSchema,
    socialLoginSchema,
} = require('../schemas/auth.schema');

// ── Públicas ──────────────────────────────────────────────────────────────────
router.post('/register',
    registerLimiter,
    validate({ body: registerSchema }),
    authController.register.bind(authController));

router.post('/login',
    loginLimiter,
    validate({ body: loginSchema }),
    authController.login.bind(authController));

router.post('/social-login',
    loginLimiter,
    validate({ body: socialLoginSchema }),
    authController.socialLogin.bind(authController));

router.post('/refresh',
    refreshLimiter,
    authController.refresh.bind(authController));

router.post('/logout',
    authController.logout.bind(authController));

router.post('/forgot-password',
    forgotPasswordLimiter,
    validate({ body: forgotPasswordSchema }),
    authController.forgotPassword.bind(authController));

router.post('/reset-password',
    resetPasswordLimiter,
    validate({ body: resetPasswordSchema }),
    authController.resetPassword.bind(authController));

// ── Protegidas ────────────────────────────────────────────────────────────────
router.get('/profile',
    authMiddleware,
    authController.getProfile.bind(authController));

router.put('/profile',
    authMiddleware,
    validate({ body: updateProfileSchema }),
    authController.updateProfile.bind(authController));

router.put('/change-password',
    authMiddleware,
    validate({ body: changePasswordSchema }),
    authController.changePassword.bind(authController));

router.put('/update-email',
    authMiddleware,
    validate({ body: updateEmailSchema }),
    authController.updateEmail.bind(authController));

router.post('/logout-all',
    authMiddleware,
    authController.logoutAll.bind(authController));

module.exports = router;
