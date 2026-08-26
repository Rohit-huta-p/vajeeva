/**
 * seed-recipes.ts
 * ---------------
 * Idempotent seed: upserts 4-5 real recipes from each texture pillar
 * (solid / liquid / semi-solid) into the Recipe collection on Atlas.
 *
 * Run: npm run seed:recipes
 *
 * Uses MONGO_URI from .env. Never deletes existing data — upserts by slug only.
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Recipe } from '../models/Recipe';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');

// ─── Type helpers ────────────────────────────────────────────────────────────
interface Ingredient { nameEn: string; quantityG: string; quantityCup: string; }
interface Step { order: number; text: string; phase: string; heat: string | null; timerStr: string | null; stepIngredients: string[]; illColor: string; }
interface HealthFlag { condition: string; severity: 'safe' | 'caution' | 'avoid'; note: string; }
interface Source { text: string; citation: string; }
interface RecipeSeed {
  slug: string; nameEn: string; nameTa: string; category: 'solid' | 'liquid' | 'semi-solid';
  description: string; ingredients: Ingredient[]; steps: Step[];
  healthFlags: HealthFlag[]; sources: Source[]; yieldStr: string; shelfLife: string;
}

// ─── Colors per phase (CookMode IllustrationView) ────────────────────────────
const C = {
  prep:    '#E8F4E8',  // soft green — prep / soak
  cook:    '#FEF3C7',  // warm amber — active cooking
  fry:     '#FDE68A',  // golden — frying / roasting
  boil:    '#DBEAFE',  // blue-tint — boiling
  cool:    '#EDE9FE',  // lavender — resting / cooling
  shape:   '#FCE7F3',  // blush — shaping / plating
  finish:  '#D1FAE5',  // mint — final step
};

// ─── Health flag notes ────────────────────────────────────────────────────────
const FLAG = {
  DM: (extra = '') => ({ condition: 'Diabetes (DM)', severity: 'caution' as const, note: `High in sugars/glycaemic load — consume sparingly.${extra}` }),
  OW: (extra = '') => ({ condition: 'Overweight / Obesity (OW)', severity: 'caution' as const, note: `Calorie-dense preparation — portion carefully.${extra}` }),
  LI: (extra = '') => ({ condition: 'Lactose Intolerance (LI)', severity: 'caution' as const, note: `Contains dairy (milk/ghee/curd) — substitute with non-dairy alternatives.${extra}` }),
  SD: (extra = '') => ({ condition: 'Sedentary Lifestyle (SD)', severity: 'caution' as const, note: `Rich in fat/sugar — balance with physical activity.${extra}` }),
};

// ─── Source map (code → full citation text) ──────────────────────────────────
const SRC = {
  BK:   'Bhojana Kutuhala (Siddhannaprakarana)',
  KK:   'Ksemakutūhalam (Ksema Sarmakrut) — Pandey ed.',
  BP:   'Bhavaprakash Nighantu (Kritanna varga)',
  CS:   'Charak Sutrasthana',
  CC:   'Charaka Chikitsasthana',
  BR:   'Bhaishyaja Ratnavali',
  SS:   'Sarngadhara Samhita (Madhyama Khanda)',
  MC:   'Morningstar — Ayurvedic Cooking for All, 3rd repr. 2011',
  AYUSH:'Traditional food recipes from Ayush systems of medicine',
  ICMR: 'ICMR-NIN Dietary Guidelines for Indians, 2024',
};

// ─────────────────────────────────────────────────────────────────────────────
// SOLIDS — 5 recipes
// ─────────────────────────────────────────────────────────────────────────────
const SOLIDS: RecipeSeed[] = [

  // S-07 · Vada (Vataka)
  {
    slug: 'vada-vataka',
    nameEn: 'Vada',
    nameTa: 'Vataka',
    category: 'solid',
    description: 'Crisp, golden black-gram fritters spiced with ginger and hingu — a classical Ayurvedic deep-fried snack prized for its lightness and digestive qualities.',
    ingredients: [
      { nameEn: 'De-husked black gram', quantityG: '80–100 g', quantityCup: '½ cup' },
      { nameEn: 'Rock salt', quantityG: 'a pinch', quantityCup: '—' },
      { nameEn: 'Wet ginger paste', quantityG: '2 g', quantityCup: '¼ tsp' },
      { nameEn: 'Hingu (asafoetida)', quantityG: '1 g', quantityCup: '⅛ tsp' },
      { nameEn: 'Oil', quantityG: 'for frying', quantityCup: '—' },
    ],
    steps: [
      { order: 1, text: 'Wash black gram; soak 4–6 hr. Drain and grind with minimal water into a smooth, thick batter. Beat until light and fluffy.', phase: 'Prep', heat: null, timerStr: '4–6 hr soak', stepIngredients: ['De-husked black gram'], illColor: C.prep },
      { order: 2, text: 'Mix in rock salt, ginger paste, and hingu.', phase: 'Mix', heat: null, timerStr: null, stepIngredients: ['Rock salt', 'Wet ginger paste', 'Hingu (asafoetida)'], illColor: C.prep },
      { order: 3, text: 'Heat oil over medium flame. Wet hands; take batter, shape into vada with a hole in the centre. Slide gently into hot oil; deep fry until golden and crisp on both sides.', phase: 'Fry', heat: 'medium', timerStr: '4–5 min', stepIngredients: ['Oil'], illColor: C.fry },
      { order: 4, text: 'Drain on paper. Serve with a side dish of your choice.', phase: 'Finish', heat: null, timerStr: null, stepIngredients: [], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.BK, citation: 'Vatakavishesha, p. 54' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '3–4 medium vada',
    shelfLife: 'Best eaten immediately',
  },

  // S-13 · Green Gram & Fenugreek Chila
  {
    slug: 'green-gram-fenugreek-chila',
    nameEn: 'Green Gram & Fenugreek Chila',
    nameTa: '—',
    category: 'solid',
    description: 'Light, protein-rich savoury pancakes of green gram sprouts and fenugreek leaves — an Ayush-recommended breakfast balancing bitterness with earthy warmth.',
    ingredients: [
      { nameEn: 'Green gram sprouts', quantityG: '200 g', quantityCup: '1 cup' },
      { nameEn: 'Chopped fenugreek leaves', quantityG: '100 g', quantityCup: '½ cup' },
      { nameEn: 'Ginger', quantityG: 'a small piece', quantityCup: '—' },
      { nameEn: 'Bengal gram flour', quantityG: '10 g', quantityCup: '2 tsp' },
      { nameEn: 'Turmeric powder', quantityG: '1–2 g', quantityCup: '¼ tsp' },
      { nameEn: 'Salt', quantityG: 'to taste', quantityCup: '—' },
      { nameEn: 'Ghee / Oil', quantityG: '5 ml', quantityCup: '1 tsp' },
    ],
    steps: [
      { order: 1, text: 'Grind sprouts with ginger to a smooth batter consistency.', phase: 'Prep', heat: null, timerStr: null, stepIngredients: ['Green gram sprouts', 'Ginger'], illColor: C.prep },
      { order: 2, text: 'Add fenugreek leaves, Bengal gram flour, turmeric, and salt; mix well. Rest 15 min.', phase: 'Mix', heat: null, timerStr: '15 min rest', stepIngredients: ['Chopped fenugreek leaves', 'Bengal gram flour', 'Turmeric powder', 'Salt'], illColor: C.prep },
      { order: 3, text: 'Heat a flat pan; grease lightly with oil. Pour a ladleful of batter; spread in a circular motion. Cook until crispy on one side, then flip.', phase: 'Cook', heat: 'medium', timerStr: '3–4 min per side', stepIngredients: ['Ghee / Oil'], illColor: C.cook },
      { order: 4, text: 'Serve hot with a chutney or side dish.', phase: 'Finish', heat: null, timerStr: null, stepIngredients: [], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.AYUSH, citation: 'Traditional food recipes from Ayush systems of medicine' },
    ],
    yieldStr: '2–3 medium chila',
    shelfLife: 'Best eaten immediately',
  },

  // S-14 · Ginger Barfi (Ardraka Paka)
  {
    slug: 'ginger-barfi-ardraka-paka',
    nameEn: 'Ginger Barfi',
    nameTa: 'Ardraka Paka',
    category: 'solid',
    description: 'A classical warming confection of fresh ginger, jaggery, ghee, and eight aromatic spices — prized in Ayurveda for enhancing digestion and building ojas.',
    ingredients: [
      { nameEn: 'Fresh ginger', quantityG: '250 g', quantityCup: '1¼ cup' },
      { nameEn: 'Jaggery', quantityG: '250 g', quantityCup: '1¼ cup' },
      { nameEn: 'Ghee', quantityG: '125 g', quantityCup: '½ cup' },
      { nameEn: 'Dry ginger powder', quantityG: '25 g', quantityCup: '5 tsp' },
      { nameEn: 'Cumin', quantityG: '25 g', quantityCup: '5 tsp' },
      { nameEn: 'Black pepper', quantityG: '25 g', quantityCup: '5 tsp' },
      { nameEn: 'Cardamom powder', quantityG: '25 g', quantityCup: '5 tsp' },
      { nameEn: 'Cinnamon powder', quantityG: '25 g', quantityCup: '5 tsp' },
      { nameEn: 'Indian bay leaf powder', quantityG: '25 g', quantityCup: '5 tsp' },
      { nameEn: 'Coriander powder', quantityG: '25 g', quantityCup: '5 tsp' },
      { nameEn: 'Sesame seeds (optional)', quantityG: '5–10 g', quantityCup: '1–2 tsp' },
    ],
    steps: [
      { order: 1, text: 'Cook jaggery until a thick syrup forms. Add grated ginger; stir and cook 5–7 min on low flame.', phase: 'Cook', heat: 'low', timerStr: '5–7 min', stepIngredients: ['Jaggery', 'Fresh ginger'], illColor: C.cook },
      { order: 2, text: 'Add ghee; mix well and cook 5–10 min more. Add powdered spices; cook another 5–10 min.', phase: 'Cook', heat: 'low', timerStr: '10–20 min', stepIngredients: ['Ghee', 'Dry ginger powder', 'Cumin', 'Black pepper', 'Cardamom powder', 'Cinnamon powder', 'Coriander powder'], illColor: C.cook },
      { order: 3, text: 'Add sesame seeds if desired. Pour onto a ghee-greased plate; spread evenly.', phase: 'Shape', heat: null, timerStr: null, stepIngredients: ['Sesame seeds (optional)'], illColor: C.shape },
      { order: 4, text: 'Cool completely before cutting into pieces. Store in an airtight container.', phase: 'Finish', heat: null, timerStr: '30 min cooling', stepIngredients: [], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.AYUSH, citation: 'Traditional food recipes from Ayush systems of medicine' },
    ],
    yieldStr: '~20 small pieces',
    shelfLife: 'Keeps ~1 month (airtight container)',
  },

  // S-23 · Coconut Laddu (Narikela Modaka) — required hero
  {
    slug: 'coconut-laddu-narikela-modaka',
    nameEn: 'Coconut Laddu',
    nameTa: 'Narikela Modaka',
    category: 'solid',
    description: 'The prototype Vajeeva hero recipe — soft coconut-and-milk laddoos sweetened with rock sugar and perfumed with cardamom and dry ginger. A celebrated classical offering from Ksemakutūhalam.',
    ingredients: [
      { nameEn: 'Grated coconut', quantityG: '40–50 g', quantityCup: '¼ cup' },
      { nameEn: 'Milk', quantityG: '30–40 ml', quantityCup: '—' },
      { nameEn: 'Ghee', quantityG: '10–15 ml', quantityCup: '2–3 tsp' },
      { nameEn: 'Rock sugar powder', quantityG: '15–20 g', quantityCup: '3–4 tsp' },
      { nameEn: 'Cardamom powder', quantityG: '2–3 g', quantityCup: '½ tsp' },
      { nameEn: 'Dry ginger powder', quantityG: '2–3 g', quantityCup: '½ tsp' },
    ],
    steps: [
      { order: 1, text: 'Cook grated coconut in milk until the coconut is fully soft and the milk is absorbed.', phase: 'Cook', heat: 'medium', timerStr: '5–8 min', stepIngredients: ['Grated coconut', 'Milk'], illColor: C.cook },
      { order: 2, text: 'Roast the cooked coconut in ghee until it turns lightly golden and fragrant.', phase: 'Roast', heat: 'medium', timerStr: '3–4 min', stepIngredients: ['Ghee'], illColor: C.fry },
      { order: 3, text: 'In a separate pan, dissolve rock sugar in a little water and boil to a binding (one-thread) consistency.', phase: 'Syrup', heat: 'medium', timerStr: '3–5 min', stepIngredients: ['Rock sugar powder'], illColor: C.boil },
      { order: 4, text: 'Add roasted coconut to the syrup. Stir in cardamom and dry ginger powder; mix well off heat.', phase: 'Mix', heat: null, timerStr: null, stepIngredients: ['Cardamom powder', 'Dry ginger powder'], illColor: C.prep },
      { order: 5, text: 'Shape into small round laddoos while the mixture is still warm. Cool on a plate.', phase: 'Shape', heat: null, timerStr: '10 min cooling', stepIngredients: [], illColor: C.shape },
    ],
    healthFlags: [
      FLAG.DM(), FLAG.OW(), FLAG.LI(' Coconut milk or water-based alternatives reduce dairy load.'), FLAG.SD(),
    ],
    sources: [
      { text: SRC.KK, citation: '10/54' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '3–4 medium laddoos',
    shelfLife: '5–7 days (room temperature)',
  },

  // S-25 · Urad Amrut Laddu (Masha Ladduka)
  {
    slug: 'urad-amrut-laddu-masha-ladduka',
    nameEn: 'Urad Amrut Laddu',
    nameTa: 'Masha Ladduka',
    category: 'solid',
    description: 'Boondi laddoos made from deep-fried black gram batter soaked in aromatic sugar syrup — a restorative classical sweet from Ksemakutūhalam that strengthens and nourishes.',
    ingredients: [
      { nameEn: 'De-husked black gram', quantityG: '30–50 g', quantityCup: '¼ cup' },
      { nameEn: 'Ghee', quantityG: 'for deep frying', quantityCup: '—' },
      { nameEn: 'Rock sugar powder', quantityG: '20–30 g', quantityCup: '—' },
      { nameEn: 'Aromatic powder (cardamom, clove, pepper, cinnamon, dry ginger, edible camphor)', quantityG: '2–3 g', quantityCup: '½ tsp' },
      { nameEn: 'Dry fruits (choice)', quantityG: 'as desired', quantityCup: '—' },
    ],
    steps: [
      { order: 1, text: 'Soak black gram 4–6 hr; grind with minimal water to a soft, pourable batter.', phase: 'Prep', heat: null, timerStr: '4–6 hr soak', stepIngredients: ['De-husked black gram'], illColor: C.prep },
      { order: 2, text: 'Heat ghee over medium flame. Hold a perforated ladle over the ghee and pour batter through, tapping to make small drops. Fry until cooked but not crispy. Drain.', phase: 'Fry', heat: 'medium', timerStr: '3–5 min', stepIngredients: ['Ghee'], illColor: C.fry },
      { order: 3, text: 'Dissolve rock sugar in a little water; heat to a thick, sticky syrup. Add aromatic powder.', phase: 'Syrup', heat: 'medium', timerStr: '3–4 min', stepIngredients: ['Rock sugar powder', 'Aromatic powder (cardamom, clove, pepper, cinnamon, dry ginger, edible camphor)'], illColor: C.boil },
      { order: 4, text: 'Add fried boondi to hot syrup; mix so boondi absorbs syrup. Fold in ghee-roasted dry fruits.', phase: 'Mix', heat: null, timerStr: null, stepIngredients: ['Dry fruits (choice)'], illColor: C.prep },
      { order: 5, text: 'Shape into round laddoos while warm. Add a little warm syrup or water if mixture is too dry. Cool before serving.', phase: 'Shape', heat: null, timerStr: '10 min cooling', stepIngredients: [], illColor: C.shape },
    ],
    healthFlags: [
      FLAG.DM(), FLAG.OW(), FLAG.SD(),
    ],
    sources: [
      { text: SRC.KK, citation: '10/29–30' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '3–4 medium laddoos',
    shelfLife: '2–3 days (room temperature)',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LIQUIDS — 5 recipes
// ─────────────────────────────────────────────────────────────────────────────
const LIQUIDS: RecipeSeed[] = [

  // L-04 · Citrus Spark (Amalaki Panaka)
  {
    slug: 'citrus-spark-amalaki-panaka',
    nameEn: 'Citrus Spark',
    nameTa: 'Amalaki Panaka',
    category: 'liquid',
    description: 'A bright, vitamin C-rich amla drink sweetened with rock sugar and spiced with dry ginger and cardamom — a classical Ayurvedic immune-boosting panaka.',
    ingredients: [
      { nameEn: 'Fresh amla (Indian gooseberry)', quantityG: '80 g', quantityCup: '—' },
      { nameEn: 'Dry ginger powder', quantityG: '1 g', quantityCup: '¼ tsp' },
      { nameEn: 'Cardamom powder', quantityG: '1 g', quantityCup: '¼ tsp' },
      { nameEn: 'Rock sugar / jaggery', quantityG: '30 g', quantityCup: '—' },
      { nameEn: 'Rock salt', quantityG: '0.5–1 g', quantityCup: '—' },
      { nameEn: 'Honey', quantityG: '5 g', quantityCup: '1 tsp' },
      { nameEn: 'Water', quantityG: '200 ml', quantityCup: '1 cup' },
    ],
    steps: [
      { order: 1, text: 'Steam amla until soft; cool, remove seeds, and grind to a smooth paste.', phase: 'Prep', heat: 'medium', timerStr: '10–15 min', stepIngredients: ['Fresh amla (Indian gooseberry)'], illColor: C.boil },
      { order: 2, text: 'Add 1 glass of water to the paste and mix well.', phase: 'Mix', heat: null, timerStr: null, stepIngredients: ['Water'], illColor: C.prep },
      { order: 3, text: 'Stir in dry ginger, cardamom, rock sugar, rock salt, and honey. Serve fresh.', phase: 'Finish', heat: null, timerStr: null, stepIngredients: ['Dry ginger powder', 'Cardamom powder', 'Rock sugar / jaggery', 'Rock salt', 'Honey'], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.AYUSH, citation: 'Traditional food recipes from Ayush systems of medicine' },
    ],
    yieldStr: '~200 ml',
    shelfLife: 'Serve immediately',
  },

  // L-10 · Tempered Buttermilk (Khalam)
  {
    slug: 'tempered-buttermilk-khalam',
    nameEn: 'Tempered Buttermilk',
    nameTa: 'Khalam',
    category: 'liquid',
    description: 'Gently heated buttermilk tempered with ginger, turmeric, hingu, and pepper — a digestive Ayurvedic drink served hot to stimulate agni after meals.',
    ingredients: [
      { nameEn: 'Buttermilk', quantityG: '150 ml', quantityCup: '¾ cup' },
      { nameEn: 'Fresh ginger paste', quantityG: '5 g', quantityCup: '1 tsp' },
      { nameEn: 'Hingu (asafoetida)', quantityG: 'a pinch', quantityCup: '—' },
      { nameEn: 'Turmeric powder', quantityG: '1–2 g', quantityCup: '¼ tsp' },
      { nameEn: 'Rock salt', quantityG: 'to taste', quantityCup: '—' },
      { nameEn: 'Pepper powder', quantityG: '1–2 g', quantityCup: '¼ tsp' },
    ],
    steps: [
      { order: 1, text: 'Heat buttermilk on medium flame; add ginger paste and bring to a boil for 1 minute.', phase: 'Boil', heat: 'medium', timerStr: '1 min', stepIngredients: ['Buttermilk', 'Fresh ginger paste'], illColor: C.boil },
      { order: 2, text: 'Add turmeric, pepper, hingu, and rock salt; mix well. Turn off flame and serve hot.', phase: 'Finish', heat: null, timerStr: null, stepIngredients: ['Turmeric powder', 'Pepper powder', 'Hingu (asafoetida)', 'Rock salt'], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.AYUSH, citation: 'Traditional food recipes from Ayush systems of medicine' },
    ],
    yieldStr: '150–160 ml',
    shelfLife: 'Serve immediately',
  },

  // L-11 · Green Gram Soup
  {
    slug: 'green-gram-soup',
    nameEn: 'Green Gram Soup',
    nameTa: '—',
    category: 'liquid',
    description: 'A light, nourishing legume soup from Ksemakutūhalam — whole green gram cooked until tender, seasoned with mustard, fenugreek, curry leaves, and a squeeze of lemon.',
    ingredients: [
      { nameEn: 'Green gram', quantityG: '30 g', quantityCup: '2 tbsp' },
      { nameEn: 'Water', quantityG: '300 ml', quantityCup: '1½ cups' },
      { nameEn: 'Rock salt', quantityG: 'to taste', quantityCup: '—' },
      { nameEn: 'Pepper', quantityG: '1–2 g', quantityCup: '¼ tsp' },
      { nameEn: 'Ghee', quantityG: '5 g', quantityCup: '1 tsp' },
      { nameEn: 'Mustard seeds', quantityG: '1–2 g', quantityCup: '¼ tsp' },
      { nameEn: 'Fenugreek seeds', quantityG: '1–2 g', quantityCup: '¼ tsp' },
      { nameEn: 'Curry leaves', quantityG: '4–5 leaves', quantityCup: '—' },
      { nameEn: 'Lemon juice', quantityG: 'to taste', quantityCup: '—' },
    ],
    steps: [
      { order: 1, text: 'Soak green gram 4–5 hr. Pressure cook with water until fully soft.', phase: 'Prep', heat: 'high', timerStr: '4–5 hr soak + 10 min pressure', stepIngredients: ['Green gram', 'Water'], illColor: C.prep },
      { order: 2, text: 'Mash lightly or partially blend to a smooth soup consistency.', phase: 'Blend', heat: null, timerStr: null, stepIngredients: [], illColor: C.prep },
      { order: 3, text: 'Heat ghee; splutter mustard seeds, then add fenugreek seeds and curry leaves. Pour tempering into the soup.', phase: 'Temper', heat: 'medium', timerStr: '1–2 min', stepIngredients: ['Ghee', 'Mustard seeds', 'Fenugreek seeds', 'Curry leaves'], illColor: C.fry },
      { order: 4, text: 'Add rock salt, pepper, and lemon juice; stir and serve.', phase: 'Finish', heat: null, timerStr: null, stepIngredients: ['Rock salt', 'Pepper', 'Lemon juice'], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.KK, citation: '6/25–26' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '~200 ml',
    shelfLife: 'Best served fresh; keeps 1 day refrigerated',
  },

  // L-16 · Split Moong Soup
  {
    slug: 'split-moong-soup',
    nameEn: 'Split Moong Soup',
    nameTa: '—',
    category: 'liquid',
    description: 'A creamy, restorative split mung soup with ginger, cumin, coriander, and olive oil — a deeply nourishing Ayurvedic broth suited to all constitutions.',
    ingredients: [
      { nameEn: 'Split mung dal', quantityG: '50 g', quantityCup: '¼ cup' },
      { nameEn: 'Hingu (asafoetida)', quantityG: '1–2 g', quantityCup: '¼ tsp' },
      { nameEn: 'Fresh ginger', quantityG: '3 g', quantityCup: '½ tsp' },
      { nameEn: 'Coriander leaves', quantityG: '8–10 g', quantityCup: '2 tsp' },
      { nameEn: 'Cumin', quantityG: '5 g', quantityCup: '1 tsp' },
      { nameEn: 'Rock salt', quantityG: 'to taste', quantityCup: '—' },
      { nameEn: 'Olive oil', quantityG: '10 ml', quantityCup: '1–2 tsp' },
    ],
    steps: [
      { order: 1, text: 'Boil mung dal with water, chopped ginger, and hingu until soft and fully cooked.', phase: 'Boil', heat: 'medium', timerStr: '15–20 min', stepIngredients: ['Split mung dal', 'Fresh ginger', 'Hingu (asafoetida)'], illColor: C.boil },
      { order: 2, text: 'Blend with coriander, cumin, rock salt, and olive oil until smooth and creamy.', phase: 'Blend', heat: null, timerStr: null, stepIngredients: ['Coriander leaves', 'Cumin', 'Rock salt', 'Olive oil'], illColor: C.prep },
      { order: 3, text: 'Add water to reach desired consistency. Serve fresh and hot.', phase: 'Finish', heat: null, timerStr: null, stepIngredients: [], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.MC, citation: 'p. 106' },
    ],
    yieldStr: '380–420 ml',
    shelfLife: 'Best served fresh',
  },

  // L-19 · Revitalizing Milk (Mashadi Ksheerapaka)
  {
    slug: 'revitalizing-milk-mashadi-ksheerapaka',
    nameEn: 'Revitalizing Milk',
    nameTa: 'Mashadi Ksheerapaka',
    category: 'liquid',
    description: 'Black gram powder roasted in ghee and simmered in milk with rock sugar — a classical Ksheerapaka preparation from Bhaishyaja Ratnavali said to build strength and vitality.',
    ingredients: [
      { nameEn: 'Black gram powder', quantityG: '20 g', quantityCup: '4 tsp' },
      { nameEn: 'Ghee', quantityG: '10 g', quantityCup: '2 tsp' },
      { nameEn: 'Milk', quantityG: '200 ml', quantityCup: '1 cup' },
      { nameEn: 'Rock sugar powder', quantityG: '10 g', quantityCup: '—' },
    ],
    steps: [
      { order: 1, text: 'Heat ghee on medium flame; roast black gram powder until golden and fragrant.', phase: 'Roast', heat: 'medium', timerStr: '3–4 min', stepIngredients: ['Ghee', 'Black gram powder'], illColor: C.fry },
      { order: 2, text: 'Add milk; bring to a gentle boil stirring continuously.', phase: 'Boil', heat: 'medium', timerStr: '3–4 min', stepIngredients: ['Milk'], illColor: C.boil },
      { order: 3, text: 'Add rock sugar; stir until dissolved. Boil 2–3 min more. Serve hot or warm.', phase: 'Finish', heat: 'low', timerStr: '2–3 min', stepIngredients: ['Rock sugar powder'], illColor: C.finish },
    ],
    healthFlags: [
      FLAG.DM(), FLAG.LI(),
    ],
    sources: [
      { text: SRC.BR, citation: 'verse 17' },
      { text: SRC.SS, citation: 'Ksirapaka Kalpana — Madhyama Khanda' },
    ],
    yieldStr: '~200 ml',
    shelfLife: 'Serve immediately',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEMI-SOLID — 5 recipes
// ─────────────────────────────────────────────────────────────────────────────
const SEMI_SOLIDS: RecipeSeed[] = [

  // M-02 · Blackgram Porridge (Vrushya Yavagu)
  {
    slug: 'blackgram-porridge-vrushya-yavagu',
    nameEn: 'Blackgram Porridge',
    nameTa: 'Vrushya Yavagu',
    category: 'semi-solid',
    description: 'Split black gram simmered in milk until soft and creamy, finished with ghee — a Charak Samhita Yavagu recommended for building strength and reproductive vitality.',
    ingredients: [
      { nameEn: 'Split black gram', quantityG: '30 g', quantityCup: '¾ cup (dry)' },
      { nameEn: 'Milk', quantityG: '180 ml', quantityCup: '¾ cup' },
      { nameEn: 'Ghee', quantityG: '10–15 ml', quantityCup: '2–3 tsp' },
    ],
    steps: [
      { order: 1, text: 'Wash split black gram thoroughly.', phase: 'Prep', heat: null, timerStr: null, stepIngredients: ['Split black gram'], illColor: C.prep },
      { order: 2, text: 'Bring milk to a boil in a vessel; add black gram and cook on medium flame until fully soft and a semi-solid consistency is reached (add more milk as needed).', phase: 'Boil', heat: 'medium', timerStr: '20–25 min', stepIngredients: ['Milk', 'Split black gram'], illColor: C.boil },
      { order: 3, text: 'Add ghee; mix well and serve warm.', phase: 'Finish', heat: null, timerStr: null, stepIngredients: ['Ghee'], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.CS, citation: '2/32' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '1 bowl',
    shelfLife: 'Best eaten immediately',
  },

  // M-03 · Shrikandha (Rasala)
  {
    slug: 'shrikandha-rasala',
    nameEn: 'Shrikandha',
    nameTa: 'Rasala',
    category: 'semi-solid',
    description: 'Thick hung curd sweetened with rock sugar and perfumed with cardamom, cinnamon, dry ginger, and saffron — a silken classical curd preparation that soothes and nourishes.',
    ingredients: [
      { nameEn: 'Fresh curd', quantityG: '50 g', quantityCup: '¼ cup' },
      { nameEn: 'Rock sugar powder', quantityG: 'to taste', quantityCup: '—' },
      { nameEn: 'Cardamom powder', quantityG: '3 g', quantityCup: '½ tsp' },
      { nameEn: 'Cinnamon powder', quantityG: '2 g', quantityCup: '¼ tsp' },
      { nameEn: 'Ginger powder', quantityG: '2–3 g', quantityCup: '¼ tsp' },
      { nameEn: 'Saffron (optional)', quantityG: '2 strands', quantityCup: '—' },
    ],
    steps: [
      { order: 1, text: 'Hang fresh curd in a muslin cloth for 4–6 hr (or overnight) to drain all whey.', phase: 'Prep', heat: null, timerStr: '4–6 hr draining', stepIngredients: ['Fresh curd'], illColor: C.prep },
      { order: 2, text: 'Transfer thick hung curd to a bowl. Soak saffron in a teaspoon of milk; set aside 5 min.', phase: 'Prep', heat: null, timerStr: '5 min saffron soak', stepIngredients: ['Saffron (optional)'], illColor: C.prep },
      { order: 3, text: 'Add rock sugar, cardamom, cinnamon, ginger powder, and soaked saffron to the hung curd; mix gently until fully combined.', phase: 'Mix', heat: null, timerStr: null, stepIngredients: ['Rock sugar powder', 'Cardamom powder', 'Cinnamon powder', 'Ginger powder'], illColor: C.cool },
      { order: 4, text: 'Garnish with chopped almonds and pistachios if desired. Serve.', phase: 'Finish', heat: null, timerStr: null, stepIngredients: [], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.KK, citation: 'general reference' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '1 serving',
    shelfLife: 'Same day',
  },

  // M-05 · Creamy Eggplant Delight (Brinjal Raita)
  {
    slug: 'creamy-eggplant-raita',
    nameEn: 'Creamy Eggplant Delight',
    nameTa: 'Brinjal Raita',
    category: 'semi-solid',
    description: 'Steamed and mashed brinjal tempered with mustard and cumin, then folded into yoghurt — a cooling Ksemakutūhalam raita that balances heat and supports digestion.',
    ingredients: [
      { nameEn: 'Brinjal (eggplant)', quantityG: '130–150 g', quantityCup: '¾ cup' },
      { nameEn: 'Ghee', quantityG: '10–15 g', quantityCup: '3–4 tsp' },
      { nameEn: 'Mustard seeds', quantityG: '2–3 g', quantityCup: '½ tsp' },
      { nameEn: 'Cumin (jeera)', quantityG: '2–3 g', quantityCup: '½ tsp' },
      { nameEn: 'Rock salt', quantityG: 'to taste', quantityCup: '—' },
      { nameEn: 'Yoghurt', quantityG: '100 g', quantityCup: '½ cup' },
    ],
    steps: [
      { order: 1, text: 'Steam brinjal 10–15 min until soft and well cooked; cool slightly.', phase: 'Steam', heat: 'medium', timerStr: '10–15 min', stepIngredients: ['Brinjal (eggplant)'], illColor: C.boil },
      { order: 2, text: 'Remove stalk; mash thoroughly until smooth.', phase: 'Prep', heat: null, timerStr: null, stepIngredients: [], illColor: C.prep },
      { order: 3, text: 'Heat ghee; splutter mustard seeds and cumin. Add mashed brinjal; mix well. Turn off flame and cool.', phase: 'Temper', heat: 'medium', timerStr: '1–2 min tempering', stepIngredients: ['Ghee', 'Mustard seeds', 'Cumin (jeera)'], illColor: C.fry },
      { order: 4, text: 'Fold in yoghurt and rock salt; mix well. Cover 3–5 min before serving.', phase: 'Finish', heat: null, timerStr: '3–5 min rest', stepIngredients: ['Yoghurt', 'Rock salt'], illColor: C.finish },
    ],
    healthFlags: [],
    sources: [
      { text: SRC.KK, citation: '8/26' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '200–210 g',
    shelfLife: 'Same day; refrigerate if needed',
  },

  // M-09 · Golden Grain Halwa (Lalita)
  {
    slug: 'golden-grain-halwa-lalita',
    nameEn: 'Golden Grain Halwa',
    nameTa: 'Lalita',
    category: 'semi-solid',
    description: 'Wheat flour roasted in ghee with chironji and dry fruits, enriched with milk and rock sugar — a luxurious classical halwa from Ksemakutūhalam offering warmth and satiation.',
    ingredients: [
      { nameEn: 'Wheat flour', quantityG: '25–30 g', quantityCup: '¼ cup' },
      { nameEn: 'Ghee', quantityG: '15–20 g', quantityCup: '3–4 tsp' },
      { nameEn: 'Rock sugar powder', quantityG: '20–30 g', quantityCup: '—' },
      { nameEn: 'Priyala (chironji)', quantityG: '5–10 g', quantityCup: '2 tsp' },
      { nameEn: 'Dry fruits (coarse powder)', quantityG: '5–10 g', quantityCup: '2 tsp' },
      { nameEn: 'Milk', quantityG: '90–100 ml', quantityCup: '½ cup' },
      { nameEn: 'Aromatic powder (cardamom, clove, pepper, cinnamon, dry ginger, edible camphor)', quantityG: '2–3 g', quantityCup: '½ tsp' },
    ],
    steps: [
      { order: 1, text: 'Toast dry fruits and chironji in ghee until golden; set aside.', phase: 'Roast', heat: 'medium', timerStr: '2–3 min', stepIngredients: ['Ghee', 'Priyala (chironji)', 'Dry fruits (coarse powder)'], illColor: C.fry },
      { order: 2, text: 'Heat remaining ghee; roast wheat flour on medium flame until the colour changes to golden and a nutty aroma develops.', phase: 'Roast', heat: 'medium', timerStr: '5–7 min', stepIngredients: ['Wheat flour'], illColor: C.fry },
      { order: 3, text: 'Add rock sugar and roasted dry fruits/chironji. Gradually pour in milk, stirring continuously to prevent lumps.', phase: 'Cook', heat: 'medium', timerStr: '3–5 min', stepIngredients: ['Rock sugar powder', 'Milk'], illColor: C.cook },
      { order: 4, text: 'Add more ghee if needed. Stir until the mixture leaves the sides of the pan and reaches a smooth halwa consistency. Stir in aromatic powder and serve hot.', phase: 'Finish', heat: 'low', timerStr: '2–3 min', stepIngredients: ['Aromatic powder (cardamom, clove, pepper, cinnamon, dry ginger, edible camphor)'], illColor: C.finish },
    ],
    healthFlags: [
      FLAG.DM(), FLAG.OW(), FLAG.LI(), FLAG.SD(),
    ],
    sources: [
      { text: SRC.KK, citation: '10/88' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '100–150 g (¾ cup)',
    shelfLife: '1–2 days',
  },

  // M-11 · Coconut Delight (Narikera Ksheeri)
  {
    slug: 'coconut-delight-narikera-ksheeri',
    nameEn: 'Coconut Delight',
    nameTa: 'Narikera Ksheeri',
    category: 'semi-solid',
    description: 'Fresh coconut simmered in milk until creamy, sweetened with rock sugar, finished with ghee and aromatic spice powder — a nourishing Bhojana Kutuhala sweet preparation.',
    ingredients: [
      { nameEn: 'Fresh grated coconut', quantityG: '50 g', quantityCup: '¼ cup' },
      { nameEn: 'Cow\'s milk', quantityG: '100 ml', quantityCup: '½ cup' },
      { nameEn: 'Rock sugar powder', quantityG: '20 g', quantityCup: '—' },
      { nameEn: 'Cow\'s ghee', quantityG: '10 g', quantityCup: '2 tsp' },
      { nameEn: 'Aromatic powder (cardamom, clove, pepper, cinnamon, dry ginger, edible camphor)', quantityG: '2–3 g', quantityCup: '½ tsp' },
    ],
    steps: [
      { order: 1, text: 'Grind coconut without much water — keep slightly coarse.', phase: 'Prep', heat: null, timerStr: null, stepIngredients: ['Fresh grated coconut'], illColor: C.prep },
      { order: 2, text: 'Boil milk; add coarse coconut and cook on medium flame, stirring continuously 5–8 min until mildly thick.', phase: 'Cook', heat: 'medium', timerStr: '5–8 min', stepIngredients: ['Cow\'s milk'], illColor: C.boil },
      { order: 3, text: 'Add rock sugar; stir to dissolve. Add ghee and aromatic powder; mix 1 min. Switch off flame.', phase: 'Finish', heat: 'low', timerStr: '1 min', stepIngredients: ['Rock sugar powder', 'Cow\'s ghee', 'Aromatic powder (cardamom, clove, pepper, cinnamon, dry ginger, edible camphor)'], illColor: C.finish },
      { order: 4, text: 'Garnish with ghee-roasted dry fruits. Serve hot or warm.', phase: 'Plate', heat: null, timerStr: null, stepIngredients: [], illColor: C.shape },
    ],
    healthFlags: [
      FLAG.DM(), FLAG.OW(), FLAG.LI(), FLAG.SD(),
    ],
    sources: [
      { text: SRC.BK, citation: 'Ksheeri, p. 44' },
      { text: SRC.ICMR, citation: 'Dietary Guidelines for Indians, 2024' },
    ],
    yieldStr: '1 bowl',
    shelfLife: 'Same day',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Upsert runner
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🔗 Connecting to Atlas...');
  await mongoose.connect(MONGO_URI!);

  const allRecipes = [...SOLIDS, ...LIQUIDS, ...SEMI_SOLIDS];

  const counts = { solid: 0, liquid: 0, 'semi-solid': 0 };
  const slugs: Record<string, string[]> = { solid: [], liquid: [], 'semi-solid': [] };

  for (const recipe of allRecipes) {
    const result = await Recipe.findOneAndUpdate(
      { slug: recipe.slug },
      { ...recipe, status: 'published' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    counts[recipe.category]++;
    slugs[recipe.category].push(recipe.slug);
    console.log(`  ✓ [${recipe.category}] ${recipe.nameEn} (${recipe.slug})`);
  }

  console.log('\n📊 Seed complete:');
  console.log(`  solid:      ${counts.solid} recipes`);
  console.log(`  liquid:     ${counts.liquid} recipes`);
  console.log(`  semi-solid: ${counts['semi-solid']} recipes`);
  console.log(`  total:      ${allRecipes.length} recipes\n`);

  for (const [cat, list] of Object.entries(slugs)) {
    console.log(`${cat} slugs:`);
    list.forEach(s => console.log(`  - ${s}`));
  }

  await mongoose.disconnect();
  console.log('\n✅ Disconnected. Done.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
