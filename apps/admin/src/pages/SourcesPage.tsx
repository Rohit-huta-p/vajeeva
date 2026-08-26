import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Source {
  id:            string;
  name:          string;
  type:          string;
  recipeCount:   number;
  period?:       string;
  author?:       string;
  genre?:        string;
  chapter?:      string;
  about?:        string;
  citationRef?:  string;
  citationNote?: string;
  whyItMatters?: string;
}

const PLACEHOLDER_SOURCES: Source[] = [
  {
    id: '1', name: 'Charaka Samhita', type: 'classical',
    period: '200 BCE', author: 'Charaka', genre: 'Ayurvedic medical text',
    about: 'Foundational Ayurvedic text covering diet, medicine, and lifestyle.',
    recipeCount: 3,
  },
  {
    id: '2', name: 'Manasollasa', type: 'classical',
    period: '12th century', author: 'Someshvara III', genre: 'Encyclopaedia',
    about: 'Royal Kannada encyclopaedia covering arts, cuisine, and governance.',
    recipeCount: 5,
  },
  {
    id: '3', name: 'Samayamulu', type: 'classical',
    period: '15th century', author: 'Unknown', genre: 'Culinary text',
    about: 'Telugu culinary text documenting traditional cooking practices.',
    recipeCount: 8,
  },
  {
    id: '4', name: 'ICMR-NIN 2024', type: 'modern',
    period: '2024', author: 'ICMR', genre: 'Nutritional reference',
    about: 'Indian Council of Medical Research dietary guidelines.',
    recipeCount: 12,
  },
  {
    id: '5', name: 'Arogya Padasastra', type: 'modern',
    period: '1987', author: 'Various', genre: 'Modern reference',
    about: 'Compilation of traditional South Indian health recipes.',
    recipeCount: 5,
  },
];

// Source type config
const TYPE_CONFIG: Record<string, { label: string; badgeCls: string; borderCls: string }> = {
  classical: {
    label:     'Classical',
    badgeCls:  'bg-amber-bg text-amber',
    borderCls: 'border-amber/[0.16]',
  },
  modern: {
    label:     'Modern',
    badgeCls:  'bg-brand-bg text-brand',
    borderCls: 'border-brand/[0.16]',
  },
  research: {
    label:     'Research',
    badgeCls:  'bg-sky-bg text-sky',
    borderCls: 'border-sky/[0.16]',
  },
};

function typeConfig(type: string) {
  return TYPE_CONFIG[type.toLowerCase()] ?? {
    label:     type,
    badgeCls:  'bg-sand text-ink/55',
    borderCls: 'border-ink/[0.11]',
  };
}

// ── Modal ────────────────────────────────────────────────────────────────
interface SourceModalProps {
  source:  Source | null;
  onSave:  (data: Partial<Source>) => Promise<void>;
  onClose: () => void;
}

function Field({ id, label, value, onChange, multiline }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; multiline?: boolean;
}) {
  const cls = 'w-full border border-ink/[0.11] rounded-[8px] px-3 py-2 text-[13px] mt-1 bg-cream text-ink placeholder:text-ink/35';
  return (
    <div>
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45">{label}</label>
      {multiline
        ? <textarea id={id} className={cls} rows={3} value={value} onChange={e => onChange(e.target.value)} />
        : <input    id={id} className={cls}         value={value} onChange={e => onChange(e.target.value)} />
      }
    </div>
  );
}

function SourceModal({ source, onSave, onClose }: SourceModalProps) {
  const [name,         setName]         = useState(source?.name         ?? '');
  const [type,         setType]         = useState(source?.type         ?? 'classical');
  const [period,       setPeriod]       = useState(source?.period       ?? '');
  const [author,       setAuthor]       = useState(source?.author       ?? '');
  const [genre,        setGenre]        = useState(source?.genre        ?? '');
  const [chapter,      setChapter]      = useState(source?.chapter      ?? '');
  const [about,        setAbout]        = useState(source?.about        ?? '');
  const [citationRef,  setCitationRef]  = useState(source?.citationRef  ?? '');
  const [citationNote, setCitationNote] = useState(source?.citationNote ?? '');
  const [whyItMatters, setWhyItMatters] = useState(source?.whyItMatters ?? '');
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  async function handleSave() {
    setSaving(true); setErr(null);
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-ink/40 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 py-8">
      <div className="bg-cream rounded-[16px] shadow-2xl p-6 w-full max-w-[480px]">
        <h2 className="font-serif text-[18px] font-light text-ink mb-4">
          {source ? 'Edit Source' : 'New Source'}
        </h2>
        <div className="flex flex-col gap-3 mb-4">
          <Field id="source-name" label="Name" value={name} onChange={setName} />
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full border border-ink/[0.11] rounded-[8px] px-3 py-2 text-[13px] mt-1 bg-cream text-ink"
            >
              <option value="classical">Classical</option>
              <option value="modern">Modern</option>
              <option value="research">Research</option>
            </select>
          </div>
          <hr className="border-sand" />
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink/35">Narrative (optional)</p>
          <div className="grid grid-cols-2 gap-3">
            <Field id="source-period" label="Period" value={period} onChange={setPeriod} />
            <Field id="source-author" label="Author" value={author} onChange={setAuthor} />
          </div>
          <Field id="source-genre"        label="Genre"          value={genre}        onChange={setGenre} />
          <Field id="source-chapter"      label="Chapter"        value={chapter}      onChange={setChapter} />
          <Field id="source-about"        label="About"          value={about}        onChange={setAbout}        multiline />
          <Field id="source-citationRef"  label="Citation Ref"   value={citationRef}  onChange={setCitationRef} />
          <Field id="source-citationNote" label="Citation Note"  value={citationNote} onChange={setCitationNote} multiline />
          <Field id="source-why"          label="Why It Matters" value={whyItMatters} onChange={setWhyItMatters} multiline />
        </div>
        {err && <p role="alert" className="text-[12px] text-clay mb-3">{err}</p>}
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-[13px] text-ink/55 hover:bg-sand rounded-[8px] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-[13px] font-semibold bg-brand text-white rounded-[10px] disabled:opacity-50 hover:opacity-90 transition-opacity">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export function SourcesPage() {
  const [sources,    setSources]    = useState<Source[]>(PLACEHOLDER_SOURCES);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<Source | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    api<Source[]>('/api/admin/sources')
      .then(setSources)
      .catch(() => { /* endpoint not yet implemented — placeholder stays */ });
  }, []);

  async function handleSave(data: Partial<Source>) {
    if (editing) {
      const updated = await api<Source>(`/api/admin/sources/${editing.id}`, {
        method: 'PUT', body: JSON.stringify(data),
      });
      setSources(ss => ss.map(s => s.id === editing.id ? updated : s));
    } else {
      const created = await api<Source>('/api/admin/sources', {
        method: 'POST', body: JSON.stringify(data),
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

  // Group sources by type
  const groups = ['classical', 'modern', 'research'];
  const grouped = groups
    .map(type => ({ type, items: sources.filter(s => s.type.toLowerCase() === type) }))
    .filter(g => g.items.length > 0);
  // Anything with an unknown type goes under "Other"
  const knownTypes = new Set(groups);
  const other = sources.filter(s => !knownTypes.has(s.type.toLowerCase()));

  const allGroups = other.length > 0
    ? [...grouped, { type: 'other', items: other }]
    : grouped;

  return (
    <div className="p-5 md:p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-[22px] font-light text-ink tracking-tight">Reference Sources</h1>
          <p className="text-[12.5px] text-ink/45 mt-0.5">Classical texts, modern books, and research papers cited in recipes.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="bg-brand text-white text-[12.5px] font-semibold px-4 py-2 rounded-[10px] hover:opacity-90 transition-opacity"
        >
          + Add Source
        </button>
      </div>

      {error && <p role="alert" className="mb-4 text-[13px] text-clay">{error}</p>}

      {allGroups.map(group => {
        const cfg = typeConfig(group.type);
        return (
          <div key={group.type} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-[800] uppercase tracking-[0.08em] px-2.5 py-1 rounded-full ${cfg.badgeCls}`}>
                {cfg.label}
              </span>
              <div className="flex-1 h-px bg-ink/[0.08]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {group.items.map(src => (
                <div
                  key={src.id}
                  className={`bg-bone border ${cfg.borderCls} rounded-[14px] p-4 shadow-[0_1px_3px_rgba(42,37,30,.07)] hover:shadow-[0_4px_14px_rgba(42,37,30,.10)] transition-shadow cursor-pointer relative group`}
                  onClick={() => { setEditing(src); setModalOpen(true); }}
                >
                  <span className={`text-[9.5px] font-[800] uppercase tracking-[0.06em] ${cfg.badgeCls.split(' ')[1]} mb-2 block`}>
                    {cfg.label}{src.period ? ` · ${src.period}` : ''}
                  </span>
                  <h3 className="font-serif text-[14px] font-light text-ink mb-1.5 leading-tight">{src.name}</h3>
                  {(src.author || src.genre) && (
                    <p className="text-[11.5px] text-ink/55 leading-relaxed mb-3">
                      {[src.author, src.genre].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {src.about && (
                    <p className="text-[12px] text-ink/60 leading-relaxed line-clamp-2 mb-3">{src.about}</p>
                  )}
                  <div className="flex items-center justify-between pt-2.5 border-t border-ink/[0.08]">
                    <span className="text-[11.5px] text-ink/40">
                      {src.recipeCount > 0 ? `Referenced in ${src.recipeCount} recipes` : 'Not yet cited'}
                    </span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleDelete(src); }}
                      className="text-[11px] font-semibold text-clay opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

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
