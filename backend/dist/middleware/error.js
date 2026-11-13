"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const logger_1 = require("../lib/logger");
const env_1 = __importDefault(require("../config/env"));
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const notFoundHandler = (req, _res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND'));
};
exports.notFoundHandler = notFoundHandler;
// Centralized error handler - NEVER leak stack or internal details in production
const errorHandler = (err, _req, res, _next) => {
    // Zod validation
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
    }
    // AppError
    if (err instanceof AppError) {
        logger_1.logger.warn('AppError', { message: err.message, statusCode: err.statusCode, code: err.code });
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            code: err.code,
        });
    }
    // Prisma known errors - map to safe messages
    // @ts-ignore
    if (err.code === 'P2002') {
        return res.status(409).json({ success: false, error: 'Resource already exists', code: 'CONFLICT' });
    }
    // @ts-ignore
    if (err.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Resource not found', code: 'NOT_FOUND' });
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
    }
    // Unknown - log full, return generic
    logger_1.logger.error('Unhandled error', { message: err.message, stack: env_1.default.NODE_ENV === 'development' ? err.stack : undefined });
    return res.status(500).json({
        success: false,
        error: env_1.default.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(env_1.default.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.js.map