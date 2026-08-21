import { useState } from 'react';

interface Source {
  id: string;
  name: string;
  type: string;
  recipeCount: number;
}

// Placeholder data — persistence lands in the wiring wave (WIRE-ADM)
const PLACEHOLDER_SOURCES: Source[] = [
  { id: '1', name: 'Samayamulu', type: 'Classical text', recipeCount: 8 },
  { id: '2', name: 'Arogya Padasastra', type: 'Classical text', recipeCount: 5 },
  { id: '3', name: 'ICMR-NIN 2024', type: 'Modern reference', recipeCount: 12 },
];

interface SourceModalProps {
  source: Source | null;
  onClose: () => void;
}

function SourceModal({ source, onClose }: SourceModalProps) {
  const [name, setName] = useState(source?.name ?? '');
  const [type, setType] = useState(source?.type ?? '');
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-cream rounded-xl shadow-xl p-6 w-[420px]">
        <h2 className="font-serif text-lg font-bold text-ink mb-4">
          {source ? 'Edit Source' : 'New Source'}
        </h2>
        <div className="flex flex-col gap-3 mb-6">
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
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-ink/60">Cancel</button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold bg-brand text-white rounded-lg">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function SourcesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);

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

      <div className="border border-sand rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_80px_110px] bg-bone px-4 py-3">
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider">Name</span>
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider">Type</span>
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider text-right">Recipes</span>
          <span className="text-xs font-mono text-ink/50 uppercase tracking-wider text-right">Actions</span>
        </div>
        {PLACEHOLDER_SOURCES.map((src, i) => (
          <div
            key={src.id}
            className={`grid grid-cols-[2fr_1fr_80px_110px] px-4 py-3 items-center ${i % 2 === 1 ? 'bg-white' : ''} hover:bg-bone/50`}
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
              <button type="button" className="text-xs px-3 py-1 border border-sand rounded text-clay hover:bg-amber-bg">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <SourceModal source={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
