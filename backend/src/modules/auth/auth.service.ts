import prisma from '../../lib/prisma';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, hashToken } from '../../utils/crypto';
import { AppError } from '../../middleware/error';
import { logger } from '../../lib/logger';
import env from '../../config/env';

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 min

export const register = async (data: { name: string; email: string; password: string; institutionName?: string }) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already registered', 409, 'CONFLICT');

  const passwordHash = await hashPassword(data.password);

  let institutionId: string | null = null;
  if (data.institutionName) {
    const inst = await prisma.institution.create({ data: { name: data.institutionName } });
    institutionId = inst.id;
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: passwordHash,
      institutionId,
    },
    select: { id: true, email: true, name: true, role: true, institutionId: true },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'REGISTER', resource: `user:${user.id}` },
  });

  logger.info('User registered', { userId: user.id });
  return user;
};

export const login = async (email: string, password: string, ip?: string, ua?: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new AppError('Account locked. Try again later', 423, 'LOCKED');
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    const attempts = user.failedAttempts + 1;
    const lockUntil = attempts >= MAX_FAILED ? new Date(Date.now() + LOCK_MS) : null;
    await prisma.user.update({ where: { id: user.id }, data: { failedAttempts: attempts, lockUntil } });
    await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN_FAILED', ipAddress: ip, userAgent: ua } });
    throw new AppError('Invalid credentials', 401);
  }

  // reset lock
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockUntil: null, lastLoginAt: new Date() },
  });

  const authUser = { id: user.id, email: user.email, role: user.role, institutionId: user.institutionId };
  const accessToken = generateAccessToken(authUser);
  const refreshToken = generateRefreshToken(authUser);

  // store hashed refresh
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      ipAddress: ip,
      userAgent: ua,
    },
  });

  // cleanup expired
  await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

  await prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN_SUCCESS', ipAddress: ip, userAgent: ua } });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, institutionId: user.institutionId },
    accessToken,
    refreshToken,
  };
};

export const refresh = async (token: string, ip?: string, ua?: string) => {
  try {
    const { verifyRefreshToken } = await import('../../utils/crypto');
    const payload = verifyRefreshToken(token);
    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) throw new AppError('Invalid refresh token', 401);
    if (stored.userId !== payload.id) throw new AppError('Invalid refresh token', 401);

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) throw new AppError('User not found or disabled', 401);

    // rotate: revoke old, issue new
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const authUser = { id: user.id, email: user.email, role: user.role, institutionId: user.institutionId };
    const accessToken = generateAccessToken(authUser);
    const newRefreshToken = generateRefreshToken(authUser);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(newRefreshToken), expiresAt, ipAddress: ip, userAgent: ua },
    });

    return { accessToken, refreshToken: newRefreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError('Invalid refresh token', 401);
  }
};

export const logout = async (refreshToken: string) => {
  const hash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash: hash }, data: { revoked: true } });
};

export const me = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, institutionId: true, institution: true, createdAt: true },
  });
};
