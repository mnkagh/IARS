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
Object.defineProperty(exports, "__esModule", { value: true });
exports.preview = exports.stats = exports.remove = exports.getById = exports.list = exports.create = void 0;
const service = __importStar(require("./assessments.service"));
const create = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const result = await service.create(req.user.id, req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        next(e);
    }
};
exports.create = create;
const list = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const { page, limit, status, userId } = req.query;
        const result = await service.list({ page: Number(page) || 1, limit: Number(limit) || 10, status, userId, requestingUser: req.user });
        res.json({ success: true, ...result });
    }
    catch (e) {
        next(e);
    }
};
exports.list = list;
const getById = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const data = await service.getById(req.params.id, req.user);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
};
exports.getById = getById;
const remove = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const r = await service.remove(req.params.id, req.user);
        res.json({ success: true, data: r });
    }
    catch (e) {
        next(e);
    }
};
exports.remove = remove;
const stats = async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        const data = await service.stats(req.user);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
};
exports.stats = stats;
const preview = async (req, res, next) => {
    try {
        const data = service.computePreview(req.body);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
};
exports.preview = preview;
//# sourceMappingURL=assessments.controller.js.map