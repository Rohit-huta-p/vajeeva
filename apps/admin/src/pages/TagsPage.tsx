import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { TAG_DEFAULTS, mergeTagDefaults, type Vocab, type VocabValue } from '../components/TagRows';

// ── Constants ─────────────────────────────────────────────────────────────────

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const GROUPS = ['effort', 'taste', 'occasion'] as const;
type Group = (typeof GROUPS)[number];

const FACETS: { facet: keyof Vocab; label: string; desc: string }[] = [
  { facet: 'type',       label: 'Type',            desc: 'Recipe format — laddu, paratha, soup, rice…' },
  { facet: 'meal',       label: 'Meal',            desc: 'When it\'s served — breakfast, snack, dessert…' },
  { facet: 'ingredient', label: 'Main Ingredient', desc: 'Star ingredient — coconut, jaggery, amla…' },
  { facet: 'method',     label: 'Method',          desc: 'Cooking technique — steamed, fried, no-cook…' },
  { facet: 'diet',       label: 'Diet tags',       desc: 'Dietary properties — sweet, dairy, high protein…' },
  { facet: 'filter',     label: 'Home filters',    desc: 'Pills on the home page — grouped by effort, taste, occasion.' },
];

/** Normalise before sending to API — auto-fill codes, trim, assign order. */
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

const INP = 'w-full border border-ink/[0.11] rounded-[7px] px-2.5 py-1.5 bg-cream text-[12.5px] text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-brand/30';

// ── Page ──────────────────────────────────────────────────────────────────────

export function TagsPage() {
  const [vocab,      setVocab]      = useState<Vocab>(TAG_DEFAULTS);
  const [saving,     setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<Partial<Vocab>>('/api/admin/tags')
      .then(saved => setVocab(mergeTagDefaults(saved)))
      .catch(() => {});
  }, []);

  async function commit(next: Vocab) {
    setVocab(next);          // optimistic local update
    setSaving(true);
    setSaveStatus(null);
    try {
      const body = normaliseVocab(next);
      const saved = await api<Partial<Vocab>>('/api/admin/tags', { method: 'PUT', body: JSON.stringify(body) });
      setVocab(mergeTagDefaults(saved));
      setSaveStatus({ ok: true, text: '✓ Saved' });
      setTimeout(() => setSaveStatus(null), 2200);
    } catch (e) {
      setSaveStatus({ ok: false, text: (e as Error).message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5 md:p-7">
      {/* Header */}
      <div className="bg-brand-bg border border-brand/20 border-l-[3px] border-l-brand rounded-[10px] px-4 py-3 mb-6 text-[13px] text-ink/70 leading-relaxed flex flex-wrap items-center justify-between gap-3">
        <span>
          <strong className="font-semibold text-brand">Tag vocabulary</strong>
          {' '}Controlled list behind every filter and chip. Recipes can only carry codes defined here.
          {' '}<em>Changes save automatically as you edit.</em>
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-[11px] text-ink/40 animate-pulse">Saving…</span>}
          {saveStatus && (
            <span className={`text-[12px] font-semibold ${saveStatus.ok ? 'text-brand' : 'text-clay'}`}>
              {saveStatus.ok ? saveStatus.text : `⚠ ${saveStatus.text}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {FACETS.map(({ facet, label, desc }) => (
          <FacetSection
            key={facet}
            facet={facet}
            label={label}
            desc={desc}
            rows={vocab[facet]}
            onCommit={rows => commit({ ...vocab, [facet]: rows })}
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
}

// ── FacetSection ──────────────────────────────────────────────────────────────

function FacetSection({
  facet, label, desc, rows, onCommit, saving,
}: {
  facet:    keyof Vocab;
  label:    string;
  desc:     string;
  rows:     VocabValue[];
  onCommit: (rows: VocabValue[]) => void;
  saving:   boolean;
}) {
  const isFilter = facet === 'filter';

  // new-row state
  const [newLabel, setNewLabel] = useState('');
  const [newCode,  setNewCode]  = useState('');
  const [newGroup, setNewGroup] = useState<Group>('effort');
  const [addErr,   setAddErr]   = useState<string | null>(null);

  // Helpers
  const updateRow = (i: number, patch: Partial<VocabValue>): VocabValue[] =>
    rows.map((r, j) => j === i ? { ...r, ...patch } : r);

  const moveRow = (i: number, dir: -1 | 1): VocabValue[] => {
    const next = [...rows];
    const j = i + dir;
    if (j < 0 || j >= next.length) return rows;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };

  function addRow() {
    setAddErr(null);
    const lbl  = newLabel.trim();
    const code = (newCode.trim() || slug(lbl));
    if (!lbl)  { setAddErr('Label is required.'); return; }
    if (!code) { setAddErr('Could not derive a code — enter it manually.'); return; }
    if (rows.some(r => r.code === code)) { setAddErr(`"${code}" already exists in this facet.`); return; }
    const row: VocabValue = {
      code, label: lbl, order: rows.length + 1, enabled: true,
      ...(isFilter ? { group: newGroup } : {}),
    };
    setNewLabel(''); setNewCode(''); setNewGroup('effort');
    onCommit([...rows, row]);
  }

  const activeCount = rows.filter(r => r.enabled !== false).length;

  return (
    <div className="rounded-[14px] border border-ink/[0.11] overflow-hidden">

      {/* Section header */}
      <div className="bg-sand px-4 py-2.5 border-b border-ink/[0.11] flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-ink/65">{label}</span>
        <span className="text-[12px] text-ink/40">{desc}</span>
        <span className="ml-auto text-[11px] text-ink/35 tabular-nums">
          {activeCount} of {rows.length} active
        </span>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-sand/30 border-b border-ink/[0.08] text-[10px] font-bold uppercase tracking-[0.07em] text-ink/40">
            <th className="w-12 px-3 py-2 text-center">Order</th>
            <th className="w-[150px] px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Label</th>
            {isFilter && <th className="w-[130px] px-3 py-2 text-left">Group</th>}
            <th className="w-16 px-3 py-2 text-center">Shown</th>
            <th className="w-8" />
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={isFilter ? 6 : 5} className="px-4 py-6 text-center text-[12.5px] text-ink/35 italic">
                No values yet — add one below.
              </td>
            </tr>
          )}

          {rows.map((row, i) => (
            <tr
              key={row.code}
              className={[
                'border-b border-ink/[0.06] last:border-0 group transition-colors hover:bg-cream/50',
                row.enabled === false ? 'opacity-50' : '',
              ].join(' ')}
            >
              {/* Order */}
              <td className="px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <button type="button" disabled={i === 0 || saving}
                    onClick={() => onCommit(moveRow(i, -1))}
                    className="text-ink/35 hover:text-ink disabled:opacity-20 px-1 text-[13px] transition-colors">↑</button>
                  <button type="button" disabled={i === rows.length - 1 || saving}
                    onClick={() => onCommit(moveRow(i, 1))}
                    className="text-ink/35 hover:text-ink disabled:opacity-20 px-1 text-[13px] transition-colors">↓</button>
                </div>
              </td>

              {/* Code — readonly badge */}
              <td className="px-3 py-2">
                <span className="font-mono text-[10.5px] font-bold text-ink/45 bg-sand px-2 py-0.5 rounded-[5px] select-all">
                  {row.code}
                </span>
              </td>

              {/* Label — controlled, saves on blur */}
              <td className="px-3 py-2">
                <LabelInput
                  initialValue={row.label}
                  syncKey={row.code}
                  onBlurSave={val => onCommit(updateRow(i, { label: val }))}
                />
              </td>

              {/* Group — filter facet only */}
              {isFilter && (
                <td className="px-3 py-2">
                  <select
                    aria-label={`${row.label} group`}
                    value={row.group ?? ''}
                    onChange={e => onCommit(updateRow(i, { group: e.target.value }))}
                    className={`${INP} cursor-pointer`}
                  >
                    <option value="">— group —</option>
                    {GROUPS.map(g => (
                      <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                    ))}
                  </select>
                </td>
              )}

              {/* Shown */}
              <td className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={row.enabled !== false}
                  onChange={() => onCommit(updateRow(i, { enabled: !(row.enabled !== false) }))}
                  aria-label={`Show ${row.label}`}
                  className="w-4 h-4 accent-brand cursor-pointer"
                />
              </td>

              {/* Remove */}
              <td className="px-2 py-2 text-center">
                <button
                  type="button"
                  aria-label={`Remove ${row.label}`}
                  onClick={() => onCommit(rows.filter((_, j) => j !== i))}
                  className="text-clay/40 hover:text-clay text-[18px] leading-none opacity-0 group-hover:opacity-100 transition-colors"
                >×</button>
              </td>
            </tr>
          ))}

          {/* ── Inline add-new row ── */}
          <tr className="border-t-[2px] border-brand/20 bg-brand/[0.03]">
            <td className="px-3 py-2.5 text-center">
              <span className="text-[10px] font-bold text-brand/55 uppercase tracking-wider">New</span>
            </td>
            {/* Code — optional, auto-derived from label */}
            <td className="px-3 py-2.5">
              <input
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder={newLabel ? (slug(newLabel) || 'code') : 'auto'}
                aria-label={`${label} new code`}
                className="w-full font-mono text-[11px] border border-ink/[0.11] rounded-[7px] px-2.5 py-1.5 bg-cream text-ink/60 placeholder:text-ink/25 focus:outline-none focus:ring-1 focus:ring-brand/30"
                onKeyDown={e => e.key === 'Enter' && addRow()}
              />
            </td>
            {/* Label */}
            <td className="px-3 py-2.5">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Display label"
                aria-label={`${label} new label`}
                className={INP}
                onKeyDown={e => e.key === 'Enter' && addRow()}
              />
            </td>
            {/* Group — filter only */}
            {isFilter && (
              <td className="px-3 py-2.5">
                <select
                  value={newGroup}
                  onChange={e => setNewGroup(e.target.value as Group)}
                  aria-label="New filter group"
                  className={`${INP} cursor-pointer`}
                >
                  {GROUPS.map(g => (
                    <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                  ))}
                </select>
              </td>
            )}
            {/* Shown placeholder */}
            <td className="px-3 py-2.5 text-center">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-brand opacity-30" />
            </td>
            {/* Add button */}
            <td className="px-2 py-2.5">
              <button
                type="button"
                onClick={addRow}
                disabled={!newLabel.trim()}
                className="text-[11px] font-bold text-brand hover:opacity-70 disabled:opacity-30 transition-opacity whitespace-nowrap"
              >
                + Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Add error */}
      {addErr && (
        <p className="px-4 py-2 text-[12px] text-clay font-medium bg-clay/[0.04] border-t border-clay/20">
          ⚠ {addErr}
        </p>
      )}
    </div>
  );
}

// ── LabelInput — controlled input that syncs from parent without clobbering edits ──

/**
 * An input that keeps a local copy of the value for smooth typing,
 * re-syncs from the parent only when `syncKey` changes (i.e. a different row),
 * and calls `onBlurSave` when the user finishes editing.
 */
function LabelInput({
  initialValue, syncKey, onBlurSave,
}: {
  initialValue: string;
  syncKey:      string;
  onBlurSave:   (val: string) => void;
}) {
  const [val,     setVal]     = useState(initialValue);
  const [focused, setFocused] = useState(false);

  // Sync from parent when the row identity changes; never clobber mid-edit.
  useEffect(() => {
    if (!focused) setVal(initialValue);
  }, [syncKey, initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      value={val}
      onChange={e => setVal(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (val.trim() && val.trim() !== initialValue) onBlurSave(val.trim());
      }}
      className={INP}
    />
  );
}
