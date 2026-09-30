import app from './app';
import env from './config/env';
import { logger } from './lib/logger';
import prisma from './lib/prisma';

const PORT = env.PORT;

// Validate DB connection at startup - warn but still serve preview if DB unreachable (live demo without postgres)
async function start() {
  try {
    try {
      await prisma.$connect();
      logger.info('Database connected');
    } catch (dbErr: any) {
      logger.warn('Database not reachable - running in preview-only mode (auth/DB features disabled)', {
        error: dbErr.message,
      });
      logger.warn('Set valid DATABASE_URL and run `npx prisma migrate dev` for full persistence');
    }

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
