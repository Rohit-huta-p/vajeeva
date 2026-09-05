import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { IngredientRule } from '../models/IngredientRule';
import { HealthFlagConfig } from '../models/HealthFlagConfig';
import { Recipe } from '../models/Recipe';
import { deriveFlags, mergeFlags, type Rule, type Flag } from '../lib/deriveHealthFlags';

export const dietRulesAdminRouter = Router();
dietRulesAdminRouter.use(requireAuth, requireAdmin);

// Normalise a rule payload: lowercase/trim match keywords, keep valid effects.
function cleanRule(body: any) {
  const match = Array.isArray(body.match)
    ? [...new Set(body.match.map((s: string) => String(s).toLowerCase().trim()).filter(Boolean))]
    : [];
  const effects = Array.isArray(body.effects)
    ? body.effects
        .filter((e: any) => e && e.condition && ['caution', 'avoid', 'indication'].includes(e.severity))
        .map((e: any) => ({ condition: String(e.condition), severity: e.severity }))
    : [];
  const excludedSlugs = Array.isArray(body.excludedSlugs)
    ? [...new Set(body.excludedSlugs.map((s: string) => String(s).trim()).filter(Boolean))]
    : [];
  return {
    ingredient: String(body.ingredient ?? '').trim(),
    match,
    effects,
    enabled: body.enabled !== false,
    excludedSlugs,
  };
}

// Reject effect conditions not in the vocabulary (skip when none configured).
async function invalidConditions(effects: { condition: string }[]): Promise<string | null> {
  const codes = new Set((await HealthFlagConfig.find({}, 'code').lean()).map(c => c.code));
  if (codes.size === 0) return null;
  const bad = [...new Set(effects.map(e => e.condition).filter(c => !codes.has(c)))];
  return bad.length ? `Unknown condition code(s): ${bad.join(', ')}` : null;
}

// GET /api/admin/diet-rules — all rules
dietRulesAdminRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await IngredientRule.find({}).sort({ ingredient: 1 }).lean());
  } catch (err) { next(err); }
});

// GET /api/admin/diet-rules/ingredients — distinct ingredient names + recipe counts
// (feeds the "add rule" autocomplete and the "used in N recipes" hint).
dietRulesAdminRouter.get('/ingredients', async (_req, res, next) => {
  try {
    const recipes = await Recipe.find({}, 'ingredients').lean();
    const counts = new Map<string, number>();
    for (const r of recipes) {
      const seen = new Set<string>();
      for (const ing of (r.ingredients ?? []) as { nameEn?: string }[]) {
        const name = (ing.nameEn ?? '').trim();
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    res.json([...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
  } catch (err) { next(err); }
});

dietRulesAdminRouter.post('/', async (req, res, next) => {
  try {
    const rule = cleanRule(req.body);
    if (!rule.ingredient) { res.status(400).json({ error: 'Ingredient name required' }); return; }
    const condErr = await invalidConditions(rule.effects);
    if (condErr) { res.status(400).json({ error: condErr }); return; }
    if (await IngredientRule.findOne({ ingredient: rule.ingredient })) {
      res.status(409).json({ error: 'A rule for that ingredient already exists' }); return;
    }
    res.status(201).json(await IngredientRule.create(rule));
  } catch (err) { next(err); }
});

dietRulesAdminRouter.put('/:id', async (req, res, next) => {
  try {
    const rule = cleanRule(req.body);
    const condErr = await invalidConditions(rule.effects);
    if (condErr) { res.status(400).json({ error: condErr }); return; }
    const doc = await IngredientRule.findByIdAndUpdate(req.params.id, rule, { new: true });
    if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(doc);
  } catch (err) { next(err); }
});

dietRulesAdminRouter.delete('/:id', async (req, res, next) => {
  try {
    const doc = await IngredientRule.findByIdAndDelete(req.params.id);
    if (!doc) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/admin/diet-rules/apply — derive flags across all recipes.
// Preview by default; pass { commit: true } to write. Manual flags are preserved.
dietRulesAdminRouter.post('/apply', async (req, res, next) => {
  try {
    const commit = (req.body as { commit?: boolean }).commit === true;
    const ruleDocs = await IngredientRule.find({ enabled: true }).lean();
    const recipes = await Recipe.find({}, 'slug nameEn ingredients healthFlags').lean();

    let added = 0, changed = 0, removed = 0, recipesAffected = 0, recipesWithOverrides = 0;
    const details: { slug: string; nameEn: string; added: number; changed: number; removed: number }[] = [];
    const writes: { id: unknown; next: Flag[] }[] = [];

    for (const r of recipes) {
      // Skip rules that have explicitly excluded this recipe's slug
      const applicable = ruleDocs.filter(
        rule => !(rule.excludedSlugs ?? []).includes(r.slug),
      ) as unknown as Rule[];
      const derived = deriveFlags((r.ingredients ?? []) as { nameEn?: string }[], applicable);
      const m = mergeFlags((r.healthFlags ?? []) as Flag[], derived);
      if (m.overrides > 0) recipesWithOverrides++;
      if (m.dirty) {
        recipesAffected++;
        added += m.added; changed += m.changed; removed += m.removed;
        if (details.length < 100) details.push({ slug: r.slug, nameEn: r.nameEn, added: m.added, changed: m.changed, removed: m.removed });
        writes.push({ id: r._id, next: m.next });
      }
    }

    if (commit) {
      for (const w of writes) await Recipe.updateOne({ _id: w.id }, { $set: { healthFlags: w.next } });
    }

    res.json({ committed: commit, added, changed, removed, recipesAffected, recipesWithOverrides, details });
  } catch (err) { next(err); }
});
