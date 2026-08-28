#!/usr/bin/env ts-node
/**
 * enrich-recipes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads  content/recipes-parsed.json
 * Writes content/recipes-enriched.json
 *
 * All enrichment is deterministic — no API calls, no DB connection.
 *
 * Fields filled:
 *   Recipe level: description · type · meals · mainIngredients · methods
 *                 dietTags · makeAhead · prepAheadNote · shelfLife · totalTimeMin
 *   Step level:   phase · heat · timerStr   (overwrite placeholders from parse-md)
 *
 * Run:  npm run enrich:recipes   (from apps/api)
 * Then: npm run seed:recipes     (loads enriched.json if present)
 */

import fs from 'fs';
import path from 'path';

// ── Paths ─────────────────────────────────────────────────────────────────────

const IN_PATH  = path.resolve(__dirname, '../../../../../content/recipes-parsed.json');
const OUT_PATH = path.resolve(__dirname, '../../../../../content/recipes-enriched.json');

// ── Types ─────────────────────────────────────────────────────────────────────

interface Ingredient {
  nameEn: string; quantityG: string; quantityMl: string;
  quantityCup: string; note: string;
}
interface Step {
  order: number; text: string; phase: string;
  heat: string | null; timerStr: string | null;
  stepIngredients: string[]; illColor: string;
}
interface Source     { citation: string; text: string; }
interface HealthFlag { condition: string; severity: string; note: string; }

interface RecipeParsed {
  slug: string; nameEn: string; nameTa: string;
  category: 'solid' | 'liquid' | 'semi-solid';
  description: string;
  ingredients: Ingredient[]; steps: Step[];
  healthFlags: HealthFlag[]; sources: Source[];
  yieldStr: string; shelfLife: string;
  type: string; meals: string[]; mainIngredients: string[];
  methods: string[]; dietTags: string[];
  makeAhead: boolean; prepAheadNote: string;
  totalTimeMin: number; status: string; images: never[];
}

// ── Controlled vocabulary ─────────────────────────────────────────────────────

const TYPES     = ['roti','paratha','laddu','halwa','vada','panaka','buttermilk',
                   'soup','payasa','porridge','shrikhand','chutney','preserve','rice'];
const MEALS     = ['breakfast','snack','side','drink','dessert'];
const ING_VOCAB = ['coconut','barley','amla','black-gram','milk','ghee','jaggery','sesame'];
const METHODS   = ['steamed','fried','baked','roasted','boiled','no-cook','fermented','soaked'];
const DIETS     = ['sweet','savoury','no-added-sugar','dairy','high-protein'];

// ── Source label map ──────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  BK: 'Bhojana Kutuhala', KK: 'Ksemakutūhalam', BP: 'Bhavaprakasha',
  KN: 'Kaiyadeva Nighantu', CC: 'Charaka Chikitsasthana', AM: 'Ayurveda Mahodadhi',
  AS: 'Ayurveda Sara Samgraha', BR: 'Bhaishajya Ratnavali', SS: 'Sarngadhara Samhita',
  MC: 'Morningstar', GO: 'Gowans', ICMR: 'ICMR-NIN', AYUSH: 'AYUSH',
};

function shortSource(sources: Source[]): string {
  const cite = sources[0]?.citation || '';
  const code = cite.match(/^([A-Z]+)/)?.[1] || '';
  return SOURCE_LABELS[code] || cite.split(' ')[0] || '';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Step enrichment
// ─────────────────────────────────────────────────────────────────────────────

function enrichStep(text: string, idx: number, total: number): Pick<Step,'phase'|'heat'|'timerStr'> {
  const t = text.toLowerCase();

  // ── PHASE ─────────────────────────────────────────────────────────────────
  let phase = 'Cook';

  const isPrep  = /(soak|wash.*drain|sift|knead|make.*dough|mix.*dough|combine.*flour|add.*flour.*knead|grind\b|blend\b|churn|press.*cloth|squeeze.*cloth|drain.*water|peel\b|chop\b|grate\b|powder\b|roast.*powder|dry.*roast.*then.*powder)/i.test(t);
  const isShape = /(roll.*ball|divide.*ball|portion|flatten|shape.*ball|stuff|fill.*stuff|seal|roll.*thin|roll.*out|spread.*batter|pour.*batter|scoop.*batter)/i.test(t);
  const isRest  = /(\brest\b.*min|\bset aside\b|\bcool\b.*min|refrigerate|chill\b|allow.*cool|let.*cool|keep.*aside)/i.test(t)
               && !/garnish|serve|plate/i.test(t);
  const isServe = /(\bserve\b|\bplate\b|garnish|transfer.*dish|drizzle.*top|sprinkle.*top)/i.test(t)
               || (idx === total - 1 && /\b(hot|warm|fresh|immediately)\b/i.test(t));

  // Priority: Serve > Shape > Prep > Rest > Cook
  // Prep beats Rest intentionally — a step that kneads dough AND rests is Prep.
  if      (isServe)                   phase = 'Serve';
  else if (isShape)                   phase = 'Shape';
  else if (isPrep)                    phase = 'Prep';
  else if (isRest)                    phase = 'Rest';
  else {
    // Cook sub-types (fry, boil, steam, roast, bake) all stored as 'Cook'.
    phase = 'Cook';
  }

  // ── HEAT ──────────────────────────────────────────────────────────────────
  let heat: string | null = null;

  if (phase === 'Prep' || phase === 'Shape' || phase === 'Rest' || phase === 'Serve') {
    heat = null; // non-cooking phases never have heat
  } else {
    if      (/low[\s-]?flame|gentle[\s-]?heat|low[\s-]?heat|very low|slow.*simmer|gentle.*simmer/i.test(t)) heat = 'low';
    else if (/medium[\s-]?high|moderately[\s-]?high/i.test(t))                                             heat = 'high';
    else if (/medium[\s-]?(hot|flame|heat)|medium heat|medium flame/i.test(t))                             heat = 'medium';
    else if (/high[\s-]?flame|high[\s-]?heat|high heat/i.test(t))                                         heat = 'high';
    // Contextual defaults for common actions (when no explicit level given)
    else if (/deep[\s-]?fry/i.test(t))                           heat = 'high';
    else if (/pressure[\s-]?cook/i.test(t))                      heat = 'high';
    else if (/\bboil\b/i.test(t) && !/simmer/i.test(t))          heat = 'high';
    else if (/\bsimmer\b/i.test(t))                               heat = 'low';
    else if (/\btawa\b|\bgriddle\b|\bpan\b/i.test(t))            heat = 'medium';
    // Otherwise leave null — admin fills in
  }

  // ── TIMERSTR ──────────────────────────────────────────────────────────────
  let timerStr: string | null = null;

  // Skip timers for shape/serve
  if (phase !== 'Shape' && phase !== 'Serve') {
    // "X–Y min" ranges — take upper bound
    const rangeMin = t.match(/(\d+)\s*[–\-]\s*(\d+)\s*min/);
    if (rangeMin) {
      const mins = parseInt(rangeMin[2]);
      timerStr = mins < 99 ? `${String(mins).padStart(2,'0')}:00` : null;
    } else {
      // "X min"
      const exactMin = t.match(/\b(\d+)\s*min/);
      if (exactMin) {
        const mins = parseInt(exactMin[1]);
        timerStr = mins < 99 ? `${String(mins).padStart(2,'0')}:00` : null;
      }
    }
    // Hours: only short ones (≤ 1 hr) make sense as cook timers
    if (!timerStr) {
      const hrMatch = t.match(/\b(\d+)\s*hr\b/);
      if (hrMatch) {
        const hrs = parseInt(hrMatch[1]);
        if (hrs === 1) timerStr = '60:00';
        // 2+ hr → null (prep/soak time, not a cook timer)
      }
    }
  }

  return { phase, heat, timerStr };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Recipe-level inference
// ─────────────────────────────────────────────────────────────────────────────

function inferType(nameEn: string, category: string): string {
  const n = nameEn.toLowerCase();

  // ── Solid ────────────────────────────────────────────────────────────────
  if (/\broti\b|\bchapati\b/.test(n))                                  return 'roti';
  if (/paratha|parata/.test(n))                                        return 'paratha';
  if (/\bbread\b|\bbaati\b/.test(n))                                   return 'roti';
  if (/\bpuri\b/.test(n))                                              return 'roti';  // fried flatbread → roti family
  if (/\bchila\b|\bpancake\b/.test(n))                                 return 'roti';  // savoury crepe
  if (/\bladdu\b|laddoo|modaka|modak[ao]/.test(n))                     return 'laddu';
  if (/balls?\b/.test(n) && category === 'solid')                      return 'laddu'; // Wheat Balls, etc.
  if (/momo|dumpling/.test(n) && category === 'solid')                 return 'laddu'; // sweet dumplings
  if (/\bbarfi\b/.test(n))                                             return 'halwa'; // barfi ≈ solid halwa
  if (/\bhalwa\b|halva/.test(n))                                       return 'halwa';
  if (/\bvada\b|vataka/.test(n))                                       return 'vada';
  if (/crispy.*stick|crunch.*bite|savor.*disc|savory.*disc|biscuit/.test(n)) return 'vada'; // fried/baked snacks

  // ── Liquid ───────────────────────────────────────────────────────────────
  if (/buttermilk|takra/.test(n))                                      return 'buttermilk';
  if (/\bsoup\b|borscht|stew/.test(n))                                 return 'soup';
  if (/panaka/.test(n))                                                return 'panaka';
  if (/payasa|kheer|ksheera.*pay|milk.*delight|delight.*milk|pudding.*milk/.test(n)) return 'payasa';
  if (/porridge|yavagu|kanji|congee/.test(n))                          return 'porridge';
  if (category === 'liquid' && /\bcurd\b|\bchaas\b|masala.*curd/.test(n)) return 'buttermilk';
  if (category === 'liquid' && /milk/.test(n))                         return 'payasa';
  // All remaining liquid recipes are drinks → panaka
  if (category === 'liquid')                                           return 'panaka';

  // ── Semi-solid ───────────────────────────────────────────────────────────
  if (/shrikhand|shrikandha|rasala/.test(n))                           return 'shrikhand';
  if (/\bchutney\b/.test(n))                                           return 'chutney';
  if (/murabba|preserve|jam/.test(n))                                  return 'preserve';
  if (/\brice\b/.test(n) && category !== 'liquid')                     return 'rice';
  if (/cereal|breakfast.*bowl/.test(n))                                return 'porridge';
  // Semi-solid "delight", "treat", or "royal dessert" = creamy milk preparation → payasa
  if (category === 'semi-solid' && /delight|treat|blend|royal|dessert/.test(n)) return 'payasa';

  return '';
}

function inferMeals(nameEn: string, category: string, type: string): string[] {
  const n = nameEn.toLowerCase();
  if (category === 'liquid') {
    if (type === 'soup')       return ['side', 'breakfast'];
    if (type === 'payasa')     return ['dessert', 'drink'];
    if (type === 'buttermilk') return ['drink', 'side'];
    if (/milk|almond.*milk|spiced.*milk|golden.*milk/.test(n)) return ['drink', 'breakfast'];
    return ['drink'];
  }
  const typeToMeals: Record<string, string[]> = {
    roti:       ['breakfast', 'side'],
    paratha:    ['breakfast', 'side'],
    laddu:      ['snack', 'dessert'],
    halwa:      ['dessert', 'breakfast'],
    vada:       ['snack', 'breakfast'],
    panaka:     ['drink'],
    buttermilk: ['drink', 'side'],
    soup:       ['side', 'breakfast'],
    payasa:     ['dessert'],
    porridge:   ['breakfast'],
    shrikhand:  ['dessert', 'side'],
    chutney:    ['side'],
    preserve:   ['side'],
    rice:       ['breakfast', 'side'],
  };
  if (type && typeToMeals[type]) return typeToMeals[type];
  // Fallback from name keywords
  if (/puri|puri/.test(n))             return ['breakfast', 'snack'];
  if (/stir.?fry|sauté|greens/.test(n)) return ['side'];
  if (/sweet|dessert|barfi/.test(n))   return ['snack', 'dessert'];
  if (/biscuit|muffin|bar/.test(n))    return ['snack'];
  if (/pancake|chila|dosa/.test(n))    return ['breakfast', 'snack'];
  if (/idli|dumpling|momo/.test(n))    return ['breakfast', 'snack'];
  if (/salad|raita/.test(n))           return ['side'];
  return ['side'];
}

function inferMainIngredients(ingredients: Ingredient[]): string[] {
  const MATCH: [RegExp, string][] = [
    [/\bcoconut\b/i,           'coconut'],
    [/\bbarley\b|\byava\b/i,   'barley'],
    [/\bamla\b|\bgooseberry\b|\bamalaki\b/i, 'amla'],
    [/black[\s-]?gram|\burad\b|\bmasha\b/i,  'black-gram'],
    [/\bmilk\b/i,              'milk'],
    [/\bghee\b/i,              'ghee'],
    [/jaggery|rock[\s-]?sugar|palm[\s-]?sugar/i, 'jaggery'],
    [/\bsesame\b|\btil\b|\btila\b/i, 'sesame'],
  ];
  const found: string[] = [];
  const SKIP = /rock salt|common salt|\bsalt\b|\bwater\b|\boil\b/i;
  for (const ing of ingredients) {
    if (SKIP.test(ing.nameEn)) continue;
    for (const [re, code] of MATCH) {
      if (re.test(ing.nameEn) && !found.includes(code)) {
        found.push(code);
        if (found.length >= 3) break;
      }
    }
    if (found.length >= 3) break;
  }
  return found;
}

function inferMethods(steps: Step[]): string[] {
  const allText = steps.map(s => s.text).join(' ').toLowerCase();
  const methods = new Set<string>();

  if (/deep[\s-]?fry|fry.*hot.*oil|hot.*oil.*fry/.test(allText))     methods.add('fried');
  if (/\bsteam\b|steam.*cook|idli.*plate|idli.*vessel/.test(allText)) methods.add('steamed');
  if (/\bbake\b|\boven\b/.test(allText))                               methods.add('baked');
  if (/dry[\s-]?roast|roast.*without|toast.*pan|toast.*seeds|roast.*seeds/.test(allText)) methods.add('roasted');
  if (/\bboil\b|pressure[\s-]?cook|cook.*water/.test(allText))        methods.add('boiled');
  if (/soak.*overnight|soak.*\d+.*hr|overnight.*soak/.test(allText))  methods.add('soaked');
  if (/ferment|set.*overnight.*batter/.test(allText))                  methods.add('fermented');

  // Tawa/griddle/pan cooking → roasted (pan-roasted)
  if (/\btawa\b|\bgriddle\b/.test(allText) && !methods.has('fried')) methods.add('roasted');

  // Shallow pan-fry with ghee (not deep-fry) → fried
  if (/fry.*ghee|ghee.*fry|cook.*ghee.*pan/.test(allText) && !methods.has('fried') && !methods.has('roasted')) {
    methods.add('fried');
  }

  // No heat at all → no-cook
  if (methods.size === 0) {
    const hasCooking = /\bcook\b|\bheat\b|\bboil\b|\bfry\b|\bsimmer\b|\bsauté\b|\broast\b|\bbake\b|\bsteam\b/.test(allText);
    if (!hasCooking) methods.add('no-cook');
    else methods.add('roasted'); // tawa/pan without explicit type → roasted
  }

  return Array.from(methods);
}

function inferDietTags(recipe: RecipeParsed): string[] {
  const ingText = recipe.ingredients.map(i => i.nameEn.toLowerCase()).join(' ');
  const name    = recipe.nameEn.toLowerCase();
  const tags    = new Set<string>();

  // SWEET: sweetener in ingredients or sweet preparation name
  const isSweet = /jaggery|rock[\s-]?sugar|palm[\s-]?sugar|sugar|honey|dates|date\b/.test(ingText)
               || /sweet|laddu|halwa|barfi|kheer|payasa|modaka|dessert/.test(name);
  if (isSweet) tags.add('sweet');

  // SAVOURY: has salt + not primarily a sweet dish
  const hasSalt = /\bsalt\b|rock[\s-]?salt/.test(ingText);
  if (hasSalt && !isSweet) tags.add('savoury');
  // Some recipes are both (savoury base + sweet finish — keep savoury tag if salt present)
  if (hasSalt && isSweet && /chutney|buttermilk|raita/.test(name)) tags.add('savoury');

  // DAIRY
  if (/\bmilk\b|\bghee\b|\bbutter\b|\bcurd\b|\byogurt\b|\bcream\b|\bpaneer\b/.test(ingText)) tags.add('dairy');

  // NO ADDED SUGAR (neither isSweet nor savoury sugar equivalents)
  if (!isSweet && !/jaggery|sugar|honey|date\b/.test(ingText)) tags.add('no-added-sugar');

  // HIGH PROTEIN: legumes, nuts, black gram
  if (/black[\s-]?gram|urad|green[\s-]?gram|lentil|\bdal\b|almond|peanut|sesame|cashew|chickpea|cowpea|soybean/.test(ingText)) {
    tags.add('high-protein');
  }

  return Array.from(tags);
}

function inferMakeAhead(steps: Step[]): { makeAhead: boolean; prepAheadNote: string } {
  // Utility: pick the clause (split by ". " or "; ") that best captures the soak/ferment action.
  function soakClause(text: string, keyword: string): string {
    const clauses = text.split(/(?<=[.;])\s+/);
    const hit = clauses.find(c => new RegExp(keyword, 'i').test(c));
    return (hit ?? clauses[0]).replace(/^[^A-Z]/, c => c.toUpperCase()).replace(/[;.\s]*$/, '.').trim();
  }

  for (const step of steps) {
    const t = step.text.toLowerCase();
    if (/ferment overnight|overnight.*batter|overnight.*soak/.test(t)) {
      return { makeAhead: true, prepAheadNote: soakClause(step.text, 'ferment|overnight') };
    }
    if (/overnight/.test(t)) {
      return { makeAhead: true, prepAheadNote: soakClause(step.text, 'overnight') };
    }
    const m = t.match(/soak.*?(\d+)\s*[–\-]\s*\d+\s*hr|soak.*?(\d+)\s*hr/);
    if (m) {
      return { makeAhead: true, prepAheadNote: soakClause(step.text, 'soak') };
    }
  }
  return { makeAhead: false, prepAheadNote: '' };
}

function inferShelfLife(recipe: RecipeParsed, type: string): string {
  const n = recipe.nameEn.toLowerCase();
  const cat = recipe.category;

  // Type-specific rules come before category-generic ones to avoid early returns.
  if (/murabba|preserve/.test(n))                                      return '2–3 months';
  if (/\bchutney\b/.test(n))                                           return '3–5 days refrigerated';
  if (/\bbarfi\b/.test(n))                                             return '2–3 days';
  if (/biscuit|muffin|cookie/.test(n))                                 return '2–3 days';
  if (/laddu|laddoo|modaka/.test(n) && !/milk/.test(n))                return '2–3 days';
  if (type === 'laddu')                                                 return '2–3 days';
  if (/\bhalwa\b/.test(n))                                             return 'Same day; up to 1 day refrigerated';
  if (type === 'payasa' || type === 'porridge' ||
      /kheer|payasa|porridge/.test(n))                                  return 'Same day; up to 1 day refrigerated';
  if (type === 'shrikhand' || /shrikhand|rasala|raita/.test(n))        return '1–2 days refrigerated';
  if (type === 'roti' || type === 'paratha')                            return 'Same day; best served fresh';
  if (type === 'vada' || /\bvada\b/.test(n))                           return 'Same day; best served hot';
  if (/stir.?fry|sauté|greens|curry/.test(n))                          return 'Same day';
  if (/salad|fresh/.test(n))                                           return 'Same day';
  // Liquid drinks that aren't payasa/porridge: serve immediately
  if (cat === 'liquid')                                                 return 'Same day; serve fresh';
  if (cat === 'semi-solid')                                             return '1–2 days refrigerated';
  return 'Same day';
}

function estimateTotalTime(recipe: RecipeParsed): number {
  let cookMins = 0;
  for (const step of recipe.steps) {
    const t = step.text.toLowerCase();
    // Skip long soaking steps (not active cook time)
    if (/soak.*(?:overnight|\d+\s*hr)/.test(t)) continue;
    // Range: take upper bound
    const rangeM = t.match(/(\d+)\s*[–\-]\s*(\d+)\s*min/);
    if (rangeM) { cookMins += parseInt(rangeM[2]); continue; }
    // Exact minutes
    const exactM = t.match(/\b(\d+)\s*min\b/);
    if (exactM) { cookMins += parseInt(exactM[1]); continue; }
    // Short hours (1-2 hr = active cook)
    const hrM = t.match(/\b([12])\s*hr\b/);
    if (hrM) cookMins += parseInt(hrM[1]) * 60;
  }
  // Add base active prep time by category
  const base = recipe.category === 'liquid' ? 10 : recipe.category === 'semi-solid' ? 20 : 20;
  return Math.max(cookMins + base, recipe.category === 'liquid' ? 5 : 15);
}

// ── Description generator ─────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  roti: 'flatbread', paratha: 'stuffed flatbread', laddu: 'sweet ball',
  halwa: 'halwa', vada: 'fritter', panaka: 'cooling drink',
  buttermilk: 'spiced buttermilk drink', soup: 'medicinal soup',
  payasa: 'sweet milk preparation', porridge: 'porridge',
  shrikhand: 'strained yogurt preparation', chutney: 'chutney',
  preserve: 'preserve', rice: 'rice preparation',
};

const ING_NOTES: Record<string, string> = {
  'barley':    'Barley (Yava) balances Kapha and Pitta and is prized in Ayurveda for its lightness',
  'black-gram':'Black gram (Masha) builds strength and nourishes the tissues',
  'coconut':   'Coconut cools, rejuvenates and nourishes all seven tissues',
  'milk':      "Cow's milk (Dugdha) builds Ojas — the body's vital essence",
  'ghee':      'Ghee (Ghrita) kindles digestion and carries nutrients deep into the body',
  'amla':      'Amla (Amalaki) is the supreme rasayana, balancing all three doshas',
  'sesame':    'Sesame (Tila) strengthens bones, nourishes the skin and has a warming quality',
  'jaggery':   'Jaggery and rock sugar are considered cleaner sweeteners than refined sugar in Ayurveda',
};

function generateDescription(recipe: RecipeParsed, type: string): string {
  const src = shortSource(recipe.sources);

  // Key ingredients (skip generic ones)
  const SKIP_RE = /^(water|warm water|rock salt|salt|oil for|oil$|\bghee$)/i;
  const keyIngs = recipe.ingredients
    .filter(i => !SKIP_RE.test(i.nameEn.trim()))
    .slice(0, 3)
    .map(i => i.nameEn.trim().toLowerCase());

  const ingPhrase =
    keyIngs.length === 0 ? 'simple ingredients'
    : keyIngs.length === 1 ? keyIngs[0]
    : keyIngs.length === 2 ? `${keyIngs[0]} and ${keyIngs[1]}`
    : `${keyIngs[0]}, ${keyIngs[1]} and ${keyIngs[2]}`;

  // Dominant cooking action from the first cook step
  const cookStep = recipe.steps.find(s => {
    const t = s.text.toLowerCase();
    return /(cook|fry|boil|simmer|bake|steam|roast|heat|sauté)/i.test(t)
        && !/(soak|knead|rest|serve|garnish)/i.test(t.split('.')[0]);
  });

  // Build a concise method phrase from the dominant cook step.
  // Convert the imperative first clause ("Cook on tawa" → "cooked on tawa").
  const VERB_TO_PP: [RegExp, string][] = [
    [/^cook\b/i,          'cooked'],
    [/^fry\b/i,           'fried'],
    [/^deep.?fry\b/i,     'deep-fried'],
    [/^boil\b/i,          'boiled'],
    [/^simmer\b/i,        'simmered'],
    [/^steam\b/i,         'steamed'],
    [/^bake\b/i,          'baked'],
    [/^roast\b/i,         'roasted'],
    [/^sauté\b/i,         'sautéed'],
    [/^heat\b/i,          'heated'],
    [/^combine\b/i,       'combined'],
    [/^mix\b/i,           'mixed'],
    [/^blend\b/i,         'blended'],
    [/^reduce\b/i,        'reduced'],
  ];
  let methodPhrase = '';
  if (cookStep) {
    const clause = cookStep.text.split(/[.;]/)[0].trim();
    const shortened = clause.length <= 55 ? clause : clause.slice(0, 52) + '…';
    let pp = shortened;
    for (const [re, past] of VERB_TO_PP) {
      if (re.test(shortened)) {
        pp = shortened.replace(re, past);
        break;
      }
    }
    // Lowercase first char for embedding mid-sentence
    pp = pp.charAt(0).toLowerCase() + pp.slice(1);
    methodPhrase = `, ${pp}`;
  }

  // Type label
  const typeLabel = TYPE_LABELS[type]
    || (recipe.category === 'liquid' ? 'drink' : recipe.category === 'semi-solid' ? 'preparation' : 'preparation');

  // Sanskrit name if present
  const namePart = recipe.nameTa
    ? `${recipe.nameEn} (${recipe.nameTa})`
    : recipe.nameEn;

  // Source suffix
  const srcSuffix = src ? ` — a classical recipe from ${src}` : ' — a classical Ayurvedic recipe';

  // Ayurvedic note from main ingredient
  const mainIng = inferMainIngredients(recipe.ingredients)[0] || '';
  const ingNote = mainIng ? ING_NOTES[mainIng] : '';
  const sentenceTwo = ingNote ? ` ${ingNote}.` : '';

  return `${namePart} is an Ayurvedic ${typeLabel} made with ${ingPhrase}${methodPhrase}${srcSuffix}.${sentenceTwo}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────────────────────────────────────

function enrich() {
  if (!fs.existsSync(IN_PATH)) {
    console.error(`❌  recipes-parsed.json not found at:\n   ${IN_PATH}`);
    console.error('   Run  npm run parse:md  first.');
    process.exit(1);
  }

  const recipes: RecipeParsed[] = JSON.parse(fs.readFileSync(IN_PATH, 'utf-8'));
  const counts = { total: 0, noType: 0, noMainIng: 0 };

  const enriched = recipes.map(recipe => {
    counts.total++;

    // ── Step enrichment ─────────────────────────────────────────────────────
    const enrichedSteps = recipe.steps.map((step, idx) => {
      const { phase, heat, timerStr } = enrichStep(step.text, idx, recipe.steps.length);
      return { ...step, phase, heat, timerStr };
    });

    // ── Recipe-level enrichment ─────────────────────────────────────────────
    const type            = inferType(recipe.nameEn, recipe.category);
    const meals           = inferMeals(recipe.nameEn, recipe.category, type);
    const mainIngredients = inferMainIngredients(recipe.ingredients);
    const methods         = inferMethods(recipe.steps);
    const dietTags        = inferDietTags(recipe);
    const { makeAhead, prepAheadNote } = inferMakeAhead(recipe.steps);
    const shelfLife       = inferShelfLife(recipe, type);
    const totalTimeMin    = estimateTotalTime(recipe);
    const description     = generateDescription(recipe, type);

    if (!type)                    counts.noType++;
    if (mainIngredients.length === 0) counts.noMainIng++;

    return {
      ...recipe,
      description,
      type,
      meals,
      mainIngredients,
      methods,
      dietTags,
      makeAhead,
      prepAheadNote,
      shelfLife,
      totalTimeMin,
      steps: enrichedSteps,
    };
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify(enriched, null, 2), 'utf-8');

  console.log('\n✅  Enrichment complete');
  console.log(`   Recipes processed : ${counts.total}`);
  console.log(`   No type inferred  : ${counts.noType}  (will default to '')`);
  console.log(`   No vocab ing found: ${counts.noMainIng}  (mainIngredients will be [])`);
  console.log(`\n   Output → ${OUT_PATH}\n`);

  // Sample spot-check
  console.log('── Sample spot-check ────────────────────────────────────────────────');
  [enriched[0], enriched[28], enriched[60]].forEach(r => {
    if (!r) return;
    console.log(`\n  [${r.slug}] ${r.nameEn}`);
    console.log(`    type: ${r.type || '(none)'}  meals: [${r.meals.join(', ')}]`);
    console.log(`    mainIng: [${r.mainIngredients.join(', ')}]  methods: [${r.methods.join(', ')}]`);
    console.log(`    diet: [${r.dietTags.join(', ')}]  makeAhead: ${r.makeAhead}`);
    console.log(`    shelfLife: "${r.shelfLife}"  totalTimeMin: ${r.totalTimeMin}`);
    console.log(`    description: "${r.description.slice(0, 100)}…"`);
    console.log('    steps:');
    r.steps.forEach(s => {
      console.log(`      [${s.order}] phase=${s.phase} heat=${s.heat ?? 'null'} timer=${s.timerStr ?? 'null'}`);
    });
  });
  console.log('\n─────────────────────────────────────────────────────────────────────\n');
}

enrich();
