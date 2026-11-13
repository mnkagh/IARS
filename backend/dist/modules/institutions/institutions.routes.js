"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const zod_1 = require("zod");
const validate_1 = require("../../middleware/validate");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200),
    type: zod_1.z.string().max(100).optional(),
    country: zod_1.z.string().max(100).optional(),
    city: zod_1.z.string().max(100).optional(),
    website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
router.use(auth_1.authenticate);
router.get('/', async (_req, res, next) => {
    try {
        const items = await prisma_1.default.institution.findMany({
            orderBy: { createdAt: 'desc' }, take: 100,
            include: { _count: { select: { users: true } } },
        });
        res.json({ success: true, data: items });
    }
    catch (e) {
        next(e);
    }
});
router.post('/', (0, auth_1.authorize)('ADMIN', 'REVIEWER'), (0, validate_1.validate)({ body: createSchema }), async (req, res, next) => {
    try {
        const data = await prisma_1.default.institution.create({ data: { ...req.body, createdById: req.user.id } });
        await prisma_1.default.user.update({ where: { id: req.user.id }, data: { institutionId: data.id } }).catch(() => { });
        res.status(201).json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=institutions.routes.js.map