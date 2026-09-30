import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const updateSchema = z.object({
  role: z.enum(['USER','ADMIN','REVIEWER']).optional(),
  isActive: z.boolean().optional(),
  name: z.string().trim().min(2).max(100).optional(),
});

router.use(authenticate);

router.get('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, institution: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: users });
  } catch (e) { next(e); }
});

router.patch('/:id', authorize('ADMIN'), validate({ body: updateSchema }), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = await prisma.user.update({ where: { id }, data: updates, select: { id: true, email: true, name: true, role: true, isActive: true } });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.patch('/me', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (name && (typeof name !== 'string' || name.length < 2 || name.length > 100)) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { name: name?.trim() }, select: { id: true, email: true, name: true, role: true } });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

export default router;
