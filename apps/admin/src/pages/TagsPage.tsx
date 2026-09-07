import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { TAG_DEFAULTS, mergeTagDefaults, type Vocab, type VocabValue } from '../components/TagRows';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FilterGroup {
  _id: string;
  code: string;
  label: string;
  order: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Colour palette cycled per group index (blue, green, orange, purple, pink, teal). */
const GROUP_DOTS = ['#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6'];
const dot = (i: number) => GROUP_DOTS[i % GROUP_DOTS.length];

const FACETS: { facet: keyof Vocab; label: string; desc: string }[] = [
  { facet: 'type',       label: 'Type',            desc: 'Recipe format — laddu, paratha, soup, rice…' },
  { facet: 'meal',       label: 'Meal',            desc: "When it's served — breakfast, snack, dessert…" },
  { facet: 'ingredient', label: 'Main Ingredient', desc: 'Star ingredient — coconut, jaggery, amla…' },
  { facet: 'method',     label: 'Method',          desc: 'Cooking technique — steamed, fried, no-cook…' },
  { facet: 'diet',       label: 'Diet tags',       desc: 'Dietary properties — sweet, dairy, high protein…' },
  { facet: 'filter',     label: 'Home filters',    desc: 'Pills on the home page — grouped by effort, taste, occasion.' },
];

function normaliseVocab(v: Vocab): Vocab {
  const out = {} as Vocab;
  for (const { facet } of FACETS) {
    out[facet] = v[facet]
      .map((t, i) => ({
        ...t,
        code:    (t.code || slug(t.label)).trim(),
        label:   t.label.trim(),
        order:   i + 1,
        enabled: t.enabled !== false,
      }))
      .filter(t => t.code && t.label);
  }
  return out;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function TagsPage() {
  const [vocab,      setVocab]      = useState<Vocab>(TAG_DEFAULTS);
  const [groups,     setGroups]     = useState<FilterGroup[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api<Partial<Vocab>>('/api/admin/tags'),
      api<FilterGroup[]>('/api/admin/filter-groups'),
    ])
      .then(([tags, grps]) => {
        setVocab(mergeTagDefaults(tags));
        setGroups(grps);
      })
      .catch(() => {});
  }, []);

  async function commit(next: Vocab) {
    setVocab(next);
    setSaving(true);
    setSaveStatus(null);
    try {
      const saved = await api<Partial<Vocab>>('/api/admin/tags', {
        method: 'PUT',
        body: JSON.stringify(normaliseVocab(next)),
      });
      setVocab(mergeTagDefaults(saved));
      setSaveStatus({ ok: true, text: '✓ Saved' });
      setTimeout(() => setSaveStatus(null), 2200);
    } catch (e) {
      setSaveStatus({ ok: false, text: (e as Error).message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  /** When a filter group is deleted, reassign its orphaned filter tags to the first remaining group. */
  function reassignGroup(deletedCode: string, fallbackCode: string) {
    const updated = vocab.filter.map(r =>
      (r.group === deletedCode) ? { ...r, group: fallbackCode } : r
    );
    commit({ ...vocab, filter: updated });
  }

  return (
    <div className="p-5 md:p-7 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-7">
        <div>
          <h1 className="text-[22px] font-bold text-ink leading-tight">Tag vocabulary</h1>
          <p className="text-[13px] text-ink/45 mt-0.5">
            Click any pill to rename · drag to reorder · × to remove
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {saving && <span className="text-[11px] text-ink/40 animate-pulse">Saving…</span>}
          {saveStatus && (
            <span className={`text-[12px] font-semibold ${saveStatus.ok ? 'text-brand' : 'text-clay'}`}>
              {saveStatus.ok ? saveStatus.text : `⚠ ${saveStatus.text}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {FACETS.map(({ facet, label, desc }) => (
          <FacetSection
            key={facet}
            facet={facet}
            label={label}
            desc={desc}
            rows={vocab[facet]}
            onCommit={rows => commit({ ...vocab, [facet]: rows })}
            saving={saving}
            groups={facet === 'filter' ? groups : undefined}
            onGroupsChange={facet === 'filter' ? setGroups : undefined}
            onReassignGroup={facet === 'filter' ? reassignGroup : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ── FacetSection ──────────────────────────────────────────────────────────────

function FacetSection({
  facet, label, desc, rows, onCommit, saving,
  groups, onGroupsChange, onReassignGroup,
}: {
  facet:             keyof Vocab;
  label:             string;
  desc:              string;
  rows:              VocabValue[];
  onCommit:          (rows: VocabValue[]) => void;
  saving:            boolean;
  groups?:           FilterGroup[];
  onGroupsChange?:   (groups: FilterGroup[]) => void;
  onReassignGroup?:  (deletedCode: string, fallbackCode: string) => void;
}) {
  const isFilter    = facet === 'filter';
  const [open, setOpen] = useState(false);
  const activeCount     = rows.filter(r => r.enabled !== false).length;

  return (
    <div className="rounded-[14px] border border-ink/[0.11] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-sand px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-left hover:bg-sand/80 transition-colors"
      >
        <span className={`text-[10px] text-ink/50 transition-transform duration-200 shrink-0 ${open ? 'rotate-90' : ''}`}>▸</span>
        <span className="text-[12px] font-bold uppercase tracking-[0.07em] text-ink/65 shrink-0">{label}</span>
        <span className="text-[12.5px] text-ink/40 hidden sm:block">{desc}</span>
        <span className="ml-auto text-[11px] text-ink/30 tabular-nums shrink-0">{activeCount}/{rows.length}</span>
      </button>

      {open && (
        <div className="border-t border-ink/[0.08] p-4">
          {isFilter && groups && onGroupsChange && onReassignGroup ? (
            <div className="flex flex-col gap-5">
              {/* Group manager sits above kanban */}
              <GroupManager
                groups={groups}
                onChange={onGroupsChange}
                onDelete={(deletedCode, fallback) => {
                  onGroupsChange(groups.filter(g => g.code !== deletedCode));
                  onReassignGroup(deletedCode, fallback);
                }}
              />
              <KanbanBoard rows={rows} groups={groups} onCommit={onCommit} />
            </div>
          ) : (
            <PillGrid rows={rows} onCommit={onCommit} facetLabel={label} />
          )}
        </div>
      )}
    </div>
  );
}

// ── GroupManager ──────────────────────────────────────────────────────────────

function GroupManager({
  groups, onChange, onDelete,
}: {
  groups:   FilterGroup[];
  onChange: (groups: FilterGroup[]) => void;
  onDelete: (deletedCode: string, fallbackCode: string) => void;
}) {
  const [saving,  setSaving]  = useState(false);
  const [adding,  setAdding]  = useState(false);
  const [newLabel,setNewLabel]= useState('');
  const [err,     setErr]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function renameGroup(g: FilterGroup, label: string) {
    if (!label || label === g.label) return;
    setSaving(true);
    try {
      const updated = await api<FilterGroup>(`/api/admin/filter-groups/${g._id}`, {
        method: 'PUT', body: JSON.stringify({ label }),
      });
      onChange(groups.map(x => x._id === g._id ? updated : x));
    } catch (e) {
      // revert is implicit — label input syncs back from parent
    } finally {
      setSaving(false);
    }
  }

  async function moveGroup(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    // swap orders
    const aOrder = next[i].order;
    const bOrder = next[j].order;
    next[i] = { ...next[i], order: bOrder };
    next[j] = { ...next[j], order: aOrder };
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next); // optimistic
    setSaving(true);
    try {
      await Promise.all([
        api(`/api/admin/filter-groups/${next[i]._id}`, { method: 'PUT', body: JSON.stringify({ label: next[i].label, order: next[i].order }) }),
        api(`/api/admin/filter-groups/${next[j]._id}`, { method: 'PUT', body: JSON.stringify({ label: next[j].label, order: next[j].order }) }),
      ]);
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(g: FilterGroup) {
    if (groups.length <= 1) return;
    const fallback = groups.find(x => x._id !== g._id)!;
    setSaving(true);
    try {
      await api(`/api/admin/filter-groups/${g._id}`, { method: 'DELETE' });
      onDelete(g.code, fallback.code);
    } finally {
      setSaving(false);
    }
  }

  async function addGroup() {
    setErr(null);
    const label = newLabel.trim();
    if (!label) { setAdding(false); setNewLabel(''); return; }
    const code = slug(label);
    if (!code) { setErr('Invalid label'); return; }
    if (groups.some(g => g.code === code)) { setErr(`"${code}" already exists`); return; }
    setSaving(true);
    try {
      const created = await api<FilterGroup>('/api/admin/filter-groups', {
        method: 'POST', body: JSON.stringify({ label }),
      });
      onChange([...groups, created]);
      setNewLabel(''); setAdding(false);
    } catch (e) {
      setErr((e as Error).message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[10px] border border-ink/[0.09] overflow-hidden">
      {/* Header */}
      <div className="bg-sand/40 px-3 py-2 border-b border-ink/[0.07] flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink/45">Filter groups</span>
        <span className="text-[10.5px] text-ink/30 ml-1">— column headers on the home page</span>
        {saving && <span className="ml-auto text-[10px] text-ink/35 animate-pulse">Saving…</span>}
      </div>

      {/* Group rows */}
      <div>
        {groups.map((g, i) => (
          <div
            key={g._id}
            className="flex items-center gap-2 px-3 py-2 border-b border-ink/[0.06] last:border-0 group hover:bg-sand/20 transition-colors"
          >
            {/* Colour dot */}
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot(i) }} />

            {/* Editable label */}
            <GroupLabelInput
              group={g}
              onSave={label => renameGroup(g, label)}
            />

            {/* Reorder + remove */}
            <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                disabled={i === 0 || saving}
                onClick={() => moveGroup(i, -1)}
                className="text-ink/35 hover:text-ink disabled:opacity-20 px-1 text-[13px] transition-colors"
              >↑</button>
              <button
                type="button"
                disabled={i === groups.length - 1 || saving}
                onClick={() => moveGroup(i, 1)}
                className="text-ink/35 hover:text-ink disabled:opacity-20 px-1 text-[13px] transition-colors"
              >↓</button>
              <button
                type="button"
                disabled={groups.length <= 1 || saving}
                onClick={() => deleteGroup(g)}
                title="Remove group (its pills move to the first remaining group)"
                className="text-clay/40 hover:text-clay disabled:opacity-20 text-[18px] leading-none px-1 transition-colors"
              >×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new group */}
      {adding ? (
        <div className="px-3 py-2 border-t border-ink/[0.06] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot(groups.length) }} />
          <input
            ref={inputRef}
            value={newLabel}
            onChange={e => { setNewLabel(e.target.value); setErr(null); }}
            onBlur={addGroup}
            onKeyDown={e => { if (e.key === 'Enter') addGroup(); if (e.key === 'Escape') { setAdding(false); setNewLabel(''); setErr(null); } }}
            placeholder="Group name…"
            autoFocus
            className="flex-1 text-[13px] bg-transparent border-none outline-none text-ink placeholder:text-ink/30 focus:outline-none"
          />
          {err && <span className="text-[11px] text-clay shrink-0">{err}</span>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setAdding(true); requestAnimationFrame(() => inputRef.current?.focus()); }}
          className="w-full px-3 py-2 text-left text-[12px] text-ink/35 hover:text-brand hover:bg-brand/[0.03] border-t border-ink/[0.06] transition-colors flex items-center gap-1.5"
        >
          <span className="text-[14px] leading-none">+</span>
          <span>Add group</span>
        </button>
      )}
    </div>
  );
}

// ── GroupLabelInput ───────────────────────────────────────────────────────────

function GroupLabelInput({
  group, onSave,
}: {
  group:  FilterGroup;
  onSave: (label: string) => void;
}) {
  const [val,     setVal]     = useState(group.label);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setVal(group.label);
  }, [group.label, focused]);

  return (
    <input
      value={val}
      onChange={e => setVal(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (val.trim() && val.trim() !== group.label) onSave(val.trim());
        else setVal(group.label);
      }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      className="flex-1 text-[13px] font-medium text-ink bg-transparent border-none outline-none focus:outline-none focus:ring-1 focus:ring-brand/20 rounded px-1 -mx-1"
    />
  );
}

// ── PillGrid ──────────────────────────────────────────────────────────────────

function PillGrid({ rows, onCommit, facetLabel }: {
  rows: VocabValue[]; onCommit: (rows: VocabValue[]) => void; facetLabel: string;
}) {
  const dragSrc = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function reorder(from: number, to: number) {
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onCommit(next);
  }

  return (
    <div className="flex flex-wrap gap-2 items-start min-h-[40px]">
      {rows.map((row, i) => (
        <PillItem
          key={row.code}
          row={row}
          isDragOver={dragOver === i}
          onDragStart={() => { dragSrc.current = i; }}
          onDragOver={() => setDragOver(i)}
          onDrop={() => {
            if (dragSrc.current !== null && dragSrc.current !== i) reorder(dragSrc.current, i);
            dragSrc.current = null; setDragOver(null);
          }}
          onDragEnd={() => { dragSrc.current = null; setDragOver(null); }}
          onSave={label  => onCommit(rows.map((r, j) => j === i ? { ...r, label } : r))}
          onToggle={() =>   onCommit(rows.map((r, j) => j === i ? { ...r, enabled: !(r.enabled !== false) } : r))}
          onRemove={() =>   onCommit(rows.filter((_, j) => j !== i))}
        />
      ))}
      <AddPill
        placeholder={`Add ${facetLabel.toLowerCase()}…`}
        onAdd={label => {
          const code = slug(label);
          if (!code || rows.some(r => r.code === code)) return;
          onCommit([...rows, { code, label, order: rows.length + 1, enabled: true }]);
        }}
        existingCodes={rows.map(r => r.code)}
      />
    </div>
  );
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────

function KanbanBoard({ rows, groups, onCommit }: {
  rows:     VocabValue[];
  groups:   FilterGroup[];
  onCommit: (rows: VocabValue[]) => void;
}) {
  const dragSrc = useRef<{ code: string; index: number } | null>(null);
  const [dropCol, setDropCol] = useState<string | null>(null);

  const defaultCode = groups[0]?.code ?? '';

  function byGroupCopy(): Record<string, VocabValue[]> {
    return Object.fromEntries(
      groups.map(g => [
        g.code,
        rows.filter(r => (r.group || defaultCode) === g.code).map(r => ({ ...r })),
      ])
    );
  }

  function apply(fn: (g: Record<string, VocabValue[]>) => void) {
    const g = byGroupCopy();
    fn(g);
    onCommit(groups.flatMap(k => g[k.code]));
  }

  function handleDrop(toCode: string, toIndex?: number) {
    if (!dragSrc.current) return;
    const { code: fromCode, index: fromIndex } = dragSrc.current;
    apply(g => {
      const [item] = g[fromCode].splice(fromIndex, 1);
      const target = toIndex !== undefined
        ? (fromCode === toCode && fromIndex < toIndex ? toIndex - 1 : toIndex)
        : g[toCode].length;
      g[toCode].splice(target, 0, { ...item, group: toCode });
    });
    dragSrc.current = null;
    setDropCol(null);
  }

  const currentByGroup = byGroupCopy();

  if (groups.length === 0) {
    return <p className="text-[13px] text-ink/35 italic py-2">Add a filter group above to get started.</p>;
  }

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
      {groups.map((group, gi) => {
        const colRows = currentByGroup[group.code] ?? [];
        const isOver  = dropCol === group.code;
        return (
          <div
            key={group._id}
            className={`rounded-[10px] border p-3 min-h-[80px] transition-colors ${
              isOver ? 'border-brand/30 bg-brand/[0.03]' : 'border-ink/[0.09] bg-sand/20'
            }`}
            onDragOver={e => { e.preventDefault(); setDropCol(group.code); }}
            onDrop={e => { e.preventDefault(); handleDrop(group.code); }}
            onDragLeave={e => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropCol(null);
            }}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-ink/[0.07]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot(gi) }} />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/55">{group.label}</span>
              <span className="ml-auto text-[10px] text-ink/25 tabular-nums">{colRows.length}</span>
            </div>

            {/* Pills */}
            <div className="flex flex-col gap-1.5">
              {colRows.map((row, i) => (
                <PillItem
                  key={row.code}
                  row={row}
                  vertical
                  isDragOver={false}
                  onDragStart={() => { dragSrc.current = { code: group.code, index: i }; }}
                  onDragOver={() => setDropCol(group.code)}
                  onDrop={() => handleDrop(group.code, i)}
                  onDragEnd={() => { dragSrc.current = null; setDropCol(null); }}
                  onSave={label  => apply(g => { g[group.code][i] = { ...g[group.code][i], label }; })}
                  onToggle={() =>   apply(g => { g[group.code][i] = { ...g[group.code][i], enabled: !(g[group.code][i].enabled !== false) }; })}
                  onRemove={() =>   apply(g => { g[group.code].splice(i, 1); })}
                />
              ))}
            </div>

            {/* Add */}
            <div className="mt-2">
              <AddPill
                placeholder="Add…"
                compact
                onAdd={label => {
                  const code = slug(label);
                  if (!code || rows.some(r => r.code === code)) return;
                  apply(g => { g[group.code].push({ code, label, order: rows.length + 1, enabled: true, group: group.code }); });
                }}
                existingCodes={rows.map(r => r.code)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PillItem ──────────────────────────────────────────────────────────────────

function PillItem({
  row, vertical = false, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onSave, onToggle, onRemove,
}: {
  row:         VocabValue;
  vertical?:   boolean;
  isDragOver:  boolean;
  onDragStart: () => void;
  onDragOver:  () => void;
  onDrop:      () => void;
  onDragEnd:   () => void;
  onSave:      (label: string) => void;
  onToggle:    () => void;
  onRemove:    () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(row.label);
  const inputRef              = useRef<HTMLInputElement>(null);
  const enabled               = row.enabled !== false;

  useEffect(() => {
    if (!editing) setVal(row.label);
  }, [row.label, editing]);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function save() {
    setEditing(false);
    const t = val.trim();
    if (t && t !== row.label) onSave(t);
    else setVal(row.label);
  }

  return (
    <div
      draggable={!editing}
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragOver={e  => { e.preventDefault(); onDragOver(); }}
      onDrop={e      => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      className={[
        'group relative flex items-center gap-1.5 rounded-full border transition-all',
        vertical ? 'px-3 py-1.5 w-full' : 'px-3 py-1.5',
        enabled
          ? 'bg-brand/[0.08] border-brand/25 text-brand'
          : 'bg-ink/[0.03] border-ink/[0.09] text-ink/30',
        isDragOver ? 'ring-2 ring-offset-1 ring-brand/30' : '',
        !editing ? 'cursor-grab active:cursor-grabbing' : 'cursor-text',
      ].filter(Boolean).join(' ')}
    >
      {!editing && (
        <span className="text-[9px] opacity-0 group-hover:opacity-25 shrink-0 transition-opacity select-none">⠿</span>
      )}

      {editing ? (
        <input
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Enter')  { e.preventDefault(); save(); }
            if (e.key === 'Escape') { setVal(row.label); setEditing(false); }
          }}
          className="bg-transparent border-none outline-none text-[13px] font-medium flex-1 min-w-[40px]"
          style={{ width: `${Math.max(val.length + 1, 5)}ch` }}
        />
      ) : (
        <span
          className={`text-[13px] font-medium truncate ${vertical ? 'flex-1' : ''} ${!enabled ? 'line-through' : ''}`}
          onClick={startEdit}
          title="Click to rename"
        >
          {row.label}
        </span>
      )}

      {!editing && (
        <div className="flex items-center gap-0.5 ml-auto pl-1 shrink-0">
          <span className="font-mono text-[8.5px] opacity-0 group-hover:opacity-20 transition-opacity">{row.code}</span>
          <button
            type="button"
            title={enabled ? 'Hide' : 'Show'}
            onClick={e => { e.stopPropagation(); onToggle(); }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 px-1 text-[11px] transition-opacity"
          >
            {enabled ? '◉' : '○'}
          </button>
          <button
            type="button"
            title="Remove"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-clay text-[15px] leading-none px-0.5 transition-opacity"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ── AddPill ───────────────────────────────────────────────────────────────────

function AddPill({
  placeholder, onAdd, existingCodes, compact = false,
}: {
  placeholder:   string;
  onAdd:         (label: string) => void;
  existingCodes: string[];
  compact?:      boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [val,    setVal]    = useState('');
  const [err,    setErr]    = useState<string | null>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  function start() {
    setAdding(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function tryAdd() {
    const label = val.trim();
    if (!label) { setAdding(false); setVal(''); return; }
    const code = slug(label);
    if (!code) { setErr('Invalid'); return; }
    if (existingCodes.includes(code)) { setErr('Already exists'); return; }
    onAdd(label);
    setVal(''); setErr(null); setAdding(false);
  }

  if (adding) {
    return (
      <div className={compact ? 'w-full' : ''}>
        <div className={[
          'flex items-center gap-1.5 rounded-full border-2 border-dashed border-brand/40 bg-brand/[0.04]',
          compact ? 'px-3 py-1.5 w-full' : 'px-3 py-1.5',
        ].join(' ')}>
          <input
            ref={inputRef}
            value={val}
            onChange={e => { setVal(e.target.value); setErr(null); }}
            onBlur={tryAdd}
            onKeyDown={e => {
              if (e.key === 'Enter')  tryAdd();
              if (e.key === 'Escape') { setAdding(false); setVal(''); setErr(null); }
            }}
            placeholder={placeholder}
            className="bg-transparent border-none outline-none text-[13px] text-brand placeholder:text-brand/35 flex-1 min-w-[60px]"
          />
          {err && <span className="text-[10px] text-clay shrink-0">{err}</span>}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className={[
        'flex items-center gap-1 rounded-full border border-dashed border-ink/[0.15] text-ink/30',
        'hover:border-brand/35 hover:text-brand transition-all',
        compact ? 'px-3 py-1.5 text-[12px] w-full justify-center' : 'px-3 py-1.5 text-[12px]',
      ].join(' ')}
    >
      <span className="text-[13px] leading-none">+</span>
      <span>{compact ? 'Add' : placeholder.replace('…', '')}</span>
    </button>
  );
}
