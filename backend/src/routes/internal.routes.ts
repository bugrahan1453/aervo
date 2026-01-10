/**
 * Internal Routes
 * Routes for internal services (video-processor, etc.)
 * Protected by API key authentication
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError, asyncHandler } from '../middlewares/error';
import { OrderStatus } from '@prisma/client';

const router = Router();

/**
 * Middleware: Verify internal API key
 */
const verifyInternalApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-internal-api-key'] as string;
  const validApiKey = process.env.INTERNAL_API_KEY || 'development-internal-key-change-in-production';

  if (!apiKey || apiKey !== validApiKey) {
    throw new ApiError(401, 'Invalid internal API key');
  }

  next();
};

// Apply API key middleware to all internal routes
router.use(verifyInternalApiKey);

/**
 * Update order status (from video-processor)
 * POST /api/internal/orders/:id/status
 */
router.post(
  '/orders/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, videoUrl, thumbnailUrl, error } = req.body;

    const updateData: any = { status };

    if (videoUrl) updateData.videoUrl = videoUrl;
    if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;
    if (error) updateData.errorMessage = error;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: order,
      message: 'Order status updated',
    });
  })
);

/**
 * Health check for internal services
 * GET /api/internal/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Internal API healthy' });
});

export default router;
