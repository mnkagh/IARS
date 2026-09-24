import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { AppError } from './error';
import prisma from '../lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  institutionId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // 1) httpOnly cookie (preferred)
    if (req.cookies?.accessToken) token = req.cookies.accessToken;
    // 2) Authorization header fallback for API clients
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser & { iat: number; exp: number };

    // Optional: check user still active/locked
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { isActive: true, lockUntil: true } });
    if (!user) throw new AppError('User not found', 401);
    if (!user.isActive) throw new AppError('Account disabled', 403);
    if (user.lockUntil && user.lockUntil > new Date()) throw new AppError('Account temporarily locked', 423);

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, institutionId: decoded.institutionId };
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...roles: string[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!roles.includes(req.user.role)) return next(new AppError('Forbidden: insufficient role', 403, 'FORBIDDEN'));
  next();
};

// Optional: allow owner or admin
export const authorizeOwnerOrAdmin = (getOwnerId: (req: Request) => string) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (req.user.role === 'ADMIN') return next();
  if (req.user.id === getOwnerId(req)) return next();
  return next(new AppError('Forbidden', 403));
};
