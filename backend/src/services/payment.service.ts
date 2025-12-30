/**
 * Payment Service
 * Handles payment processing with Iyzico
 */

import Iyzipay from 'iyzipay';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../middlewares/error';
import { IyzicoPaymentRequest } from '../types';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// Initialize Iyzico
const iyzipay = new Iyzipay({
  apiKey: env.IYZICO_API_KEY || 'sandbox-api-key',
  secretKey: env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
  uri: env.IYZICO_BASE_URL,
});

/**
 * Create payment
 */
export const createPayment = async (
  orderId: string,
  paymentData: any,
  userId: string,
  ipAddress: string
): Promise<any> => {
  try {
    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new ApiError(404, 'Sipariş bulunamadı');
    }

    if (order.userId !== userId) {
      throw new ApiError(403, 'Bu siparişe erişim yetkiniz yok');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ApiError(400, 'Bu sipariş zaten ödenmiş veya işleme alınmış');
    }

    // Prepare Iyzico payment request
    const request: any = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: order.id,
      price: order.totalPrice.toFixed(2),
      paidPrice: order.totalPrice.toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      installment: '1',
      basketId: order.orderNumber,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,

      // Payment card
      paymentCard: {
        cardHolderName: paymentData.cardHolderName,
        cardNumber: paymentData.cardNumber,
        expireMonth: paymentData.expireMonth,
        expireYear: paymentData.expireYear,
        cvc: paymentData.cvc,
        registerCard: '0',
      },

      // Buyer
      buyer: {
        id: order.user.id,
        name: order.user.firstName || 'Ad',
        surname: order.user.lastName || 'Soyad',
        gsmNumber: order.user.phone || '+905555555555',
        email: order.user.email,
        identityNumber: '11111111111', // Required by Iyzico
        lastLoginDate: new Date().toISOString().split('T')[0] + ' 12:00:00',
        registrationDate: order.user.createdAt.toISOString().split('T')[0] + ' 12:00:00',
        registrationAddress: paymentData.billingAddress.address,
        ip: ipAddress,
        city: paymentData.billingAddress.city,
        country: paymentData.billingAddress.country || 'Turkey',
        zipCode: paymentData.billingAddress.zipCode || '34000',
      },

      // Shipping address
      shippingAddress: {
        contactName: paymentData.billingAddress.contactName,
        city: paymentData.billingAddress.city,
        country: paymentData.billingAddress.country || 'Turkey',
        address: paymentData.billingAddress.address,
        zipCode: paymentData.billingAddress.zipCode || '34000',
      },

      // Billing address
      billingAddress: {
        contactName: paymentData.billingAddress.contactName,
        city: paymentData.billingAddress.city,
        country: paymentData.billingAddress.country || 'Turkey',
        address: paymentData.billingAddress.address,
        zipCode: paymentData.billingAddress.zipCode || '34000',
      },

      // Basket items
      basketItems: [
        {
          id: order.id,
          name: `Drone Video - ${order.packageType}`,
          category1: 'Video Production',
          category2: 'Drone Video',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: order.totalPrice.toFixed(2),
        },
      ],
    };

    // Create payment
    return new Promise((resolve, reject) => {
      iyzipay.payment.create(request, async (err: any, result: any) => {
        if (err) {
          logger.error('Iyzico payment error:', err);
          reject(new ApiError(500, 'Ödeme işlemi başarısız'));
          return;
        }

        logger.info('Iyzico payment result:', result);

        // Check payment status
        if (result.status === 'success') {
          // Update order
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.PAID,
              paymentStatus: PaymentStatus.COMPLETED,
              paymentId: result.paymentId,
              paidAt: new Date(),
            },
          });

          // Create invoice
          await prisma.invoice.create({
            data: {
              invoiceNumber: `INV-${Date.now()}`,
              userId: order.userId,
              orderId: order.id,
              amount: order.totalPrice,
              currency: 'TRY',
              companyName: paymentData.billingAddress.companyName,
              taxNumber: paymentData.billingAddress.taxNumber,
              billingAddress: paymentData.billingAddress.address,
              city: paymentData.billingAddress.city,
              country: paymentData.billingAddress.country || 'TR',
            },
          });

          resolve({
            success: true,
            paymentId: result.paymentId,
            message: 'Ödeme başarılı',
          });
        } else {
          // Payment failed
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: PaymentStatus.FAILED,
              errorMessage: result.errorMessage,
            },
          });

          reject(new ApiError(400, result.errorMessage || 'Ödeme başarısız'));
        }
      });
    });
  } catch (error) {
    logger.error('Payment service error:', error);
    throw error;
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (orderId: string): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.paymentId) {
      throw new ApiError(404, 'Sipariş veya ödeme bulunamadı');
    }

    if (order.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new ApiError(400, 'Bu sipariş için iade yapılamaz');
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: order.id,
      paymentTransactionId: order.paymentId,
      price: order.totalPrice.toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      ip: '127.0.0.1',
    };

    return new Promise((resolve, reject) => {
      iyzipay.refund.create(request, async (err: any, result: any) => {
        if (err) {
          logger.error('Iyzico refund error:', err);
          reject(new ApiError(500, 'İade işlemi başarısız'));
          return;
        }

        if (result.status === 'success') {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.REFUNDED,
              paymentStatus: PaymentStatus.REFUNDED,
            },
          });

          resolve();
        } else {
          reject(new ApiError(400, result.errorMessage || 'İade başarısız'));
        }
      });
    });
  } catch (error) {
    logger.error('Refund service error:', error);
    throw error;
  }
};
