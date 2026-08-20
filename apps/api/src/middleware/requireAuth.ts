import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as {
      userId: string; role: 'user' | 'admin';
    };
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
};
