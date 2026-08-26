import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface SubRecipe {
  id:     string;
  name:   string;
  usedIn: number;
}

const PLACEHOLDER_SUBRECIPES: SubRecipe[] = [
  { id: '1',  name: 'Tamarind extract',       usedIn: 9 },
  { id: '2',  name: 'Coconut paste',           usedIn: 11 },
  { id: '3',  name: 'Spice powder blend',      usedIn: 4 },
  { id: '4',  name: 'Curry leaf tempering',    usedIn: 7 },
  { id: '5',  name: 'Ghee base',               usedIn: 8 },
  { id: '6',  name: 'Rice flour batter',       usedIn: 5 },
  { id: '7',  name: 'Green chutney',           usedIn: 3 },
  { id: '8',  name: 'Jaggery syrup',           usedIn: 6 },
  { id: '9',  name: 'Sesame powder',           usedIn: 2 },
  { id: '10', name: 'Fenugreek paste',         usedIn: 3 },
  { id: '11', name: 'Mustard tempering',       usedIn: 8 },
  { id: '12', name: 'Pepper-cumin water',      usedIn: 1 },
];

// Usage tiers
function tier(usedIn: number): 'high' | 'mid' | 'low' {
  if (usedIn >= 7) return 'high';
  if (usedIn >= 3) return 'mid';
  return 'low';
}

const CHIP_CLS: Record<string, string> = {
  high: 'bg-brand-bg text-brand border-brand/[0.22]',
  mid:  'bg-amber-bg text-amber border-amber/[0.22]',
  low:  'bg-bone text-ink/55 border-ink/[0.11]',
};

interface SubRecipeModalProps {
  subRecipe: SubRecipe | null;
  onSave:    (name: string) => Promise<void>;
  onClose:   () => void;
}

function SubRecipeModal({ subRecipe, onSave, onClose }: SubRecipeModalProps) {
  const [name,   setName]   = useState(subRecipe?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  async function handleSave() {
    setSaving(true); setErr(null);
    try { await onSave(name); onClose(); }
    catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-4">
      <div className="bg-cream rounded-[16px] shadow-2xl p-6 w-full max-w-[400px]">
        <h2 className="font-serif text-[18px] font-light text-ink mb-4">
          {subRecipe ? 'Edit Sub-recipe' : 'New Sub-recipe'}
        </h2>
        <div className="mb-4">
          <label htmlFor="subrecipe-name"
            className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45">Name</label>
          <input
            id="subrecipe-name"
            className="w-full border border-ink/[0.11] rounded-[8px] px-3 py-2 text-[13px] mt-1 bg-cream text-ink"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        {err && <p role="alert" className="text-[12px] text-clay mb-3">{err}</p>}
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-[13px] text-ink/55 hover:bg-sand rounded-[8px] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-[13px] font-semibold bg-brand text-white rounded-[10px] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SubRecipesPage() {
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>(PLACEHOLDER_SUBRECIPES);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<SubRecipe | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    api<SubRecipe[]>('/api/admin/subrecipes')
      .then(setSubRecipes)
      .catch(() => { /* endpoint not yet implemented — placeholder stays */ });
  }, []);

  async function handleSave(name: string) {
    if (editing) {
      const updated = await api<SubRecipe>(`/api/admin/subrecipes/${editing.id}`, {
        method: 'PUT', body: JSON.stringify({ name }),
      });
      setSubRecipes(ss => ss.map(s => s.id === editing.id ? updated : s));
    } else {
      const created = await api<SubRecipe>('/api/admin/subrecipes', {
        method: 'POST', body: JSON.stringify({ name }),
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

  return (
    <div className="p-5 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-[22px] font-light text-ink tracking-tight">Sub-recipes</h1>
          <p className="text-[12.5px] text-ink/45 mt-0.5">
            Reusable preparations referenced across multiple recipes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-brand text-white text-[12.5px] font-semibold px-4 py-2 rounded-[10px] hover:opacity-90 transition-opacity"
        >
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
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium border-[1.5px] cursor-pointer hover:shadow-[0_4px_14px_rgba(42,37,30,.10)] transition-all group ${CHIP_CLS[t]}`}
              onClick={() => { setEditing(sr); setModalOpen(true); }}
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
              >
                ×
              </button>
            </div>
          );
        })}

        {subRecipes.length === 0 && (
          <p className="text-[13px] text-ink/40 self-center mx-auto">No sub-recipes yet. Add the first one.</p>
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
