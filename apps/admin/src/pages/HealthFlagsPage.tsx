import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Built-in defaults mirror the seed (apps/api/src/scripts/seed-healthflags.ts).
// Codes are lowercase slugs — the single condition vocabulary shared by the patient
// health-profile grid and recipe health-flags. See
// docs/specs/2026-09-03-condition-vocabulary.md.
const CONDITIONS = [
  { code: 'diabetes',            emoji: '🩸', label: 'Diabetes',            defaultDesc: 'High blood sugar — avoid recipes high in simple carbohydrates.' },
  { code: 'obesity',             emoji: '⚖️', label: 'Obesity',             defaultDesc: 'Weight management — prefer low-calorie, high-fibre preparations.' },
  { code: 'lactose-intolerance', emoji: '🥛', label: 'Lactose intolerance', defaultDesc: 'Dairy intolerance — exclude milk-based ingredients.' },
  { code: 'sedentary',           emoji: '🪑', label: 'Sedentary lifestyle', defaultDesc: 'Low activity — prefer easily digestible, light recipes.' },
  { code: 'cardiac',             emoji: '❤️', label: 'Cardiac',             defaultDesc: 'Heart conditions — avoid high-sodium, high-fat preparations.' },
  { code: 'pregnancy',           emoji: '🤱', label: 'Pregnancy',           defaultDesc: 'Pregnancy — avoid bitter, pungent, or uterine-stimulating foods.' },
  { code: 'lactating',           emoji: '🍼', label: 'Lactating',           defaultDesc: 'Lactation — favour galactagogues; avoid strong spices.' },
  { code: 'nut-allergy',         emoji: '🥜', label: 'Nut allergy',         defaultDesc: 'Tree nut or peanut allergy — exclude all nut-derived ingredients.' },
  { code: 'infant-8m',           emoji: '👶', label: 'Infant (8m+)',        defaultDesc: 'Complementary feeding — soft textures, no added salt or sugar.' },
  { code: 'elderly',             emoji: '🧓', label: 'Elderly / frail',     defaultDesc: 'Older adults — easy-to-chew, low-spice, easy to digest.' },
  { code: 'gluten',              emoji: '🌾', label: 'Gluten',              defaultDesc: 'Gluten sensitivity — exclude wheat, barley, and rye.' },
  { code: 'anemia',              emoji: '🍃', label: 'Anemia',              defaultDesc: 'Low iron — favour iron-rich foods; watch iron-blockers.' },
  { code: 'acidity',             emoji: '🔥', label: 'Acidity',             defaultDesc: 'Acid reflux — avoid very sour, spicy, or fried preparations.' },
  { code: 'indigestion',         emoji: '🌀', label: 'Indigestion',         defaultDesc: 'Weak digestion — prefer light, easily digestible foods.' },
];

type FlagState = { label: string; description: string; emoji: string; order: number; enabled: boolean };
type FlagsMap  = Record<string, FlagState>;

interface NewFlag {
  code: string;
  emoji: string;
  label: string;
  description: string;
}

const builtInCodes = new Set(CONDITIONS.map(c => c.code));

function defaultFlags(): FlagsMap {
  return Object.fromEntries(
    CONDITIONS.map((c, i) => [
      c.code,
      { label: c.label, description: c.defaultDesc, emoji: c.emoji, order: i + 1, enabled: true },
    ]),
  );
}

export function HealthFlagsPage() {
  const [flags,   setFlags]   = useState<FlagsMap>(defaultFlags);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adding,  setAdding]  = useState(false);
  const [newFlag, setNewFlag] = useState<NewFlag>({ code: '', emoji: '🏳️', label: '', description: '' });

  useEffect(() => {
    api<Record<string, Partial<FlagState>>>('/api/admin/health-flags')
      .then(saved => {
        if (!saved || typeof saved !== 'object') return;
        setFlags(() => {
          const next = defaultFlags();
          for (const [code, patch] of Object.entries(saved)) {
            next[code] = { ...(next[code] ?? blankState()), ...patch } as FlagState;
          }
          return next;
        });
      })
      .catch(() => { /* endpoint unreachable — defaults stay */ });
  }, []);

  const update = (code: string, patch: Partial<FlagState>) =>
    setFlags(f => ({ ...f, [code]: { ...f[code], ...patch } }));

  // Swap this flag's `order` with its neighbour in the sorted list.
  const move = (code: string, dir: -1 | 1) =>
    setFlags(f => {
      const sorted = sortedEntries(f);
      const idx = sorted.findIndex(([c]) => c === code);
      const swap = idx + dir;
      if (swap < 0 || swap >= sorted.length) return f;
      const [ca, sa] = sorted[idx];
      const [cb, sb] = sorted[swap];
      return { ...f, [ca]: { ...sa, order: sb.order }, [cb]: { ...sb, order: sa.order } };
    });

  async function handleSaveAll() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await api('/api/admin/health-flags', { method: 'PUT', body: JSON.stringify(flags) });
      setSaveMsg({ ok: true, text: 'Saved.' });
    } catch (e) {
      setSaveMsg({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  function commitNewFlag() {
    if (!newFlag.code.trim() || !newFlag.label.trim()) return;
    const code = newFlag.code.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFlags(f => ({
      ...f,
      [code]: {
        label: newFlag.label,
        description: newFlag.description,
        emoji: newFlag.emoji,
        order: maxOrder(f) + 1,
        enabled: true,
      },
    }));
    setAdding(false);
    setNewFlag({ code: '', emoji: '🏳️', label: '', description: '' });
  }

  const sorted = sortedEntries(flags);
  const inp = 'w-full border border-ink/[0.11] rounded-[8px] px-2.5 py-[6.5px] bg-cream text-[12.5px] text-ink placeholder:text-ink/35';

  return (
    <div className="p-5 md:p-7">
      {/* Info callout */}
      <div className="bg-sky-bg border border-sky/20 border-l-[3px] border-l-sky rounded-[10px] px-4 py-3 mb-5 text-[13px] text-ink/70 leading-relaxed">
        <strong className="font-semibold text-sky">What are health flags?</strong>
        {' '}Each flag maps a medical or dietary condition to a per-recipe safety signal.
        App users pick these on their health profile and see{' '}
        <em>Safe</em>, <em>Caution</em>, or <em>Avoid</em> labels on recipes automatically —
        the severity for each recipe is set in the Recipe Editor (Step 4).
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-[13px] text-ink/55">
          Add, enable, reorder, and customise the conditions shown to users.
        </p>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-[12px] font-medium ${saveMsg.ok ? 'text-brand' : 'text-clay'}`}>
              {saveMsg.text}
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-brand text-white rounded-[10px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>

      {/* Flags grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sorted.map(([code, state], i) => (
          <FlagCard
            key={code}
            code={code}
            state={state}
            inp={inp}
            isFirst={i === 0}
            isLast={i === sorted.length - 1}
            onLabelChange={v => update(code, { label: v })}
            onDescChange={v  => update(code, { description: v })}
            onToggle={()     => update(code, { enabled: !state.enabled })}
            onUp={()         => move(code, -1)}
            onDown={()       => move(code, 1)}
            onRemove={builtInCodes.has(code) ? undefined : () => setFlags(f => {
              const nextMap = { ...f };
              delete nextMap[code];
              return nextMap;
            })}
          />
        ))}

        {/* Add new flag card */}
        {adding ? (
          <div className="bg-bone border-[2px] border-brand rounded-[14px] p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                value={newFlag.emoji}
                onChange={e => setNewFlag(f => ({ ...f, emoji: e.target.value }))}
                className="w-[48px] text-center text-[20px] border border-ink/[0.11] rounded-[6px] py-1 bg-cream"
                maxLength={2}
              />
              <input
                value={newFlag.code}
                onChange={e => setNewFlag(f => ({ ...f, code: e.target.value }))}
                placeholder="condition-code"
                className="flex-1 font-mono text-[10.5px] lowercase border border-ink/[0.11] rounded-[6px] px-2 py-[6px] bg-cream tracking-wide text-ink placeholder:text-ink/30"
              />
            </div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/40 mb-1.5">Display label</label>
            <input
              value={newFlag.label}
              onChange={e => setNewFlag(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Gluten-free"
              className={`${inp} mb-2`}
            />
            <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/40 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={newFlag.description}
              onChange={e => setNewFlag(f => ({ ...f, description: e.target.value }))}
              placeholder="Description shown to users…"
              className={`${inp} resize-none mb-3`}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAdding(false)}
                className="px-3 py-1.5 text-[12px] text-ink/55 hover:bg-sand rounded-[8px] transition-colors">
                Cancel
              </button>
              <button type="button" onClick={commitNewFlag}
                className="px-3 py-1.5 text-[12px] font-semibold bg-brand text-white rounded-[8px] hover:opacity-90 transition-opacity">
                Add Flag
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex flex-col items-center justify-center min-h-[182px] border-[2px] border-dashed border-ink/[0.18] rounded-[14px] gap-2 cursor-pointer hover:border-brand hover:bg-brand-bg transition-all group"
          >
            <span className="text-[26px] opacity-30 group-hover:opacity-60 transition-opacity">+</span>
            <span className="text-[12px] font-semibold text-ink/40 group-hover:text-brand transition-colors">Add new flag</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
function blankState(): FlagState {
  return { label: '', description: '', emoji: '🏷️', order: 0, enabled: true };
}
function sortedEntries(f: FlagsMap): [string, FlagState][] {
  return Object.entries(f).sort((a, b) => (a[1].order - b[1].order) || a[0].localeCompare(b[0]));
}
function maxOrder(f: FlagsMap): number {
  return Object.values(f).reduce((m, s) => Math.max(m, s.order), 0);
}

function FlagCard({ code, state, inp, isFirst, isLast, onLabelChange, onDescChange, onToggle, onUp, onDown, onRemove }: {
  code: string;
  state: FlagState;
  inp: string;
  isFirst: boolean;
  isLast: boolean;
  onLabelChange: (v: string) => void;
  onDescChange:  (v: string) => void;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className={`bg-bone border rounded-[14px] p-4 shadow-[0_1px_3px_rgba(42,37,30,.07)] transition-opacity ${state.enabled ? 'border-ink/[0.11]' : 'border-ink/[0.08] opacity-60'}`}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-[22px] leading-none">{state.emoji}</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label={`Move ${code} up`} disabled={isFirst}
            onClick={onUp} className="px-1 text-ink/45 disabled:opacity-25 hover:text-ink">↑</button>
          <button type="button" aria-label={`Move ${code} down`} disabled={isLast}
            onClick={onDown} className="px-1 text-ink/45 disabled:opacity-25 hover:text-ink">↓</button>
          {onRemove && (
            <button type="button" onClick={onRemove}
              className="text-[11px] text-clay hover:underline ml-1">Remove</button>
          )}
        </div>
      </div>
      <span className="block text-[9px] font-[800] tracking-[0.08em] uppercase text-ink/35 font-mono mb-3">{code}</span>

      <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/40 mb-1.5">
        Display label
      </label>
      <input
        value={state.label}
        onChange={e => onLabelChange(e.target.value)}
        className={`${inp} mb-3`}
      />
      <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/40 mb-1.5">
        Description
      </label>
      <textarea
        rows={2}
        value={state.description}
        onChange={e => onDescChange(e.target.value)}
        className={`${inp} resize-none text-[12px] mb-3`}
      />
      <label className="flex items-center gap-2 text-[12px] text-ink/70 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={onToggle}
          aria-label={`${code} shown to users`}
          className="accent-brand w-[15px] h-[15px]"
        />
        Shown to users
      </label>
    </div>
  );
}
