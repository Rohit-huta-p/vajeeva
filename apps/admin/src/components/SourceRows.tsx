import type { RecipeInput } from '@vajeeva/shared';

type Source = RecipeInput['sources'][number];

const INP = 'border border-ink/[0.11] rounded-[8px] px-3 py-2 bg-cream text-[13px] text-ink placeholder:text-ink/35';

export function SourceRows({ value, onChange }: {
  value: Source[];
  onChange: (next: Source[]) => void;
}) {
  const set = (i: number, patch: Partial<Source>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="flex flex-col gap-2">
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            aria-label={`Source ${i + 1} text`}
            placeholder="Source (e.g. Ksemakutuhalam)"
            value={row.text}
            onChange={e => set(i, { text: e.target.value })}
            className={`flex-1 ${INP}`}
          />
          <input
            aria-label={`Source ${i + 1} citation`}
            placeholder="Citation (e.g. 10/54)"
            value={row.citation}
            onChange={e => set(i, { citation: e.target.value })}
            className={`w-32 ${INP}`}
          />
          <button
            type="button"
            aria-label={`Remove source ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-clay/60 hover:text-clay px-1.5 text-[18px] leading-none transition-colors shrink-0"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { text: '', citation: '' }])}
        className="border border-dashed border-ink/[0.18] rounded-[10px] w-full py-2.5 text-[13px] text-ink/45 hover:border-brand hover:text-brand transition-colors"
      >
        + Add source
      </button>
    </div>
  );
}
