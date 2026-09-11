/**
 * sweep-orphan-photos.ts — delete prepared-dish photos in Cloudinary that no
 * CookLog references (an upload that succeeded but whose make never synced, e.g.
 * the patient abandoned before the write). Idempotent; safe to run on a schedule.
 *
 * Run:  npm run sweep:photos          (deletes)
 *       npm run sweep:photos -- --dry  (preview only)
 *
 * Needs CLOUDINARY_URL + MONGO_URI in .env. Uses the Cloudinary Admin API to list
 * the per-user prepared/ folder. See docs/specs/2026-09-09-prepared-photos.md §4, §8.
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB, disconnectDB } from '../db';
import { CookLog } from '../models/CookLog';
import { cloudinary } from '../lib/cloudinary';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

const PREFIX = 'vajeeva/prepared/';
const MIN_AGE_MS = 1000 * 60 * 60 * 24 * 2; // 2 days — spare in-flight/queued uploads
const DRY = process.argv.includes('--dry');

/** Every publicId currently attached to a make. */
async function referencedPublicIds(): Promise<Set<string>> {
  const cooks = await CookLog.find({ 'photos.0': { $exists: true } }, 'photos').lean();
  const ids = new Set<string>();
  for (const c of cooks) {
    for (const p of ((c.photos ?? []) as { publicId?: string }[])) {
      if (p.publicId) ids.add(p.publicId);
    }
  }
  return ids;
}

/** Page through every stored asset under the prepared/ prefix. */
async function* listPreparedAssets(): AsyncGenerator<{ public_id: string; created_at: string }> {
  let next: string | undefined;
  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await cloudinary.api.resources({
      type: 'upload', prefix: PREFIX, max_results: 500, next_cursor: next,
    });
    for (const r of res.resources ?? []) yield r;
    next = res.next_cursor;
  } while (next);
}

async function main(): Promise<void> {
  await connectDB(MONGO_URI!);
  const referenced = await referencedPublicIds();
  const cutoff = Date.now() - MIN_AGE_MS;
  let scanned = 0, orphaned = 0, deleted = 0;

  for await (const asset of listPreparedAssets()) {
    scanned++;
    if (referenced.has(asset.public_id)) continue;
    if (new Date(asset.created_at).getTime() > cutoff) continue; // too new — may be mid-flight
    orphaned++;
    if (DRY) {
      console.log(`[dry] orphan ${asset.public_id} (created ${asset.created_at})`);
    } else {
      try { await cloudinary.uploader.destroy(asset.public_id); deleted++; }
      catch (e) { console.error(`failed to delete ${asset.public_id}:`, (e as Error).message); }
    }
  }

  console.log(`sweep: scanned ${scanned}, orphaned ${orphaned}, deleted ${deleted}${DRY ? ' (dry run)' : ''}`);
  await disconnectDB();
}

main().catch(async (e) => {
  console.error(e);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
