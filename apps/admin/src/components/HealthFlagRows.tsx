import type { RecipeInput } from '@vajeeva/shared';

type HealthFlag = RecipeInput['healthFlags'][number];

export function HealthFlagRows({ value, onChange }: {
  value: HealthFlag[];
  onChange: (next: HealthFlag[]) => void;
}) {
  const set = (i: number, patch: Partial<HealthFlag>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Health Flags</legend>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            aria-label={`Flag ${i + 1} condition`}
            placeholder="Condition (e.g. diabetes)"
            value={row.condition}
            onChange={e => set(i, { condition: e.target.value })}
            className="w-40 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <select
            aria-label={`Flag ${i + 1} severity`}
            value={row.severity}
            onChange={e => set(i, { severity: e.target.value as HealthFlag['severity'] })}
            className="border border-ink/20 rounded-lg px-2 py-2 bg-bone text-sm"
          >
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="avoid">Avoid</option>
          </select>
          <input
            aria-label={`Flag ${i + 1} note`}
            placeholder="Note"
            value={row.note}
            onChange={e => set(i, { note: e.target.value })}
            className="flex-1 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <button
            type="button"
            aria-label={`Remove flag ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-clay px-2"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { condition: '', severity: 'caution', note: '' }])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add health flag
      </button>
    </fieldset>
  );
}
