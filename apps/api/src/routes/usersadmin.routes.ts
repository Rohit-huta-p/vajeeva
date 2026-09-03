import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { SavedRecipe } from '../models/SavedRecipe';
import { CookLog } from '../models/CookLog';
import { Recipe } from '../models/Recipe';
import { HealthFlagConfig } from '../models/HealthFlagConfig';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

export const usersAdminRouter = Router();
usersAdminRouter.use(requireAuth, requireAdmin);

function capitalize(s: string | undefined): string | undefined {
  if (!s) return undefined;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function toDTO(doc: any) {
  return {
    id:            doc._id.toString(),
    name:          doc.name || undefined,
    email:         doc.email,
    phone:         doc.phone || undefined,
    age:           doc.age,
    gender:        capitalize(doc.gender),
    role:          doc.role,
    // The app currently supports email auth only; authProviders is included
    // for UI compatibility — extend when OAuth providers are added.
    authProviders: ['Email'],
    healthTags:    doc.healthProfile ?? [],
    joinedAt:      (doc.createdAt ?? doc._id.getTimestamp()).toISOString(),
  };
}

// GET /api/admin/users — read-only user list, no PII beyond email
usersAdminRouter.get('/', async (_req, res, next) => {
  try {
    const users = await User.find({}).lean();
    res.json(users.map(toDTO));
  } catch (err) { next(err); }
});

interface Flag {
  slug: string; nameEn: string; condition: string; conditionLabel: string;
  severity: string; note: string; saved: boolean; made: boolean;
}

// GET /api/admin/users/:id — per-patient care view: engagement, adherence
// (healthProfile × recipe healthFlags), and satisfaction. This is sensitive
// health-behaviour data — see docs/specs/2026-09-03-admin-outcomes.md §8.
usersAdminRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) { res.status(404).json({ error: 'User not found' }); return; }
    const user = await User.findById(id).lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const [saved, cooks, vocab] = await Promise.all([
      SavedRecipe.find({ userId: id }).lean(),
      CookLog.find({ userId: id }).lean(),
      HealthFlagConfig.find({}, 'code label').lean(),
    ]);
    const labelByCode = new Map(vocab.map(v => [v.code, v.label]));

    const savedIds = new Set(saved.map(s => String(s.recipeId)));
    const madeIds = new Set(cooks.map(c => String(c.recipeId)));
    const engagedIds = [...new Set([...savedIds, ...madeIds])];
    const recipes = await Recipe.find({ _id: { $in: engagedIds } }, 'slug nameEn healthFlags').lean();
    const recipeById = new Map(recipes.map(r => [String(r._id), r]));

    const conditions = (user.healthProfile ?? []) as string[];
    const conditionSet = new Set(conditions);

    // Adherence — engaged recipes carrying a caution/avoid flag for one of the
    // patient's own conditions. Avoid before caution.
    const flags: Flag[] = [];
    for (const rid of engagedIds) {
      const r = recipeById.get(rid);
      if (!r) continue;
      for (const hf of ((r.healthFlags ?? []) as { condition: string; severity: string; note?: string }[])) {
        if (conditionSet.has(hf.condition) && (hf.severity === 'avoid' || hf.severity === 'caution')) {
          flags.push({
            slug: r.slug, nameEn: r.nameEn,
            condition: hf.condition, conditionLabel: labelByCode.get(hf.condition) ?? hf.condition,
            severity: hf.severity, note: hf.note ?? '',
            saved: savedIds.has(rid), made: madeIds.has(rid),
          });
        }
      }
    }
    flags.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'avoid' ? -1 : 1));

    // Engagement
    const madeMs = cooks.map(c => new Date(c.madeAt).getTime());
    const lastMadeAt = madeMs.length ? new Date(Math.max(...madeMs)).toISOString() : null;
    const recentMakes = [...cooks]
      .sort((a, b) => new Date(b.madeAt).getTime() - new Date(a.madeAt).getTime())
      .slice(0, 8)
      .map(c => {
        const r = recipeById.get(String(c.recipeId));
        return { slug: r?.slug ?? '', nameEn: r?.nameEn ?? '(deleted recipe)', madeAt: c.madeAt, rating: c.rating ?? null };
      });

    // Satisfaction
    const rated = cooks.filter(c => typeof c.rating === 'number');
    const avgRating = rated.length
      ? Math.round((rated.reduce((a, c) => a + (c.rating as number), 0) / rated.length) * 10) / 10
      : null;

    const lastActiveAt = user.lastSyncAt && new Date(user.lastSyncAt).getTime() > 0
      ? new Date(user.lastSyncAt).toISOString() : null;

    res.json({
      profile: {
        id: String(user._id),
        name: user.name || undefined,
        email: user.email,
        phone: user.phone || undefined,
        age: user.age,
        gender: capitalize(user.gender ?? undefined),
        joinedAt: new Date(user.createdAt ?? (user._id as mongoose.Types.ObjectId).getTimestamp()).toISOString(),
        lastActiveAt,
        conditions: conditions.map(code => ({ code, label: labelByCode.get(code) ?? code })),
      },
      engagement: { saves: saved.length, makes: cooks.length, lastMadeAt, recentMakes },
      adherence: { flags },
      satisfaction: { avgRating, ratingCount: rated.length },
    });
  } catch (err) { next(err); }
});
