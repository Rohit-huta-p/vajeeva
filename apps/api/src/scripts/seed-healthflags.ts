/**
 * seed-healthflags.ts — idempotent upsert for the condition vocabulary
 * (HealthFlagConfig). Run: npm run seed:healthflags
 *
 * The single admin-owned condition list — source of truth for both the patient
 * health-profile grid and recipe health-flag conditions. Codes are lowercase
 * slugs (matches recipe data + TagConfig). Safe to re-run: findOneAndUpdate +
 * upsert keyed on `code`, never deletes, so admin-added custom conditions are
 * preserved (a re-run only re-adds / refreshes the curated defaults).
 * See docs/specs/2026-09-03-condition-vocabulary.md.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { HealthFlagConfig } from '../models/HealthFlagConfig';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

const VOCAB: { code: string; label: string; emoji: string; description: string }[] = [
  { code: 'diabetes',            label: 'Diabetes',            emoji: '🩸', description: 'High blood sugar — avoid recipes high in simple carbohydrates.' },
  { code: 'obesity',             label: 'Obesity',             emoji: '⚖️', description: 'Weight management — prefer low-calorie, high-fibre preparations.' },
  { code: 'lactose-intolerance', label: 'Lactose intolerance', emoji: '🥛', description: 'Dairy intolerance — exclude milk-based ingredients.' },
  { code: 'sedentary',           label: 'Sedentary lifestyle', emoji: '🪑', description: 'Low activity — prefer easily digestible, light recipes.' },
  { code: 'cardiac',             label: 'Cardiac',             emoji: '❤️', description: 'Heart conditions — avoid high-sodium, high-fat preparations.' },
  { code: 'pregnancy',           label: 'Pregnancy',           emoji: '🤱', description: 'Pregnancy — avoid bitter, pungent, or uterine-stimulating foods.' },
  { code: 'lactating',           label: 'Lactating',           emoji: '🍼', description: 'Lactation — favour galactagogues; avoid strong spices.' },
  { code: 'nut-allergy',         label: 'Nut allergy',         emoji: '🥜', description: 'Tree nut or peanut allergy — exclude all nut-derived ingredients.' },
  { code: 'infant-8m',           label: 'Infant (8m+)',        emoji: '👶', description: 'Complementary feeding — soft textures, no added salt or sugar.' },
  { code: 'elderly',             label: 'Elderly / frail',     emoji: '🧓', description: 'Older adults — easy-to-chew, low-spice, easy to digest.' },
  { code: 'gluten',              label: 'Gluten',              emoji: '🌾', description: 'Gluten sensitivity — exclude wheat, barley, and rye.' },
  { code: 'anemia',              label: 'Anemia',              emoji: '🍃', description: 'Low iron — favour iron-rich foods; watch iron-blockers.' },
  { code: 'acidity',            label: 'Acidity',             emoji: '🔥', description: 'Acid reflux — avoid very sour, spicy, or fried preparations.' },
  { code: 'indigestion',         label: 'Indigestion',         emoji: '🌀', description: 'Weak digestion — prefer light, easily digestible foods.' },
];

async function seed() {
  console.log('Connecting…');
  await mongoose.connect(MONGO_URI!);
  console.log('Connected.\n');

  let inserted = 0;
  let updated = 0;
  let order = 1;

  for (const { code, label, emoji, description } of VOCAB) {
    const existing = await HealthFlagConfig.findOne({ code });
    await HealthFlagConfig.findOneAndUpdate(
      { code },
      { code, label, emoji, description, order, enabled: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (existing) { updated++; } else { inserted++; console.log(`  inserted → ${code}`); }
    order++;
  }

  console.log(`\nDone — inserted: ${inserted}, updated: ${updated}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
