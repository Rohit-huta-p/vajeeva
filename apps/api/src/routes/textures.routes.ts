import { Router } from 'express';
import { TextureConfig, TEXTURE_DEFAULTS } from '../models/TextureConfig';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

async function ensureSeeded() {
  const count = await TextureConfig.countDocuments();
  if (count === 0) {
    await TextureConfig.insertMany(TEXTURE_DEFAULTS);
  }
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ── Public: GET /api/textures → enabled only ─────────────────────────────
export const texturesPublicRouter = Router();

texturesPublicRouter.get('/', async (_req, res, next) => {
  try {
    await ensureSeeded();
    const textures = await TextureConfig.find({ enabled: true }).sort({ order: 1, label: 1 }).lean();
    res.json(textures.map(t => ({ code: t.code, label: t.label, subtitle: t.subtitle })));
  } catch (err) { next(err); }
});

// ── Admin CRUD: /api/admin/textures ──────────────────────────────────────
export const texturesAdminRouter = Router();
texturesAdminRouter.use(requireAuth, requireAdmin);

// GET — full list (all enabled/disabled)
texturesAdminRouter.get('/', async (_req, res, next) => {
  try {
    await ensureSeeded();
    res.json(await TextureConfig.find({}).sort({ order: 1, label: 1 }).lean());
  } catch (err) { next(err); }
});

// POST — create a new custom texture
texturesAdminRouter.post('/', async (req, res, next) => {
  try {
    const { label, subtitle = '', code } = req.body as { label?: string; subtitle?: string; code?: string };
    if (!label?.trim()) { res.status(400).json({ error: 'label required' }); return; }
    const derivedCode = code?.trim() ? slugify(code) : slugify(label);
    if (!derivedCode) { res.status(400).json({ error: 'Could not derive a valid code from the label' }); return; }
    const maxOrder = (await TextureConfig.findOne({}, 'order').sort({ order: -1 }).lean())?.order ?? 0;
    const doc = await TextureConfig.create({
      code: derivedCode, label: label.trim(), subtitle: subtitle.trim(),
      order: maxOrder + 1, enabled: true, builtIn: false,
    });
    res.status(201).json(doc);
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ error: 'A texture with that code already exists' }); return; }
    next(err);
  }
});

// PUT /:id — update label, subtitle, order, enabled (code is immutable)
texturesAdminRouter.put('/:id', async (req, res, next) => {
  try {
    const updates: Record<string, unknown> = {};
    if (typeof req.body.label   === 'string')  updates.label   = req.body.label.trim();
    if (typeof req.body.subtitle === 'string') updates.subtitle = req.body.subtitle.trim();
    if (typeof req.body.order   === 'number')  updates.order   = req.body.order;
    if (typeof req.body.enabled === 'boolean') updates.enabled = req.body.enabled;
    const doc = await TextureConfig.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(doc);
  } catch (err) { next(err); }
});

// DELETE /:id — custom textures only; built-ins are protected
texturesAdminRouter.delete('/:id', async (req, res, next) => {
  try {
    const doc = await TextureConfig.findById(req.params.id);
    if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
    if (doc.builtIn) { res.status(400).json({ error: 'Built-in textures cannot be deleted' }); return; }
    await doc.deleteOne();
    res.json({ ok: true });
  } catch (err) { next(err); }
});
