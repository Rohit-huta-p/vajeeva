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

const EMPTY_RECIPE: RecipeInput = {
  slug: '',
  nameEn: '',
  nameTa: '',
  category: 'solid',
  description: '',
  ingredients: [{ nameEn: '', quantityG: '', quantityCup: '' }],
  steps: [EMPTY_STEP],
  healthFlags: [],
  sources: [],
  yieldStr: '',
  shelfLife: '',
  status: 'draft',
  images: [],
};

export function RecipeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<RecipeInput | null>(id ? null : EMPTY_RECIPE);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<RecipeDoc[]>('/api/admin/recipes')
      .then(all => {
        const doc = all.find(r => r._id === id);
        if (!doc) {
          setError('Recipe not found');
          return;
        }
        const { _id, createdAt, updatedAt, ...input } = doc;
        setForm(input);
      })
      .catch(e => setError(e.message));
  }, [id]);

  async function save(status: RecipeInput['status']) {
    if (!form) return;
    const cleaned: RecipeInput = {
      ...form,
      status,
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
    setSaving(true);
    setError(null);
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
      : <p className="p-6 text-ink/55">Loading…</p>;
  }

  return (
    <main className="min-h-screen bg-cream p-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-ink/55 text-sm">← All Recipes</Link>
        <h1 className="font-serif text-xl font-semibold text-ink flex-1">
          {id ? 'Edit Recipe' : 'New Recipe'}
        </h1>
        <button
          type="button"
          disabled={saving}
          onClick={() => save('draft')}
          className="border border-ink/20 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save('published')}
          className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Publish
        </button>
      </header>

      {error && <p role="alert" className="mb-4 text-clay text-sm">{error}</p>}

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-5 lg:items-start">
        <div>
          <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
            <legend className="text-xs font-bold uppercase text-ink/55 px-1">Basic Info</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold uppercase text-ink/55">
                Name (English)
                <input
                  value={form.nameEn}
                  onChange={e => setForm({ ...form, nameEn: e.target.value })}
                  className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone font-serif text-base normal-case"
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-ink/55">
                Name (Tamil)
                <input
                  value={form.nameTa}
                  onChange={e => setForm({ ...form, nameTa: e.target.value })}
                  className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone font-serif text-base normal-case"
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-ink/55">
                Slug
                <input
                  value={form.slug}
                  placeholder="coconut-burfi"
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-ink/55">
                Category
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as RecipeInput['category'] })}
                  className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
                >
                  <option value="solid">Solid</option>
                  <option value="liquid">Liquid</option>
                  <option value="semi-solid">Semi-solid</option>
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase text-ink/55">
                Yield
                <input
                  value={form.yieldStr}
                  placeholder="3–4 laddoos"
                  onChange={e => setForm({ ...form, yieldStr: e.target.value })}
                  className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-ink/55">
                Shelf life
                <input
                  value={form.shelfLife}
                  placeholder="5–7 days"
                  onChange={e => setForm({ ...form, shelfLife: e.target.value })}
                  className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
                />
              </label>
            </div>
            <label className="block text-xs font-semibold uppercase text-ink/55 mt-3">
              Description
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
              />
            </label>
          </fieldset>

          <IngredientRows value={form.ingredients} onChange={ingredients => setForm({ ...form, ingredients })} />
          <StepRows value={form.steps} onChange={steps => setForm({ ...form, steps })} />
          <HealthFlagRows value={form.healthFlags} onChange={healthFlags => setForm({ ...form, healthFlags })} />
          <SourceRows value={form.sources} onChange={sources => setForm({ ...form, sources })} />

          {/* Hero Gallery */}
          <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
            <legend className="text-xs font-bold uppercase text-ink/55 px-1">Hero Gallery</legend>
            <p className="text-xs text-ink/50 mb-2">Upload photos for the recipe card and detail view. First image is the card thumbnail.</p>
            <ImageGalleryEditor
              context="hero"
              value={(form.images ?? []) as GalleryImage[]}
              onChange={images => setForm({ ...form, images })}
              hint="1200 × 800 px · 3:2 ratio · JPEG or WebP"
            />
          </fieldset>
        </div>
        <div className="lg:sticky lg:top-6 mt-4 lg:mt-0">
          <AppPreviewCard recipe={form} />
        </div>
      </div>
    </main>
  );
}
