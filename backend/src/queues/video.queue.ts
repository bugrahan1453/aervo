/**
 * Video Processing Queue
 * BullMQ queue for video rendering jobs
 */

import { Queue, Worker, Job } from 'bullmq';
import { queueConnection } from '../config/redis';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Create queue
export const videoQueue = new Queue('video-processing', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: parseInt(env.MAX_RENDER_RETRIES, 10),
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 3600 * 24 * 7, // Keep for 7 days
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

// Queue event listeners
videoQueue.on('waiting', (jobId) => {
  logger.info(`Job ${jobId} is waiting in queue`);
});

videoQueue.on('active', (job) => {
  logger.info(`Job ${job.id} started processing`);
});

videoQueue.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

videoQueue.on('failed', (job, error) => {
  logger.error(`Job ${job?.id} failed:`, error);
});

videoQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

// Helper functions

/**
 * Get queue stats
 */
export const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    videoQueue.getWaitingCount(),
    videoQueue.getActiveCount(),
    videoQueue.getCompletedCount(),
    videoQueue.getFailedCount(),
    videoQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + delayed,
  };
};

/**
 * Get job by ID
 */
export const getJob = async (jobId: string) => {
  return await videoQueue.getJob(jobId);
};

/**
 * Remove job
 */
export const removeJob = async (jobId: string) => {
  const job = await getJob(jobId);
  if (job) {
    await job.remove();
  }
};

/**
 * Retry failed job
 */
export const retryJob = async (jobId: string) => {
  const job = await getJob(jobId);
  if (job) {
    await job.retry();
  }
};

/**
 * Clean old jobs
 */
export const cleanQueue = async (grace: number = 3600000) => {
  await videoQueue.clean(grace, 100, 'completed');
  await videoQueue.clean(grace, 50, 'failed');
};

/**
 * Pause queue
 */
export const pauseQueue = async () => {
  await videoQueue.pause();
  logger.info('Video queue paused');
};

/**
 * Resume queue
 */
export const resumeQueue = async () => {
  await videoQueue.resume();
  logger.info('Video queue resumed');
};

/**
 * Drain queue (remove all jobs)
 */
export const drainQueue = async () => {
  await videoQueue.drain();
  logger.info('Video queue drained');
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing video queue...');
  await videoQueue.close();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing video queue...');
  await videoQueue.close();
});
