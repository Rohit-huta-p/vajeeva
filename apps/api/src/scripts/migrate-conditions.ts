/**
 * migrate-conditions.ts — normalise health-condition codes onto the canonical
 * vocabulary (lowercase slugs). Idempotent.
 *
 *   Dry run (default, writes nothing):  npm run migrate:conditions
 *   Apply:                              npm run migrate:conditions -- --apply
 *
 * - Recipe.healthFlags[].condition: legacy "Label (CODE)" and lowercase variants
 *   → canonical slugs; Ayurvedic doshas (pitta/vata/kapha) are DROPPED (logged per
 *   recipe so they can be re-applied from recipes-enriched.json if wanted).
 * - User.healthProfile[]: legacy 2-letter / UPPER_SNAKE codes → canonical slugs.
 * Unknown values are left untouched and reported.
 * See docs/specs/2026-09-03-condition-vocabulary.md.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Recipe } from '../models/Recipe';
import { User } from '../models/User';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

const APPLY = process.argv.includes('--apply');

const CANON = new Set([
  'diabetes', 'obesity', 'lactose-intolerance', 'sedentary', 'cardiac', 'pregnancy',
  'lactating', 'nut-allergy', 'infant-8m', 'elderly', 'gluten', 'anemia', 'acidity',
  'indigestion',
]);
const DROP = new Set(['pitta', 'vata', 'kapha']);

// Explicit legacy → canonical maps (exact strings seen in the data).
const RECIPE_MAP: Record<string, string> = {
  'Diabetes (DM)': 'diabetes',
  'Sedentary Lifestyle (SD)': 'sedentary',
  'Overweight / Obesity (OW)': 'obesity',
  'Lactose Intolerance (LI)': 'lactose-intolerance',
  lactose: 'lactose-intolerance',
  digestion: 'indigestion',
};
const USER_MAP: Record<string, string> = {
  DM: 'diabetes', OW: 'obesity', LI: 'lactose-intolerance', SD: 'sedentary',
  DIABETES: 'diabetes', OBESITY: 'obesity', LACTOSE_INTOLERANT: 'lactose-intolerance',
  SEDENTARY: 'sedentary', CARDIAC: 'cardiac', PREGNANT: 'pregnancy', LACTATING: 'lactating',
  NUT_ALLERGY: 'nut-allergy', INFANT_8M: 'infant-8m', ELDERLY: 'elderly',
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/\([^)]*\)/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Resolve one raw condition to { code } (keep/remap), { drop }, or { unknown }. */
function resolve(raw: string, map: Record<string, string>): { code?: string; drop?: boolean; unknown?: boolean } {
  const v = (raw ?? '').trim();
  if (!v) return { unknown: true };
  if (DROP.has(v.toLowerCase())) return { drop: true };
  if (map[v]) return { code: map[v] };
  if (CANON.has(v)) return { code: v };
  const slug = slugify(v);
  if (CANON.has(slug)) return { code: slug };
  return { unknown: true };
}

async function run() {
  console.log(`Connecting… (${APPLY ? 'APPLY — will write' : 'DRY RUN — no writes'})`);
  await mongoose.connect(MONGO_URI!);
  console.log('Connected.\n');

  // ── Recipes ────────────────────────────────────────────────────────────────
  let recipesChanged = 0;
  let flagsDropped = 0;
  const unknownRecipe = new Map<string, number>();
  const recipes = await Recipe.find({}, 'slug healthFlags').lean();

  for (const r of recipes) {
    const flags = (r.healthFlags ?? []) as { condition: string; severity: string; note?: string }[];
    const next: typeof flags = [];
    let changed = false;

    for (const f of flags) {
      const res = resolve(f.condition, RECIPE_MAP);
      if (res.drop) {
        changed = true; flagsDropped++;
        console.log(`  drop dosha → ${r.slug}: "${f.condition}" (${f.severity})`);
        continue;
      }
      if (res.unknown) {
        unknownRecipe.set(f.condition, (unknownRecipe.get(f.condition) ?? 0) + 1);
        next.push(f); // leave untouched
        continue;
      }
      if (res.code !== f.condition) changed = true;
      next.push({ ...f, condition: res.code! });
    }

    if (changed) {
      recipesChanged++;
      if (APPLY) await Recipe.updateOne({ _id: r._id }, { $set: { healthFlags: next } });
    }
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  let usersChanged = 0;
  const unknownUser = new Map<string, number>();
  const users = await User.find({ healthProfile: { $exists: true, $ne: [] } }, 'healthProfile').lean();

  for (const u of users) {
    const codes = (u.healthProfile ?? []) as string[];
    const next: string[] = [];
    let changed = false;
    for (const c of codes) {
      const res = resolve(c, USER_MAP);
      if (res.drop) { changed = true; continue; } // no dosha expected on a profile, but be safe
      if (res.unknown) { unknownUser.set(c, (unknownUser.get(c) ?? 0) + 1); next.push(c); continue; }
      if (res.code !== c) changed = true;
      if (!next.includes(res.code!)) next.push(res.code!); // de-dupe after remap
    }
    if (changed) {
      usersChanged++;
      if (APPLY) await User.updateOne({ _id: u._id }, { $set: { healthProfile: next } });
    }
  }

  // ── Report ───────────────────────────────────────────────────────────────
  console.log(`\nRecipes: ${recipesChanged} ${APPLY ? 'updated' : 'would change'}, ${flagsDropped} dosha flag(s) dropped.`);
  console.log(`Users:   ${usersChanged} ${APPLY ? 'updated' : 'would change'}.`);
  if (unknownRecipe.size) {
    console.log('\n⚠️  Unknown recipe conditions (left untouched — add to vocab or clean up):');
    for (const [k, n] of unknownRecipe) console.log(`     ${k} × ${n}`);
  }
  if (unknownUser.size) {
    console.log('\n⚠️  Unknown profile codes (left untouched):');
    for (const [k, n] of unknownUser) console.log(`     ${k} × ${n}`);
  }
  if (!APPLY) console.log('\nDry run — re-run with `-- --apply` to write these changes.');

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
