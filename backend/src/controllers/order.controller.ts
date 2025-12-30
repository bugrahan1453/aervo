/**
 * Order Controller
 * Handles video order endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import * as videoService from '../services/video.service';
import * as mapsService from '../services/maps.service';
import { asyncHandler } from '../middlewares/error';
import { ApiError } from '../middlewares/error';

/**
 * Create new order
 * POST /api/orders
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Kimlik doğrulama gerekli');
  }

  // Validate coordinates
  if (!mapsService.validateCoordinates(req.body.latitude, req.body.longitude)) {
    throw new ApiError(400, 'Geçersiz koordinatlar');
  }

  // Get location metadata
  const locationMeta = await mapsService.getLocationMetadata(
    req.body.latitude,
    req.body.longitude
  );

  // Create order
  const order = await videoService.createOrder(req.user.userId, req.body);

  // Update popular locations (async, don't block)
  videoService.updatePopularLocation(
    req.body.address,
    req.body.latitude,
    req.body.longitude,
    locationMeta.city
  );

  res.status(201).json({
    success: true,
    data: order,
    message: 'Sipariş oluşturuldu. Ödeme işlemini tamamlayın.',
  });
});

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const order = await videoService.getOrderById(id, userId);

  res.json({
    success: true,
    data: order,
  });
});

/**
 * Get user orders
 * GET /api/orders
 */
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Kimlik doğrulama gerekli');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await videoService.getUserOrders(req.user.userId, page, limit);

  res.json({
    success: true,
    data: result.orders,
    pagination: result.pagination,
  });
});

/**
 * Cancel order
 * POST /api/orders/:id/cancel
 */
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Kimlik doğrulama gerekli');
  }

  const { id } = req.params;

  const result = await videoService.cancelOrder(id, req.user.userId);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Get order video download URL
 * GET /api/orders/:id/download
 */
export const getDownloadUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Kimlik doğrulama gerekli');
  }

  const { id } = req.params;
  const order = await videoService.getOrderById(id, req.user.userId);

  if (!order.videoUrl) {
    throw new ApiError(400, 'Video henüz hazır değil');
  }

  res.json({
    success: true,
    data: {
      videoUrl: order.videoUrl,
      thumbnailUrl: order.thumbnailUrl,
    },
  });
});
