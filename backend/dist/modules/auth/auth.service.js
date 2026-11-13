"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const crypto_1 = require("../../utils/crypto");
const error_1 = require("../../middleware/error");
const logger_1 = require("../../lib/logger");
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 min
const register = async (data) => {
    const existing = await prisma_1.default.user.findUnique({ where: { email: data.email } });
    if (existing)
        throw new error_1.AppError('Email already registered', 409, 'CONFLICT');
    const passwordHash = await (0, crypto_1.hashPassword)(data.password);
    let institutionId = null;
    if (data.institutionName) {
        const inst = await prisma_1.default.institution.create({ data: { name: data.institutionName } });
        institutionId = inst.id;
    }
    const user = await prisma_1.default.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: passwordHash,
            institutionId,
        },
        select: { id: true, email: true, name: true, role: true, institutionId: true },
    });
    await prisma_1.default.auditLog.create({
        data: { userId: user.id, action: 'REGISTER', resource: `user:${user.id}` },
    });
    logger_1.logger.info('User registered', { userId: user.id });
    return user;
};
exports.register = register;
const login = async (email, password, ip, ua) => {
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        throw new error_1.AppError('Invalid credentials', 401);
    if (user.lockUntil && user.lockUntil > new Date()) {
        throw new error_1.AppError('Account locked. Try again later', 423, 'LOCKED');
    }
    const valid = await (0, crypto_1.verifyPassword)(password, user.password);
    if (!valid) {
        const attempts = user.failedAttempts + 1;
        const lockUntil = attempts >= MAX_FAILED ? new Date(Date.now() + LOCK_MS) : null;
        await prisma_1.default.user.update({ where: { id: user.id }, data: { failedAttempts: attempts, lockUntil } });
        await prisma_1.default.auditLog.create({ data: { userId: user.id, action: 'LOGIN_FAILED', ipAddress: ip, userAgent: ua } });
        throw new error_1.AppError('Invalid credentials', 401);
    }
    // reset lock
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockUntil: null, lastLoginAt: new Date() },
    });
    const authUser = { id: user.id, email: user.email, role: user.role, institutionId: user.institutionId };
    const accessToken = (0, crypto_1.generateAccessToken)(authUser);
    const refreshToken = (0, crypto_1.generateRefreshToken)(authUser);
    // store hashed refresh
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma_1.default.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: (0, crypto_1.hashToken)(refreshToken),
            expiresAt,
            ipAddress: ip,
            userAgent: ua,
        },
    });
    // cleanup expired
    await prisma_1.default.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => { });
    await prisma_1.default.auditLog.create({ data: { userId: user.id, action: 'LOGIN_SUCCESS', ipAddress: ip, userAgent: ua } });
    return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, institutionId: user.institutionId },
        accessToken,
        refreshToken,
    };
};
exports.login = login;
const refresh = async (token, ip, ua) => {
    try {
        const { verifyRefreshToken } = await Promise.resolve().then(() => __importStar(require('../../utils/crypto')));
        const payload = verifyRefreshToken(token);
        const tokenHash = (0, crypto_1.hashToken)(token);
        const stored = await prisma_1.default.refreshToken.findUnique({ where: { tokenHash } });
        if (!stored || stored.revoked || stored.expiresAt < new Date())
            throw new error_1.AppError('Invalid refresh token', 401);
        if (stored.userId !== payload.id)
            throw new error_1.AppError('Invalid refresh token', 401);
        const user = await prisma_1.default.user.findUnique({ where: { id: payload.id } });
        if (!user || !user.isActive)
            throw new error_1.AppError('User not found or disabled', 401);
        // rotate: revoke old, issue new
        await prisma_1.default.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
        const authUser = { id: user.id, email: user.email, role: user.role, institutionId: user.institutionId };
        const accessToken = (0, crypto_1.generateAccessToken)(authUser);
        const newRefreshToken = (0, crypto_1.generateRefreshToken)(authUser);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.default.refreshToken.create({
            data: { userId: user.id, tokenHash: (0, crypto_1.hashToken)(newRefreshToken), expiresAt, ipAddress: ip, userAgent: ua },
        });
        return { accessToken, refreshToken: newRefreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    }
    catch (e) {
        if (e instanceof error_1.AppError)
            throw e;
        throw new error_1.AppError('Invalid refresh token', 401);
    }
};
exports.refresh = refresh;
const logout = async (refreshToken) => {
    const hash = (0, crypto_1.hashToken)(refreshToken);
    await prisma_1.default.refreshToken.updateMany({ where: { tokenHash: hash }, data: { revoked: true } });
};
exports.logout = logout;
const me = async (userId) => {
    return prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true, institutionId: true, institution: true, createdAt: true },
    });
};
exports.me = me;
//# sourceMappingURL=auth.service.js.map