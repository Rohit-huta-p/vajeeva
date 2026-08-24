import { Link } from 'react-router-dom';

// Vocabulary shape from GET /api/admin/tags (grouped by facet).
export type VocabValue = { code: string; label: string; order?: number; enabled?: boolean };
export type Vocab = Record<'type' | 'meal' | 'ingredient' | 'method' | 'diet', VocabValue[]>;
export const emptyVocab = (): Vocab => ({ type: [], meal: [], ingredient: [], method: [], diet: [] });

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
    `px-3 py-1.5 rounded-full text-sm border transition-colors ${
      on ? 'bg-brand text-white border-brand' : 'bg-bone text-ink/70 border-ink/20 hover:border-ink/40'
    }`;

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Discovery tags</legend>

      {FACETS.map(({ facet, field, label, single }) => {
        const opts = (vocab[facet] ?? []).filter(o => o.enabled !== false);
        const selected: string[] = single
          ? (value[field] ? [value[field] as string] : [])
          : (value[field] as string[]);

        return (
          <div key={facet} className="mb-4">
            <p className="text-xs uppercase tracking-wider text-ink/55 font-semibold mb-2">
              {label}{single && <span className="normal-case font-normal text-ink/40"> · pick one</span>}
            </p>
            {opts.length === 0 ? (
              <p className="text-xs text-ink/40">
                No values yet — add them in <Link to="/tags" className="text-brand underline">Tags</Link>.
              </p>
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
      <div className="border-t border-ink/10 pt-3 mt-1 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={value.makeAhead}
            onChange={e => onChange({ makeAhead: e.target.checked })}
          />
          Make-ahead (needs an overnight soak / advance prep)
        </label>
        {value.makeAhead && (
          <input
            placeholder="Prep-ahead note — e.g. soak black gram overnight"
            value={value.prepAheadNote}
            onChange={e => onChange({ prepAheadNote: e.target.value })}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
        )}
        <label className="text-xs uppercase tracking-wider text-ink/55 font-semibold">
          Total time (min) — optional, when soaks/hangs exceed the step timers
          <input
            type="number"
            min={0}
            value={value.totalTimeMin ?? ''}
            onChange={e => onChange({ totalTimeMin: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="mt-1 block w-32 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
          />
        </label>
      </div>
    </fieldset>
  );
}
