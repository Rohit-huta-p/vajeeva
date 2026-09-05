import { useEffect, useState } from 'react';
import { api } from '../api/client';

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

const BUILTIN = new Set(CONDITIONS.map(c => c.code));

function defaultFlags(): FlagsMap {
  return Object.fromEntries(
    CONDITIONS.map((c, i) => [
      c.code,
      { label: c.label, description: c.defaultDesc, emoji: c.emoji, order: i + 1, enabled: true },
    ]),
  );
}
function blankState(): FlagState {
  return { label: '', description: '', emoji: '🏷️', order: 0, enabled: true };
}
function sorted(f: FlagsMap): [string, FlagState][] {
  return Object.entries(f).sort((a, b) => (a[1].order - b[1].order) || a[0].localeCompare(b[0]));
}
function maxOrder(f: FlagsMap) {
  return Object.values(f).reduce((m, s) => Math.max(m, s.order), 0);
}
function toSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const INP = 'w-full border border-ink/[0.11] rounded-[7px] px-2.5 py-1.5 bg-cream text-[12.5px] text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-brand/30';

export function HealthFlagsPage() {
  const [flags,   setFlags]   = useState<FlagsMap>(defaultFlags);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // New-flag inline row state
  const [newCode,  setNewCode]  = useState('');
  const [newEmoji, setNewEmoji] = useState('🏷️');
  const [newLabel, setNewLabel] = useState('');
  const [newDesc,  setNewDesc]  = useState('');
  const [addErr,   setAddErr]   = useState<string | null>(null);

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
      .catch(() => {});
  }, []);

  const update = (code: string, patch: Partial<FlagState>) =>
    setFlags(f => ({ ...f, [code]: { ...f[code], ...patch } }));

  const move = (code: string, dir: -1 | 1) =>
    setFlags(f => {
      const rows = sorted(f);
      const idx  = rows.findIndex(([c]) => c === code);
      const swap = idx + dir;
      if (swap < 0 || swap >= rows.length) return f;
      const [ca, sa] = rows[idx];
      const [cb, sb] = rows[swap];
      return { ...f, [ca]: { ...sa, order: sb.order }, [cb]: { ...sb, order: sa.order } };
    });

  async function handleSaveAll() {
    setSaving(true); setSaveMsg(null);
    try {
      await api('/api/admin/health-flags', { method: 'PUT', body: JSON.stringify(flags) });
      setSaveMsg({ ok: true, text: '✓ Saved.' });
    } catch (e) {
      setSaveMsg({ ok: false, text: (e as Error).message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  function commitNewFlag() {
    setAddErr(null);
    const code = toSlug(newCode);
    if (!code)        { setAddErr('Condition code is required.'); return; }
    if (!newLabel.trim()) { setAddErr('Display label is required.'); return; }
    if (flags[code])  { setAddErr(`Code "${code}" already exists.`); return; }
    setFlags(f => ({
      ...f,
      [code]: { label: newLabel.trim(), description: newDesc.trim(), emoji: newEmoji, order: maxOrder(f) + 1, enabled: true },
    }));
    setNewCode(''); setNewEmoji('🏷️'); setNewLabel(''); setNewDesc(''); setAddErr(null);
  }

  const rows = sorted(flags);

  return (
    <div className="p-5 md:p-7">
      {/* Info callout */}
      <div className="bg-sky-bg border border-sky/20 border-l-[3px] border-l-sky rounded-[10px] px-4 py-3 mb-5 text-[13px] text-ink/70 leading-relaxed">
        <strong className="font-semibold text-sky">What are health flags?</strong>
        {' '}Each flag maps a condition to a per-recipe safety signal.
        App users pick conditions on their health profile and see{' '}
        <em>Safe</em>, <em>Caution</em>, or <em>Avoid</em> labels automatically —
        severity per recipe is set in the Recipe Editor (Step 4).
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-[13px] text-ink/55">
          Add, enable, reorder, and customise the conditions shown to users.
          Changes only take effect after <strong>Save all</strong>.
        </p>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-[12px] font-medium ${saveMsg.ok ? 'text-brand' : 'text-clay'}`}>
              {saveMsg.ok ? saveMsg.text : `⚠ ${saveMsg.text}`}
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

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-[14px] border border-ink/[0.11]">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-sand border-b border-ink/[0.11]">
              <th className="w-14 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 text-center">Order</th>
              <th className="w-10 px-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 text-center">Icon</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 text-left w-[140px]">Code</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 text-left w-[160px]">Label</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 text-left">Description</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 text-center w-20">Shown</th>
              <th className="w-9" />
            </tr>
          </thead>

          <tbody>
            {rows.map(([code, state], i) => (
              <tr
                key={code}
                className={[
                  'border-b border-ink/[0.06] last:border-0 group transition-colors hover:bg-cream/50',
                  state.enabled ? '' : 'opacity-50',
                ].join(' ')}
              >
                {/* Order */}
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <button type="button" aria-label={`Move ${code} up`} disabled={i === 0}
                      onClick={() => move(code, -1)}
                      className="text-ink/40 hover:text-ink disabled:opacity-20 px-1 text-[14px] transition-colors">↑</button>
                    <button type="button" aria-label={`Move ${code} down`} disabled={i === rows.length - 1}
                      onClick={() => move(code, 1)}
                      className="text-ink/40 hover:text-ink disabled:opacity-20 px-1 text-[14px] transition-colors">↓</button>
                  </div>
                </td>

                {/* Emoji */}
                <td className="px-2 py-2 text-center text-[18px] leading-none">
                  <input
                    value={state.emoji}
                    onChange={e => update(code, { emoji: e.target.value })}
                    maxLength={2}
                    aria-label={`${code} emoji`}
                    className="w-9 text-center text-[18px] bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-brand/30 rounded"
                  />
                </td>

                {/* Code */}
                <td className="px-3 py-2">
                  <span className="font-mono text-[10.5px] font-bold text-ink/50 bg-sand px-2 py-0.5 rounded-[5px]">
                    {code}
                  </span>
                </td>

                {/* Label */}
                <td className="px-3 py-2">
                  <input
                    value={state.label}
                    onChange={e => update(code, { label: e.target.value })}
                    aria-label={`${code} label`}
                    className={INP}
                  />
                </td>

                {/* Description */}
                <td className="px-3 py-2">
                  <input
                    value={state.description}
                    onChange={e => update(code, { description: e.target.value })}
                    aria-label={`${code} description`}
                    className={INP}
                  />
                </td>

                {/* Shown toggle */}
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={state.enabled}
                    onChange={() => update(code, { enabled: !state.enabled })}
                    aria-label={`${code} shown to users`}
                    className="w-4 h-4 accent-brand cursor-pointer"
                  />
                </td>

                {/* Remove (custom flags only) */}
                <td className="px-2 py-2 text-center">
                  {!BUILTIN.has(code) && (
                    <button
                      type="button"
                      aria-label={`Remove ${code}`}
                      onClick={() => setFlags(f => { const n = { ...f }; delete n[code]; return n; })}
                      className="text-clay/50 hover:text-clay text-[18px] leading-none transition-colors opacity-0 group-hover:opacity-100"
                    >×</button>
                  )}
                </td>
              </tr>
            ))}

            {/* ── Add new flag inline row ── */}
            <tr className="border-t-[2px] border-brand/20 bg-brand/[0.03]">
              <td className="px-3 py-2.5 text-center">
                <span className="text-[10px] font-bold text-brand/60 uppercase tracking-wider">New</span>
              </td>
              <td className="px-2 py-2.5 text-center">
                <input
                  value={newEmoji}
                  onChange={e => setNewEmoji(e.target.value)}
                  maxLength={2}
                  aria-label="New flag emoji"
                  className="w-9 text-center text-[18px] bg-transparent border border-ink/[0.11] rounded focus:outline-none focus:ring-1 focus:ring-brand/30"
                />
              </td>
              <td className="px-3 py-2.5">
                <input
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  placeholder="condition-code"
                  aria-label="New flag code"
                  className="w-full font-mono text-[11px] lowercase border border-ink/[0.11] rounded-[7px] px-2.5 py-1.5 bg-cream text-ink/70 placeholder:text-ink/25 focus:outline-none focus:ring-1 focus:ring-brand/30"
                  onKeyDown={e => e.key === 'Enter' && commitNewFlag()}
                />
              </td>
              <td className="px-3 py-2.5">
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Display label"
                  aria-label="New flag label"
                  className={INP}
                  onKeyDown={e => e.key === 'Enter' && commitNewFlag()}
                />
              </td>
              <td className="px-3 py-2.5">
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  aria-label="New flag description"
                  className={INP}
                  onKeyDown={e => e.key === 'Enter' && commitNewFlag()}
                />
              </td>
              <td className="px-3 py-2.5 text-center">
                <input type="checkbox" checked disabled className="w-4 h-4 accent-brand opacity-40" />
              </td>
              <td className="px-2 py-2.5">
                <button
                  type="button"
                  onClick={commitNewFlag}
                  className="text-[11px] font-bold text-brand hover:opacity-70 transition-opacity whitespace-nowrap"
                >
                  + Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add error */}
      {addErr && (
        <p className="mt-2 text-[12px] text-clay font-medium">⚠ {addErr}</p>
      )}

      <p className="mt-3 text-[11.5px] text-ink/35">
        Built-in flags cannot be removed — disable <em>Shown</em> to hide them from users.
        Changes only persist after <strong>Save all</strong>.
      </p>
    </div>
  );
}
