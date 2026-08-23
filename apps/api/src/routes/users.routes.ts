import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../models/User';
import { HealthFlagConfig } from '../models/HealthFlagConfig';
import { SavedRecipe } from '../models/SavedRecipe';

export const usersRouter = Router();
export const publicHealthFlagsRouter = Router();

/** Safe user DTO — never leaks passwordHash or internal fields. */
function userToDTO(doc: any) {
  return {
    id:            doc._id.toString(),
    email:         doc.email,
    name:          doc.name  ?? '',
    phone:         doc.phone ?? '',
    role:          doc.role,
    healthProfile: doc.healthProfile ?? [],
    joinedAt:      (doc.createdAt ?? doc._id.getTimestamp()).toISOString(),
  };
}

// ── PATCH /users/me — JWT protected ──────────────────────────────────────────

usersRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const { name, phone, healthProfile } = req.body as {
      name?: string;
      phone?: string;
      healthProfile?: string[];
    };
    const updates: Record<string, unknown> = {};
    if (name          !== undefined) updates.name          = name;
    if (phone         !== undefined) updates.phone         = phone;
    if (healthProfile !== undefined) updates.healthProfile = healthProfile;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(userToDTO(user));
  } catch (err) { next(err); }
});

// ── DELETE /users/me — account deletion (App Store / Play requirement) ────────

usersRouter.delete('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    await SavedRecipe.deleteMany({ userId });
    const user = await User.findByIdAndDelete(userId).lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.status(204).end();
  } catch (err) { next(err); }
});

// ── Public GET /api/healthflags — enabled flags for onboarding health grid ───

publicHealthFlagsRouter.get('/', async (_req, res, next) => {
  try {
    const flags = await HealthFlagConfig.find({ enabled: true }).lean();
    res.json(flags.map(f => ({ code: f.code, label: f.label })));
  } catch (err) { next(err); }
});
