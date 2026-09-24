import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import env from '../config/env';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND'));
};

// Centralized error handler - NEVER leak stack or internal details in production
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Zod validation
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  // AppError
  if (err instanceof AppError) {
    logger.warn('AppError', { message: err.message, statusCode: err.statusCode, code: err.code });
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
  logger.error('Unhandled error', { message: err.message, stack: env.NODE_ENV === 'development' ? err.stack : undefined });

  return res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
