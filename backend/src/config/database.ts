/**
 * Database Configuration
 * Prisma client singleton
 */

import { PrismaClient } from '@prisma/client';
import { isDevelopment } from './env';

// Global type for Prisma client
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with logging
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });

// In development, prevent multiple instances
if (isDevelopment) {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
