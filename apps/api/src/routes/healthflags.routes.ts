import { Router } from 'express';
import { HealthFlagConfig } from '../models/HealthFlagConfig';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

export const healthFlagsAdminRouter = Router();
healthFlagsAdminRouter.use(requireAuth, requireAdmin);

interface FlagState {
  label: string;
  description: string;
  emoji: string;
  order: number;
  enabled: boolean;
}

// GET /api/admin/health-flags → Record<code, FlagState>
healthFlagsAdminRouter.get('/', async (_req, res, next) => {
  try {
    const items = await HealthFlagConfig.find({}).sort({ order: 1 }).lean();
    const result: Record<string, FlagState> = {};
    for (const item of items) {
      result[item.code] = {
        label: item.label,
        description: item.description,
        emoji: item.emoji ?? '',
        order: item.order ?? 0,
        enabled: item.enabled,
      };
    }
    res.json(result);
  } catch (err) { next(err); }
});

// PUT /api/admin/health-flags → bulk replace (full replace semantics)
healthFlagsAdminRouter.put('/', async (req, res, next) => {
  try {
    const incoming = req.body as Record<string, FlagState>;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Body must be a flags object' }); return;
    }

    // Full replace: delete existing, insert new
    await HealthFlagConfig.deleteMany({});
    const docs = Object.entries(incoming).map(([code, state], i) => ({
      code,
      label: state.label,
      description: state.description,
      emoji: state.emoji ?? '',
      order: typeof state.order === 'number' ? state.order : i,
      enabled: !!state.enabled,
    }));
    if (docs.length > 0) {
      await HealthFlagConfig.insertMany(docs);
    }

    // Return the saved state
    const saved = await HealthFlagConfig.find({}).sort({ order: 1 }).lean();
    const result: Record<string, FlagState> = {};
    for (const item of saved) {
      result[item.code] = {
        label: item.label,
        description: item.description,
        emoji: item.emoji ?? '',
        order: item.order ?? 0,
        enabled: item.enabled,
      };
    }
    res.json(result);
  } catch (err) { next(err); }
});
