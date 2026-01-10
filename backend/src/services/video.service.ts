/**
 * Video Service
 * Handles video order creation and queue management
 */

import { prisma } from '../config/database';
import { ApiError } from '../middlewares/error';
import { OrderStatus, PackageType, PaymentStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { CameraAngle } from '../types';
import { videoQueue } from '../queues/video.queue';

/**
 * Create new video order
 */
export const createOrder = async (
  userId: string,
  data: {
    address: string;
    latitude: number;
    longitude: number;
    packageType: PackageType;
    cameraAngles: CameraAngle[];
    hasLogo?: boolean;
    logoUrl?: string;
    hasCustomMusic?: boolean;
    customMusicUrl?: string;
    isUrgent?: boolean;
  }
) => {
  try {
    // Get package details
    const pkg = await prisma.package.findUnique({
      where: { type: data.packageType },
    });

    if (!pkg || !pkg.isActive) {
      throw new ApiError(404, 'Paket bulunamadı veya aktif değil');
    }

    // For FREE package, use all camera angles if not specified or less than max
    if (data.packageType === PackageType.FREE && data.cameraAngles.length < pkg.maxAngles) {
      data.cameraAngles = [
        CameraAngle.SPIRAL,
        CameraAngle.ZOOM_IN,
        CameraAngle.ORBIT,
        CameraAngle.FLYOVER,
      ];
    }

    // Validate camera angles count
    if (data.cameraAngles.length > pkg.maxAngles) {
      throw new ApiError(
        400,
        `Bu paket için maksimum ${pkg.maxAngles} kamera açısı seçebilirsiniz`
      );
    }

    // Calculate pricing
    let basePrice = pkg.price;
    let addonsPrice = 0;

    // Logo addon
    if (data.hasLogo) {
      const logoAddonPrice = await getSetting('addon_logo_price');
      addonsPrice += parseFloat(logoAddonPrice);
    }

    // Custom music addon
    if (data.hasCustomMusic) {
      const musicAddonPrice = await getSetting('addon_custom_music_price');
      addonsPrice += parseFloat(musicAddonPrice);
    }

    // Urgent delivery fee
    let urgentFee = 0;
    if (data.isUrgent) {
      const urgentMultiplier = await getSetting('addon_urgent_multiplier');
      urgentFee = (basePrice + addonsPrice) * (parseFloat(urgentMultiplier) - 1);
    }

    const totalPrice = basePrice + addonsPrice + urgentFee;

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `AER-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, '0')}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        packageType: data.packageType,
        duration: pkg.duration,
        resolution: pkg.resolution,
        cameraAngles: data.cameraAngles,
        hasLogo: data.hasLogo || false,
        logoUrl: data.logoUrl,
        hasCustomMusic: data.hasCustomMusic || false,
        customMusicUrl: data.customMusicUrl,
        isUrgent: data.isUrgent || false,
        basePrice,
        addonsPrice,
        urgentFee,
        totalPrice,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    logger.info(`Order created: ${order.orderNumber}`);

    return order;
  } catch (error) {
    logger.error('Create order error:', error);
    throw error;
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string, userId?: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      invoice: true,
    },
  });

  if (!order) {
    throw new ApiError(404, 'Sipariş bulunamadı');
  }

  // Check if user has access to this order
  if (userId && order.userId !== userId) {
    throw new ApiError(403, 'Bu siparişe erişim yetkiniz yok');
  }

  return order;
};

/**
 * Get user orders
 */
export const getUserOrders = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: true,
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Add order to video processing queue
 */
export const queueOrderForProcessing = async (orderId: string) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new ApiError(404, 'Sipariş bulunamadı');
    }

    // FREE paketler ödeme gerektirmez, PENDING durumunda queue'ya alınabilir
    if (order.totalPrice > 0 && order.status !== OrderStatus.PAID) {
      throw new ApiError(400, 'Sipariş henüz ödenmemiş');
    }

    // Update order status to QUEUED or PAID if it's FREE
    const newStatus = order.totalPrice === 0 ? OrderStatus.PAID : order.status;
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.QUEUED,
        paymentStatus: order.totalPrice === 0 ? 'COMPLETED' : order.paymentStatus,
        paidAt: order.totalPrice === 0 && !order.paidAt ? new Date() : order.paidAt,
      },
    });

    // Add to queue
    await videoQueue.add(
      'process-video',
      {
        orderId: order.id,
        address: order.address,
        latitude: order.latitude,
        longitude: order.longitude,
        duration: order.duration,
        resolution: order.resolution,
        cameraAngles: order.cameraAngles,
        hasLogo: order.hasLogo,
        logoUrl: order.logoUrl,
        hasCustomMusic: order.hasCustomMusic,
        customMusicUrl: order.customMusicUrl,
      },
      {
        priority: order.isUrgent ? 1 : 10,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    logger.info(`Order queued for processing: ${order.orderNumber}`);

    return order;
  } catch (error) {
    logger.error('Queue order error:', error);
    throw error;
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await getOrderById(orderId, userId);

  if (order.status === OrderStatus.COMPLETED) {
    throw new ApiError(400, 'Tamamlanmış siparişler iptal edilemez');
  }

  if (order.status === OrderStatus.RENDERING || order.status === OrderStatus.PROCESSING) {
    throw new ApiError(400, 'İşleniyor olan siparişler iptal edilemez');
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELLED },
  });

  logger.info(`Order cancelled: ${order.orderNumber}`);

  return { message: 'Sipariş iptal edildi' };
};

/**
 * Update popular location stats
 */
export const updatePopularLocation = async (
  address: string,
  latitude: number,
  longitude: number,
  city?: string
) => {
  try {
    const existing = await prisma.popularLocation.findUnique({
      where: {
        latitude_longitude: {
          latitude,
          longitude,
        },
      },
    });

    if (existing) {
      await prisma.popularLocation.update({
        where: { id: existing.id },
        data: {
          orderCount: existing.orderCount + 1,
          lastOrderAt: new Date(),
        },
      });
    } else {
      await prisma.popularLocation.create({
        data: {
          address,
          latitude,
          longitude,
          city,
          orderCount: 1,
          lastOrderAt: new Date(),
        },
      });
    }
  } catch (error) {
    // Don't fail order creation if this fails
    logger.error('Update popular location error:', error);
  }
};

/**
 * Get setting value
 */
const getSetting = async (key: string): Promise<string> => {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  return setting?.value || '0';
};
