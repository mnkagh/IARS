import { Request, Response, NextFunction } from 'express';
import * as service from './auth.service';
import env from '../../config/env';

const cookieOpts = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await service.register(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (e) { next(e); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, accessToken, refreshToken } = await service.login(
      req.body.email, req.body.password, req.ip, req.headers['user-agent']
    );
    res
      .cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 })
      .cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (e) { next(e); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) return res.status(401).json({ success: false, error: 'Refresh token required' });
    const result = await service.refresh(token, req.ip, req.headers['user-agent']);
    res
      .cookie('accessToken', result.accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 })
      .cookie('refreshToken', result.refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ success: true, data: result });
  } catch (e) { next(e); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (token) await service.logout(token);
    res.clearCookie('accessToken', { path: '/' }).clearCookie('refreshToken', { path: '/' })
      .json({ success: true, message: 'Logged out' });
  } catch (e) { next(e); }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const user = await service.me(req.user.id);
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
};
