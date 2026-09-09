import { useState } from 'react';
import type { RecipeInput } from '@vajeeva/shared';

type HealthFlag = RecipeInput['healthFlags'][number];
type Severity = HealthFlag['severity']; // 'safe' | 'caution' | 'indication'

export interface ConditionOption { code: string; label: string }

// The three severity pills. Tap one to open a multi-select of the condition
// vocabulary and check every condition that has that severity for this recipe.
// A condition lives in exactly one severity (assigning it to one removes it from
// the others). Colours: Safe = brand/green, Indication = sky/blue, Caution = amber.
const PILLS: { severity: Severity; label: string; style: string; ring: string; dot: string }[] = [
  { severity: 'safe',       label: 'Safe',       style: 'bg-brand-bg text-brand border-brand/25', ring: 'ring-2 ring-brand/40', dot: 'bg-brand' },
  { severity: 'indication', label: 'Indication', style: 'bg-sky-bg text-sky border-sky/25',       ring: 'ring-2 ring-sky/40',   dot: 'bg-sky' },
  { severity: 'caution',    label: 'Caution',    style: 'bg-amber-bg text-amber border-amber/25', ring: 'ring-2 ring-amber/40', dot: 'bg-amber' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function HealthFlagRows({ value, onChange, conditions = [], onAutoSave }: {
  value:       HealthFlag[];
  onChange:    (next: HealthFlag[]) => void;
  conditions?: ConditionOption[];
  /** Called after every mutation. Throws on API error — component shows the message. */
  onAutoSave?: (next: HealthFlag[]) => Promise<void>;
}) {
  const [open,   setOpen]   = useState<Severity | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const severityOf = (code: string): Severity | undefined => value.find(f => f.condition === code)?.severity;
  const countFor   = (sev: Severity) => value.filter(f => f.severity === sev).length;
  const labelFor   = (code: string) => conditions.find(c => c.code === code)?.label ?? code;

  async function commit(next: HealthFlag[]) {
    onChange(next);
    if (!onAutoSave) return;
    setSaving(true); setStatus(null);
    try {
      await onAutoSave(next);
      setStatus({ ok: true, text: '✓ Saved' });
      setTimeout(() => setStatus(null), 2500);
    } catch (e) {
      setStatus({ ok: false, text: (e as Error).message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  // Assign a condition to a severity (or unassign if it's already there). A
  // condition can only be in one severity at a time.
  function toggle(code: string, sev: Severity) {
    const without = value.filter(f => f.condition !== code);
    const next = severityOf(code) === sev ? without : [...without, { condition: code, severity: sev }];
    commit(next);
  }

  return (
    <div>
      {/* ── Severity pills ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {PILLS.map(p => {
          const isOpen = open === p.severity;
          return (
            <button
              key={p.severity}
              type="button"
              onClick={() => setOpen(isOpen ? null : p.severity)}
              aria-expanded={isOpen}
              className={[
                'flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all',
                p.style, isOpen ? p.ring : '',
              ].join(' ')}
            >
              <span className={`w-2 h-2 rounded-full ${p.dot}`} />
              {p.label}
              <span className="tabular-nums text-[11px] opacity-70">{countFor(p.severity)}</span>
              <span className="text-[10px]">{isOpen ? '▴' : '▾'}</span>
            </button>
          );
        })}
        {saving && <span className="self-center text-[11.5px] text-ink/40">Saving…</span>}
        {status && (
          <span className={`self-center text-[12px] font-medium ${status.ok ? 'text-brand' : 'text-clay'}`}>
            {status.ok ? status.text : `⚠ ${status.text}`}
          </span>
        )}
      </div>

      {/* ── Multi-select for the open pill ── */}
      {open && (
        <div className="mt-3 border border-ink/[0.12] rounded-[12px] bg-bone p-3">
          {conditions.length === 0 ? (
            <p className="text-[12px] text-ink/40 italic px-1 py-2">
              Condition vocabulary not loaded — add conditions under Health Flags first.
            </p>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 mb-2 px-1">
                Conditions with <span className="text-ink/70">{PILLS.find(p => p.severity === open)!.label}</span> severity
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {conditions.map(c => {
                  const sev = severityOf(c.code);
                  const here = sev === open;
                  const elsewhere = sev && sev !== open ? sev : null;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      aria-label={c.label}
                      aria-pressed={here}
                      onClick={() => toggle(c.code, open)}
                      className={[
                        'flex items-center gap-2 rounded-[9px] border px-2.5 py-2 text-left text-[12.5px] transition-colors',
                        here ? 'border-brand bg-brand/[0.06] text-ink font-medium'
                             : 'border-ink/[0.1] bg-cream text-ink/70 hover:bg-sand',
                      ].join(' ')}
                    >
                      <span className={[
                        'w-4 h-4 rounded-[5px] border flex items-center justify-center text-[10px] shrink-0',
                        here ? 'bg-brand border-brand text-white' : 'border-ink/25',
                      ].join(' ')}>
                        {here ? '✓' : ''}
                      </span>
                      <span className="min-w-0 truncate">
                        {c.label}
                        {elsewhere && <span className="text-ink/35 text-[10px] ml-1">· {elsewhere}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Assigned-condition chips (always visible) ── */}
      <div className="mt-3 flex flex-col gap-2">
        {PILLS.map(p => {
          const codes = value.filter(f => f.severity === p.severity).map(f => f.condition);
          if (codes.length === 0) return null;
          return (
            <div key={p.severity} className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full border ${p.style}`}>{p.label}</span>
              {codes.map(code => (
                <span key={code} className="inline-flex items-center gap-1 text-[12px] bg-cream border border-ink/[0.12] rounded-full pl-2.5 pr-1 py-0.5 text-ink">
                  {labelFor(code)}
                  <button type="button" onClick={() => toggle(code, p.severity)} className="text-clay px-1" aria-label={`Remove ${labelFor(code)}`}>×</button>
                </span>
              ))}
            </div>
          );
        })}
        {value.length === 0 && (
          <p className="text-[11.5px] text-ink/35 italic">No conditions assigned yet — tap a pill above to add some.</p>
        )}
      </div>
    </div>
  );
}
