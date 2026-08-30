import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RecipeInputSchema, type RecipeInput } from '@vajeeva/shared';
import { api, type RecipeDoc } from '../api/client';
import { IngredientRows } from '../components/IngredientRows';
import { StepRows, EMPTY_STEP } from '../components/StepRows';
import { HealthFlagRows } from '../components/HealthFlagRows';
import { SourceRows } from '../components/SourceRows';
import { AppPreviewCard } from '../components/AppPreviewCard';
import { ImageGalleryEditor, type GalleryImage } from '../components/ImageGalleryEditor';
import { TagRows, emptyVocab, mergeTagDefaults, type Vocab } from '../components/TagRows';

// ── Stepper config ────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Basic Info',    desc: 'Name, category, yield' },
  { label: 'Ingredients',   desc: 'Grams, ml & cups'      },
  { label: 'Cook Steps',    desc: 'Phase, heat, timer'     },
  { label: 'Health Flags',  desc: 'Condition severity'     },
  { label: 'Sources',       desc: 'Citations'              },
  { label: 'Tags',          desc: 'Discovery & filters'    },
  { label: 'Gallery',       desc: 'Photos'                 },
] as const;

const NEXT_LABELS = [
  'Next: Ingredients →',
  'Next: Cook Steps →',
  'Next: Health Flags →',
  'Next: Sources →',
  'Next: Tags →',
  'Next: Gallery →',
  'Publish Recipe',
];

const EMPTY_RECIPE: RecipeInput = {
  slug: '', nameEn: '', nameTa: '',
  category: 'solid', description: '',
  ingredients: [{ nameEn: '', quantityG: '', quantityMl: '', quantityCup: '', note: '' }],
  steps: [EMPTY_STEP],
  healthFlags: [],
  sources: [],
  yieldStr: '', shelfLife: '',
  status: 'draft',
  type: '', meals: [], mainIngredients: [], methods: [], dietTags: [],
  makeAhead: false, prepAheadNote: '', images: [],
};

// ── Shared input style ────────────────────────────────────────────────────
const INP = 'w-full border border-ink/[0.11] rounded-[8px] px-3 py-2 bg-bone text-[13px] text-ink placeholder:text-ink/35';

export function RecipeEditorPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [form,   setForm]   = useState<RecipeInput | null>(id ? null : EMPTY_RECIPE);
  const [error,  setError]  = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [vocab,  setVocab]  = useState<Vocab>(emptyVocab);
  const [step,   setStep]   = useState(1); // 1-indexed

  useEffect(() => {
    if (!id) return;
    api<RecipeDoc[]>('/api/admin/recipes')
      .then(all => {
        const doc = all.find(r => r._id === id);
        if (!doc) { setError('Recipe not found'); return; }
        const { _id, createdAt, updatedAt, ...input } = doc;
        setForm({ ...EMPTY_RECIPE, ...input });
      })
      .catch(e => setError(e.message));
  }, [id]);

  useEffect(() => {
    api<Vocab>('/api/admin/tags')
      .then(saved => setVocab(mergeTagDefaults(saved)))
      .catch(() => setVocab(mergeTagDefaults(null)));  // fallback to defaults if API is unreachable
  }, []);

  async function save(status: RecipeInput['status']) {
    if (!form) return;
    const cleaned: RecipeInput = {
      ...form, status,
      steps: form.steps.map(s => ({
        ...s,
        stepIngredients: s.stepIngredients.map(x => x.trim()).filter(Boolean),
      })),
    };
    const parsed = RecipeInputSchema.safeParse(cleaned);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(`${first.path.join('.')}: ${first.message}`);
      return;
    }
    setSaving(true); setError(null);
    try {
      if (id) {
        await api(`/api/admin/recipes/${id}`, { method: 'PUT', body: JSON.stringify(parsed.data) });
      } else {
        await api('/api/admin/recipes', { method: 'POST', body: JSON.stringify(parsed.data) });
      }
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return error
      ? <p role="alert" className="p-6 text-clay">{error}</p>
      : <p className="p-6 text-ink/45">Loading…</p>;
  }

  const patch = (p: Partial<RecipeInput>) => setForm(f => f ? { ...f, ...p } : f);

  return (
    <main className="bg-cream p-4 md:p-6">

      {/* ── Top bar ─────────────────────────────── */}
      <header className="flex items-center gap-3 mb-5">
        <Link to="/" className="text-ink/45 text-[13px] hover:text-ink transition-colors shrink-0">
          ← Recipes
        </Link>
        <h1 className="font-serif text-[19px] font-light text-ink tracking-tight flex-1 truncate">
          {id ? 'Edit Recipe' : 'New Recipe'}
        </h1>
        <button type="button" disabled={saving} onClick={() => save('draft')}
          className="shrink-0 border border-ink/[0.11] rounded-[10px] px-3.5 py-2 text-[12.5px] font-medium text-ink/70 disabled:opacity-50 hover:bg-bone transition-colors">
          Save draft
        </button>
        <button type="button" disabled={saving} onClick={() => save('published')}
          className="shrink-0 bg-brand text-white rounded-[10px] px-3.5 py-2 text-[12.5px] font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
          Publish
        </button>
      </header>

      {error && <p role="alert" className="mb-4 text-[13px] text-clay">{error}</p>}

      {/* ── Three-column layout: stepper | form | preview ── */}
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] xl:grid-cols-[160px_1fr_220px] gap-4 items-start">

        {/* ── Stepper ────────────────────────────── */}
        {/* Mobile: horizontal scrolling strip; md+: vertical list */}
        <nav
          aria-label="Editor steps"
          className={[
            // Mobile: horizontal row
            'flex flex-row overflow-x-auto gap-0 md:hidden',
            'bg-bone border border-ink/[0.11] rounded-[14px] p-3 scrollbar-none',
          ].join(' ')}
        >
          {STEPS.map((s, idx) => {
            const n     = idx + 1;
            const state = n < step ? 'done' : n === step ? 'active' : 'todo';
            return (
              <button
                key={n}
                type="button"
                onClick={() => setStep(n)}
                className={[
                  'flex flex-col items-center shrink-0 px-2.5 py-1 min-w-[60px] gap-1',
                ].join(' ')}
              >
                <span className={[
                  'w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10.5px] font-bold',
                  state === 'done'   ? 'bg-brand text-white' :
                  state === 'active' ? 'bg-ink text-white ring-[3px] ring-ink/10' :
                                       'bg-sand text-ink/45 border border-ink/[0.11]',
                ].join(' ')}>
                  {state === 'done' ? '✓' : n}
                </span>
                <span className={[
                  'text-[10px] text-center leading-tight',
                  state === 'active' ? 'font-bold text-ink' :
                  state === 'done'   ? 'text-brand' :
                                       'text-ink/40',
                ].join(' ')}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Desktop: vertical stepper */}
        <nav
          aria-label="Editor steps"
          className="hidden md:block bg-bone border border-ink/[0.11] rounded-[14px] p-3.5 sticky top-4"
        >
          {STEPS.map((s, idx) => {
            const n     = idx + 1;
            const state = n < step ? 'done' : n === step ? 'active' : 'todo';
            const isLast = n === STEPS.length;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setStep(n)}
                className="flex items-start gap-2.5 w-full px-1 py-2.5 relative text-left"
              >
                {/* Connector line */}
                {!isLast && (
                  <div className="absolute left-[16px] top-[33px] w-[2px] h-[calc(100%-10px)] bg-ink/[0.10]" />
                )}
                {/* Circle */}
                <span className={[
                  'w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 relative z-10',
                  state === 'done'   ? 'bg-brand text-white' :
                  state === 'active' ? 'bg-ink text-white ring-[3px] ring-ink/10' :
                                       'bg-sand text-ink/45 border-[1.5px] border-ink/[0.11]',
                ].join(' ')}>
                  {state === 'done' ? '✓' : n}
                </span>
                <span className="pt-0.5">
                  <span className={[
                    'block text-[12px] leading-tight',
                    state === 'active' ? 'font-bold text-ink' :
                    state === 'done'   ? 'font-medium text-brand' :
                                         'text-ink/40',
                  ].join(' ')}>
                    {s.label}
                  </span>
                  {state === 'active' && (
                    <span className="block text-[10.5px] text-ink/45 mt-0.5">{s.desc}</span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── Active form step ───────────────────── */}
        <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(42,37,30,.07)]">

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <h2 className="font-serif text-[16px] font-light text-ink mb-1 tracking-tight">Basic Info</h2>
              <p className="text-[12.5px] text-ink/45 mb-5">Name, category, and key details that identify the recipe.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45">
                  Name (English)
                  <input value={form.nameEn}
                    onChange={e => patch({ nameEn: e.target.value })}
                    placeholder="e.g. Pongal"
                    className={`${INP} mt-1.5 font-serif text-[15px]`} />
                </label>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45">
                  Name (Tamil)
                  <input value={form.nameTa}
                    onChange={e => patch({ nameTa: e.target.value })}
                    placeholder="தமிழ் பெயர்"
                    className={`${INP} mt-1.5 font-serif text-[15px] italic`} />
                </label>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45">
                  Slug
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[12px] text-ink/35 shrink-0">vajeeva.in/r/</span>
                    <input value={form.slug}
                      onChange={e => patch({ slug: e.target.value })}
                      placeholder="pongal"
                      className={`${INP} flex-1`} />
                  </div>
                </label>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45">
                  Category
                  <select value={form.category}
                    onChange={e => patch({ category: e.target.value as RecipeInput['category'] })}
                    className={`${INP} mt-1.5 cursor-pointer`}>
                    <option value="solid">Solid</option>
                    <option value="liquid">Liquid</option>
                    <option value="semi-solid">Semi-solid</option>
                  </select>
                </label>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45">
                  Yield
                  <input value={form.yieldStr}
                    onChange={e => patch({ yieldStr: e.target.value })}
                    placeholder="2 servings"
                    className={`${INP} mt-1.5`} />
                </label>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45">
                  Shelf life
                  <input value={form.shelfLife}
                    onChange={e => patch({ shelfLife: e.target.value })}
                    placeholder="1 day refrigerated"
                    className={`${INP} mt-1.5`} />
                </label>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/45 sm:col-span-2">
                  Description
                  <textarea value={form.description}
                    onChange={e => patch({ description: e.target.value })}
                    placeholder="A brief description shown to app users…"
                    rows={3}
                    className={`${INP} mt-1.5 resize-y`} />
                </label>
              </div>
            </>
          )}

          {/* Step 2: Ingredients */}
          {step === 2 && (
            <>
              <h2 className="font-serif text-[16px] font-light text-ink mb-1 tracking-tight">Ingredients</h2>
              <p className="text-[12.5px] text-ink/45 mb-5">
                List each ingredient with its gram weight (canonical) and cup/ml measurement (display).
              </p>
              <div className="overflow-x-auto -mx-1">
                <IngredientRows
                  value={form.ingredients}
                  onChange={ingredients => patch({ ingredients })}
                />
              </div>
            </>
          )}

          {/* Step 3: Cook Steps */}
          {step === 3 && (
            <>
              <h2 className="font-serif text-[16px] font-light text-ink mb-1 tracking-tight">Cook Steps</h2>
              <p className="text-[12.5px] text-ink/45 mb-5">
                Document each stage with phase, heat level, and timing context.
              </p>
              <StepRows value={form.steps} onChange={steps => patch({ steps })} />
            </>
          )}

          {/* Step 4: Health Flags */}
          {step === 4 && (
            <>
              <h2 className="font-serif text-[16px] font-light text-ink mb-1 tracking-tight">Health Flags</h2>
              <p className="text-[12.5px] text-ink/45 mb-5">
                Set per-condition severity for this recipe. Users see a personalised Safe / Caution / Avoid label.
              </p>
              <HealthFlagRows value={form.healthFlags} onChange={healthFlags => patch({ healthFlags })} />
            </>
          )}

          {/* Step 5: Sources */}
          {step === 5 && (
            <>
              <h2 className="font-serif text-[16px] font-light text-ink mb-1 tracking-tight">Sources</h2>
              <p className="text-[12.5px] text-ink/45 mb-5">Cite the texts or research papers this recipe draws from.</p>
              <SourceRows value={form.sources} onChange={sources => patch({ sources })} />
            </>
          )}

          {/* Step 6: Tags */}
          {step === 6 && (
            <>
              <h2 className="font-serif text-[16px] font-light text-ink mb-1 tracking-tight">Tags</h2>
              <p className="text-[12.5px] text-ink/45 mb-5">Help users discover this recipe through filters and search.</p>
              <TagRows
                value={{
                  type:             form.type ?? '',
                  meals:            form.meals ?? [],
                  mainIngredients:  form.mainIngredients ?? [],
                  methods:          form.methods ?? [],
                  dietTags:         form.dietTags ?? [],
                  makeAhead:        form.makeAhead ?? false,
                  prepAheadNote:    form.prepAheadNote ?? '',
                  totalTimeMin:     form.totalTimeMin,
                }}
                vocab={vocab}
                onChange={p => patch(p)}
              />
            </>
          )}

          {/* Step 7: Gallery */}
          {step === 7 && (
            <>
              <h2 className="font-serif text-[16px] font-light text-ink mb-1 tracking-tight">Gallery</h2>
              <p className="text-[12.5px] text-ink/45 mb-5">
                Upload photos for this recipe. First image becomes the card thumbnail.
              </p>
              <ImageGalleryEditor
                context="hero"
                value={(form.images ?? []) as GalleryImage[]}
                onChange={images => patch({ images })}
                hint="1200 × 800 px · 3:2 ratio · JPEG or WebP"
              />
            </>
          )}

          {/* ── Step navigation ───────────────────── */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-ink/[0.08]">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className={[
                'text-[12.5px] font-medium text-ink/55 px-3 py-1.5 rounded-[8px] hover:bg-sand transition-colors',
                step === 1 ? 'invisible' : '',
              ].join(' ')}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              <button type="button" disabled={saving} onClick={() => save('draft')}
                className="border border-ink/[0.11] rounded-[10px] px-3.5 py-2 text-[12px] font-medium text-ink/70 disabled:opacity-50 hover:bg-sand transition-colors">
                Save Draft
              </button>
              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                  className="bg-ink text-cream rounded-[10px] px-4 py-2 text-[12px] font-semibold hover:opacity-90 transition-opacity"
                >
                  {NEXT_LABELS[step - 1]}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save('published')}
                  className="bg-brand text-white rounded-[10px] px-4 py-2 text-[12px] font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {saving ? 'Publishing…' : 'Publish Recipe'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── App preview (xl+ only) ─────────────── */}
        <div className="hidden xl:block sticky top-4">
          <AppPreviewCard recipe={form} />
        </div>
      </div>
    </main>
  );
}
