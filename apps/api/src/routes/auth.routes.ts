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

// Web clients (apps/admin) get the refresh token as an httpOnly cookie and
// never see it directly. Native clients (apps/frontend, Expo) have no
// persistent cookie jar across JS reloads, so they also get it in the JSON
// body and persist it themselves (AsyncStorage) — see frontend/src/auth/AuthContext.tsx.
function issueRefreshToken(res: import('express').Response, userId: string) {
  const refreshToken = signRefresh(userId);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, sameSite: 'strict', maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return refreshToken;
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = RegisterInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { email, password, name, phone, age, gender } = parsed.data;
    if (await User.findOne({ email })) { res.status(409).json({ error: 'Email already registered' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email, passwordHash,
      ...(name   ? { name }   : {}),
      ...(phone  ? { phone }  : {}),
      ...(age !== undefined ? { age } : {}),
      ...(gender ? { gender } : {}),
    });
    const refreshToken = issueRefreshToken(res, user.id);
    res.status(201).json({ accessToken: signAccess(user.id, user.role), refreshToken });
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
    const refreshToken = issueRefreshToken(res, user.id);
    res.json({ accessToken: signAccess(user.id, user.role), refreshToken });
  } catch (err) { next(err); }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
    if (!token) { res.status(401).json({ error: 'No refresh token' }); return; }
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const user = await User.findById(payload.userId);
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }
    res.json({ accessToken: signAccess(user.id, user.role) });
  } catch {
    res.status(401).json({ error: 'Refresh token invalid or expired' });
  }
});
