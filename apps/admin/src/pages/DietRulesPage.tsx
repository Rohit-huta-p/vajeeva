import { createPortal } from 'react-dom';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';

type Severity = 'caution' | 'avoid' | 'indication';
interface Effect { condition: string; severity: Severity }
interface Rule {
  _id: string; ingredient: string; match: string[]; effects: Effect[];
  enabled: boolean; excludedSlugs?: string[];
}
interface Condition { code: string; label: string }
interface Ingredient { name: string; count: number }
interface RecipeLite { slug: string; nameEn: string; ingredients?: { nameEn?: string }[] }
interface ApplyResult {
  committed: boolean; added: number; changed: number; removed: number;
  recipesAffected: number; recipesWithOverrides: number;
  details: { slug: string; nameEn: string; added: number; changed: number; removed: number }[];
}

const SEV_STYLE: Record<Severity, string> = {
  avoid:      'bg-clay-bg text-clay',
  caution:    'bg-amber-bg text-amber',
  indication: 'bg-brand-bg text-brand',
};
const SEVERITIES: Severity[] = ['avoid', 'caution', 'indication'];

const STARTER: Omit<Rule, '_id' | 'enabled'>[] = [
  { ingredient: 'Jaggery',        match: ['jaggery', 'gur', 'vellam'], effects: [{ condition: 'diabetes', severity: 'avoid' }, { condition: 'obesity', severity: 'caution' }] },
  { ingredient: 'Sugar',          match: ['sugar'],                    effects: [{ condition: 'diabetes', severity: 'avoid' }, { condition: 'obesity', severity: 'caution' }] },
  { ingredient: 'Honey',          match: ['honey'],                    effects: [{ condition: 'diabetes', severity: 'caution' }] },
  { ingredient: 'Dates',          match: ['dates', 'khajur'],          effects: [{ condition: 'diabetes', severity: 'caution' }] },
  { ingredient: 'Milk',           match: ['milk'],                     effects: [{ condition: 'lactose-intolerance', severity: 'avoid' }] },
  { ingredient: 'Ghee',           match: ['ghee'],                     effects: [{ condition: 'lactose-intolerance', severity: 'caution' }, { condition: 'cardiac', severity: 'caution' }] },
  { ingredient: 'Curd / Yogurt',  match: ['curd', 'yogurt', 'yoghurt'], effects: [{ condition: 'lactose-intolerance', severity: 'avoid' }] },
  { ingredient: 'Butter',         match: ['butter'],                   effects: [{ condition: 'lactose-intolerance', severity: 'caution' }, { condition: 'cardiac', severity: 'caution' }] },
  { ingredient: 'Salt',           match: ['salt'],                     effects: [{ condition: 'cardiac', severity: 'caution' }] },
  { ingredient: 'Nuts',           match: ['peanut', 'cashew', 'almond', 'walnut', 'pistachio'], effects: [{ condition: 'nut-allergy', severity: 'avoid' }] },
  { ingredient: 'Wheat',          match: ['wheat', 'maida', 'atta'],   effects: [{ condition: 'gluten', severity: 'avoid' }] },
  { ingredient: 'Amla',           match: ['amla', 'gooseberry'],       effects: [{ condition: 'diabetes', severity: 'indication' }] },
];

const norm = (s: string) => s.toLowerCase().trim();

export function DietRulesPage() {
  const [rules,       setRules]       = useState<Rule[]>([]);
  const [conditions,  setConditions]  = useState<Condition[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes,     setRecipes]     = useState<RecipeLite[]>([]);
  const [draft,       setDraft]       = useState<Draft | null>(null);
  const [apply,       setApply]       = useState<ApplyResult | null>(null);
  const [busy,        setBusy]        = useState(false);
  const [msg,         setMsg]         = useState<string | null>(null);

  const reload = () => api<Rule[]>('/api/admin/diet-rules').then(setRules).catch(() => {});
  useEffect(() => {
    reload();
    api<Record<string, { label: string; order?: number }>>('/api/admin/health-flags')
      .then(m => setConditions(
        Object.entries(m)
          .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0))
          .map(([code, s]) => ({ code, label: s.label })),
      ))
      .catch(() => {});
    api<Ingredient[]>('/api/admin/diet-rules/ingredients').then(setIngredients).catch(() => {});
    api<RecipeLite[]>('/api/admin/recipes').then(setRecipes).catch(() => {});
  }, []);

  const labelFor   = (code: string) => conditions.find(c => c.code === code)?.label ?? code;
  const ruledNames = useMemo(() => new Set(rules.map(r => r.ingredient.toLowerCase())), [rules]);

  const recipesFor = (match: string[]) => {
    const kws = match.map(norm).filter(Boolean);
    if (!kws.length) return [];
    return recipes.filter(r =>
      (r.ingredients ?? []).some(i => kws.some(k => norm(i.nameEn ?? '').includes(k))),
    );
  };

  /** Optimistic update a single rule in state (e.g. after toggling excludedSlugs). */
  const patchRule = (updated: Rule) =>
    setRules(rs => rs.map(r => r._id === updated._id ? updated : r));

  async function saveDraft() {
    if (!draft || !draft.ingredient.trim()) { setMsg('Ingredient name is required.'); return; }
    setBusy(true); setMsg(null);
    try {
      const body = {
        ingredient:    draft.ingredient.trim(),
        match:         draft.match,
        effects:       draft.effects,
        enabled:       true,
        excludedSlugs: draft.excludedSlugs ?? [],
      };
      if (draft._id) await api(`/api/admin/diet-rules/${draft._id}`, { method: 'PUT', body: JSON.stringify(body) });
      else           await api('/api/admin/diet-rules',               { method: 'POST', body: JSON.stringify(body) });
      setDraft(null); await reload();
      setMsg(`✓ ${body.ingredient} — rule saved. Apply to write it onto recipes.`);
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }

  async function remove(id: string) {
    await api(`/api/admin/diet-rules/${id}`, { method: 'DELETE' }).catch(() => {});
    reload();
  }

  async function suggest() {
    setBusy(true); setMsg(null);
    const known = new Set(conditions.map(c => c.code));
    const have  = new Set(rules.map(r => r.ingredient.toLowerCase()));
    let added = 0;
    for (const s of STARTER) {
      if (have.has(s.ingredient.toLowerCase())) continue;
      const effects = s.effects.filter(e => known.has(e.condition));
      if (!effects.length) continue;
      try {
        await api('/api/admin/diet-rules', { method: 'POST', body: JSON.stringify({ ...s, effects, enabled: true }) });
        added++;
      } catch { /* 409 exists / 400 bad — skip */ }
    }
    await reload();
    setMsg(added ? `Added ${added} starter rule${added === 1 ? '' : 's'}. Review, then Apply.` : 'No new starter rules to add.');
    setBusy(false);
  }

  async function runApply(commit: boolean) {
    setBusy(true); setMsg(null);
    try {
      const res = await api<ApplyResult>('/api/admin/diet-rules/apply', { method: 'POST', body: JSON.stringify({ commit }) });
      if (commit) { setApply(null); setMsg(`Applied — ${res.added} added, ${res.changed} changed, ${res.removed} removed across ${res.recipesAffected} recipes.`); }
      else setApply(res);
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="p-5 md:p-7">
      <div className="bg-brand-bg border border-brand/20 border-l-[3px] border-l-brand rounded-[10px] px-4 py-3 mb-5 text-[13px] text-ink/70 leading-relaxed">
        <strong className="font-semibold text-brand">Diet Rules</strong>{' '}
        Encode each ingredient's effect on a condition <em>once</em>. Every recipe — and every future recipe —
        inherits the flag from its ingredients. Hand edits in the Recipe Editor are kept as overrides.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-[13px] text-ink/55">{rules.length} rule{rules.length === 1 ? '' : 's'} · covering {ingredients.length} known ingredients</p>
        <div className="flex items-center gap-2.5">
          {msg && <span className="text-[12px] font-medium text-ink/70">{msg}</span>}
          <button type="button" onClick={suggest} disabled={busy}
            className="border border-ink/[0.15] rounded-[10px] px-3.5 py-2 text-[12.5px] font-semibold text-ink hover:bg-bone disabled:opacity-50">
            ✨ Suggest starter rules
          </button>
          <button type="button" onClick={() => runApply(false)} disabled={busy}
            className="bg-brand text-white rounded-[10px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-50 hover:opacity-90">
            Apply to recipes ▸
          </button>
        </div>
      </div>

      {/* Apply preview panel */}
      {apply && (
        <div className="bg-bone border border-ink/[0.14] rounded-[14px] p-5 mb-5">
          <p className="font-serif text-[16px] text-ink mb-3">Preview — nothing written yet</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] mb-3">
            <span><b className="text-brand tabular-nums">{apply.added}</b> flags to add</span>
            <span><b className="text-amber tabular-nums">{apply.changed}</b> changed</span>
            <span><b className="text-clay tabular-nums">{apply.removed}</b> removed</span>
            <span className="text-ink/55"><b className="tabular-nums">{apply.recipesAffected}</b> recipes affected</span>
            <span className="text-ink/55"><b className="tabular-nums">{apply.recipesWithOverrides}</b> with manual overrides — kept</span>
          </div>
          {apply.details.length > 0 && (
            <div className="max-h-[180px] overflow-y-auto text-[12.5px] text-ink/70 border-t border-ink/[0.1] pt-2.5 mb-3">
              {apply.details.map(d => (
                <div key={d.slug} className="flex justify-between py-0.5">
                  <span className="truncate pr-3">{d.nameEn}</span>
                  <span className="tabular-nums shrink-0 text-ink/45">+{d.added} ~{d.changed} −{d.removed}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => runApply(true)} disabled={busy}
              className="bg-brand text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-50">
              Apply {apply.added + apply.changed + apply.removed} changes
            </button>
            <button type="button" onClick={() => setApply(null)} className="px-3 py-2 text-[12.5px] text-ink/55 hover:bg-sand rounded-[9px]">Cancel</button>
          </div>
        </div>
      )}

      {/* Rules table */}
      <div className="overflow-x-auto rounded-[14px] border border-ink/[0.11]">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="bg-sand text-left text-[10.5px] font-[800] uppercase tracking-[0.07em] text-ink/45">
              <th className="px-4 py-3">Ingredient</th>
              <th className="px-4 py-3">Matches</th>
              <th className="px-4 py-3">Effects</th>
              <th className="px-4 py-3 text-right">Used in</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <Fragment key={r._id}>
                <tr className="border-t border-ink/[0.08]">
                  <td className="px-4 py-3 font-semibold text-[13.5px] text-ink">{r.ingredient}</td>
                  <td className="px-4 py-3 text-[12px] text-ink/50 font-mono">{r.match.join(' · ') || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.effects.length === 0
                        ? <span className="text-ink/35 text-[12px]">none</span>
                        : r.effects.map((e, i) => (
                          <span key={i} className={`text-[10px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full ${SEV_STYLE[e.severity]}`}>
                            {labelFor(e.condition)} · {e.severity}
                          </span>
                        ))}
                    </div>
                  </td>

                  {/* ── Recipe count cell → opens popover ── */}
                  <td className="px-4 py-3 text-right">
                    <RecipeCountCell
                      rule={r}
                      matching={recipesFor(r.match)}
                      onRuleChange={patchRule}
                    />
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button type="button" onClick={() => setDraft({ ...r })} className="text-[12px] text-brand hover:underline mr-3">Edit</button>
                    <button type="button" onClick={() => remove(r._id)} className="text-[12px] text-clay hover:underline">Remove</button>
                  </td>
                </tr>
                {draft?._id === r._id && (
                  <tr>
                    <td colSpan={5} className="p-0 bg-brand-bg/40 border-t border-brand/30">
                      <RuleEditor
                        draft={draft} conditions={conditions} ingredients={ingredients}
                        recipesFor={recipesFor} ruled={ruledNames}
                        onChange={setDraft} onSave={saveDraft}
                        onCancel={() => { setDraft(null); setMsg(null); }} busy={busy} inline
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-ink/45">
                  No rules yet — "Suggest starter rules" to begin, or add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!draft && (
        <button type="button"
          onClick={() => setDraft({ ingredient: '', match: [], effects: [], enabled: true })}
          className="mt-4 border-[2px] border-dashed border-ink/[0.18] rounded-[12px] w-full py-3 text-[13px] font-semibold text-ink/45 hover:border-brand hover:text-brand transition-colors">
          + Add rule
        </button>
      )}
      {draft && !draft._id && (
        <RuleEditor
          draft={draft} conditions={conditions} ingredients={ingredients}
          recipesFor={recipesFor} ruled={ruledNames}
          onChange={setDraft} onSave={saveDraft}
          onCancel={() => { setDraft(null); setMsg(null); }} busy={busy}
        />
      )}
    </div>
  );
}

// ── RecipeCountCell — "N recipes ▾" button + anchored popover ────────────────

function RecipeCountCell({
  rule, matching, onRuleChange,
}: {
  rule:         Rule;
  matching:     RecipeLite[];
  onRuleChange: (updated: Rule) => void;
}) {
  const [open,   setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });

  const excluded = new Set(rule.excludedSlugs ?? []);
  const count    = matching.length;

  const openPop = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    // Align right edge of popover with right edge of button; open below with 4px gap
    setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 300) });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !popRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function toggleExclude(slug: string) {
    const next = excluded.has(slug)
      ? (rule.excludedSlugs ?? []).filter(s => s !== slug)
      : [...(rule.excludedSlugs ?? []), slug];
    const updated: Rule = { ...rule, excludedSlugs: next };
    onRuleChange(updated); // optimistic
    setSaving(true); setErrMsg(null);
    try {
      await api(`/api/admin/diet-rules/${rule._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ingredient:    rule.ingredient,
          match:         rule.match,
          effects:       rule.effects,
          enabled:       rule.enabled,
          excludedSlugs: next,
        }),
      });
    } catch (e) {
      onRuleChange(rule); // revert
      setErrMsg((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (count === 0) {
    return <span className="text-[12.5px] text-ink/30 tabular-nums">0 recipes</span>;
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openPop}
        className="tabular-nums whitespace-nowrap text-[12.5px] text-ink/55 hover:text-brand transition-colors cursor-pointer"
      >
        {count} recipe{count !== 1 ? 's' : ''}{' '}
        <span className="text-[10px]">{open ? '▴' : '▾'}</span>
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-[300px] bg-cream border border-ink/[0.14] rounded-[12px] shadow-[0_8px_32px_rgba(42,37,30,.16)] overflow-hidden"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-ink/[0.08] flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink/45">
              {count} recipe{count !== 1 ? 's' : ''} · {rule.ingredient}
            </span>
            {saving && <span className="text-[10.5px] text-ink/40">Saving…</span>}
            {errMsg && <span className="text-[10.5px] text-clay truncate">⚠ {errMsg}</span>}
          </div>

          {/* Recipe list */}
          <div className="max-h-[280px] overflow-y-auto divide-y divide-ink/[0.06]">
            {matching.map(recipe => {
              const isExcluded = excluded.has(recipe.slug);
              return (
                <div
                  key={recipe.slug}
                  className={[
                    'flex items-center justify-between px-3.5 py-2.5',
                    isExcluded ? 'bg-clay/[0.03]' : '',
                  ].join(' ')}
                >
                  <div className="min-w-0 mr-3">
                    <p className={[
                      'text-[13px] font-medium truncate leading-tight',
                      isExcluded ? 'line-through text-ink/35' : 'text-ink',
                    ].join(' ')}>
                      {recipe.nameEn}
                    </p>
                    <p className="text-[10px] text-ink/30 font-mono truncate mt-0.5">{recipe.slug}</p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => toggleExclude(recipe.slug)}
                    className={[
                      'shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-0.5 transition-colors disabled:opacity-50',
                      isExcluded
                        ? 'bg-clay/10 text-clay hover:bg-clay/20'
                        : 'bg-ink/[0.06] text-ink/45 hover:bg-clay/10 hover:text-clay',
                    ].join(' ')}
                  >
                    {isExcluded ? '× Excluded' : 'Exclude'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-3.5 py-2 bg-sand/60 border-t border-ink/[0.07] text-[10.5px] text-ink/40 leading-snug">
            Excluded recipes are skipped when "Apply to recipes" runs.
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// ── Types + editor ────────────────────────────────────────────────────────────

interface Draft { _id?: string; ingredient: string; match: string[]; effects: Effect[]; enabled: boolean; excludedSlugs?: string[] }

function IngredientPicker({ value, ingredients, ruled, onPick }: {
  value: string; ingredients: Ingredient[]; ruled: Set<string>; onPick: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const query    = q.trim();
  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(query.toLowerCase())).slice(0, 60);
  const exact    = ingredients.some(i => i.name.toLowerCase() === query.toLowerCase());
  const inp      = 'w-full border border-ink/[0.15] rounded-[8px] px-2.5 py-[7px] bg-cream text-[13px] text-ink';
  const pick     = (name: string) => { onPick(name); setOpen(false); setQ(''); };

  return (
    <div className="relative">
      <input
        value={open ? q : value}
        placeholder="Select an ingredient…"
        onFocus={() => { setOpen(true); setQ(''); }}
        onChange={e => setQ(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 130)}
        className={inp}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-[240px] overflow-y-auto bg-cream border border-ink/[0.15] rounded-[9px] shadow-[0_8px_24px_rgba(42,37,30,.14)]">
          {filtered.length === 0 && !query && (
            <p className="px-3 py-2.5 text-[12.5px] text-ink/40">Start typing to search ingredients…</p>
          )}
          {/* Query matches 2+ variants → "Use as general keyword" option at top */}
          {query && filtered.length >= 2 && (
            <button type="button"
              onMouseDown={e => { e.preventDefault(); pick(query); }}
              className="flex items-center justify-between w-full px-3 py-2.5 text-left bg-brand/[0.06] border-b border-brand/20 hover:bg-brand/10">
              <span className="text-[13px] font-semibold text-brand">Use "{query}"</span>
              <span className="text-[11px] text-brand/70 tabular-nums shrink-0 ml-3">
                covers {filtered.length} variants ▸
              </span>
            </button>
          )}
          {filtered.map(i => {
            const done = ruled.has(i.name.toLowerCase());
            return (
              <button type="button" key={i.name}
                onMouseDown={e => { e.preventDefault(); pick(i.name); }}
                className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-bone text-[13px]">
                <span className={done ? 'text-ink/50' : 'text-ink'}>{i.name}</span>
                <span className="text-[11px] text-ink/40 tabular-nums shrink-0 ml-3">
                  {done && <span className="text-brand font-semibold mr-2">✓ ruled</span>}in {i.count}
                </span>
              </button>
            );
          })}
          {/* Only show "not in any recipe yet" when nothing at all matched */}
          {query && !exact && filtered.length === 0 && (
            <button type="button"
              onMouseDown={e => { e.preventDefault(); pick(query); }}
              className="flex w-full px-3 py-2 text-left hover:bg-bone text-[13px] text-ink/70 border-t border-ink/[0.08]">
              Use "{query}" — not in any recipe yet
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RuleEditor({ draft, conditions, ingredients, recipesFor, ruled, onChange, onSave, onCancel, busy, inline }: {
  draft: Draft; conditions: Condition[]; ingredients: Ingredient[];
  recipesFor: (m: string[]) => RecipeLite[]; ruled: Set<string>;
  onChange: (d: Draft) => void; onSave: () => void; onCancel: () => void; busy: boolean; inline?: boolean;
}) {
  const [kw, setKw] = useState('');
  const usedIn     = useMemo(() => ingredients.find(i => i.name.toLowerCase() === draft.ingredient.toLowerCase())?.count, [ingredients, draft.ingredient]);
  const willFlag   = recipesFor(draft.match).length;
  // Ingredient name variants in the recipe DB that the current match keywords cover
  const matchedVars = useMemo(() => {
    const kws = draft.match.map(norm).filter(Boolean);
    if (!kws.length) return [];
    return ingredients.filter(i => kws.some(k => i.name.toLowerCase().includes(k)));
  }, [draft.match, ingredients]);
  const inp = 'border border-ink/[0.15] rounded-[8px] px-2.5 py-[7px] bg-cream text-[13px] text-ink';

  const setIngredient = (v: string) => {
    const match = draft.match.length ? draft.match : (v.trim() ? [v.toLowerCase().trim()] : []);
    onChange({ ...draft, ingredient: v, match });
  };
  const addKw    = () => { const k = kw.toLowerCase().trim(); if (k && !draft.match.includes(k)) onChange({ ...draft, match: [...draft.match, k] }); setKw(''); };
  const addEffect = () => onChange({ ...draft, effects: [...draft.effects, { condition: conditions[0]?.code ?? '', severity: 'avoid' }] });
  const setEffect = (i: number, patch: Partial<Effect>) => onChange({ ...draft, effects: draft.effects.map((e, j) => j === i ? { ...e, ...patch } : e) });

  return (
    <div className={`${inline ? 'm-3' : 'mt-4'} bg-bone border-[2px] border-brand rounded-[14px] p-5`}>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 mb-1.5">Ingredient</label>
          <IngredientPicker value={draft.ingredient} ingredients={ingredients} ruled={ruled} onPick={setIngredient} />
          {usedIn != null && <p className="text-[11.5px] text-ink/45 mt-1">This name appears in <b className="text-ink/70 tabular-nums">{usedIn}</b> recipes.</p>}
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 mb-1.5">Also match (keywords)</label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {draft.match.map(m => (
              <span key={m} className="text-[11px] font-mono bg-cream border border-ink/[0.12] rounded-full pl-2.5 pr-1 py-0.5 flex items-center gap-1">
                {m}<button type="button" onClick={() => onChange({ ...draft, match: draft.match.filter(x => x !== m) })} className="text-clay px-1">×</button>
              </span>
            ))}
            <input value={kw} onChange={e => setKw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKw(); } }}
              placeholder="+ keyword" className={`${inp} w-[110px] py-1`} />
          </div>

          {/* Live preview — which ingredient names in the recipe DB are covered */}
          {matchedVars.length > 0 && (
            <div className="mt-2 px-3 py-2 bg-brand/[0.05] border border-brand/[0.15] rounded-[9px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand/60 mb-1.5">
                Covers {matchedVars.length} ingredient variant{matchedVars.length !== 1 ? 's' : ''} in your recipes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchedVars.map(v => (
                  <span key={v.name} className="inline-flex items-center gap-1 text-[11px] bg-cream border border-ink/[0.12] rounded-full pl-2.5 pr-2 py-0.5">
                    <span className="text-ink/70">{v.name}</span>
                    <span className="text-ink/35 tabular-nums">· {v.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-ink/45 mb-1.5">Effects</label>
      <div className="flex flex-col gap-2 mb-3">
        {draft.effects.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={e.condition} onChange={ev => setEffect(i, { condition: ev.target.value })} className={`${inp} flex-1`}>
              {conditions.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <select value={e.severity} onChange={ev => setEffect(i, { severity: ev.target.value as Severity })} className={inp}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" onClick={() => onChange({ ...draft, effects: draft.effects.filter((_, j) => j !== i) })} className="text-clay px-2">×</button>
          </div>
        ))}
        <button type="button" onClick={addEffect} disabled={!conditions.length}
          className="self-start text-[12.5px] text-brand hover:underline disabled:opacity-40">+ add condition</button>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-ink/[0.1]">
        <p className="text-[12.5px] text-ink/55">Will flag <b className="text-ink tabular-nums">{willFlag}</b> recipe{willFlag === 1 ? '' : 's'} on next Apply.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 text-[12.5px] text-ink/55 hover:bg-sand rounded-[9px]">Cancel</button>
          <button type="button" onClick={onSave} disabled={busy} className="bg-brand text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-50">Save rule</button>
        </div>
      </div>
    </div>
  );
}
