import { Request, Response, NextFunction } from 'express';
import * as service from './assessments.service';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const result = await service.create(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { page, limit, status, userId } = req.query as any;
    const result = await service.list({ page: Number(page) || 1, limit: Number(limit) || 10, status, userId, requestingUser: req.user });
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const data = await service.getById(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const r = await service.remove(req.params.id, req.user);
    res.json({ success: true, data: r });
  } catch (e) { next(e); }
};

export const stats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const data = await service.stats(req.user);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const preview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = service.computePreview(req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
