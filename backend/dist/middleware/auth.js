"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeOwnerOrAdmin = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const error_1 = require("./error");
const prisma_1 = __importDefault(require("../lib/prisma"));
const authenticate = async (req, _res, next) => {
    try {
        let token;
        // 1) httpOnly cookie (preferred)
        if (req.cookies?.accessToken)
            token = req.cookies.accessToken;
        // 2) Authorization header fallback for API clients
        else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token)
            throw new error_1.AppError('Authentication required', 401, 'UNAUTHORIZED');
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_ACCESS_SECRET);
        // Optional: check user still active/locked
        const user = await prisma_1.default.user.findUnique({ where: { id: decoded.id }, select: { isActive: true, lockUntil: true } });
        if (!user)
            throw new error_1.AppError('User not found', 401);
        if (!user.isActive)
            throw new error_1.AppError('Account disabled', 403);
        if (user.lockUntil && user.lockUntil > new Date())
            throw new error_1.AppError('Account temporarily locked', 423);
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role, institutionId: decoded.institutionId };
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => (req, _res, next) => {
    if (!req.user)
        return next(new error_1.AppError('Authentication required', 401));
    if (!roles.includes(req.user.role))
        return next(new error_1.AppError('Forbidden: insufficient role', 403, 'FORBIDDEN'));
    next();
};
exports.authorize = authorize;
// Optional: allow owner or admin
const authorizeOwnerOrAdmin = (getOwnerId) => (req, _res, next) => {
    if (!req.user)
        return next(new error_1.AppError('Authentication required', 401));
    if (req.user.role === 'ADMIN')
        return next();
    if (req.user.id === getOwnerId(req))
        return next();
    return next(new error_1.AppError('Forbidden', 403));
};
exports.authorizeOwnerOrAdmin = authorizeOwnerOrAdmin;
//# sourceMappingURL=auth.js.map