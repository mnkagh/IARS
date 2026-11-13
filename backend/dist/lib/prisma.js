"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const prisma = new client_1.PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
    ],
});
exports.prisma = prisma;
// Only log queries in development, never leak sensitive data
if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    prisma.$on('query', (e) => {
        logger_1.logger.debug('Query', { query: e.query, params: '[REDACTED]', duration: e.duration + 'ms' });
    });
}
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
exports.default = prisma;
//# sourceMappingURL=prisma.js.map