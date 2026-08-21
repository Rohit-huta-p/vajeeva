import { Router } from 'express';
import { SubRecipe } from '../models/SubRecipe';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

export const subrecipesAdminRouter = Router();
subrecipesAdminRouter.use(requireAuth, requireAdmin);

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toDTO(doc: any) {
  return { id: doc._id.toString(), name: doc.name, slug: doc.slug, usedIn: doc.usedIn };
}

subrecipesAdminRouter.get('/', async (_req, res, next) => {
  try {
    const items = await SubRecipe.find({}).lean();
    res.json(items.map(toDTO));
  } catch (err) { next(err); }
});

subrecipesAdminRouter.post('/', async (req, res, next) => {
  try {
    const { name } = req.body as { name: string };
    if (!name) { res.status(400).json({ error: 'name required' }); return; }
    const slug = toSlug(name);
    const item = await SubRecipe.create({ name, slug });
    res.status(201).json(toDTO(item));
  } catch (err) { next(err); }
});

subrecipesAdminRouter.put('/:id', async (req, res, next) => {
  try {
    const { name } = req.body as { name: string };
    const item = await SubRecipe.findByIdAndUpdate(
      req.params.id,
      { name, ...(name ? { slug: toSlug(name) } : {}) },
      { new: true }
    ).lean();
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(toDTO(item));
  } catch (err) { next(err); }
});

subrecipesAdminRouter.delete('/:id', async (req, res, next) => {
  try {
    const item = await SubRecipe.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
});
