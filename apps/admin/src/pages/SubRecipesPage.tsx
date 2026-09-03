import { useEffect, useState } from 'react';
import { api } from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Ingredient { name: string; qty: string }

interface SubRecipe {
  id:          string;
  name:        string;
  slug:        string;
  usedIn:      number;
  ingredients: Ingredient[];
  note:        string;
  method:      string;
}

const EMPTY_SUBRECIPE: Omit<SubRecipe, 'id' | 'slug' | 'usedIn'> = {
  name: '', ingredients: [], note: '', method: '',
};

// ── Placeholder (shown until the API responds) ────────────────────────────────
const PLACEHOLDER: SubRecipe[] = [
  { id: '1',  name: 'Tamarind extract',    slug: '', usedIn: 9,  ingredients: [], note: '', method: '' },
  { id: '2',  name: 'Coconut paste',       slug: '', usedIn: 11, ingredients: [], note: '', method: '' },
  { id: '3',  name: 'Spice powder blend',  slug: '', usedIn: 4,  ingredients: [], note: '', method: '' },
  { id: '4',  name: 'Curry leaf tempering',slug: '', usedIn: 7,  ingredients: [], note: '', method: '' },
  { id: '5',  name: 'Ghee base',           slug: '', usedIn: 8,  ingredients: [], note: '', method: '' },
  { id: '6',  name: 'Rice flour batter',   slug: '', usedIn: 5,  ingredients: [], note: '', method: '' },
  { id: '7',  name: 'Green chutney',       slug: '', usedIn: 3,  ingredients: [], note: '', method: '' },
  { id: '8',  name: 'Jaggery syrup',       slug: '', usedIn: 6,  ingredients: [], note: '', method: '' },
  { id: '9',  name: 'Sesame powder',       slug: '', usedIn: 2,  ingredients: [], note: '', method: '' },
  { id: '10', name: 'Fenugreek paste',     slug: '', usedIn: 3,  ingredients: [], note: '', method: '' },
  { id: '11', name: 'Mustard tempering',   slug: '', usedIn: 8,  ingredients: [], note: '', method: '' },
  { id: '12', name: 'Pepper-cumin water',  slug: '', usedIn: 1,  ingredients: [], note: '', method: '' },
];

// ── Usage tier helpers ────────────────────────────────────────────────────────
function tier(n: number): 'high' | 'mid' | 'low' {
  return n >= 7 ? 'high' : n >= 3 ? 'mid' : 'low';
}
const CHIP_CLS: Record<string, string> = {
  high: 'bg-brand-bg text-brand border-brand/[0.22]',
  mid:  'bg-amber-bg text-amber border-amber/[0.22]',
  low:  'bg-bone text-ink/55 border-ink/[0.11]',
};

// ── Shared input style ────────────────────────────────────────────────────────
const INP = 'w-full border border-ink/[0.11] rounded-[8px] px-3 py-2 bg-cream text-[13px] text-ink placeholder:text-ink/35 focus:outline-none focus:ring-1 focus:ring-brand/30';
const LBL = 'block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 mb-1';

// ── Full editor modal ─────────────────────────────────────────────────────────
interface ModalProps {
  subRecipe: SubRecipe | null;   // null = new
  onSave:  (data: Omit<SubRecipe, 'id' | 'slug' | 'usedIn'>) => Promise<void>;
  onClose: () => void;
}

function SubRecipeModal({ subRecipe, onSave, onClose }: ModalProps) {
  const [name,        setName]        = useState(subRecipe?.name        ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(subRecipe?.ingredients ?? []);
  const [method,      setMethod]      = useState(subRecipe?.method      ?? '');
  const [note,        setNote]        = useState(subRecipe?.note        ?? '');
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState<string | null>(null);

  function patchIng(i: number, p: Partial<Ingredient>) {
    setIngredients(prev => prev.map((x, j) => j === i ? { ...x, ...p } : x));
  }

  async function handleSave() {
    if (!name.trim()) { setErr('Name is required'); return; }
    setSaving(true); setErr(null);
    try {
      await onSave({
        name: name.trim(),
        ingredients: ingredients.filter(i => i.name.trim()),
        method: method.trim(),
        note: note.trim(),
      });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-ink/40 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-cream rounded-[16px] shadow-2xl w-full max-w-[520px] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink/[0.08]">
          <h2 className="font-serif text-[18px] font-light text-ink">
            {subRecipe ? 'Edit Sub-recipe' : 'New Sub-recipe'}
          </h2>
          <button type="button" onClick={onClose}
            className="text-ink/40 hover:text-ink text-[20px] leading-none transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Name */}
          <div>
            <label htmlFor="sr-name" className={LBL}>Name</label>
            <input
              id="sr-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tamarind extract"
              className={INP}
              autoFocus
            />
          </div>

          {/* Ingredients */}
          <div>
            <p className={LBL}>Ingredients</p>
            <div className="flex flex-col gap-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    aria-label={`Ingredient ${i + 1} name`}
                    value={ing.name}
                    onChange={e => patchIng(i, { name: e.target.value })}
                    placeholder="Ingredient name"
                    className={`${INP} flex-[2]`}
                  />
                  <input
                    aria-label={`Ingredient ${i + 1} quantity`}
                    value={ing.qty}
                    onChange={e => patchIng(i, { qty: e.target.value })}
                    placeholder="Qty (e.g. 2 tbsp)"
                    className={`${INP} flex-1`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ingredient ${i + 1}`}
                    onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))}
                    className="text-clay/60 hover:text-clay text-[18px] leading-none px-1 transition-colors shrink-0"
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setIngredients(prev => [...prev, { name: '', qty: '' }])}
                className="border border-dashed border-ink/[0.18] rounded-[8px] w-full py-2 text-[12.5px] text-ink/45 hover:border-brand hover:text-brand transition-colors"
              >
                + Add ingredient
              </button>
            </div>
          </div>

          {/* Method */}
          <div>
            <label htmlFor="sr-method" className={LBL}>Method</label>
            <textarea
              id="sr-method"
              value={method}
              onChange={e => setMethod(e.target.value)}
              placeholder="Step-by-step preparation…"
              rows={4}
              className={`${INP} resize-y`}
            />
          </div>

          {/* Note */}
          <div>
            <label htmlFor="sr-note" className={LBL}>Note</label>
            <textarea
              id="sr-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any tips, variations, or storage notes…"
              rows={2}
              className={`${INP} resize-y`}
            />
          </div>

          {err && <p role="alert" className="text-[12px] text-clay">{err}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-ink/[0.08]">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-[13px] text-ink/55 hover:bg-sand rounded-[8px] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-[13px] font-semibold bg-brand text-white rounded-[10px] disabled:opacity-50 hover:opacity-90 transition-opacity">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SubRecipesPage() {
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>(PLACEHOLDER);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<SubRecipe | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    api<SubRecipe[]>('/api/admin/subrecipes')
      .then(setSubRecipes)
      .catch(() => { /* placeholder stays if endpoint unreachable */ });
  }, []);

  async function handleSave(data: Omit<SubRecipe, 'id' | 'slug' | 'usedIn'>) {
    if (editing) {
      const updated = await api<SubRecipe>(`/api/admin/subrecipes/${editing.id}`, {
        method: 'PUT', body: JSON.stringify(data),
      });
      setSubRecipes(ss => ss.map(s => s.id === editing.id ? updated : s));
    } else {
      const created = await api<SubRecipe>('/api/admin/subrecipes', {
        method: 'POST', body: JSON.stringify(data),
      });
      setSubRecipes(ss => [...ss, created]);
    }
  }

  async function handleDelete(sr: SubRecipe) {
    setError(null);
    try {
      await api(`/api/admin/subrecipes/${sr.id}`, { method: 'DELETE' });
      setSubRecipes(ss => ss.filter(s => s.id !== sr.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openNew() { setEditing(null); setModalOpen(true); }
  function openEdit(sr: SubRecipe) { setEditing(sr); setModalOpen(true); }

  return (
    <div className="p-5 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-[22px] font-light text-ink tracking-tight">Sub-recipes</h1>
          <p className="text-[12.5px] text-ink/45 mt-0.5">
            Reusable preparations referenced across multiple recipes.
          </p>
        </div>
        <button type="button" onClick={openNew}
          className="bg-brand text-white text-[12.5px] font-semibold px-4 py-2 rounded-[10px] hover:opacity-90 transition-opacity">
          + New
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 text-[11.5px] text-ink/45">
        <span>Usage:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" />High (7+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber inline-block" />Mid (3–6)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sand border border-ink/20 inline-block" />Low (1–2)
        </span>
      </div>

      {error && <p role="alert" className="mb-4 text-[13px] text-clay">{error}</p>}

      {/* Chip cloud */}
      <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-5 min-h-[160px] flex flex-wrap gap-2.5 content-start">
        {subRecipes.map(sr => {
          const t = tier(sr.usedIn);
          return (
            <div
              key={sr.id}
              role="button"
              tabIndex={0}
              aria-label={`Edit ${sr.name}`}
              onClick={() => openEdit(sr)}
              onKeyDown={e => e.key === 'Enter' && openEdit(sr)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium border-[1.5px] cursor-pointer hover:shadow-[0_4px_14px_rgba(42,37,30,.10)] transition-all group ${CHIP_CLS[t]}`}
            >
              <span>{sr.name}</span>
              <span className="text-[9.5px] font-[800] px-1.5 py-0.5 rounded-full bg-black/[0.09] leading-tight tabular-nums">
                {sr.usedIn}
              </span>
              <button
                type="button"
                aria-label={`Delete ${sr.name}`}
                onClick={e => { e.stopPropagation(); handleDelete(sr); }}
                className="ml-0.5 opacity-0 group-hover:opacity-100 text-[13px] font-bold leading-none hover:text-clay transition-all"
              >×</button>
            </div>
          );
        })}

        {subRecipes.length === 0 && (
          <p className="text-[13px] text-ink/40 self-center mx-auto">No sub-recipes yet.</p>
        )}
      </div>

      {modalOpen && (
        <SubRecipeModal
          subRecipe={editing}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
