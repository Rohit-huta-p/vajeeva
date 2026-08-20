import { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (req, res, next) => {
  if ((req as any).user?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  next();
};
