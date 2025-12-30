/**
 * Auth Controller
 * Handles authentication endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/auth.service';
import { sendWelcomeEmail } from '../services/email.service';
import { asyncHandler } from '../middlewares/error';
import { logger } from '../utils/logger';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  // Send welcome email (don't await to not block response)
  sendWelcomeEmail(user.email, user.firstName).catch((err) =>
    logger.error('Welcome email error:', err)
  );

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    },
    message: 'Kayıt başarılı',
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
    },
    message: 'Giriş başarılı',
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Kimlik doğrulama gerekli',
    });
  }

  const user = await authService.getUserById(req.user.userId);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Kimlik doğrulama gerekli',
    });
  }

  const user = await authService.updateProfile(req.user.userId, req.body);

  res.json({
    success: true,
    data: user,
    message: 'Profil güncellendi',
  });
});

/**
 * Change password
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Kimlik doğrulama gerekli',
    });
  }

  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.user.userId, currentPassword, newPassword);

  res.json({
    success: true,
    message: 'Şifre başarıyla değiştirildi',
  });
});

/**
 * Logout (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Çıkış başarılı',
  });
});
