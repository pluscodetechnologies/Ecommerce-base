const { z } = require("zod");

const addItemSchema = z.object({
  productId: z.coerce.number().int().positive("Produto inválido"),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  color: z.string().trim().max(50).optional().nullable(),
  size: z.string().trim().max(20).optional().nullable(),
});

const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
});

const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const PHONE_REGEX = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
const CEP_REGEX = /^\d{5}-?\d{3}$/;

const shippingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email("Email inválido").max(150),
  phone: z.string().regex(PHONE_REGEX, "Telefone inválido"),
  cpf: z.string().regex(CPF_REGEX, "CPF inválido").optional().nullable(),
  street: z.string().trim().min(2).max(200),
  number: z.string().trim().min(1).max(20),
  complement: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal(""))
    .nullable(),
  neighborhood: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().length(2, "UF inválida"),
  zip_code: z.string().regex(CEP_REGEX, "CEP inválido"),
  cost: z.coerce.number().min(0).max(10000).optional(),
  shipping_name: z.string().trim().max(100).optional(),
});

const createOrderSchema = z.object({
  shipping: shippingSchema,
  payment: z.object({
    method: z.enum([
      "mercado_pago",
      "pix",
      "credit_card",
      "boleto",
      "checkout_pro",
    ]),
  }),
  coupon: z.string().trim().max(50).optional().nullable(),
});

const calculateShippingSchema = z.object({
  zipcode: z.string().regex(CEP_REGEX, "CEP inválido"),
  items: z
    .array(
      z.object({
        quantity: z.coerce.number().int().min(1).max(99),
      }),
    )
    .max(100)
    .optional(),
});

const validateCouponSchema = z.object({
  code: z.string().trim().min(1).max(50),
  userId: z.coerce.number().int().positive().optional().nullable(),
});

const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional().or(z.literal("")),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
  images: z.array(z.string().min(1).max(500)).max(5).optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive("ID inválido"),
});

const productIdParamSchema = z.object({
  productId: z.coerce.number().int().positive("ID de produto inválido"),
});

const addressSchema = z.object({
  street: z.string().trim().min(2, "Rua obrigatória").max(200),
  number: z.string().trim().min(1, "Número obrigatório").max(20),
  complement: z.string().trim().max(100).optional().or(z.literal("")).nullable(),
  neighborhood: z.string().trim().min(2, "Bairro obrigatório").max(100),
  city: z.string().trim().min(2, "Cidade obrigatória").max(100),
  state: z.string().trim().length(2, "UF inválida"),
  zip_code: z.string().regex(CEP_REGEX, "CEP inválido"),
  is_default: z.boolean().optional().default(false),
});

module.exports = {
  addItemSchema,
  updateItemSchema,
  createOrderSchema,
  calculateShippingSchema,
  validateCouponSchema,
  createReviewSchema,
  idParamSchema,
  productIdParamSchema,
  addressSchema,
};