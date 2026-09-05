import { useState } from 'react';
import type { RecipeInput } from '@vajeeva/shared';

type HealthFlag = RecipeInput['healthFlags'][number];

export interface ConditionOption { code: string; label: string }

// ── Severity display config ───────────────────────────────────────────────────
const SEV_STYLE: Record<string, string> = {
  safe:        'text-brand bg-brand/10 border-brand/20',
  caution:     'text-amber bg-amber/10 border-amber/20',
  avoid:       'text-clay  bg-clay/10  border-clay/20',
  indication:  'text-ink   bg-sand     border-ink/20',
};
const SEV_LABELS: Record<string, string> = {
  safe: 'Safe', caution: 'Caution', avoid: 'Avoid', indication: 'Indication',
};

const INP = 'w-full border border-ink/[0.11] rounded-[7px] px-2.5 py-1.5 bg-cream text-[12.5px] text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-brand/30';

// ── Component ─────────────────────────────────────────────────────────────────
export function HealthFlagRows({ value, onChange, conditions = [], onAutoSave }: {
  value:       HealthFlag[];
  onChange:    (next: HealthFlag[]) => void;
  conditions?: ConditionOption[];
  /** Called after every mutation. Throws on API error — component shows the message. */
  onAutoSave?: (next: HealthFlag[]) => Promise<void>;
}) {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const known = new Set(conditions.map(c => c.code));

  async function commit(next: HealthFlag[]) {
    onChange(next);
    if (!onAutoSave) return;
    setSaving(true); setStatus(null);
    try {
      await onAutoSave(next);
      setStatus({ ok: true, text: '✓ Saved' });
      setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      const msg = (e as Error).message || 'Save failed';
      setStatus({ ok: false, text: msg });
    } finally {
      setSaving(false);
    }
  }

  function set(i: number, patch: Partial<HealthFlag>, autoSave = false) {
    const next = value.map((row, j) => j === i ? { ...row, ...patch } : row);
    if (autoSave) {
      commit(next);
    } else {
      onChange(next);
    }
  }

  function addFlag() {
    const next = [...value, { condition: '', severity: 'caution' as const, note: '', source: 'manual' as const }];
    commit(next);
  }

  function removeFlag(i: number) {
    commit(value.filter((_, j) => j !== i));
  }

  return (
    <div>
      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-[12px] border border-ink/[0.11]">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-sand border-b border-ink/[0.11]">
              <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 w-[200px]">
                Condition
              </th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 w-[130px]">
                Severity
              </th>
              <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45">
                Note
              </th>
              <th className="w-9" />
            </tr>
          </thead>
          <tbody>
            {value.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-5 text-center text-[12.5px] text-ink/35 italic">
                  No health flags yet — add one below.
                </td>
              </tr>
            )}
            {value.map((row, i) => (
              <tr
                key={i}
                className={[
                  'border-b border-ink/[0.06] last:border-0 group transition-colors',
                  'hover:bg-cream/60',
                ].join(' ')}
              >
                {/* Condition */}
                <td className="px-3 py-2">
                  {conditions.length > 0 ? (
                    <select
                      aria-label={`Flag ${i + 1} condition`}
                      value={row.condition}
                      onChange={e => set(i, { condition: e.target.value }, true)}
                      className={`${INP} cursor-pointer`}
                    >
                      <option value="">Select condition…</option>
                      {row.condition && !known.has(row.condition) && (
                        <option value={row.condition}>{row.condition} (retired)</option>
                      )}
                      {conditions.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={`Flag ${i + 1} condition`}
                      placeholder="e.g. diabetes"
                      value={row.condition}
                      onChange={e => set(i, { condition: e.target.value })}
                      onBlur={() => commit(value)}
                      className={INP}
                    />
                  )}
                </td>

                {/* Severity */}
                <td className="px-3 py-2">
                  <select
                    aria-label={`Flag ${i + 1} severity`}
                    value={row.severity}
                    onChange={e => set(i, { severity: e.target.value as HealthFlag['severity'] }, true)}
                    className={[
                      'border rounded-[7px] px-2.5 py-1.5 text-[12px] font-semibold cursor-pointer focus:outline-none w-full',
                      SEV_STYLE[row.severity] ?? SEV_STYLE.indication,
                    ].join(' ')}
                  >
                    {Object.entries(SEV_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>

                {/* Note */}
                <td className="px-3 py-2">
                  <input
                    aria-label={`Flag ${i + 1} note`}
                    placeholder="Optional — e.g. prefer low-GI meals"
                    value={row.note}
                    onChange={e => set(i, { note: e.target.value })}
                    onBlur={() => commit(value)}
                    className={INP}
                  />
                </td>

                {/* Remove */}
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    aria-label={`Remove flag ${i + 1}`}
                    onClick={() => removeFlag(i)}
                    className="text-clay/50 hover:text-clay text-[18px] leading-none transition-colors opacity-0 group-hover:opacity-100"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer: add button + save status ── */}
      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={addFlag}
          disabled={saving}
          className="border border-dashed border-ink/[0.20] rounded-[9px] px-4 py-2 text-[12.5px] text-ink/50 hover:border-brand hover:text-brand disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving…' : '+ Add health flag'}
        </button>

        {status && (
          <p className={[
            'text-[12px] font-medium transition-all',
            status.ok ? 'text-brand' : 'text-clay',
          ].join(' ')}>
            {status.ok ? status.text : `⚠ ${status.text}`}
          </p>
        )}
      </div>

      {/* Hint when vocab not loaded */}
      {conditions.length === 0 && (
        <p className="mt-2 text-[11px] text-ink/35 italic">
          Condition vocabulary not loaded — type the code directly (e.g. <code>diabetes</code>).
          It will match once the vocabulary is seeded.
        </p>
      )}
    </div>
  );
}
