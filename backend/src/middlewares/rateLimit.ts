/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10), // 15 minutes
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10), // 100 requests per window
  message: {
    success: false,
    error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict limiter for auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Payment limiter
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  message: {
    success: false,
    error: 'Çok fazla ödeme denemesi. Lütfen daha sonra tekrar deneyin.',
  },
});

/**
 * Order creation limiter
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 orders per hour
  message: {
    success: false,
    error: 'Çok fazla sipariş oluşturma isteği. Lütfen daha sonra tekrar deneyin.',
  },
});
