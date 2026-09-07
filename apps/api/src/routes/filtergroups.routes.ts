import { Router } from 'express';
import { FilterGroupConfig, FILTER_GROUP_DEFAULTS } from '../models/FilterGroupConfig';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function ensureSeeded() {
  const count = await FilterGroupConfig.countDocuments();
  if (count === 0) await FilterGroupConfig.insertMany(FILTER_GROUP_DEFAULTS);
}

type GroupShape = { _id: unknown; code: string; label: string; order: number };

function fmt(doc: GroupShape) {
  return { _id: doc._id, code: doc.code, label: doc.label, order: doc.order };
}

// ── Public: GET /api/filter-groups ────────────────────────────────────────────
export const filterGroupsPublicRouter = Router();

filterGroupsPublicRouter.get('/', async (_req, res, next) => {
  try {
    await ensureSeeded();
    const docs = await FilterGroupConfig.find({}).sort({ order: 1, label: 1 }).lean();
    res.json(docs.map(d => ({ code: d.code, label: d.label, order: d.order })));
  } catch (err) { next(err); }
});

// ── Admin: CRUD /api/admin/filter-groups ──────────────────────────────────────
export const filterGroupsAdminRouter = Router();
filterGroupsAdminRouter.use(requireAuth, requireAdmin);

// List
filterGroupsAdminRouter.get('/', async (_req, res, next) => {
  try {
    await ensureSeeded();
    const docs = await FilterGroupConfig.find({}).sort({ order: 1, label: 1 }).lean();
    res.json(docs.map(fmt));
  } catch (err) { next(err); }
});

// Create
filterGroupsAdminRouter.post('/', async (req, res, next) => {
  try {
    const label = String(req.body?.label ?? '').trim();
    if (!label) { res.status(400).json({ error: 'Label is required' }); return; }
    const code = slugify(label);
    if (!code) { res.status(400).json({ error: 'Could not derive a code from that label' }); return; }
    if (await FilterGroupConfig.findOne({ code })) {
      res.status(409).json({ error: `A group with code "${code}" already exists` }); return;
    }
    const count = await FilterGroupConfig.countDocuments();
    const doc = await FilterGroupConfig.create({ code, label, order: (count + 1) * 10 });
    res.status(201).json(fmt(doc));
  } catch (err) { next(err); }
});

// Update label / order
filterGroupsAdminRouter.put('/:id', async (req, res, next) => {
  try {
    const label = String(req.body?.label ?? '').trim();
    if (!label) { res.status(400).json({ error: 'Label is required' }); return; }
    const patch: Record<string, unknown> = { label };
    if (typeof req.body?.order === 'number') patch.order = req.body.order;
    const doc = await FilterGroupConfig.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(fmt(doc));
  } catch (err) { next(err); }
});

// Delete
filterGroupsAdminRouter.delete('/:id', async (req, res, next) => {
  try {
    const total = await FilterGroupConfig.countDocuments();
    if (total <= 1) { res.status(400).json({ error: 'At least one group must remain' }); return; }
    const doc = await FilterGroupConfig.findByIdAndDelete(req.params.id).lean();
    if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ ok: true, deletedCode: doc.code });
  } catch (err) { next(err); }
});
