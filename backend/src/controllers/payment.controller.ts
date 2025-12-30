/**
 * Payment Controller
 * Handles payment processing endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import * as paymentService from '../services/payment.service';
import * as videoService from '../services/video.service';
import { sendOrderConfirmationEmail } from '../services/email.service';
import { asyncHandler } from '../middlewares/error';
import { ApiError } from '../middlewares/error';
import { logger } from '../utils/logger';

/**
 * Process payment
 * POST /api/payment/process
 */
export const processPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Kimlik doğrulama gerekli');
  }

  const { orderId, ...paymentData } = req.body;
  const ipAddress = req.ip || '127.0.0.1';

  // Process payment
  const result = await paymentService.createPayment(
    orderId,
    paymentData,
    req.user.userId,
    ipAddress
  );

  // If payment successful, queue order for processing
  if (result.success) {
    try {
      await videoService.queueOrderForProcessing(orderId);

      // Send order confirmation email (async)
      const order = await videoService.getOrderById(orderId);
      sendOrderConfirmationEmail(order).catch((err) =>
        logger.error('Order confirmation email error:', err)
      );
    } catch (error) {
      logger.error('Post-payment processing error:', error);
    }
  }

  res.json({
    success: true,
    data: result,
    message: 'Ödeme başarılı. Videonuz işleme alındı.',
  });
});

/**
 * Get payment status
 * GET /api/payment/:orderId/status
 */
export const getPaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Kimlik doğrulama gerekli');
  }

  const { orderId } = req.params;

  const order = await videoService.getOrderById(orderId, req.user.userId);

  res.json({
    success: true,
    data: {
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      paidAt: order.paidAt,
    },
  });
});
