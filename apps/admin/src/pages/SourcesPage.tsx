import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Source {
  id: string;
  name: string;
  type: string;
  recipeCount: number;
}

// Fallback data shown while the API endpoint is not yet implemented
const PLACEHOLDER_SOURCES: Source[] = [
  { id: '1', name: 'Samayamulu', type: 'Classical text', recipeCount: 8 },
  { id: '2', name: 'Arogya Padasastra', type: 'Classical text', recipeCount: 5 },
  { id: '3', name: 'ICMR-NIN 2024', type: 'Modern reference', recipeCount: 12 },
];

interface SourceModalProps {
  source: Source | null;
  onSave: (name: string, type: string) => Promise<void>;
  onClose: () => void;
}

function SourceModal({ source, onSave, onClose }: SourceModalProps) {
  const [name, setName] = useState(source?.name ?? '');
  const [type, setType] = useState(source?.type ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      await onSave(name, type);
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
          {source ? 'Edit Source' : 'New Source'}
        </h2>
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label htmlFor="source-name" className="text-xs font-mono uppercase tracking-wider text-ink/60">Name</label>
            <input
              id="source-name"
              className="w-full border border-sand rounded-lg px-3 py-2 text-sm mt-1 bg-white text-ink"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="source-type" className="text-xs font-mono uppercase tracking-wider text-ink/60">Type</label>
            <input
              id="source-type"
              className="w-full border border-sand rounded-lg px-3 py-2 text-sm mt-1 bg-white text-ink"
              value={type}
              onChange={e => setType(e.target.value)}
            />
          </div>
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

export function SourcesPage() {
  const [sources, setSources] = useState<Source[]>(PLACEHOLDER_SOURCES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Attempt to load from API; fall back to placeholder on 404
  useEffect(() => {
    api<Source[]>('/api/admin/sources')
      .then(setSources)
      .catch(() => { /* endpoint not yet implemented — placeholder stays */ });
  }, []);

  async function handleSave(name: string, type: string) {
    if (editing) {
      const updated = await api<Source>(`/api/admin/sources/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, type }),
      });
      setSources(ss => ss.map(s => s.id === editing.id ? updated : s));
    } else {
      const created = await api<Source>('/api/admin/sources', {
        method: 'POST',
        body: JSON.stringify({ name, type }),
      });
      setSources(ss => [...ss, created]);
    }
  }

  async function handleDelete(src: Source) {
    setError(null);
    try {
      await api(`/api/admin/sources/${src.id}`, { method: 'DELETE' });
      setSources(ss => ss.filter(s => s.id !== src.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-ink">Sources</h1>
        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-brand text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          + New Source
        </button>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-clay">{error}</p>}

      <div className="border border-sand rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_80px_130px] gap-x-4 bg-bone px-4 py-3">
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider">Name</span>
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider">Type</span>
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider text-right">Recipes</span>
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider text-right">Actions</span>
        </div>
        {sources.map((src, i) => (
          <div
            key={src.id}
            className={`grid grid-cols-[2fr_1fr_80px_130px] gap-x-4 px-4 py-3 items-center ${i % 2 === 1 ? 'bg-white' : ''} hover:bg-bone/50`}
          >
            <span className="text-sm font-medium text-ink">{src.name}</span>
            <span className="text-sm text-ink/70">{src.type}</span>
            <span className="text-sm text-ink/50 text-right">{src.recipeCount}</span>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditing(src); setModalOpen(true); }}
                className="text-xs px-3 py-1 border border-sand rounded text-ink/70 hover:border-brand"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(src)}
                className="text-xs px-3 py-1 border border-sand rounded text-clay hover:bg-amber-bg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <SourceModal
          source={editing}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
