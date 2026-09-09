/**
 * migrate-avoid-to-caution.ts — the 'avoid' severity was removed from the health-
 * flag model (only safe / caution / indication remain). Convert any leftover
 * severity:'avoid' flags on recipes to 'caution' — the single remaining
 * contraindication level — so existing warnings are preserved and the documents
 * validate against the new schema. Idempotent.
 *
 *   Dry run (default, writes nothing):
 *     yarn workspace @vajeeva/api exec ts-node src/scripts/migrate-avoid-to-caution.ts
 *   Apply:
 *     yarn workspace @vajeeva/api exec ts-node src/scripts/migrate-avoid-to-caution.ts --apply
 *   Drop the 'avoid' flags entirely instead of converting them, add:  --drop
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Recipe } from '../models/Recipe';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

const APPLY = process.argv.includes('--apply');
const DROP = process.argv.includes('--drop');
const maskedUri = MONGO_URI.replace(/\/\/[^@]*@/, '//***:***@');

type Flag = { condition: string; severity: string };

async function run() {
  console.log(`Target: ${maskedUri}`);
  console.log(`Action: ${DROP ? "DROP 'avoid' flags" : "CONVERT 'avoid' → 'caution'"}`);
  console.log(`Mode:   ${APPLY ? 'APPLY — WILL WRITE' : 'DRY RUN — no writes'}\n`);

  await mongoose.connect(MONGO_URI!);

  const recipes = await Recipe.find({}, 'slug healthFlags').lean();

  let recipesChanged = 0;
  let avoidFound = 0;
  const lines: string[] = [];

  for (const r of recipes) {
    const flags = (r.healthFlags ?? []) as Flag[];
    const n = flags.filter(f => f.severity === 'avoid').length;
    if (n === 0) continue;

    recipesChanged++;
    avoidFound += n;
    const next = DROP
      ? flags.filter(f => f.severity !== 'avoid')
      : flags.map(f => (f.severity === 'avoid' ? { ...f, severity: 'caution' } : f));
    lines.push(`  ${r.slug}: ${n} avoid ${DROP ? 'dropped' : '→ caution'}`);

    if (APPLY) await Recipe.updateOne({ _id: r._id }, { $set: { healthFlags: next } });
  }

  console.log(lines.length ? lines.join('\n') : '  (no avoid flags found)');
  console.log(`\nRecipes ${APPLY ? 'updated' : 'to change'}: ${recipesChanged}`);
  console.log(`'avoid' flags ${APPLY ? (DROP ? 'dropped' : 'converted') : 'found'}: ${avoidFound}`);
  if (!APPLY) console.log('\nDry run — re-run with `--apply` to write these changes.');

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
