import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterInputSchema, LoginInputSchema } from '@vajeeva/shared';
import { User } from '../models/User';

export const authRouter = Router();

function signAccess(userId: string, role: string) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' });
}
function signRefresh(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '30d' });
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = RegisterInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { email, password } = parsed.data;
    if (await User.findOne({ email })) { res.status(409).json({ error: 'Email already registered' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });
    res.status(201).json({ accessToken: signAccess(user.id, user.role) });
  } catch (err) { next(err); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = LoginInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' }); return;
    }
    res.cookie('refreshToken', signRefresh(user.id), {
      httpOnly: true, sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: signAccess(user.id, user.role) });
  } catch (err) { next(err); }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) { res.status(401).json({ error: 'No refresh token' }); return; }
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const user = await User.findById(payload.userId);
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }
    res.json({ accessToken: signAccess(user.id, user.role) });
  } catch {
    res.status(401).json({ error: 'Refresh token invalid or expired' });
  }
});
