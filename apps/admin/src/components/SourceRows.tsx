import type { RecipeInput } from '@vajeeva/shared';

type Source = RecipeInput['sources'][number];

export function SourceRows({ value, onChange }: {
  value: Source[];
  onChange: (next: Source[]) => void;
}) {
  const set = (i: number, patch: Partial<Source>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Sources</legend>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            aria-label={`Source ${i + 1} text`}
            placeholder="Source (e.g. Ksemakutuhalam)"
            value={row.text}
            onChange={e => set(i, { text: e.target.value })}
            className="flex-1 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <input
            aria-label={`Source ${i + 1} citation`}
            placeholder="Citation (e.g. 10/54)"
            value={row.citation}
            onChange={e => set(i, { citation: e.target.value })}
            className="w-32 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <button
            type="button"
            aria-label={`Remove source ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-clay px-2"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { text: '', citation: '' }])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add source
      </button>
    </fieldset>
  );
}
