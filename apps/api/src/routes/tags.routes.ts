import { Router } from 'express';
import { TagConfig, TAG_FACETS } from '../models/TagConfig';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

// Response is grouped by facet so the app can render chips/tiles per facet.
// { type: [...], meal: [...], ingredient: [...], method: [...], diet: [...] }
function emptyGrouped<T>(): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const f of TAG_FACETS) out[f] = [];
  return out;
}
const isFacet = (f: unknown): boolean => (TAG_FACETS as readonly string[]).includes(f as string);

// ── Public: GET /api/tags → enabled values only, {code,label}, ordered ────────
export const tagsPublicRouter = Router();

tagsPublicRouter.get('/', async (_req, res, next) => {
  try {
    const items = await TagConfig.find({ enabled: true }).sort({ order: 1, label: 1 }).lean();
    const out = emptyGrouped<{ code: string; label: string; group?: string }>();
    for (const it of items) {
      if (isFacet(it.facet)) out[it.facet].push({ code: it.code, label: it.label, ...(it.group ? { group: it.group } : {}) });
    }
    res.json(out);
  } catch (err) { next(err); }
});

// ── Admin: GET (full state) + PUT (bulk replace), same shape as health-flags ──
export const tagsAdminRouter = Router();
tagsAdminRouter.use(requireAuth, requireAdmin);

interface TagState { code: string; label: string; order: number; enabled: boolean; group?: string }

tagsAdminRouter.get('/', async (_req, res, next) => {
  try {
    const items = await TagConfig.find({}).sort({ order: 1, label: 1 }).lean();
    const out = emptyGrouped<TagState>();
    for (const it of items) {
      if (isFacet(it.facet)) {
        out[it.facet].push({ code: it.code, label: it.label, order: it.order ?? 0, enabled: it.enabled, ...(it.group ? { group: it.group } : {}) });
      }
    }
    res.json(out);
  } catch (err) { next(err); }
});

// Full-replace semantics (delete all, insert the incoming vocab).
tagsAdminRouter.put('/', async (req, res, next) => {
  try {
    const body = req.body as Record<string, TagState[]> | null;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: 'Body must be a facet-keyed object' }); return;
    }
    const docs: Array<{ facet: string; code: string; label: string; order: number; enabled: boolean; group: string }> = [];
    for (const facet of TAG_FACETS) {
      const list = body[facet];
      if (list === undefined) continue;
      if (!Array.isArray(list)) { res.status(400).json({ error: `Facet '${facet}' must be an array` }); return; }
      const seen = new Set<string>();
      for (const t of list) {
        const code = typeof t?.code === 'string' ? t.code.trim() : '';
        const label = typeof t?.label === 'string' ? t.label.trim() : '';
        if (!code || !label) { res.status(400).json({ error: `Invalid tag in '${facet}': code and label are required` }); return; }
        if (seen.has(code)) { res.status(400).json({ error: `Duplicate code '${code}' in facet '${facet}'` }); return; }
        seen.add(code);
        docs.push({ facet, code, label, order: Number(t.order) || 0, enabled: t.enabled !== false, group: typeof t.group === 'string' ? t.group : '' });
      }
    }
    await TagConfig.deleteMany({});
    if (docs.length > 0) await TagConfig.insertMany(docs);

    const saved = await TagConfig.find({}).sort({ order: 1, label: 1 }).lean();
    const out = emptyGrouped<TagState>();
    for (const it of saved) {
      if (isFacet(it.facet)) {
        out[it.facet].push({ code: it.code, label: it.label, order: it.order ?? 0, enabled: it.enabled, ...(it.group ? { group: it.group } : {}) });
      }
    }
    res.json(out);
  } catch (err) { next(err); }
});
