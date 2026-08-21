import { Router } from 'express';
import { Source } from '../models/Source';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

export const sourcesAdminRouter = Router();
sourcesAdminRouter.use(requireAuth, requireAdmin);

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toDTO(doc: any) {
  return { id: doc._id.toString(), name: doc.name, type: doc.type, recipeCount: doc.recipeCount, slug: doc.slug };
}

sourcesAdminRouter.get('/', async (_req, res, next) => {
  try {
    const sources = await Source.find({}).lean();
    res.json(sources.map(toDTO));
  } catch (err) { next(err); }
});

sourcesAdminRouter.post('/', async (req, res, next) => {
  try {
    const { name, type } = req.body as { name: string; type: string };
    if (!name || !type) { res.status(400).json({ error: 'name and type required' }); return; }
    const slug = toSlug(name);
    const source = await Source.create({ name, type, slug });
    res.status(201).json(toDTO(source));
  } catch (err) { next(err); }
});

sourcesAdminRouter.put('/:id', async (req, res, next) => {
  try {
    const { name, type } = req.body as { name: string; type: string };
    const source = await Source.findByIdAndUpdate(
      req.params.id,
      { name, type, ...(name ? { slug: toSlug(name) } : {}) },
      { new: true }
    ).lean();
    if (!source) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(toDTO(source));
  } catch (err) { next(err); }
});

sourcesAdminRouter.delete('/:id', async (req, res, next) => {
  try {
    const source = await Source.findByIdAndDelete(req.params.id);
    if (!source) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Consumer router (no auth required)
export const sourcesPublicRouter = Router();

sourcesPublicRouter.get('/', async (_req, res, next) => {
  try {
    const sources = await Source.find({}).lean();
    res.json(sources.map(toDTO));
  } catch (err) { next(err); }
});

sourcesPublicRouter.get('/:slug', async (req, res, next) => {
  try {
    const source = await Source.findOne({ slug: req.params.slug }).lean();
    if (!source) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(toDTO(source));
  } catch (err) { next(err); }
});
