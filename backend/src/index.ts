/**
 * Aervo Backend - Entry Point
 * Sanal Drone Video Platform API
 */

import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { initStorage } from './services/storage.service';
import { verifyEmailConfig } from './services/email.service';
import { videoWorker } from './queues/workers/video.worker';

const PORT = parseInt(env.PORT, 10);

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connected');

    // Initialize storage
    await initStorage();
    logger.info('✅ Storage initialized');

    // Verify email configuration
    const emailOk = await verifyEmailConfig();
    if (emailOk) {
      logger.info('✅ Email service configured');
    } else {
      logger.warn('⚠️  Email service not configured (check SMTP settings)');
    }

    // Start video worker
    logger.info('✅ Video worker started');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════╗
║                                           ║
║        🚁 AERVO API SERVER STARTED        ║
║                                           ║
║  Environment: ${env.NODE_ENV.toUpperCase().padEnd(30)}║
║  Port:        ${PORT.toString().padEnd(30)}║
║  URL:         ${env.APP_URL.padEnd(30)}║
║                                           ║
╚═══════════════════════════════════════════╝
      `);

      logger.info('✅ Server is ready to accept requests');
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  throw reason;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  await videoWorker.close();
  await prisma.$disconnect();
  await redis.quit();

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');

  await videoWorker.close();
  await prisma.$disconnect();
  await redis.quit();

  process.exit(0);
});

// Start the server
startServer();
