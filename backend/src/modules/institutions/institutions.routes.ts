import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { z } from 'zod';
import { validate } from '../../middleware/validate';

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(2).max(200),
  type: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

router.use(authenticate);

router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.institution.findMany({
      orderBy: { createdAt: 'desc' }, take: 100,
      include: { _count: { select: { users: true } } },
    });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
});

router.post('/', authorize('ADMIN','REVIEWER'), validate({ body: createSchema }), async (req, res, next) => {
  try {
    const data = await prisma.institution.create({ data: { ...req.body, createdById: req.user!.id } });
    await prisma.user.update({ where: { id: req.user!.id }, data: { institutionId: data.id } }).catch(() => {});
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
