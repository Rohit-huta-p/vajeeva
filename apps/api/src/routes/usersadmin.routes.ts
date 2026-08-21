import { Router } from 'express';
import { User } from '../models/User';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

export const usersAdminRouter = Router();
usersAdminRouter.use(requireAuth, requireAdmin);

function toDTO(doc: any) {
  return {
    id:            doc._id.toString(),
    email:         doc.email,
    role:          doc.role,
    // The app currently supports email auth only; authProviders is included
    // for UI compatibility — extend when OAuth providers are added.
    authProviders: ['email'],
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
