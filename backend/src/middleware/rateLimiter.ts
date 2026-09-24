import rateLimit from 'express-rate-limit';
import env from '../config/env';

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
  // Skip successful auth? No, count all
});

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 min
  max: env.AUTH_RATE_LIMIT_MAX, // 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, try again later.' },
  skipSuccessfulRequests: true,
});

export const assessmentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  message: { success: false, error: 'Too many assessment requests.' },
});
