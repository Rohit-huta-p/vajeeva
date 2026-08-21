import type { RecipeInput } from '@vajeeva/shared';

type Step = RecipeInput['steps'][number];

export const EMPTY_STEP: Step = {
  order: 1,
  text: '',
  phase: '',
  heat: null,
  timerStr: null,
  stepIngredients: [],
  illColor: '#2A3828',
};

export function StepRows({ value, onChange }: {
  value: Step[];
  onChange: (next: Step[]) => void;
}) {
  const emit = (next: Step[]) => onChange(next.map((s, i) => ({ ...s, order: i + 1 })));
  const set = (i: number, patch: Partial<Step>) =>
    emit(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const [row] = next.splice(i, 1);
    next.splice(i + dir, 0, row);
    emit(next);
  };

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Cook Steps</legend>
      {value.map((row, i) => (
        <div key={i} className="bg-bone border border-ink/20 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
              {i + 1}
            </span>
            <button type="button" aria-label={`Move step ${i + 1} up`} disabled={i === 0}
              onClick={() => move(i, -1)} className="px-1 disabled:opacity-30">↑</button>
            <button type="button" aria-label={`Move step ${i + 1} down`} disabled={i === value.length - 1}
              onClick={() => move(i, 1)} className="px-1 disabled:opacity-30">↓</button>
            <span className="flex-1" />
            <button type="button" aria-label={`Remove step ${i + 1}`}
              onClick={() => emit(value.filter((_, j) => j !== i))} className="text-clay px-2">×</button>
          </div>
          <textarea
            aria-label={`Step ${i + 1} text`}
            placeholder="What to do in this step…"
            value={row.text}
            onChange={e => set(i, { text: e.target.value })}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm mb-2"
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              aria-label={`Step ${i + 1} phase`}
              placeholder="Phase (e.g. Milk & Coconut)"
              value={row.phase}
              onChange={e => set(i, { phase: e.target.value })}
              className="border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <input
              aria-label={`Step ${i + 1} heat`}
              placeholder="Heat (blank = none)"
              value={row.heat ?? ''}
              onChange={e => set(i, { heat: e.target.value || null })}
              className="border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <input
              aria-label={`Step ${i + 1} timer`}
              placeholder="Timer MM:SS (blank = none)"
              value={row.timerStr ?? ''}
              onChange={e => set(i, { timerStr: e.target.value || null })}
              className="border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <label className="flex items-center gap-2 text-xs text-ink/55">
              Illustration color
              <input
                aria-label={`Step ${i + 1} illustration color`}
                type="color"
                value={row.illColor}
                onChange={e => set(i, { illColor: e.target.value })}
              />
            </label>
          </div>
          <input
            aria-label={`Step ${i + 1} ingredients`}
            placeholder="Step ingredients, comma,separated"
            value={row.stepIngredients.join(',')}
            onChange={e => set(i, { stepIngredients: e.target.value.split(',') })}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => emit([...value, EMPTY_STEP])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add step
      </button>
    </fieldset>
  );
}
