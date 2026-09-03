import { Router } from 'express';
import { SubRecipe } from '../models/SubRecipe';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

// ── Public DTO (full shape for consumer sheet) ──────────────────────────────
function toPublicDTO(doc: any) {
  return {
    id:          doc._id.toString(),
    name:        doc.name,
    slug:        doc.slug,
    usedIn:      doc.usedIn ?? 0,
    ingredients: (doc.ingredients ?? []).map((i: any) => ({ name: i.name, qty: i.qty })),
    note:        doc.note ?? '',
    method:      doc.method ?? '',
  };
}

// Consumer router — no auth required
export const subrecipesPublicRouter = Router();

subrecipesPublicRouter.get('/', async (_req, res, next) => {
  try {
    const items = await SubRecipe.find({}).lean();
    res.json(items.map(toPublicDTO));
  } catch (err) { next(err); }
});

subrecipesPublicRouter.get('/:slug', async (req, res, next) => {
  try {
    const item = await SubRecipe.findOne({ slug: req.params.slug }).lean();
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(toPublicDTO(item));
  } catch (err) { next(err); }
});

export const subrecipesAdminRouter = Router();
subrecipesAdminRouter.use(requireAuth, requireAdmin);

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Admin DTO — full shape so the editor can display and save all fields.
function toDTO(doc: any) {
  return {
    id:          doc._id.toString(),
    name:        doc.name,
    slug:        doc.slug,
    usedIn:      doc.usedIn ?? 0,
    ingredients: (doc.ingredients ?? []).map((i: any) => ({ name: i.name, qty: i.qty })),
    note:        doc.note ?? '',
    method:      doc.method ?? '',
  };
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
    const { name, ingredients, note, method } = req.body as {
      name?: string;
      ingredients?: { name: string; qty: string }[];
      note?: string;
      method?: string;
    };
    const update: Record<string, unknown> = {};
    if (name        !== undefined) { update.name = name; update.slug = toSlug(name); }
    if (ingredients !== undefined) update.ingredients = ingredients;
    if (note        !== undefined) update.note = note;
    if (method      !== undefined) update.method = method;
    const item = await SubRecipe.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
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
