import { useRef, useState } from 'react';
import type { RecipeInput } from '@vajeeva/shared';
// ImageGalleryEditor intentionally not rendered — step images not used in the
// frontend yet; keep the import commented so the data field is preserved in DB.
// import { ImageGalleryEditor, type GalleryImage } from './ImageGalleryEditor';

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

// ── Single step row — extracted to own component so each has its own selection state ──
function StepRow({ row, idx, onSet, onMove, onRemove, canUp, canDown }: {
  row: Step;
  idx: number;
  onSet: (patch: Partial<Step>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  canUp: boolean;
  canDown: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLink, setShowLink] = useState(false);

  function checkSelection() {
    const el = textareaRef.current;
    if (!el) return;
    setShowLink(el.selectionStart !== el.selectionEnd);
  }

  // Called via onMouseDown on the 🔗 button — e.preventDefault() keeps textarea
  // focused so selectionStart/End are still valid when we read them.
  function wrapSelection(e: React.MouseEvent) {
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e_ } = el;
    if (s === e_) return;
    const before   = row.text.slice(0, s);
    const selected = row.text.slice(s, e_);
    const after    = row.text.slice(e_);
    onSet({ text: `${before}[[${selected}]]${after}` });
    setShowLink(false);
  }

  return (
    <div className="bg-sand border border-ink/[0.11] rounded-[12px] p-4">
      {/* Step header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-brand text-white rounded-full w-6 h-6 text-[11px] font-bold flex items-center justify-center shrink-0">
          {idx + 1}
        </span>
        <button type="button" aria-label={`Move step ${idx + 1} up`} disabled={!canUp}
          onClick={() => onMove(-1)}
          className="text-ink/40 hover:text-ink disabled:opacity-20 transition-colors px-1 text-[15px]">↑</button>
        <button type="button" aria-label={`Move step ${idx + 1} down`} disabled={!canDown}
          onClick={() => onMove(1)}
          className="text-ink/40 hover:text-ink disabled:opacity-20 transition-colors px-1 text-[15px]">↓</button>
        <span className="flex-1" />
        <button type="button" aria-label={`Remove step ${idx + 1}`}
          onClick={onRemove}
          className="text-clay/70 hover:text-clay px-2 text-[18px] leading-none transition-colors">×</button>
      </div>

      {/* Instruction + 🔗 link button */}
      <div className="relative mb-3">
        {/* Floating link button — appears above the textarea when text is selected */}
        {showLink && (
          <div className="absolute -top-8 left-0 z-10 animate-in fade-in duration-100">
            <button
              type="button"
              onMouseDown={wrapSelection}
              className="flex items-center gap-1.5 bg-ink text-cream text-[11px] font-semibold px-2.5 py-1.5 rounded-[7px] shadow-lg hover:bg-ink/80 transition-colors whitespace-nowrap"
            >
              🔗 <span>Link to Google</span>
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          aria-label={`Step ${idx + 1} text`}
          placeholder="What to do in this step…"
          value={row.text}
          rows={2}
          onChange={e => onSet({ text: e.target.value })}
          onSelect={checkSelection}
          onMouseUp={checkSelection}
          onKeyUp={checkSelection}
          onBlur={() => setShowLink(false)}
          className={`w-full ${INP} resize-y`}
        />
        {/* Inline hint when [[links]] exist in the text */}
        {/\[\[.+?\]\]/.test(row.text) && (
          <p className="mt-1 text-[10.5px] text-ink/35 italic">
            Highlighted terms [[like this]] open a Google search when users tap them.
          </p>
        )}
      </div>

      {/* Phase / Heat */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          aria-label={`Step ${idx + 1} phase`}
          placeholder="Phase (e.g. Milk & Coconut)"
          value={row.phase}
          onChange={e => onSet({ phase: e.target.value })}
          className={INP}
        />
        <input
          aria-label={`Step ${idx + 1} heat`}
          placeholder="Heat (blank = none)"
          value={row.heat ?? ''}
          onChange={e => onSet({ heat: e.target.value || null })}
          className={INP}
        />
        {/* Illustration color — not used in the frontend yet; keeping data field, hiding UI
        <label className="flex items-center gap-2 text-[12px] text-ink/55 px-1 col-span-2">
          Illustration color
          <input
            aria-label={`Step ${idx + 1} illustration color`}
            type="color"
            value={row.illColor}
            onChange={e => onSet({ illColor: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          />
        </label>
        */}
      </div>

      {/* Step ingredients */}
      <input
        aria-label={`Step ${idx + 1} ingredients`}
        placeholder="Step ingredients, comma,separated"
        value={row.stepIngredients.join(',')}
        onChange={e => onSet({ stepIngredients: e.target.value.split(',') })}
        className={`w-full ${INP}`}
      />

      {/* Step image gallery — not used in frontend yet; keeping data field, hiding UI
      <ImageGalleryEditor
        context={`step ${idx + 1}`}
        value={(row.images ?? []) as GalleryImage[]}
        onChange={images => onSet({ images })}
        hint="800 × 600 px · 4:3 ratio · JPEG or WebP"
      />
      */}
    </div>
  );
}

// ── StepRows — the public-facing component ────────────────────────────────────
export function StepRows({ value, onChange }: {
  value: Step[];
  onChange: (next: Step[]) => void;
}) {
  const emit = (next: Step[]) => onChange(next.map((s, i) => ({ ...s, order: i + 1 })));

  return (
    <div className="flex flex-col gap-3">
      {value.map((row, i) => (
        <StepRow
          key={i}
          row={row}
          idx={i}
          canUp={i > 0}
          canDown={i < value.length - 1}
          onSet={patch => emit(value.map((r, j) => j === i ? { ...r, ...patch } : r))}
          onMove={dir => {
            const next = [...value];
            const [r] = next.splice(i, 1);
            next.splice(i + dir, 0, r);
            emit(next);
          }}
          onRemove={() => emit(value.filter((_, j) => j !== i))}
        />
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
