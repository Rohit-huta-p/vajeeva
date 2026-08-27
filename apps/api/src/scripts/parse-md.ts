#!/usr/bin/env ts-node
/**
 * parse-md.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads   content/vajeeva-recipes.md  (the audited source of truth)
 * Writes  content/recipes-parsed.json (83 draft recipe objects, ready to seed)
 *
 * Run:  npm run parse:md   (from apps/api)
 *
 * What gets populated automatically:
 *   slug · nameEn · nameTa · category · sources · yieldStr
 *   ingredients (nameEn, quantityG, quantityMl, quantityCup, note)
 *   steps (order, text — phase/heat/timerStr filled in admin later)
 *   healthFlags (DM / OW / LI / SD — from inline 🔴 lines)
 *   status: 'draft'
 *
 * What is left empty for admin enrichment:
 *   description · shelfLife · type · meals · mainIngredients
 *   methods · dietTags · makeAhead · prepAheadNote · images
 *   steps.phase · steps.heat · steps.timerStr · steps.stepIngredients
 */

import fs from 'fs';
import path from 'path';

// ── Types (mirror the Recipe + Ingredient Mongoose schemas) ───────────────────

interface Ingredient {
  nameEn:      string;
  quantityG:   string;
  quantityMl:  string;
  quantityCup: string;
  note:        string;
}

interface Step {
  order:           number;
  text:            string;
  phase:           string;
  heat:            string | null;
  timerStr:        string | null;
  stepIngredients: string[];
  illColor:        string;
}

interface HealthFlag {
  condition: string;
  severity:  'caution';
  note:      string;
}

interface Source {
  citation: string;   // raw abbreviation + page detail,  e.g. "BK — p. 51"
  text:     string;   // full human-readable name from SOURCE_MAP
}

interface RecipeParsed {
  slug:            string;
  nameEn:          string;
  nameTa:          string;
  category:        'solid' | 'liquid' | 'semi-solid';
  description:     string;
  ingredients:     Ingredient[];
  steps:           Step[];
  healthFlags:     HealthFlag[];
  sources:         Source[];
  yieldStr:        string;
  shelfLife:       string;
  type:            string;
  meals:           string[];
  mainIngredients: string[];
  methods:         string[];
  dietTags:        string[];
  makeAhead:       boolean;
  prepAheadNote:   string;
  status:          'draft';
  images:          never[];
}

// ── Source abbreviation → full citation name ──────────────────────────────────

const SOURCE_MAP: Record<string, string> = {
  BK:    'Bhojana Kutuhala (Siddhannaprakarana)',
  KK:    'Ksemakutūhalam (Ksema Sarmakrut) — Pandey ed.',
  BP:    'Bhavaprakash Nighantu (Kritanna varga)',
  KN:    'Kaiyadeva Nighantu',
  CC:    'Charaka Chikitsasthana',
  CS:    'Charak Sutrasthana',
  AM:    'Ayurveda Mahodadhi (Pakvannavarga)',
  AS:    'Ayurveda sara Samgraha',
  BR:    'Bhaishyaja Ratnavali',
  SS:    'Sarngadhara Samhita (Madhyama Khanda)',
  MC:    'Morningstar — Ayurvedic Cooking for All, 3rd repr. 2011',
  GO:    'Gowans — Food for Life: Ayurvedic Recipes, 2009',
  AYUSH: 'Traditional food recipes from Ayush systems of medicine',
  ICMR:  'ICMR-NIN Dietary Guidelines for Indians, 2024',
};

// ── Health flag templates (severity can be refined in admin) ──────────────────

const HEALTH_FLAG_DEFAULTS: Record<string, Omit<HealthFlag, 'severity'> & { severity: 'caution' }> = {
  DM: {
    condition: 'Diabetes (DM)',
    severity:  'caution',
    note:      'High in sugars or glycaemic load — consume sparingly.',
  },
  OW: {
    condition: 'Overweight / Obesity (OW)',
    severity:  'caution',
    note:      'Calorie-dense preparation — portion carefully.',
  },
  LI: {
    condition: 'Lactose Intolerance (LI)',
    severity:  'caution',
    note:      'Contains dairy — substitute with non-dairy alternatives.',
  },
  SD: {
    condition: 'Sedentary Lifestyle (SD)',
    severity:  'caution',
    note:      'Rich in fat or sugar — balance with physical activity.',
  },
};

// Neutral step illColor per texture category — admin sets real phase colours later
const DEFAULT_ILL_COLOR: Record<string, string> = {
  solid:        '#F5F0E8',
  liquid:       '#E8F0F5',
  'semi-solid': '#F0EDE8',
};

// ── Parsing helpers ───────────────────────────────────────────────────────────

function slugify(code: string): string {
  return code.toLowerCase(); // 'S-01' → 's-01'
}

function categoryFromCode(code: string): 'solid' | 'liquid' | 'semi-solid' {
  const p = code[0].toUpperCase();
  if (p === 'S') return 'solid';
  if (p === 'L') return 'liquid';
  return 'semi-solid';
}

/** Strip markdown bold/italic markers and collapse whitespace. */
function clean(s: string): string {
  return s.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Parse a "**Source:**" line value into Source[].
 *
 * Examples:
 *   "BK — Dhanyavishesha, p. 51 · ICMR"
 *   "BP 12/33–34 · BK — p. 51 · KK 10th Utsava · ICMR"
 *   "AYUSH"
 *
 * Each ·-delimited segment becomes one Source.
 */
function parseSources(raw: string): Source[] {
  return raw
    .split(/\s*·\s*/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(segment => {
      const codeMatch = segment.match(/^([A-Z]+)/);
      const code = codeMatch ? codeMatch[1] : '';
      return {
        citation: segment,
        text:     SOURCE_MAP[code] ?? code,
      };
    });
}

/**
 * Parse a "🔴 DM · OW · LI · SD" line into HealthFlag[].
 * Only recognises the four defined codes; silently ignores unknowns.
 */
function parseHealthFlags(line: string): HealthFlag[] {
  return line
    .replace('🔴', '')
    .split('·')
    .map(s => s.trim())
    .filter(code => code in HEALTH_FLAG_DEFAULTS)
    .map(code => ({ ...HEALTH_FLAG_DEFAULTS[code] }));
}

/**
 * Parse one ingredient table row.
 * Handles both 5-col (standard) and 6-col (stage) tables.
 * Returns null for header / separator / unrecognised rows.
 */
const EM = '—';

function parseIngredientRow(row: string): Ingredient | null {
  const cells = row.split('|').slice(1, -1).map(c => c.trim());

  let nameEn: string, g: string, ml: string, cups: string, note: string;

  if (cells.length === 5) {
    [nameEn, g, ml, cups, note] = cells;
  } else if (cells.length === 6) {
    // Stage table: col 0 is the stage label — skip it
    [, nameEn, g, ml, cups, note] = cells;
  } else {
    return null;
  }

  // Skip header rows and separator rows
  if (!nameEn) return null;
  if (/^[-: |]+$/.test(nameEn)) return null;
  if (/^ingredient$/i.test(nameEn) || /^stage$/i.test(nameEn)) return null;

  return {
    nameEn:      clean(nameEn),
    quantityG:   g === EM    ? '' : clean(g),
    quantityMl:  ml === EM   ? '' : clean(ml),
    quantityCup: cups === EM ? '' : clean(cups),
    note:        note === EM ? '' : clean(note),
  };
}

// ── Pass 1: code → Sanskrit name from the Quick Index ────────────────────────

function buildIndexMap(content: string): Map<string, string> {
  const map = new Map<string, string>();
  // Index table rows:  | S-01 | Barley Roti | — | Bread |
  //                    | S-02 | Name        | Vedanika | Bread |
  const re = /^\|\s*([SLM]-\d{2})\s*\|\s*[^|]+\|\s*([^|]+)\|\s*[^|]+\|/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const code    = m[1].trim();
    const sanskrit = clean(m[2]);
    map.set(code, sanskrit === '—' ? '' : sanskrit);
  }
  return map;
}

// ── Pass 2: scan every recipe block ──────────────────────────────────────────

/**
 * Split a prose method paragraph into sentence-level steps.
 * e.g. "Mix well. Add salt. Serve hot." → ["Mix well.", "Add salt.", "Serve hot."]
 */
function proseSentences(text: string): string[] {
  // Split at ". " where next char is uppercase or end-of-string
  return text
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean);
}

type ParseState = 'preamble' | 'ingredients' | 'method' | 'idle';

function parseRecipes(content: string, indexMap: Map<string, string>): RecipeParsed[] {
  const recipes: RecipeParsed[] = [];
  const lines = content.split('\n');

  let cur: RecipeParsed | null = null;
  let state: ParseState = 'idle';
  let proseLines: string[] = [];  // buffer for prose-style (un-numbered) method text

  for (const line of lines) {
    const t = line.trim();

    // ── Recipe heading ─────────────────────────────────────────────────────
    // Matches: ### S-01 · Barley Roti   or   ### L-22 · Almond Milk *(MC)*
    const headM = t.match(/^###\s+([SLM]-\d{2})\s*[·.]\s*(.+)/);
    if (headM) {
      // Flush any pending prose method into steps before switching recipes
      if (cur && cur.steps.length === 0 && proseLines.length > 0) {
        const sentences = proseSentences(proseLines.join(' '));
        cur.steps = sentences.map((text, i) => ({
          order: i + 1, text,
          phase: '', heat: null, timerStr: null,
          stepIngredients: [],
          illColor: DEFAULT_ILL_COLOR[cur!.category] ?? '#F5F0E8',
        }));
      }
      proseLines = [];
      if (cur) recipes.push(cur);

      const code = headM[1];
      // Strip italic markers and trailing (Sanskrit) in parens
      let nameEn = headM[2].replace(/\*+/g, '').trim();
      nameEn = nameEn.replace(/\s*\([^)]*\)\s*$/, '').trim();

      const category = categoryFromCode(code);

      cur = {
        slug:            slugify(code),
        nameEn,
        nameTa:          indexMap.get(code) ?? '',
        category,
        description:     '',
        ingredients:     [],
        steps:           [],
        healthFlags:     [],
        sources:         [],
        yieldStr:        '',
        shelfLife:       '',
        type:            '',
        meals:           [],
        mainIngredients: [],
        methods:         [],
        dietTags:        [],
        makeAhead:       false,
        prepAheadNote:   '',
        status:          'draft',
        images:          [],
      };
      state = 'preamble';
      continue;
    }

    if (!cur) continue;

    // ── Source line ────────────────────────────────────────────────────────
    if (state === 'preamble' && t.startsWith('**Source:**')) {
      const raw = t.replace(/^\*\*Source:\*\*\s*/, '').trimEnd();
      cur.sources = parseSources(raw);
      continue;
    }

    // ── Yield line ─────────────────────────────────────────────────────────
    if (t.startsWith('**Yield:**')) {
      cur.yieldStr = t.replace(/^\*\*Yield:\*\*\s*/, '').trim();
      continue;
    }

    // ── Health flags  🔴 DM · OW · SD ─────────────────────────────────────
    if (t.startsWith('🔴')) {
      cur.healthFlags = parseHealthFlags(t);
      continue;
    }

    // ── Ingredient table header ────────────────────────────────────────────
    // Catches both:  | Ingredient | g | ...   and   | Stage | Ingredient | g | ...
    if (/^\|\s*(?:Stage\s*\|)?\s*Ingredient\s*\|\s*g\s*\|/i.test(t)) {
      state = 'ingredients';
      continue;
    }

    // ── Method section begins ──────────────────────────────────────────────
    if (/^\*\*Method\*\*/.test(t)) {
      state = 'method';
      continue;
    }

    // ── Collect ingredient rows ────────────────────────────────────────────
    if (state === 'ingredients' && t.startsWith('|')) {
      if (/^\|[-: |]+\|$/.test(t)) continue; // separator row
      const ing = parseIngredientRow(t);
      if (ing) cur.ingredients.push(ing);
    }

    // ── Collect method steps ───────────────────────────────────────────────
    if (state === 'method') {
      const stepM = t.match(/^(\d+)\.\s+(.+)/);
      if (stepM) {
        // Numbered step
        cur.steps.push({
          order:           parseInt(stepM[1], 10),
          text:            stepM[2].trim(),
          phase:           '',
          heat:            null,
          timerStr:        null,
          stepIngredients: [],
          illColor:        DEFAULT_ILL_COLOR[cur.category] ?? '#F5F0E8',
        });
      } else if (t && !t.startsWith('---') && !t.startsWith('#')) {
        // Prose-style method — buffer to split into sentences at end of block
        proseLines.push(t);
      }
    }
  }

  // Flush trailing prose for the last recipe in the file
  if (cur && cur.steps.length === 0 && proseLines.length > 0) {
    const sentences = proseSentences(proseLines.join(' '));
    cur.steps = sentences.map((text, i) => ({
      order: i + 1, text,
      phase: '', heat: null, timerStr: null, stepIngredients: [],
      illColor: DEFAULT_ILL_COLOR[cur!.category] ?? '#F5F0E8',
    }));
  }

  if (cur) recipes.push(cur);
  return recipes;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const MD_PATH  = path.resolve(__dirname, '../../../../../content/vajeeva-recipes.md');
const OUT_PATH = path.resolve(__dirname, '../../../../../content/recipes-parsed.json');

if (!fs.existsSync(MD_PATH)) {
  console.error(`\n❌  Source file not found:\n   ${MD_PATH}\n`);
  process.exit(1);
}

const content  = fs.readFileSync(MD_PATH, 'utf-8');
const indexMap = buildIndexMap(content);
const recipes  = parseRecipes(content, indexMap);

// ── Validation report ─────────────────────────────────────────────────────────

const counts = { solid: 0, liquid: 0, 'semi-solid': 0 };
let warnings = 0;

for (const r of recipes) {
  counts[r.category]++;
  const issues: string[] = [];
  if (!r.sources.length)          issues.push('no sources');
  if (!r.yieldStr)                issues.push('no yield');
  if (!r.ingredients.length)      issues.push('no ingredients');
  if (!r.steps.length)            issues.push('no steps');
  if (issues.length) {
    process.stderr.write(`⚠  ${r.slug}  ${r.nameEn.padEnd(42)} ${issues.join(', ')}\n`);
    warnings++;
  }
}

const totalIngs  = recipes.reduce((n, r) => n + r.ingredients.length, 0);
const totalSteps = recipes.reduce((n, r) => n + r.steps.length, 0);
const flagged    = recipes.filter(r => r.healthFlags.length > 0).length;

console.log('\n── Vajeeva MD Parser ──────────────────────────────────');
console.log(`   Recipes:     ${recipes.length}`);
console.log(`   Solid:       ${counts.solid}  · Liquid: ${counts.liquid}  · Semi-solid: ${counts['semi-solid']}`);
console.log(`   Ingredients: ${totalIngs} rows`);
console.log(`   Steps:       ${totalSteps}`);
console.log(`   Flagged:     ${flagged} recipes with health flags`);
console.log(`   Warnings:    ${warnings}`);
console.log('───────────────────────────────────────────────────────');

fs.writeFileSync(OUT_PATH, JSON.stringify(recipes, null, 2));

if (warnings === 0) {
  console.log(`\n✓  ${recipes.length} recipes written to:\n   ${OUT_PATH}\n`);
} else {
  console.warn(`\n⚠  ${recipes.length} recipes written (${warnings} warnings) to:\n   ${OUT_PATH}\n`);
}
