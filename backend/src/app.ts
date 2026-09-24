import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import env from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { notFoundHandler, errorHandler } from './middleware/error';

import authRoutes from './modules/auth/auth.routes';
import assessmentRoutes from './modules/assessments/assessments.routes';
import userRoutes from './modules/users/users.routes';
import institutionRoutes from './modules/institutions/institutions.routes';

const app = express();

// Security headers - Helmet with strict CSP
app.use(
  helmet({
    contentSecurityPolicy: env.HELMET_CSP_ENABLED !== 'false' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", env.CORS_ORIGIN],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  })
);

// CORS - whitelist only
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow non-browser (health checks)
      const allowed = env.CORS_ORIGIN.split(',').map((s) => s.trim());
      if (allowed.includes(origin) || allowed.includes('*')) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' })); // limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(hpp());
app.use(mongoSanitize());

// Rate limit
app.use(globalLimiter);

// Health
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'IARS API healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'IARS Institutional AI Readiness Scale API',
    version: '1.0.0',
    docs: '/api/v1',
    endpoints: ['/api/v1/auth', '/api/v1/assessments', '/api/v1/users', '/api/v1/institutions'],
  });
});

// API v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/institutions', institutionRoutes);

// 404
app.use(notFoundHandler);
// Error handler
app.use(errorHandler);

export default app;
