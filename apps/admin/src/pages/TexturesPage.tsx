import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

// ── Types ──────────────────────────────────────────────────────────────────
interface Texture {
  _id: string;
  code: string;
  label: string;
  subtitle: string;
  order: number;
  enabled: boolean;
  builtIn: boolean;
}

// ── Inline-edit input: only syncs from parent when not focused ─────────────
function InlineInput({
  value, onCommit, placeholder, className = '',
}: { value: string; onCommit: (v: string) => void; placeholder?: string; className?: string }) {
  const [local, setLocal] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setLocal(value); }, [value, focused]);
  return (
    <input
      className={`bg-transparent focus:outline-none focus:ring-1 focus:ring-brand/30 focus:bg-cream rounded px-1.5 py-0.5 -mx-1.5 text-ink placeholder:text-ink/30 w-full ${className}`}
      value={local}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { setFocused(false); if (local.trim() !== value) onCommit(local.trim()); }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────
function Toggle({ on, disabled, onToggle }: { on: boolean; disabled?: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={on ? 'Enabled' : 'Disabled'}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors
        ${on ? 'bg-brand' : 'bg-ink/15'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform
        ${on ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}

// ── Code badge ─────────────────────────────────────────────────────────────
function CodeBadge({ code }: { code: string }) {
  return (
    <span className="inline-block font-mono text-[10px] bg-ink/[0.07] text-ink/60 px-1.5 py-0.5 rounded leading-tight select-all">
      {code}
    </span>
  );
}

const INP = 'w-full border border-ink/[0.11] rounded-[7px] px-2.5 py-1.5 bg-cream text-[12.5px] text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-brand/30';

// ── Page ───────────────────────────────────────────────────────────────────
export function TexturesPage() {
  const [textures, setTextures] = useState<Texture[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState<string | null>(null);

  // Add-row state
  const [addLabel,    setAddLabel]    = useState('');
  const [addSubtitle, setAddSubtitle] = useState('');
  const [addCode,     setAddCode]     = useState('');
  const [addErr,      setAddErr]      = useState<string | null>(null);
  const [adding,      setAdding]      = useState(false);
  const addLabelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Texture[]>('/api/admin/textures')
      .then(t => { setTextures(t); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function update(id: string, patch: Partial<Texture>) {
    setTextures(prev => prev.map(t => t._id === id ? { ...t, ...patch } : t));
  }

  async function commit(id: string, patch: Partial<Texture>) {
    update(id, patch);
    try {
      await api<Texture>(`/api/admin/textures/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function move(id: string, dir: 'up' | 'down') {
    const sorted = [...textures].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(t => t._id === id);
    const swap = dir === 'up' ? sorted[idx - 1] : sorted[idx + 1];
    if (!swap) return;
    const newOrderA = swap.order;
    const newOrderB = sorted[idx].order;
    // Optimistic
    setTextures(prev => prev.map(t => {
      if (t._id === id)       return { ...t, order: newOrderA };
      if (t._id === swap._id) return { ...t, order: newOrderB };
      return t;
    }));
    try {
      await Promise.all([
        api<Texture>(`/api/admin/textures/${id}`,       { method: 'PUT', body: JSON.stringify({ order: newOrderA }) }),
        api<Texture>(`/api/admin/textures/${swap._id}`, { method: 'PUT', body: JSON.stringify({ order: newOrderB }) }),
      ]);
    } catch (e: any) { setErr(e.message); }
  }

  async function remove(id: string) {
    const t = textures.find(x => x._id === id);
    if (!t || t.builtIn) return;
    if (!confirm(`Delete texture "${t.label}"? Recipes using "${t.code}" will still exist but won't match any texture.`)) return;
    setTextures(prev => prev.filter(x => x._id !== id));
    try {
      await api<{ ok: boolean }>(`/api/admin/textures/${id}`, { method: 'DELETE' });
    } catch (e: any) { setErr(e.message); }
  }

  async function addTexture() {
    if (!addLabel.trim()) { setAddErr('Label is required'); return; }
    setAddErr(null);
    setAdding(true);
    try {
      const payload: Record<string, string> = { label: addLabel.trim(), subtitle: addSubtitle.trim() };
      if (addCode.trim()) payload.code = addCode.trim();
      const created = await api<Texture>('/api/admin/textures', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTextures(prev => [...prev, created]);
      setAddLabel(''); setAddSubtitle(''); setAddCode('');
      setTimeout(() => addLabelRef.current?.focus(), 50);
    } catch (e: any) {
      setAddErr(e.message || 'Could not add texture');
    } finally { setAdding(false); }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) return <div className="p-8 text-ink/40 text-[13px]">Loading textures…</div>;
  if (err)     return <div className="p-8 text-red-500 text-[13px]">{err}</div>;

  const sorted = [...textures].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-ink leading-tight">Textures</h1>
        <p className="text-[12.5px] text-ink/45 mt-0.5">
          Control which textures appear in the app. Built-in textures can be renamed but not deleted.
        </p>
      </div>

      {/* Table */}
      <div className="border border-ink/[0.09] rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[28px_1fr_1fr_80px_40px_32px] gap-3 px-4 py-2.5 bg-ink/[0.03] border-b border-ink/[0.09]">
          <span />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/40">Label</span>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/40">Subtitle</span>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/40">Code</span>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/40">On</span>
          <span />
        </div>

        {sorted.map((t, i) => (
          <div
            key={t._id}
            className={`grid grid-cols-[28px_1fr_1fr_80px_40px_32px] gap-3 items-center px-4 py-3
              ${i < sorted.length - 1 ? 'border-b border-ink/[0.06]' : ''}
              ${!t.enabled ? 'opacity-50' : ''}`}
          >
            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                disabled={i === 0}
                onClick={() => move(t._id, 'up')}
                className="text-ink/30 hover:text-ink/70 disabled:opacity-20 disabled:cursor-not-allowed text-[10px] leading-none"
                title="Move up"
              >▲</button>
              <button
                disabled={i === sorted.length - 1}
                onClick={() => move(t._id, 'down')}
                className="text-ink/30 hover:text-ink/70 disabled:opacity-20 disabled:cursor-not-allowed text-[10px] leading-none"
                title="Move down"
              >▼</button>
            </div>

            {/* Label — click to edit */}
            <InlineInput
              value={t.label}
              placeholder="Label"
              className="text-[13px] font-semibold"
              onCommit={v => { if (v) commit(t._id, { label: v }); }}
            />

            {/* Subtitle */}
            <InlineInput
              value={t.subtitle}
              placeholder="Short description…"
              className="text-[12px] text-ink/60"
              onCommit={v => commit(t._id, { subtitle: v })}
            />

            {/* Code badge */}
            <CodeBadge code={t.code} />

            {/* Enabled toggle */}
            <Toggle
              on={t.enabled}
              onToggle={() => commit(t._id, { enabled: !t.enabled })}
            />

            {/* Remove */}
            <button
              disabled={t.builtIn}
              onClick={() => remove(t._id)}
              title={t.builtIn ? 'Built-in — cannot delete' : 'Remove'}
              className={`text-[14px] leading-none rounded
                ${t.builtIn
                  ? 'text-ink/15 cursor-not-allowed'
                  : 'text-ink/30 hover:text-red-500 cursor-pointer'}`}
            >×</button>
          </div>
        ))}

        {/* Add row */}
        <div className="border-t border-dashed border-ink/[0.09] px-4 py-3 space-y-2">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink/40">Add texture</p>
          <div className="flex gap-2 flex-wrap">
            <input
              ref={addLabelRef}
              value={addLabel}
              onChange={e => setAddLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTexture(); }}
              placeholder="Label (e.g. Crispy)"
              className={`${INP} flex-1 min-w-[120px]`}
            />
            <input
              value={addSubtitle}
              onChange={e => setAddSubtitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTexture(); }}
              placeholder="Subtitle (e.g. Chips · crackers · wafers)"
              className={`${INP} flex-[2] min-w-[180px]`}
            />
            <input
              value={addCode}
              onChange={e => setAddCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTexture(); }}
              placeholder="code (auto)"
              className={`${INP} w-28 font-mono text-[11px]`}
            />
            <button
              onClick={addTexture}
              disabled={adding}
              className="px-3 py-1.5 rounded-[7px] bg-brand text-white text-[12px] font-semibold hover:bg-brand/90 disabled:opacity-50 shrink-0"
            >
              {adding ? '…' : 'Add'}
            </button>
          </div>
          {addErr && <p className="text-[12px] text-red-500">{addErr}</p>}
        </div>
      </div>

      <p className="text-[11px] text-ink/35 leading-relaxed">
        Changes take effect immediately. The <span className="font-mono bg-ink/[0.06] px-1 rounded">code</span> is used as the{' '}
        <span className="font-mono bg-ink/[0.06] px-1 rounded">category</span> value on recipes — renaming a code would
        require a data migration, so codes are permanent once created.
      </p>
    </div>
  );
}
