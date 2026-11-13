"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const validate_1 = require("../../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const updateSchema = zod_1.z.object({
    role: zod_1.z.enum(['USER', 'ADMIN', 'REVIEWER']).optional(),
    isActive: zod_1.z.boolean().optional(),
    name: zod_1.z.string().trim().min(2).max(100).optional(),
});
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('ADMIN'), async (req, res, next) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, institution: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json({ success: true, data: users });
    }
    catch (e) {
        next(e);
    }
});
router.patch('/:id', (0, auth_1.authorize)('ADMIN'), (0, validate_1.validate)({ body: updateSchema }), async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const user = await prisma_1.default.user.update({ where: { id }, data: updates, select: { id: true, email: true, name: true, role: true, isActive: true } });
        res.json({ success: true, data: user });
    }
    catch (e) {
        next(e);
    }
});
router.patch('/me', async (req, res, next) => {
    try {
        const { name } = req.body;
        if (name && (typeof name !== 'string' || name.length < 2 || name.length > 100)) {
            return res.status(400).json({ success: false, error: 'Invalid name' });
        }
        const user = await prisma_1.default.user.update({ where: { id: req.user.id }, data: { name: name?.trim() }, select: { id: true, email: true, name: true, role: true } });
        res.json({ success: true, data: user });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=users.routes.js.map