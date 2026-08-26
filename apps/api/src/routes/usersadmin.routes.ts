import { Router } from 'express';
import { User } from '../models/User';
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
