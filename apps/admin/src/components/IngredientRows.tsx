import type { RecipeInput } from '@vajeeva/shared';

type Ingredient = RecipeInput['ingredients'][number];

export function IngredientRows({ value, onChange }: {
  value: Ingredient[];
  onChange: (next: Ingredient[]) => void;
}) {
  const set = (i: number, patch: Partial<Ingredient>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Ingredients</legend>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            aria-label={`Ingredient ${i + 1} name`}
            placeholder="Name"
            value={row.nameEn}
            onChange={e => set(i, { nameEn: e.target.value })}
            className="flex-1 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <input
            aria-label={`Ingredient ${i + 1} grams`}
            placeholder="40–50 g"
            value={row.quantityG}
            onChange={e => set(i, { quantityG: e.target.value })}
            className="w-28 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <input
            aria-label={`Ingredient ${i + 1} cups`}
            placeholder="¼ cup"
            value={row.quantityCup}
            onChange={e => set(i, { quantityCup: e.target.value })}
            className="w-28 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <button
            type="button"
            aria-label={`Remove ingredient ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-clay px-2"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { nameEn: '', quantityG: '', quantityCup: '' }])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add ingredient
      </button>
    </fieldset>
  );
}
