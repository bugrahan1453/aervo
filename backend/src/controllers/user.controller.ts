/**
 * User Controller
 * Handles user-related endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../config/database';
import { asyncHandler } from '../middlewares/error';
import { ApiError } from '../middlewares/error';

/**
 * Get user dashboard stats
 * GET /api/user/stats
 */
export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Kimlik doğrulama gerekli');
  }

  const [totalOrders, completedOrders, pendingOrders, totalSpent] = await Promise.all([
    prisma.order.count({
      where: { userId: req.user.userId },
    }),
    prisma.order.count({
      where: { userId: req.user.userId, status: 'COMPLETED' },
    }),
    prisma.order.count({
      where: { userId: req.user.userId, status: { in: ['PENDING', 'PAID', 'QUEUED', 'PROCESSING', 'RENDERING'] } },
    }),
    prisma.order.aggregate({
      where: { userId: req.user.userId, paymentStatus: 'COMPLETED' },
      _sum: { totalPrice: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      completedOrders,
      pendingOrders,
      totalSpent: totalSpent._sum.totalPrice || 0,
    },
  });
});

/**
 * Get user invoices
 * GET /api/user/invoices
 */
export const getUserInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Kimlik doğrulama gerekli');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: req.user.userId },
      include: {
        order: {
          select: {
            orderNumber: true,
            address: true,
            packageType: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({
      where: { userId: req.user.userId },
    }),
  ]);

  res.json({
    success: true,
    data: invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get available packages
 * GET /api/user/packages
 */
export const getPackages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({
    success: true,
    data: packages,
  });
});
