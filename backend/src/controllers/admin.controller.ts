/**
 * Admin Controller
 * Handles admin panel endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../config/database';
import { asyncHandler } from '../middlewares/error';
import { ApiError } from '../middlewares/error';
import { getQueueStats } from '../queues/video.queue';
import * as videoService from '../services/video.service';
import * as paymentService from '../services/payment.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * Get admin dashboard stats
 * GET /api/admin/dashboard
 */
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Today's stats
  const [todayOrders, todayRevenue] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: today }, paymentStatus: PaymentStatus.COMPLETED },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, paymentStatus: PaymentStatus.COMPLETED },
      _sum: { totalPrice: true },
    }),
  ]);

  // Weekly stats
  const [weeklyOrders, weeklyRevenue] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: weekAgo }, paymentStatus: PaymentStatus.COMPLETED },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: weekAgo }, paymentStatus: PaymentStatus.COMPLETED },
      _sum: { totalPrice: true },
    }),
  ]);

  // Monthly stats
  const [monthlyOrders, monthlyRevenue] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: monthAgo }, paymentStatus: PaymentStatus.COMPLETED },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthAgo }, paymentStatus: PaymentStatus.COMPLETED },
      _sum: { totalPrice: true },
    }),
  ]);

  // Queue stats
  const queueStats = await getQueueStats();

  // Total users
  const totalUsers = await prisma.user.count();

  // Popular locations
  const popularLocations = await prisma.popularLocation.findMany({
    orderBy: { orderCount: 'desc' },
    take: 10,
  });

  // Package distribution
  const packageStats = await prisma.order.groupBy({
    by: ['packageType'],
    where: { paymentStatus: PaymentStatus.COMPLETED },
    _count: true,
    _sum: { totalPrice: true },
  });

  const totalPackageOrders = packageStats.reduce((sum, p) => sum + p._count, 0);

  const packageDistribution = packageStats.map((stat) => ({
    packageType: stat.packageType,
    count: stat._count,
    percentage: (stat._count / totalPackageOrders) * 100,
    revenue: stat._sum.totalPrice || 0,
  }));

  res.json({
    success: true,
    data: {
      todaySales: todayOrders,
      todayRevenue: todayRevenue._sum.totalPrice || 0,
      weeklySales: weeklyOrders,
      weeklyRevenue: weeklyRevenue._sum.totalPrice || 0,
      monthlySales: monthlyOrders,
      monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
      activeRenders: queueStats.active,
      queuedOrders: queueStats.waiting,
      totalUsers,
      popularLocations,
      packageDistribution,
    },
  });
});

/**
 * Get all orders (admin)
 * GET /api/admin/orders
 */
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const status = req.query.status as string;
  const search = req.query.search as string;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Update order status (admin)
 * PUT /api/admin/orders/:id/status
 */
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  res.json({
    success: true,
    data: order,
    message: 'Sipariş durumu güncellendi',
  });
});

/**
 * Retry failed order
 * POST /api/admin/orders/:id/retry
 */
export const retryOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new ApiError(404, 'Sipariş bulunamadı');
  }

  if (order.status !== OrderStatus.FAILED) {
    throw new ApiError(400, 'Sadece başarısız siparişler yeniden denenebilir');
  }

  // Reset order and queue again
  await prisma.order.update({
    where: { id },
    data: {
      status: OrderStatus.PAID,
      errorMessage: null,
      retryCount: order.retryCount + 1,
    },
  });

  await videoService.queueOrderForProcessing(id);

  res.json({
    success: true,
    message: 'Sipariş yeniden işleme alındı',
  });
});

/**
 * Refund order
 * POST /api/admin/orders/:id/refund
 */
export const refundOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await paymentService.refundPayment(id);

  res.json({
    success: true,
    message: 'İade işlemi başarılı',
  });
});

/**
 * Get all users (admin)
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const search = req.query.search as string;

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        emailVerified: true,
        isBlocked: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Block/unblock user
 * PUT /api/admin/users/:id/block
 */
export const toggleBlockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isBlocked } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { isBlocked },
    select: {
      id: true,
      email: true,
      isBlocked: true,
    },
  });

  res.json({
    success: true,
    data: user,
    message: isBlocked ? 'Kullanıcı engellendi' : 'Kullanıcı engeli kaldırıldı',
  });
});

/**
 * Get/update settings
 * GET/PUT /api/admin/settings
 */
export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await prisma.setting.findMany({
    orderBy: { category: 'asc' },
  });

  // Group by category
  const grouped = settings.reduce((acc: any, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  res.json({
    success: true,
    data: grouped,
  });
});

export const updateSetting = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;

  const setting = await prisma.setting.update({
    where: { key },
    data: { value },
  });

  res.json({
    success: true,
    data: setting,
    message: 'Ayar güncellendi',
  });
});

/**
 * Get/update email templates
 */
export const getEmailTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { key: 'asc' },
  });

  res.json({
    success: true,
    data: templates,
  });
});

export const updateEmailTemplate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { key } = req.params;
    const { subject, html } = req.body;

    const template = await prisma.emailTemplate.update({
      where: { key },
      data: { subject, html },
    });

    res.json({
      success: true,
      data: template,
      message: 'Email şablonu güncellendi',
    });
  }
);

/**
 * Get/update packages
 */
export const getPackages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const packages = await prisma.package.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  res.json({
    success: true,
    data: packages,
  });
});

export const updatePackage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const pkg = await prisma.package.update({
    where: { id },
    data: req.body,
  });

  res.json({
    success: true,
    data: pkg,
    message: 'Paket güncellendi',
  });
});

/**
 * Sales report
 * GET /api/admin/reports/sales
 */
export const getSalesReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      paymentStatus: PaymentStatus.COMPLETED,
    },
    select: {
      createdAt: true,
      totalPrice: true,
      packageType: true,
    },
  });

  // Group by date
  const dailyStats = orders.reduce((acc: any, order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { orders: 0, revenue: 0 };
    }
    acc[date].orders += 1;
    acc[date].revenue += order.totalPrice;
    return acc;
  }, {});

  const reportData = Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
    date,
    orders: stats.orders,
    revenue: stats.revenue,
    averageOrderValue: stats.revenue / stats.orders,
  }));

  res.json({
    success: true,
    data: reportData,
  });
});

/**
 * System health
 * GET /api/admin/system/health
 */
export const getSystemHealth = asyncHandler(async (req: AuthRequest, res: Response) => {
  const queueStats = await getQueueStats();

  const health = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: 'healthy',
      redis: 'healthy',
      queue: queueStats.active > 0 ? 'active' : 'idle',
    },
    queue: queueStats,
  };

  res.json({
    success: true,
    data: health,
  });
});
