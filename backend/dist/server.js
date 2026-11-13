"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const logger_1 = require("./lib/logger");
const prisma_1 = __importDefault(require("./lib/prisma"));
const PORT = env_1.default.PORT;
// Validate DB connection at startup - warn but still serve preview if DB unreachable (live demo without postgres)
async function start() {
    try {
        try {
            await prisma_1.default.$connect();
            logger_1.logger.info('Database connected');
        }
        catch (dbErr) {
            logger_1.logger.warn('Database not reachable - running in preview-only mode (auth/DB features disabled)', {
                error: dbErr.message,
            });
            logger_1.logger.warn('Set valid DATABASE_URL and run `npx prisma migrate dev` for full persistence');
        }
        const server = app_1.default.listen(PORT, () => {
            logger_1.logger.info(`IARS backend running on http://localhost:${PORT} [${env_1.default.NODE_ENV}]`);
            logger_1.logger.info(`CORS origin: ${env_1.default.CORS_ORIGIN}`);
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}, shutting down...`);
            server.close(async () => {
                await prisma_1.default.$disconnect();
                logger_1.logger.info('Shutdown complete');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('unhandledRejection', (reason) => {
            logger_1.logger.error('Unhandled Rejection', { reason });
            server.close(() => process.exit(1));
        });
    }
    catch (err) {
        logger_1.logger.error('Failed to start server', { error: err.message });
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map