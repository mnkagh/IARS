import app from './app';
import env from './config/env';
import { logger } from './lib/logger';
import prisma from './lib/prisma';

const PORT = env.PORT;

// Validate DB connection at startup - fail fast if unreachable
async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    const server = app.listen(PORT, () => {
      logger.info(`IARS backend running on http://localhost:${PORT} [${env.NODE_ENV}]`);
      logger.info(`CORS origin: ${env.CORS_ORIGIN}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection', { reason });
      server.close(() => process.exit(1));
    });
  } catch (err: any) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

start();
