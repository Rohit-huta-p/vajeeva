/**
 * seed-tags.ts — idempotent upsert for the discovery-tag vocabulary (TagConfig).
 * Run: npm run seed:tags
 *
 * Safe to re-run: findOneAndUpdate + upsert keyed on (facet, code). Never deletes,
 * so admin edits made via the Tags page are preserved (a re-run only re-adds the
 * curated defaults). See docs/specs/2026-08-24-discovery-tags.md.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { TagConfig } from '../models/TagConfig';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SIMPLE_FACETS = ['type', 'meal', 'ingredient', 'method', 'diet'] as const;
const VOCAB: Record<(typeof SIMPLE_FACETS)[number], string[]> = {
  type: ['Roti', 'Paratha', 'Laddu', 'Halwa', 'Vada', 'Panaka', 'Buttermilk', 'Soup', 'Payasa', 'Porridge', 'Shrikhand', 'Chutney', 'Preserve', 'Rice'],
  meal: ['Breakfast', 'Snack', 'Side', 'Drink', 'Dessert'],
  ingredient: ['Coconut', 'Barley', 'Amla', 'Black gram', 'Milk', 'Ghee', 'Jaggery', 'Sesame'],
  method: ['Steamed', 'Fried', 'Baked', 'Roasted', 'Boiled', 'No-cook', 'Fermented', 'Soaked'],
  diet: ['Sweet', 'Savoury', 'No added sugar', 'Dairy', 'High protein'],
};

// Home filter pills (facet 'filter'). Each pill's `group` drives the Home layout:
// effort renders flat; taste/occasion render as tap-to-open dropdowns.
const FILTER_VOCAB: { label: string; group: 'effort' | 'taste' | 'occasion' }[] = [
  { label: 'Quick',      group: 'effort' },
  { label: 'No-cook',    group: 'effort' },
  { label: 'Make-ahead', group: 'effort' },
  { label: 'Sweet',      group: 'taste' },
  { label: 'Savoury',    group: 'taste' },
  { label: 'Spicy',      group: 'taste' },
  { label: 'Refreshing', group: 'taste' },
  { label: 'Breakfast',  group: 'occasion' },
  { label: 'Snack',      group: 'occasion' },
  { label: 'Side',       group: 'occasion' },
];

async function seed() {
  console.log('Connecting…');
  await mongoose.connect(MONGO_URI!);
  console.log('Connected.\n');

  let inserted = 0;
  let updated = 0;

  for (const facet of SIMPLE_FACETS) {
    let order = 1;
    for (const label of VOCAB[facet]) {
      const code = slug(label);
      const existing = await TagConfig.findOne({ facet, code });
      await TagConfig.findOneAndUpdate(
        { facet, code },
        { facet, code, label, order, enabled: true },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      if (existing) { updated++; } else { inserted++; console.log(`  inserted → ${facet}/${code}`); }
      order++;
    }
  }

  // Home filter pills — facet 'filter', carrying a group.
  {
    let order = 1;
    for (const { label, group } of FILTER_VOCAB) {
      const code = slug(label);
      const existing = await TagConfig.findOne({ facet: 'filter', code });
      await TagConfig.findOneAndUpdate(
        { facet: 'filter', code },
        { facet: 'filter', code, label, order, enabled: true, group },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      if (existing) { updated++; } else { inserted++; console.log(`  inserted → filter/${code}`); }
      order++;
    }
  }

  console.log(`\nDone — inserted: ${inserted}, updated: ${updated}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
