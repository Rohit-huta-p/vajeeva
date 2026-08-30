// Vocabulary shape from GET /api/admin/tags (grouped by facet).
export type VocabValue = { code: string; label: string; order?: number; enabled?: boolean };
export type Vocab = Record<'type' | 'meal' | 'ingredient' | 'method' | 'diet', VocabValue[]>;
export const emptyVocab = (): Vocab => ({ type: [], meal: [], ingredient: [], method: [], diet: [] });

// ── Curated starter vocabulary (mirrors TagsPage defaults) ───────────────────
// Used as a fallback when the DB has no saved tags yet, so the recipe editor
// always shows options without requiring a separate trip to /tags first.
const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mk = (labels: string[]): VocabValue[] =>
  labels.map((label, i) => ({ code: slug(label), label, order: i + 1, enabled: true }));

export const TAG_DEFAULTS: Vocab = {
  type:       mk(['Roti','Paratha','Laddu','Halwa','Vada','Panaka','Buttermilk','Soup','Payasa','Porridge','Shrikhand','Chutney','Preserve','Rice']),
  meal:       mk(['Breakfast','Snack','Side','Drink','Dessert']),
  ingredient: mk(['Coconut','Barley','Amla','Black gram','Milk','Ghee','Jaggery','Sesame']),
  method:     mk(['Steamed','Fried','Baked','Roasted','Boiled','No-cook','Fermented','Soaked']),
  diet:       mk(['Sweet','Savoury','No added sugar','Dairy','High protein']),
};

/** Merge DB vocab with defaults: any facet that has saved values wins; otherwise fall back. */
export function mergeTagDefaults(saved: Partial<Vocab> | null | undefined): Vocab {
  const out = { ...TAG_DEFAULTS };
  for (const facet of Object.keys(TAG_DEFAULTS) as (keyof Vocab)[]) {
    const list = saved?.[facet];
    if (Array.isArray(list) && list.length > 0) out[facet] = list as VocabValue[];
  }
  return out;
}

// The recipe's tag selections (a slice of RecipeInput).
export type TagValue = {
  type: string;
  meals: string[];
  mainIngredients: string[];
  methods: string[];
  dietTags: string[];
  makeAhead: boolean;
  prepAheadNote: string;
  totalTimeMin?: number;
};

// facet (vocab key) → recipe field, and whether it's single-select.
const FACETS = [
  { facet: 'type',       field: 'type',            label: 'Type',             single: true },
  { facet: 'meal',       field: 'meals',           label: 'Meal',             single: false },
  { facet: 'ingredient', field: 'mainIngredients', label: 'Main ingredients', single: false },
  { facet: 'method',     field: 'methods',         label: 'Method',           single: false },
  { facet: 'diet',       field: 'dietTags',        label: 'Diet',             single: false },
] as const;

/**
 * Discovery-tag picker for the recipe editor. Options come from the admin-managed
 * vocabulary (TagConfig) so a recipe can only carry valid codes. `type` is a
 * single choice; the rest are multi. Plus a make-ahead flag + prep note.
 */
export function TagRows({ value, vocab, onChange }: {
  value: TagValue;
  vocab: Vocab;
  onChange: (patch: Partial<TagValue>) => void;
}) {
  const chip = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-[13px] border transition-colors ${
      on ? 'bg-brand text-white border-brand' : 'bg-cream text-ink/70 border-ink/[0.11] hover:border-ink/30'
    }`;

  return (
    <div className="flex flex-col gap-4">

      {FACETS.map(({ facet, field, label, single }) => {
        const opts = (vocab[facet] ?? []).filter(o => o.enabled !== false);
        const selected: string[] = single
          ? (value[field] ? [value[field] as string] : [])
          : (value[field] as string[]);

        return (
          <div key={facet}>
            <p className="text-[10.5px] uppercase tracking-[0.08em] text-ink/45 font-bold mb-2">
              {label}{single && <span className="normal-case font-normal text-ink/35"> · pick one</span>}
            </p>
            {opts.length === 0 ? (
              <p className="text-xs text-ink/40 italic">No options enabled for this facet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {opts.map(o => {
                  const on = selected.includes(o.code);
                  return (
                    <button
                      type="button"
                      key={o.code}
                      aria-pressed={on}
                      className={chip(on)}
                      onClick={() => {
                        if (single) {
                          onChange({ type: on ? '' : o.code });
                        } else {
                          const arr = value[field] as string[];
                          const next = on ? arr.filter(c => c !== o.code) : [...arr, o.code];
                          onChange({ [field]: next } as Partial<TagValue>);
                        }
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Make-ahead + total time */}
      <div className="border-t border-ink/[0.08] pt-4 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={value.makeAhead}
            onChange={e => onChange({ makeAhead: e.target.checked })}
            className="w-4 h-4 accent-brand"
          />
          Make-ahead (needs an overnight soak / advance prep)
        </label>
        {value.makeAhead && (
          <input
            placeholder="Prep-ahead note — e.g. soak black gram overnight"
            value={value.prepAheadNote}
            onChange={e => onChange({ prepAheadNote: e.target.value })}
            className="w-full border border-ink/[0.11] rounded-[8px] px-3 py-2 bg-cream text-[13px] text-ink placeholder:text-ink/35"
          />
        )}
        <label className="block text-[10.5px] uppercase tracking-[0.08em] text-ink/45 font-bold">
          Total time (min) — optional, when soaks/hangs exceed the step timers
          <input
            type="number"
            min={0}
            value={value.totalTimeMin ?? ''}
            onChange={e => onChange({ totalTimeMin: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="mt-1.5 block w-32 border border-ink/[0.11] rounded-[8px] px-3 py-2 bg-cream text-[13px] text-ink normal-case"
          />
        </label>
      </div>
    </div>
  );
}
