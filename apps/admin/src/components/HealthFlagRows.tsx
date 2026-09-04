import type { RecipeInput } from '@vajeeva/shared';

type HealthFlag = RecipeInput['healthFlags'][number];

export interface ConditionOption { code: string; label: string }

export function HealthFlagRows({ value, onChange, conditions = [] }: {
  value: HealthFlag[];
  onChange: (next: HealthFlag[]) => void;
  // The condition vocabulary (from GET /api/admin/health-flags). When present, the
  // condition field is a select constrained to these codes; otherwise it degrades
  // to free text so the editor still works offline. See
  // docs/specs/2026-09-03-condition-vocabulary.md.
  conditions?: ConditionOption[];
}) {
  const set = (i: number, patch: Partial<HealthFlag>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const known = new Set(conditions.map(c => c.code));

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Health Flags</legend>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 mb-2">
          {conditions.length > 0 ? (
            <select
              aria-label={`Flag ${i + 1} condition`}
              value={row.condition}
              onChange={e => set(i, { condition: e.target.value })}
              className="w-40 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
            >
              <option value="">Select condition…</option>
              {/* Preserve a legacy/retired value not in the current vocab. */}
              {row.condition && !known.has(row.condition) && (
                <option value={row.condition}>{row.condition} (retired)</option>
              )}
              {conditions.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          ) : (
            <input
              aria-label={`Flag ${i + 1} condition`}
              placeholder="Condition (e.g. diabetes)"
              value={row.condition}
              onChange={e => set(i, { condition: e.target.value })}
              className="w-40 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
            />
          )}
          <select
            aria-label={`Flag ${i + 1} severity`}
            value={row.severity}
            onChange={e => set(i, { severity: e.target.value as HealthFlag['severity'] })}
            className="border border-ink/20 rounded-lg px-2 py-2 bg-bone text-sm"
          >
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="avoid">Avoid</option>
            <option value="indication">Indication</option>
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
        onClick={() => onChange([...value, { condition: '', severity: 'caution', note: '', source: 'manual' }])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add health flag
      </button>
    </fieldset>
  );
}
