import { useEffect, useState } from 'react';
import { api } from '../api/client';

const CONDITIONS = [
  { code: 'CARDIAC',            emoji: '❤️',  label: 'Cardiac',          defaultDesc: 'Heart conditions — avoid high-sodium, high-fat preparations.' },
  { code: 'DIABETES',           emoji: '🩸',  label: 'Diabetes',         defaultDesc: 'High blood sugar — avoid recipes high in simple carbohydrates.' },
  { code: 'OBESITY',            emoji: '⚖️',  label: 'Obesity',          defaultDesc: 'Weight management — prefer low-calorie, high-fibre preparations.' },
  { code: 'LACTOSE_INTOLERANT', emoji: '🥛',  label: 'Lactose Intolerant', defaultDesc: 'Dairy intolerance — exclude milk-based ingredients.' },
  { code: 'SEDENTARY',          emoji: '🪑',  label: 'Sedentary Lifestyle', defaultDesc: 'Low activity — prefer easily digestible, light recipes.' },
  { code: 'PREGNANT',           emoji: '🤱',  label: 'Pregnancy',        defaultDesc: 'Pregnancy — avoid bitter, pungent, or uterine-stimulating foods.' },
  { code: 'LACTATING',          emoji: '🍼',  label: 'Lactating',        defaultDesc: 'Lactation — favour galactagogues; avoid strong spices.' },
  { code: 'NUT_ALLERGY',        emoji: '🥜',  label: 'Nut Allergy',      defaultDesc: 'Tree nut or peanut allergy — exclude all nut-derived ingredients.' },
  { code: 'INFANT_8M',          emoji: '👶',  label: 'Infant (8m+)',     defaultDesc: 'Complementary feeding — soft textures, no added salt or sugar.' },
  { code: 'ELDERLY',            emoji: '🧓',  label: 'Elderly / Frail',  defaultDesc: 'Older adults — easy-to-chew, low-spice, easy to digest.' },
];

type FlagState = { label: string; description: string };
type FlagsMap  = Record<string, FlagState>;

interface NewFlag {
  code: string;
  emoji: string;
  label: string;
  description: string;
}

function defaultFlags(): FlagsMap {
  return Object.fromEntries(CONDITIONS.map(c => [c.code, { label: c.label, description: c.defaultDesc }]));
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
        setFlags(f => {
          const next = { ...defaultFlags(), ...f };
          for (const [code, patch] of Object.entries(saved)) {
            next[code] = { ...next[code], ...patch } as FlagState;
          }
          return next;
        });
      })
      .catch(() => { /* endpoint unreachable — defaults stay */ });
  }, []);

  const update = (code: string, patch: Partial<FlagState>) =>
    setFlags(f => ({ ...f, [code]: { ...f[code], ...patch } }));

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
    const code = newFlag.code.toUpperCase().replace(/\s+/g, '_');
    setFlags(f => ({ ...f, [code]: { label: newFlag.label, description: newFlag.description } }));
    setAdding(false);
    setNewFlag({ code: '', emoji: '🏳️', label: '', description: '' });
  }

  // All rendered conditions = built-in + any custom ones added to flags not in CONDITIONS
  const builtInCodes = new Set(CONDITIONS.map(c => c.code));
  const customCodes  = Object.keys(flags).filter(k => !builtInCodes.has(k));

  const inp = 'w-full border border-ink/[0.11] rounded-[8px] px-2.5 py-[6.5px] bg-cream text-[12.5px] text-ink placeholder:text-ink/35';

  return (
    <div className="p-5 md:p-7">
      {/* Info callout */}
      <div className="bg-sky-bg border border-sky/20 border-l-[3px] border-l-sky rounded-[10px] px-4 py-3 mb-5 text-[13px] text-ink/70 leading-relaxed">
        <strong className="font-semibold text-sky">What are health flags?</strong>
        {' '}Each flag maps a medical or dietary condition to a per-recipe safety signal.
        App users who set a condition on their health profile will see{' '}
        <em>Safe</em>, <em>Caution</em>, or <em>Avoid</em> labels on recipes automatically —
        the severity for each recipe is set in the Recipe Editor (Step 4).
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-[13px] text-ink/55">
          Customise the labels and descriptions shown to users.
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

        {/* Built-in conditions */}
        {CONDITIONS.map(c => (
          <FlagCard
            key={c.code}
            emoji={c.emoji}
            code={c.code}
            label={flags[c.code]?.label ?? c.label}
            description={flags[c.code]?.description ?? c.defaultDesc}
            onLabelChange={v => update(c.code, { label: v })}
            onDescChange={v  => update(c.code, { description: v })}
            inp={inp}
          />
        ))}

        {/* Custom flags added by admin */}
        {customCodes.map(code => (
          <FlagCard
            key={code}
            emoji="🏷️"
            code={code}
            label={flags[code].label}
            description={flags[code].description}
            onLabelChange={v => update(code, { label: v })}
            onDescChange={v  => update(code, { description: v })}
            inp={inp}
            onRemove={() => setFlags(f => {
              const next = { ...f };
              delete next[code];
              return next;
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
                placeholder="CONDITION_CODE"
                className="flex-1 font-mono text-[10.5px] uppercase border border-ink/[0.11] rounded-[6px] px-2 py-[6px] bg-cream tracking-wide text-ink placeholder:text-ink/30"
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

function FlagCard({ emoji, code, label, description, onLabelChange, onDescChange, inp, onRemove }: {
  emoji: string; code: string; label: string; description: string;
  onLabelChange: (v: string) => void;
  onDescChange:  (v: string) => void;
  inp: string;
  onRemove?: () => void;
}) {
  return (
    <div className="bg-bone border border-ink/[0.11] rounded-[14px] p-4 shadow-[0_1px_3px_rgba(42,37,30,.07)]">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[22px] leading-none">{emoji}</span>
        {onRemove && (
          <button type="button" onClick={onRemove}
            className="text-[11px] text-clay hover:underline">Remove</button>
        )}
      </div>
      <span className="block text-[9px] font-[800] tracking-[0.08em] uppercase text-ink/35 font-mono mb-3">{code}</span>

      <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/40 mb-1.5">
        Display label
      </label>
      <input
        value={label}
        onChange={e => onLabelChange(e.target.value)}
        className={`${inp} mb-3`}
      />
      <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/40 mb-1.5">
        Description
      </label>
      <textarea
        rows={2}
        value={description}
        onChange={e => onDescChange(e.target.value)}
        className={`${inp} resize-none text-[12px]`}
      />
    </div>
  );
}
