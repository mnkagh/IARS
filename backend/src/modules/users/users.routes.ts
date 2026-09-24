import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import prisma from '../../lib/prisma';

const router = Router();

router.use(authenticate);

// Admin: list users
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

// Me already in auth, but also provide profile update
router.patch('/me', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (name && (typeof name !== 'string' || name.length < 2 || name.length > 100)) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: name?.trim() },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

export default router;
