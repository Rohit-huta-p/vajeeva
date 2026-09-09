import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { Recipe } from '../models/Recipe';
import { HealthFlagConfig } from '../models/HealthFlagConfig';
import { RecipeInputSchema } from '@vajeeva/shared';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

/**
 * Reject health-flag conditions not present in the condition vocabulary
 * (HealthFlagConfig) — keeps recipe flags and the patient health-profile on one
 * set of codes. Skips enforcement when no vocabulary is configured yet
 * (bootstrap / tests). See docs/specs/2026-09-03-condition-vocabulary.md.
 * Returns an error string, or null when valid.
 */
async function invalidConditions(healthFlags?: { condition?: string }[]): Promise<string | null> {
  const codes = new Set((await HealthFlagConfig.find({}, 'code').lean()).map(c => c.code));
  if (codes.size === 0) return null; // no vocab configured — don't enforce
  const bad = [...new Set((healthFlags ?? []).map(f => f.condition).filter((c): c is string => !!c && !codes.has(c)))];
  return bad.length
    ? `Unknown health condition code(s): ${bad.join(', ')}. Add them under Health Flags first.`
    : null;
}

adminRouter.get('/recipes', async (req, res, next) => {
  try {
    res.json(await Recipe.find({}).lean());
  } catch (err) { next(err); }
});

/** Flatten a Zod error into a single human-readable string for API consumers. */
function zodMsg(err: import('zod').ZodError): string {
  const f = err.flatten();
  const parts = [
    ...f.formErrors,
    ...Object.entries(f.fieldErrors).flatMap(([k, vs]) => (vs ?? []).map(v => `${k}: ${v}`)),
  ];
  return parts.join('; ') || 'Validation failed';
}

adminRouter.post('/recipes', async (req, res, next) => {
  try {
    const parsed = RecipeInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: zodMsg(parsed.error) }); return; }
    const condErr = await invalidConditions(parsed.data.healthFlags);
    if (condErr) { res.status(400).json({ error: condErr }); return; }
    const existing = await Recipe.findOne({ slug: parsed.data.slug });
    if (existing) { res.status(409).json({ error: 'Slug already exists' }); return; }
    const recipe = await Recipe.create(parsed.data);
    res.status(201).json(recipe);
  } catch (err) { next(err); }
});

adminRouter.put('/recipes/:id', async (req, res, next) => {
  try {
    const parsed = RecipeInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: zodMsg(parsed.error) }); return; }
    const condErr = await invalidConditions(parsed.data.healthFlags);
    if (condErr) { res.status(400).json({ error: condErr }); return; }
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { ...parsed.data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(recipe);
  } catch (err) { next(err); }
});

adminRouter.patch('/recipes/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(recipe);
  } catch (err) { next(err); }
});

adminRouter.delete('/recipes/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
});
