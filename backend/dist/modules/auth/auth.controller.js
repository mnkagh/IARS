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
const service = __importStar(require("./auth.service"));
const env_1 = __importDefault(require("../../config/env"));
const cookieOpts = {
    httpOnly: true,
    secure: env_1.default.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
};
const register = async (req, res, next) => {
    try {
        const user = await service.register(req.body);
        res.status(201).json({ success: true, data: user });
    }
    catch (e) {
        next(e);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken } = await service.login(req.body.email, req.body.password, req.ip, req.headers['user-agent']);
        res
            .cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 })
            .cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .json({ success: true, data: { user, accessToken, refreshToken } });
    }
    catch (e) {
        next(e);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        if (!token)
            return res.status(401).json({ success: false, error: 'Refresh token required' });
        const result = await service.refresh(token, req.ip, req.headers['user-agent']);
        res
            .cookie('accessToken', result.accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 })
            .cookie('refreshToken', result.refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 })
            .json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        if (token)
            await service.logout(token);
        res.clearCookie('accessToken', { path: '/' }).clearCookie('refreshToken', { path: '/' })
            .json({ success: true, message: 'Logged out' });
    }
    catch (e) {
        next(e);
    }
};
exports.logout = logout;
const me = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const user = await service.me(req.user.id);
        res.json({ success: true, data: user });
    }
    catch (e) {
        next(e);
    }
};
exports.me = me;
//# sourceMappingURL=auth.controller.js.map