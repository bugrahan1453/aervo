/**
 * Video Worker
 * Processes video rendering jobs from the queue
 */

import { Worker, Job } from 'bullmq';
import { queueConnection } from '../../config/redis';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { OrderStatus } from '@prisma/client';
import { sendVideoReadyEmail, sendOrderFailedEmail } from '../../services/email.service';
import { VideoRenderJob } from '../../types';
import { env } from '../../config/env';

/**
 * Process video rendering job
 * Note: Actual video rendering happens in the separate video-processor service
 * This worker just updates order status and coordinates the workflow
 */
const processVideoJob = async (job: Job<VideoRenderJob>) => {
  const { orderId } = job.data;

  try {
    logger.info(`Processing video job for order ${orderId}`);

    // Update order status to PROCESSING
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PROCESSING,
        renderStartedAt: new Date(),
      },
    });

    // Update job progress
    await job.updateProgress(10);

    // The actual video rendering is done by the video-processor service
    // which listens to the same Redis queue
    // We just track the progress here

    // For now, we'll simulate the rendering process
    // In production, the video-processor service will update the order status

    logger.info(`Video processing started for order ${orderId}`);

    // Return job data for the video-processor service
    return {
      success: true,
      orderId,
      message: 'Job queued for video processor',
    };
  } catch (error) {
    logger.error(`Video job processing error for order ${orderId}:`, error);

    // Update order status to FAILED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    // Send failure email
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (order) {
        await sendOrderFailedEmail(order);
      }
    } catch (emailError) {
      logger.error('Failed to send failure email:', emailError);
    }

    throw error;
  }
};

/**
 * Job completed callback
 */
const onCompleted = async (job: Job) => {
  logger.info(`Video job completed: ${job.id}`);
};

/**
 * Job failed callback
 */
const onFailed = async (job: Job | undefined, error: Error) => {
  if (!job) return;

  logger.error(`Video job failed: ${job.id}`, error);

  const { orderId } = job.data;

  // Check if max retries reached
  if (job.attemptsMade >= (job.opts.attempts || 3)) {
    logger.error(`Max retries reached for order ${orderId}, moving to failed state`);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FAILED,
        errorMessage: `Max retries (${job.attemptsMade}) reached: ${error.message}`,
      },
    });

    // Send failure email
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (order) {
        await sendOrderFailedEmail(order);
      }
    } catch (emailError) {
      logger.error('Failed to send failure email:', emailError);
    }
  }
};

// Create worker
export const videoWorker = new Worker('video-processing', processVideoJob, {
  connection: queueConnection,
  concurrency: parseInt(env.QUEUE_CONCURRENCY, 10),
  limiter: {
    max: 10,
    duration: 60000, // 10 jobs per minute
  },
});

// Worker event listeners
videoWorker.on('completed', onCompleted);
videoWorker.on('failed', onFailed);

videoWorker.on('error', (error) => {
  logger.error('Worker error:', error);
});

videoWorker.on('stalled', (jobId) => {
  logger.warn(`Job ${jobId} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker...');
  await videoWorker.close();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker...');
  await videoWorker.close();
});

logger.info('Video worker started');
