import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface SubRecipe {
  id: string;
  name: string;
  usedIn: number;
}

// Fallback data shown while /api/admin/subrecipes endpoint is not yet implemented
const PLACEHOLDER_SUBRECIPES: SubRecipe[] = [
  { id: '1', name: 'Tamarind extract', usedIn: 6 },
  { id: '2', name: 'Coconut paste', usedIn: 9 },
  { id: '3', name: 'Spice powder blend', usedIn: 4 },
];

interface SubRecipeModalProps {
  subRecipe: SubRecipe | null;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}

function SubRecipeModal({ subRecipe, onSave, onClose }: SubRecipeModalProps) {
  const [name, setName] = useState(subRecipe?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      await onSave(name);
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-cream rounded-xl shadow-xl p-6 w-[420px]">
        <h2 className="font-serif text-lg font-bold text-ink mb-4">
          {subRecipe ? 'Edit Sub-recipe' : 'New Sub-recipe'}
        </h2>
        <div className="mb-4">
          <label htmlFor="subrecipe-name" className="text-xs font-mono uppercase tracking-wider text-ink/60">Name</label>
          <input
            id="subrecipe-name"
            className="w-full border border-sand rounded-lg px-3 py-2 text-sm mt-1 bg-white text-ink"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        {err && <p role="alert" className="text-xs text-clay mb-3">{err}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink/60">Cancel</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-bold bg-brand text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SubRecipesPage() {
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>(PLACEHOLDER_SUBRECIPES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Attempt to load from API; fall back to placeholder on 404
  useEffect(() => {
    api<SubRecipe[]>('/api/admin/subrecipes')
      .then(setSubRecipes)
      .catch(() => { /* endpoint not yet implemented — placeholder stays */ });
  }, []);

  async function handleSave(name: string) {
    if (editing) {
      const updated = await api<SubRecipe>(`/api/admin/subrecipes/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      setSubRecipes(ss => ss.map(s => s.id === editing.id ? updated : s));
    } else {
      const created = await api<SubRecipe>('/api/admin/subrecipes', {
        method: 'POST',
        body: JSON.stringify({ name }),
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-ink">Sub-recipes</h1>
        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-brand text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          + New Sub-recipe
        </button>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-clay">{error}</p>}

      <div className="border border-sand rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_130px] gap-x-4 bg-bone px-4 py-3">
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider">Name</span>
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider">Used In</span>
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider text-right">Actions</span>
        </div>
        {subRecipes.map((sr, i) => (
          <div
            key={sr.id}
            className={`grid grid-cols-[2fr_1fr_130px] gap-x-4 px-4 py-3 items-center ${i % 2 === 1 ? 'bg-white' : ''} hover:bg-bone/50`}
          >
            <span className="text-sm font-medium text-ink">{sr.name}</span>
            <span className="text-sm text-ink/70">{sr.usedIn} recipes</span>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditing(sr); setModalOpen(true); }}
                className="text-xs px-3 py-1 border border-sand rounded text-ink/70 hover:border-brand"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(sr)}
                className="text-xs px-3 py-1 border border-sand rounded text-clay hover:bg-amber-bg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
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
