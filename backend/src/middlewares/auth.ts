/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token bulunamadı',
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = verifyAccessToken(token);

    // Check if user exists and not blocked
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Hesabınız engellenmiş',
      });
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Geçersiz veya süresi dolmuş token',
    });
  }
};

/**
 * Check if user is admin
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Kimlik doğrulama gerekli',
    });
  }

  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      error: 'Bu işlem için admin yetkisi gereklidir',
    });
  }

  next();
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    if (user && !user.isBlocked) {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};
