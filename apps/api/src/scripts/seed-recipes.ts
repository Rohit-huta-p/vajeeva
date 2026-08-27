/**
 * seed-recipes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Idempotent upsert: loads content/recipes-parsed.json and upserts all 83
 * recipes into the Recipe collection by slug.
 *
 * Run:  npm run seed:recipes   (from apps/api)
 *
 * Safety rules
 * ────────────
 * • Source-derived fields (nameEn, ingredients, steps, sources, …) are always
 *   refreshed from the parsed JSON — keeps the DB in sync with the audited MD.
 * • Admin-enriched fields (status, description, images, discovery tags, …)
 *   are set ONLY on first insert ($setOnInsert) — re-running never overwrites
 *   a recipe the admin has published or enriched.
 *
 * Notes on existing data
 * ──────────────────────
 * Earlier seed runs used descriptive slugs (e.g. "coconut-delight-narikera-ksheeri").
 * Those documents are unaffected — this script matches only by the new code-based
 * slug format (e.g. "m-11"). Retire the old slugs via the admin when convenient.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import fs from 'fs';
import mongoose from 'mongoose';
import { Recipe } from '../models/Recipe';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI not set in .env');
  process.exit(1);
}

// ── Load the parsed/enriched recipe data ──────────────────────────────────────
// Prefers recipes-enriched.json (produced by  npm run enrich:recipes).
// Falls back to recipes-parsed.json if the enriched file doesn't exist yet.

const ENRICHED_PATH = path.resolve(__dirname, '../../../../../content/recipes-enriched.json');
const PARSED_PATH   = path.resolve(__dirname, '../../../../../content/recipes-parsed.json');

const JSON_PATH = fs.existsSync(ENRICHED_PATH) ? ENRICHED_PATH : PARSED_PATH;

if (!fs.existsSync(JSON_PATH)) {
  console.error('❌  No recipe JSON found. Expected one of:');
  console.error(`   ${ENRICHED_PATH}`);
  console.error(`   ${PARSED_PATH}`);
  console.error('   Run  npm run parse:md  (and optionally  npm run enrich:recipes)  first.');
  process.exit(1);
}

const usingEnriched = JSON_PATH === ENRICHED_PATH;
console.log(`\n📂  Loading ${usingEnriched ? 'enriched' : 'parsed'} recipe JSON`);
console.log(`    ${JSON_PATH}`);

const parsed: RecipeParsed[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// ── Types (subset used by the seed — full shape lives in parse-md.ts) ─────────

interface Ingredient {
  nameEn: string; quantityG: string; quantityMl: string;
  quantityCup: string; note: string;
}
interface Step {
  order: number; text: string; phase: string; heat: string | null;
  timerStr: string | null; stepIngredients: string[]; illColor: string;
}
interface HealthFlag { condition: string; severity: string; note: string; }
interface Source    { citation: string; text: string; }

interface RecipeParsed {
  slug: string; nameEn: string; nameTa: string;
  category: 'solid' | 'liquid' | 'semi-solid';
  description: string;
  ingredients: Ingredient[]; steps: Step[];
  healthFlags: HealthFlag[]; sources: Source[];
  totalTimeMin?: number;
  yieldStr: string; shelfLife: string;
  type: string; meals: string[]; mainIngredients: string[];
  methods: string[]; dietTags: string[];
  makeAhead: boolean; prepAheadNote: string;
  status: 'draft' | 'published'; images: never[];
}

// ── Upsert runner ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🔗  Connecting to Atlas…');
  await mongoose.connect(MONGO_URI!);
  console.log('    Connected.\n');

  const counts = { inserted: 0, updated: 0, errored: 0 };
  const byCategory: Record<string, number> = { solid: 0, liquid: 0, 'semi-solid': 0 };

  for (const recipe of parsed) {
    try {
      // Fields always refreshed from the audited MD source
      const sourceFields = {
        nameEn:      recipe.nameEn,
        nameTa:      recipe.nameTa,
        category:    recipe.category,
        sources:     recipe.sources,
        yieldStr:    recipe.yieldStr,
        ingredients: recipe.ingredients,
        steps:       recipe.steps,
        healthFlags: recipe.healthFlags,
      };

      // Fields set only on first insert — never overwrite admin enrichment.
      // When an enriched JSON is loaded these fields come pre-populated;
      // on re-seed of an existing doc they are silently ignored by $setOnInsert.
      const insertOnlyFields = {
        description:     recipe.description     ?? '',
        shelfLife:       recipe.shelfLife        ?? '',
        status:          'draft' as const,
        type:            recipe.type             ?? '',
        meals:           recipe.meals            ?? [],
        mainIngredients: recipe.mainIngredients  ?? [],
        methods:         recipe.methods          ?? [],
        dietTags:        recipe.dietTags         ?? [],
        makeAhead:       recipe.makeAhead        ?? false,
        prepAheadNote:   recipe.prepAheadNote    ?? '',
        totalTimeMin:    recipe.totalTimeMin,
        images:          [] as never[],
      };

      const result = await Recipe.findOneAndUpdate(
        { slug: recipe.slug },
        {
          $set:         sourceFields,
          $setOnInsert: insertOnlyFields,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Detect insert vs update: on insert, updatedAt ≈ createdAt
      const doc = result as { createdAt?: Date; updatedAt?: Date };
      const isNew = doc.createdAt && doc.updatedAt &&
        Math.abs(doc.createdAt.getTime() - doc.updatedAt.getTime()) < 1000;

      if (isNew) {
        counts.inserted++;
        console.log(`  ＋ [${recipe.category}] ${recipe.nameEn}`);
      } else {
        counts.updated++;
        console.log(`  ↺ [${recipe.category}] ${recipe.nameEn}`);
      }
      byCategory[recipe.category]++;

    } catch (err) {
      counts.errored++;
      console.error(`  ✗ ${recipe.slug} — ${(err as Error).message}`);
    }
  }

  console.log('\n── Summary ────────────────────────────────────────────');
  console.log(`   Inserted (new):  ${counts.inserted}`);
  console.log(`   Updated:         ${counts.updated}`);
  if (counts.errored) console.error(`   Errored:         ${counts.errored}`);
  console.log(`   ─`);
  console.log(`   Solid:           ${byCategory.solid}`);
  console.log(`   Liquid:          ${byCategory.liquid}`);
  console.log(`   Semi-solid:      ${byCategory['semi-solid']}`);
  console.log(`   Total:           ${parsed.length}`);
  console.log('───────────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('✅  Done.\n');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
