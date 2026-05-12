const { z } = require('zod');

// ────────────────────────────────────────────────────────────────────
// Regex
// ────────────────────────────────────────────────────────────────────
const STRONG_PASSWORD = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const CPF_REGEX       = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const PHONE_REGEX     = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

// Mensagens reutilizáveis
const passwordMessage =
    'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um símbolo (@$!%*?&)';

// ────────────────────────────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────────────────────────────

const registerSchema = z.object({
    name:     z.string().trim().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
    email:    z.string().trim().toLowerCase().email('Email inválido').max(150),
    password: z.string().regex(STRONG_PASSWORD, passwordMessage),
    phone:    z.string().regex(PHONE_REGEX, 'Telefone inválido').optional().or(z.literal('')).nullable(),
    cpf:      z.string().regex(CPF_REGEX,   'CPF inválido').optional().or(z.literal('')).nullable(),
});

const loginSchema = z.object({
    email:    z.string().trim().toLowerCase().email('Email inválido'),
    password: z.string().min(1, 'Senha obrigatória').max(200),
});

const forgotPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email('Email inválido'),
});

const resetPasswordSchema = z.object({
    token:       z.string().min(32, 'Token inválido').max(128),
    newPassword: z.string().regex(STRONG_PASSWORD, passwordMessage),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual obrigatória').max(200),
    newPassword:     z.string().regex(STRONG_PASSWORD, passwordMessage),
});

const updateProfileSchema = z.object({
    name:  z.string().trim().min(2).max(100),
    phone: z.string().regex(PHONE_REGEX, 'Telefone inválido').optional().or(z.literal('')).nullable(),
});

const updateEmailSchema = z.object({
    newEmail: z.string().trim().toLowerCase().email('Email inválido').max(150),
    password: z.string().min(1, 'Confirme com sua senha atual').max(200),
});

const socialLoginSchema = z.object({
    provider:    z.enum(['google', 'facebook']),
    name:        z.string().trim().min(1).max(100),
    email:       z.string().trim().toLowerCase().email('Email inválido').max(150),
    provider_id: z.string().min(1).max(255),
    token:       z.string().min(10).max(4096).optional(), // id_token do Google p/ validação server-side
});

const refreshTokenSchema = z.object({
    // O refresh token vem do cookie httpOnly; este schema é só pra fallback / body opcional
    refreshToken: z.string().min(40).max(512).optional(),
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    updateProfileSchema,
    updateEmailSchema,
    socialLoginSchema,
    refreshTokenSchema,
};
