import type { RecipeInput } from '@vajeeva/shared';
import { ImageGalleryEditor, type GalleryImage } from './ImageGalleryEditor';

type Step = RecipeInput['steps'][number];

export const EMPTY_STEP: Step = {
  order: 1,
  text: '',
  phase: '',
  heat: null,
  stepIngredients: [],
  illColor: '#2A3828',
  images: [],
};

const INP = 'border border-ink/[0.11] rounded-[8px] px-3 py-2 bg-cream text-[13px] text-ink placeholder:text-ink/35';

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
    <div className="flex flex-col gap-3">
      {value.map((row, i) => (
        <div key={i} className="bg-sand border border-ink/[0.11] rounded-[12px] p-4">
          {/* Step header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-brand text-white rounded-full w-6 h-6 text-[11px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <button type="button" aria-label={`Move step ${i + 1} up`} disabled={i === 0}
              onClick={() => move(i, -1)}
              className="text-ink/40 hover:text-ink disabled:opacity-20 transition-colors px-1 text-[15px]">↑</button>
            <button type="button" aria-label={`Move step ${i + 1} down`} disabled={i === value.length - 1}
              onClick={() => move(i, 1)}
              className="text-ink/40 hover:text-ink disabled:opacity-20 transition-colors px-1 text-[15px]">↓</button>
            <span className="flex-1" />
            <button type="button" aria-label={`Remove step ${i + 1}`}
              onClick={() => emit(value.filter((_, j) => j !== i))}
              className="text-clay/70 hover:text-clay px-2 text-[18px] leading-none transition-colors">×</button>
          </div>

          {/* Instruction */}
          <textarea
            aria-label={`Step ${i + 1} text`}
            placeholder="What to do in this step…"
            value={row.text}
            rows={2}
            onChange={e => set(i, { text: e.target.value })}
            className={`w-full ${INP} mb-3 resize-y`}
          />

          {/* Phase / Heat / Color */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input
              aria-label={`Step ${i + 1} phase`}
              placeholder="Phase (e.g. Milk & Coconut)"
              value={row.phase}
              onChange={e => set(i, { phase: e.target.value })}
              className={INP}
            />
            <input
              aria-label={`Step ${i + 1} heat`}
              placeholder="Heat (blank = none)"
              value={row.heat ?? ''}
              onChange={e => set(i, { heat: e.target.value || null })}
              className={INP}
            />
            <label className="flex items-center gap-2 text-[12px] text-ink/55 px-1 col-span-2">
              Illustration color
              <input
                aria-label={`Step ${i + 1} illustration color`}
                type="color"
                value={row.illColor}
                onChange={e => set(i, { illColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
            </label>
          </div>

          {/* Step ingredients */}
          <input
            aria-label={`Step ${i + 1} ingredients`}
            placeholder="Step ingredients, comma,separated"
            value={row.stepIngredients.join(',')}
            onChange={e => set(i, { stepIngredients: e.target.value.split(',') })}
            className={`w-full ${INP} mb-3`}
          />

          <ImageGalleryEditor
            context={`step ${i + 1}`}
            value={(row.images ?? []) as GalleryImage[]}
            onChange={images => set(i, { images })}
            hint="800 × 600 px · 4:3 ratio · JPEG or WebP"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => emit([...value, EMPTY_STEP])}
        className="border border-dashed border-ink/[0.18] rounded-[10px] w-full py-2.5 text-[13px] text-ink/45 hover:border-brand hover:text-brand transition-colors"
      >
        + Add step
      </button>
    </div>
  );
}
