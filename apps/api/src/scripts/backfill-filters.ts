/**
 * backfill-filters.ts — seed each recipe's Home filter-pill codes (`filters[]`)
 * from the tags/fields it already carries. Additive + idempotent: only unions in
 * the computed baseline, so admin edits in the recipe editor survive a re-run.
 * Run: npm run backfill:filters
 *
 * Mapping (see docs/specs/2026-09-02-home-filter-pills.md):
 *   sweet / savoury      ← dietTags
 *   refreshing           ← category 'liquid' or meal 'drink'
 *   breakfast/snack/side ← meals
 *   make-ahead           ← makeAhead flag
 *   no-cook              ← method 'no-cook'
 *   quick                ← totalTimeMin ≤ 20 (when set)
 *   spicy                ← admin-only (no source)
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Recipe } from '../models/Recipe';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

function computeFilters(r: any): string[] {
  const out = new Set<string>();
  const diet: string[] = r.dietTags ?? [];
  const meals: string[] = r.meals ?? [];
  const methods: string[] = r.methods ?? [];
  if (diet.includes('sweet')) out.add('sweet');
  if (diet.includes('savoury')) out.add('savoury');
  if (r.category === 'liquid' || meals.includes('drink')) out.add('refreshing');
  for (const m of ['breakfast', 'snack', 'side']) if (meals.includes(m)) out.add(m);
  if (r.makeAhead === true) out.add('make-ahead');
  if (methods.includes('no-cook')) out.add('no-cook');
  if (typeof r.totalTimeMin === 'number' && r.totalTimeMin > 0 && r.totalTimeMin <= 20) out.add('quick');
  return [...out];
}

async function run() {
  console.log('Connecting…');
  await mongoose.connect(MONGO_URI!);
  console.log('Connected.\n');

  const recipes = await Recipe.find({});
  let changed = 0;
  for (const r of recipes) {
    const obj = r.toObject() as any;
    const existing: string[] = obj.filters ?? [];
    const merged = Array.from(new Set([...existing, ...computeFilters(obj)]));
    if (merged.length !== existing.length) {
      r.set('filters', merged);
      await r.save();
      changed++;
      console.log(`  ${obj.slug} → [${merged.join(', ')}]`);
    }
  }

  console.log(`\nDone — ${changed}/${recipes.length} recipes updated.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
