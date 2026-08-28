// Build the bundled offline seed: a static snapshot of the audited recipe
// content shipped inside the app binary, so a brand-new install with no internet
// still shows the catalog on first launch (before its first sync). The live
// GET /api/recipes (published set, with admin images) remains the runtime source
// of truth — the first successful sync full-replaces this seed.
//
// Source: content/recipes-enriched.json (the same audited content the API seeds
// from). `status` is a DB/workflow field and is dropped; images ship empty and
// fill in on the first online sync.
//
// Run:  node scripts/build-catalog-seed.mjs   (from apps/frontend)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../../../../content/recipes-enriched.json');
const OUT = resolve(here, '../assets/catalog-seed.json');

const enriched = JSON.parse(readFileSync(SRC, 'utf-8'));
if (!Array.isArray(enriched)) throw new Error(`Expected an array in ${SRC}`);

// Keep every field the app might read; drop the workflow-only `status`, and
// guarantee `images: []` (headers are downloaded at runtime, not bundled).
const seed = enriched.map(({ status, ...r }) => ({ ...r, images: Array.isArray(r.images) ? r.images : [] }));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(seed)); // minified — it's a bundled asset

const bytes = Buffer.byteLength(JSON.stringify(seed));
console.log(`✅  Wrote ${seed.length} recipes → ${OUT} (${(bytes / 1024).toFixed(0)} KB)`);
