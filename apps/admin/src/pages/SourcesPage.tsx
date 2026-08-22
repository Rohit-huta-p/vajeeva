import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Source {
  id: string;
  name: string;
  type: string;
  recipeCount: number;
  // Narrative fields
  period?: string;
  author?: string;
  genre?: string;
  chapter?: string;
  about?: string;
  citationRef?: string;
  citationNote?: string;
  whyItMatters?: string;
}

// Fallback data shown while the API endpoint is not yet implemented
const PLACEHOLDER_SOURCES: Source[] = [
  { id: '1', name: 'Samayamulu', type: 'Classical text', recipeCount: 8 },
  { id: '2', name: 'Arogya Padasastra', type: 'Classical text', recipeCount: 5 },
  { id: '3', name: 'ICMR-NIN 2024', type: 'Modern reference', recipeCount: 12 },
];

interface SourceModalProps {
  source: Source | null;
  onSave: (data: Partial<Source>) => Promise<void>;
  onClose: () => void;
}

/** Small helper for labelled inputs to reduce repetition in the modal. */
function Field({ id, label, value, onChange, multiline }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; multiline?: boolean;
}) {
  const cls = 'w-full border border-sand rounded-lg px-3 py-2 text-sm mt-1 bg-white text-ink';
  return (
    <div>
      <label htmlFor={id} className="text-xs font-mono uppercase tracking-wider text-ink/60">{label}</label>
      {multiline
        ? <textarea id={id} className={cls} rows={3} value={value} onChange={e => onChange(e.target.value)} />
        : <input id={id} className={cls} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

function SourceModal({ source, onSave, onClose }: SourceModalProps) {
  const [name,         setName]         = useState(source?.name         ?? '');
  const [type,         setType]         = useState(source?.type         ?? '');
  const [period,       setPeriod]       = useState(source?.period       ?? '');
  const [author,       setAuthor]       = useState(source?.author       ?? '');
  const [genre,        setGenre]        = useState(source?.genre        ?? '');
  const [chapter,      setChapter]      = useState(source?.chapter      ?? '');
  const [about,        setAbout]        = useState(source?.about        ?? '');
  const [citationRef,  setCitationRef]  = useState(source?.citationRef  ?? '');
  const [citationNote, setCitationNote] = useState(source?.citationNote ?? '');
  const [whyItMatters, setWhyItMatters] = useState(source?.whyItMatters ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      await onSave({ name, type, period, author, genre, chapter, about, citationRef, citationNote, whyItMatters });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-cream rounded-xl shadow-xl p-6 w-[480px] max-w-full">
        <h2 className="font-serif text-lg font-bold text-ink mb-4">
          {source ? 'Edit Source' : 'New Source'}
        </h2>
        <div className="flex flex-col gap-3 mb-4">
          <Field id="source-name"    label="Name"           value={name}         onChange={setName} />
          <Field id="source-type"    label="Type"           value={type}         onChange={setType} />
          <hr className="border-sand" />
          <p className="text-xs text-ink/40 font-mono uppercase tracking-wider">Narrative (optional)</p>
          <Field id="source-period"       label="Period"          value={period}       onChange={setPeriod} />
          <Field id="source-author"       label="Author"          value={author}       onChange={setAuthor} />
          <Field id="source-genre"        label="Genre"           value={genre}        onChange={setGenre} />
          <Field id="source-chapter"      label="Chapter"         value={chapter}      onChange={setChapter} />
          <Field id="source-about"        label="About"           value={about}        onChange={setAbout}        multiline />
          <Field id="source-citationRef"  label="Citation Ref"    value={citationRef}  onChange={setCitationRef} />
          <Field id="source-citationNote" label="Citation Note"   value={citationNote} onChange={setCitationNote} multiline />
          <Field id="source-why"          label="Why It Matters"  value={whyItMatters} onChange={setWhyItMatters} multiline />
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

  async function handleSave(data: Partial<Source>) {
    if (editing) {
      const updated = await api<Source>(`/api/admin/sources/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setSources(ss => ss.map(s => s.id === editing.id ? updated : s));
    } else {
      const created = await api<Source>('/api/admin/sources', {
        method: 'POST',
        body: JSON.stringify(data),
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
