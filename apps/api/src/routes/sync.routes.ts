import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/requireAuth';
import { Recipe } from '../models/Recipe';
import { SavedRecipe } from '../models/SavedRecipe';
import { CookLog } from '../models/CookLog';
import { destroyFromCloudinary } from '../lib/cloudinary';

export const syncRouter = Router();
syncRouter.use(requireAuth);

syncRouter.get('/recipes', async (req, res, next) => {
  try {
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
    const recipes = await Recipe.find({ status: 'published', updatedAt: { $gt: since } }).lean();
    res.json(recipes);
  } catch (err) { next(err); }
});

syncRouter.get('/saved', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const saved = await SavedRecipe.find({ userId }).lean();
    const ids = saved.map(s => s.recipeId.toString());

    // ?format=map → { [id]: true } for efficient frontend lookup
    if (req.query.format === 'map') {
      const map: Record<string, boolean> = {};
      for (const id of ids) map[id] = true;
      res.json(map);
    } else {
      res.json(ids);
    }
  } catch (err) { next(err); }
});

/** Resolve a slug-or-ObjectId string to an ObjectId string.
 *  Returns null if the slug is unknown or if the id is invalid. */
async function resolveRecipeId(slugOrId: string): Promise<string | null> {
  if (mongoose.Types.ObjectId.isValid(slugOrId) && slugOrId.length === 24) {
    return slugOrId; // already an ObjectId
  }
  // treat as slug
  const recipe = await Recipe.findOne({ slug: slugOrId }).select('_id').lean();
  return recipe ? recipe._id.toString() : null;
}

syncRouter.post('/saved', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const { added = [], removed = [] } = req.body as { added: string[]; removed: string[] };

    // Resolve slugs → ObjectIds (skip unknowns)
    const resolvedAdded = (await Promise.all(added.map(resolveRecipeId))).filter(Boolean) as string[];
    const resolvedRemoved = (await Promise.all(removed.map(resolveRecipeId))).filter(Boolean) as string[];

    const addOps = resolvedAdded.map(recipeId =>
      SavedRecipe.findOneAndUpdate(
        { userId, recipeId },
        { userId, recipeId, savedAt: new Date() },
        { upsert: true, new: true }
      )
    );
    const removeOp = SavedRecipe.deleteMany({ userId, recipeId: { $in: resolvedRemoved } });
    await Promise.all([...addOps, removeOp]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── Cook log ("I made this") ─────────────────────────────────────────────────
// Append-only: each confirmed make is one row. The client batches makes (offline
// makes flush together on reconnect) and stays the source of truth for display.
// See docs/specs/2026-09-03-admin-outcomes.md.

interface PhotoInput { url?: string; publicId?: string; caption?: string; order?: number }
interface MakeInput { recipe: string; madeAt?: string; rating?: number; note?: string; photos?: PhotoInput[] }

const MAX_PHOTOS = 5; // per make — see docs/specs/2026-09-09-prepared-photos.md

/** Keep only well-formed photos (need url + publicId), bound the caption, cap the count. */
function sanitizePhotos(input: unknown): { url: string; publicId: string; caption: string; order: number }[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((p): p is PhotoInput => !!p && typeof p === 'object')
    .map((p, i) => ({
      url: String(p.url ?? ''),
      publicId: String(p.publicId ?? ''),
      caption: typeof p.caption === 'string' ? p.caption.slice(0, 300) : '',
      order: typeof p.order === 'number' ? p.order : i,
    }))
    .filter(p => p.url && p.publicId)
    .slice(0, MAX_PHOTOS);
}

// Upsert on the natural key (userId, recipeId, madeAt): a genuine repeat make has a
// new madeAt → new row (append-only preserved); re-sending the SAME make — e.g. to
// attach photos added after it first synced — updates that row instead of duplicating.
syncRouter.post('/cooked', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const makes = Array.isArray((req.body as { makes?: MakeInput[] }).makes)
      ? (req.body as { makes: MakeInput[] }).makes
      : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops = (await Promise.all(makes.map(async m => {
      const recipeId = await resolveRecipeId(String(m.recipe ?? ''));
      if (!recipeId) return null; // skip unknown recipe
      const madeAt = m.madeAt ? new Date(m.madeAt) : new Date();

      // Merge semantics: only set fields the client actually sent, so a partial
      // re-send (e.g. photos-only) never clobbers an existing rating or note.
      const set: Record<string, unknown> = {};
      if (typeof m.rating === 'number') set.rating = Math.min(5, Math.max(1, Math.round(m.rating)));
      if (typeof m.note === 'string') set.note = m.note.slice(0, 500);
      if (Array.isArray(m.photos)) set.photos = sanitizePhotos(m.photos);

      return {
        updateOne: {
          filter: { userId, recipeId, madeAt },
          update: Object.keys(set).length ? { $set: set } : { $setOnInsert: { photos: [] } },
          upsert: true,
        },
      };
    }))).filter(Boolean) as any[];

    if (ops.length) await CookLog.bulkWrite(ops);
    res.json({ ok: true, count: ops.length });
  } catch (err) { next(err); }
});

syncRouter.get('/cooked', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const logs = await CookLog.find({ userId })
      .sort({ madeAt: -1 })
      .populate<{ recipeId: { slug: string } | null }>('recipeId', 'slug')
      .lean();
    res.json(
      logs
        .filter(l => l.recipeId) // drop makes whose recipe was deleted
        .map(l => ({
          slug: (l.recipeId as unknown as { slug: string }).slug,
          madeAt: l.madeAt,
          rating: l.rating ?? null,
          note: l.note ?? '',
          photos: ((l.photos ?? []) as { url: string; publicId: string; caption?: string; order?: number }[])
            .map(p => ({ url: p.url, publicId: p.publicId, caption: p.caption ?? '', order: p.order ?? 0 })),
        })),
    );
  } catch (err) { next(err); }
});

// Remove one prepared-dish photo from a make — owner-scoped, then destroy the
// Cloudinary asset. See docs/specs/2026-09-09-prepared-photos.md §4.
syncRouter.delete('/cooked/photo', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const { recipe, madeAt, publicId } = req.body as { recipe?: string; madeAt?: string; publicId?: string };
    if (!publicId || !madeAt) { res.status(400).json({ error: 'publicId and madeAt required' }); return; }

    const recipeId = await resolveRecipeId(String(recipe ?? ''));
    if (!recipeId) { res.status(404).json({ error: 'Unknown recipe' }); return; }

    // Confirm the photo belongs to THIS user's make before destroying anything.
    const log = await CookLog.findOne({
      userId, recipeId, madeAt: new Date(madeAt), 'photos.publicId': publicId,
    });
    if (!log) { res.status(404).json({ error: 'Photo not found' }); return; }

    await CookLog.updateOne({ _id: log._id }, { $pull: { photos: { publicId } } });
    await destroyFromCloudinary(publicId);
    res.json({ ok: true });
  } catch (err) { next(err); }
});
