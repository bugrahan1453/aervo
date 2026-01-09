/**
 * Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır').optional(),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır').optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
});

// ============================================
// ORDER SCHEMAS
// ============================================

export const createOrderSchema = z.object({
  address: z.string().min(5, 'Adres en az 5 karakter olmalıdır'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  packageType: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  cameraAngles: z
    .array(z.enum(['spiral', 'zoom_in', 'orbit', 'flyover']))
    .min(1, 'En az bir kamera açısı seçilmelidir'),
  hasLogo: z.boolean().default(false),
  logoUrl: z.string().url().optional(),
  hasCustomMusic: z.boolean().default(false),
  customMusicUrl: z.string().url().optional(),
  isUrgent: z.boolean().default(false),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'PAID',
    'QUEUED',
    'PROCESSING',
    'RENDERING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
  ]),
});

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const createPaymentSchema = z.object({
  orderId: z.string().cuid(),
  cardHolderName: z.string().min(3, 'Kart sahibi adı gereklidir'),
  cardNumber: z.string().regex(/^\d{16}$/, 'Geçersiz kart numarası'),
  expireMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Geçersiz ay'),
  expireYear: z.string().regex(/^\d{4}$/, 'Geçersiz yıl'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Geçersiz CVC'),
  billingAddress: z.object({
    contactName: z.string().min(3, 'İletişim adı gereklidir'),
    city: z.string().min(2, 'Şehir gereklidir'),
    country: z.string().default('Turkey'),
    address: z.string().min(10, 'Adres en az 10 karakter olmalıdır'),
    zipCode: z.string().optional(),
  }),
});

// ============================================
// PACKAGE SCHEMAS
// ============================================

export const createPackageSchema = z.object({
  type: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  name: z.string().min(2, 'Paket adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  duration: z.number().min(10).max(300),
  resolution: z.string(),
  maxAngles: z.number().min(1).max(10),
  price: z.number().min(0),
  features: z.array(z.string()),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const updatePackageSchema = createPackageSchema.partial();

// ============================================
// USER SCHEMAS
// ============================================

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir'),
});

// ============================================
// ADMIN SCHEMAS
// ============================================

export const updateSettingSchema = z.object({
  value: z.string(),
});

export const updateEmailTemplateSchema = z.object({
  subject: z.string().min(1, 'Konu gereklidir'),
  html: z.string().min(1, 'HTML içeriği gereklidir'),
});

// ============================================
// PAGINATION SCHEMA
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
