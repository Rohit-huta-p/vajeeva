/**
 * wipe-rule-flags.ts — remove leftover health-flags that the (now-deleted) Diet
 * Rules engine had written onto recipes (source: 'rule'). Hand-entered ('manual'
 * / legacy) flags are kept. Idempotent — safe to re-run.
 *
 *   Dry run (default, writes nothing):
 *     yarn workspace @vajeeva/api exec ts-node src/scripts/wipe-rule-flags.ts
 *   Apply:
 *     yarn workspace @vajeeva/api exec ts-node src/scripts/wipe-rule-flags.ts --apply
 *   Clear ALL health flags (not just rule-origin), add:  --all
 *   Target a different DB than .env:  prefix with  MONGO_URI='mongodb+srv://…'
 *
 * NOTE: the `source` field was dropped from the schema when Diet Rules was
 * removed, but existing recipe documents still carry it in stored data — `.lean()`
 * returns the raw document, so `f.source` is still visible here.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Recipe } from '../models/Recipe';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

const APPLY = process.argv.includes('--apply');
const ALL = process.argv.includes('--all');

type Flag = { condition: string; severity: string; note?: string; source?: string };

const maskedUri = MONGO_URI.replace(/\/\/[^@]*@/, '//***:***@');

async function run() {
  console.log(`Target: ${maskedUri}`);
  console.log(`Scope:  ${ALL ? 'ALL health flags on every recipe' : "only source:'rule' flags (keeping manual)"}`);
  console.log(`Mode:   ${APPLY ? 'APPLY — WILL WRITE' : 'DRY RUN — no writes'}\n`);

  await mongoose.connect(MONGO_URI!);

  const recipes = await Recipe.find({}, 'slug healthFlags').lean();

  let recipesChanged = 0;
  let flagsRemoved = 0;
  let flagsKept = 0;
  const lines: string[] = [];

  for (const r of recipes) {
    const flags = (r.healthFlags ?? []) as Flag[];
    if (flags.length === 0) continue;

    const next = ALL ? [] : flags.filter(f => f.source !== 'rule');
    const removed = flags.length - next.length;

    if (removed === 0) { flagsKept += flags.length; continue; }

    recipesChanged++;
    flagsRemoved += removed;
    flagsKept += next.length;
    lines.push(`  ${r.slug}: −${removed} removed, ${next.length} kept`);

    if (APPLY) await Recipe.updateOne({ _id: r._id }, { $set: { healthFlags: next } });
  }

  console.log(lines.length ? lines.join('\n') : '  (no recipes affected)');
  console.log(`\nRecipes ${APPLY ? 'updated' : 'to change'}: ${recipesChanged}`);
  console.log(`Flags ${APPLY ? 'removed' : 'to remove'}:   ${flagsRemoved}`);
  console.log(`Flags kept:            ${flagsKept}`);
  if (!APPLY) console.log('\nDry run — re-run with `--apply` to write these changes.');

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
