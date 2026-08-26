/**
 * seed-subrecipes.ts — idempotent upsert for canonical sub-recipes.
 * Run: npm run seed:subrecipes
 *
 * Computes usedIn from the DB at seed time — count published recipes
 * whose ingredient names match /aromatic powder/i.
 *
 * Safe to re-run: uses findOneAndUpdate + upsert. Never deletes.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { SubRecipe } from '../models/SubRecipe';
import { Recipe } from '../models/Recipe';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

// ─── Canonical data from vajeeva-recipes.md S-24 ─────────────────────────────
const SUBRECIPES = [
  {
    name: 'Aromatic Powder Blend',
    slug: 'aromatic-powder-blend',
    ingredients: [
      { name: 'Cardamom pods', qty: '3–4' },
      { name: 'Cloves',        qty: '2–3' },
      { name: 'Black pepper',  qty: '2–3' },
      { name: 'Cinnamon',      qty: '2–3 inch' },
      { name: 'Dry ginger',    qty: '2–3 inch' },
      { name: 'Edible camphor', qty: '2–3 crystals' },
    ],
    method: 'Grind all ingredients together to a fine powder. Cardamom and cloves go in last to preserve volatile oils. Do not over-grind.',
    note: 'Make in a small batch. Grind together fine. Store airtight, away from light — keeps up to 1 month. Use ¼–½ tsp per recipe.',
  },
];

async function computeUsedIn(slug: string): Promise<number> {
  if (slug === 'aromatic-powder-blend') {
    // Count published recipes that reference aromatic powder in any ingredient
    const recipes = await Recipe.find({ status: 'published' }).select('ingredients').lean();
    let count = 0;
    for (const recipe of recipes) {
      const ingredients = (recipe as any).ingredients ?? [];
      const matches = ingredients.some((ing: any) =>
      /aromatic powder/i.test(ing.nameEn ?? ing.name ?? ''));
      if (matches) count++;
    }
    return count;
  }
  return 0;
}

async function seed() {
  console.log('Connecting to Atlas…');
  await mongoose.connect(MONGO_URI!);
  console.log('Connected.\n');

  let inserted = 0;
  let updated = 0;

  for (const sub of SUBRECIPES) {
    const usedIn = await computeUsedIn(sub.slug);
    const existing = await SubRecipe.findOne({ slug: sub.slug });
    await SubRecipe.findOneAndUpdate(
      { slug: sub.slug },
      { ...sub, usedIn },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (existing) {
      updated++;
      console.log(`  updated  → ${sub.slug}  (usedIn=${usedIn})`);
    } else {
      inserted++;
      console.log(`  inserted → ${sub.slug}  (usedIn=${usedIn})`);
    }
  }

  console.log(`\nDone — inserted: ${inserted}, updated: ${updated}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
