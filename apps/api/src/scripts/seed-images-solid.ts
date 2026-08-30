/**
 * seed-images-solid.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Bulk-uploads solid recipe hero images from content/solid-images/ to Cloudinary
 * using predictable public IDs, then upserts the images[] array on each recipe
 * document in MongoDB.
 *
 * Cloudinary folder layout:
 *   vajeeva/recipes/solid/s-01
 *   vajeeva/recipes/solid/s-02
 *   …
 *
 * Run:
 *   npx ts-node -r dotenv/config src/scripts/seed-images-solid.ts
 *
 * Flags (set as env vars before running):
 *   SKIP_SLUGS=s-01        Comma-separated slugs to skip (already uploaded).
 *   DRY_RUN=true           Log what would happen without touching Cloudinary/DB.
 *   OVERWRITE=true         Re-upload even if the public_id already exists in Cloudinary.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import fs from 'fs';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { Recipe } from '../models/Recipe';

cloudinary.config(); // reads CLOUDINARY_URL from env

// ── Config ────────────────────────────────────────────────────────────────────

const IMAGES_DIR  = path.resolve(__dirname, '../../../../../content/solid-images');
const CATEGORY    = 'solid';
const CLD_FOLDER  = `vajeeva/recipes/${CATEGORY}`;
const ORDER       = 1; // all seed images are hero shot, order=1

const SKIP_SLUGS  = new Set((process.env.SKIP_SLUGS ?? 's-01').split(',').map(s => s.trim()).filter(Boolean));
const DRY_RUN     = process.env.DRY_RUN === 'true';
const OVERWRITE   = process.env.OVERWRITE === 'true';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌  MONGO_URI not set'); process.exit(1); }

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Upload a local file to Cloudinary with a fixed public_id. */
function uploadFile(
  filePath: string,
  publicId: string,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        public_id:     publicId,
        folder:        undefined,   // public_id already includes the folder path
        overwrite:     OVERWRITE,
        resource_type: 'image',
        // Eager transform: generate a 1200-wide WebP for the hero immediately
        eager: [{ width: 1200, crop: 'limit', fetch_format: 'auto', quality: 'auto' }],
        eager_async: true,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('No result'));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🖼   Solid image seeder`);
  console.log(`    Source:    ${IMAGES_DIR}`);
  console.log(`    CLD path:  ${CLD_FOLDER}/<slug>`);
  console.log(`    Skip:      ${[...SKIP_SLUGS].join(', ') || '(none)'}`);
  console.log(`    Dry run:   ${DRY_RUN}`);
  console.log(`    Overwrite: ${OVERWRITE}\n`);

  // Collect image files: accept .jpg, .jpeg, .png, .webp
  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .map(f => {
      const slug = path.basename(f, path.extname(f)).toLowerCase(); // "s-02"
      return { slug, ext: path.extname(f), file: path.join(IMAGES_DIR, f) };
    })
    .filter(({ slug }) => {
      if (SKIP_SLUGS.has(slug)) {
        console.log(`  ⤼  ${slug} — skipped`);
        return false;
      }
      return true;
    })
    .sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));

  console.log(`  Queued: ${files.length} images\n`);

  if (!DRY_RUN) {
    console.log('🔗  Connecting to Atlas…');
    await mongoose.connect(MONGO_URI!);
    console.log('    Connected.\n');
  }

  const results: { slug: string; url: string; publicId: string }[] = [];
  const errors:  { slug: string; error: string }[] = [];

  for (const { slug, file } of files) {
    const publicId = `${CLD_FOLDER}/${slug}`;   // e.g. vajeeva/recipes/solid/s-02

    if (DRY_RUN) {
      console.log(`  ~ ${slug}  →  ${publicId}  (dry run)`);
      continue;
    }

    try {
      process.stdout.write(`  ↑  ${slug}  →  ${publicId} … `);
      const { secure_url, public_id } = await uploadFile(file, publicId);
      console.log('✓');

      // Upsert the images array on the recipe doc
      await Recipe.findOneAndUpdate(
        { slug },
        {
          $set: {
            // Replace the images array with just this hero shot (order=1).
            // If you want to ADD without replacing, use $addToSet or push logic.
            images: [{ url: secure_url, alt: '', order: ORDER }],
          },
        },
      );

      results.push({ slug, url: secure_url, publicId: public_id });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗  ${msg}`);
      errors.push({ slug, error: msg });
    }
  }

  if (!DRY_RUN) await mongoose.disconnect();

  console.log('\n── Summary ────────────────────────────────────────────');
  console.log(`   Uploaded + DB updated: ${results.length}`);
  console.log(`   Skipped:               ${SKIP_SLUGS.size}`);
  if (errors.length) {
    console.error(`   Errors (${errors.length}):`);
    errors.forEach(e => console.error(`     ${e.slug}: ${e.error}`));
  }
  console.log('───────────────────────────────────────────────────────\n');

  if (results.length) {
    console.log('Sample URLs:');
    results.slice(0, 3).forEach(r =>
      console.log(`  ${r.slug}: ${r.url}`)
    );
  }
  console.log('\n✅  Done.\n');
}

run().catch(err => { console.error('❌', err); process.exit(1); });
