/**
 * Email Service
 * Handles email sending with templates
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { EmailOptions, EmailTemplateData } from '../types';

// Create transporter
const transporter = nodemailer.createTransporter({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT, 10),
  secure: env.SMTP_SECURE === 'true',
  auth: env.SMTP_USER && env.SMTP_PASSWORD
    ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      }
    : undefined,
});

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `${env.SMTP_FROM_NAME} <${env.SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error('Email send error:', error);
    throw error;
  }
};

/**
 * Replace template variables
 */
const replaceTemplateVars = (template: string, data: EmailTemplateData): string => {
  let result = template;

  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(data[key]));
  });

  // Add default variables
  result = result.replace(/{{frontendUrl}}/g, env.FRONTEND_URL);
  result = result.replace(/{{appName}}/g, 'Aervo');
  result = result.replace(/{{year}}/g, new Date().getFullYear().toString());

  return result;
};

/**
 * Send email using template
 */
export const sendTemplateEmail = async (
  to: string,
  templateKey: string,
  data: EmailTemplateData
): Promise<void> => {
  try {
    // Get template from database
    const template = await prisma.emailTemplate.findUnique({
      where: { key: templateKey },
    });

    if (!template) {
      throw new Error(`Email template not found: ${templateKey}`);
    }

    // Replace variables in subject and body
    const subject = replaceTemplateVars(template.subject, data);
    const html = replaceTemplateVars(template.html, data);

    // Send email
    await sendEmail({ to, subject, html });
  } catch (error) {
    logger.error(`Template email send error (${templateKey}):`, error);
    throw error;
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName?: string
): Promise<void> => {
  await sendTemplateEmail(email, 'welcome', {
    firstName: firstName || 'Değerli Kullanıcı',
  });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (order: any): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: order.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const pkg = await prisma.package.findUnique({
    where: { type: order.packageType },
  });

  // Calculate estimated delivery
  const estimatedDelivery = order.isUrgent
    ? '2-6 saat'
    : order.packageType === 'STARTER'
    ? '24 saat'
    : order.packageType === 'PROFESSIONAL'
    ? '12 saat'
    : '6 saat';

  await sendTemplateEmail(user.email, 'order_confirmation', {
    firstName: user.firstName || 'Değerli Müşteri',
    orderNumber: order.orderNumber,
    packageName: pkg?.name || order.packageType,
    address: order.address,
    duration: order.duration,
    resolution: order.resolution,
    totalPrice: order.totalPrice.toFixed(2),
    estimatedDelivery,
  });
};

/**
 * Send video ready email
 */
export const sendVideoReadyEmail = async (order: any): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: order.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await sendTemplateEmail(user.email, 'video_ready', {
    firstName: user.firstName || 'Değerli Müşteri',
    orderNumber: order.orderNumber,
    address: order.address,
    duration: order.duration,
    resolution: order.resolution,
    thumbnailUrl: order.thumbnailUrl || `${env.FRONTEND_URL}/images/default-thumbnail.jpg`,
  });
};

/**
 * Send order failed email
 */
export const sendOrderFailedEmail = async (order: any): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: order.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await sendTemplateEmail(user.email, 'order_failed', {
    firstName: user.firstName || 'Değerli Müşteri',
    orderNumber: order.orderNumber,
  });
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    logger.info('Email configuration verified');
    return true;
  } catch (error) {
    logger.error('Email configuration error:', error);
    return false;
  }
};
