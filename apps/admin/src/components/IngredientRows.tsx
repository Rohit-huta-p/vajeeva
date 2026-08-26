import type { RecipeInput } from '@vajeeva/shared';

type Ingredient = RecipeInput['ingredients'][number];

export function IngredientRows({ value, onChange }: {
  value: Ingredient[];
  onChange: (next: Ingredient[]) => void;
}) {
  const set = (i: number, patch: Partial<Ingredient>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const inp = 'border border-ink/[0.11] rounded-[8px] px-2.5 py-2 bg-bone text-[12.5px] text-ink placeholder:text-ink/35 w-full';

  return (
    <fieldset className="bg-bone border border-ink/[0.11] rounded-[14px] p-5 mb-4">
      <legend className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45 px-1">
        Ingredients
      </legend>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_60px_60px_74px_1fr_28px] gap-2 mb-2">
        {['Ingredient', 'g', 'ml', 'Cups', 'Notes', ''].map(h => (
          <span key={h} className="text-[10px] font-bold uppercase tracking-[0.06em] text-ink/40 text-center first:text-left last:text-left">
            {h}
          </span>
        ))}
      </div>

      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_60px_60px_74px_1fr_28px] gap-2 mb-2 items-center">
          <input
            aria-label={`Ingredient ${i + 1} name`}
            placeholder="Name"
            value={row.nameEn}
            onChange={e => set(i, { nameEn: e.target.value })}
            className={inp}
          />
          <input
            aria-label={`Ingredient ${i + 1} grams`}
            placeholder="—"
            value={row.quantityG}
            onChange={e => set(i, { quantityG: e.target.value })}
            className={`${inp} text-center`}
          />
          <input
            aria-label={`Ingredient ${i + 1} ml`}
            placeholder="—"
            value={row.quantityMl ?? ''}
            onChange={e => set(i, { quantityMl: e.target.value })}
            className={`${inp} text-center`}
          />
          <input
            aria-label={`Ingredient ${i + 1} cups`}
            placeholder="¼ cup"
            value={row.quantityCup}
            onChange={e => set(i, { quantityCup: e.target.value })}
            className={`${inp} text-center`}
          />
          <input
            aria-label={`Ingredient ${i + 1} note`}
            placeholder="to taste, soaked…"
            value={row.note ?? ''}
            onChange={e => set(i, { note: e.target.value })}
            className={`${inp} italic text-[12px]`}
          />
          <button
            type="button"
            aria-label={`Remove ingredient ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="w-[22px] h-[22px] flex items-center justify-center rounded-full border border-ink/[0.11] bg-bone text-ink/45 hover:bg-clay-bg hover:border-clay hover:text-clay text-[14px] font-medium transition-colors shrink-0"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...value, { nameEn: '', quantityG: '', quantityMl: '', quantityCup: '', note: '' }])}
        className="mt-2 border border-dashed border-ink/20 rounded-[10px] w-full py-2 text-[12.5px] text-ink/45 hover:border-brand hover:text-brand transition-colors"
      >
        + Add ingredient
      </button>
    </fieldset>
  );
}
